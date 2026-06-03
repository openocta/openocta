# 垂直场景插件包（Scenario Plugin Packages）设计方案

本文档定义基于 OpenOcta 的**垂直业务场景插件包**体系（如 `openocta-db`、`openocta-test`），目标是在**尽量少改动 OpenOcta 核心代码**的前提下，通过可分发、可安装的插件包注入 Skills、MCP、工具与专属视图，并与现有远程市场、Skills、MCP 配置机制对齐。

**补充（推荐主路径）**：独立插件配置、专用 API、隔离安装目录、启动/安装进度见 [`scenario-plugin-config-and-bootstrap.md`](scenario-plugin-config-and-bootstrap.md)。

**插件作者**：如何创建与发布插件包见 [`scenario-pack-authoring.md`](scenario-pack-authoring.md)。

---

## 一、背景与目标

### 1.1 背景

OpenOcta 已具备：

| 能力 | 现有实现 | 说明 |
|------|----------|------|
| Skills | `pkg/agent/skills/loader.go` | 多目录加载、frontmatter、`Requires` / `Install` |
| MCP | `mcp.servers`（见 `mcp-configuration.md`） | stdio / URL / service |
| 远程安装 | `POST /api/v1/install`（`site_install.go`） | `employee` / `skill` / `mcp` 三类 zip 安装 |
| 安装元数据 | `.install-metadata.json` | 记录 remoteId → localId |
| 配置中的 plugins | `PluginsConfig`（`schema.go`） | allow/deny、paths、entries、installs |
| UI 路由 | `navigation.ts` + `app-render.ts` | 基于 path 的 Tab 切换 |
| Channel 扩展模式 | `channels-extending.md` | Plugin 元数据 + Runtime 注册 |

垂直场景（数据库运维、测试、K8s 等）需要**打包**上述能力，并附带**场景专属 UI**，且不与默认控制台页面耦合。

### 1.2 设计目标

1. **核心薄、插件厚**：清单、安装、激活、视图壳在核心；业务 Skills/MCP/工具/页面在插件包。
2. **与现有能力复用**：不重复造 Skills/MCP 安装轮子，扩展 `kind=scenario`（或 `plugin-pack`）即可。
3. **环境可声明**：插件声明支持的 OS、CPU 架构、依赖二进制（如 `mysql` 客户端）。
4. **视图可选、默认页不变**：用户可不选场景视图，继续使用现有 `/message` 等页面；选择后进入独立场景页，**当前阶段仅支持单视图**（下拉框切换插件，每个插件最多一个主视图）。
5. **可分发**：zip + 清单 + 可选远程索引（与员工市场/技能库同一套 Site API 模式）。

### 1.3 非目标（首期）

- 不在核心内嵌各场景业务逻辑（如不把 MySQL 工具写进 `pkg/agent/runtime`）。
- 不支持单插件多视图 Tab（预留 manifest 字段，UI 只读第一个）。
- 不要求 Go `.so` 动态库插件（现有 `plugin-sdk` 保留给内存等底层扩展，场景包走**清单 + 资源包**模型）。

---

## 二、概念模型

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ OpenOcta 核心（少量增量）                                                │
│  - 场景目录 API：列表 / 详情 / 安装 / 激活 / 兼容性检查                  │
│  - 场景壳页面：/scenarios（市场） + /scenarios/workspace（工作区）       │
│  - 激活时：合并 mcp / skills 路径 / 可选 tools 声明 → Runtime           │
│  - 本地状态：activeScenarioId（可空）、installed scenarios               │
└─────────────────────────────────────────────────────────────────────────┘
         │ 拉取 zip                    │ 读取已安装包
         ▼                             ▼
