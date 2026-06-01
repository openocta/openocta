# 大模型厂商与配置说明

本文档说明 OpenOcta 支持的大模型厂商（Model Providers）、模型引用格式、以及如何通过配置文件或环境变量进行认证与自定义端点配置。格式与用法参考 [OpenClaw Model Providers](https://docs.openclaw.ai/concepts/model-providers)。

## 模型引用格式

模型使用 **`provider/modelId`** 形式引用，例如：

- `anthropic/claude-sonnet-4-5-20250929`
- `openai/gpt-4`
- `openrouter/auto`
- `moonshot/kimi-k2.5`
- `kimi-coding/k2p5`
- `bailian/qwen3.5-flash`
- `nearai/zai-org/GLM-5.1-FP8`

在配置中指定默认模型时，可在 `agents.defaults.model.primary` 或单个 agent 的 `model` 中填写上述引用。

## 配置方式概览

1. **环境变量 / config.env.vars**  
   为各厂商设置对应的 API Key 环境变量（见下表），无需在 `models.providers` 中声明即可使用内置端点。

2. **config.models.providers**  
   需要自定义 Base URL、或使用非内置厂商时，在 `models.providers` 中为该 provider 配置 `baseUrl`、`apiKey`（可为字面量或 `$ENV_VAR`）、以及可选的 `api` 类型与 `models` 列表。

## 支持的内置厂商

以下厂商在**未**在 `models.providers` 中配置时，会使用下表默认 Base URL 和对应环境变量；若已在 `models.providers` 中配置，则优先使用配置中的 `baseUrl` 与 `apiKey`。

| 厂商 (provider) | 认证环境变量 | 默认模型示例 | 默认 Base URL | API 类型 |
|-----------------|-------------|--------------|---------------|----------|
| **anthropic**   | `ANTHROPIC_API_KEY` | claude-sonnet-4-5-20250929 | (官方) | Anthropic |
| **openai**      | `OPENAI_API_KEY`    | gpt-4                       | (官方) | OpenAI |
| **openrouter** | `OPENROUTER_API_KEY` | auto                        | https://openrouter.ai/api/v1 | OpenAI |
| **litellm**     | `LITELLM_API_KEY`   | (需指定)                    | http://localhost:4000 | OpenAI |
| **moonshot**    | `MOONSHOT_API_KEY`  | kimi-k2.5                   | https://api.moonshot.ai/v1 | OpenAI |
| **moonshot-cn** | `MOONSHOT_API_KEY`  | kimi-k2.5                   | https://api.moonshot.cn/v1 | OpenAI |
| **kimi-coding** | `KIMI_API_KEY`      | k2p5                        | https://api.moonshot.ai/anthropic | Anthropic |
| **opencode**    | `OPENCODE_API_KEY`  | claude-opus-4-6             | https://opencode.ai/zen/v1 | OpenAI |
| **zai**         | `ZAI_API_KEY`       | glm-5                       | https://api.z.ai/api/paas/v4 | OpenAI |
| **xai**         | `XAI_API_KEY`       | grok-3-mini                 | https://api.x.ai/v1 | OpenAI |
| **together**    | `TOGETHER_API_KEY`  | meta-llama/Llama-3.3-70B-Instruct-Turbo | https://api.together.xyz/v1 | OpenAI |
| **venice**      | `VENICE_API_KEY`    | falcon-3.1-70b              | https://api.venice.ai/api/v1 | OpenAI |
| **nearai**      | `NEARAI_API_KEY`    | zai-org/GLM-5.1-FP8         | https://cloud-api.near.ai/v1 | OpenAI |
| **synthetic**   | `SYNTHETIC_API_KEY` | hf:MiniMaxAI/MiniMax-M2.1   | https://api.synthetic.new/anthropic | Anthropic |
| **qianfan**     | `QIANFAN_API_KEY`   | deepseek-v3-2-251201         | https://qianfan.baidubce.com/v2 | OpenAI |
| **huggingface** | `HUGGINGFACE_HUB_TOKEN` | (需指定) | https://router.huggingface.co/v1 | OpenAI |
| **xiaomi**      | `XIAOMI_API_KEY`    | mimo-v2-flash               | https://api.xiaomimimo.com/anthropic | Anthropic |
| **minimax**     | `MINIMAX_API_KEY`   | MiniMax-M3                  | https://api.minimax.io/anthropic | Anthropic |
| **mistral**     | `MISTRAL_API_KEY`   | mistral-large-latest        | https://api.mistral.ai/v1 | OpenAI |
| **groq**        | `GROQ_API_KEY`      | llama-3.3-70b-versatile     | https://api.groq.com/openai/v1 | OpenAI |
| **cerebras**    | `CEREBRAS_API_KEY`  | llama-4-scout-17b-16e-instruct | https://api.cerebras.ai/v1 | OpenAI |
| **ollama**      | `OLLAMA_API_KEY`（可选） | llama3.3                | http://127.0.0.1:11434/v1 | OpenAI |
| **vllm**        | `VLLM_API_KEY`（可选） | (需指定)                 | http://127.0.0.1:8000/v1 | OpenAI |
| **vercel-ai-gateway** | `AI_GATEWAY_API_KEY` | (需指定)           | https://api.vercel.ai/v1 | OpenAI |

说明：

- **API 类型**：`OpenAI` 表示兼容 OpenAI Chat Completions 的端点；`Anthropic` 表示兼容 Anthropic Messages API 的端点。自定义 `models.providers` 时可通过 `api: "openai-completions"` 或 `api: "anthropic-messages"` 指定。
- 环境变量可在 `config.env.vars` 中配置，也可直接使用系统环境变量；`config.env.vars` 优先级更高。
- 对于**未在 `models.providers` 中单独声明**的内置厂商，还可以通过以下环境变量覆盖默认模型和 Base URL：
  - 通用：`<PROVIDER>_MODEL`、`<PROVIDER>_BASE_URL`，例如：
    - `GROQ_MODEL`、`GROQ_BASE_URL`
    - `VENICE_MODEL`、`VENICE_BASE_URL`
  - 对于 **Kimi Coding**，为了与官方命名保持一致，前缀为 `KIMI` 而不是 `KIMI_CODING`：
    - `KIMI_MODEL`：覆盖默认模型 `k2p5`
    - `KIMI_BASE_URL`：覆盖默认 Base URL `https://api.moonshot.ai/anthropic`

## 各厂商完整配置样例

以下为每个支持厂商的**完整可运行**配置样例，包含 `env.vars`、`agents` 及（如需）`models.providers`。将对应 API Key 替换为实际值即可使用。

### Anthropic

```json
{
  "env": {
    "vars": {
      "ANTHROPIC_API_KEY": "sk-ant-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "anthropic/claude-sonnet-4-5-20250929" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "anthropic/claude-sonnet-4-5-20250929"
      }
    ]
  }
}
```

### OpenAI

```json
{
  "env": {
    "vars": {
      "OPENAI_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "openai/gpt-4" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "openai/gpt-4"
      }
    ]
  }
}
```

### OpenRouter

OpenRouter 统一接入多家模型，模型引用格式为 `openrouter/<可选子路径>/<模型名>`。

```json
{
  "env": {
    "vars": {
      "OPENROUTER_API_KEY": "sk-or-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "openrouter/auto" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "openrouter/anthropic/claude-sonnet-4-5"
      }
    ]
  }
}
```

### Moonshot（Kimi K2）

使用 Moonshot 开放平台、OpenAI 兼容端点。

```json
{
  "env": {
    "vars": {
      "MOONSHOT_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "moonshot/kimi-k2.5" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "moonshot/kimi-k2.5"
      }
    ]
  }
}
```

### Moonshot-CN（国内端点）

与 Moonshot 共用 `MOONSHOT_API_KEY`，Base URL 为国内 `api.moonshot.cn`。

```json
{
  "env": {
    "vars": {
      "MOONSHOT_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "moonshot-cn/kimi-k2.5" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "moonshot-cn/kimi-k2.5"
      }
    ]
  }
}
```

### Kimi Coding

Kimi Coding 使用单独端点和 API Key（与 Moonshot 开放平台密钥不通用），采用 Anthropic 兼容接口。获取 API Key：<https://www.kimi.com/code/en>。

```json
{
   "env": {
    "vars": {
      "KIMI_API_KEY": "sk-kimi-omAuYzLuXO4oSY1vWdRvJcOA58BewQSHGgNerDfsdfpFpaCMr089gG9LyudGAieH",
      "KIMI_BASE_URL": "https://api.kimi.com/coding/",
      "API_TIMEOUT_MS": "3000000",
      "KIMI_MODEL": "kimi-k2.5"
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "kimi-coding/kimi-k2.5" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "kimi-coding/k2.5"
      }
    ]
  }
}
```

### OpenCode

```json
{
  "env": {
    "vars": {
      "OPENCODE_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "opencode/claude-opus-4-6" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "opencode/claude-opus-4-6"
      }
    ]
  }
}
```

### Z.ai（智谱）

```json
{
  "env": {
    "vars": {
      "ZAI_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "zai/glm-5" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "zai/glm-5"
      }
    ]
  }
}
```

### xAI（Grok）

```json
{
  "env": {
    "vars": {
      "XAI_API_KEY": "xai-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "xai/grok-3-mini" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "xai/grok-3-mini"
      }
    ]
  }
}
```

### Together AI

```json
{
  "env": {
    "vars": {
      "TOGETHER_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "together/meta-llama/Llama-3.3-70B-Instruct-Turbo" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "together/meta-llama/Llama-3.3-70B-Instruct-Turbo"
      }
    ]
  }
}
```

### Venice AI

```json
{
  "env": {
    "vars": {
      "VENICE_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "venice/falcon-3.1-70b" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "venice/falcon-3.1-70b"
      }
    ]
  }
}
```

### NEAR AI Cloud

NEAR AI Cloud 提供 OpenAI 兼容端点，并支持 TEE 推理模型。默认模型示例 `zai-org/GLM-5.1-FP8` 来自公开模型目录；如需查看可用模型，可请求 `https://cloud-api.near.ai/v1/model/list`。

```json
{
  "env": {
    "vars": {
      "NEARAI_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "nearai/zai-org/GLM-5.1-FP8" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "nearai/zai-org/GLM-5.1-FP8"
      }
    ]
  }
}
```

### Synthetic（MiniMax 等）

```json
{
  "env": {
    "vars": {
      "SYNTHETIC_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "synthetic/hf:MiniMaxAI/MiniMax-M2.1" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "synthetic/hf:MiniMaxAI/MiniMax-M2.1"
      }
    ]
  }
}
```

### 千帆（百度）

```json
{
  "env": {
    "vars": {
      "QIANFAN_API_KEY": "bce-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "qianfan/deepseek-v3-2-251201" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "qianfan/deepseek-v3-2-251201"
      }
    ]
  }
}
```

### Hugging Face

需指定具体模型 ID，无内置默认模型。

```json
{
  "env": {
    "vars": {
      "HUGGINGFACE_HUB_TOKEN": "hf_..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "huggingface/meta-llama/Meta-Llama-3-70B-Instruct" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "huggingface/meta-llama/Meta-Llama-3-70B-Instruct"
      }
    ]
  }
}
```

### 小米 Mimo

```json
{
  "env": {
    "vars": {
      "XIAOMI_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "xiaomi/mimo-v2-flash" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "xiaomi/mimo-v2-flash"
      }
    ]
  }
}
```

### MiniMax

MiniMax 提供 Anthropic Messages API 兼容端点，默认模型为最新的 `MiniMax-M3`。可用模型：

| 模型 | 说明 |
|------|------|
| `MiniMax-M3` | 最新旗舰模型 |
| `MiniMax-M2.7` | 上一代旗舰模型，1M context |
| `MiniMax-M2.7-highspeed` | 上一代高速推理版本 |

```json
{
  "env": {
    "vars": {
      "MINIMAX_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "minimax/MiniMax-M3" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "minimax/MiniMax-M3"
      }
    ]
  }
}
```

使用高速推理版本：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "model": "minimax/MiniMax-M2.7-highspeed"
      }
    ]
  }
}
```

### Mistral

```json
{
  "env": {
    "vars": {
      "MISTRAL_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "mistral/mistral-large-latest" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "mistral/mistral-large-latest"
      }
    ]
  }
}
```

### Groq

```json
{
  "env": {
    "vars": {
      "GROQ_API_KEY": "gsk_..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "groq/llama-3.3-70b-versatile" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "groq/llama-3.3-70b-versatile"
      }
    ]
  }
}
```

### Cerebras

```json
{
  "env": {
    "vars": {
      "CEREBRAS_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "cerebras/llama-4-scout-17b-16e-instruct" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "cerebras/llama-4-scout-17b-16e-instruct"
      }
    ]
  }
}
```

### LiteLLM（本地代理）

默认连接 `http://localhost:4000`，模型引用需包含具体模型名。

