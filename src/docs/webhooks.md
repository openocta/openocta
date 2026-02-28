# Webhooks 说明

本文档基于 Gateway 中 `hooks.go` 的实际实现，以及官方文档 [`https://docs.openocta.ai/zh-CN/automation/webhook`](https://docs.openocta.ai/zh-CN/automation/webhook) 的约定，说明 OpenOcta Gateway 对外提供的 Webhook 接口：

- `/hooks/wake`
- `/hooks/agent`
- `/hooks/alert`（本仓库新增的告警专用 Hook）

并重点说明每个接口的适用场景、请求参数、响应结构及错误码含义。

---

## 统一配置与认证

### 启用与路径前缀

在配置文件中通过 `hooks` 段启用 Webhooks，例如：

```json5
{
  "hooks": {
    "enabled": true,
    "token": "shared-secret",
    "path": "/hooks"
  }
}
```

- **`enabled`**（boolean，可选）：是否启用 Webhook。  
- **`token`**（string，可选但**强烈推荐**）：用于保护 Webhook 的共享密钥。  
- **`path`**（string，可选）：Webhook 根路径前缀，默认为 `/hooks`。  

假设 `path` 最终解析为 `pathPrefix`（例如 `/hooks`），则三个核心端点分别为：

- `POST {pathPrefix}/wake`
- `POST {pathPrefix}/agent`
- `POST {pathPrefix}/alert`

例如默认配置下即为：

- `POST /hooks/wake`
- `POST /hooks/agent`
- `POST /hooks/alert`

### 认证方式

当配置了 `hooks.token` 时，所有 Webhook 请求必须携带正确的 Token，否则返回 `401`：

- **推荐**：`Authorization: Bearer <token>`
- 或：`X-OpenOcta-Token: <token>`

当前实现中 **不读取 URL 查询参数中的 `?token=...`**，与官网文档中“已弃用的 `?token` 方式”保持安全一致，但实现层面已不再支持。

### 通用错误码

对所有 `/hooks/*` 接口，如果出现以下情况，会返回对应 HTTP 状态码：

- **`404 Not Found`**
  - Hooks 未启用（`hooks.enabled=false`），或未配置。
  - 请求路径不以 `hooks.path` 为前缀，或子路径未匹配到任何已知 Hook（包括 `wake`、`agent`、`alert` 和配置的 `mappings`）。
- **`401 Unauthorized`**
  - 配置了 `hooks.token`，但请求未携带或携带了错误的 Token。
- **`405 Method Not Allowed`**
  - 非 `POST` 请求（所有 Hook 目前都只支持 `POST`）。

---

## `POST /hooks/wake` — 主会话系统事件唤醒

**侧重点**：  
为**主会话**加入一条“系统事件”文本，并按照模式选择是**立即触发心跳**，还是**等待下一次心跳**。适合简单的“有新事件，请去看一下”类场景。

### 功能概述

- 将请求体中的 `text` 以系统事件的形式投递到主会话队列中。
- 根据 `mode` 决定是否立即触发心跳。

### 请求体

```json
{
  "text": "New email received",
  "mode": "now"
}
```

- **`text`**（string，**必填**）：  
  简要描述本次事件的文本，例如 `"New email received"`、`"订单状态发生变更"` 等。

- **`mode`**（string，可选，`"now"` | `"next-heartbeat"`）：  
  - `"now"`：在当前请求完成后立即触发心跳，尽快让 Agent 感知到该事件。  
  - `"next-heartbeat"`：仅写入事件队列，等待下一轮心跳再处理。  
  - **当前实现的默认值**：如果未提供或非法，将回退为 `"next-heartbeat"`（与官网文档的默认值 `"now"` 略有差异，以本仓库代码为准）。

### 响应

- **成功**

  - HTTP 状态码：`200 OK`
  - 响应体：

    ```json
    { "ok": true }
    ```

- **失败**

  - `400 Bad Request`：请求体不是合法 JSON。
  - `501 Not Implemented`：`ctx.HooksWake` 未配置，Gateway 当前并未提供实际处理逻辑。

---

## `POST /hooks/agent` — 运行隔离智能体回合（可配置模型/渠道）

**侧重点**：  
运行一个**隔离的智能体回合**（使用独立的 `sessionKey`），并**始终在主会话中发布摘要**。  
支持覆盖模型、思考级别、超时时间、消息投递渠道等参数，适合有条件自定义结构体、需要更高控制力的集成场景（推荐优先使用）。

### 功能概述

- 为本次 Hook 调用运行一次 Agent 回合，形成独立会话（可手动/自动指定 `sessionKey`）。
- 可以选择是否将回复投递到某个消息渠道（如 WhatsApp、Telegram、Slack 等）。
- 始终在**主会话**中写入一条摘要消息，便于人工审计与回溯。

### 请求体

```json
{
  "message": "Run this",
  "name": "Email",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

对应 `hooksPayloadAgent` 结构体：

- **`message`**（string，**必填**）：  
  本次需要 Agent 处理的核心指令或提示词。如果为空，接口会返回 `400`。

- **`name`**（string，可选）：  
  本次 Hook 的可读名称，例如 `"GitHub"`、`"Email"`，通常用于会话摘要前缀，让主会话中更容易区分来源。

- **`sessionKey`**（string，可选）：  
  标识本次 Hook Agent 会话的键。  
  - 如果指定同一个 `sessionKey` 多次调用，可以在 Hook 上下文里形成多轮对话。  
  - 如果留空，由上层逻辑生成默认值（实现细节可结合 `handlers.HooksAgentParams` 查看）。

- **`wakeMode`**（string，可选，`"now"` | `"next-heartbeat"`）：  
  控制心跳触发时机，语义与 `/hooks/wake` 的 `mode` 类似。

- **`deliver`**（boolean，可选，默认 `true`）：  
  是否将本次 Agent 的回复实际发送到消息渠道。  
  - 若为 `false`，只在主会话中记录摘要，不发送“实际对话回复”到外部渠道。

- **`channel`**（string，可选）：  
  指定用于投递回复的渠道：
  - `last`（默认）：使用主会话中最近一次消息的渠道。
  - `whatsapp` / `telegram` / `discord` / `slack` / `signal` / `imessage` / `msteams` / `mattermost`（插件）等。

- **`to`**（string，可选）：  
  渠道的接收者标识符，例如：
  - WhatsApp / Signal：电话号码（如 `+15551234567`）
  - Telegram：聊天 ID
  - Discord / Slack / Mattermost：频道 ID
  - MS Teams：会话 ID

- **`model`**（string，可选）：  
  指定本次运行使用的模型 ID 或别名，例如：`"anthropic/claude-3-5-sonnet"`、`"openai/gpt-5.2-mini"` 等。  
  若配置开启了 `agents.defaults.models` 限制，则必须在允许列表内。

- **`thinking`**（string，可选）：  
  覆盖本次运行的“思考级别”，如 `"low"`、`"medium"`、`"high"` 等，具体可参考 Agent 运行配置。

- **`timeoutSeconds`**（number，可选）：  
  本次智能体运行的最长持续时间（秒），超时后将中止本次运行。

### 响应

- **成功**

  - HTTP 状态码：`202 Accepted`
  - 响应体：

    ```json
    { "runId": "<run-id>" }
    ```

  其中：

  - **`runId`**：本次 Agent 运行的唯一标识，可用于后续查询运行状态或日志。

- **失败**

  - `400 Bad Request`：JSON 解析失败，或缺少必填字段 `message`。
  - `401 Unauthorized`：Token 错误或缺失。
  - `404 Not Found`：Hooks 未启用或路径不匹配。
  - `501 Not Implemented`：`ctx.HooksAgent` 未配置，Gateway 尚未接入 Agent 运行逻辑。

---

## `POST /hooks/alert` — 告警专用 Hook（固定结构 + 自定义分析 Prompt）

**侧重点**：  
用于接收来自各种监控/告警系统的告警信息，**统一转成固定格式的 SRE 告警分析 Prompt**，  
由默认 Agent 进行分析，自动生成排查建议等内容。  

特点：

- 接受一个相对固定、面向告警的结构体，便于对接多个异构告警源。
- **不允许**在请求体中选择模型、思考等级、发送渠道等高级控制项，全部使用网关与 Agent 的默认配置。
- 每一次调用都会创建**独立的会话 key**，不会与其它 Hook 复用上下文。
- 内置一段针对“告警分析”的中文 Prompt，输出更贴合 SRE/运维场景。

### 功能概述

调用流程（简化说明）：

1. 按 `hooksPayloadAlert` 尝试解析请求体，不匹配或缺少 `message` 时，回退为“将整个原始 JSON 文本作为 `message`”。  
2. 基于告警内容构建一个结构化的中文告警分析 Prompt（`buildAlertPrompt`）。  
3. 生成新的会话键：`agent:main:alert:<UUID>`。  
4. 通过 `sessions.reset` 在 `sessions.json` 中创建/重置对应会话。  
5. 调用 `chat.send`，以刚才的会话键和告警 Prompt 触发一次 Agent 回合。  
6. 返回包含 `runId` 和 `sessionKey`（以及可选的 `sessionId`）的 JSON，供调用方追踪。

### 请求体

推荐的规范结构（对应 `hooksPayloadAlert`）：

```json
{
  "alertId": "alert-123",
  "title": "CPU 使用率过高",
  "message": "节点 node-1 的 CPU 使用率在 5 分钟内持续超过 90%",
  "severity": "critical",
  "source": "prometheus",
  "data": {
    "instance": "node-1",
    "metric": "cpu_usage",
    "threshold": 0.9,
    "current": 0.95
  }
}
```

字段说明：

- **`alertId`**（string，可选）：  
  告警在上游系统中的唯一标识，例如 Prometheus Alert ID、告警规则 ID 等，便于交叉排查。

- **`title`**（string，可选）：  
  告警标题。若为空，将在 Prompt 中回退为 `"未命名告警"`。

- **`message`**（string，可选但**强烈推荐**）：  
  告警的自然语言描述。如果解析失败或该字段为空，将直接使用**原始 JSON 文本**作为 `message`，以提升与不同告警源的兼容性。

- **`severity`**（string，可选）：  
  告警严重级别，例如 `"info"`、`"warning"`、`"critical"` 等。  
  若为空，将在 Prompt 中回退为 `"unknown"`。

- **`source`**（string，可选）：  
  告警来源系统名称，例如 `"prometheus"`、`"sentry"`、`"grafana"` 等。  
  若为空，将在 Prompt 中回退为 `"unknown"`。

- **`data`**（object，可选）：  
  用于承载**额外的原始告警数据**，可以是任意 JSON 结构。  
  - 建议将上游告警体中无法直接映射到前几个字段的内容，全部原样放入 `data`。  
  - 网关会将 `data` 尝试 `json.MarshalIndent` 为格式化的 JSON 文本，并追加到 Prompt 的“【原始数据(JSON)】”段落中，方便 Agent 分析。

> 兼容性说明：  
> 实现内部会先把请求体读入 `json.RawMessage`，再尝试解析成 `hooksPayloadAlert`。  
> 如果解析失败，或者解析成功但 `message` 为空，则自动将原始 JSON 字符串设为 `message`。  
> 这样即便上游告警体并非上述结构，也只要是合法 JSON，就仍然可以被告警分析 Agent 处理。

### 内置告警分析 Prompt（简要说明）

`buildAlertPrompt` 会构造类似如下语义的中文提示词（实际内容略有删减）：

- 角色：资深 SRE/运维告警分析助手。
- 任务：
  1. 识别可能的根因；  
  2. 评估影响范围与紧急程度；  
  3. 给出分步骤排查建议；  
  4. 必要时给出临时缓解措施与后续优化建议。  
- 输出要求：使用简体中文，并用结构化小标题组织结果。
- 附带字段：告警标题、严重级别、来源系统、告警 ID、描述和原始数据（JSON）。

调用方无需在请求体中自行构造 Prompt，只需传入结构化告警信息即可。

### 响应

- **成功**

  - HTTP 状态码：`202 Accepted`
  - 响应体（示例）：

    ```json
    {
      "runId": "run-abc",
      "sessionKey": "agent:main:alert:0a1b2c3d-...",
      "sessionId": "sess-xyz"
    }
    ```

  字段说明：

  - **`runId`**（string，可为空）：`chat.send` 返回的运行 ID，用于排查/追踪本次告警分析任务。  
  - **`sessionKey`**（string，必有）：本次告警对应的会话键，格式类似 `agent:main:alert:<UUID>`。  
  - **`sessionId`**（string，可选）：如果 `sessions.reset` 的返回中包含 `entry.sessionId`，则会透传该字段，代表底层会话存储系统中的实体 ID。

- **失败**

  - `400 Bad Request`：请求体不是合法 JSON。  
  - `401 Unauthorized`：Token 错误或缺失。  
  - `404 Not Found`：Hooks 未启用或路径不匹配。  
  - `501 Not Implemented`：`ctx` 为空或未配置 `InvokeMethod`（无法调用 `sessions.reset` / `chat.send`）。  
  - `500 Internal Server Error`：
    - 调用 `sessions.reset` 失败（创建/重置会话失败）。  
    - 调用 `chat.send` 失败（无法将告警分发给 Agent）。  

### 与 `/hooks/agent` 的对比与选择建议

- **`/hooks/agent`**
  - 面向“**自由文本指令 + 可选高级参数**”的调用方式。
  - 允许指定模型、思考级别、渠道、是否投递等。
  - 更适合需要精细控制 Agent 行为、或非告警类的业务集成。

- **`/hooks/alert`**
  - 面向“**标准化告警输入 + 固定告警分析 Prompt**”的调用方式。
  - 不允许在请求体中控制模型、思考级别、投递渠道等，高级配置由系统统一管理。
  - 更适合集中化的告警分析与自动化运维场景，调用方只需关心“把告警发进来”。

如果你能够在调用端自定义结构体并希望控制更多运行参数，**推荐优先使用 `/hooks/agent`**。  
如果只是希望将各种不同格式的告警统一送入一个“告警分析 Agent”中处理，且不关心具体模型/渠道细节，则**推荐使用 `/hooks/alert`**。

---

## 安全建议

综合 [`https://docs.openocta.ai/zh-CN/automation/webhook`](https://docs.openocta.ai/zh-CN/automation/webhook) 的官方建议与本仓库实现：

- **部署范围**：尽量将 Webhook 端点暴露在 loopback、VPN/tailnet 或受信任的反向代理之后，避免直接暴露在公网。  
- **独立 Token**：为 Webhook 使用单独的 `hooks.token`，不要与 Gateway 其他认证 token 复用。  
- **日志脱敏**：避免在 Webhook 日志中直接记录包含敏感信息的原始请求体（尤其是 `/hooks/alert` 中的 `data` 字段）。  
- **输入视为不可信**：  
  - 默认情况下，所有 Webhook 请求体均视为不受信任数据，仅在内部以安全的方式交由 Agent 分析。  
  - 若在自定义 Hook 映射中需要关闭外部内容安全包装（`allowUnsafeExternalContent: true`），请仅在完全受信任的内部来源场景下使用。

