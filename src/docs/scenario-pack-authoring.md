# 场景插件包编写规范

本文面向**插件作者**，说明如何从零创建一个 OpenOcta 场景插件包（Scenario Pack），例如 `openocta-db`、`openocta-test`。  
无需向 OpenOcta 主仓库提交 Go 代码；交付物为 **zip + 清单 + 前端静态页 + 可选安装脚本**。

**架构背景**（实现细节）见：

- [scenario-plugin-packages.md](scenario-plugin-packages.md) — 总体架构
- [scenario-plugin-config-and-bootstrap.md](scenario-plugin-config-and-bootstrap.md) — 独立配置、安装、进度

---

## 一、你需要交付什么

| 交付物 | 是否必填 | 说明 |
|--------|----------|------|
| `openocta-plugin.yaml` | 必填 | 插件清单（id、版本、依赖、视图入口） |
| `ui/dist/` | 必填 | 内置页面（iframe 加载），至少含 `index.html` |
| `README.md` | 建议 | 市场展示说明（可同步到官网） |
| `setup/*.py` 或 shell | 可选 | 安装 mysql 客户端、浏览器等 |
| Skill / 员工 / MCP 源码 | **不要打进 zip** | 在清单里用 **官网 remoteId** 声明，安装时自动拉取 |

**不要包含**：Go 插件、修改用户主配置 `openocta.json` 的业务字段、向 OpenOcta 核心提 PR 才能用的私有 API。

---

## 二、快速开始（10 分钟清单）