┌──────────────────────┐    ┌──────────────────────────────────────────┐
│ 远程场景索引（可选）   │    │ installPath: scenarios/<id>/<ver>/       │
│ Site API / 自建 Registry│    │   yaml + ui/dist + setup                  │
└──────────────────────┘    │ dataPath: scenario-data/<id>/             │
                              │   config.json + skills/ employees/ mcp   │
                              └──────────────────────────────────────────┘
```

**术语：**

| 术语 | 含义 |
|------|------|
| **场景插件包（Scenario Pack）** | 一个垂直场景的完整交付单元，如 `openocta-db` |
| **清单（Manifest）** | 包内 `openocta-plugin.yaml`，描述 id、版本、环境、资源入口 |
| **激活（Activate）** | 将已安装包中的 Skills/MCP/工具声明合并进当前运行时配置 |
| **场景视图（Scenario View）** | 插件提供的静态 UI 或 Web Component 入口，由核心壳加载 |

---

## 三、插件包规范

### 3.1 包结构

```text
openocta-db-1.2.0.zip
└── openocta-db/                    # 根目录名可与 id 一致
    ├── openocta-plugin.yaml        # 必填：清单
    ├── README.md                   # 可选：市场展示
    ├── skills/
    │   └── mysql-dba/
    │       └── SKILL.md
    ├── mcp/
    │   └── manifest.json           # 可选：待合并的 mcp.servers 片段
    ├── tools/
    │   └── tools.yaml              # 可选：声明式工具（见 3.4）
    ├── assets/
    │   └── icon.png
    └── ui/
        ├── view.json               # 视图元数据（单视图）
        └── dist/                   # 构建后的静态资源（index.html 等）
            ├── index.html
            └── ...
```

### 3.2 清单文件 `openocta-plugin.yaml`

```yaml
# 必填
apiVersion: openocta.dev/v1
kind: ScenarioPack
id: openocta-db
version: 1.2.0
displayName: OpenOcta 数据库场景
description: MySQL / PostgreSQL 运维与 SQL 辅助
publisher: openocta

# 环境适配（安装前检查）
compatibility:
  os: [darwin, linux, windows]       # 小写，与 runtime.GOOS 对齐
  arch: [amd64, arm64]               # 与 runtime.GOARCH 对齐
  minOpenOctaVersion: "0.2.0"

# 依赖（安装/激活时检查，可提示用户安装）
requires:
  bins:
    - name: mysql
      anyOf: [mysql, mariadb]        # 满足其一即可
      optional: false
  env: []                            # 可选环境变量名列表

# 资源入口（相对包根目录）
contributions:
  skills:
    dirs: [skills]
  mcp:
    file: mcp/manifest.json          # 合并到 openocta.json 的 mcp.servers
  tools:
    file: tools/tools.yaml           # 声明式；见 3.4

# 视图（首期：仅使用第一个 enabled 的条目）
views:
  - id: main
    label: 数据库工作台
    path: ui/dist/index.html         # 相对包根；或以 ui/dist 为 base 的 SPA
    type: static                     # static | module（预留 module 给 ES 入口）
    default: true

# 安装后写入用户配置的片段（可选，合并到 plugins.entries.<id>）
configSchema:                        # JSON Schema 字符串或内联对象，供设置 UI
  type: object
  properties:
    defaultConnection:
      type: string
