# OpenOcta 架构概览

本项目在整体设计上大量借鉴了 [`agentsdk-go` 的架构设计文档](https://github.com/stellarlinkco/agentsdk-go/tree/main/docs)，并结合 Gateway、Webhook、技能系统等扩展能力，形成一套面向「聊天网关 + Agent 运行时」的完整方案。

本文从宏观到细节，介绍 OpenOcta 的：

- **整体分层与目录结构**
- **Agent 运行时与会话/记忆管理**
- **工具与 MCP 集成**
- **Gateway / Webhooks / 通知与告警**
- **技能（Skills）与扩展运行时**

---

## 一、整体分层架构

整体上可以类比 `agentsdk-go` 的分层（`pkg/api`、`pkg/agent`、`pkg/middleware`、`pkg/model`、`pkg/tool`、`pkg/runtime` 等），在此基础上，引入了 **Gateway HTTP 层**、**Webhook 扩展** 和 **工程化 Skill 机制**。

高层架构示意：

```text
┌──────────────────────────────────────────────────────────┐
│                     OpenOcta                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Gateway 层 (HTTP)                                 │  │
│  │  - /health /config /chat 等 HTTP API               │  │
│  │  - /hooks/* Webhooks (wake/agent/alert + mappings)│  │
│  │  - 统一认证（Gateway Auth + Hooks Token）          │  │
│  └────────────────────────────────────────────────────┘  │
│                              ↓                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Agent Runtime 层                                  │  │
│  │  - 会话与消息流转                                  │  │
│  │  - 模型调用与多轮对话循环                          │  │
│  │  - 内置工具 & MCP 工具                             │  │
│  │  - Memory / Session 管理                           │  │
│  └────────────────────────────────────────────────────┘  │
│                              ↓                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Runtime 扩展与 Skills                             │  │
│  │  - Skills 装载与匹配                               │  │
│  │  - Subagents / Tasks / Commands (按需)             │  │
│  └────────────────────────────────────────────────────┘  │
│                              ↓                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  基础能力与支撑模块                                │  │
│  │  - 配置管理 (config)                               │  │
│  │  - 日志与追踪 (logging / trace)                    │  │
│  │  - MCP 客户端 (mcp)                                │  │
│  │  - Sandbox / Security / FS 抽象                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 二、目录结构与模块职责

（仅列出与当前架构相关的核心目录）

```text
src/
├── pkg/
│   ├── gateway/                # HTTP 网关与对外 API
│   │   ├── http/               # HTTP Server 与 Webhooks
│   │   │   ├── server.go       # 网关启动、路由注册、认证等
│   │   │   └── hooks.go        # /hooks/* 端点与映射
│   │   └── handlers/           # 具体业务 Handler
│   │       ├── chat.go         # 聊天接口 (chat.send 等)
│   │       ├── agent.go        # Agent 相关 HTTP 接口
│   │       ├── health.go       # 健康检查
│   │       └── ...             # 其它网关 handler
│   │
│   ├── agent/                  # Agent 运行时与扩展
│   │   ├── runtime/            # Agent 核心运行时
│   │   │   ├── runtime.go      # 会话执行、模型调用、工具编排
│   │   │   ├── builtin_tools.go# 与 Gateway 集成的内置工具
│   │   │   └── system_prompt.go# 系统提示词、默认行为约定
│   │   └── skills/             # 技能系统
│   │       └── loader.go       # Skills 加载、索引与匹配
│   │
│   ├── config/                 # 配置（见 docs/configuration.md）
│   ├── logging/                # 日志子系统
│   └── ...                     # 其它支撑模块
│
└── skills/                     # 外部技能目录 (可扩展)
    └── k8s/                    # 示例：Kubernetes 相关技能
        └── SKILL.md            # 技能定义与使用说明
```

其中 Gateway 层与 Agent Runtime 层之间通过 `handlers.Context` 等结构解耦，Gateway 只关心 HTTP/认证/序列化，Agent Runtime 专注于会话、模型与工具调用。

---

## 三、Gateway 与 Webhooks

### 3.1 HTTP Gateway

Gateway 负责：

- HTTP Server 启动与端口绑定（见 `configuration.md` 中 `gateway` 配置）。
- 统一认证（Token / Password / Tailscale 等）。
- 路由注册：`/chat/*`、`/config/*`、`/health`、`/hooks/*` 等。
- 将请求转为内部 `handlers.Context`，再交由 Agent Runtime 处理。

Gateway 的配置与部署细节见：

- `src/docs/configuration.md`
- `src/docs/trace-and-observability.md`

### 3.2 Webhooks（/hooks/*）

Webhooks 是本项目在 `agentsdk-go` 之上的一大扩展，详见：

- `src/docs/webhooks.md`

核心能力：

- **`/hooks/wake`**：为主会话追加系统事件，并控制是否立即触发心跳。
- **`/hooks/agent`**：运行一个隔离的智能体回合，支持自定义 `sessionKey`、`channel`、`model`、`thinking` 等，始终在主会话中发布摘要。
- **`/hooks/alert`**：告警专用 Hook，将来自 Prometheus / Sentry / Grafana 等异构告警体标准化为统一告警分析 Prompt，并通过新会话 key 调用 `chat.send`。

Webhook 模块的设计目标：

- 将「外部事件源」与「会话/Agent 核心」解耦。
- 提供统一的认证、安全边界与扩展点（mappings / transforms）。
- 兼容多种事件形态：简单 wake、复杂 agent 调用、结构化告警。

---

## 四、Agent Runtime 与会话/记忆

### 4.1 Agent 核心循环（对标 agentsdk-go）

类似 `agentsdk-go` 的 `pkg/agent/agent.go`，OpenOcta 的 Runtime 负责：

- 将用户消息与历史上下文转换为模型请求（Prompt）。
- 驱动模型多轮生成（包含 Tool Calls / Tool Results）。
- 控制迭代次数、超时时间与错误收敛逻辑。
- 挂接 runtime 级别的内置工具（文件操作、Web、MCP、任务等）。

核心思路与 `agentsdk-go` 保持一致：

- **模型抽象**：通过统一接口屏蔽 Anthropic / OpenAI / 其它提供商差异。
- **工具执行**：模型发出的工具调用统一交由 ToolExecutor 处理。
- **状态管理**：在单次会话内维护迭代计数、工具结果与中间模型输出。

### 4.2 会话与 Memory 管理

结合 `agentsdk-go` 中的三层记忆理念（短期记忆 / Working Memory / 语义记忆），OpenOcta 在会话与 Memory 上的设计要点包括：

- **会话键 (sessionKey)**：
  - Gateway 层（包括 `/hooks/agent`、`/hooks/alert`）使用字符串 `sessionKey` 作为会话标识。
  - `hooks.alert` 会以 `agent:main:alert:<UUID>` 格式自动生成独立会话键。

- **会话存储**：
  - 底层通过 `sessions.reset` / `chat.send` 等方法进行持久化与检索。
  - 支持按会话 ID/Key 聚合历史消息，用于后续问答或告警追踪。

- **自动压缩与裁剪**：
  - 参考 `agentsdk-go` 的自动 Compact 思路，对长对话进行摘要与截断，以控制 Token 使用。
  - 结合追踪系统（trace-and-observability）进行用量与性能分析。

### 4.3 事件与追踪

OpenOcta 借鉴 `agentsdk-go` 的事件总线与 OTEL 追踪思路：

- 针对工具调用前后、上下文压缩前后、会话开始/结束等场景，发出结构化事件。
- 允许外部订阅组件（例如日志、Metrics、告警系统）基于事件进行观测与治理。
- 可选开启 OpenTelemetry，将关键路径纳入统一 Trace。

具体追踪细节见：

- `src/docs/trace-and-observability.md`

---

## 五、工具系统与 MCP 集成

### 5.1 工具抽象

工具系统沿用 `agentsdk-go` 类似的设计：

- 每个工具实现统一接口（名称、描述、Schema、Execute）。
- 通过注册表（Registry）统一管理工具的生命周期与调用。
- 支持：
  - 文件类工具：读取/写入/编辑文件、搜索/Glob 等。
  - 任务类工具：Subagent 任务创建、查询、更新、终止等。
  - Web 类工具：`webfetch` / `websearch`。
  - 交互类工具：`askuserquestion` / `todo_write` 等。

### 5.2 MCP（Model Context Protocol）

参考 `agentsdk-go` 中的 MCP 客户端与工具桥接：

- 在配置中声明 MCP 服务器（见 `mcp-configuration.md`）。
- 在运行时注册 MCP 工具到工具注册表中。
- 使用单一接口执行「本地工具」与「MCP 工具」，对 Agent 来说透明。

OpenOcta 侧重于「Gateway + Agent 运行时」的场景，因此 MCP 更多用于：

- 调用外部监控/告警系统（例如 Prometheus）。
- 与现有运维/业务系统进行集成。

---

## 六、Skills 与扩展运行时

### 6.1 Skills 机制

Skills 是 Project 级别的「能力包」，通常以 `SKILL.md` 的形式存在于 `src/skills/*` 下（例如 `k8s/SKILL.md`）：

- `pkg/agent/skills/loader.go` 负责：
  - 扫描 Skills 目录并解析 `SKILL.md`。
  - 懒加载技能内容（参考 `agentsdk-go` 中的懒加载策略，首用首读）。
  - 根据会话上下文与触发条件匹配合适的技能（Matcher）。

技能可以：

- 提供专业领域的系统 Prompt（如 Kubernetes、SRE、DBA 等）。
- 暴露领域专用工具（如 `kubectl` 包装、集群状态查询等）。
- 定制特定场景的输出格式与操作指南。

### 6.2 扩展运行时能力

借鉴 `agentsdk-go` 的 Runtime 扩展思想，OpenOcta 的 Runtime 未来可以增量支持：

- **子 Agent（Subagents）**：针对复杂任务拆分为多个专职 Agent。
- **Tasks 系统**：跨会话跟踪长任务的状态与依赖。
- **Slash Commands**：在聊天中以固定指令触发特定动作。

目前项目已优先落地：

- Webhooks + 告警分析。
- Skills 加载与 Kubernetes 示例。
- 基础的 Gateway / Agent Runtime 集成。

---

## 七、小结

- **继承**：OpenOcta 继承了 `agentsdk-go` 在 Agent 循环、工具抽象、MCP 集成、事件与追踪等方面的架构优势。
- **扩展**：在此基础上，重点扩展了 **Gateway HTTP 接入层**、**标准化 Webhooks（包括告警专用 `/hooks/alert`）** 以及 **工程化的 Skills 管理机制**。
- **目标**：提供一套可以直接部署在生产环境中的「多渠道聊天网关 + Agent 平台」，同时保持代码层面的简洁、可观测与安全性。 

