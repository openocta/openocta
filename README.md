# OpenOcta

> English version: see `README.en.md`.  
> 英文说明请查看 `README.en.md`。

基于 [OpenClaw](https://github.com/openocta/openocta) 的 Go 后端 + Control UI 前端一体化项目。后端由 TypeScript/Node.js 迁移至 Go，与 Gateway WebSocket 协议及官方 Control UI 行为兼容。

## 文档语言映射

- **中文文档**
  - 根文档：`README.md`（本文件）
  - 后端：`src/README.md`
  - 前端：`ui/README.md`
- **English Docs**
  - Root: `README.en.md`

---

## 为什么基于 OpenClaw 迁移

### OpenClaw 为何不适合企业级应用

- **技术栈与运维成本**：Node.js/TypeScript 运行时依赖多、进程模型偏重，在企业无桌面服务器上部署与资源占用不如单一 Go 二进制友好；企业环境更倾向可审计、易打包（如单一二进制、容器镜像）的部署形态。
- **扩展与集成方式**：原有架构面向桌面与多通道（Slack、飞书等）的「个人助理」场景，插件与 Skill 体系偏消费端；企业级需要与内部系统、监控、工单、API 深度集成，需要更可控的后端扩展点和标准化接口。
- **安全与合规**：企业部署通常要求无桌面、最小化暴露面、集中管控；OpenClaw 的桌面/多端能力与这类「仅服务器、仅 CLI/API」的需求不完全对齐，迁移到 Go 体系便于做权限、审计与部署形态的收敛。

### 为何迁移到 Go + agentsdk-go

- **统一运行时**：Go 单一二进制，无额外 Node 运行时，适合无桌面 Linux/容器化部署，启动快、内存占用可控。
- **与官方 SDK 对齐**：后端 Agent 使用 [agentsdk-go](https://github.com/cexll/agentsdk-go)（Anthropic API 的 Go SDK 生态），与官方模型与 API 演进一致，便于跟进、减少自维护协议层。
- **协议兼容**：保留与 OpenClaw Gateway 的 WebSocket 协议及 Control UI 的兼容，便于从现有 OpenClaw 部署平滑迁移或并存。

### 优缺点概览

| 维度 | 优点 | 缺点 / 注意点 |
|------|------|----------------|
| **部署与运维** | 单一二进制、无 Node 依赖、易容器化、适合无桌面服务器 | 需重新构建/发布 Go 版本，与上游 OpenClaw 功能需主动同步 |
| **性能与资源** | 内存与 CPU 占用更可控，启动快；前端已嵌入单一二进制 | 构建时需 Node 编译前端，生产运行无需 Node |
| **企业集成** | 便于对接内部 API、监控、CLI，扩展点更清晰 | 企业定制需在本仓库内维护，与上游功能分叉需有策略 |
| **生态与协议** | agentsdk-go 与官方对齐，Gateway 协议兼容现有 Control UI | 部分 OpenClaw 原生的桌面/多通道能力不在此项目主路径，需按需裁剪或替代 |

### 与其他方案对比：Go + langchaingo / Python + LangChain

- **Go + langchaingo**：langchaingo 是通用 LLM 编排库，抽象层较高，适合接多家模型与工具，但在 Anthropic Agent 场景下仍需自定义较多封装，特别是对工具调用、会话状态、流式输出等；同时，Gateway 协议与 Control UI 行为需要额外适配层来桥接。
- **Python + LangChain**：生态成熟、示例众多，适合快速原型与科研类应用，但在企业无桌面服务器上的长期运维会引入更多依赖与环境管理复杂度（虚拟环境、依赖冲突、启动开销等），与本仓库的 Go 代码与部署策略也会形成双语言栈割裂。
- **本项目选择：Go + agentsdk-go**：在语言层面与 Gateway/后端完全统一，同时直接对接 Anthropic 官方 API 生态（agentsdk-go），减少自建编排框架与 glue code 的成本；在保持足够扩展性的前提下，优先满足企业场景下的**可维护性、可部署性与协议兼容**，更符合本仓库「企业级、以运维/可观测为核心」的长期定位。

---

## 后续关注领域与业务

本项目后续将**重点放在运维与可观测领域**，以及**多维度数据整合与利用**的业务场景：

- **运维 / 可观测**：围绕日志、指标、链路、告警、变更等可观测数据，让 Agent 能理解系统状态、参与排障与决策（如与 Prometheus、Grafana、日志平台、工单系统对接）。
- **多维度数据整合**：将多源数据（监控、日志、配置、CMDB、工单、知识库等）接入同一套 Agent 能力，形成「集中大脑」——更多数据源、更多数据碰撞，支撑根因分析、影响面评估、合规检查等**企业级价值**场景。
- **价值目标**：通过统一入口（CLI/API）与可扩展的 Skill/工具，让企业在一个可控的后端上实现「可观测数据 + AI」的闭环，而不是分散的、仅桌面端的助手。

---

## 项目范围与部署目标

- **不关注桌面端操作**：不主打 macOS/Windows 桌面 UI 自动化、本地应用控制等；这些能力不在本项目主路径。
- **侧重命令行与接口**：主要交互方式为 **CLI**（如 `openocta agent -m "..."`、子命令与管道）以及 **HTTP/WebSocket 接口**（Gateway API、未来可能的 REST/Webhook），便于被脚本、流水线、其他服务调用。
- **部署目标**：**面向无桌面环境的企业服务器**——如 Linux 服务器、容器、K8s 内 Pod、跳板机或内网 API 服务，以 headless 方式运行 Gateway 与 Agent，通过 CLI 与 API 对外提供服务。

---

## 探索与扩展

通过开放的 **Skill**、**Tools**、**MCP**、**Channel** 消息渠道以及 **Webhooks**，可自由对接各类数据平台与来源，将 Octopus 打造成能适应多种业务场景与环境的多面助手。

| 扩展点 | 说明 | 典型用途 |
|--------|------|----------|
| **Skill** | 领域知识与指令的 Markdown 描述，按工作区/配置加载，在会话中按需匹配 | 运维手册、K8s 操作、故障排查流程、团队规范等 |
| **Tools** | Agent 可调用的函数，内置 bash/文件/webfetch 等，可扩展 Gateway 能力与自定义工具 | 执行命令、读写配置、调用内部 API、查询 CMDB/工单 |
| **MCP** | Model Context Protocol，将外部服务（Prometheus、Grafana、数据库等）以工具形式暴露给 Agent | 指标查询、告警拉取、日志检索、知识库检索 |
| **Channel** | 消息渠道（钉钉、飞书、WebSocket 等），将 Agent 能力接入 IM、工单、告警平台 | 群聊/私聊触发、告警自动分析、工单流转与回复 |
| **Webhooks** | 通过 `/hooks/wake`、`/hooks/agent`、`/hooks/alert` 等 HTTP 端点，从外部系统主动推送事件给主会话或独立会话 | 外部监控/告警、CI/CD 事件、第三方系统回调触发自动分析或处理 |
| **Middleware（agentsdk-go）** | 基于 agentsdk-go 的 6 段 Middleware 链（Before/After Agent/Model/Tool），可按阶段插入自定义治理逻辑 | 统一审计日志、限流与配额、敏感信息脱敏、模型输出重写、工具调用白名单/黑名单等 |
| **Sandbox（agentsdk-go）** | agentsdk-go 提供的文件/网络/资源沙箱隔离能力，可按 ProjectRoot 和白名单路径限制工具访问范围，并限制 CPU/内存/磁盘使用 | 在允许 Agent 调用 bash/文件/Web 工具的同时，确保只在受控目录和受控网络内执行，降低误操作与安全风险 |

通过组合上述能力，可将监控、日志、配置、CMDB、工单、知识库等不同来源的数据接入同一套 Agent，形成**集中大脑**，支撑根因分析、影响面评估、自动化响应等企业级场景：

- **Webhooks + Channels**：把告警、CI/CD、业务事件统一经由 `/hooks/*` 进入主会话，再通过消息渠道（IM/工单系统）向人或系统反馈，实现「事件驱动」的自动分析与闭环。
- **Middleware + Sandbox**：在更多落地场景中为 Tools/MCP 调用增加安全与可观测防线（审计、限流、脱敏、隔离），适合金融、政企等对合规要求高的环境。

---

## 项目结构

```
OctopusClaw/
├── src/                    # Go 后端（Gateway、Agent、Channels、Cron 等）
│   ├── cmd/openocta/       # CLI 入口与子命令
│   ├── embed/              # 嵌入资源（前端、config-schema、openocta.json.example）
│   │   └── frontend/       # 前端构建产物（由 build 生成）
│   ├── pkg/                # 核心模块
│   └── README.md           # 后端详细说明
├── ui/                     # Control UI 前端（Lit + Vite，WebSocket 控制面）
│   └── README.md           # 前端详细说明
├── deploy/                 # 部署相关（Dockerfile、systemd 服务）
└── docs/                   # 文档与迁移计划
```

- **后端**：Go 1.24+，提供 Gateway HTTP + WebSocket、Agent、Channels、Cron、Config 等能力。
- **前端**：Control UI 通过 **go:embed** 嵌入单一二进制，生产环境无需单独部署前端。
- **单一二进制**：构建后的 `openocta` 已包含前端与配置模板，可直接分发运行。

## 要求

- **Go 1.24+**（后端）
- **Node ≥18**（仅构建时需要，用于编译前端；生产环境无需 Node）
- 环境变量 **`ANTHROPIC_API_KEY`**（仅在使用 `agent` 命令时需要）

## 快速开始

### 1. 构建

```bash
# 使用 Makefile（推荐）
make build

# 或使用 build.sh
./build.sh build
# build.sh 支持: ui | embed | go | build | clean | snapshot | release | docker
```

构建顺序：前端 → 复制 embed 资源 → Go 编译。生成单一二进制 `openocta`，已包含前端与配置模板。

### 2. 运行 Gateway

```bash
# 构建后直接运行
make run
# 或
./openocta gateway run
```

Gateway 启动后，默认在 `http://127.0.0.1:18789` 提供 HTTP 与 WebSocket。**前端已嵌入二进制**，访问同一端口即可使用 Control UI。

### 3. 开发模式（前端热更新）

```bash
# 终端 1：启动 Gateway（需先 make build）
./openocta gateway run

# 终端 2：启动前端开发服务器（端口 5173）
make run-ui
```

访问 `http://localhost:5173` 使用 Control UI 开发服务器，支持热更新。

### 4. 运行 Agent（需 ANTHROPIC_API_KEY）

```bash
export ANTHROPIC_API_KEY=your-key
./openocta agent -m "Hello, echo test"
```

### 5. 配置文件

首次运行且配置文件不存在时，会自动从嵌入的 `openocta.json.example` 初始化并写入配置目录：

| 平台 | 默认配置目录 |
|------|--------------|
| Linux / macOS | `~/.openocta/openocta.json` |
| Windows | `%APPDATA%\openocta\openocta.json` |

## 主要命令

| 命令 | 说明 |
|------|------|
| `make build` | 完整构建（前端 + embed + Go） |
| `make run` | 构建并启动 Gateway（端口 18789） |
| `make run-ui` | 仅启动前端开发服务器（端口 5173） |
| `make snapshot` | GoReleaser 快照构建（tar.gz/zip/deb/rpm/docker） |
| `make release` | GoReleaser 正式发布 |
| `make docker` | 本地 Docker 镜像构建 |
| `gateway run` | 启动 Gateway HTTP + WebSocket 服务（默认端口 18789） |
| `agent -m <msg>` | 本地执行 Agent（agentsdk-go + DefaultTools） |
| `node` | Node 控制（占位） |

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENOCTA_STATE_DIR` | 状态目录（Linux/macOS 默认 `~/.openocta`，Windows 默认 `%APPDATA%\openocta`） |
| `OPENOCTA_CONFIG_PATH` | 配置文件路径 |
| `OPENOCTA_FRONTEND_DIR` | 前端目录（可选，默认使用嵌入的前端） |
| `OPENOCTA_SKIP_CHANNELS` | 设为 `1` 跳过 channel 加载 |
| `OPENOCTA_SKIP_CRON` | 设为 `1` 跳过 Cron 服务 |
| `OPENOCTA_SKIP_PROVIDERS` | 同 `SKIP_CHANNELS` 的兼容别名 |
| `ANTHROPIC_API_KEY` | Agent 模型认证（`agent` 命令必填） |

## 子项目说明

| 子项目 | 路径 | 说明 |
|--------|------|------|
| **Go 后端** | [src/](src/) | Gateway、Agent、Channels、Cron、Config 等，详见 [src/README.md](src/README.md) |
| **Control UI** | [ui/](ui/) | Lit + Vite 单页应用，WebSocket 连接 Gateway，详见 [ui/README.md](ui/README.md) |

## 打包与发布

使用 [GoReleaser](https://goreleaser.com/) 生成多平台安装包：

```bash
# 快照构建（不发布，输出到 dist/）
make snapshot
# 或
goreleaser release --snapshot --clean --skip=publish

# 正式发布（需配置 GITLAB_TOKEN 等）
make release
```

**产出物：**

| 平台 | 格式 | 说明 |
|------|------|------|
| Linux amd64/arm64 | tar.gz, deb, rpm | 单一二进制，前端已嵌入 |
| macOS amd64/arm64 | tar.gz | 单一二进制 |
| Windows amd64/arm64 | zip | 单一二进制 |
| Docker | linux/amd64 | 精简镜像，单一二进制 |

**配置路径：** Linux/macOS 使用 `~/.openocta`，Windows 使用 `%APPDATA%\openocta`。首次运行自动从嵌入的 `openocta.json.example` 初始化配置。

## 测试

```bash
# 后端测试
cd src && go test ./...

# 前端测试
cd ui && npm run test
```

后端协议兼容性测试位于 `src/test/gateway_protocol_test.go`，覆盖 connect/hello-ok、health 及 frame 序列化。

## 文档与参考

- [OpenClaw 官方](https://github.com/openocta/openocta) — 上游项目
- [docs.openclaw.ai](https://docs.openclaw.ai) — 官方文档
- [Gateway 协议](https://docs.openclaw.ai/gateway) — WebSocket 握手与 req/res 格式
- [src/README.md](src/README.md) — 后端模块、迁移状态与文档链接
- [ui/README.md](ui/README.md) — Control UI 功能、脚本与结构说明

### 后端内部文档（`src/docs/`）

- [src/docs/configuration.md](src/docs/configuration.md) — OpenClaw/OctopusClaw 配置总览：配置文件位置、各字段含义（agents、channels、gateway、cron、hooks、memory 等）以及常见场景示例。
- [src/docs/mcp-configuration.md](src/docs/mcp-configuration.md) — MCP（Model Context Protocol）配置与使用说明：如何在配置中声明 MCP 服务器、权限与超时，以及在运行时将 MCP 工具暴露给 Agent。
- [src/docs/trace-and-observability.md](src/docs/trace-and-observability.md) — 追踪与可观测性：如何启用/配置 Trace、采集 token 使用情况、记录会话与工具调用的链路信息。
- [src/docs/webhooks.md](src/docs/webhooks.md) — Webhooks 说明：详细描述 `/hooks/wake`、`/hooks/agent`、`/hooks/alert` 的路径、请求/响应结构、错误码含义以及各自适用场景。
- [src/docs/architecture.md](src/docs/architecture.md) — 架构概览：基于 agentsdk-go 的分层设计（Gateway、Agent Runtime、Skills、Tools、MCP、Sandbox 等），以及 OctopusClaw 在 Webhooks、技能体系上的扩展。
- [src/docs/skills.md](src/docs/skills.md) — Skills 使用说明：Skill 的加载优先级（extraDirs/bundled/managed/workspace）、在会话中的匹配规则，以及如何编写/部署个人 `SKILL.md`。
- [src/docs/tools.md](src/docs/tools.md) — 工具系统总览：内置通用工具、OpenClaw 扩展工具以及自定义工具的整体结构与关系，并指向各子文档。
- [src/docs/tools-builtin.md](src/docs/tools-builtin.md) — agentsdk-go 内置工具说明：bash、文件读写/编辑、grep/glob、webfetch/websearch、任务与异步执行、askuserquestion 等的能力与典型场景。
- [src/docs/tools-openocta.md](src/docs/tools-openocta.md) — OpenOcta 扩展工具说明：`echo`、`cron`、`gateway_config`、`sessions` 等工具如何通过 GatewayInvoker 调用网关能力，并给出自定义工具实现与注册示例。