```

**字段说明：**

- `compatibility`：核心在安装/激活前调用 `scenario.compat` 接口，对比当前 OS/ARCH/版本。
- `contributions.skills.dirs`：追加到 `config.skills.load.extraDirs`（仅在该场景激活时生效，见 5.2）。
- `contributions.mcp.file`：JSON 片段，键合并进 `mcp.servers`，建议键带前缀如 `openocta-db-prometheus` 避免冲突。
- `views`：UI 只展示 `default: true` 或列表第一项；`type: static` 表示 iframe/同源静态页加载。

### 3.3 MCP 片段示例 `mcp/manifest.json`

```json
{
  "servers": {
    "openocta-db-mysql-mcp": {
      "enabled": true,
      "command": "npx",
      "args": ["-y", "@openocta/mcp-mysql"],
      "env": {
        "MYSQL_HOST": "$MYSQL_HOST"
      }
    }
  }
}
```

与现有 `mcp-configuration.md` 完全兼容，由核心做**深合并**并记录来源为 `scenario:openocta-db`。

### 3.4 工具声明 `tools/tools.yaml`（首期）

首期以**声明 + 文档**为主，工具实现优先走 MCP；若必须本地工具，分两档：

| 档位 | 方式 | 核心改动 |
|------|------|----------|
| A（推荐） | 工具由 MCP Server 暴露 | 无核心工具代码 |
| B | 插件包内带 `tools/plugin` 说明 + 用户在配置中启用对应 MCP/脚本 | 仅文档与 manifest 校验 |
| C（后续） | 包内 `tools/*.go` 编译为独立 helper 二进制，manifest 声明 `command` | 新增 `tools run` 薄封装 |

`tools.yaml` 示例（声明式，供 Agent 提示与安装检查）：

```yaml
tools:
  - id: mysql_query
    description: 在只读模式下执行 SQL
    requires:
      bins: [mysql]
    # 实际调用链路由 MCP 或文档指引，不在核心注册 Go tool
```

### 3.5 Skills

包内 `skills/**/SKILL.md` 遵循 `skills.md`，可继续使用 frontmatter 的 `metadata.openocta.requires` 等字段。场景激活后，loader 将 `contributions.skills.dirs` 追加到**会话级**或**全局级** extraDirs（建议会话级，避免多场景污染）。

---

## 四、核心改动范围（尽量少）

### 4.1 后端（Go）

| 模块 | 改动 | 说明 |
|------|------|------|
| `pkg/scenario/`（新建） | Manifest 解析、compat 检查、安装解压、激活合并 | 主逻辑集中，避免散落 |
| `pkg/gateway/http/scenario.go`（新建） | HTTP API | 见 4.3 |
| `pkg/gateway/http/site_install.go` | 扩展 `kind` | 增加 `scenario`，或统一走新 handler |
| `pkg/installmetadata` | 扩展 `Metadata` | 增加 `Scenarios []Entry` |
| `pkg/config` | 可选字段 | `scenarios.installed`（仅元信息）、`activeId` |
| `pkg/scenario/config.go` | 插件配置读写 | 独立 `config.json`，专用 API，不走 `config.patch` |
| `pkg/scenario/loader.go` | 启动加载 | 读已安装插件 skills/employees/mcp |
| `pkg/scenario/jobs.go` | 进度 Job | install / startup_load 步骤与 WS 事件 |
| `pkg/agent/skills/loader.go` | 小改 | 激活场景时注入临时 extraDirs |
| `pkg/gateway/http/server.go` | 注册路由 | 几行 |

**不建议**改动：`app-render.ts` 内各业务 Tab、Agent Runtime 核心循环、Wails 壳。

### 4.2 前端（UI）

| 模块 | 改动 | 说明 |
|------|------|------|
| `navigation.ts` | 新增 Tab | `scenarios` → `/scenarios`，`scenarioWorkspace` → `/scenarios/workspace`（可选合并为一个 Tab 两个子路由） |
| `views/scenario-market.ts`（新建） | 场景市场列表 | 类比 `employee-market.ts` |
| `views/scenario-workspace.ts`（新建） | 壳 + 下拉选场景 + iframe | 无激活场景时引导去市场 |
| `app-render.ts` | 增加 case 分支 | 各 1 处 render 调用 |
| `controllers/scenario.ts`（新建） | API 封装 | 列表、安装、激活、compat |
| 顶栏/侧栏 | 可选入口 | 「场景」入口，不影响现有 Tab |

**原有页面**：`/message`、`/config` 等路由与组件**零逻辑变更**；仅增加可选全局状态 `activeScenarioId`（用于 Agent 侧资源合并，不改变默认 Tab）。

### 4.3 HTTP API（建议）

前缀：`/api/v1/scenarios`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/catalog` | 远程索引列表（代理 Site API 或读本地 registry） |
| GET | `/catalog/:id` | 详情 + compat 预检结果 |
| POST | `/install` | body: `{ "id", "source": "remote" \| "path" }`，解压到 `~/.openocta/scenarios/<id>/<version>/` |
| GET | `/installed` | 已安装列表 + 版本 + 状态 |
| POST | `/activate` | `{ "id" }` 或 `{ "id": null }` 取消激活 |
| GET | `/active` | 当前激活场景 + 合并后的 contributions 摘要 |
| GET | `/compat/:id` | 仅兼容性检查 |
| GET | `/view/:id/*` | 静态资源服务（供 iframe src，需鉴权同源） |
| GET/PATCH/POST | `/:id/config` | 插件专用配置（`dataPath/config.json`，与主配置分离） |
| GET | `/jobs/:jobId` | 安装/启动加载进度 |
| DELETE | `/:id` | 卸载（删除 dataPath、installPath、主配置元信息） |

