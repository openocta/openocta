# OpenOcta 配置说明

本文档介绍如何配置 OpenOcta Gateway，包括配置文件的格式、各个配置项的含义以及不同场景下的配置示例。

## 配置文件位置

OpenOcta 的配置文件默认位于：

- **默认路径**: `~/.openocta/openocta.json`
- **环境变量覆盖**: 可通过 `OPENOCTA_CONFIG_PATH` 环境变量指定自定义路径

配置文件使用标准 JSON 格式（也支持 JSON5 格式，允许注释和尾随逗号）。

## 快速开始

### 绝对最小配置

最简单的配置只需要指定工作空间和至少一个消息渠道：

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openocta/workspace"
    }
  },
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"]
    }
  }
}
```

保存到 `~/.openocta/openocta.json`，你就可以从该号码私信机器人了。

### 推荐的入门配置

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openocta/workspace"
    },
    "list": [
      {
        "id": "default",
        "default": true,
        "name": "Clawd",
        "workspace": "~/.openocta/workspace",
        "model": "anthropic/claude-sonnet-4-5"
      }
    ]
  },
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"],
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    }
  },
  "gateway": {
    "port": 18789,
    "bind": "loopback"
  }
}
```

## 配置项说明

### 基础配置

#### `mcp` - MCP 服务配置

配置 MCP（Model Context Protocol）服务器，供 Agent 通过标准协议调用外部工具（如 Prometheus 等）。支持三种方式：命令行（stdio）、URL（SSE/HTTP）、以及内置服务类型（如 `prometheus` + 后端地址）。详细字段与示例见 [MCP 配置使用说明](./mcp-configuration.md)。

#### `logging` - 日志配置

控制日志输出设置。

```json
{
  "logging": {
    "file": "/tmp/openocta/openocta.log"
  }
}
```

- `file` (string, 可选): 日志文件路径

#### `meta` - 配置元数据

存储配置文件的元数据信息。

```json
{
  "meta": {
    "lastTouchedVersion": "0.0.0",
    "lastTouchedAt": "2026-01-01T00:00:00Z"
  }
}
```

- `lastTouchedVersion` (string, 可选): 最后修改配置的版本号
- `lastTouchedAt` (string, 可选): 最后修改时间（ISO 8601 格式）

#### `env` - 环境变量配置

配置环境变量和 shell 环境导入设置。

```json
{
  "env": {
    "vars": {
      "OPENROUTER_API_KEY": "sk-or-...",
      "GROQ_API_KEY": "gsk-..."
    },
    "shellEnv": {
      "enabled": true,
      "timeoutMs": 15000
    }
  }
}
```

- `vars` (object, 可选): 环境变量键值对
- `shellEnv` (object, 可选): Shell 环境导入配置
  - `enabled` (boolean, 可选): 是否启用 shell 环境导入
  - `timeoutMs` (integer, 可选): 超时时间（毫秒）

### 智能体配置

#### `agents` - 智能体配置

