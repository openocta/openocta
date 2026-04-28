[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/openocta-openocta-badge.png)](https://mseep.ai/app/openocta-openocta)

<p align="center">
  <img src="./imgs/openocta_logo.png" alt="OpenOcta 八爪鱼" width="420">
</p>

<p align="center">
  <b>OpenOcta 八爪鱼</b> —— 开源企业级 AI Agent；单一二进制，随处部署，快速使用，对接企业。
</p>

> [English](README.en.md) | 简体中文

OpenOcta **完全自研**为 **单一 Go 二进制后端 + 内嵌前端**，适用于企业内的智能对话、流程自动化，以及业务系统、API 与工具链的整合。

**热烈欢迎大家对该项目提交PR或者好的意见**

---

## 项目简介

- **定位**：在企业内提供统一的 **AI Agent 运行时与控制面**，可接入业务系统、HTTP/API、MCP 工具与自定义技能，支持对话、任务编排与自动化集成。
- **形态**：一个包含 Gateway、Agent、Channels、Cron、前端静态资源的单一二进制，可通过 CLI、HTTP/WebSocket、Webhook 等方式对接外部系统。

---

## 交流与反馈

- **讨论与使用经验分享**：欢迎加入八爪鱼讨论群，交流部署实践、集成场景与最佳实践。
- **问题反馈与需求建议**：可以在群内提问或反馈使用问题，也欢迎在 Git 仓库中提交 Issue / PR。

<p align="center">
  <img src="./imgs/wechat.png" alt="OpenOcta 讨论群二维码" width="220" height="220">
  <br/>
  <sub>扫码加入 OpenOcta 讨论群，获取最新动态与问题支持</sub>
</p>

---

## 快速开始

### 环境要求

- **Go 1.24+**（用于构建后端）
- **Node ≥18**（仅构建时用于编译前端，生产环境无需 Node）
- 环境变量 **`ANTHROPIC_API_KEY`**（使用 `agent` 命令时需要）

### 构建与启动 Gateway

```bash
# 构建（推荐使用 Makefile）
make build

# 或使用脚本
./build.sh build   # 支持: ui | embed | go | build | clean | snapshot | release | docker

# 启动 Gateway
make run
# 或
./openocta gateway run
```

Gateway 默认监听 `http://127.0.0.1:18900`，HTTP 与 WebSocket 共用同一端口，**前端已通过 go:embed 内嵌在二进制中**，直接通过浏览器访问即可使用 Control UI。

### 开发模式（前端热更新）

```bash
# 终端 1：运行 Gateway（需要先构建一次）
./openocta gateway run

# 终端 2：运行前端 Dev Server（端口 5173）
make run-ui
```

浏览器访问 `http://localhost:5173` 即可调试前端。

### 使用 Agent CLI

```bash
export ANTHROPIC_API_KEY=your-key
./openocta agent -m "Hello, echo test"
```

### 配置文件

首次运行且配置文件不存在时，会自动从嵌入的 `openocta.json.example` 初始化并写入配置目录：

| 平台          | 默认配置目录                       |
|---------------|------------------------------------|
| Linux / macOS | `~/.openocta/openocta.json`       |
| Windows       | `%APPDATA%\openocta\openocta.json` |

### macOS 桌面安装（.dmg）

- **`.dmg`**：挂载后路径在 **`/Volumes/...`**（只读映像），将应用拖入「应用程序」或按首次运行弹窗安装到 **`/Applications/OpenOcta.app`**；**不要**把 `/Volumes` 下内容当成已安装副本，应在访达中**推出**磁盘映像。详见 `deploy/dist-README.md`。

---

## 文档与参考

### 文档语言映射

- **中文文档**
  - 根文档：`README.md`（本文件）
  - 后端：`src/README.md`
  - 前端：`ui/README.md`
- **English Docs**
  - Root: `README.en.md`

### 主要文档

- **后端总览**：`src/README.md`  
  模块说明、迁移状态与后端相关文档索引。
- **前端说明**：`ui/README.md`  
  Control UI 功能介绍、开发脚本与目录结构。
- **配置与能力**（位于 `src/docs/`）：
  - `configuration.md` — 配置总览：agents、channels、gateway、cron、hooks、memory 等。
  - `mcp-configuration.md` — MCP 服务器声明与权限、超时配置。
  - `request-tracing.md` — 请求追踪、token 用量与调用链记录。
  - `webhooks.md` — `/hooks/wake`、`/hooks/agent`、`/hooks/alert` 的请求/响应结构与适用场景。
  - `architecture.md` — 基于 agentsdk-go 的分层设计与扩展点。
  - `skills.md`、`tools.md`、`tools-builtin.md`、`tools-openocta.md` — 技能与工具系统的整体说明。

上游参考：

- [OpenClaw 官方仓库](https://github.com/openclaw/openclaw)
- [docs.openclaw.ai](https://docs.openclaw.ai)（包含 Gateway 协议、配置等官方文档）

---

## 项目结构

```text
OpenOcta/
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

---

## 版权声明

本仓库遵循 **GPLv3** 开源限制。

你可以基于 OpenOcta 的源代码进行二次开发，但是需要遵守以下规定：

- 不能替换和修改 OpenOcta 的 Logo 和版权信息；
- 二次开发后的衍生作品必须遵守 GPLv3 的开源义务。

如需商业授权，请联系：**sales@databuff.com**。
