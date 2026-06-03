# 场景插件：独立配置、隔离安装与启动进度（补充方案）

本文是 `scenario-plugin-packages.md` 的**推荐主路径**补充，约定：

1. **主配置 `openocta.json` 仅存插件元信息**；业务配置、MCP 片段、前端资源均在**插件目录**内读写。
2. **清单声明的 Skill / 员工自动安装**到插件专属目录；**启动时加载**；**卸载时整包删除**（含配置与 env）。
3. **专用插件配置 API**，与核心 `config.get` / `config.patch` **不混用**。
4. **安装与启动**展示分步进度（下载、解压、环境初始化等）。

插件**无需 Go 代码**；iframe 通过插件配置 API 读写 `map`，自行转成 TS 类型。

---

## 一、双配置模型：主配置 vs 插件配置

### 1.1 原则

| 文件 | 路径 | 内容 |
|------|------|------|
| **主配置** | `~/.openocta/openocta.json` | 仅 `scenarios` **注册表**（id、版本、路径、enabled、activeId） |
| **插件配置** | `<dataPath>/config.json` | 插件业务 JSON（连接、UI 状态等），**与主配置分离** |
| **插件清单** | `<installPath>/openocta-plugin.yaml` | 只读，随 zip 发布 |
| **插件运行时清单** | `<dataPath>/runtime.json` | 安装器写入：已装 skill/employee/mcp 映射、env 路径等 |

主配置**不承载**插件业务字段，避免与核心 `mcp` / `skills` 全局配置缠在一起；插件 iframe **禁止**调用 `config.patch` 改 `openocta.json`。

### 1.2 主配置 `openocta.json` 中的插件元信息