定义智能体的默认设置和智能体列表。

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openocta/workspace"
    },
    "list": [
      {
        "id": "default",
        "default": true,
        "name": "Default Agent",
        "workspace": "~/.openocta/workspace",
        "model": "anthropic/claude-sonnet-4-5",
        "skills": []
      }
    ]
  }
}
```

**`defaults`** - 默认智能体设置：
- `workspace` (string, 可选): 默认工作空间路径

**`list`** - 智能体列表：
- `id` (string, 必需): 智能体唯一标识符
- `default` (boolean, 可选): 是否为默认智能体
- `name` (string, 可选): 智能体名称
- `workspace` (string, 可选): 工作空间路径
- `agentDir` (string, 可选): 智能体目录路径
- `model` (string, 可选): 使用的模型标识符
- `skills` (array, 可选): 启用的技能列表

### 消息渠道配置

#### `channels` - 消息渠道配置

配置各种消息渠道（WhatsApp、Telegram、Discord、Slack 等）。

```json
{
  "channels": {
    "defaults": {
      "groupPolicy": "allowlist"
    },
    "whatsapp": {
      "allowFrom": ["+15555550123"],
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["+15555550123"],
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    }
  }
}
```

**`defaults`** - 默认渠道设置：
- `groupPolicy` (string, 可选): 群组策略（`allowlist`、`open` 等）

**渠道特定配置**：

**WhatsApp** (`whatsapp`):
- `allowFrom` (array, 可选): 允许的发送者列表（电话号码）
- `dmPolicy` (string, 可选): 私信策略（`pairing`、`open` 等）
- `groupPolicy` (string, 可选): 群组策略
- `groupAllowFrom` (array, 可选): 允许的群组发送者列表
- `groups` (object, 可选): 群组特定配置

**Telegram** (`telegram`):
- `enabled` (boolean, 可选): 是否启用
- `botToken` (string, 可选): Bot Token
- `allowFrom` (array, 可选): 允许的用户 ID 列表
- `groupPolicy` (string, 可选): 群组策略
- `groupAllowFrom` (array, 可选): 允许的群组用户列表
- `groups` (object, 可选): 群组配置

**Discord** (`discord`):
- `enabled` (boolean, 可选): 是否启用
- `token` (string, 可选): Bot Token
- `dm` (object, 可选): 私信配置
  - `enabled` (boolean, 可选): 是否启用私信
  - `allowFrom` (array, 可选): 允许的用户名列表
- `guilds` (object, 可选): 服务器配置

**Slack** (`slack`):
- `enabled` (boolean, 可选): 是否启用
- `botToken` (string, 可选): Bot Token
- `appToken` (string, 可选): App Token
- `channels` (object, 可选): 频道配置
- `dm` (object, 可选): 私信配置
- `slashCommand` (object, 可选): 斜杠命令配置

### 网关配置

#### `gateway` - 网关配置

配置 Gateway 的网络和认证设置。

```json
{
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "gateway-token",
      "allowTailscale": true
    },
    "reload": {
      "mode": "hybrid"
    }
  }
}
```

- `port` (integer, 可选): 监听端口（默认: 18789）
- `bind` (string, 可选): 绑定地址（`loopback`、`lan`、`auto`）
- `auth` (object, 可选): 认证配置
  - `mode` (string, 可选): 认证模式（`token`、`password`）
  - `token` (string, 可选): 认证令牌
  - `password` (string, 可选): 认证密码
  - `allowTailscale` (boolean, 可选): 是否允许 Tailscale 连接
- `reload` (object, 可选): 配置热重载设置
  - `mode` (string, 可选): 重载模式（`off`、`hot`、`restart`、`hybrid`）

### 模型配置

#### `models` - 模型提供商配置

配置自定义模型提供商。

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "custom-proxy": {
        "baseUrl": "http://localhost:4000/v1",
        "apiKey": "LITELLM_KEY",
        "models": [
          {
            "id": "llama-3.1-8b",
            "name": "Llama 3.1 8B"
          }
        ]
      }
    }
  }
}
```

- `mode` (string, 可选): 模式（`merge`、`replace`）
- `providers` (object, 可选): 提供商配置
  - `baseUrl` (string, 必需): API 基础 URL
  - `apiKey` (string, 可选): API 密钥
  - `models` (array, 必需): 模型列表
    - `id` (string, 必需): 模型标识符
    - `name` (string, 必需): 模型名称

### 定时任务配置

#### `cron` - Cron 作业配置

配置定时任务设置。

```json
{
  "cron": {
    "enabled": true,
    "store": "~/.openocta/cron/cron.json",
    "maxConcurrentRuns": 2,
    "sessionRetention": "7d"
  }
}
```

