# MCP 配置使用说明

本文档说明如何在 OpenOcta 中配置 MCP（Model Context Protocol）服务，以便 Agent 通过标准协议调用外部工具（如 Prometheus、Elasticsearch 等）。

## 概述

MCP 配置位于主配置的 `mcp.servers` 下，每个条目对应一个 MCP 服务器连接。系统会将启用的条目转换为 Agent 可用的 MCP 规格（stdio 命令或 URL），并支持按需禁用、去重。

**配置路径**：与主配置相同（默认 `~/.openocta/openocta.json`），在根对象下使用 `mcp` 字段。

## 配置结构

```json
{
  "mcp": {
    "servers": {
      "server-key": {
        "enabled": true,
        "command": "",
        "args": [],
        "env": {},
        "url": "",
        "service": "",
        "serviceUrl": "",
        "toolPrefix": ""
      }
    }
  }
}
```

- **`mcp.servers`**：对象，键为服务器标识（如 `prometheus`、`my-mcp`），值为该服务器的连接配置。
- 每个服务器配置（`McpServerEntry`）**只需满足下列三种方式之一**，其余字段可省略。

## 三种连接方式

### 1. 命令行（stdio）

通过本地执行命令启动 MCP 服务，使用标准输入/输出通信。

| 字段 | 类型 | 说明 |
|------|------|------|
| `command` | string | 可执行命令，如 `npx`、`docker`、`uv`。 |
| `args` | string[] | 命令参数，如 `["-y", "some-mcp-server"]`。 |
| `env` | object | 可选。传给该进程的环境变量，值支持 `$VAR` 形式的环境变量展开。 |

**转换规则**：生成 `stdio://<command> <args...>`，例如：

- `command: "npx", args: ["-y", "my-mcp"]` → `stdio://npx -y my-mcp`
- 仅 `command` 无 `args` → `stdio://npx`

**示例**：使用 npx 运行自定义 MCP 包

```json
{
  "mcp": {
    "servers": {
      "my-tools": {
        "command": "npx",
        "args": ["-y", "my-mcp-server"],
        "env": {
          "API_KEY": "$MCP_API_KEY"
        }
      }
    }
  }
}
```

### 2. URL（SSE/HTTP）

连接已运行的 MCP 服务，通过 URL 访问（如 SSE 或 HTTP 端点）。

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | MCP 服务器地址（SSE/HTTP）。 |

**转换规则**：直接使用该 URL 作为 MCP 规格，不做前缀处理。

**示例**：连接远程 MCP 服务

```json
{
  "mcp": {
    "servers": {
      "remote-mcp": {
        "url": "https://mcp.example.com/sse"
      }
    }
  }
}
```

### 3. 服务 + 后端地址（Service + ServiceURL）

通过「服务类型 + 后端地址」由系统自动选择并启动对应的 MCP 服务器（stdio），适合内置支持的中间件。

| 字段 | 类型 | 说明 |
|------|------|------|
| `service` | string | 服务类型，如 `prometheus`。 |
| `serviceUrl` | string | 该服务的后端地址（如 Prometheus 的 URL）。 |

**转换与实现**（与 `pkg/agent/runtime/mcp.go` 及 `pkg/acp/mcp/manager.go` 一致）：

- **prometheus**  
  - 生成规格：`stdio://npx -y prometheus-mcp-server`（仅用于部分 API 场景）。  
  - 实际连接时由 Manager 解析：优先用 `docker` 运行官方镜像并传入 `PROMETHEUS_URL`；若无 docker 则用 `npx -y prometheus-mcp-server` 或本机 `prometheus-mcp-server`，均通过环境变量 `PROMETHEUS_URL=<serviceUrl>` 传入后端地址。

其他 `service` 值当前未实现，会返回空规格或报错「unknown service」。

**示例**：使用 Prometheus 作为 MCP 数据源

```json
{
  "mcp": {
    "servers": {
      "prometheus": {
        "service": "prometheus",
        "serviceUrl": "http://localhost:9090"
      }
    }
  }
}
```

## 通用字段

以下字段对上述三种方式均可选。

| 字段 | 类型 | 说明 |
|------|------|------|
| `enabled` | boolean | 是否启用该服务器。未设置视为启用；设为 `false` 时该条目会被跳过。 |
| `toolPrefix` | string | 可选。为该 MCP 服务器暴露的工具名统一加前缀，用于区分多台服务器提供的同名工具。 |

## 行为说明

1. **优先级**：对同一服务器条目，解析顺序为 **Command（stdio）→ URL → Service + ServiceURL**。若 Command 非空则忽略 URL/Service；若 URL 非空则忽略 Service。
2. **禁用**：`enabled: false` 的条目不会加入 MCP 列表，也不会建立连接。
3. **去重**：若多个条目解析出相同的规格字符串（如相同的 stdio 命令或相同 URL），只会保留一份，避免重复连接。
4. **空规格**：若某条目最终解析为空规格（例如 Service 未知），该条目会被跳过。

## 配置示例汇总

**仅启用 Prometheus（服务模式）**

```json
{
  "mcp": {
    "servers": {
      "prometheus": {
        "service": "prometheus",
        "serviceUrl": "http://localhost:9090"
      }
    }
  }
}
```

**stdio 命令 + 环境变量**

```json
{
  "mcp": {
    "servers": {
      "custom": {
        "command": "docker",
        "args": ["run", "-i", "--rm", "-e", "TOKEN=$TOKEN", "my-mcp:latest"],
        "env": {
          "TOKEN": "$MCP_TOKEN"
        }
      }
    }
  }
}
```

**混合：远程 URL + 本地 Prometheus，并禁用其中一个**

```json
{
  "mcp": {
    "servers": {
      "remote": {
        "enabled": true,
        "url": "https://mcp.company.com/sse"
      },
      "prometheus": {
        "enabled": true,
        "service": "prometheus",
        "serviceUrl": "http://prometheus:9090"
      },
      "deprecated-mcp": {
        "enabled": false,
        "url": "http://old:8080"
      }
    }
  }
}
```

## 相关代码

- **规格构建**：`src/pkg/agent/runtime/mcp.go` — `BuildMCPServersFromConfig` 将 `mcp.servers` 转为 API 使用的 MCP 规格列表。
- **连接与工具**：`src/pkg/acp/mcp/manager.go` — 根据同一配置建立 stdio/URL 连接，解析 Service（如 prometheus）并注入环境变量，对外提供聚合后的 MCP 工具列表。