```json
{
  "env": {
    "vars": {
      "LITELLM_API_KEY": "your-proxy-key"
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "litellm/claude-opus-4-6" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "litellm/claude-opus-4-6"
      }
    ]
  }
}
```

### Ollama（本地模型）

默认地址 `http://127.0.0.1:11434/v1`。本地 Ollama 通常不验证 API Key，可设置占位值（如 `ollama`）以满足配置要求。

```json
{
  "env": {
    "vars": {
      "OLLAMA_API_KEY": "ollama"
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "ollama/llama3.3" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "ollama/llama3.3"
      }
    ]
  }
}
```

### vLLM（本地推理）

默认地址 `http://127.0.0.1:8000/v1`，需指定具体模型名。本地 vLLM 通常不验证 API Key，可设置占位值。

```json
{
  "env": {
    "vars": {
      "VLLM_API_KEY": "vllm"
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "vllm/meta-llama/Llama-3.2-3B-Instruct" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "vllm/meta-llama/Llama-3.2-3B-Instruct"
      }
    ]
  }
}
```

### Vercel AI Gateway

需指定具体模型名。

```json
{
  "env": {
    "vars": {
      "AI_GATEWAY_API_KEY": "sk-..."
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "vercel-ai-gateway/openai/gpt-4" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "vercel-ai-gateway/openai/gpt-4"
      }
    ]
  }
}
```