- `enabled` (boolean, 可选): 是否启用 Cron
- `store` (string, 可选): Cron 任务存储路径
- `maxConcurrentRuns` (integer, 可选): 最大并发运行数
- `sessionRetention` (string, 可选): 会话保留时间

### Webhooks 配置

#### `hooks` - Webhooks 配置

配置 Webhook 映射和处理。

```json
{
  "hooks": {
    "enabled": true,
    "installSource": "",
    "mappings": [
      {
        "id": "gmail-hook",
        "action": "agent",
        "module": "./transforms/gmail.js",
        "agentId": "default",
        "channel": "whatsapp",
        "deliver": true
      }
    ],
    "internal": []
  }
}
```

- `enabled` (boolean, 可选): 是否启用 Hooks
- `installSource` (string, 可选): 安装源路径
- `mappings` (array, 可选): Hook 映射列表
  - `id` (string, 可选): Hook ID
  - `action` (string, 可选): 动作类型
  - `module` (string, 可选): 模块路径
  - `agentId` (string, 可选): 智能体 ID
  - `channel` (string, 可选): 渠道名称
  - `deliver` (boolean, 可选): 是否交付
- `internal` (array, 可选): 内置 Hook 列表

### 技能配置

#### `skills` - 技能配置

配置可用的技能。

```json
{
  "skills": {
    "entries": [
      {
        "id": "peekaboo",
        "path": ""
      }
    ]
  }
}
```

- `entries` (array, 可选): 技能条目列表
  - `id` (string, 必需): 技能 ID
  - `path` (string, 可选): 技能路径

### 内存配置

#### `memory` - 内存/记忆配置

配置记忆存储和检索设置。

```json
{
  "memory": {
    "backend": "builtin",
    "citations": "auto",
    "qmd": {
      "command": "qmd",
      "searchMode": "semantic",
      "includeDefault": true,
      "paths": [
        {
          "path": "~/.openocta/workspace",
          "name": "Workspace",
          "pattern": "**/*.md"
        }
      ]
    }
  }
}
```

- `backend` (string, 可选): 后端类型（`builtin`、`qmd`）
- `citations` (string, 可选): 引用模式（`auto`、`on`、`off`）
- `qmd` (object, 可选): QMD 后端配置
  - `command` (string, 可选): QMD 命令
  - `searchMode` (string, 可选): 搜索模式
  - `includeDefault` (boolean, 可选): 是否包含默认记忆
  - `paths` (array, 可选): 索引路径列表

## 常见配置场景

### 场景 1: 多平台设置

同时配置多个消息平台：

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openocta/workspace"
    }
  },
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"]
    },
    "telegram": {
      "enabled": true,
      "botToken": "YOUR_TOKEN",
      "allowFrom": ["123456789"]
    },
    "discord": {
      "enabled": true,
      "token": "YOUR_TOKEN",
      "dm": {
        "enabled": true,
        "allowFrom": ["yourname"]
      }
    }
  }
}
```

### 场景 2: 工作机器人（受限访问）

配置一个受限的工作环境机器人：

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/work-openocta"
    },
    "list": [
      {
        "id": "work",
        "default": true,
        "name": "WorkBot",
        "workspace": "~/work-openocta"
      }
    ]
  },
  "channels": {
    "slack": {
      "enabled": true,
      "botToken": "xoxb-...",
      "channels": {
        "#engineering": {
          "allow": true,
          "requireMention": true
        },
        "#general": {
          "allow": true,
          "requireMention": true
        }
      }
    }
  }
}
```

### 场景 3: 仅本地模型