1. 新建仓库，例如 `openocta-db`。
2. 复制 [附录 A：最小模板](#附录-a最小仓库模板) 目录结构。
3. 修改 `openocta-plugin.yaml` 中的 `id`、`displayName`、`version`。
4. 在 `ui/` 下用任意前端工具链构建到 `ui/dist/`（见 [第五节](#五前端页面ui)）。
5. 本地打 zip：`openocta-db-0.1.0.zip`，根目录为插件 id 文件夹（见 [第八节](#八打包与发布)）。
6. 在 OpenOcta **场景市场**安装，或在实现完成后通过 `POST /api/v1/scenarios/{id}/install` 调试。
7. 打开 **场景工作区**，选择你的插件，确认 iframe 与配置读写正常。

---

## 三、插件 id 与命名规范

| 规则 | 示例 |
|------|------|
| 全局唯一、小写、kebab-case | `openocta-db`、`openocta-test` |
| 建议前缀 `openocta-` + 场景缩写 | 避免与官网 skill folder 冲突 |
| 与 zip 根目录名一致 | zip 内为 `openocta-db/...` |
| `version` 遵循语义化版本 | `1.0.0`、`1.0.1-beta.1` |

`displayName`：面向用户的中文/英文名称（市场卡片标题）。  
`description`：一两句话说明场景能力（市场副标题）。

---

## 四、仓库目录结构（作者侧）

开发时仓库建议布局：

```text
openocta-db/
├── openocta-plugin.yaml       # 清单（必填）
├── README.md                  # 市场说明（建议）
├── ui/
│   ├── package.json           # 前端工程（可选）
│   ├── src/
│   └── dist/                  # 构建产物（必填，提交或 CI 生成）
│       ├── index.html
│       └── assets/
└── setup/                     # 安装脚本（可选）
    ├── install_mysql_client.py
    └── install_chrome.py
```

**不要**在仓库里放：

- `skills/`、`employees/` 完整拷贝（改用 manifest `remote`）
- 用户机器上的 `config.json`（运行时生成在 `~/.openocta/scenario-data/<id>/`）

---

## 五、清单文件 `openocta-plugin.yaml`

### 5.1 完整示例

```yaml
apiVersion: openocta.dev/v1
kind: ScenarioPack

# --- 身份 ---
id: openocta-db
version: 1.0.0
displayName: OpenOcta 数据库场景
description: MySQL / PostgreSQL 运维与 SQL 辅助
publisher: your-org-or-name
homepage: https://github.com/your-org/openocta-db

# --- 运行环境要求（安装前检查）---
compatibility:
  os: [darwin, linux, windows]
  arch: [amd64, arm64]
  minOpenOctaVersion: "0.2.0"

# --- 可选：安装前检查本机是否已有二进制 ---
requires:
  bins:
    - name: mysql-client
      anyOf: [mysql, mariadb]
      optional: true          # true = 仅提示，不阻断安装（可由 setup 补齐）

# --- 从 OpenOcta 官网自动安装（zip 内不打包）---
remote:
  employees:
    - remoteId: "42"                    # 员工市场数字 ID
  skills:
    - remoteId: "mysql-dba"             # 技能库 folder
  mcps:
    - remoteId: "15"                    # 工具库 MCP ID
      serverKey: openocta-db-site-mcp   # 可选，写入 mcp.json 的键名

# --- 本地 MCP：npm / pypi 安装到插件隔离环境 ---
localMcps:
  - serverKey: openocta-db-mysql-mcp
    install:
      kind: npm                       # npm | pypi | go
      package: "@your-scope/mcp-mysql@1.2.0"
    run:
      command: npx
      args: ["-y", "@your-scope/mcp-mysql"]
      env:
        MYSQL_HOST: "$MYSQL_HOST"

# --- 隔离运行环境目录名（相对用户 dataPath）---
runtimeEnv:
  subdir: runtime-env

# --- 一键安装脚本（在 installPath/setup/ 下）---
setup:
  - id: mysql-client
    script: setup/install_mysql_client.py
    platforms: [darwin, linux, windows]
  - id: playwright-chrome
    script: setup/install_chrome.py
    platforms: [darwin, linux]

# --- 首次安装时写入插件 config.json 的默认值 ---
configDefaults:
  instances: []
  uiState:
    selectedId: null

# --- 可选：供设置页 / IDE 提示用的 JSON Schema ---
configSchema:
  type: object
  properties:
    instances:
      type: array
      items:
        type: object
        required: [id, host, port]
        properties:
          id: { type: string }
          host: { type: string }
          port: { type: integer }

# --- 视图（首期仅第一个 default: true 生效）---
views:
  - id: main
    label: 数据库工作台
    path: ui/dist/index.html
    type: static
    default: true
```

### 5.2 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `apiVersion` | 是 | 固定 `openocta.dev/v1` |
| `kind` | 是 | 固定 `ScenarioPack` |
| `id` | 是 | 插件唯一标识 |
| `version` | 是 | 语义化版本，与 zip 文件名一致 |
| `compatibility.os` | 是 | `darwin` / `linux` / `windows` |
| `compatibility.arch` | 是 | `amd64` / `arm64` |
| `remote.*.remoteId` | 否 | 官网资源 ID，安装时自动下载 |
| `localMcps` | 否 | 在用户 `scenario-data/<id>/runtime-env` 内 npm/pip 安装 |
| `setup` | 否 | 相对 `installPath` 的脚本路径，禁止 `..` |
| `configDefaults` | 建议 | 首次安装生成 `config.json` |
| `views` | 是 | 至少一条，`default: true` 一条 |

### 5.3 如何查官网 remoteId

在 OpenOcta 控制台：

- **员工市场**：详情 URL 或安装接口中的数字 `id`
- **技能库**：列表中的 `folder` 字段
- **工具库（MCP）**：详情中的数字 `id`

发布到官网前，请确认这些 ID 在目标环境可访问；私有部署需配置 Site API 基址。

---

## 六、前端页面（ui）

### 6.1 运行方式

用户通过 **场景工作区**（`/scenarios/workspace`）用 iframe 加载：

```http
GET /api/v1/scenarios/{pluginId}/view/index.html
```

页面与 Gateway **同源**，可直接 `fetch` 插件 API（需带 Gateway Token，见下）。

### 6.2 样式建议

- 插件 UI **独立样式**，不依赖 OpenOcta 主站打包的 CSS 文件。
- 若希望视觉接近主站，可自行复制色板（`--bg`、`--accent` 等），**不要**引用主站 `/assets/*.css`（路径随版本变化）。
- 布局保持简洁，适配 iframe 宽度（建议 min-width 320px，主内容 max-width 1200px）。

### 6.3 读写配置（必须用插件 API）

**禁止**调用主配置接口：

- `config.get` / `config.patch`
- `GET /api/config`、`POST /api/config/patch`

**必须**使用插件配置 API（`{pluginId}` 与 manifest `id` 一致）：

```ts
const PLUGIN_ID = "openocta-db";

function authHeaders(): HeadersInit {
  const token = window.__OPENOCTA_SCENARIO__?.token
    ?? localStorage.getItem("gatewayToken")
    ?? "";
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function loadConfig<T>(): Promise<{ data: T; hash: string }> {
  const res = await fetch(`/api/v1/scenarios/${PLUGIN_ID}/config`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  const body = await res.json();
  return { data: (body.config ?? {}) as T, hash: body.hash };
}

export async function saveConfigPath(
  path: string[],
  value: unknown,
  baseHash: string,
): Promise<void> {
  const res = await fetch(`/api/v1/scenarios/${PLUGIN_ID}/config/path`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ path, value, baseHash }),
  });
  if (!res.ok) throw new Error(await res.text());
}

// 或整段 patch
export async function patchConfig(
  patch: Record<string, unknown>,
  baseHash: string,
): Promise<void> {
  const res = await fetch(`/api/v1/scenarios/${PLUGIN_ID}/config`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ patch, baseHash }),
  });
  if (!res.ok) throw new Error(await res.text());
}
```

TypeScript 类型在**插件仓库内**自行定义，例如：

```ts
export interface PluginConfig {
  instances: Array<{ id: string; host: string; port: number }>;
  uiState?: { selectedId: string | null };
}
```

### 6.4 有副作用的操作

| 需求 | 做法 |
|------|------|
| 保存连接、UI 状态 | 插件 config API |
| 执行 SQL、调云 API | 通过 manifest 声明的 **MCP**，由 Agent 或页面间接调用 |
| 不要 | 在 iframe 内直连未文档化的内部 API |

### 6.5 构建要求

- 入口：`ui/dist/index.html`
- 资源使用**相对路径**（`./assets/...`），避免绝对路径 `/assets` 在 iframe 下 404
- 生产构建关闭 `sourceMap` 或勿提交 map 以减小 zip 体积（建议 zip &lt; 20MB）

---

## 七、安装脚本（setup）

### 7.1 何时需要

- 需要安装**系统级或大型二进制**：mysql 客户端、Playwright Chromium、自定义 CLI
- 官网 Skill 的 `requires.bins` 无法满足（需固定版本或离线包）

### 7.2 脚本约定

- 路径：必须在 `setup/` 下，且与 manifest `setup[].script` 一致
- 语言：推荐 Python 3（`#!/usr/bin/env python3`），或 POSIX shell
- 参数（由 OpenOcta 传入）：

```text
--target-dir <dataPath>/runtime-env/bin
--os darwin|linux|windows
--arch amd64|arm64
--data-dir <dataPath>
```

- 退出码：`0` 成功，非 `0` 失败
- 标准输出：最后一行建议为 JSON，便于 UI 展示

```json
{
  "ok": true,
  "installed": ["mysql-client"],
  "skipped": [],
  "messages": ["已安装到 runtime-env/bin"]
}
```

### 7.3 示例骨架（Python）

```python
#!/usr/bin/env python3
import argparse, json, sys, shutil, subprocess

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--target-dir", required=True)
    p.add_argument("--os", required=True)
    p.add_argument("--arch", required=True)
    p.add_argument("--data-dir", required=True)
    args = p.parse_args()

    if shutil.which("mysql"):
        print(json.dumps({"ok": True, "installed": [], "skipped": ["mysql-client"], "messages": ["already in PATH"]}))
        return

    # TODO: 按 os/arch 下载或调用 brew/apt/choco
    # ...

    print(json.dumps({"ok": True, "installed": ["mysql-client"], "skipped": [], "messages": []}))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"ok": False, "installed": [], "skipped": [], "messages": [str(e)]}))
        sys.exit(1)
```

### 7.4 安全

- 不要从不可信 URL 下载可执行文件；使用官方源或校验 SHA256
- 不要读写 `dataPath` 以外的用户目录
- 不要使用 `sudo`（OpenOcta 不会提权）

---

## 八、打包与发布

### 8.1 zip 结构

```text
openocta-db-1.0.0.zip
└── openocta-db/              # 必须与 manifest id 一致
    ├── openocta-plugin.yaml
    ├── README.md
    ├── ui/dist/...
    └── setup/...
```

打 zip 示例：

```bash
cd dist-pkg
cp -r ../openocta-db .
zip -r openocta-db-1.0.0.zip openocta-db
```

### 8.2 发布到 OpenOcta 官网市场

1. 在官网管理后台创建场景条目（或使用 CLI，以实现为准）
2. 上传 zip，填写 `id`、`version`、compat、图标、分类
3. 确保 manifest 中的 `remote.*.remoteId` 在**同一官网环境**存在
4. 用户从 **场景市场** 安装后，OpenOcta 会：
   - 解压到 `~/.openocta/scenarios/<id>/<version>/`
   - 创建 `~/.openocta/scenario-data/<id>/`
   - 按清单拉取 skill/employee/mcp、执行 setup、写 `runtime.json`

### 8.3 版本升级

- 递增 `version`，发布新 zip
- 用户「升级」时安装新版本目录；`dataPath/config.json` 应保留（由核心迁移逻辑处理，作者避免破坏性重命名 config 字段）
- 破坏性变更请在 README 写明迁移步骤

---

## 九、本地调试

在 OpenOcta 实现完成后，作者可：

| 方式 | 说明 |
|------|------|
| 场景市场安装 | 与最终用户一致 |
| 本地 zip | `POST /api/v1/scenarios/{id}/install`，body `{ "source": "path", "path": "/abs/openocta-db-1.0.0.zip" }`（以实现为准） |
| 仅 UI | 临时把 `ui/dist` 用静态服务器打开，mock `fetch`；联调必须用 iframe + 真实 API |
| 查看日志 | 安装 Job 日志、Gateway 日志；WS 事件 `scenario.job.progress` |

调试检查表：

- [ ] `compat` 在当前 OS/arch 通过
- [ ] iframe 打开 `index.html` 无 404
- [ ] `GET .../config` 返回 `configDefaults` 合并结果
- [ ] `PATCH` / `POST .../config/path` 后重启仍在
- [ ] 官网 skill/employee 出现在 `scenario-data/<id>/skills|employees`
- [ ] Agent 对话能用到声明的 MCP（需 enabled）
- [ ] 卸载后 `scenario-data/<id>` 与 `scenarios/<id>` 均消失

---

## 十、作者须知（Do / Don't）

### 应该做

- 业务数据全部放在插件 `config.json`（经插件 API）
- MCP server 键使用前缀，如 `openocta-db-xxx`，避免与其他插件冲突
- README 写清：依赖的环境、官网 remoteId、配置项含义
- 前端处理 `loadConfig` 失败、无 Token 时的提示

### 不应该做

- 向 `openocta.json` 写入自定义顶层字段
- 在 zip 内捆绑未声明的可执行文件（应走 setup 或 localMcps）
- 在 iframe 内使用 `eval`、加载第三方不可信脚本
- 假设主站 Tab 路由（`/message` 等）在 iframe 内可用
- 提交 Go 代码到 OpenOcta 核心以支持单一插件

---

## 十一、与 Agent 能力的关系

| 能力 | 作者如何提供 |
|------|----------------|
| 领域知识 | manifest `remote.skills` → 官网 Skill |
| 角色人设 | manifest `remote.employees` → 官网数字员工 |
| 工具调用 | `remote.mcps` + `localMcps` → 安装后进入运行时 MCP |
| 可视化操作 | `ui/dist` 工作台 + config API 存状态 |

用户在与 Agent 对话时，只要插件已 **enabled** 且 OpenOcta 已加载该插件，即可使用上述 Skill/MCP；与是否在场景工作区打开 iframe **无关**（除非产品后续区分策略）。

---

## 附录 A：最小仓库模板

```text
openocta-hello/
├── openocta-plugin.yaml
├── README.md
└── ui/dist/index.html
```

**openocta-plugin.yaml**

```yaml
apiVersion: openocta.dev/v1
kind: ScenarioPack
id: openocta-hello
version: 0.1.0
displayName: Hello 场景
description: 最小可运行示例
publisher: you
compatibility:
  os: [darwin, linux, windows]
  arch: [amd64, arm64]
  minOpenOctaVersion: "0.2.0"
configDefaults:
  message: "Hello"
views:
  - id: main
    label: 主页
    path: ui/dist/index.html
    type: static
    default: true
```

**ui/dist/index.html**（极简，演示 config API）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="utf-8" />
  <title>Hello Scenario</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #0f1419; color: #e7eaee; }
    button { padding: 8px 16px; border-radius: 8px; border: none; background: #3b82f6; color: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <h1 id="title">加载中…</h1>
  <button id="save">保存问候</button>
  <script>
    const PLUGIN_ID = "openocta-hello";
    let hash = "";
    async function load() {
      const r = await fetch(`/api/v1/scenarios/${PLUGIN_ID}/config`);
      const j = await r.json();
      hash = j.hash;
      document.getElementById("title").textContent = j.config?.message ?? "Hello";
    }
    document.getElementById("save").onclick = async () => {
      await fetch(`/api/v1/scenarios/${PLUGIN_ID}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseHash: hash,
          patch: { message: "Hello from " + new Date().toISOString() },
        }),
      });
      await load();
    };
    load();
  </script>
</body>
</html>
```

---

## 附录 B：manifest JSON Schema（草案）

实现阶段可提供机器可读 schema：`openocta-plugin.schema.json`，用于 CI 校验。字段与第五节一致，必填：

- `apiVersion`、`kind`、`id`、`version`、`displayName`、`compatibility`、`views`

---

## 附录 C：相关文档索引

| 文档 | 读者 |
|------|------|
| [scenario-pack-authoring.md](scenario-pack-authoring.md) | 插件作者（本文） |
| [scenario-plugin-packages.md](scenario-plugin-packages.md) | 架构 / 产品 |
| [scenario-plugin-config-and-bootstrap.md](scenario-plugin-config-and-bootstrap.md) | 后端实现 |
| [skills.md](skills.md) | Skill 格式（remote 安装的 skill 仍遵循 SKILL.md） |
| [mcp-configuration.md](mcp-configuration.md) | MCP 连接方式（插件 mcp.json 同结构） |

---

## 修订记录

| 版本 | 说明 |
|------|------|
| 0.1.0 | 首版：面向作者的编写规范与最小模板 |