### 百炼（Bailian / 阿里云通义）

百炼非内置厂商，需在 `models.providers` 中显式配置。API Key 在 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 获取。

```json
{
  "env": {
    "vars": {
      "DASHSCOPE_API_KEY": "sk-..."
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "bailian": {
        "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "apiKey": "$DASHSCOPE_API_KEY",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3.5-flash",
            "name": "qwen3.5-flash",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 262144,
            "maxTokens": 65536
          },
          {
            "id": "qwen3.5-plus",
            "name": "qwen3.5-plus",
            "reasoning": false,
            "input": ["text"],
            "contextWindow": 262144,
            "maxTokens": 65536
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "bailian/qwen3.5-flash" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "bailian/qwen3.5-flash"
      }
    ]
  }
}
```

## 自定义 Base URL（models.providers）

需要自建代理、或使用与默认不同的端点时，在 `models.providers` 中为该 provider 配置 `baseUrl`、`apiKey` 和可选 `api`、`models`：

```json
{
  "env": {
    "vars": {
      "KIMI_API_KEY": "sk-...",
      "KIMI_BASE_URL": "https://api.kimi.com/coding/",
      "API_TIMEOUT_MS": "3000000",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
      "KIMI_MODEL": "kimi-k2.5",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "kimi-k2.5",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "kimi-k2.5",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "kimi-k2.5",
      "CLAUDE_CODE_SUBAGENT_MODEL": "kimi-k2.5",
      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
    }
  },
  "agents": {
    "defaults": { "model": { "primary": "moonshot/kimi-k2.5" } },
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Clawd",
        "model": "moonshot/kimi-k2.5"
      }
    ]
  },
  "models": {
    "mode": "merge",
    "providers": {
      "moonshot": {
        "baseUrl": "https://api.moonshot.ai/v1",
        "apiKey": "$MOONSHOT_API_KEY",
        "api": "openai-completions",
        "models": [
          { "id": "kimi-k2.5", "name": "Kimi K2.5", "reasoning": false, "input": ["text"] }
        ]
      }
    }
  }
}
```