远程安装可复用 `fetchZipFromSite`：`kind=scenario`；Skill/员工落盘 `scenario-data/<id>/`（见补充文档）。

### 4.4 配置与加载策略（修订）

**主配置 `openocta.json`** 仅存插件**元信息**（id、version、installPath、dataPath、enabled、activeId），**不存**插件业务 JSON。

| 资源 | 存储位置 | 加载时机 |
|------|----------|----------|
| 插件业务配置 | `scenario-data/<id>/config.json` | 插件专用 API / iframe |
| Skills（官网自动装） | `scenario-data/<id>/skills/` | Gateway **启动**时 |
| 数字员工 | `scenario-data/<id>/employees/` | 启动时注册 |
| MCP 片段 | `scenario-data/<id>/mcp.json` | 启动时内存合并（不写回主配置） |
| 前端页面 | `installPath/ui/dist/` | iframe `/view/:id/` |
| 运行环境 | `scenario-data/<id>/runtime-env/` | MCP / setup |

**激活**（`activeId`）：仅决定 iframe 默认展示哪个插件 UI。

**卸载**：删除 `dataPath` + `installPath`，并从 `scenarios.installed` 移除；注销运行时 skills/employees/MCP。

**进度**：安装与启动加载通过 Job + WS 展示步骤与下载百分比（见 `scenario-plugin-config-and-bootstrap.md` §四）。

---

## 五、用户流程与 UI 行为

### 5.1 流程

```mermaid
flowchart TD
  A[用户打开 OpenOcta] --> B{是否选择场景视图?}
  B -->|否| C[默认 /message 等原有页面]
  B -->|是| D[/scenarios 市场]
  D --> E[点击场景卡片]
  E --> F{compat 通过?}
  F -->|否| G[展示缺失 OS/ARCH/二进制]
  F -->|是| H[下载并安装 zip]
  H --> I[POST /activate]
  I --> J[/scenarios/workspace]
  J --> K[下拉框: 当前仅一个已激活场景]
  K --> L[iframe 加载 ui/dist/index.html]
  C --> M[可随时切到 /scenarios/workspace]
  M --> N[下拉选 无 / 某场景]
  N -->|无| C
```

### 5.2 视图壳页面（首期）

- **路由**：`/scenarios/workspace`（与原有 Tab 并列，不替换首页）。
- **布局**：
  - 顶栏：下拉框（选项：`（不使用场景视图）` + 已安装且 compat 通过的场景，**单选**）。
  - 主区：选中场景时 `iframe` 加载 `/api/v1/scenarios/view/<id>/index.html`；未选中时显示说明 + 跳转市场链接。
- **约束**：每个插件包仅一个 `views[]` 生效；manifest 多个 view 时核心取 `default: true` 或第一项，其余忽略（日志 warn）。

