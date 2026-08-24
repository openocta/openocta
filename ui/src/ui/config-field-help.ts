/**
 * i18n for config form field help text (aligned with src/config/schema.ts FIELD_HELP).
 * Backend sends uiHints with path -> English help; we resolve the display help
 * by path so the UI can show the current locale.
 */

import type { Locale } from "./strings.js";
import { getLocale } from "./strings.js";
import { pathKey } from "./views/config-form.shared.js";

function lookupKeys(path: Array<string | number>): string[] {
  const keyExact = pathKey(path);
  const keyWild = path.map((s) => (typeof s === "number" ? "*" : s)).join(".");
  const keyBracket = keyWild.replace(/\.\*/g, "[]");
  return [keyExact, keyWild, keyBracket];
}

const CONFIG_FIELD_HELP: Record<Locale, Record<string, string>> = {
  en: {
    "meta.lastTouchedVersion": "Auto-set when OpenClaw writes the config.",
    "meta.lastTouchedAt": "ISO timestamp of the last config write (auto-set).",
    "update.channel": 'Update channel for git + npm installs ("stable", "beta", or "dev").',
    "update.checkOnStart": "Check for npm updates when the gateway starts (default: true).",
    "gateway.remote.url": "Remote Gateway WebSocket URL (ws:// or wss://).",
    "gateway.remote.tlsFingerprint":
      "Expected sha256 TLS fingerprint for the remote gateway (pin to avoid MITM).",
    "gateway.remote.sshTarget":
      "Remote gateway over SSH (tunnels the gateway port to localhost). Format: user@host or user@host:port.",
    "gateway.remote.sshIdentity": "Optional SSH identity file path (passed to ssh -i).",
    "agents.list.*.skills":
      "Optional allowlist of skills for this agent (omit = all skills; empty = no skills).",
    "agents.list[].skills":
      "Optional allowlist of skills for this agent (omit = all skills; empty = no skills).",
    "agents.list[].identity.avatar":
      "Avatar image path (relative to the agent workspace only) or a remote URL/data URL.",
    "discovery.mdns.mode":
      'mDNS broadcast mode ("minimal" default, "full" includes cliPath/sshPort, "off" disables mDNS).',
    "gateway.auth.token":
      "Required by default for gateway access (unless using Tailscale Serve identity); required for non-loopback binds.",
    "gateway.auth.password": "Required for Tailscale funnel.",
    "gateway.controlUi.basePath":
      "Optional URL prefix where the Control UI is served (e.g. /openclaw).",
    "gateway.controlUi.root":
      "Optional filesystem root for Control UI assets (defaults to dist/control-ui).",
    "gateway.controlUi.allowedOrigins":
      "Allowed browser origins for Control UI/WebChat websocket connections (full origins only, e.g. https://control.example.com).",
    "gateway.controlUi.allowInsecureAuth":
      "Allow Control UI auth over insecure HTTP (token-only; not recommended).",
    "gateway.controlUi.dangerouslyDisableDeviceAuth":
      "DANGEROUS. Disable Control UI device identity checks (token/password only).",
    "gateway.http.endpoints.chatCompletions.enabled":
      "Enable the OpenAI-compatible `POST /v1/chat/completions` endpoint (default: false).",
    "gateway.reload.mode": 'Hot reload strategy for config changes ("hybrid" recommended).',
    "gateway.reload.debounceMs": "Debounce window (ms) before applying config changes.",
    "gateway.nodes.browser.mode":
      'Node browser routing ("auto" = pick single connected browser node, "manual" = require node param, "off" = disable).',
    "gateway.nodes.browser.node": "Pin browser routing to a specific node id or name (optional).",
    "gateway.nodes.allowCommands":
      "Extra node.invoke commands to allow beyond the gateway defaults (array of command strings).",
    "gateway.nodes.denyCommands":
      "Commands to block even if present in node claims or default allowlist.",
    "nodeHost.browserProxy.enabled": "Expose the local browser control server via node proxy.",
    "nodeHost.browserProxy.allowProfiles":
      "Optional allowlist of browser profile names exposed via the node proxy.",
    "diagnostics.flags":
      'Enable targeted diagnostics logs by flag (e.g. ["telegram.http"]). Supports wildcards like "telegram.*" or "*".',
    "diagnostics.cacheTrace.enabled":
      "Log cache trace snapshots for embedded agent runs (default: false).",
    "diagnostics.cacheTrace.filePath":
      "JSONL output path for cache trace logs (default: $OPENCLAW_STATE_DIR/logs/cache-trace.jsonl).",
    "diagnostics.cacheTrace.includeMessages":
      "Include full message payloads in trace output (default: true).",
    "diagnostics.cacheTrace.includePrompt": "Include prompt text in trace output (default: true).",
    "diagnostics.cacheTrace.includeSystem":
      "Include system prompt in trace output (default: true).",
    "tools.exec.applyPatch.enabled":
      "Experimental. Enables apply_patch for OpenAI models when allowed by tool policy.",
    "tools.exec.applyPatch.allowModels":
      'Optional allowlist of model ids (e.g. "gpt-5.2" or "openai/gpt-5.2").',
    "tools.exec.notifyOnExit":
      "When true (default), backgrounded exec sessions enqueue a system event and request a heartbeat on exit.",
    "tools.exec.pathPrepend": "Directories to prepend to PATH for exec runs (gateway/sandbox).",
    "tools.exec.safeBins":
      "Allow stdin-only safe binaries to run without explicit allowlist entries.",
    "tools.message.allowCrossContextSend":
      "Legacy override: allow cross-context sends across all providers.",
    "tools.message.crossContext.allowWithinProvider":
      "Allow sends to other channels within the same provider (default: true).",
    "tools.message.crossContext.allowAcrossProviders":
      "Allow sends across different providers (default: false).",
    "tools.message.crossContext.marker.enabled":
      "Add a visible origin marker when sending cross-context (default: true).",
    "tools.message.crossContext.marker.prefix":
      'Text prefix for cross-context markers (supports "{channel}").',
    "tools.message.crossContext.marker.suffix":
      'Text suffix for cross-context markers (supports "{channel}").',
    "tools.message.broadcast.enabled": "Enable broadcast action (default: true).",
    "tools.web.search.enabled": "Enable the web_search tool (requires a provider API key).",
    "tools.web.search.provider": 'Search provider ("brave" or "perplexity").',
    "tools.web.search.apiKey": "Brave Search API key (fallback: BRAVE_API_KEY env var).",
    "tools.web.search.maxResults": "Default number of results to return (1-10).",
    "tools.web.search.timeoutSeconds": "Timeout in seconds for web_search requests.",
    "tools.web.search.cacheTtlMinutes": "Cache TTL in minutes for web_search results.",
    "tools.web.search.perplexity.apiKey":
      "Perplexity or OpenRouter API key (fallback: PERPLEXITY_API_KEY or OPENROUTER_API_KEY env var).",
    "tools.web.search.perplexity.baseUrl":
      "Perplexity base URL override (default: https://openrouter.ai/api/v1 or https://api.perplexity.ai).",
    "tools.web.search.perplexity.model":
      'Perplexity model override (default: "perplexity/sonar-pro").',
    "tools.web.fetch.enabled": "Enable the web_fetch tool (lightweight HTTP fetch).",
    "tools.web.fetch.maxChars": "Max characters returned by web_fetch (truncated).",
    "tools.web.fetch.maxCharsCap":
      "Hard cap for web_fetch maxChars (applies to config and tool calls).",
    "tools.web.fetch.timeoutSeconds": "Timeout in seconds for web_fetch requests.",
    "tools.web.fetch.cacheTtlMinutes": "Cache TTL in minutes for web_fetch results.",
    "tools.web.fetch.maxRedirects": "Maximum redirects allowed for web_fetch (default: 3).",
    "tools.web.fetch.userAgent": "Override User-Agent header for web_fetch requests.",
    "tools.web.fetch.readability":
      "Use Readability to extract main content from HTML (fallbacks to basic HTML cleanup).",
    "tools.web.fetch.firecrawl.enabled": "Enable Firecrawl fallback for web_fetch (if configured).",
    "tools.web.fetch.firecrawl.apiKey": "Firecrawl API key (fallback: FIRECRAWL_API_KEY env var).",
    "tools.web.fetch.firecrawl.baseUrl":
      "Firecrawl base URL (e.g. https://api.firecrawl.dev or custom endpoint).",
    "tools.web.fetch.firecrawl.onlyMainContent":
      "When true, Firecrawl returns only the main content (default: true).",
    "tools.web.fetch.firecrawl.maxAgeMs":
      "Firecrawl maxAge (ms) for cached results when supported by the API.",
    "tools.web.fetch.firecrawl.timeoutSeconds": "Timeout in seconds for Firecrawl requests.",
    "channels.slack.allowBots":
      "Allow bot-authored messages to trigger Slack replies (default: false).",
    "channels.slack.thread.historyScope":
      'Scope for Slack thread history context ("thread" isolates per thread; "channel" reuses channel history).',
    "channels.slack.thread.inheritParent":
      "If true, Slack thread sessions inherit the parent channel transcript (default: false).",
    "channels.mattermost.botToken":
      "Bot token from Mattermost System Console -> Integrations -> Bot Accounts.",
    "channels.mattermost.baseUrl":
      "Base URL for your Mattermost server (e.g., https://chat.example.com).",
    "channels.mattermost.chatmode":
      'Reply to channel messages on mention ("oncall"), on trigger chars (">" or "!") ("onchar"), or on every message ("onmessage").',
    "channels.mattermost.oncharPrefixes": 'Trigger prefixes for onchar mode (default: [">", "!"]).',
    "channels.mattermost.requireMention":
      "Require @mention in channels before responding (default: true).",
    "auth.profiles": "Named auth profiles (provider + mode + optional email).",
    "auth.order": "Ordered auth profile IDs per provider (used for automatic failover).",
    "auth.cooldowns.billingBackoffHours":
      "Base backoff (hours) when a profile fails due to billing/insufficient credits (default: 5).",
    "auth.cooldowns.billingBackoffHoursByProvider":
      "Optional per-provider overrides for billing backoff (hours).",
    "auth.cooldowns.billingMaxHours": "Cap (hours) for billing backoff (default: 24).",
    "auth.cooldowns.failureWindowHours":
      "Failure window (hours) for backoff counters (default: 24).",
    "agents.defaults.bootstrapMaxChars":
      "Max characters of each workspace bootstrap file injected into the system prompt before truncation (default: 20000).",
    "agents.defaults.repoRoot":
      "Optional repository root shown in the system prompt runtime line (overrides auto-detect).",
    "agents.defaults.envelopeTimezone":
      'Timezone for message envelopes ("utc", "local", "user", or an IANA timezone string).',
    "agents.defaults.envelopeTimestamp":
      'Include absolute timestamps in message envelopes ("on" or "off").',
    "agents.defaults.envelopeElapsed": 'Include elapsed time in message envelopes ("on" or "off").',
    "agents.defaults.models": "Configured model catalog (keys are full provider/model IDs).",
    "agents.defaults.knowledge":
      "Obsidian-compatible vault indexing for memory_search (vault path and index are auto-managed).",
    "agents.defaults.knowledge.vaultDir":
      "Absolute path to the Vault directory; when empty, uses workspace/vault or ~/.openocta/vault.",
    memory: "Memory backend configuration (global).",
    "memory.backend": 'Memory backend ("builtin" for OpenClaw embeddings, "qmd" for QMD sidecar).',
    "memory.citations": 'Default citation behavior ("auto", "on", or "off").',
    "memory.qmd.command": "Path to the qmd binary (default: resolves from PATH).",
    "memory.qmd.includeDefaultMemory":
      "Whether to automatically index MEMORY.md + memory/**/*.md (default: true).",
    "memory.qmd.paths":
      "Additional directories/files to index with QMD (path + optional glob pattern).",
    "memory.qmd.paths.path": "Absolute or ~-relative path to index via QMD.",
    "memory.qmd.paths.pattern": "Glob pattern relative to the path root (default: **/*.md).",
    "memory.qmd.paths.name":
      "Optional stable name for the QMD collection (default derived from path).",
    "memory.qmd.sessions.enabled":
      "Enable QMD session transcript indexing (experimental, default: false).",
    "memory.qmd.sessions.exportDir":
      "Override directory for sanitized session exports before indexing.",
    "memory.qmd.sessions.retentionDays":
      "Retention window for exported sessions before pruning (default: unlimited).",
    "memory.qmd.update.interval":
      "How often the QMD sidecar refreshes indexes (duration string, default: 5m).",
    "memory.qmd.update.debounceMs":
      "Minimum delay between successive QMD refresh runs (default: 15000).",
    "memory.qmd.update.onBoot": "Run QMD update once on gateway startup (default: true).",
    "memory.qmd.update.embedInterval":
      "How often QMD embeddings are refreshed (duration string, default: 60m). Set to 0 to disable periodic embed.",
    "memory.qmd.limits.maxResults": "Max QMD results returned to the agent loop (default: 6).",
    "memory.qmd.limits.maxSnippetChars":
      "Max characters per snippet pulled from QMD (default: 700).",
    "memory.qmd.limits.maxInjectedChars": "Max total characters injected from QMD hits per turn.",
    "memory.qmd.limits.timeoutMs": "Per-query timeout for QMD searches (default: 4000).",
    "memory.qmd.scope":
      "Session/channel scope for QMD recall (same syntax as session.sendPolicy; default: direct-only).",
    "plugins.enabled": "Enable plugin/extension loading (default: true).",
    "plugins.allow": "Optional allowlist of plugin ids; when set, only listed plugins load.",
    "plugins.deny": "Optional denylist of plugin ids; deny wins over allowlist.",
    "plugins.load.paths": "Additional plugin files or directories to load.",
    "plugins.slots": "Select which plugins own exclusive slots (memory, etc.).",
    "plugins.slots.memory":
      'Select the active memory plugin by id, or "none" to disable memory plugins.',
    "plugins.entries": "Per-plugin settings keyed by plugin id (enable/disable + config payloads).",
    "plugins.entries.*.enabled":
      "Overrides plugin enable/disable for this entry (restart required).",
    "plugins.entries.*.config": "Plugin-defined config payload (schema is provided by the plugin).",
    "plugins.installs":
      "CLI-managed install metadata (used by `openclaw plugins update` to locate install sources).",
    "plugins.installs.*.source": 'Install source ("npm", "archive", or "path").',
    "plugins.installs.*.spec": "Original npm spec used for install (if source is npm).",
    "plugins.installs.*.sourcePath": "Original archive/path used for install (if any).",
    "plugins.installs.*.installPath":
      "Resolved install directory (usually ~/.openclaw/extensions/<id>).",
    "plugins.installs.*.version": "Version recorded at install time (if available).",
    "plugins.installs.*.installedAt": "ISO timestamp of last install/update.",
    "agents.list.*.identity.avatar":
      "Agent avatar (workspace-relative path, http(s) URL, or data URI).",
    "agents.defaults.model.primary": "Primary model (provider/model).",
    "agents.defaults.model.fallbacks":
      "Ordered fallback models (provider/model). Used when the primary model fails.",
    "agents.defaults.imageModel.primary":
      "Optional image model (provider/model) used when the primary model lacks image input.",
    "agents.defaults.imageModel.fallbacks": "Ordered fallback image models (provider/model).",
    "agents.defaults.cliBackends":
      "Optional CLI backends for text-only fallback (claude-cli, etc.).",
    "agents.defaults.humanDelay.mode":
      'Delay style for block replies ("off", "natural", "custom").',
    "agents.defaults.humanDelay.minMs": "Minimum delay in ms for custom humanDelay (default: 800).",
    "agents.defaults.humanDelay.maxMs":
      "Maximum delay in ms for custom humanDelay (default: 2500).",
    "commands.native":
      "Register native commands with channels that support it (Discord/Slack/Telegram).",
    "commands.nativeSkills":
      "Register native skill commands (user-invocable skills) with channels that support it.",
    "commands.text": "Allow text command parsing (slash commands only).",
    "commands.bash":
      "Allow bash chat command (`!`; `/bash` alias) to run host shell commands (default: false; requires tools.elevated).",
    "commands.bashForegroundMs":
      "How long bash waits before backgrounding (default: 2000; 0 backgrounds immediately).",
    "commands.config": "Allow /config chat command to read/write config on disk (default: false).",
    "commands.debug": "Allow /debug chat command for runtime-only overrides (default: false).",
    "commands.restart": "Allow /restart and gateway restart tool actions (default: false).",
    "commands.useAccessGroups": "Enforce access-group allowlists/policies for commands.",
    "commands.ownerAllowFrom":
      "Explicit owner allowlist for owner-only tools/commands. Use channel-native IDs (optionally prefixed like \"whatsapp:+15551234567\"). '*' is ignored.",
    "session.dmScope":
      'DM session scoping: "main" keeps continuity; "per-peer", "per-channel-peer", or "per-account-channel-peer" isolates DM history (recommended for shared inboxes/multi-account).',
    "session.identityLinks":
      "Map canonical identities to provider-prefixed peer IDs for DM session linking (example: telegram:123456).",
    "channels.telegram.configWrites":
      "Allow Telegram to write config in response to channel events/commands (default: true).",
    "channels.slack.configWrites":
      "Allow Slack to write config in response to channel events/commands (default: true).",
    "channels.mattermost.configWrites":
      "Allow Mattermost to write config in response to channel events/commands (default: true).",
    "channels.discord.configWrites":
      "Allow Discord to write config in response to channel events/commands (default: true).",
    "channels.whatsapp.configWrites":
      "Allow WhatsApp to write config in response to channel events/commands (default: true).",
    "channels.signal.configWrites":
      "Allow Signal to write config in response to channel events/commands (default: true).",
    "channels.imessage.configWrites":
      "Allow iMessage to write config in response to channel events/commands (default: true).",
    "channels.msteams.configWrites":
      "Allow Microsoft Teams to write config in response to channel events/commands (default: true).",
    "channels.discord.commands.native": 'Override native commands for Discord (bool or "auto").',
    "channels.discord.commands.nativeSkills":
      'Override native skill commands for Discord (bool or "auto").',
    "channels.telegram.commands.native": 'Override native commands for Telegram (bool or "auto").',
    "channels.telegram.commands.nativeSkills":
      'Override native skill commands for Telegram (bool or "auto").',
    "channels.slack.commands.native": 'Override native commands for Slack (bool or "auto").',
    "channels.slack.commands.nativeSkills":
      'Override native skill commands for Slack (bool or "auto").',
    "session.agentToAgent.maxPingPongTurns":
      "Max reply-back turns between requester and target (0–5).",
    "channels.telegram.customCommands":
      "Additional Telegram bot menu commands (merged with native; conflicts ignored).",
    "messages.ackReaction": "Emoji reaction used to acknowledge inbound messages (empty disables).",
    "messages.ackReactionScope":
      'When to send ack reactions ("group-mentions", "group-all", "direct", "all").',
    "messages.inbound.debounceMs":
      "Debounce window (ms) for batching rapid inbound messages from the same sender (0 to disable).",
    "channels.telegram.dmPolicy":
      'Direct message access control ("pairing" recommended). "open" requires channels.telegram.allowFrom=["*"].',
    "channels.telegram.streamMode":
      "Draft streaming mode for Telegram replies (off | partial | block). Separate from block streaming; requires private topics + sendMessageDraft.",
    "channels.telegram.draftChunk.minChars":
      'Minimum chars before emitting a Telegram draft update when channels.telegram.streamMode="block" (default: 200).',
    "channels.telegram.draftChunk.maxChars":
      'Target max size for a Telegram draft update chunk when channels.telegram.streamMode="block" (default: 800; clamped to channels.telegram.textChunkLimit).',
    "channels.telegram.draftChunk.breakPreference":
      "Preferred breakpoints for Telegram draft chunks (paragraph | newline | sentence). Default: paragraph.",
    "channels.telegram.retry.attempts":
      "Max retry attempts for outbound Telegram API calls (default: 3).",
    "channels.telegram.retry.minDelayMs": "Minimum retry delay in ms for Telegram outbound calls.",
    "channels.telegram.retry.maxDelayMs":
      "Maximum retry delay cap in ms for Telegram outbound calls.",
    "channels.telegram.retry.jitter": "Jitter factor (0-1) applied to Telegram retry delays.",
    "channels.telegram.network.autoSelectFamily":
      "Override Node autoSelectFamily for Telegram (true=enable, false=disable).",
    "channels.telegram.timeoutSeconds":
      "Max seconds before Telegram API requests are aborted (default: 500 per grammY).",
    "channels.whatsapp.dmPolicy":
      'Direct message access control ("pairing" recommended). "open" requires channels.whatsapp.allowFrom=["*"].',
    "channels.whatsapp.selfChatMode": "Same-phone setup (bot uses your personal WhatsApp number).",
    "channels.whatsapp.debounceMs":
      "Debounce window (ms) for batching rapid consecutive messages from the same sender (0 to disable).",
    "channels.signal.dmPolicy":
      'Direct message access control ("pairing" recommended). "open" requires channels.signal.allowFrom=["*"].',
    "channels.imessage.dmPolicy":
      'Direct message access control ("pairing" recommended). "open" requires channels.imessage.allowFrom=["*"].',
    "channels.bluebubbles.dmPolicy":
      'Direct message access control ("pairing" recommended). "open" requires channels.bluebubbles.allowFrom=["*"].',
    "channels.discord.dm.policy":
      'Direct message access control ("pairing" recommended). "open" requires channels.discord.dm.allowFrom=["*"].',
    "channels.discord.retry.attempts":
      "Max retry attempts for outbound Discord API calls (default: 3).",
    "channels.discord.retry.minDelayMs": "Minimum retry delay in ms for Discord outbound calls.",
    "channels.discord.retry.maxDelayMs":
      "Maximum retry delay cap in ms for Discord outbound calls.",
    "channels.discord.retry.jitter": "Jitter factor (0-1) applied to Discord retry delays.",
    "channels.discord.maxLinesPerMessage": "Soft max line count per Discord message (default: 17).",
    "channels.discord.intents.presence":
      "Enable the Guild Presences privileged intent. Must also be enabled in the Discord Developer Portal. Allows tracking user activities (e.g. Spotify). Default: false.",
    "channels.discord.intents.guildMembers":
      "Enable the Guild Members privileged intent. Must also be enabled in the Discord Developer Portal. Default: false.",
    "channels.discord.pluralkit.enabled":
      "Resolve PluralKit proxied messages and treat system members as distinct senders.",
    "channels.discord.pluralkit.token":
      "Optional PluralKit token for resolving private systems or members.",
    "channels.slack.dm.policy":
      'Direct message access control ("pairing" recommended). "open" requires channels.slack.dm.allowFrom=["*"].',
  },
  zh: {
    "meta.lastTouchedVersion": "OpenClaw 写入配置时自动设置。",
    "meta.lastTouchedAt": "最后一次配置写入的 ISO 时间戳（自动设置）。",
    "update.channel": 'git + npm 安装的更新渠道（"stable"、"beta" 或 "dev"）。',
    "update.checkOnStart": "网关启动时检查 npm 更新（默认：true）。",
    "gateway.remote.url": "远程网关 WebSocket URL（ws:// 或 wss://）。",
    "gateway.remote.tlsFingerprint": "远程网关的预期 sha256 TLS 指纹（固定以避免中间人攻击）。",
    "gateway.remote.sshTarget":
      "通过 SSH 的远程网关（将网关端口隧道到 localhost）。格式：user@host 或 user@host:port。",
    "gateway.remote.sshIdentity": "可选的 SSH 身份文件路径（传递给 ssh -i）。",
    "agents.list.*.skills": "此代理的可选技能允许列表（省略 = 所有技能；空 = 无技能）。",
    "agents.list[].skills": "此代理的可选技能允许列表（省略 = 所有技能；空 = 无技能）。",
    "agents.list[].identity.avatar": "头像图片路径（仅相对于代理工作区）或远程 URL/data URL。",
    "discovery.mdns.mode":
      'mDNS 广播模式（"minimal" 默认，"full" 包含 cliPath/sshPort，"off" 禁用 mDNS）。',
    "gateway.auth.token":
      "默认情况下网关访问所需（除非使用 Tailscale Serve 身份）；非回环绑定需要。",
    "gateway.auth.password": "Tailscale funnel 需要。",
    "gateway.controlUi.basePath": "控制台 UI 服务的可选 URL 前缀（例如 /openclaw）。",
    "gateway.controlUi.root": "控制台 UI 资源的可选文件系统根目录（默认为 dist/control-ui）。",
    "gateway.controlUi.allowedOrigins":
      "控制台 UI/WebChat websocket 连接允许的浏览器来源（仅完整来源，例如 https://control.example.com）。",
    "gateway.controlUi.allowInsecureAuth":
      "允许通过不安全 HTTP 进行控制台 UI 认证（仅令牌；不推荐）。",
    "gateway.controlUi.dangerouslyDisableDeviceAuth":
      "危险。禁用控制台 UI 设备身份检查（仅令牌/密码）。",
    "gateway.http.endpoints.chatCompletions.enabled":
      "启用 OpenAI 兼容的 `POST /v1/chat/completions` 端点（默认：false）。",
    "gateway.reload.mode": '配置更改的热重载策略（推荐 "hybrid"）。',
    "gateway.reload.debounceMs": "应用配置更改前的防抖窗口（毫秒）。",
    "gateway.nodes.browser.mode":
      '节点浏览器路由（"auto" = 选择单个连接的浏览器节点，"manual" = 需要节点参数，"off" = 禁用）。',
    "gateway.nodes.browser.node": "将浏览器路由固定到特定节点 id 或名称（可选）。",
    "gateway.nodes.allowCommands":
      "允许的额外 node.invoke 命令，超出网关默认值（命令字符串数组）。",
    "gateway.nodes.denyCommands": "即使存在于节点声明或默认允许列表中也要阻止的命令。",
    "nodeHost.browserProxy.enabled": "通过节点代理暴露本地浏览器控制服务器。",
    "nodeHost.browserProxy.allowProfiles": "通过节点代理暴露的浏览器配置集名称的可选允许列表。",
    "diagnostics.flags":
      '按标志启用目标诊断日志（例如 ["telegram.http"]）。支持通配符，如 "telegram.*" 或 "*"。',
    "diagnostics.cacheTrace.enabled": "记录嵌入代理运行的缓存跟踪快照（默认：false）。",
    "diagnostics.cacheTrace.filePath":
      "缓存跟踪日志的 JSONL 输出路径（默认：$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl）。",
    "diagnostics.cacheTrace.includeMessages": "在跟踪输出中包含完整消息负载（默认：true）。",
    "diagnostics.cacheTrace.includePrompt": "在跟踪输出中包含提示文本（默认：true）。",
    "diagnostics.cacheTrace.includeSystem": "在跟踪输出中包含系统提示（默认：true）。",
    "tools.exec.applyPatch.enabled": "实验性。在工具策略允许时，为 OpenAI 模型启用 apply_patch。",
    "tools.exec.applyPatch.allowModels":
      '模型 id 的可选允许列表（例如 "gpt-5.2" 或 "openai/gpt-5.2"）。',
    "tools.exec.notifyOnExit":
      "当为 true（默认）时，后台 exec 会话在退出时排队系统事件并请求心跳。",
    "tools.exec.pathPrepend": "为 exec 运行前置到 PATH 的目录（网关/沙箱）。",
    "tools.exec.safeBins": "允许仅 stdin 的安全二进制文件在没有显式允许列表条目的情况下运行。",
    "tools.message.allowCrossContextSend": "遗留覆盖：允许跨所有提供方的跨上下文发送。",
    "tools.message.crossContext.allowWithinProvider":
      "允许发送到同一提供方内的其他通道（默认：true）。",
    "tools.message.crossContext.allowAcrossProviders": "允许跨不同提供方发送（默认：false）。",
    "tools.message.crossContext.marker.enabled": "发送跨上下文时添加可见的来源标记（默认：true）。",
    "tools.message.crossContext.marker.prefix": '跨上下文标记的文本前缀（支持 "{channel}"）。',
    "tools.message.crossContext.marker.suffix": '跨上下文标记的文本后缀（支持 "{channel}"）。',
    "tools.message.broadcast.enabled": "启用广播操作（默认：true）。",
    "tools.web.search.enabled": "启用 web_search 工具（需要提供方 API 密钥）。",
    "tools.web.search.provider": '搜索提供方（"brave" 或 "perplexity"）。',
    "tools.web.search.apiKey": "Brave Search API 密钥（回退：BRAVE_API_KEY 环境变量）。",
    "tools.web.search.maxResults": "默认返回的结果数（1-10）。",
    "tools.web.search.timeoutSeconds": "web_search 请求的超时（秒）。",
    "tools.web.search.cacheTtlMinutes": "web_search 结果的缓存 TTL（分钟）。",
    "tools.web.search.perplexity.apiKey":
      "Perplexity 或 OpenRouter API 密钥（回退：PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY 环境变量）。",
    "tools.web.search.perplexity.baseUrl":
      "Perplexity base URL 覆盖（默认：https://openrouter.ai/api/v1 或 https://api.perplexity.ai）。",
    "tools.web.search.perplexity.model": 'Perplexity 模型覆盖（默认："perplexity/sonar-pro"）。',
    "tools.web.fetch.enabled": "启用 web_fetch 工具（轻量级 HTTP 获取）。",
    "tools.web.fetch.maxChars": "web_fetch 返回的最大字符数（截断）。",
    "tools.web.fetch.maxCharsCap": "web_fetch maxChars 的硬上限（适用于配置和工具调用）。",
    "tools.web.fetch.timeoutSeconds": "web_fetch 请求的超时（秒）。",
    "tools.web.fetch.cacheTtlMinutes": "web_fetch 结果的缓存 TTL（分钟）。",
    "tools.web.fetch.maxRedirects": "web_fetch 允许的最大重定向数（默认：3）。",
    "tools.web.fetch.userAgent": "覆盖 web_fetch 请求的 User-Agent 头。",
    "tools.web.fetch.readability":
      "使用 Readability 从 HTML 中提取主要内容（回退到基本 HTML 清理）。",
    "tools.web.fetch.firecrawl.enabled": "启用 Firecrawl 回退用于 web_fetch（如果已配置）。",
    "tools.web.fetch.firecrawl.apiKey": "Firecrawl API 密钥（回退：FIRECRAWL_API_KEY 环境变量）。",
    "tools.web.fetch.firecrawl.baseUrl":
      "Firecrawl base URL（例如 https://api.firecrawl.dev 或自定义端点）。",
    "tools.web.fetch.firecrawl.onlyMainContent":
      "当为 true 时，Firecrawl 仅返回主要内容（默认：true）。",
    "tools.web.fetch.firecrawl.maxAgeMs": "Firecrawl maxAge（毫秒），用于 API 支持时的缓存结果。",
    "tools.web.fetch.firecrawl.timeoutSeconds": "Firecrawl 请求的超时（秒）。",
    "channels.slack.allowBots": "允许机器人撰写的消息触发 Slack 回复（默认：false）。",
    "channels.slack.thread.historyScope":
      'Slack 线程历史上下文的范围（"thread" 隔离每个线程；"channel" 重用通道历史）。',
    "channels.slack.thread.inheritParent":
      "如果为 true，Slack 线程会话继承父通道转录（默认：false）。",
    "channels.mattermost.botToken":
      "来自 Mattermost 系统控制台 -> 集成 -> 机器人账户的机器人令牌。",
    "channels.mattermost.baseUrl":
      "您的 Mattermost 服务器的 Base URL（例如，https://chat.example.com）。",
    "channels.mattermost.chatmode":
      '在提及（"oncall"）、触发字符（">" 或 "!"）（"onchar"）或每条消息（"onmessage"）时回复通道消息。',
    "channels.mattermost.oncharPrefixes": 'onchar 模式的触发前缀（默认：[">", "!"]）。',
    "channels.mattermost.requireMention": "在回复前要求在通道中 @提及（默认：true）。",
    "auth.profiles": "命名的认证配置集（提供方 + 模式 + 可选电子邮件）。",
    "auth.order": "每个提供方的有序认证配置集 ID（用于自动故障转移）。",
    "auth.cooldowns.billingBackoffHours":
      "当配置集因计费/积分不足而失败时的基本退避（小时）（默认：5）。",
    "auth.cooldowns.billingBackoffHoursByProvider": "每个提供方的计费退避可选覆盖（小时）。",
    "auth.cooldowns.billingMaxHours": "计费退避的上限（小时）（默认：24）。",
    "auth.cooldowns.failureWindowHours": "退避计数器的故障窗口（小时）（默认：24）。",
    "agents.defaults.bootstrapMaxChars":
      "在截断前注入系统提示的每个工作区引导文件的最大字符数（默认：20000）。",
    "agents.defaults.repoRoot": "在系统提示运行时行中显示的可选仓库根目录（覆盖自动检测）。",
    "agents.defaults.envelopeTimezone":
      '消息信封的时区（"utc"、"local"、"user" 或 IANA 时区字符串）。',
    "agents.defaults.envelopeTimestamp": '在消息信封中包含绝对时间戳（"on" 或 "off"）。',
    "agents.defaults.envelopeElapsed": '在消息信封中包含经过时间（"on" 或 "off"）。',
    "agents.defaults.models": "配置的模型目录（键是完整的提供方/模型 ID）。",
    "agents.defaults.knowledge":
      "Obsidian 兼容 Vault 索引，供 memory_search 使用（Vault 与索引路径自动管理）。",
    "agents.defaults.knowledge.vaultDir":
      "Vault 目录绝对路径；留空则使用 workspace/vault 或 ~/.openocta/vault。",
    memory: "记忆后端配置（全局）。",
    "memory.backend": '记忆后端（"builtin" 用于 OpenClaw 嵌入，"qmd" 用于 QMD 侧车）。',
    "memory.citations": '默认引用行为（"auto"、"on" 或 "off"）。',
    "memory.qmd.command": "qmd 可执行文件的路径（默认：从 PATH 解析）。",
    "memory.qmd.includeDefaultMemory": "是否自动索引 MEMORY.md + memory/**/*.md（默认：true）。",
    "memory.qmd.paths": "使用 QMD 索引的额外目录/文件（路径 + 可选 glob 模式）。",
    "memory.qmd.paths.path": "通过 QMD 索引的绝对或 ~ 相对路径。",
    "memory.qmd.paths.pattern": "相对于路径根的 Glob 模式（默认：**/*.md）。",
    "memory.qmd.paths.name": "QMD 集合的可选稳定名称（默认从路径派生）。",
    "memory.qmd.sessions.enabled": "启用 QMD 会话转录索引（实验性，默认：false）。",
    "memory.qmd.sessions.exportDir": "索引前清理会话导出的覆盖目录。",
    "memory.qmd.sessions.retentionDays": "修剪前导出会话的保留窗口（默认：无限制）。",
    "memory.qmd.update.interval": "QMD 侧车刷新索引的频率（持续时间字符串，默认：5m）。",
    "memory.qmd.update.debounceMs": "连续 QMD 刷新运行之间的最小延迟（默认：15000）。",
    "memory.qmd.update.onBoot": "在网关启动时运行一次 QMD 更新（默认：true）。",
    "memory.qmd.update.embedInterval":
      "QMD 嵌入刷新的频率（持续时间字符串，默认：60m）。设置为 0 以禁用定期嵌入。",
    "memory.qmd.limits.maxResults": "返回到代理循环的最大 QMD 结果数（默认：6）。",
    "memory.qmd.limits.maxSnippetChars": "从 QMD 拉取的每个片段的最大字符数（默认：700）。",
    "memory.qmd.limits.maxInjectedChars": "每轮从 QMD 命中注入的最大总字符数。",
    "memory.qmd.limits.timeoutMs": "QMD 搜索的每次查询超时（默认：4000）。",
    "memory.qmd.scope": "QMD 召回会话/通道范围（与 session.sendPolicy 相同的语法；默认：仅直接）。",
    "plugins.enabled": "启用插件/扩展加载（默认：true）。",
    "plugins.allow": "插件 id 的可选允许列表；设置时，仅加载列出的插件。",
    "plugins.deny": "插件 id 的可选拒绝列表；拒绝优先于允许列表。",
    "plugins.load.paths": "要加载的额外插件文件或目录。",
    "plugins.slots": "选择哪些插件拥有独占槽位（记忆等）。",
    "plugins.slots.memory": '按 id 选择活动记忆插件，或 "none" 以禁用记忆插件。',
    "plugins.entries": "按插件 id 键控的每个插件设置（启用/禁用 + 配置负载）。",
    "plugins.entries.*.enabled": "覆盖此条目的插件启用/禁用（需要重启）。",
    "plugins.entries.*.config": "插件定义的配置负载（模式由插件提供）。",
    "plugins.installs": "CLI 管理的安装元数据（由 `openclaw plugins update` 用于定位安装来源）。",
    "plugins.installs.*.source": '安装来源（"npm"、"archive" 或 "path"）。',
    "plugins.installs.*.spec": "用于安装的原始 npm 规格（如果来源是 npm）。",
    "plugins.installs.*.sourcePath": "用于安装的原始存档/路径（如果有）。",
    "plugins.installs.*.installPath": "解析的安装目录（通常是 ~/.openclaw/extensions/<id>）。",
    "plugins.installs.*.version": "安装时记录的版本（如果可用）。",
    "plugins.installs.*.installedAt": "最后一次安装/更新的 ISO 时间戳。",
    "agents.list.*.identity.avatar": "代理头像（工作区相对路径、http(s) URL 或 data URI）。",
    "agents.defaults.model.primary": "主模型（提供方/模型）。",
    "agents.defaults.model.fallbacks": "有序回退模型（提供方/模型）。当主模型失败时使用。",
    "agents.defaults.imageModel.primary":
      "当主模型缺少图像输入时使用的可选图像模型（提供方/模型）。",
    "agents.defaults.imageModel.fallbacks": "有序回退图像模型（提供方/模型）。",
    "agents.defaults.cliBackends": "用于仅文本回退的可选 CLI 后端（claude-cli 等）。",
    "agents.defaults.humanDelay.mode": '块回复的延迟样式（"off"、"natural"、"custom"）。',
    "agents.defaults.humanDelay.minMs": "自定义 humanDelay 的最小延迟（毫秒）（默认：800）。",
    "agents.defaults.humanDelay.maxMs": "自定义 humanDelay 的最大延迟（毫秒）（默认：2500）。",
    "commands.native": "向支持它的通道注册原生命令（Discord/Slack/Telegram）。",
    "commands.nativeSkills": "向支持它的通道注册原生技能命令（用户可调用的技能）。",
    "commands.text": "允许文本命令解析（仅斜杠命令）。",
    "commands.bash":
      "允许 bash 聊天命令（`!`；`/bash` 别名）运行主机 shell 命令（默认：false；需要 tools.elevated）。",
    "commands.bashForegroundMs": "bash 在后台化之前等待的时间（默认：2000；0 立即后台化）。",
    "commands.config": "允许 /config 聊天命令在磁盘上读取/写入配置（默认：false）。",
    "commands.debug": "允许 /debug 聊天命令进行仅运行时覆盖（默认：false）。",
    "commands.restart": "允许 /restart 和网关重启工具操作（默认：false）。",
    "commands.useAccessGroups": "强制执行访问组允许列表/策略用于命令。",
    "commands.ownerAllowFrom":
      "仅所有者工具/命令的显式所有者允许列表。使用通道原生 ID（可选前缀，如 \"whatsapp:+15551234567\"）。'*' 被忽略。",
    "session.dmScope":
      '私信会话范围："main" 保持连续性；"per-peer"、"per-channel-peer" 或 "per-account-channel-peer" 隔离私信历史（推荐用于共享收件箱/多账户）。',
    "session.identityLinks":
      "将规范身份映射到提供方前缀的对等 ID 用于私信会话链接（示例：telegram:123456）。",
    "channels.telegram.configWrites": "允许 Telegram 响应通道事件/命令写入配置（默认：true）。",
    "channels.slack.configWrites": "允许 Slack 响应通道事件/命令写入配置（默认：true）。",
    "channels.mattermost.configWrites": "允许 Mattermost 响应通道事件/命令写入配置（默认：true）。",
    "channels.discord.configWrites": "允许 Discord 响应通道事件/命令写入配置（默认：true）。",
    "channels.whatsapp.configWrites": "允许 WhatsApp 响应通道事件/命令写入配置（默认：true）。",
    "channels.signal.configWrites": "允许 Signal 响应通道事件/命令写入配置（默认：true）。",
    "channels.imessage.configWrites": "允许 iMessage 响应通道事件/命令写入配置（默认：true）。",
    "channels.msteams.configWrites":
      "允许 Microsoft Teams 响应通道事件/命令写入配置（默认：true）。",
    "channels.discord.commands.native": '覆盖 Discord 的原生命令（bool 或 "auto"）。',
    "channels.discord.commands.nativeSkills": '覆盖 Discord 的原生技能命令（bool 或 "auto"）。',
    "channels.telegram.commands.native": '覆盖 Telegram 的原生命令（bool 或 "auto"）。',
    "channels.telegram.commands.nativeSkills": '覆盖 Telegram 的原生技能命令（bool 或 "auto"）。',
    "channels.slack.commands.native": '覆盖 Slack 的原生命令（bool 或 "auto"）。',
    "channels.slack.commands.nativeSkills": '覆盖 Slack 的原生技能命令（bool 或 "auto"）。',
    "session.agentToAgent.maxPingPongTurns": "请求者和目标之间的最大回复轮数（0–5）。",
    "channels.telegram.customCommands":
      "额外的 Telegram 机器人菜单命令（与原生命令合并；冲突被忽略）。",
    "messages.ackReaction": "用于确认入站消息的表情符号反应（空则禁用）。",
    "messages.ackReactionScope":
      '何时发送确认反应（"group-mentions"、"group-all"、"direct"、"all"）。',
    "messages.inbound.debounceMs":
      "批处理来自同一发送者的快速入站消息的防抖窗口（毫秒）（0 以禁用）。",
    "channels.telegram.dmPolicy":
      '直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.telegram.allowFrom=["*"]。',
    "channels.telegram.streamMode":
      "Telegram 回复的草稿流模式（off | partial | block）。与块流分离；需要私有主题 + sendMessageDraft。",
    "channels.telegram.draftChunk.minChars":
      '当 channels.telegram.streamMode="block" 时，发出 Telegram 草稿更新前的最小字符数（默认：200）。',
    "channels.telegram.draftChunk.maxChars":
      '当 channels.telegram.streamMode="block" 时，Telegram 草稿更新块的目标最大大小（默认：800；限制为 channels.telegram.textChunkLimit）。',
    "channels.telegram.draftChunk.breakPreference":
      "Telegram 草稿块的首选断点（paragraph | newline | sentence）。默认：paragraph。",
    "channels.telegram.retry.attempts": "出站 Telegram API 调用的最大重试次数（默认：3）。",
    "channels.telegram.retry.minDelayMs": "Telegram 出站调用的最小重试延迟（毫秒）。",
    "channels.telegram.retry.maxDelayMs": "Telegram 出站调用的最大重试延迟上限（毫秒）。",
    "channels.telegram.retry.jitter": "应用于 Telegram 重试延迟的抖动因子（0-1）。",
    "channels.telegram.network.autoSelectFamily":
      "覆盖 Telegram 的 Node autoSelectFamily（true=启用，false=禁用）。",
    "channels.telegram.timeoutSeconds":
      "Telegram API 请求中止前的最大秒数（默认：500 per grammY）。",
    "channels.whatsapp.dmPolicy":
      '直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.whatsapp.allowFrom=["*"]。',
    "channels.whatsapp.selfChatMode": "同手机设置（机器人使用您的个人 WhatsApp 号码）。",
    "channels.whatsapp.debounceMs":
      "批处理来自同一发送者的快速连续消息的防抖窗口（毫秒）（0 以禁用）。",
    "channels.signal.dmPolicy":
      '直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.signal.allowFrom=["*"]。',
    "channels.imessage.dmPolicy":
      '直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.imessage.allowFrom=["*"]。',
    "channels.bluebubbles.dmPolicy":
      '直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.bluebubbles.allowFrom=["*"]。',
    "channels.discord.dm.policy":
      '直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.discord.dm.allowFrom=["*"]。',
    "channels.discord.retry.attempts": "出站 Discord API 调用的最大重试次数（默认：3）。",
    "channels.discord.retry.minDelayMs": "Discord 出站调用的最小重试延迟（毫秒）。",
    "channels.discord.retry.maxDelayMs": "Discord 出站调用的最大重试延迟上限（毫秒）。",
    "channels.discord.retry.jitter": "应用于 Discord 重试延迟的抖动因子（0-1）。",
    "channels.discord.maxLinesPerMessage": "每个 Discord 消息的软最大行数（默认：17）。",
    "channels.discord.intents.presence":
      "启用 Guild Presences 特权意图。还必须在 Discord 开发者门户中启用。允许跟踪用户活动（例如 Spotify）。默认：false。",
    "channels.discord.intents.guildMembers":
      "启用 Guild Members 特权意图。还必须在 Discord 开发者门户中启用。默认：false。",
    "channels.discord.pluralkit.enabled": "解析 PluralKit 代理消息并将系统成员视为不同的发送者。",
    "channels.discord.pluralkit.token": "用于解析私有系统或成员的可选 PluralKit 令牌。",
    "channels.slack.dm.policy":
      '直接消息访问控制（推荐 "pairing"）。"open" 需要 channels.slack.dm.allowFrom=["*"]。',
  },
};

/**
 * Resolve the display help text for a config field path. Uses locale-specific
 * CONFIG_FIELD_HELP; falls back to the provided fallback (e.g. hint.help from backend).
 */
export function getConfigFieldHelp(path: Array<string | number>, fallback: string): string {
  const locale = getLocale();
  const helpTexts = CONFIG_FIELD_HELP[locale];
  for (const key of lookupKeys(path)) {
    const help = helpTexts[key];
    if (help) {
      return help;
    }
  }
  return fallback;
}