- `apiKey` 可为字面量，或以 `$` 开头表示环境变量名（如 `$MOONSHOT_API_KEY`），会从 `config.env.vars` 或系统环境中读取。
- `api`：`openai-completions` 使用 OpenAI 兼容客户端；`anthropic-messages` 使用 Anthropic 兼容客户端。

## 配置项说明（models.providers）

| 字段 | 类型 | 说明 |
|------|------|------|
| `baseUrl` | string | 该 provider 的 API 根地址（如 `https://api.moonshot.ai/v1`）。 |
| `apiKey` | string | API 密钥；或以 `$` 开头表示环境变量名（如 `$MOONSHOT_API_KEY`）。 |
| `api` | string | 可选。`openai-completions`（默认）或 `anthropic-messages`，用于选择兼容的客户端。 |
| `models` | array | 可选。模型列表，每项包含 `id`、`name`、`reasoning`、`input` 等；用于校验与默认模型回退。 |

未在 `models.providers` 中配置的 provider 将使用上表中的内置默认 Base URL 与对应环境变量；若配置了该 provider，则完全以配置为准。

## 参考

- [OpenClaw Model Providers](https://docs.openclaw.ai/concepts/model-providers)  
- [OpenClaw Kimi Coding](https://docs.openclaw.ai/concepts/model-providers#kimi-coding)  
- [OpenOcta 配置说明](./configuration.md)