### 5.3 与 Agent 的关系

- 用户在场景工作区对话时，Gateway 将 `activeScenarioId` 传入 handler context，Runtime 加载该场景的 Skills/MCP。
- 用户在默认 `/message` 页对话且**未激活场景**时，行为与今日一致。
- 用户在默认页但**已激活场景**：可选策略（配置项）：
  - `scenarios.applyToDefaultChat: false`（默认）：仅 workspace 页生效；
  - `true`：全局 Agent 均带场景资源（适合重度场景用户）。

---

## 六、分发与仓库组织

### 6.1 独立仓库（推荐）

每个垂直场景独立仓库，与核心解耦：

```text
openocta-db/          # 独立 git 仓库
├── openocta-plugin.yaml
├── skills/
├── mcp/
├── ui/               # 独立前端工程，构建产物放入 ui/dist
└── .github/workflows/release.yml   # 打 zip 上传 Release / 推到 Site
```

`openocta-test`、`openocta-k8s` 等同理。

### 6.2 远程索引

扩展 Site API（与 `employee-market` 同源），或提供静态 `catalog.json`：

```json
{
  "items": [
    {
      "id": "openocta-db",
      "displayName": "数据库场景",
      "version": "1.2.0",
      "description": "...",
      "iconUrl": "https://...",
      "downloadUrl": "https://.../openocta-db-1.2.0.zip",
      "compat": { "os": ["darwin","linux","windows"], "arch": ["amd64","arm64"] }
    }
  ]
}
```

核心 `GET /api/v1/scenarios/catalog` 代理该索引，UI 不直连外站。

### 6.3 版本与升级

- 安装路径：`~/.openocta/scenarios/<id>/<version>/`，`latest` 符号链接指向当前激活版本。
- 升级：新 zip 安装到新版本目录 → 用户确认 → `activate` 切换 → 旧版本可保留用于回滚。
- `.install-metadata.json` 增加 `scenarios` 数组，记录 `remoteId`、`version`、`installPath`。

---

## 七、安全与治理

| 风险 | 对策 |
|------|------|
| 任意 zip 执行 | 安装目录仅限 `~/.openocta/scenarios`；MCP `command` 白名单或用户确认 |
| MCP 合并冲突 | server 键强制前缀 `<scenarioId>-*` |
| 视图 XSS | iframe `sandbox` + 同源静态服务；禁止 `javascript:` URL |
| 供应链 | 可选 `plugins.allow` / `scenarios.allow` 白名单；签名扩展留 v2 |
| 敏感配置 | `configSchema` 写入 `plugins.entries.*.config`，不入日志 |

---

## 八、实施分期

### Phase 1 — 规范与本地闭环（2–3 周）

- [ ] 定稿 `openocta-plugin.yaml` schema（本文档）
- [ ] `pkg/scenario`：解析、compat、本地 path 安装
- [ ] API：`/installed`、`/install`（path）、`/activate`、`/compat`
- [ ] UI：`/scenarios` 列表 + `/scenarios/workspace` iframe 壳
- [ ] 示例包：`openocta-db` 最小集（1 Skill + 1 MCP 声明 + 静态 Hello 视图）
- [x] 文档：插件包作者指南 [`scenario-pack-authoring.md`](scenario-pack-authoring.md)

### Phase 2 — 远程市场与安装（1–2 周）

- [ ] `kind=scenario` 远程 zip 安装（复用 `site_install`）
- [ ] `installmetadata` 扩展 + 市场 UI
- [ ] 静态资源 `GET /view/:id/*`

### Phase 3 — Agent 深度集成（按需）

- [ ] 激活场景下 Skills/MCP 合并与卸载
- [ ] `scenarios.applyToDefaultChat` 配置项
- [ ] 工具声明校验与 MCP 引导

### Phase 4 — 生态（后续）

