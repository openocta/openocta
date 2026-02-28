# OpenOcta Control UI

与 [OpenClaw Gateway](https://docs.openclaw.ai/gateway) WebSocket 协议兼容的 Control UI 前端。基于 Lit + Vite 的单页应用，通过 WebSocket 连接 Gateway，管理会话、配置、通道、Cron、Skills、Nodes 等。

## 要求

- **Node ≥18**（开发与构建）
- **pnpm** 推荐（也可使用 npm / bun）

## 脚本

```bash
# 安装依赖
pnpm install

# 开发模式（默认 http://localhost:5173）
pnpm dev

# 构建（输出到 ../dist/control-ui）
pnpm build

# 预览构建产物
pnpm preview

# 运行测试
pnpm test
```

开发模式下可配置 Gateway WebSocket URL，与本地或远程 Gateway 联调。

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENCLAW_CONTROL_UI_BASE_PATH` | 前端静态资源 base path（如 `/control-ui/`），构建时生效；未设置时使用 `./` |

## 项目结构

```
ui/
├── index.html              # 入口 HTML（标题：OpenOcta Control）
├── vite.config.ts          # Vite 配置（base、端口 5173、输出 dist/control-ui）
├── src/
│   ├── main.ts             # 入口脚本
│   ├── styles.css          # 全局样式
│   └── ui/
│       ├── app.ts          # 根组件 openclaw-app
│       ├── app-render.ts   # 主布局与页面渲染
│       ├── app-chat.ts     # 聊天宿主与消息队列
│       ├── gateway.ts      # Gateway WebSocket 客户端（connect/hello-ok、req/res、events）
│       ├── navigation.ts   # 路由与 Tab 定义
│       ├── controllers/    # 数据加载与操作（sessions、chat、config、channels、cron、skills、nodes、usage、debug、logs 等）
│       └── views/          # 各 Tab 视图
├── public/                 # 静态资源（favicon 等）
└── README.md               # 本说明
```

## 功能模块（Tab）

UI 通过 Tab 分组组织，与 Gateway 的 config、sessions、channels、cron、skills、nodes 等能力对应：

| 分组 | Tab | 说明 |
|------|-----|------|
| **Chat** | Chat | 会话列表与聊天界面，发送消息、查看历史、附件 |
| **Control** | Overview | 总览与健康状态 |
| | Channels | 通道状态与配置 |
| | Instances | 实例列表 |
| | Sessions | 会话管理 |
| | Usage | 使用量与时间序列 |
| | Cron Jobs | 定时任务列表与启停 |
| **Agent** | Agents | Agent 配置、文件、工具、Skills、Channels、Cron |
| | Skills | Skills 列表与启用/禁用 |
| | Nodes | 节点列表与能力 |
| **Settings** | Config | 配置文件（openclaw.json）编辑 |
| | Debug | 调试方法调用 |
| | Logs | 日志查看 |

## 技术栈

- **Lit** — 组件与模板
- **Vite** — 开发与构建
- **marked** + **DOMPurify** — Markdown 渲染与安全
- **@noble/ed25519** — 设备身份与签名（Gateway 认证）
- **Vitest** + **@vitest/browser-playwright** — 单元与浏览器测试

## 与 Gateway 的对接

- **连接**：通过 `GatewayBrowserClient`（`gateway.ts`）建立 WebSocket，完成 connect/hello-ok 握手。
- **认证**：支持 token、password 或设备身份（ed25519 签名）。
- **协议**：请求/响应（req/res）及服务端推送事件（event），与 [Gateway 协议](https://docs.openclaw.ai/gateway) 一致。

构建产物 `dist/control-ui` 可被 Go Gateway 作为静态资源托管，从而通过同一端口提供 Control UI 与 WebSocket。

## 文档与参考

- [OpenClaw 官方](https://github.com/openocta/openocta) — 上游项目
- [docs.openclaw.ai](https://docs.openclaw.ai) — 官方文档
- [Gateway 协议](https://docs.openclaw.ai/gateway) — WebSocket 握手与 req/res 格式
- [项目根 README](../README.md) — 整体项目结构与后端说明
