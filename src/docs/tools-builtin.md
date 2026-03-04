# 内置工具说明（agentsdk-go Builtin Tools）

OpenOcta 通过 `pkg/agent/runtime/builtin_tools.go` 将 [`agentsdk-go` 的内置工具](https://github.com/stellarlinkco/agentsdk-go/tree/main/docs)注入到运行时中，为大模型提供一套开箱即用的通用能力。

创建 Runtime 时，会调用：

```go
tools := BuiltinTools(projectRoot)
// ...
apiOpts.Tools = tools
```

本篇文档简要介绍这些内置工具的作用与典型使用场景。

---

## 一、文件与编辑相关工具

### 1.1 `bash`

- **来源**：`NewBashToolWithRoot(projectRoot)`
- **能力**：在受限沙箱中执行 Shell 命令，输出标准输出/错误。
- **典型用途**：
  - 编译/运行测试命令（例如 `go test ./...`）
  - 查看目录与文件（`ls`, `cat` 等）
- **注意事项**：
  - 运行在 agentsdk-go 的文件/网络沙箱中，不能视为拥有完整系统权限。

### 1.2 `file_read`（Read）

- **来源**：`NewReadToolWithRoot(projectRoot)`
- **能力**：读取工作区中的文件内容。
- **适用场景**：
  - 阅读代码、配置、日志等文本文件。

### 1.3 `file_write`（Write）

- **来源**：`NewWriteToolWithRoot(projectRoot)`
- **能力**：将内容写入指定文件（覆盖写入或创建新文件）。
- **适用场景**：
  - 生成配置文件、补充 README、写入简单结果。

### 1.4 `file_edit`（Edit）

- **来源**：`NewEditToolWithRoot(projectRoot)`
- **能力**：对现有文件执行「基于补丁」的编辑操作。
- **适用场景**：
  - 局部修改代码、追加/删除配置项。

---

## 二、搜索与定位相关工具

### 2.1 `grep`

- **来源**：`NewGrepToolWithRoot(projectRoot)`
- **能力**：在项目内搜索文本内容（类似 `rg/grep`），支持上下文、分页。
- **适用场景**：
  - 查找函数/结构体定义；
  - 搜索错误信息或日志片段。

### 2.2 `glob`

- **来源**：`NewGlobToolWithRoot(projectRoot)`
- **能力**：使用 glob 模式查找文件路径（如 `**/*.go`）。
- **适用场景**：
  - 发现特定类型文件；
  - 与 `grep` 配合进行更精确的搜索。

---

## 三、Web 访问相关工具

### 3.1 `webfetch`

- **来源**：`NewWebFetchTool(nil)`
- **能力**：获取指定 URL 的网页内容，并转换为可读文本。
- **适用场景**：
  - 拉取在线文档；
  - 查看某个 HTTP 接口返回。

### 3.2 `websearch`

- **来源**：`NewWebSearchTool(nil)`
- **能力**：执行基于 Web 的搜索，并返回摘要结果。
- **适用场景**：
  - 查询外部资料或最新文档；
  - 辅助推理需要的背景信息。

---

## 四、任务与进程相关工具

### 4.1 `bash_output`

- **来源**：`NewBashOutputTool(nil)`
- **能力**：查询此前异步 Bash 任务的输出结果。
- **适用场景**：
  - 与 `bash` 的异步模式配合，获取长任务的执行结果。

### 4.2 `bash_status`

- **来源**：`NewBashStatusTool()`
- **能力**：查询异步 Bash 任务的状态（进行中/完成/失败）。

### 4.3 `kill_task`

- **来源**：`NewKillTaskTool()`
- **能力**：中止一个正在运行的异步任务（通常是 Bash 或 Subagent 任务）。

### 4.4 Task 系列工具

使用一个共享的 `TaskStore`（`tasks.NewTaskStore()`），用于管理子任务：

- **`task_create`**：创建新任务；
- **`task_list`**：列出当前任务列表；
- **`task_get`**：查询单个任务详情；
- **`task_update`**：更新任务状态或附加信息。

这些工具主要用于：

- 跟踪长时间运行操作（如大规模分析、批处理）；
- 将复杂工作拆分为可管理的任务单元。

---

## 五、用户交互与协作工具

### 5.1 `askuserquestion`

- **来源**：`NewAskUserQuestionTool()`
- **能力**：向用户发起结构化提问（例如多选/单选），暂停当前推理等待用户反馈。
- **适用场景**：
  - 关键信息缺失时向用户确认；
  - 需要用户在多个选项间做出决策。

---

## 六、与沙箱和安全的关系

这些内置工具均通过 agentsdk-go 的沙箱和安全模块进行约束：

- 文件访问受 `SandboxOptions` 限制（根目录、允许路径）；
- 网络访问仅限白名单地址；
- 异步任务受资源限制（CPU/内存/磁盘等）。

OpenOcta 在创建 Runtime 时通过 `buildSandboxOptions` 传入默认的：

- 根目录：`projectRoot`；
- 允许路径：`projectRoot/workspace`、`projectRoot/shared`；
- 网络：`localhost` / `127.0.0.1`。

你可以在创建 Runtime 时通过 `SandboxOpts` 调整这些限制。 