```json
{
  "scenarios": {
    "activeId": "openocta-db",
    "installed": {
      "openocta-db": {
        "version": "1.0.0",
        "enabled": true,
        "installPath": "/Users/me/.openocta/scenarios/openocta-db/1.0.0",
        "dataPath": "/Users/me/.openocta/scenario-data/openocta-db",
        "installedAt": "2026-06-01T10:00:00Z",
        "lastBootstrapAt": "2026-06-01T10:05:00Z"
      }
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `installPath` | 包内只读资源：`openocta-plugin.yaml`、`ui/dist/`、`setup/` |
| `dataPath` | 可读写数据：插件 `config.json`、专属 skills/employees、mcp 片段、runtime-env |
| `enabled` | 是否在启动时参与加载 |
| `activeId` | 当前用于 iframe 视图的场景（可空） |

安装完成后，核心根据 `installPath` 加载清单与静态页；根据 `dataPath` 加载/保存插件配置及附属资源。

### 1.3 目录布局（安装后）

```text
~/.openocta/
├── openocta.json                          # 仅 scenarios 元信息 + 全局 mcp/skills（非插件专属部分）
├── scenarios/                             # 插件包（版本化，只读为主）
│   └── openocta-db/
│       └── 1.0.0/
│           ├── openocta-plugin.yaml
│           ├── ui/dist/index.html
│           └── setup/*.py
└── scenario-data/                         # 插件数据根（可写，卸载整目录删除）
    └── openocta-db/
        ├── config.json                    # 插件业务配置（专用 API 读写）
        ├── runtime.json                   # 安装产物索引（见 1.4）
        ├── mcp.json                       # 本插件 MCP 片段（合并进运行时，不写回主配置）
        ├── skills/                        # 本插件从官网安装的 skills
        │   └── mysql-dba/SKILL.md
        ├── employees/                     # 本插件从官网安装的数字员工
        │   └── <localId>/manifest.json
        └── runtime-env/                   # 隔离 node/python/bin
            ├── bin/
            ├── node_modules/
            └── venv/
```

### 1.4 `runtime.json`（安装器维护，供启动/卸载）

```json
{
  "pluginId": "openocta-db",
  "version": "1.0.0",
  "remote": {
    "skills": [{ "remoteId": "mysql-dba", "localFolder": "mysql-dba" }],
    "employees": [{ "remoteId": "42", "localId": "dba-assistant" }],
    "mcps": [{ "remoteId": "15", "serverKey": "openocta-db-site-mcp" }]
  },
  "localMcps": [{ "serverKey": "openocta-db-mysql-mcp", "package": "@openocta/mcp-mysql@1.2.0" }],
  "setup": [{ "id": "mysql-client", "status": "ok" }],
  "runtimeEnvPath": "runtime-env"
}
```

- **启动**：读 `runtime.json` → 把 `dataPath/skills` 加入 Skill loader 路径；读 `mcp.json` 合并到**内存** MCP 表（键带 `openocta-db:` 前缀）；注册 `employees/` 下员工。
- **卸载**：按 `runtime.json` 删除 `dataPath` 整树；从主配置 `scenarios.installed` 移除该项；**不**在全局 `~/.openocta/skills` 留残留（插件 skill 只装在 `scenario-data/<id>/skills`）。

### 1.5 加载插件信息与前端

| 时机 | 行为 |
|------|------|
| 安装完成 | 解析 `installPath/openocta-plugin.yaml`，写入主配置元信息，创建 `dataPath` |
| 用户打开场景工作区 | iframe `src` = `/api/v1/scenarios/<id>/view/` → 映射到 `installPath/ui/dist/` |
| 插件改配置 | 只调 **插件配置 API**，写 `dataPath/config.json` |
| 插件改 MCP（若允许） | 写 `dataPath/mcp.json`，触发「重载本插件 MCP」；**不**改主 `openocta.json` 的 `mcp.servers` |

---

## 二、专用插件配置 API（与核心 config 分离）

### 2.1 设计原则

- **禁止**插件 UI 使用 `config.get` / `config.patch` / `GET /api/config` 读写业务数据。
- 核心 OpenOcta 配置 UI 仍用现有 config API；插件配置走独立前缀与文件。

### 2.2 HTTP API

前缀：`/api/v1/scenarios/:pluginId/config`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 返回完整 `config.json` + `hash`（文件 mtime 或内容哈希） |
| GET | `/subtree` | Query: `path=a.b.c` 或 `path[]=a&path[]=b`，返回子树 `value` |
| PUT | `/` | 整文件替换，body `{ "config": {...}, "baseHash": "..." }` |
| PATCH | `/` | 嵌套 patch 合并（语义同 `config.patch` 的 merge） |
| POST | `/path` | 单路径写入 `{ "path": ["uiState","tab"], "value": "x", "baseHash" }` |
| DELETE | `/path` | 删除路径，`value: null` 或专用 DELETE body |
| GET | `/schema` | 可选：返回 manifest 中 `configSchema`（JSON Schema） |

Gateway 方法（供 iframe SDK）：`scenario.config.get` / `scenario.config.patch` 等，参数含 `pluginId`。

### 2.3 响应形态（标准 map）

```json
{
  "ok": true,
  "pluginId": "openocta-db",
  "path": "/Users/me/.openocta/scenario-data/openocta-db/config.json",
  "hash": "sha256:...",
  "config": {
    "instances": [{ "id": "local", "host": "127.0.0.1", "port": 3306 }]
  }
}
```

Go 侧仅 `map[string]interface{}` + `json.RawMessage`，**无插件业务 struct**。

### 2.4 插件前端 SDK 示例

```ts
const PLUGIN_ID = "openocta-db";

export async function pluginConfigGet<T>(): Promise<{ data: T; hash: string }> {
  const res = await fetch(`/api/v1/scenarios/${PLUGIN_ID}/config`, { headers: auth() });
  const body = await res.json();
  return { data: body.config as T, hash: body.hash };
}

export async function pluginConfigPatchPath(
  path: string[],
  value: unknown,
  baseHash: string,
) {
  await fetch(`/api/v1/scenarios/${PLUGIN_ID}/config/path`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ path, value, baseHash }),
  });
}
```

### 2.5 与主配置的唯一交叉点

仅以下字段留在 `openocta.json` 的 `scenarios` 下，且**只由核心安装/卸载/激活 API 修改**，插件 UI 不可 patch：

- `installed.<id>.*` 元信息
- `activeId`
- `enabled`

用户若在「全局配置」页编辑，也只展示 scenarios 注册表，不展开 `config.json` 内容。

### 2.6 有副作用的操作

| 场景 | API / 机制 |
|------|------------|
| 页面状态、业务 JSON | **插件配置 API** → `dataPath/config.json` |
| 执行 SQL、外部 API | 插件 **MCP**（`dataPath/mcp.json` + runtime-env） |
| 安装 mysql 等 | **setup 脚本**（安装阶段，见第四节） |

---

## 三、清单驱动安装与启动加载

### 3.1 插件 zip 内容（瘦身）

```text
openocta-db-1.0.0.zip
└── openocta-db/
    ├── openocta-plugin.yaml
    ├── ui/dist/
    └── setup/
```

**不打包** Skill / 员工 / MCP；安装时按 manifest **自动从官网拉取**，落盘到 `scenario-data/<id>/`，**不**写入全局 `~/.openocta/skills`（除非用户另有全局技能）。

### 3.2 清单示例（含自动安装声明）

```yaml
apiVersion: openocta.dev/v1
kind: ScenarioPack
id: openocta-db
version: 1.0.0

remote:
  employees:
    - remoteId: "42"
      installTo: employees          # 相对 dataPath
  skills:
    - remoteId: "mysql-dba"
      installTo: skills
  mcps:
    - remoteId: "15"
      serverKey: openocta-db-site-mcp

localMcps:
  - serverKey: openocta-db-mysql-mcp
    install: { kind: npm, package: "@openocta/mcp-mysql@1.2.0" }
    run: { command: npx, args: ["-y", "@openocta/mcp-mysql"] }

runtimeEnv:
  subdir: runtime-env               # 相对 dataPath

setup:
  - id: mysql-client
    script: setup/install_mysql_client.py
  - id: playwright-chrome
    script: setup/install_chrome.py

configDefaults:                     # 首次安装写入 config.json
  instances: []

views:
  - id: main
    path: ui/dist/index.html
    type: static
    default: true
```

### 3.3 安装流水线 `POST /api/v1/scenarios/:id/install`

各步骤写入 **进度流**（见第四节）；完成后更新主配置 `scenarios.installed` 与 `dataPath/runtime.json`。

| 步骤 ID | 说明 | 落盘位置 |
|---------|------|----------|
| `compat` | OS/arch/版本检查 | — |
| `download` | 拉取场景 zip（官网） | `scenarios/<id>/<version>/` |
| `extract` | 解压插件包 | `installPath` |
| `data_dir` | 创建 `scenario-data/<id>/`，初始化 `config.json` | `dataPath` |
| `employee.*` | 官网 install，解压到插件目录 | `dataPath/employees/<localId>/` |
| `skill.*` | 官网 install，解压到插件目录 | `dataPath/skills/<folder>/` |
| `mcp.remote.*` | 官网 zip → 合并进 | `dataPath/mcp.json` |
| `mcp.local.*` | npm/uv 在 `runtime-env` 安装 | `dataPath/runtime-env/` + `mcp.json` |
| `env.init` | 创建 venv / node_modules 目录 | `runtime-env/` |
| `setup.*` | 执行 setup 脚本 | `runtime-env/bin/` 等 |
| `register` | 写 `openocta.json` 元信息 + `runtime.json` | 主配置 |

官网安装实现：复用 `POST /api/v1/install`，扩展参数 `targetDir: "<dataPath>/skills"`（或安装后 **移动** 到插件目录），避免污染全局路径。

### 3.4 OpenOcta 启动时加载已安装插件

Gateway 启动流程中增加 **`scenario.Loader`**（在 Agent/MCP 初始化之前或并行）：

```text
1. 读 openocta.json → scenarios.installed
2. 对每个 enabled 插件（可并行，进度上报）：
   a. 校验 installPath / dataPath 存在
   b. 读 openocta-plugin.yaml + runtime.json
   c. Skills：将 dataPath/skills 注册到 loader（extraDirs，来源标记 pluginId）
   d. Employees：扫描 dataPath/employees，并入员工注册表
   e. MCP：读 dataPath/mcp.json，合并到运行时 MCP 表（键前缀 openocta-db:）
   f. runtime-env：注入子进程 PATH（仅启动该插件相关 MCP 时）
3. 标记 scenarios.loadState = ready | partial | failed
```

- **与主配置关系**：全局 `openocta.json` 里的 `mcp.servers` / `skills.load.extraDirs` 仍为「核心/用户手动」配置；插件 MCP **仅内存合并**或仅读 `dataPath/mcp.json`，卸载插件后主配置无残留。
- **失败策略**：单插件加载失败不阻塞 Gateway；`loadState` 记录错误，UI 可提示「重新安装 / 修复」。

### 3.5 卸载 `DELETE /api/v1/scenarios/:id`

**原子清理**（顺序建议）：

1. 若 `activeId === id`，清空 `activeId`
2. 停止该插件相关 MCP 子进程
3. 从运行时注销 skills / employees / MCP 合并项
4. **删除** `dataPath` 整个目录（config、skills、employees、mcp.json、runtime-env）
5. **删除** `installPath` 父版本目录（或保留多版本只删当前）
6. 从 `openocta.json` `scenarios.installed` 移除该项
7. 删除 `.install-metadata.json` 中关联记录（若有）

用户界面：二次确认「将删除该插件的全部配置与下载内容」。

### 3.6 setup 脚本与 runtime-env

```bash
python3 <installPath>/setup/install_mysql_client.py \
  --target-dir <dataPath>/runtime-env/bin \
  --os darwin --arch arm64
```

stdout JSON：`{ "ok": true, "installed": [...], "messages": [...] }`  
MCP 启动：`PATH=<dataPath>/runtime-env/bin:...`。

---

## 四、安装与启动进度

### 4.1 目标

- 用户安装插件、**重启 OpenOcta** 时，界面展示**分步进度**（非黑盒等待）。
- 支持**下载百分比**、当前步骤名称、失败步骤与重试。

### 4.2 任务模型

每次 install 或 startup-load 创建 **Job**：

```json
{
  "jobId": "uuid",
  "type": "install | startup_load",
  "pluginId": "openocta-db",
  "status": "running | succeeded | failed | cancelled",
  "progress": 0.65,
  "currentStep": "skill.mysql-dba",
  "steps": [
    {
      "id": "download",
      "label": "下载场景包",
      "status": "done",
      "percent": 100,
      "detail": "12.4 MB / 12.4 MB"
    },
    {
      "id": "skill.mysql-dba",
      "label": "安装技能 mysql-dba",
      "status": "running",
      "percent": 40,
      "detail": "从官网拉取..."
    },
    {
      "id": "env.init",
      "label": "初始化运行环境",
      "status": "pending"
    }
  ],
  "logs": ["[10:00:01] compat ok", "[10:00:05] downloading..."],
  "error": null
}
```

### 4.3 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/scenarios/jobs/:jobId` | 轮询任务状态 |
| GET | `/api/v1/scenarios/jobs/active` | 当前进行中的 install/load |
| POST | `/api/v1/scenarios/:id/install` |  body 可含 `{ "resume": true }`；返回 `{ "jobId" }` |
| WS / SSE | `/api/v1/scenarios/jobs/:jobId/stream` | 推送 `progress` / `step` / `log` 事件 |

Gateway 事件（供桌面壳 / Control UI）：

```json
{
  "type": "scenario.job.progress",
  "jobId": "...",
  "pluginId": "openocta-db",
  "progress": 0.42,
  "currentStep": "download",
  "detail": "5.2 MB / 12.4 MB"
}
```

### 4.4 UI 展示建议

| 场景 | UI |
|------|-----|
| 市场点击「安装」 | 全屏或抽屉：**步骤列表 + 总进度条** + 可折叠日志 |
| 应用启动 | 启动页 / Splash：**「正在加载场景插件 (2/5)」**；失败插件显示警告条，不阻塞进主界面 |
| 安装失败 | 标红失败步骤，按钮「重试本步」「重试全部」「取消」 |

下载进度：HTTP 下载回调更新 `steps[download].percent`；大文件分块写入时刷新 `detail`。

### 4.5 与启动加载的关系

- **冷启动**：`type: startup_load`，步骤为 `plugin.openocta-db.load` 等，通常较快，仍显示以免用户以为卡死。
- **安装后首次启动**：先结束 install job，再触发一次 `startup_load` 或 install 末步直接完成 load。

---

## 五、核心待实现清单

| 项 | 状态 |
|----|------|
| 主配置仅 `scenarios.installed` 元信息 | **待加** schema |
| `dataPath/config.json` + 专用 config API | **待加** |
| 官网 skill/employee 安装到 `scenario-data/<id>/` | **待加**（扩展 site_install targetDir） |
| 启动时 `scenario.Loader` | **待加** |
| 卸载原子删除 | **待加** |
| install / startup Job + 进度 WS | **待加** |
| iframe 静态资源 + 插件 config SDK | **待加** |
| 核心 `config.get/patch` | **已有**（插件不用） |

---

## 六、相关文档

- [`scenario-pack-authoring.md`](scenario-pack-authoring.md) — **插件编写规范**（作者向）
- `scenario-plugin-packages.md` — 总体架构与市场/视图
- `configuration.md` — **主**配置 `openocta.json`
- `mcp-configuration.md` — 全局 MCP（与插件 `mcp.json` 区分）
- `skills.md` — 全局 Skill 路径（与插件 `dataPath/skills` 区分）
