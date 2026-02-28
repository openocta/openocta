# OpenOcta 扩展工具说明（gateway/cron/sessions 等）

在内置通用工具之外，OctopusClaw 还通过 `pkg/agent/tools` 暴露了一组与网关和调度系统紧密结合的工具。这些工具以 [`agentsdk-go` 的 tool.Tool 接口](https://github.com/stellarlinkco/agentsdk-go/tree/main/docs) 为基础，由 Gateway 通过 `GatewayInvoker` 实现实际调用。

本文介绍：

- 工具注册与默认工具集
- 扩展工具：`echo` / `cron` / `gateway_config` / `sessions`

---

## 一、工具注册与默认工具集

### 1.1 Registry

`pkg/agent/tools/bridge.go` 中定义了一个简易工具注册表：

```go
type Registry struct {
    tools []tool.Tool
}

func NewRegistry() *Registry
func (r *Registry) Register(t tool.Tool)
func (r *Registry) Tools() []tool.Tool
```

Gateway 在创建 Runtime 前，可以：

1. 创建一个 `tools.Registry`；
2. 向其中注册自定义工具；
3. 将 `registry.Tools()` 追加到 Runtime 的 `Options.Tools`，与 `BuiltinTools` 一并传入。

### 1.2 DefaultTools / DefaultToolsWithInvoker

`DefaultTools` 与 `DefaultToolsWithInvoker` 提供了一个标准工具集：

```go
func DefaultTools() []tool.Tool {
    return []tool.Tool{EchoTool{}}
}

func DefaultToolsWithInvoker(invoker GatewayInvoker) []tool.Tool {
    list := []tool.Tool{EchoTool{}}
    if invoker != nil {
        list = append(list,
            CronTool{Invoker: invoker},
            GatewayTool{Invoker: invoker},
            SessionsTool{Invoker: invoker},
        )
    }
    return list
}
```

- 当 `invoker == nil` 时，仅提供 `echo` 演示工具；
- 当 `invoker` 由 Gateway 实现时，额外注入：
  - `cron`：调度与定时任务管理；
  - `gateway_config`：配置读取；
  - `sessions`：会话列表与预览。

---

## 二、EchoTool：简单示例工具

### 2.1 功能

`EchoTool` 是一个最小可用工具示例，用于演示如何实现 `tool.Tool` 接口。

接口实现要点：

```go
type EchoTool struct{}

func (EchoTool) Name() string        { return "echo" }
func (EchoTool) Description() string { return "Echo back the input text (demo tool)" }
func (EchoTool) Schema() *tool.JSONSchema { ... }
func (EchoTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) { ... }
```

### 2.2 参数与行为

- 参数 Schema：
  - `text`（string，必填）：要原样返回的文本。
- 行为：
  - `text` 为空时：`Success=false`，输出 `"text is required"`；
  - 否则：`Success=true`，输出 `text`。

### 2.3 适用场景

- 调试工具调用链是否正常；
- 演示如何书写和注册一个自定义工具（见后文“如何自定义一个工具”）。

---

## 三、CronTool：定时任务与调度

### 3.1 功能

`CronTool` 将 Gateway 的 `cron.*` 方法暴露给 Agent，可以在会话中管理和运行定时任务。

```go
type CronTool struct {
    Invoker GatewayInvoker
}

func (CronTool) Name() string        { return "cron" }
func (CronTool) Description() string { return "List, add, update, remove, or run scheduled cron jobs. Actions: status, list, add, update, remove, run, runs, wake." }
```

### 3.2 参数 Schema（摘要）

```json5
{
  "action": "status | list | add | update | remove | run | runs | wake", // 必填
  "includeDisabled": true,           // list: 是否包含禁用任务
  "jobId": "job-123",                // update/remove/run/runs 的 Job ID
  "id": "job-123",                   // jobId 的别名
  "name": "My Job",                  // add: 任务名称
  "schedule": { ... },               // add/update: 调度信息
  "payload": { ... },                // add: 触发时的 payload（通常是 wake/agent 请求体）
  "sessionTarget": "main|isolated",  // 任务触发时使用的会话策略
  "wakeMode": "now|next-heartbeat",  // 触发 wake 时的模式
  "enabled": true,                   // add: 是否启用
  "patch": { ... },                  // update: 部分字段更新
  "text": "New event",               // wake: 唤醒文本
  "mode": "due|force",               // run: 运行模式
  "limit": 50                        // runs: 查询历史运行条数
}
```

### 3.3 内部调用

执行时会调用：

```go
method := "cron." + action
ok, payload, err := t.Invoker.Invoke(method, params)
```

返回：

- `Success=false` + 消息字符串：表示调用失败或 invoker 未配置；
- `Success=true` + `Output` 为 JSON 字符串：表示调用成功，payload 经 `json.Marshal` 序列化。

---

## 四、GatewayTool：配置读取

### 4.1 功能

`GatewayTool` 暴露网关的 `config.get` 与 `config.schema`：

```go
type GatewayTool struct {
    Invoker GatewayInvoker
}

func (GatewayTool) Name() string        { return "gateway_config" }
func (GatewayTool) Description() string { return "Read OpenOcta config or config schema. Actions: get, schema." }
```

### 4.2 参数 Schema

```json5
{
  "action": "get | schema",            // 必填
  "path": "gateway.hooks.enabled"      // 可选，仅对 get 生效
}
```

### 4.3 典型用法

- `action = "schema"`：让 Agent 理解配置的完整结构；
- `action = "get"` + `path`：查询某个具体配置路径的当前值，例如：
  - `agents.defaults.workspace`
  - `hooks.enabled`

执行时同样通过 `Invoker.Invoke("config."+action, params)` 调用 Gateway。

---

## 五、SessionsTool：会话列表与预览

### 5.1 功能

`SessionsTool` 用于查询会话列表或预览某个会话历史片段：

```go
type SessionsTool struct {
    Invoker GatewayInvoker
}

func (SessionsTool) Name() string        { return "sessions" }
func (SessionsTool) Description() string { return "List or query chat sessions. Actions: list, preview. Use sessions.list to list session keys." }
```

### 5.2 参数 Schema

```json5
{
  "action": "list | preview",           // 必填
  "sessionKey": "agent:main:xxx",       // preview: 要预览的会话键
  "limit": 20                           // list: 返回条数上限
}
```

### 5.3 SessionIDFromSessionKey

在没有 `sessions.json` 条目的情况下，工具会使用：

```go
func SessionIDFromSessionKey(sessionKey string) string
```

将 `sessionKey` 规范化为 `sessionID`，其规则包括：

- 空字符串 → `"main"`；
- 格式 `"agent:main:<id>"` → 返回 `<id>`；
- 单段且符合安全 ID 的字符串 → 直接返回；
- 其他情况 → `"main"`。

这保证了在没有完整存储时，仍然可以稳定地推导会话 ID。

---

## 六、如何自定义一个工具并注册

以下是自定义工具的一般步骤。

### 6.1 实现 `tool.Tool` 接口

在合适的包（例如 `pkg/agent/tools` 或新建 `pkg/agent/tools/custom`）中定义结构体并实现接口：

```go
type MyTool struct {
    // 可选：注入依赖，如 GatewayInvoker、配置等
}

func (MyTool) Name() string {
    return "my_tool"
}

func (MyTool) Description() string {
    return "简要描述这个工具的用途"
}

func (MyTool) Schema() *tool.JSONSchema {
    return &tool.JSONSchema{
        Type: "object",
        Properties: map[string]interface{}{
            "foo": map[string]interface{}{
                "type":        "string",
                "description": "示例参数 foo",
            },
        },
        Required: []string{"foo"},
    }
}

func (t MyTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
    foo, _ := params["foo"].(string)
    if foo == "" {
        return &tool.ToolResult{Success: false, Output: "foo is required"}, nil
    }
    // 在此实现你的业务逻辑
    result := "处理结果: " + foo
    return &tool.ToolResult{Success: true, Output: result}, nil
}
```

### 6.2 通过 Registry 注册

在 Gateway 创建 Runtime 之前：

```go
reg := tools.NewRegistry()
reg.Register(MyTool{/* 可注入依赖 */})

// 与 BuiltinTools 一起传入 Runtime
rt, err := runtime.New(ctx, runtime.Options{
    ProjectRoot: projectRoot,
    Tools:       reg.Tools(), // 或 append 到已有 Tools 列表
    // 其它选项...
})
```

Runtime 启动后，模型即可通过工具调用机制使用 `"my_tool"`。

### 6.3 与 Gateway 集成（可选）

如果你的工具需要调用 Gateway 内部方法，可以模仿 `CronTool`、`GatewayTool` 的写法：

1. 在结构体中持有 `GatewayInvoker`；
2. 在 `Execute` 中通过 `Invoker.Invoke("some.method", params)` 调用 Gateway；
3. 将 `GatewayInvoker` 实现从 Gateway 侧注入。

---

## 七、小结

- `pkg/agent/tools` 提供了一个简洁的桥接层，将 OpenOcta 自身能力（配置、会话、调度等）暴露为工具；
- 扩展工具与内置工具共享相同的接口与调用机制；
- 你可以很方便地在本项目中实现自定义工具，并在 Runtime 启动时注册进去，使大模型能够直接操控你的业务逻辑与基础设施。
