# OpenOcta Go Backend

Go 实现的后端，迁移自 TypeScript/Node.js。与前端 Control UI 及 Gateway WebSocket 协议兼容。

## 要求

- Go 1.24+
- 环境变量：`ANTHROPIC_API_KEY`（agent 命令需配置）

## 构建

```bash
go build -o openocta ./cmd/openocta
```

## 运行

```bash
# 显示帮助
go run ./cmd/openocta --help

# 启动 Gateway（默认端口 18789）
go run ./cmd/openocta gateway run

# 运行 Agent（需 ANTHROPIC_API_KEY）
go run ./cmd/openocta agent -m "Hello, echo test"
```

## 命令

| 命令 | 说明 |
|------|------|
| `gateway run` | 启动 Gateway HTTP + WebSocket 服务 |
| `agent -m <msg>` | 本地执行 Agent（使用 agentsdk-go + DefaultTools） |
| `node` | Node 控制（占位） |

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENOCTA_STATE_DIR` | 状态目录（默认 `~/.openocta`） |
| `OPENOCTA_CONFIG_PATH` | 配置文件路径 |
| `OPENOCTA_SKIP_CHANNELS` | 设为 `1` 跳过 channel 加载 |
| `OPENOCTA_SKIP_CRON` | 设为 `1` 跳过 Cron 服务 |
| `OPENOCTA_SKIP_PROVIDERS` | 同 `SKIP_CHANNELS` 的兼容别名 |
| `ANTHROPIC_API_KEY` | Agent 模型认证（agent 命令必填） |

## 测试

```bash
go test ./...
```

协议兼容性测试位于 `test/gateway_protocol_test.go`，覆盖 connect/hello-ok、health 请求及 frame 序列化。

## 项目结构

```
src_go/
├── cmd/openocta/          # CLI 入口与子命令
├── pkg/
│   ├── agent/             # Agent Runtime（agentsdk-go）+ 工具桥接
│   ├── acp/               # ACP server/client 骨架
│   ├── autoreply/         # 回复派发与队列
│   ├── channels/          # 通道抽象、registry、Discord/Telegram/Slack/WhatsApp
│   ├── config/            # 配置 schema 与加载
│   ├── cron/              # 定时任务 service/store/schedule
│   ├── gateway/           # HTTP 路由、WebSocket Hub、handlers
│   ├── hooks/             # Hook 注册与 loader
│   ├── memory/            # Memory Manager 骨架
│   ├── paths/             # 状态目录、配置路径解析
│   ├── plugin-sdk/        # 插件 SDK 类型与 loader
│   └── ...
├── test/                   # 协议兼容性测试
└── docs/                   # Phase 契约文档
```

## 模块说明

| 模块 | 路径 | 说明 |
|------|------|------|
| Gateway | `pkg/gateway/` | HTTP + WebSocket、connect 握手、config/sessions/models/cron/channels handlers |
| Agent | `pkg/agent/` | Runtime 封装、EchoTool、DefaultTools |
| Channels | `pkg/channels/` | 内置 Discord/Telegram/Slack/WhatsApp 插件 |
| Cron | `pkg/cron/` | 任务 CRUD、存储、调度 |
| Config | `pkg/config/` | OpenOctaConfig schema、JSON 解析 |
| Auto-reply | `pkg/autoreply/` | Dispatcher、ReplyPayload、串行队列 |
| Memory | `pkg/memory/` | Manager 接口、NoopManager 骨架 |

## 文档链接

- [docs.openocta.ai](https://docs.openocta.ai) — 官方文档
- [Gateway 协议](https://docs.openocta.ai/gateway) — WebSocket 握手与 req/res 格式