- [ ] 多视图、`type: module` 动态加载
- [ ] 包签名、企业私有 catalog
- [ ] 场景级数字员工模板打包

---

## 九、与现有 `plugins` 配置的关系

`config.plugins`（`schema.go`）面向 **OpenClaw 式插件槽位**（如 memory plugin、Go `.so`）。本方案的 **Scenario Pack** 是更高层的**业务场景包**，二者并存：

| 维度 | `plugins.entries` | Scenario Pack |
|------|-------------------|---------------|
| 交付物 | npm/archive/path，偏运行时扩展 | zip + yaml + 资源 |
| 典型用途 | 记忆、通道、底层扩展 | 垂直行业 UI + Skills + MCP |
| 视图 | 无 | 有 `ui/dist` |
| 配置键 | `plugins.entries.<id>` | 建议 `scenarios.entries.<id>` + 合并 MCP |

实现时：**Scenario 激活可同步写入 `plugins.entries.<scenarioId>.enabled=true`**，便于复用现有配置 UI 的 enabled 开关，但视图与 catalog 仍走 `scenarios` API。

---

## 十、示例：`openocta-db` 最小清单

```yaml
apiVersion: openocta.dev/v1
kind: ScenarioPack
id: openocta-db
version: 0.1.0
displayName: 数据库场景
description: MySQL 运维辅助
compatibility:
  os: [darwin, linux, windows]
  arch: [amd64, arm64]
requires:
  bins:
    - name: mysql
      anyOf: [mysql]
contributions:
  skills:
    dirs: [skills]
  mcp:
    file: mcp/manifest.json
views:
  - id: main
    label: 数据库工作台
    path: ui/dist/index.html
    type: static
    default: true
```

---

## 十一、插件 iframe 与后端 API（核心不知道 struct 怎么办）

### 11.1 原则：契约在线上，不在 Go 编译期

OpenOcta **不应**为每个场景包在核心仓库里定义 `type DbInstance struct { ... }`。插件是第三方交付物，类型信息应存在于：

1. **插件包自己的前端工程**（TypeScript `interface` / 从 OpenAPI 生成）；
2. **插件包自带的 API 描述**（`api/openapi.yaml` 或 `api/methods.json`）；
3. **线上的 JSON 信封**（核心只认固定外壳，业务 payload 为不透明 JSON）。

这与 Gateway 现有做法一致：`InvokeMethod(method, params map[string]interface{})` 返回 `payload interface{}`，由 JSON 序列化落盘，**无插件专属 Go struct**。

```text
┌─────────────────────────────────────────────────────────────────┐
│ 插件 iframe（openocta-db/ui）                                    │
│  - 本地定义 TypeScript 类型（或 openapi-typescript 生成）         │
│  - 只依赖「信封 + 文档」，不依赖核心 Go 类型                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / postMessage 桥
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ OpenOcta 核心 Gateway                                            │
│  - 固定信封：{ ok, data, error }，data 为 json.RawMessage / any  │
│  - 路由：通用 API / 场景 RPC 代理 / 转发到插件 sidecar            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   核心已有 handler   scenario.invoke    插件 backend/
   (sessions, chat)   (manifest 声明)     (可选子进程)
```

### 11.2 三层 API 模型（按推荐顺序组合）

| 层级 | 用途 | 谁定义「结构」 | 核心是否编译期知道 struct |
|------|------|----------------|---------------------------|
| **L1 核心通用 API** | 会话、配置、聊天、Skills 状态 | OpenOcta 文档 + 现有 Gateway | 核心已知；插件直接复用 |
| **L2 场景 RPC（推荐）** | 场景专属查询/操作（表列表、跑 SQL 等） | 插件包 `api/methods.json` + 前端 TS | **不知道**；走 JSON 信封 |
| **L3 插件自有后端** | 重逻辑、长连接、强类型 Go 服务 | 插件独立仓库 `backend/` | 核心**完全不参与** struct |

