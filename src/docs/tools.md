# 工具系统总览（Tools）

OpenOcta 的工具系统基于 [`agentsdk-go` 的 Tool 抽象](https://github.com/stellarlinkco/agentsdk-go/tree/main/docs)，并结合自身的 Gateway 与调度能力，向大模型暴露了一套统一的「可调用工具」界面。

在运行时，工具主要分为三类：

1. **内置通用工具**（文件/搜索/Web/任务等）  
2. **OpenOcta 扩展工具**（cron、sessions、gateway_config、echo 等）  
3. **用户自定义工具**（根据项目需求扩展）

---

## 一、内置通用工具

由 `pkg/agent/runtime/builtin_tools.go` 注入，创建 Runtime 时默认启用：

```go
tools := BuiltinTools(projectRoot)
```

包含但不限于：

- **Bash/文件类**：`bash`、`file_read`、`file_write`、`file_edit`
- **搜索与定位**：`grep`、`glob`
- **网络与 Web**：`webfetch`、`websearch`
- **任务与进程**：`bash_output`、`bash_status`、`kill_task`、`task_create`、`task_list`、`task_get`、`task_update`
- **用户交互**：`askuserquestion`

详细说明见：

- `tools-builtin.md`

---

## 二、OpenOcta 扩展工具

定义于 `pkg/agent/tools`，用于桥接 Gateway 与内部能力：

- **`echo`**：最小演示工具，回显输入文本；
- **`cron`**：与 Gateway 的 `cron.*` API 交互，管理定时任务；
- **`gateway_config`**：调用 `config.get` / `config.schema`，查询配置；
- **`sessions`**：调用 `sessions.list` / `sessions.preview`，管理与预览会话。

这些工具通过 `GatewayInvoker` 与 Gateway 解耦，由 `DefaultToolsWithInvoker` 打包注入到 Runtime。

详细说明见：

- `tools-openocta.md`

---

## 三、工具调用与安全约束

所有工具都实现同一接口（在 agentsdk-go 中定义）：

```go
type Tool interface {
    Name() string
    Description() string
    Schema() *JSONSchema
    Execute(ctx context.Context, params map[string]interface{}) (*ToolResult, error)
}
```

运行时特性：

- 大模型在推理过程中会根据工具的 `Name`、`Description`、`Schema` 决定何时调用哪个工具；
- 所有工具执行都被沙箱约束（文件/网络/资源限制），具体规则由 `SandboxOptions` 控制；
- 工具结果通过 `ToolResult` 回传给模型，用于构造最终回复或后续工具调用。

---

## 四、编写与注册自定义工具

编写自定义工具的一般流程：

1. **实现接口**：在项目中定义一个结构体，实现 `Name/Description/Schema/Execute` 四个方法；
2. **注册到 Registry**：使用 `pkg/agent/tools.Registry` 或在创建 Runtime 时直接将你的工具加入 `Options.Tools` 列表；
3. **（可选）集成 Gateway**：如果工具需要访问 Gateway 内部 API，可通过 `GatewayInvoker` 在 `Execute` 中调用网关方法；
4. **重新启动 Gateway/Agent**：使新的工具被加载并可供大模型使用。

具体示例与代码片段，请参考：

- `tools-openocta.md` 中的「如何自定义一个工具并注册」小节。

---

## 五、与 Skills 的关系

工具与 Skills 的职责边界：

- **工具（Tools）**：提供「可以被调用的动作」，例如访问文件、发起 HTTP 请求、修改配置、管理 cron 任务等。
- **技能（Skills）**：提供「领域知识与工作方式」，通常以 `SKILL.md` 的形式存在，为模型提供额外上下文与使用工具的指南。

在实际对话中：

- Skill 会告诉模型「可以做什么、怎么做」；
- Tool 则是模型真正执行动作的手段。

更多关于 Skills 的内容，请参见：

- `skills.md`