配置使用本地运行的模型：

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openocta/workspace"
    },
    "list": [
      {
        "id": "default",
        "default": true,
        "model": "lmstudio/minimax-m2.1-gs32"
      }
    ]
  },
  "models": {
    "mode": "merge",
    "providers": {
      "lmstudio": {
        "baseUrl": "http://127.0.0.1:1234/v1",
        "apiKey": "lmstudio",
        "models": [
          {
            "id": "minimax-m2.1-gs32",
            "name": "MiniMax M2.1 GS32"
          }
        ]
      }
    }
  }
}
```

### 场景 4: 完整生产配置

包含所有主要配置项的完整示例：

```json
{
  "logging": {
    "file": "/var/log/openocta/openocta.log"
  },
  "env": {
    "vars": {
      "OPENROUTER_API_KEY": "sk-or-..."
    },
    "shellEnv": {
      "enabled": true,
      "timeoutMs": 15000
    }
  },
  "agents": {
    "defaults": {
      "workspace": "~/.openocta/workspace"
    },
    "list": [
      {
        "id": "default",
        "default": true,
        "name": "Production Agent",
        "workspace": "~/.openocta/workspace",
        "model": "anthropic/claude-sonnet-4-5"
      }
    ]
  },
  "channels": {
    "defaults": {
      "groupPolicy": "allowlist"
    },
    "whatsapp": {
      "allowFrom": ["+15555550123"],
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    },
    "telegram": {
      "enabled": true,
      "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
      "allowFrom": ["123456789"]
    }
  },
  "gateway": {
    "port": 18789,
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "your-secure-token-here",
      "allowTailscale": true
    },
    "reload": {
      "mode": "hybrid"
    }
  },
  "cron": {
    "enabled": true,
    "store": "~/.openocta/cron/cron.json",
    "maxConcurrentRuns": 2
  },
  "hooks": {
    "enabled": true,
    "mappings": []
  },
  "memory": {
    "backend": "builtin",
    "citations": "auto"
  }
}
```

## 配置验证

配置文件的验证会在 Gateway 启动时自动进行。如果配置有误，Gateway 会输出错误信息并指出问题所在。

你可以通过以下方式检查配置：

1. **启动 Gateway**: 运行 `openocta gateway run`，如果配置有误会显示错误信息
2. **查看日志**: 检查日志文件中的配置加载信息
3. **使用 API**: 通过 Gateway API 的 `config.get` 方法获取当前配置快照

## 配置热重载

Gateway 支持配置热重载，无需重启即可应用配置更改。通过 `gateway.reload.mode` 配置重载模式：

- `off`: 禁用热重载
- `hot`: 热重载（不重启进程）
- `restart`: 重启进程
- `hybrid`: 混合模式（优先热重载，必要时重启）

## 环境变量覆盖

某些配置项可以通过环境变量覆盖：

- `OPENOCTA_STATE_DIR`: 状态目录路径
- `OPENOCTA_CONFIG_PATH`: 配置文件路径
- `OPENOCTA_GATEWAY_PORT`: Gateway 端口

## 注意事项

1. **安全性**: 
   - 不要在配置文件中硬编码敏感信息（API 密钥、令牌等）
   - 使用环境变量或安全的密钥管理工具
   - 确保配置文件权限设置正确（建议 `600`）

2. **路径解析**:
   - 支持使用 `~` 表示用户主目录
   - 相对路径相对于配置文件所在目录解析

3. **JSON 格式**:
   - 配置文件必须是有效的 JSON
   - 支持 JSON5 格式（允许注释和尾随逗号）
   - 建议使用 JSON 格式化工具验证格式

4. **渠道 ID 格式**:
   - WhatsApp: 使用完整的电话号码格式（如 `+15555550123`）
   - Telegram: 使用用户 ID（数字字符串）
   - Discord: 使用用户名或用户 ID
   - Slack: 使用用户 ID（如 `U123`）

## 参考资源

- [配置示例文档](https://docs.openocta.ai/zh-CN/gateway/configuration-examples)
- [完整配置参考](https://docs.openocta.ai/gateway/configuration)
- [渠道配置文档](https://docs.openocta.ai/channels/whatsapp)
- [故障排除指南](https://docs.openocta.ai/gateway/troubleshooting)