**默认策略**：iframe 内页面优先 **L1 + MCP（Agent 工具）**；需要结构化 CRUD 时用 **L2**；复杂域（大型 SQL 引擎、K8s controller）用 **L3**。

### 11.3 统一 JSON 信封（核心唯一强类型）

核心 Gateway 只定义**一种**响应外壳（Go 侧仅此 struct）：

```go
// pkg/scenario/api_envelope.go — 核心仅此一种业务无关类型
type Envelope struct {
    OK    bool            `json:"ok"`
    Data  json.RawMessage `json:"data,omitempty"` // 插件任意 JSON
    Error *ErrorBody      `json:"error,omitempty"`
}
type ErrorBody struct {
    Code    string `json:"code"`
    Message string `json:"message"`
}
```

请求同理：`params` 用 `json.RawMessage` 或 `map[string]any`，**不按插件解析字段**。

插件前端示例：

```ts
// 在 openocta-db/ui 仓库内定义 — 核心无此类型
interface MysqlInstance {
  id: string;
  host: string;
  port: number;
}

async function listInstances(): Promise<MysqlInstance[]> {
  const res = await scenarioRpc<{ items: MysqlInstance[] }>("db.listInstances", {});
  return res.items;
}
```

### 11.4 L2：场景 RPC `POST /api/v1/scenarios/:id/rpc/:method`

**流程：**

1. 安装包内 `api/methods.json` 声明方法名、参数/响应的 **JSON Schema**（文档 + 可选校验）；
2. iframe 调用统一端点，body 为任意 JSON；
3. 核心根据 manifest 将请求**路由到对应实现**（见 11.5），原样返回 JSON，封装进 `Envelope`。

`api/methods.json` 片段：

```json
{
  "methods": {
    "db.listInstances": {
      "description": "列出已配置的数据源",
      "paramsSchema": { "type": "object", "properties": {} },
      "resultSchema": {
        "type": "object",
        "properties": {
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "host": { "type": "string" },
                "port": { "type": "integer" }
              }
            }
          }
        }
      },
      "handler": { "type": "script", "file": "api/handlers/list_instances.js" }
    }
  }
}
```

- **核心**：启动时读取 schema 做**可选**校验（`ajv` / go jsonschema）；**不生成 Go struct**。
- **插件作者**：用 `resultSchema` 在 CI 里生成 TS 类型，或手写 interface。
- **版本兼容**：`methods.json` 带 `apiVersion`；破坏性变更升场景包 `version`。

HTTP 示例：

```http
POST /api/v1/scenarios/openocta-db/rpc/db.listInstances
Authorization: Bearer <gateway-token>
Content-Type: application/json

{}
```

```json
{
  "ok": true,
  "data": {
    "items": [{ "id": "local", "host": "127.0.0.1", "port": 3306 }]
  }
}
```

### 11.5 RPC 实现方式（核心仍无业务 struct）

| handler.type | 说明 | 适用 |
|--------------|------|------|
| `core` | 映射到已有 Gateway method（白名单） | 复用 `sessions.list` 等 |
| `script` | 执行包内 Node/Deno 脚本，stdin/stdout JSON | 轻量 CRUD、读本地配置 |
| `exec` | 执行包内 `backend/openocta-db-api` 子进程，stdio JSON-RPC | 强类型 Go 在**插件仓库**内 |
| `http` | 转发到 manifest 声明的 `backend.httpUrl`（localhost） | L3 独立服务 |

**要点**：即使用 Go 写插件后端，也放在 **`openocta-db/backend`** 仓库里编译成二进制，随 zip 分发；OpenOcta 主进程只做 **spawn + JSON 透传**，不在 `openocta/src` 里 `import` 插件包。

`exec` 通信示意（行协议或 Content-Length JSON-RPC 均可）：

