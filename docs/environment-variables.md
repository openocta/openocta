# 环境变量说明

本文整理 OpenOcta（OctopusClaw）代码库中**实际读取**或**构建/打包时使用**的环境变量，便于部署与排障。

## 生效方式与优先级

1. **操作系统环境变量**：进程启动前已导出者。
2. **嵌入的 `.env`**：单文件发行包在 `init` 时从 `embed/.env` 加载，**仅当某键在环境中仍为空时**写入（见 `src/embed/embed.go`）。
3. **`config.env.vars`**：网关启动加载配置后，对其中每个键，若 `os.Getenv(k)` 为空则 `os.Setenv`（见 `src/pkg/gateway/http/server.go`）。因此下列多数变量也可写在 `openocta.json` 的 `env.vars` 中，且**已被用户或系统设置的同名环境变量**优先生效。
4. **Agent Runtime 的 `Options.Env`**：创建 `runtime` 时传入的查找函数（常为 `os.Getenv`）；超时等通过该函数解析，与 `config.env.vars` 注入后的进程环境一致。

以下未注明「仅构建时」的变量均为**运行时**由 Go 网关或 agent 读取。

---

## 1. 数据目录、配置与监听

| 变量 | 说明 |
|------|------|
| `OPENOCTA_STATE_DIR` | 状态目录（会话、日志、缓存等）。未设置时默认为 `~/.openocta`（Windows：`%APPDATA%\openocta`）。 |
| `CLAWDBOT_STATE_DIR` | 与上兼容的旧名；仅在 `OPENOCTA_STATE_DIR` 为空时作为回退。 |
| `OPENOCTA_CONFIG_PATH` | 主配置文件路径覆盖。未设置时在状态目录下查找 `openocta.json` / 旧名 `clawdbot.json`。 |
| `CLAWDBOT_CONFIG_PATH` | `OPENOCTA_CONFIG_PATH` 的回退别名。 |
| `OPENOCTA_GATEWAY_PORT` | 网关 HTTP 监听端口（正整数）。 |
| `CLAWDBOT_GATEWAY_PORT` | 端口回退别名。 |
| `OPENOCTA_RUN_MODE` | `desktop`（本机回环监听）或 `service`（对外监听）。桌面应用启动时会设为 `desktop`。影响若干仅桌面开放的 API。 |
| `OPENOCTA_PROFILE` | 默认工作区子目录名：有值时使用 `workspace-<profile>`，否则 `workspace`（见 `src/pkg/agent/workspace.go`）。 |
| `OPENOCTA_HOME` | 解析 `~` 路径时的「家目录」覆盖（优先于 `HOME` / `USERPROFILE`）。 |
| `HOME` / `USERPROFILE` | 用于展开路径与默认状态目录位置。 |
| `APPDATA` / `LOCALAPPDATA` | Windows 下状态目录默认根路径组成部分。 |
| `OPENOCTA_OAUTH_DIR` | OAuth 凭据目录；默认 `\<stateDir\>/credentials`。 |

子进程：`openocta gateway` 在派生子进程时可能传入 `OPENOCTA_CONFIG_PATH`、`OPENOCTA_STATE_DIR`（见 `src/cmd/openocta/commands/gateway.go`）。

---

## 2. 网关、认证与桌面相关

| 变量 | 说明 |
|------|------|
| `OPENOCTA_GATEWAY_TOKEN` | 网关 HTTP API 期望的令牌：若配置里 `gateway.auth.token` 非空则优先用配置，否则使用该环境变量（见 `src/pkg/gateway/http/auth.go`）。 |
| `OPENOCTA_GATEWAY_PASSWORD` | CLI `openocta gateway` 等场景下的密码类认证（见 `gateway.go`）。 |
| `OPENOCTA_ALLOW_UNINSTALL` | 置为 `1` / `true` / `yes` 时，在非桌面模式下允许部分卸载相关 API（需谨慎，仅可信环境）。 |
| `OPENOCTA_SKIP_CRON` | 为真（`1` / `true` / `yes`）时跳过定时任务服务启动。 |
| `OPENOCTA_SKIP_CHANNELS` | 为真时跳过通道（IM）运行时。 |
| `OPENOCTA_SKIP_PROVIDERS` | 为真时与上类似，视为跳过通道。 |
| `OPENOCTA_SKIP_SINGLETON_KILL` | 设为 `1` 时关闭单实例互斥「杀掉其它进程」行为（本地调试用，`src/pkg/appinstance/kill_others.go`）。 |
| `OPENOCTA_VERBOSE` | `openocta gateway --verbose` 时置为 `1`；当前代码库中未见其它读取逻辑，保留供扩展或外部工具。 |

---

## 3. 静态前端与站点 API

| 变量 | 说明 |
|------|------|
| `OPENOCTA_FRONTEND_DIR` | Control UI 静态文件目录；优先于内嵌前端与默认相对路径探测（`src/pkg/gateway/http/server.go`）。 |
| `OPENOCTA_SITE_API_BASE_URL` | 远程站点 API 根地址（市场、安装包、教程等出站请求），见 `src/pkg/gateway/http/site_proxy.go`。 |

---

## 4. 版本、日志与 Skills

| 变量 | 说明 |
|------|------|
| `OPENOCTA_BUNDLED_VERSION` | 当编译版本为开发占位时，可用该变量覆盖展示版本（`src/pkg/version/version.go`）；常与嵌入 `.env` 一并发布。 |
| `OPENOCTA_LOG_DIR` | 强制滚动日志目录覆盖（`src/pkg/logging/settings.go`）；桌面网关可能设置到应用日志目录。 |
| `OPENCLAW_BUNDLED_SKILLS_DIR` | 内置 Skills 目录覆盖；未设置时按当前目录 `./skills`、可执行文件旁 `skills` 等探测（`src/pkg/agent/skills/loader.go`）。 |

