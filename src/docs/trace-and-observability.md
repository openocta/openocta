# Trace 与可观测性

本文档说明 OctopusClaw 中使用的 Trace 采集方式，以及预留的 OpenTelemetry 配置。实现基于 [agentsdk-go Trace 体系](https://github.com/stellarlinkco/agentsdk-go/blob/main/docs/trace-system.md)，在不同层级分别采集 HTTP 请求与 Agent 执行数据。

## 1. 概述

agentsdk-go 采用双层 trace 体系：

- **HTTP Layer Trace**：在 HTTP 服务最外层记录完整请求/响应（含 SSE 流），用于 API 集成与网络排查。
- **Middleware Layer Trace**：在 agent/middleware 链的多个拦截点记录模型与工具调用、性能指标，用于理解 Agent 执行路径。

两条链路可单独或同时启用。OctopusClaw 当前在 **Gateway HTTP Server** 使用 HTTP Trace，在 **Agent Runtime** 使用 Middleware Trace。

---

## 2. HTTP Layer Trace（Gateway 层）

### 2.1 使用位置

- **文件**：`pkg/gateway/http/server.go`
- **方法**：`Server.Handler()` 中在业务 handler 外包一层 HTTP Trace 中间件。

### 2.2 代码逻辑

```go
// Handler() 内
httpTraceDir := filepath.Join(".", ".claude-trace")
writer, err := middleware.NewFileHTTPTraceWriter(httpTraceDir)
var handler http.Handler
if err != nil {
    log.Printf("HTTP trace disabled: %v", err)
} else {
    httpTrace := middleware.NewHTTPTraceMiddleware(
        writer,
        middleware.WithHTTPTraceMaxBodyBytes(2<<20),  // 2 MiB body 上限
    )
    handler = httpTrace.Wrap(handlerFunc)  // handlerFunc 含 WebSocket 与 mux
}
return handler
```

- **输出目录**：当前为 `./.claude-trace`（相对运行目录）。
- **Body 限制**：`WithHTTPTraceMaxBodyBytes(2<<20)`，即 2 MiB；超出的 body 会截断。
- **失败时**：若 `NewFileHTTPTraceWriter` 失败（如目录不可写），仅打日志，不包中间件，返回未包装的 `handlerFunc`。

### 2.3 捕获内容（agentsdk-go 行为）

- 请求：method、URL、headers（敏感头脱敏）、JSON/二进制 body。
- 响应：status_code、headers、body_raw（SSE 时保留 event 流）。
- 支持 streaming：透传 Flusher/Hijacker，同时收集片段并做截断标记。

### 2.4 输出格式与文件

- 路径：`.claude-trace/log-YYYY-MM-DD-HH-MM-SS.jsonl`
- 每行一个 JSON 事件（request + response + logged_at）。

---

## 3. Middleware Layer Trace（Agent Runtime 层）

### 3.1 使用位置

- **文件**：`pkg/agent/runtime/runtime.go`
- **位置**：`runtime.New()` 内构造 `api.Options` 时，向 `apiOpts.Middleware` 注入 `TraceMiddleware`。

### 3.2 代码逻辑

```go
// runtime.New() 内
traceMW := middleware.NewTraceMiddleware(filepath.Join(projectRoot, ".trace"))
apiOpts.Middleware = []middleware.Middleware{
    traceMW,
}
```

- **输出目录**：`<ProjectRoot>/.trace`，即每个 agent 工作区下的 `.trace` 目录。
- **拦截点**：before_agent → before_model → after_model → before_tool → after_tool → after_agent。

### 3.3 捕获内容（agentsdk-go 行为）

- 模型请求/响应快照（messages、system、tools、usage、stop_reason、stream 等）。
- 工具调用与结果（tool_call / tool_result）。
- 性能：duration_ms、iteration、session_id、错误信息。
- 汇总：total tokens、total duration 等，并写入 HTML Viewer。

### 3.4 输出格式

- **JSONL**：`.trace/log-<timestamp>.jsonl`，机器可读事件流。
- **HTML Viewer**：同名 `.html`，带统计面板、时间线、JSON 高亮与折叠。

---

## 4. OpenTelemetry（OTEL）预留

### 4.1 Runtime 中的注释配置

在 `pkg/agent/runtime/runtime.go` 中，OTEL 配置当前被注释，未启用：

```go
//apiOpts.OTEL = api.OTELConfig{
//	Enabled:     true,
//	ServiceName: "openocta",
//	Endpoint:    "http://192.168.50.254:14318",
//}
```

- **作用**：若启用，agentsdk-go 会将 trace 导出到 OpenTelemetry Collector 或兼容 OTLP 的后端。
- **Endpoint**：示例为 HTTP OTLP 端点（如 Collector 的 14318 端口）。

### 4.2 配置结构（config 层）

项目在 `pkg/config/schema.go` 中定义了与诊断相关的 OTEL 配置结构，可供后续从配置文件或环境变量驱动 OTEL：

```go
// DiagnosticsOtelConfig 与 api.OTELConfig 对应关系需参考 agentsdk-go 定义
type DiagnosticsOtelConfig struct {
    Enabled         *bool             `json:"enabled,omitempty"`
    Endpoint        *string           `json:"endpoint,omitempty"`
    Protocol        *string           `json:"protocol,omitempty"`   // "http/protobuf" | "grpc"
    Headers         map[string]string `json:"headers,omitempty"`
    ServiceName     *string           `json:"serviceName,omitempty"`
    Traces          *bool             `json:"traces,omitempty"`
    Metrics         *bool             `json:"metrics,omitempty"`
    Logs            *bool             `json:"logs,omitempty"`
    SampleRate      *float64          `json:"sampleRate,omitempty"`
    FlushIntervalMs *int              `json:"flushIntervalMs,omitempty"`
}
```

- **入口**：`DiagnosticsConfig.Otel`（如配置中存在 `diagnostics.otel`）。
- **依赖**：`go.mod` 中已引入 `go.opentelemetry.io/otel` 及 `otel/exporters/otlp/otlptrace/otlptracehttp` 等（当前为 indirect）。

### 4.3 启用 OTEL 的后续步骤（建议）

1. 在 `runtime.New()` 中根据配置或环境变量构造 `api.OTELConfig`，并赋值 `apiOpts.OTEL`。
2. 将 `DiagnosticsOtelConfig` 映射为 agentsdk-go 所需的 `api.OTELConfig` 字段（Endpoint、ServiceName、Enabled 等）。
3. 部署 OpenTelemetry Collector 或兼容 OTLP 的后端（如 Jaeger），并配置 `Endpoint` 指向该服务。

---

## 5. 对比小结

| 特性         | HTTP Trace (server.go)     | Middleware Trace (runtime.go) | OpenTelemetry (当前未启用)   |
|--------------|----------------------------|--------------------------------|------------------------------|
| 目的         | HTTP 请求/响应、网络排查   | Agent 执行、prompt/工具调试   | 统一导出到 OTLP 后端         |
| 输出位置     | `./.claude-trace/`         | `<ProjectRoot>/.trace/`        | 远程 OTLP Endpoint           |
| 格式         | JSONL                      | JSONL + HTML                   | OTLP (traces/metrics/logs)   |
| 代码位置     | `gateway/http/server.go`   | `agent/runtime/runtime.go`     | 同上，apiOpts.OTEL 已注释    |
| 配置         | 目录 + MaxBodyBytes        | projectRoot + .trace           | DiagnosticsOtelConfig 已定义 |

---

## 6. 最佳实践（参考 agentsdk-go 文档）

- 开发/测试可同时开启 HTTP + Middleware trace，配合 `tail -f` 与 HTML 查看器排查问题。
- 生产环境按需开启，必要时对 HTTP trace 或 Middleware trace 做采样，避免 I/O 过大。
- 定期清理 `.claude-trace/` 与 `.trace/`（如保留最近 7 天或限制总大小）。
- 将上述目录加入 `.gitignore`。
- 下游分析前对 request body、tool 参数等再次脱敏。

---

## 7. 参考

- [agentsdk-go Trace 系统文档](https://github.com/stellarlinkco/agentsdk-go/blob/main/docs/trace-system.md)
- 本仓库：`pkg/gateway/http/server.go`（HTTP Trace）、`pkg/agent/runtime/runtime.go`（Middleware Trace 与 OTEL 注释）、`pkg/config/schema.go`（DiagnosticsOtelConfig）