```text
Parent (OpenOcta)  --stdin-->  child: { "method":"db.listInstances","params":{} }
                 <--stdout--  child: { "ok":true,"data":{ "items":[...] } }
```

### 11.6 iframe 鉴权与调用方式

iframe 与父页**同源**（通过 `/api/v1/scenarios/view/:id/*` 提供静态资源）时，可直接 `fetch` Gateway API。

若构建为独立 origin 或需隔离，用 **postMessage 桥**（核心壳实现）：

```ts
// 插件 UI
window.parent.postMessage(
  { type: "openocta-scenario-rpc", scenarioId: "openocta-db", method: "db.listInstances", params: {} },
  "*"
);
```

父页校验来源后，代发 `fetch('/api/v1/scenarios/.../rpc/...')` 并回传 `Envelope`。**Token 不暴露给不可信脚本**时可采用此模式。

可选：壳在加载 iframe 时注入 `window.__OPENOCTA_SCENARIO__ = { id, token, baseUrl }`（仅同源）。

### 11.7 与 MCP / Agent 的关系

- **结构化数据给「页面」**：走 L2 RPC 或 L3 HTTP。
- **结构化能力给「模型」**：走包内 MCP Server（工具返回 JSON 字符串），同样无需核心 struct。
- 避免在核心为插件加 Go Tool 注册；否则又回到编译期耦合。

### 11.8 清单扩展（openocta-plugin.yaml）

```yaml
contributions:
  api:
    methodsFile: api/methods.json
    # 可选：OpenAPI 3 供文档站与 codegen
    openapi: api/openapi.yaml
  backend:
    # L3：激活场景时由核心拉起（仅 localhost）
    exec:
      command: backend/openocta-db-api
      args: ["--stdio"]
    # 或 http:
    #   port: 0   # 0 表示动态分配，写入 state 文件
```

### 11.9 反模式（避免）

| 反模式 | 问题 |
|--------|------|
| 在 `openocta/src/pkg/...` 为每个场景定义 Go struct | 每加一个插件就要发版核心 |
| iframe 直接连插件外网 URL 且带用户 Token | 泄露与 CSP 风险 |
| 核心 `json.Unmarshal` 到具体插件 struct | 与 11.1 原则冲突 |
| 无 schema 的随意 RPC | 前端与后端易漂移；应用 JSON Schema 约束 |

### 11.10 小结

| 角色 | 做什么 |
|------|--------|
| **OpenOcta 核心** | 只实现 `Envelope` + 路由/代理/鉴权；业务 `data` 当 `json.RawMessage` |
| **场景包** | 提供 `methods.json`（schema）+ 实现（script/exec/http）+ 前端 TS 类型 |
| **iframe 前端** | 在插件仓库内类型安全；通过统一 RPC 或 MCP 拿 JSON |

**结论**：「不知道 struct」是正常状态；用 **JSON Schema 描述契约 + 插件侧生成类型 + 核心 JSON 信封** 即可，无需在 OpenOcta 主仓库为插件定义 Go 结构体。

---

## 十二、总结

本方案通过 **清单驱动的资源包（Scenario Pack）** 统一垂直场景的 Skills、MCP、工具声明与专属视图，核心仅增加 **场景生命周期 API + 独立工作区路由 + 配置合并**，复用现有 Skills 加载、MCP 配置与远程 zip 安装链路。默认 OpenOcta 页面与交互保持不变；用户通过下拉框可选进入单一场景视图，后续再扩展多视图与市场能力。

**相关文档：**

- `scenario-plugin-config-and-bootstrap.md` — **独立插件配置、专用 API、隔离目录、进度**
- `architecture.md` — 整体分层
- `skills.md` — Skill 加载与 frontmatter
- `mcp-configuration.md` — MCP 合并规则
- `channels-extending.md` — Plugin 元数据模式参考
- `desktop-app-design.md` — 桌面壳与 embed 前端