注释中亦出现过 `OPENOCTA_BUNDLED_SKILLS_DIR` 的表述，实际代码读取的是 **`OPENCLAW_BUNDLED_SKILLS_DIR`**。

---

## 5. Agent 运行时（超时）

| 变量 | 说明                                                                                                                                                  |
|------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `OPENOCTA_AGENT_RUN_TIMEOUT` | 单次对话/运行的默认时限（Go `time.ParseDuration` 或**非负整数秒**）。未设置默认 **10 分钟**；用于无 deadline 的 `Run` 包装及网关 chat 默认 `timeoutMs`。设为 `0` 表示不追加运行上限（流式仍建议由调用方或请求参数控制）。 |
| `OPENOCTA_MIDDLEWARE_TIMEOUT` | agentsdk **每条 middleware 阶段**超时；未设置则不限制该层。                                                                                                          |
| `OPENOCTA_HOOK_TIMEOUT` | shell **hook** 默认超时；未设置则沿用 agentsdk 对 `0` 的内部默认（约 600s）。                                                                                            |

知识库 Vault 路径与索引由运行时自动解析，见 [knowledge-vault.md](./knowledge-vault.md)。Knowledge Vault 始终启用。

---

## 6. 大模型（API Key 与覆盖）

### 6.1 内置厂商主 Key（与 UI `models-builtin` / `model_factory` 对齐）

各厂商默认从下列环境变量读取 API Key（也可写在 `config.env.vars`）。

| 变量 |
|------|
| `ANTHROPIC_API_KEY` |
| `OPENAI_API_KEY` |
| `OPENROUTER_API_KEY` |
| `LITELLM_API_KEY` |
| `MOONSHOT_API_KEY` |
| `KIMI_API_KEY` |
| `OPENCODE_API_KEY` |
| `ZAI_API_KEY` |
| `XAI_API_KEY` |
| `TOGETHER_API_KEY` |
| `VENICE_API_KEY` |
| `NEARAI_API_KEY` |
| `SYNTHETIC_API_KEY` |
| `QIANFAN_API_KEY` |
| `HUGGINGFACE_HUB_TOKEN` |
| `XIAOMI_API_KEY` |
| `MINIMAX_API_KEY` |
| `MISTRAL_API_KEY` |
| `GROQ_API_KEY` |
| `CEREBRAS_API_KEY` |
| `DEEPSEEK_API_KEY` |
| `OLLAMA_API_KEY` |
| `VLLM_API_KEY` |
| `AI_GATEWAY_API_KEY` |
| `DASHSCOPE_API_KEY`（百炼） |

另：`provider` 未在内置表且配置中无 `models.providers` 时，会回退为 `{PROVIDER}_API_KEY`（连字符转下划线、大写）。

### 6.2 按厂商覆盖默认模型与 Base URL

对内置厂商，可在环境中设置（或在 `config.env.vars` 中设置）：

- `<PROVIDER>_MODEL`：默认用的大写前缀为 `GROQ_MODEL`、`VENICE_MODEL`、`MOONSHOT_MODEL` 等（`kimi-coding` 使用 **`KIMI_MODEL`** / **`KIMI_BASE_URL`**，而非 `KIMI_CODING_*`）。

- `<PROVIDER>_BASE_URL`：同上规则覆盖默认 API Base URL。

解析经 `getEnvVar`，支持 `config.env.modelEnv` 按 `provider/modelId` 粒度覆盖。

---

## 7. MCP 与 Hook 中的展开

- MCP 服务器环境串中的 `$VAR` 或 `os.Expand` 语义会读取**当时进程环境**（`src/pkg/acp/mcp/manager.go`）。
- 通道凭据（企微、飞书等）主要在 **配置文件** 中，**不**依赖固定名称的全局环境变量（除非你在 `env.vars` 中自行映射）。

---

## 8. 前端（Vite / 开发构建）

以下在 **开发或构建 UI 时** 生效（Node / Vite），不属于 Go 进程：

| 变量 | 说明 |
|------|------|
| `VITE_OPENOCTA_BACKEND_URL` | 浏览器侧直连网关的完整 URL（优先）。 |
| `VITE_OPENOCTA_BACKEND_HOST` | 与 `VITE_OPENOCTA_BACKEND_PORT` 组合为后端地址（次优先）。 |
| `VITE_OPENOCTA_BACKEND_PORT` | 同上。 |
| `OPENCLAW_CONTROL_UI_BASE_PATH` | **构建时**静态资源 `base`（如 `/control-ui/`）；见 `ui/vite.config.ts`、`ui/README.md`。 |

嵌入到 HTML 的 `window.__OPENCLAW_*` 等为打包注入常量，**不是**运行时 `process.env`，此处不逐项列出。

---

## 9. 遗留与别名前缀

| 前缀 | 说明 |
|------|------|
| `CLAWDBOT_*` | 状态目录、配置路径、网关端口等与 `OPENOCTA_*` 平行，便于从旧安装迁移。 |
| `OPENCLAW_*` | 部分历史命名（Skills 目录、UI base path）；新功能优先使用 `OPENOCTA_*`。 |

---

## 10. 相关文档

- 大模型厂商、模型引用与配置示例：`src/docs/model-providers.md`
- UI 本地开发说明：`ui/README.md`

---

*文档由代码检索生成；若与实现不一致，以对应 `.go` 源文件为准。*
