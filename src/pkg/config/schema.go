// Package config defines the full OpenOcta configuration schema.
// Compatible with ~/.openocta/openocta.json and zod schemas in src/config/.
package config

import (
	"encoding/json"
	"strings"
)

// LoggingConfig holds logging settings.
type LoggingConfig struct {
	Level           *string  `json:"level,omitempty"` // "silent" | "fatal" | "error" | "warn" | "info" | "debug" | "trace"
	File            string   `json:"file,omitempty"`
	ConsoleLevel    *string  `json:"consoleLevel,omitempty"`    // "silent" | "fatal" | "error" | "warn" | "info" | "debug" | "trace"
	ConsoleStyle    *string  `json:"consoleStyle,omitempty"`    // "pretty" | "compact" | "json"
	RedactSensitive *string  `json:"redactSensitive,omitempty"` // "off" | "tools"
	RedactPatterns  []string `json:"redactPatterns,omitempty"`
}

// OpenOctaConfig is the root configuration structure.
// Mirrors OpenOctaConfig from src/config/types.openclaw.ts.
type OpenOctaConfig struct {
	Meta        *ConfigMeta        `json:"meta,omitempty"`
	Auth        *AuthConfig        `json:"auth,omitempty"`
	Env         *EnvConfig         `json:"env,omitempty"`
	Wizard      *WizardConfig      `json:"wizard,omitempty"`
	Diagnostics *DiagnosticsConfig `json:"diagnostics,omitempty"`
	Logging     *LoggingConfig     `json:"logging,omitempty"`
	Update      *UpdateConfig      `json:"update,omitempty"`
	Browser     *BrowserConfig     `json:"browser,omitempty"`
	UI          *UIConfig          `json:"ui,omitempty"`
	Skills      *SkillsConfig      `json:"skills,omitempty"`
	Plugins     *PluginsConfig     `json:"plugins,omitempty"`
	Models      *ModelsConfig      `json:"models,omitempty"`
	NodeHost    *NodeHostConfig    `json:"nodeHost,omitempty"`
	Agents      *AgentsConfig      `json:"agents,omitempty"`
	Tools       *ToolsConfig       `json:"tools,omitempty"`
	Bindings    []AgentBinding     `json:"bindings,omitempty"`
	Broadcast   *BroadcastConfig   `json:"broadcast,omitempty"`
	Audio       *AudioConfig       `json:"audio,omitempty"`
	Messages    *MessagesConfig    `json:"messages,omitempty"`
	Commands    *CommandsConfig    `json:"commands,omitempty"`
	Approvals   *ApprovalsConfig   `json:"approvals,omitempty"`
	Session     *SessionConfig     `json:"session,omitempty"`
	Web         *WebConfig         `json:"web,omitempty"`
	Channels    *ChannelsConfig    `json:"channels,omitempty"`
	Cron        *CronConfig        `json:"cron,omitempty"`
	Hooks       *HooksConfig       `json:"hooks,omitempty"`
	Discovery   *DiscoveryConfig   `json:"discovery,omitempty"`
	CanvasHost  *CanvasHostConfig  `json:"canvasHost,omitempty"`
	Talk        *TalkConfig        `json:"talk,omitempty"`
	Gateway     *GatewayConfig     `json:"gateway,omitempty"`
	Memory      *MemoryConfig      `json:"memory,omitempty"`
	Mcp         *McpConfig         `json:"mcp,omitempty"`
}

// McpConfig holds MCP (Model Context Protocol) server connections for agent tools.
// Supports direct MCP server config (command/args or URL) or service URLs that trigger
// a local MCP server (e.g. Prometheus URL -> prometheus-mcp-server via stdio).
type McpConfig struct {
	// Servers maps server key (e.g. "prometheus", "elasticsearch") to connection config.
	// Keys are used as tool name prefix when multiple servers expose same tool names.
	Servers map[string]McpServerEntry `json:"servers,omitempty"`
}

// McpServerEntry configures one MCP server connection. Exactly one of the following applies:
// 1) Command: run command (stdio). Use Args and Env for full control.
// 2) URL: connect to existing MCP server via SSE/HTTP (no Command).
// 3) Service + ServiceURL: backend service URL; we start the matching MCP server locally (stdio).
type McpServerEntry struct {
	Enabled    *bool             `json:"enabled,omitempty"`
	Command    string            `json:"command,omitempty"`    // e.g. "docker", "npx"
	Args       []string          `json:"args,omitempty"`       // e.g. ["run","-i","--rm","-e","PROMETHEUS_URL","..."]
	Env        map[string]string `json:"env,omitempty"`        // env for command (stdio)
	URL        string            `json:"url,omitempty"`        // MCP server URL (SSE/HTTP) when Command is empty
	Service    string            `json:"service,omitempty"`    // "prometheus" | "elasticsearch" | ... when using ServiceURL
	ServiceURL string            `json:"serviceUrl,omitempty"` // backend URL when Service is set (e.g. Prometheus URL)
	ToolPrefix string            `json:"toolPrefix,omitempty"` // optional prefix for tool names from this server
}

// GatewayConfig holds gateway-specific settings.
// Mirrors gateway config from src/config/types.gateway.ts.
type GatewayConfig struct {
	Port           *int                    `json:"port,omitempty"`
	Mode           *string                 `json:"mode,omitempty"` // "local" | "remote"
	Bind           *string                 `json:"bind,omitempty"` // "auto" | "lan" | "loopback" | "custom" | "tailnet"
	CustomBindHost *string                 `json:"customBindHost,omitempty"`
	ControlUI      *GatewayControlUIConfig `json:"controlUi,omitempty"`
	Auth           *GatewayAuthConfig      `json:"auth,omitempty"`
	Tailscale      *GatewayTailscaleConfig `json:"tailscale,omitempty"`
	Remote         *GatewayRemoteConfig    `json:"remote,omitempty"`
	Reload         *GatewayReloadConfig    `json:"reload,omitempty"`
	Tls            *GatewayTlsConfig       `json:"tls,omitempty"`
	Http           *GatewayHttpConfig      `json:"http,omitempty"`
	Nodes          *GatewayNodesConfig     `json:"nodes,omitempty"`
	TrustedProxies []string                `json:"trustedProxies,omitempty"`
}

// GatewayControlUIConfig holds control UI configuration.
type GatewayControlUIConfig struct {
	Enabled                      *bool    `json:"enabled,omitempty"`
	BasePath                     *string  `json:"basePath,omitempty"`
	Root                         *string  `json:"root,omitempty"`
	AllowedOrigins               []string `json:"allowedOrigins,omitempty"`
	AllowInsecureAuth            *bool    `json:"allowInsecureAuth,omitempty"`
	DangerouslyDisableDeviceAuth *bool    `json:"dangerouslyDisableDeviceAuth,omitempty"`
}

// GatewayAuthConfig holds gateway auth (token/password).
type GatewayAuthConfig struct {
	Mode           *string `json:"mode,omitempty"` // "token" | "password"
	Token          string  `json:"token,omitempty"`
	Password       string  `json:"password,omitempty"`
	AllowTailscale *bool   `json:"allowTailscale,omitempty"`
}

// GatewayTailscaleConfig holds Tailscale configuration.
type GatewayTailscaleConfig struct {
	Mode        *string `json:"mode,omitempty"` // "off" | "serve" | "funnel"
	ResetOnExit *bool   `json:"resetOnExit,omitempty"`
}

// GatewayRemoteConfig holds remote gateway configuration.
type GatewayRemoteConfig struct {
	URL            *string `json:"url,omitempty"`
	Transport      *string `json:"transport,omitempty"` // "ssh" | "direct"
	Token          *string `json:"token,omitempty"`
	Password       *string `json:"password,omitempty"`
	TlsFingerprint *string `json:"tlsFingerprint,omitempty"`
	SshTarget      *string `json:"sshTarget,omitempty"`
	SshIdentity    *string `json:"sshIdentity,omitempty"`
}

// GatewayReloadConfig holds config hot-reload settings.
type GatewayReloadConfig struct {
	Mode       *string `json:"mode,omitempty"` // "off" | "restart" | "hot" | "hybrid"
	DebounceMs *int    `json:"debounceMs,omitempty"`
}

// GatewayTlsConfig holds TLS configuration.
type GatewayTlsConfig struct {
	Enabled      *bool   `json:"enabled,omitempty"`
	AutoGenerate *bool   `json:"autoGenerate,omitempty"`
	CertPath     *string `json:"certPath,omitempty"`
	KeyPath      *string `json:"keyPath,omitempty"`
	CaPath       *string `json:"caPath,omitempty"`
}

// GatewayHttpConfig holds HTTP configuration.
type GatewayHttpConfig struct {
	Endpoints *GatewayHttpEndpointsConfig `json:"endpoints,omitempty"`
}

// GatewayHttpEndpointsConfig holds HTTP endpoints configuration.
type GatewayHttpEndpointsConfig struct {
	ChatCompletions *GatewayHttpChatCompletionsConfig `json:"chatCompletions,omitempty"`
	Responses       *GatewayHttpResponsesConfig       `json:"responses,omitempty"`
}

// GatewayHttpChatCompletionsConfig holds chat completions endpoint configuration.
type GatewayHttpChatCompletionsConfig struct {
	Enabled *bool `json:"enabled,omitempty"`
}

// GatewayHttpResponsesConfig holds responses endpoint configuration.
type GatewayHttpResponsesConfig struct {
	Enabled      *bool                             `json:"enabled,omitempty"`
	MaxBodyBytes *int                              `json:"maxBodyBytes,omitempty"`
	Files        *GatewayHttpResponsesFilesConfig  `json:"files,omitempty"`
	Images       *GatewayHttpResponsesImagesConfig `json:"images,omitempty"`
}

// GatewayHttpResponsesFilesConfig holds files configuration.
type GatewayHttpResponsesFilesConfig struct {
	AllowURL     *bool                          `json:"allowUrl,omitempty"`
	AllowedMimes []string                       `json:"allowedMimes,omitempty"`
	MaxBytes     *int                           `json:"maxBytes,omitempty"`
	MaxChars     *int                           `json:"maxChars,omitempty"`
	MaxRedirects *int                           `json:"maxRedirects,omitempty"`
	TimeoutMs    *int                           `json:"timeoutMs,omitempty"`
	Pdf          *GatewayHttpResponsesPdfConfig `json:"pdf,omitempty"`
}

// GatewayHttpResponsesPdfConfig holds PDF configuration.
type GatewayHttpResponsesPdfConfig struct {
	MaxPages     *int `json:"maxPages,omitempty"`
	MaxPixels    *int `json:"maxPixels,omitempty"`
	MinTextChars *int `json:"minTextChars,omitempty"`
}

// GatewayHttpResponsesImagesConfig holds images configuration.
type GatewayHttpResponsesImagesConfig struct {
	AllowURL     *bool    `json:"allowUrl,omitempty"`
	AllowedMimes []string `json:"allowedMimes,omitempty"`
	MaxBytes     *int     `json:"maxBytes,omitempty"`
	MaxRedirects *int     `json:"maxRedirects,omitempty"`
	TimeoutMs    *int     `json:"timeoutMs,omitempty"`
}

// GatewayNodesConfig holds nodes configuration.
type GatewayNodesConfig struct {
	Browser       *GatewayNodesBrowserConfig `json:"browser,omitempty"`
	AllowCommands []string                   `json:"allowCommands,omitempty"`
	DenyCommands  []string                   `json:"denyCommands,omitempty"`
}

// GatewayNodesBrowserConfig holds browser routing configuration.
type GatewayNodesBrowserConfig struct {
	Mode *string `json:"mode,omitempty"` // "auto" | "manual" | "off"
	Node *string `json:"node,omitempty"`
}

// ConfigMeta holds last-touched metadata.
type ConfigMeta struct {
	LastTouchedVersion string `json:"lastTouchedVersion,omitempty"`
	LastTouchedAt      string `json:"lastTouchedAt,omitempty"`
}

// AuthConfig holds auth settings.
type AuthConfig struct {
	Profiles  map[string]AuthProfileConfig `json:"profiles,omitempty"`
	Order     map[string][]string          `json:"order,omitempty"`
	Cooldowns *AuthCooldownsConfig         `json:"cooldowns,omitempty"`
}

// AuthProfileConfig holds auth profile settings.
type AuthProfileConfig struct {
	Provider string `json:"provider"`
	Mode     string `json:"mode"` // "api_key" | "oauth" | "token"
	Email    string `json:"email,omitempty"`
}

// AuthCooldownsConfig holds auth cooldown settings.
type AuthCooldownsConfig struct {
	BillingBackoffHours           *int           `json:"billingBackoffHours,omitempty"`
	BillingBackoffHoursByProvider map[string]int `json:"billingBackoffHoursByProvider,omitempty"`
	BillingMaxHours               *int           `json:"billingMaxHours,omitempty"`
	FailureWindowHours            *int           `json:"failureWindowHours,omitempty"`
}

// EnvConfig holds env var overrides.
type EnvConfig struct {
	ShellEnv *ShellEnvConfig   `json:"shellEnv,omitempty"`
	Vars     map[string]string `json:"vars,omitempty"`
}

// ShellEnvConfig for shell env import.
type ShellEnvConfig struct {
	Enabled   *bool `json:"enabled,omitempty"`
	TimeoutMs *int  `json:"timeoutMs,omitempty"`
}

// WizardConfig holds wizard run state.
type WizardConfig struct {
	LastRunAt      string `json:"lastRunAt,omitempty"`
	LastRunVersion string `json:"lastRunVersion,omitempty"`
	LastRunCommit  string `json:"lastRunCommit,omitempty"`
	LastRunCommand string `json:"lastRunCommand,omitempty"`
	LastRunMode    string `json:"lastRunMode,omitempty"` // "local" | "remote"
}

// SkillsConfig holds skills settings.
type SkillsConfig struct {
	AllowBundled []string               `json:"allowBundled,omitempty"`
	Load         *SkillsLoadConfig      `json:"load,omitempty"`
	Install      *SkillsInstallConfig   `json:"install,omitempty"`
	Entries      map[string]SkillConfig `json:"entries,omitempty"`
}

// SkillsLoadConfig holds skill loading settings.
type SkillsLoadConfig struct {
	ExtraDirs       []string `json:"extraDirs,omitempty"`
	Watch           *bool    `json:"watch,omitempty"`
	WatchDebounceMs *int     `json:"watchDebounceMs,omitempty"`
}

// SkillsInstallConfig holds skill installation settings.
type SkillsInstallConfig struct {
	PreferBrew  *bool   `json:"preferBrew,omitempty"`
	NodeManager *string `json:"nodeManager,omitempty"` // "npm" | "pnpm" | "yarn" | "bun"
}

// SkillConfig holds a single skill configuration.
type SkillConfig struct {
	Enabled *bool                  `json:"enabled,omitempty"`
	APIKey  string                 `json:"apiKey,omitempty"`
	Env     map[string]string      `json:"env,omitempty"`
	Config  map[string]interface{} `json:"config,omitempty"`
}

// PluginsConfig holds plugin settings.
type PluginsConfig struct {
	Enabled  *bool                          `json:"enabled,omitempty"`
	Allow    []string                       `json:"allow,omitempty"`
	Deny     []string                       `json:"deny,omitempty"`
	Load     *PluginsLoadConfig             `json:"load,omitempty"`
	Slots    *PluginSlotsConfig             `json:"slots,omitempty"`
	Entries  map[string]PluginEntryConfig   `json:"entries,omitempty"`
	Installs map[string]PluginInstallRecord `json:"installs,omitempty"`
}

// PluginsLoadConfig holds plugin loading settings.
type PluginsLoadConfig struct {
	Paths []string `json:"paths,omitempty"`
}

// PluginSlotsConfig holds plugin slot assignments.
type PluginSlotsConfig struct {
	Memory *string `json:"memory,omitempty"`
}

// PluginEntryConfig holds a single plugin entry configuration.
type PluginEntryConfig struct {
	Enabled *bool                  `json:"enabled,omitempty"`
	Config  map[string]interface{} `json:"config,omitempty"`
}

// PluginInstallRecord holds plugin installation record.
type PluginInstallRecord struct {
	Source      string `json:"source"` // "npm" | "archive" | "path"
	Spec        string `json:"spec,omitempty"`
	SourcePath  string `json:"sourcePath,omitempty"`
	InstallPath string `json:"installPath,omitempty"`
	Version     string `json:"version,omitempty"`
	InstalledAt string `json:"installedAt,omitempty"`
}

// ModelsConfig holds model providers.
type ModelsConfig struct {
	Mode             string                   `json:"mode,omitempty"` // "merge" | "replace"
	Providers        map[string]ModelProvider `json:"providers,omitempty"`
	BedrockDiscovery *BedrockDiscoveryConfig  `json:"bedrockDiscovery,omitempty"`
}

// ModelProvider holds provider config.
type ModelProvider struct {
	BaseURL    string            `json:"baseUrl"`
	APIKey     string            `json:"apiKey,omitempty"`
	Auth       *string           `json:"auth,omitempty"` // "api-key" | "aws-sdk" | "oauth" | "token"
	API        *string           `json:"api,omitempty"`
	Headers    map[string]string `json:"headers,omitempty"`
	AuthHeader *bool             `json:"authHeader,omitempty"`
	Models     []ModelDefinition `json:"models"`
}

// ModelDefinition holds a single model.
type ModelDefinition struct {
	ID            string             `json:"id"`
	Name          string             `json:"name"`
	API           *string            `json:"api,omitempty"`
	Reasoning     bool               `json:"reasoning"`
	Input         []string           `json:"input"` // "text" | "image"
	Cost          *ModelCostConfig   `json:"cost,omitempty"`
	ContextWindow *int               `json:"contextWindow,omitempty"`
	MaxTokens     *int               `json:"maxTokens,omitempty"`
	Headers       map[string]string  `json:"headers,omitempty"`
	Compat        *ModelCompatConfig `json:"compat,omitempty"`
}

// ModelCostConfig holds model cost settings.
type ModelCostConfig struct {
	Input      float64 `json:"input"`
	Output     float64 `json:"output"`
	CacheRead  float64 `json:"cacheRead"`
	CacheWrite float64 `json:"cacheWrite"`
}

// ModelCompatConfig holds model compatibility settings.
type ModelCompatConfig struct {
	SupportsStore           *bool   `json:"supportsStore,omitempty"`
	SupportsDeveloperRole   *bool   `json:"supportsDeveloperRole,omitempty"`
	SupportsReasoningEffort *bool   `json:"supportsReasoningEffort,omitempty"`
	MaxTokensField          *string `json:"maxTokensField,omitempty"` // "max_completion_tokens" | "max_tokens"
}

// BedrockDiscoveryConfig holds AWS Bedrock discovery settings.
type BedrockDiscoveryConfig struct {
	Enabled              *bool    `json:"enabled,omitempty"`
	Region               *string  `json:"region,omitempty"`
	ProviderFilter       []string `json:"providerFilter,omitempty"`
	RefreshInterval      *int     `json:"refreshInterval,omitempty"`
	DefaultContextWindow *int     `json:"defaultContextWindow,omitempty"`
	DefaultMaxTokens     *int     `json:"defaultMaxTokens,omitempty"`
}

// AgentsConfig holds agent definitions.
type AgentsConfig struct {
	Defaults *AgentDefaultsConfig `json:"defaults,omitempty"`
	List     []AgentConfig        `json:"list,omitempty"`
}

// AgentDefaultsConfig holds default agent settings.
type AgentDefaultsConfig struct {
	Model                  *AgentModelListConfig            `json:"model,omitempty"`
	ImageModel             *AgentModelListConfig            `json:"imageModel,omitempty"`
	Models                 map[string]AgentModelEntryConfig `json:"models,omitempty"`
	Workspace              string                           `json:"workspace,omitempty"`
	RepoRoot               string                           `json:"repoRoot,omitempty"`
	SkipBootstrap          *bool                            `json:"skipBootstrap,omitempty"`
	BootstrapMaxChars      *int                             `json:"bootstrapMaxChars,omitempty"`
	UserTimezone           string                           `json:"userTimezone,omitempty"`
	TimeFormat             *string                          `json:"timeFormat,omitempty"` // "auto" | "12" | "24"
	EnvelopeTimezone       *string                          `json:"envelopeTimezone,omitempty"`
	EnvelopeTimestamp      *string                          `json:"envelopeTimestamp,omitempty"` // "on" | "off"
	EnvelopeElapsed        *string                          `json:"envelopeElapsed,omitempty"`   // "on" | "off"
	ContextTokens          *int                             `json:"contextTokens,omitempty"`
	CliBackends            map[string]CliBackendConfig      `json:"cliBackends,omitempty"`
	ContextPruning         *AgentContextPruningConfig       `json:"contextPruning,omitempty"`
	Compaction             *AgentCompactionConfig           `json:"compaction,omitempty"`
	MemorySearch           *MemorySearchConfig              `json:"memorySearch,omitempty"`
	ThinkingDefault        *string                          `json:"thinkingDefault,omitempty"`
	VerboseDefault         *string                          `json:"verboseDefault,omitempty"`
	ElevatedDefault        *string                          `json:"elevatedDefault,omitempty"`
	BlockStreamingDefault  *string                          `json:"blockStreamingDefault,omitempty"`
	BlockStreamingBreak    *string                          `json:"blockStreamingBreak,omitempty"`
	BlockStreamingChunk    *BlockStreamingChunkConfig       `json:"blockStreamingChunk,omitempty"`
	BlockStreamingCoalesce *BlockStreamingCoalesceConfig    `json:"blockStreamingCoalesce,omitempty"`
	HumanDelay             *HumanDelayConfig                `json:"humanDelay,omitempty"`
	TimeoutSeconds         *int                             `json:"timeoutSeconds,omitempty"`
	MediaMaxMb             *int                             `json:"mediaMaxMb,omitempty"`
	TypingIntervalSeconds  *int                             `json:"typingIntervalSeconds,omitempty"`
	TypingMode             *string                          `json:"typingMode,omitempty"`
	Heartbeat              *AgentHeartbeatConfig            `json:"heartbeat,omitempty"`
	MaxConcurrent          *int                             `json:"maxConcurrent,omitempty"`
	Subagents              *AgentSubagentsConfig            `json:"subagents,omitempty"`
	Sandbox                *AgentSandboxConfig              `json:"sandbox,omitempty"`
}

// AgentModelListConfig holds model list configuration.
type AgentModelListConfig struct {
	Primary   *string  `json:"primary,omitempty"`
	Fallbacks []string `json:"fallbacks,omitempty"`
}

// AgentModelEntryConfig holds model entry configuration.
type AgentModelEntryConfig struct {
	Alias     string                 `json:"alias,omitempty"`
	Params    map[string]interface{} `json:"params,omitempty"`
	Streaming *bool                  `json:"streaming,omitempty"`
}

// CliBackendConfig holds CLI backend configuration.
type CliBackendConfig struct {
	Command           string            `json:"command"`
	Args              []string          `json:"args,omitempty"`
	Output            *string           `json:"output,omitempty"` // "json" | "text" | "jsonl"
	ResumeOutput      *string           `json:"resumeOutput,omitempty"`
	Input             *string           `json:"input,omitempty"` // "arg" | "stdin"
	MaxPromptArgChars *int              `json:"maxPromptArgChars,omitempty"`
	Env               map[string]string `json:"env,omitempty"`
	ClearEnv          []string          `json:"clearEnv,omitempty"`
	ModelArg          string            `json:"modelArg,omitempty"`
	ModelAliases      map[string]string `json:"modelAliases,omitempty"`
	SessionArg        string            `json:"sessionArg,omitempty"`
	SessionArgs       []string          `json:"sessionArgs,omitempty"`
	ResumeArgs        []string          `json:"resumeArgs,omitempty"`
	SessionMode       *string           `json:"sessionMode,omitempty"` // "always" | "existing" | "none"
	SessionIdFields   []string          `json:"sessionIdFields,omitempty"`
	SystemPromptArg   string            `json:"systemPromptArg,omitempty"`
	SystemPromptMode  *string           `json:"systemPromptMode,omitempty"` // "append" | "replace"
	SystemPromptWhen  *string           `json:"systemPromptWhen,omitempty"` // "first" | "always" | "never"
	ImageArg          string            `json:"imageArg,omitempty"`
	ImageMode         *string           `json:"imageMode,omitempty"` // "repeat" | "list"
	Serialize         *bool             `json:"serialize,omitempty"`
}

// AgentContextPruningConfig holds context pruning configuration.
type AgentContextPruningConfig struct {
	Mode                 *string                             `json:"mode,omitempty"` // "off" | "cache-ttl"
	TTL                  *string                             `json:"ttl,omitempty"`
	KeepLastAssistants   *int                                `json:"keepLastAssistants,omitempty"`
	SoftTrimRatio        *float64                            `json:"softTrimRatio,omitempty"`
	HardClearRatio       *float64                            `json:"hardClearRatio,omitempty"`
	MinPrunableToolChars *int                                `json:"minPrunableToolChars,omitempty"`
	Tools                *AgentContextPruningToolsConfig     `json:"tools,omitempty"`
	SoftTrim             *AgentContextPruningSoftTrimConfig  `json:"softTrim,omitempty"`
	HardClear            *AgentContextPruningHardClearConfig `json:"hardClear,omitempty"`
}

// AgentContextPruningToolsConfig holds tools pruning configuration.
type AgentContextPruningToolsConfig struct {
	Allow []string `json:"allow,omitempty"`
	Deny  []string `json:"deny,omitempty"`
}

// AgentContextPruningSoftTrimConfig holds soft trim configuration.
type AgentContextPruningSoftTrimConfig struct {
	MaxChars  *int `json:"maxChars,omitempty"`
	HeadChars *int `json:"headChars,omitempty"`
	TailChars *int `json:"tailChars,omitempty"`
}

// AgentContextPruningHardClearConfig holds hard clear configuration.
type AgentContextPruningHardClearConfig struct {
	Enabled     *bool   `json:"enabled,omitempty"`
	Placeholder *string `json:"placeholder,omitempty"`
}

// AgentCompactionConfig holds compaction configuration.
type AgentCompactionConfig struct {
	Mode               *string                           `json:"mode,omitempty"` // "default" | "safeguard"
	ReserveTokensFloor *int                              `json:"reserveTokensFloor,omitempty"`
	MaxHistoryShare    *float64                          `json:"maxHistoryShare,omitempty"`
	MemoryFlush        *AgentCompactionMemoryFlushConfig `json:"memoryFlush,omitempty"`
}

// AgentCompactionMemoryFlushConfig holds memory flush configuration.
type AgentCompactionMemoryFlushConfig struct {
	Enabled             *bool   `json:"enabled,omitempty"`
	SoftThresholdTokens *int    `json:"softThresholdTokens,omitempty"`
	Prompt              *string `json:"prompt,omitempty"`
	SystemPrompt        *string `json:"systemPrompt,omitempty"`
}

// BlockStreamingChunkConfig holds block streaming chunk configuration.
type BlockStreamingChunkConfig struct {
	MinChars        *int    `json:"minChars,omitempty"`
	MaxChars        *int    `json:"maxChars,omitempty"`
	BreakPreference *string `json:"breakPreference,omitempty"` // "paragraph" | "newline" | "sentence"
}

// BlockStreamingCoalesceConfig holds block streaming coalesce configuration.
type BlockStreamingCoalesceConfig struct {
	MinChars *int `json:"minChars,omitempty"`
	MaxChars *int `json:"maxChars,omitempty"`
	IdleMs   *int `json:"idleMs,omitempty"`
}

// HumanDelayConfig holds human delay configuration.
type HumanDelayConfig struct {
	Mode  *string `json:"mode,omitempty"` // "off" | "natural" | "custom"
	MinMs *int    `json:"minMs,omitempty"`
	MaxMs *int    `json:"maxMs,omitempty"`
}

// AgentHeartbeatConfig holds heartbeat configuration.
type AgentHeartbeatConfig struct {
	Every            *string                          `json:"every,omitempty"`
	ActiveHours      *AgentHeartbeatActiveHoursConfig `json:"activeHours,omitempty"`
	Model            *string                          `json:"model,omitempty"`
	Session          *string                          `json:"session,omitempty"`
	Target           *string                          `json:"target,omitempty"`
	To               *string                          `json:"to,omitempty"`
	AccountId        *string                          `json:"accountId,omitempty"`
	Prompt           *string                          `json:"prompt,omitempty"`
	AckMaxChars      *int                             `json:"ackMaxChars,omitempty"`
	IncludeReasoning *bool                            `json:"includeReasoning,omitempty"`
}

// AgentHeartbeatActiveHoursConfig holds active hours configuration.
type AgentHeartbeatActiveHoursConfig struct {
	Start    *string `json:"start,omitempty"`
	End      *string `json:"end,omitempty"`
	Timezone *string `json:"timezone,omitempty"`
}

// AgentSubagentsConfig holds subagents configuration.
type AgentSubagentsConfig struct {
	MaxConcurrent       *int        `json:"maxConcurrent,omitempty"`
	ArchiveAfterMinutes *int        `json:"archiveAfterMinutes,omitempty"`
	Model               interface{} `json:"model,omitempty"` // string or {primary,fallbacks}
	Thinking            *string     `json:"thinking,omitempty"`
}

// AgentSandboxConfig holds sandbox configuration.
type AgentSandboxConfig struct {
	Mode                   *string                `json:"mode,omitempty"`                   // "off" | "non-main" | "all"
	WorkspaceAccess        *string                `json:"workspaceAccess,omitempty"`        // "none" | "ro" | "rw"
	SessionToolsVisibility *string                `json:"sessionToolsVisibility,omitempty"` // "spawned" | "all"
	Scope                  *string                `json:"scope,omitempty"`                  // "session" | "agent" | "shared"
	PerSession             *bool                  `json:"perSession,omitempty"`
	WorkspaceRoot          *string                `json:"workspaceRoot,omitempty"`
	Docker                 map[string]interface{} `json:"docker,omitempty"`
	Browser                map[string]interface{} `json:"browser,omitempty"`
	Prune                  map[string]interface{} `json:"prune,omitempty"`
}

// AgentConfig holds a single agent.
type AgentConfig struct {
	ID           string                `json:"id"`
	Default      *bool                 `json:"default,omitempty"`
	Name         string                `json:"name,omitempty"`
	Workspace    string                `json:"workspace,omitempty"`
	AgentDir     string                `json:"agentDir,omitempty"`
	Model        interface{}           `json:"model,omitempty"` // string or {primary,fallbacks}
	Skills       []string              `json:"skills,omitempty"`
	MemorySearch *MemorySearchConfig   `json:"memorySearch,omitempty"`
	HumanDelay   *HumanDelayConfig     `json:"humanDelay,omitempty"`
	Heartbeat    *AgentHeartbeatConfig `json:"heartbeat,omitempty"`
	Identity     *IdentityConfig       `json:"identity,omitempty"`
	GroupChat    *GroupChatConfig      `json:"groupChat,omitempty"`
	Subagents    *AgentSubagentsConfig `json:"subagents,omitempty"`
	Sandbox      *AgentSandboxConfig   `json:"sandbox,omitempty"`
	Tools        *AgentToolsConfig     `json:"tools,omitempty"`
}

// IdentityConfig holds identity configuration.
type IdentityConfig struct {
	Name   string `json:"name,omitempty"`
	Theme  string `json:"theme,omitempty"`
	Emoji  string `json:"emoji,omitempty"`
	Avatar string `json:"avatar,omitempty"`
}

// GroupChatConfig holds group chat configuration.
type GroupChatConfig struct {
	MentionPatterns []string `json:"mentionPatterns,omitempty"`
	HistoryLimit    *int     `json:"historyLimit,omitempty"`
}

// AgentBinding holds agent binding configuration.
type AgentBinding struct {
	AgentID string            `json:"agentId"`
	Match   AgentBindingMatch `json:"match"`
}

// AgentBindingMatch holds agent binding match configuration.
type AgentBindingMatch struct {
	Channel   string            `json:"channel"`
	AccountID *string           `json:"accountId,omitempty"`
	Peer      *AgentBindingPeer `json:"peer,omitempty"`
	GuildID   *string           `json:"guildId,omitempty"`
	TeamID    *string           `json:"teamId,omitempty"`
}

// AgentBindingPeer holds agent binding peer configuration.
type AgentBindingPeer struct {
	Kind string `json:"kind"` // "dm" | "group" | "channel"
	ID   string `json:"id"`
}

// ChannelsConfig holds channel configs.
// Built-in channels are defined as fields for type safety.
// Plugin channels can be accessed via GetChannelConfig() method.
type ChannelsConfig struct {
	Defaults   *ChannelDefaultsConfig `json:"defaults,omitempty"`
	WhatsApp   map[string]interface{} `json:"whatsapp,omitempty"`
	Telegram   map[string]interface{} `json:"telegram,omitempty"`
	Discord    map[string]interface{} `json:"discord,omitempty"`
	GoogleChat map[string]interface{} `json:"googlechat,omitempty"`
	Slack      map[string]interface{} `json:"slack,omitempty"`
	Signal     map[string]interface{} `json:"signal,omitempty"`
	IMessage   map[string]interface{} `json:"imessage,omitempty"`
	MSTeams    map[string]interface{} `json:"msteams,omitempty"`
	// Plugin channels (dingtalk, feishu, etc.) - accessed via GetChannelConfig()
	DingTalk map[string]interface{} `json:"dingtalk,omitempty"`
	Feishu   map[string]interface{} `json:"feishu,omitempty"`
	// Additional plugin channels stored here (for JSON unmarshaling)
	// Use GetChannelConfig() to access plugin channels dynamically
	Plugins map[string]interface{} `json:"-"` // Not directly marshaled, populated from JSON
}

// UnmarshalJSON implements custom JSON unmarshaling for ChannelsConfig.
// This allows plugin channels (not defined as struct fields) to be stored in the Plugins map.
func (c *ChannelsConfig) UnmarshalJSON(data []byte) error {
	// Define a type alias to avoid infinite recursion
	type ChannelsConfigAlias ChannelsConfig

	// First, unmarshal into a map to capture all fields
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	// Unmarshal known fields into the struct
	alias := (*ChannelsConfigAlias)(c)
	if err := json.Unmarshal(data, alias); err != nil {
		return err
	}

	// Initialize Plugins map if needed
	if c.Plugins == nil {
		c.Plugins = make(map[string]interface{})
	}

	// Known channel field names (to avoid duplicating them in Plugins)
	knownChannels := map[string]bool{
		"defaults":   true,
		"whatsapp":   true,
		"telegram":   true,
		"discord":    true,
		"googlechat": true,
		"slack":      true,
		"signal":     true,
		"imessage":   true,
		"msteams":    true,
		"dingtalk":   true,
		"feishu":     true,
	}

	// Store unknown channel configs in Plugins map
	for key, value := range raw {
		keyLower := strings.ToLower(key)
		if !knownChannels[keyLower] {
			var cfg interface{}
			if err := json.Unmarshal(value, &cfg); err == nil {
				c.Plugins[keyLower] = cfg
			}
		}
	}

	return nil
}

// GetChannelConfig returns the configuration for a channel by name.
// Supports both built-in channels (whatsapp, telegram, etc.) and plugin channels (dingtalk, feishu, etc.).
// Channel names are case-insensitive.
func (c *ChannelsConfig) GetChannelConfig(name string) map[string]interface{} {
	if c == nil {
		return nil
	}
	name = strings.ToLower(strings.TrimSpace(name))
	switch name {
	case "whatsapp":
		return c.WhatsApp
	case "telegram":
		return c.Telegram
	case "discord":
		return c.Discord
	case "googlechat":
		return c.GoogleChat
	case "slack":
		return c.Slack
	case "signal":
		return c.Signal
	case "imessage":
		return c.IMessage
	case "msteams":
		return c.MSTeams
	case "dingtalk":
		return c.DingTalk
	case "feishu":
		return c.Feishu
	default:
		// Check plugins map for dynamically registered channels
		if c.Plugins != nil {
			if cfg, ok := c.Plugins[name].(map[string]interface{}); ok {
				return cfg
			}
		}
		return nil
	}
}

// ChannelDefaultsConfig holds default channel settings.
type ChannelDefaultsConfig struct {
	GroupPolicy *string                           `json:"groupPolicy,omitempty"` // "open" | "disabled" | "allowlist"
	Heartbeat   *ChannelHeartbeatVisibilityConfig `json:"heartbeat,omitempty"`
}

// ChannelHeartbeatVisibilityConfig holds heartbeat visibility configuration.
type ChannelHeartbeatVisibilityConfig struct {
	ShowOk       *bool `json:"showOk,omitempty"`
	ShowAlerts   *bool `json:"showAlerts,omitempty"`
	UseIndicator *bool `json:"useIndicator,omitempty"`
}

// CronConfig holds cron settings.
type CronConfig struct {
	Enabled           *bool   `json:"enabled,omitempty"`
	Store             *string `json:"store,omitempty"`
	MaxConcurrentRuns *int    `json:"maxConcurrentRuns,omitempty"`
}

// HooksConfig holds hooks settings.
type HooksConfig struct {
	Enabled       *bool                `json:"enabled,omitempty"`
	Path          *string              `json:"path,omitempty"`
	Token         *string              `json:"token,omitempty"`
	MaxBodyBytes  *int                 `json:"maxBodyBytes,omitempty"`
	Presets       []string             `json:"presets,omitempty"`
	TransformsDir *string              `json:"transformsDir,omitempty"`
	Mappings      []HookMappingConfig  `json:"mappings,omitempty"`
	Gmail         *HooksGmailConfig    `json:"gmail,omitempty"`
	Internal      *InternalHooksConfig `json:"internal,omitempty"`
}

// HookMappingConfig maps a hook.
type HookMappingConfig struct {
	ID                         *string               `json:"id,omitempty"`
	Match                      *HookMappingMatch     `json:"match,omitempty"`
	Action                     *string               `json:"action,omitempty"`   // "wake" | "agent"
	WakeMode                   *string               `json:"wakeMode,omitempty"` // "now" | "next-heartbeat"
	Name                       *string               `json:"name,omitempty"`
	SessionKey                 *string               `json:"sessionKey,omitempty"`
	MessageTemplate            *string               `json:"messageTemplate,omitempty"`
	TextTemplate               *string               `json:"textTemplate,omitempty"`
	Deliver                    *bool                 `json:"deliver,omitempty"`
	AllowUnsafeExternalContent *bool                 `json:"allowUnsafeExternalContent,omitempty"`
	Channel                    *string               `json:"channel,omitempty"`
	To                         *string               `json:"to,omitempty"`
	Model                      *string               `json:"model,omitempty"`
	Thinking                   *string               `json:"thinking,omitempty"`
	TimeoutSeconds             *int                  `json:"timeoutSeconds,omitempty"`
	Transform                  *HookMappingTransform `json:"transform,omitempty"`
}

// HookMappingMatch holds hook mapping match configuration.
type HookMappingMatch struct {
	Path   *string `json:"path,omitempty"`
	Source *string `json:"source,omitempty"`
}

// HookMappingTransform holds hook mapping transform configuration.
type HookMappingTransform struct {
	Module *string `json:"module"`
	Export *string `json:"export,omitempty"`
}

// HooksGmailConfig holds Gmail hooks configuration.
type HooksGmailConfig struct {
	Account                    *string                    `json:"account,omitempty"`
	Label                      *string                    `json:"label,omitempty"`
	Topic                      *string                    `json:"topic,omitempty"`
	Subscription               *string                    `json:"subscription,omitempty"`
	PushToken                  *string                    `json:"pushToken,omitempty"`
	HookURL                    *string                    `json:"hookUrl,omitempty"`
	IncludeBody                *bool                      `json:"includeBody,omitempty"`
	MaxBytes                   *int                       `json:"maxBytes,omitempty"`
	RenewEveryMinutes          *int                       `json:"renewEveryMinutes,omitempty"`
	AllowUnsafeExternalContent *bool                      `json:"allowUnsafeExternalContent,omitempty"`
	Serve                      *HooksGmailServeConfig     `json:"serve,omitempty"`
	Tailscale                  *HooksGmailTailscaleConfig `json:"tailscale,omitempty"`
	Model                      *string                    `json:"model,omitempty"`
	Thinking                   *string                    `json:"thinking,omitempty"`
}

// HooksGmailServeConfig holds Gmail serve configuration.
type HooksGmailServeConfig struct {
	Bind *string `json:"bind,omitempty"`
	Port *int    `json:"port,omitempty"`
	Path *string `json:"path,omitempty"`
}

// HooksGmailTailscaleConfig holds Gmail Tailscale configuration.
type HooksGmailTailscaleConfig struct {
	Mode   *string `json:"mode,omitempty"` // "off" | "serve" | "funnel"
	Path   *string `json:"path,omitempty"`
	Target *string `json:"target,omitempty"`
}

// InternalHooksConfig holds internal hooks configuration.
type InternalHooksConfig struct {
	Enabled  *bool                        `json:"enabled,omitempty"`
	Handlers []InternalHookHandlerConfig  `json:"handlers,omitempty"`
	Entries  map[string]HookConfig        `json:"entries,omitempty"`
	Load     *InternalHooksLoadConfig     `json:"load,omitempty"`
	Installs map[string]HookInstallRecord `json:"installs,omitempty"`
}

// InternalHookHandlerConfig holds internal hook handler configuration.
type InternalHookHandlerConfig struct {
	Event  string  `json:"event"`
	Module string  `json:"module"`
	Export *string `json:"export,omitempty"`
}

// HookConfig holds hook configuration.
type HookConfig struct {
	Enabled *bool             `json:"enabled,omitempty"`
	Env     map[string]string `json:"env,omitempty"`
}

// InternalHooksLoadConfig holds internal hooks load configuration.
type InternalHooksLoadConfig struct {
	ExtraDirs []string `json:"extraDirs,omitempty"`
}

// HookInstallRecord holds hook installation record.
type HookInstallRecord struct {
	Source      string   `json:"source"` // "npm" | "archive" | "path"
	Spec        *string  `json:"spec,omitempty"`
	SourcePath  *string  `json:"sourcePath,omitempty"`
	InstallPath *string  `json:"installPath,omitempty"`
	Version     *string  `json:"version,omitempty"`
	InstalledAt *string  `json:"installedAt,omitempty"`
	Hooks       []string `json:"hooks,omitempty"`
}

// MemoryConfig holds memory settings.
type MemoryConfig struct {
	Backend   *string          `json:"backend,omitempty"`   // "builtin" | "qmd"
	Citations *string          `json:"citations,omitempty"` // "auto" | "on" | "off"
	Qmd       *MemoryQmdConfig `json:"qmd,omitempty"`
}

// MemoryQmdConfig holds QMD backend settings.
type MemoryQmdConfig struct {
	Command              *string                  `json:"command,omitempty"`
	IncludeDefaultMemory *bool                    `json:"includeDefaultMemory,omitempty"`
	Paths                []MemoryQmdIndexPath     `json:"paths,omitempty"`
	Sessions             *MemoryQmdSessionConfig  `json:"sessions,omitempty"`
	Update               *MemoryQmdUpdateConfig   `json:"update,omitempty"`
	Limits               *MemoryQmdLimitsConfig   `json:"limits,omitempty"`
	Scope                *SessionSendPolicyConfig `json:"scope,omitempty"`
}

// MemoryQmdIndexPath is a QMD index path.
type MemoryQmdIndexPath struct {
	Path    string  `json:"path"`
	Name    *string `json:"name,omitempty"`
	Pattern *string `json:"pattern,omitempty"`
}

// MemoryQmdSessionConfig holds QMD session configuration.
type MemoryQmdSessionConfig struct {
	Enabled       *bool   `json:"enabled,omitempty"`
	ExportDir     *string `json:"exportDir,omitempty"`
	RetentionDays *int    `json:"retentionDays,omitempty"`
}

// MemoryQmdUpdateConfig holds QMD update configuration.
type MemoryQmdUpdateConfig struct {
	Interval      *string `json:"interval,omitempty"`
	DebounceMs    *int    `json:"debounceMs,omitempty"`
	OnBoot        *bool   `json:"onBoot,omitempty"`
	EmbedInterval *string `json:"embedInterval,omitempty"`
}

// MemoryQmdLimitsConfig holds QMD limits configuration.
type MemoryQmdLimitsConfig struct {
	MaxResults       *int `json:"maxResults,omitempty"`
	MaxSnippetChars  *int `json:"maxSnippetChars,omitempty"`
	MaxInjectedChars *int `json:"maxInjectedChars,omitempty"`
	TimeoutMs        *int `json:"timeoutMs,omitempty"`
}

// MemoryQmdPath is a QMD index path.
type MemoryQmdPath struct {
	Path    string `json:"path"`
	Name    string `json:"name,omitempty"`
	Pattern string `json:"pattern,omitempty"`
}

// DiagnosticsConfig holds diagnostics settings.
type DiagnosticsConfig struct {
	Enabled    *bool                        `json:"enabled,omitempty"`
	Flags      []string                     `json:"flags,omitempty"`
	Otel       *DiagnosticsOtelConfig       `json:"otel,omitempty"`
	CacheTrace *DiagnosticsCacheTraceConfig `json:"cacheTrace,omitempty"`
}

// DiagnosticsOtelConfig holds OpenTelemetry diagnostics settings.
type DiagnosticsOtelConfig struct {
	Enabled         *bool             `json:"enabled,omitempty"`
	Endpoint        *string           `json:"endpoint,omitempty"`
	Protocol        *string           `json:"protocol,omitempty"` // "http/protobuf" | "grpc"
	Headers         map[string]string `json:"headers,omitempty"`
	ServiceName     *string           `json:"serviceName,omitempty"`
	Traces          *bool             `json:"traces,omitempty"`
	Metrics         *bool             `json:"metrics,omitempty"`
	Logs            *bool             `json:"logs,omitempty"`
	SampleRate      *float64          `json:"sampleRate,omitempty"`
	FlushIntervalMs *int              `json:"flushIntervalMs,omitempty"`
}

// DiagnosticsCacheTraceConfig holds cache trace diagnostics settings.
type DiagnosticsCacheTraceConfig struct {
	Enabled         *bool   `json:"enabled,omitempty"`
	FilePath        *string `json:"filePath,omitempty"`
	IncludeMessages *bool   `json:"includeMessages,omitempty"`
	IncludePrompt   *bool   `json:"includePrompt,omitempty"`
	IncludeSystem   *bool   `json:"includeSystem,omitempty"`
}

// UpdateConfig holds update settings.
type UpdateConfig struct {
	Channel      *string `json:"channel,omitempty"` // "stable" | "beta" | "dev"
	CheckOnStart *bool   `json:"checkOnStart,omitempty"`
}

// BrowserConfig holds browser settings.
type BrowserConfig struct {
	Enabled                     *bool                           `json:"enabled,omitempty"`
	EvaluateEnabled             *bool                           `json:"evaluateEnabled,omitempty"`
	CdpURL                      *string                         `json:"cdpUrl,omitempty"`
	RemoteCdpTimeoutMs          *int                            `json:"remoteCdpTimeoutMs,omitempty"`
	RemoteCdpHandshakeTimeoutMs *int                            `json:"remoteCdpHandshakeTimeoutMs,omitempty"`
	Color                       *string                         `json:"color,omitempty"`
	ExecutablePath              *string                         `json:"executablePath,omitempty"`
	Headless                    *bool                           `json:"headless,omitempty"`
	NoSandbox                   *bool                           `json:"noSandbox,omitempty"`
	AttachOnly                  *bool                           `json:"attachOnly,omitempty"`
	DefaultProfile              *string                         `json:"defaultProfile,omitempty"`
	Profiles                    map[string]BrowserProfileConfig `json:"profiles,omitempty"`
	SnapshotDefaults            *BrowserSnapshotDefaults        `json:"snapshotDefaults,omitempty"`
}

// BrowserProfileConfig holds browser profile configuration.
type BrowserProfileConfig struct {
	CdpPort *int    `json:"cdpPort,omitempty"`
	CdpURL  *string `json:"cdpUrl,omitempty"`
	Driver  *string `json:"driver,omitempty"` // "openclaw" | "extension"
	Color   string  `json:"color"`
}

// BrowserSnapshotDefaults holds browser snapshot defaults.
type BrowserSnapshotDefaults struct {
	Mode *string `json:"mode,omitempty"` // "efficient"
}

// UIConfig holds UI settings.
type UIConfig struct {
	SeamColor *string            `json:"seamColor,omitempty"`
	Assistant *UIAssistantConfig `json:"assistant,omitempty"`
}

// UIAssistantConfig holds UI assistant settings.
type UIAssistantConfig struct {
	Name   *string `json:"name,omitempty"`
	Avatar *string `json:"avatar,omitempty"`
}

// NodeHostConfig holds node host settings.
type NodeHostConfig struct {
	BrowserProxy *NodeHostBrowserProxyConfig `json:"browserProxy,omitempty"`
}

// NodeHostBrowserProxyConfig holds browser proxy settings.
type NodeHostBrowserProxyConfig struct {
	Enabled       *bool    `json:"enabled,omitempty"`
	AllowProfiles []string `json:"allowProfiles,omitempty"`
}

// ToolsConfig holds tools settings.
type ToolsConfig struct {
	Profile      *string                     `json:"profile,omitempty"` // "minimal" | "coding" | "messaging" | "full"
	Allow        []string                    `json:"allow,omitempty"`
	AlsoAllow    []string                    `json:"alsoAllow,omitempty"`
	Deny         []string                    `json:"deny,omitempty"`
	ByProvider   map[string]ToolPolicyConfig `json:"byProvider,omitempty"`
	Web          *ToolsWebConfig             `json:"web,omitempty"`
	Media        *ToolsMediaConfig           `json:"media,omitempty"`
	Links        *ToolsLinksConfig           `json:"links,omitempty"`
	Message      *ToolsMessageConfig         `json:"message,omitempty"`
	AgentToAgent *ToolsAgentToAgentConfig    `json:"agentToAgent,omitempty"`
	Elevated     *ToolsElevatedConfig        `json:"elevated,omitempty"`
	Exec         *ToolsExecConfig            `json:"exec,omitempty"`
	Subagents    *ToolsSubagentsConfig       `json:"subagents,omitempty"`
	Sandbox      *ToolsSandboxConfig         `json:"sandbox,omitempty"`
}

// ToolPolicyConfig holds tool policy configuration.
type ToolPolicyConfig struct {
	Allow     []string `json:"allow,omitempty"`
	AlsoAllow []string `json:"alsoAllow,omitempty"`
	Deny      []string `json:"deny,omitempty"`
	Profile   *string  `json:"profile,omitempty"`
}

// ToolsWebConfig holds web tools configuration.
type ToolsWebConfig struct {
	Search *ToolsWebSearchConfig `json:"search,omitempty"`
	Fetch  *ToolsWebFetchConfig  `json:"fetch,omitempty"`
}

// ToolsWebSearchConfig holds web search configuration.
type ToolsWebSearchConfig struct {
	Enabled         *bool                           `json:"enabled,omitempty"`
	Provider        *string                         `json:"provider,omitempty"` // "brave" | "perplexity"
	APIKey          *string                         `json:"apiKey,omitempty"`
	MaxResults      *int                            `json:"maxResults,omitempty"`
	TimeoutSeconds  *int                            `json:"timeoutSeconds,omitempty"`
	CacheTtlMinutes *int                            `json:"cacheTtlMinutes,omitempty"`
	Perplexity      *ToolsWebSearchPerplexityConfig `json:"perplexity,omitempty"`
}

// ToolsWebSearchPerplexityConfig holds Perplexity search configuration.
type ToolsWebSearchPerplexityConfig struct {
	APIKey  *string `json:"apiKey,omitempty"`
	BaseURL *string `json:"baseUrl,omitempty"`
	Model   *string `json:"model,omitempty"`
}

// ToolsWebFetchConfig holds web fetch configuration.
type ToolsWebFetchConfig struct {
	Enabled         *bool                         `json:"enabled,omitempty"`
	MaxChars        *int                          `json:"maxChars,omitempty"`
	MaxCharsCap     *int                          `json:"maxCharsCap,omitempty"`
	TimeoutSeconds  *int                          `json:"timeoutSeconds,omitempty"`
	CacheTtlMinutes *int                          `json:"cacheTtlMinutes,omitempty"`
	MaxRedirects    *int                          `json:"maxRedirects,omitempty"`
	UserAgent       *string                       `json:"userAgent,omitempty"`
	Readability     *bool                         `json:"readability,omitempty"`
	Firecrawl       *ToolsWebFetchFirecrawlConfig `json:"firecrawl,omitempty"`
}

// ToolsWebFetchFirecrawlConfig holds Firecrawl configuration.
type ToolsWebFetchFirecrawlConfig struct {
	Enabled         *bool   `json:"enabled,omitempty"`
	APIKey          *string `json:"apiKey,omitempty"`
	BaseURL         *string `json:"baseUrl,omitempty"`
	OnlyMainContent *bool   `json:"onlyMainContent,omitempty"`
	MaxAgeMs        *int    `json:"maxAgeMs,omitempty"`
	TimeoutSeconds  *int    `json:"timeoutSeconds,omitempty"`
}

// ToolsMediaConfig holds media tools configuration.
type ToolsMediaConfig struct {
	Models      []MediaUnderstandingModelConfig `json:"models,omitempty"`
	Concurrency *int                            `json:"concurrency,omitempty"`
	Image       *MediaUnderstandingConfig       `json:"image,omitempty"`
	Audio       *MediaUnderstandingConfig       `json:"audio,omitempty"`
	Video       *MediaUnderstandingConfig       `json:"video,omitempty"`
}

// MediaUnderstandingConfig holds media understanding configuration.
type MediaUnderstandingConfig struct {
	Enabled         *bool                                `json:"enabled,omitempty"`
	Scope           *MediaUnderstandingScopeConfig       `json:"scope,omitempty"`
	MaxBytes        *int                                 `json:"maxBytes,omitempty"`
	MaxChars        *int                                 `json:"maxChars,omitempty"`
	Prompt          *string                              `json:"prompt,omitempty"`
	TimeoutSeconds  *int                                 `json:"timeoutSeconds,omitempty"`
	Language        *string                              `json:"language,omitempty"`
	ProviderOptions map[string]map[string]interface{}    `json:"providerOptions,omitempty"`
	BaseURL         *string                              `json:"baseUrl,omitempty"`
	Headers         map[string]string                    `json:"headers,omitempty"`
	Attachments     *MediaUnderstandingAttachmentsConfig `json:"attachments,omitempty"`
	Models          []MediaUnderstandingModelConfig      `json:"models,omitempty"`
}

// MediaUnderstandingScopeConfig holds media understanding scope configuration.
type MediaUnderstandingScopeConfig struct {
	Default *string                       `json:"default,omitempty"` // "allow" | "deny"
	Rules   []MediaUnderstandingScopeRule `json:"rules,omitempty"`
}

// MediaUnderstandingScopeRule holds media understanding scope rule.
type MediaUnderstandingScopeRule struct {
	Action string                        `json:"action"` // "allow" | "deny"
	Match  *MediaUnderstandingScopeMatch `json:"match,omitempty"`
}

// MediaUnderstandingScopeMatch holds media understanding scope match.
type MediaUnderstandingScopeMatch struct {
	Channel   *string `json:"channel,omitempty"`
	ChatType  *string `json:"chatType,omitempty"`
	KeyPrefix *string `json:"keyPrefix,omitempty"`
}

// MediaUnderstandingAttachmentsConfig holds attachments configuration.
type MediaUnderstandingAttachmentsConfig struct {
	Mode           *string `json:"mode,omitempty"` // "first" | "all"
	MaxAttachments *int    `json:"maxAttachments,omitempty"`
	Prefer         *string `json:"prefer,omitempty"` // "first" | "last" | "path" | "url"
}

// MediaUnderstandingModelConfig holds media understanding model configuration.
type MediaUnderstandingModelConfig struct {
	Provider         *string                           `json:"provider,omitempty"`
	Model            *string                           `json:"model,omitempty"`
	Capabilities     []string                          `json:"capabilities,omitempty"` // "image" | "audio" | "video"
	Type             *string                           `json:"type,omitempty"`         // "provider" | "cli"
	Command          *string                           `json:"command,omitempty"`
	Args             []string                          `json:"args,omitempty"`
	Prompt           *string                           `json:"prompt,omitempty"`
	MaxChars         *int                              `json:"maxChars,omitempty"`
	MaxBytes         *int                              `json:"maxBytes,omitempty"`
	TimeoutSeconds   *int                              `json:"timeoutSeconds,omitempty"`
	Language         *string                           `json:"language,omitempty"`
	ProviderOptions  map[string]map[string]interface{} `json:"providerOptions,omitempty"`
	BaseURL          *string                           `json:"baseUrl,omitempty"`
	Headers          map[string]string                 `json:"headers,omitempty"`
	Profile          *string                           `json:"profile,omitempty"`
	PreferredProfile *string                           `json:"preferredProfile,omitempty"`
}

// ToolsLinksConfig holds links tools configuration.
type ToolsLinksConfig struct {
	Enabled        *bool                          `json:"enabled,omitempty"`
	Scope          *MediaUnderstandingScopeConfig `json:"scope,omitempty"`
	MaxLinks       *int                           `json:"maxLinks,omitempty"`
	TimeoutSeconds *int                           `json:"timeoutSeconds,omitempty"`
	Models         []LinkModelConfig              `json:"models,omitempty"`
}

// LinkModelConfig holds link model configuration.
type LinkModelConfig struct {
	Type           *string  `json:"type,omitempty"` // "cli"
	Command        string   `json:"command"`
	Args           []string `json:"args,omitempty"`
	TimeoutSeconds *int     `json:"timeoutSeconds,omitempty"`
}

// ToolsMessageConfig holds message tools configuration.
type ToolsMessageConfig struct {
	AllowCrossContextSend *bool                           `json:"allowCrossContextSend,omitempty"`
	CrossContext          *ToolsMessageCrossContextConfig `json:"crossContext,omitempty"`
	Broadcast             *ToolsMessageBroadcastConfig    `json:"broadcast,omitempty"`
}

// ToolsMessageCrossContextConfig holds cross-context configuration.
type ToolsMessageCrossContextConfig struct {
	AllowWithinProvider  *bool                                 `json:"allowWithinProvider,omitempty"`
	AllowAcrossProviders *bool                                 `json:"allowAcrossProviders,omitempty"`
	Marker               *ToolsMessageCrossContextMarkerConfig `json:"marker,omitempty"`
}

// ToolsMessageCrossContextMarkerConfig holds cross-context marker configuration.
type ToolsMessageCrossContextMarkerConfig struct {
	Enabled *bool   `json:"enabled,omitempty"`
	Prefix  *string `json:"prefix,omitempty"`
	Suffix  *string `json:"suffix,omitempty"`
}

// ToolsMessageBroadcastConfig holds broadcast configuration.
type ToolsMessageBroadcastConfig struct {
	Enabled *bool `json:"enabled,omitempty"`
}

// ToolsAgentToAgentConfig holds agent-to-agent tools configuration.
type ToolsAgentToAgentConfig struct {
	Enabled *bool    `json:"enabled,omitempty"`
	Allow   []string `json:"allow,omitempty"`
}

// ToolsElevatedConfig holds elevated tools configuration.
type ToolsElevatedConfig struct {
	Enabled   *bool                    `json:"enabled,omitempty"`
	AllowFrom map[string][]interface{} `json:"allowFrom,omitempty"`
}

// ToolsExecConfig holds exec tools configuration.
type ToolsExecConfig struct {
	Host                    *string                    `json:"host,omitempty"`     // "sandbox" | "gateway" | "node"
	Security                *string                    `json:"security,omitempty"` // "deny" | "allowlist" | "full"
	Ask                     *string                    `json:"ask,omitempty"`      // "off" | "on-miss" | "always"
	Node                    *string                    `json:"node,omitempty"`
	PathPrepend             []string                   `json:"pathPrepend,omitempty"`
	SafeBins                []string                   `json:"safeBins,omitempty"`
	BackgroundMs            *int                       `json:"backgroundMs,omitempty"`
	TimeoutSec              *int                       `json:"timeoutSec,omitempty"`
	ApprovalRunningNoticeMs *int                       `json:"approvalRunningNoticeMs,omitempty"`
	CleanupMs               *int                       `json:"cleanupMs,omitempty"`
	NotifyOnExit            *bool                      `json:"notifyOnExit,omitempty"`
	ApplyPatch              *ToolsExecApplyPatchConfig `json:"applyPatch,omitempty"`
}

// ToolsExecApplyPatchConfig holds apply patch configuration.
type ToolsExecApplyPatchConfig struct {
	Enabled     *bool    `json:"enabled,omitempty"`
	AllowModels []string `json:"allowModels,omitempty"`
}

// ToolsSubagentsConfig holds subagents tools configuration.
type ToolsSubagentsConfig struct {
	Model interface{}                `json:"model,omitempty"` // string or {primary,fallbacks}
	Tools *ToolsSubagentsToolsConfig `json:"tools,omitempty"`
}

// ToolsSubagentsToolsConfig holds subagents tools policy.
type ToolsSubagentsToolsConfig struct {
	Allow []string `json:"allow,omitempty"`
	Deny  []string `json:"deny,omitempty"`
}

// ToolsSandboxConfig holds sandbox tools configuration.
type ToolsSandboxConfig struct {
	Tools *ToolsSandboxToolsConfig `json:"tools,omitempty"`
}

// ToolsSandboxToolsConfig holds sandbox tools policy.
type ToolsSandboxToolsConfig struct {
	Allow []string `json:"allow,omitempty"`
	Deny  []string `json:"deny,omitempty"`
}

// AgentToolsConfig holds agent tools configuration.
type AgentToolsConfig struct {
	Profile    *string                     `json:"profile,omitempty"`
	Allow      []string                    `json:"allow,omitempty"`
	AlsoAllow  []string                    `json:"alsoAllow,omitempty"`
	Deny       []string                    `json:"deny,omitempty"`
	ByProvider map[string]ToolPolicyConfig `json:"byProvider,omitempty"`
	Elevated   *ToolsElevatedConfig        `json:"elevated,omitempty"`
	Exec       *ToolsExecConfig            `json:"exec,omitempty"`
	Sandbox    *AgentToolsSandboxConfig    `json:"sandbox,omitempty"`
}

// AgentToolsSandboxConfig holds agent tools sandbox configuration.
type AgentToolsSandboxConfig struct {
	Tools *ToolsSandboxToolsConfig `json:"tools,omitempty"`
}

// MemorySearchConfig holds memory search configuration.
type MemorySearchConfig struct {
	Enabled      *bool                           `json:"enabled,omitempty"`
	Sources      []string                        `json:"sources,omitempty"` // "memory" | "sessions"
	ExtraPaths   []string                        `json:"extraPaths,omitempty"`
	Experimental *MemorySearchExperimentalConfig `json:"experimental,omitempty"`
	Provider     *string                         `json:"provider,omitempty"` // "openai" | "gemini" | "local" | "voyage"
	Remote       *MemorySearchRemoteConfig       `json:"remote,omitempty"`
	Fallback     *string                         `json:"fallback,omitempty"`
	Model        *string                         `json:"model,omitempty"`
	Local        *MemorySearchLocalConfig        `json:"local,omitempty"`
	Store        *MemorySearchStoreConfig        `json:"store,omitempty"`
	Chunking     *MemorySearchChunkingConfig     `json:"chunking,omitempty"`
	Sync         *MemorySearchSyncConfig         `json:"sync,omitempty"`
	Query        *MemorySearchQueryConfig        `json:"query,omitempty"`
	Cache        *MemorySearchCacheConfig        `json:"cache,omitempty"`
}

// MemorySearchExperimentalConfig holds experimental memory search settings.
type MemorySearchExperimentalConfig struct {
	SessionMemory *bool `json:"sessionMemory,omitempty"`
}

// MemorySearchRemoteConfig holds remote memory search configuration.
type MemorySearchRemoteConfig struct {
	BaseURL *string                        `json:"baseUrl,omitempty"`
	APIKey  *string                        `json:"apiKey,omitempty"`
	Headers map[string]string              `json:"headers,omitempty"`
	Batch   *MemorySearchRemoteBatchConfig `json:"batch,omitempty"`
}

// MemorySearchRemoteBatchConfig holds batch configuration.
type MemorySearchRemoteBatchConfig struct {
	Enabled        *bool `json:"enabled,omitempty"`
	Wait           *bool `json:"wait,omitempty"`
	Concurrency    *int  `json:"concurrency,omitempty"`
	PollIntervalMs *int  `json:"pollIntervalMs,omitempty"`
	TimeoutMinutes *int  `json:"timeoutMinutes,omitempty"`
}

// MemorySearchLocalConfig holds local memory search configuration.
type MemorySearchLocalConfig struct {
	ModelPath     *string `json:"modelPath,omitempty"`
	ModelCacheDir *string `json:"modelCacheDir,omitempty"`
}

// MemorySearchStoreConfig holds store configuration.
type MemorySearchStoreConfig struct {
	Driver *string                        `json:"driver,omitempty"` // "sqlite"
	Path   *string                        `json:"path,omitempty"`
	Vector *MemorySearchStoreVectorConfig `json:"vector,omitempty"`
	Cache  *MemorySearchStoreCacheConfig  `json:"cache,omitempty"`
}

// MemorySearchStoreVectorConfig holds vector store configuration.
type MemorySearchStoreVectorConfig struct {
	Enabled       *bool   `json:"enabled,omitempty"`
	ExtensionPath *string `json:"extensionPath,omitempty"`
}

// MemorySearchStoreCacheConfig holds store cache configuration.
type MemorySearchStoreCacheConfig struct {
	Enabled    *bool `json:"enabled,omitempty"`
	MaxEntries *int  `json:"maxEntries,omitempty"`
}

// MemorySearchChunkingConfig holds chunking configuration.
type MemorySearchChunkingConfig struct {
	Tokens  *int `json:"tokens,omitempty"`
	Overlap *int `json:"overlap,omitempty"`
}

// MemorySearchSyncConfig holds sync configuration.
type MemorySearchSyncConfig struct {
	OnSessionStart  *bool                           `json:"onSessionStart,omitempty"`
	OnSearch        *bool                           `json:"onSearch,omitempty"`
	Watch           *bool                           `json:"watch,omitempty"`
	WatchDebounceMs *int                            `json:"watchDebounceMs,omitempty"`
	IntervalMinutes *int                            `json:"intervalMinutes,omitempty"`
	Sessions        *MemorySearchSyncSessionsConfig `json:"sessions,omitempty"`
}

// MemorySearchSyncSessionsConfig holds sessions sync configuration.
type MemorySearchSyncSessionsConfig struct {
	DeltaBytes    *int `json:"deltaBytes,omitempty"`
	DeltaMessages *int `json:"deltaMessages,omitempty"`
}

// MemorySearchQueryConfig holds query configuration.
type MemorySearchQueryConfig struct {
	MaxResults *int                           `json:"maxResults,omitempty"`
	MinScore   *float64                       `json:"minScore,omitempty"`
	Hybrid     *MemorySearchQueryHybridConfig `json:"hybrid,omitempty"`
}

// MemorySearchQueryHybridConfig holds hybrid query configuration.
type MemorySearchQueryHybridConfig struct {
	Enabled             *bool    `json:"enabled,omitempty"`
	VectorWeight        *float64 `json:"vectorWeight,omitempty"`
	TextWeight          *float64 `json:"textWeight,omitempty"`
	CandidateMultiplier *int     `json:"candidateMultiplier,omitempty"`
}

// MemorySearchCacheConfig holds cache configuration.
type MemorySearchCacheConfig struct {
	Enabled    *bool `json:"enabled,omitempty"`
	MaxEntries *int  `json:"maxEntries,omitempty"`
}

// BroadcastConfig holds broadcast settings.
type BroadcastConfig struct {
	Strategy *string `json:"strategy,omitempty"` // "parallel" | "sequential"
	// Additional fields are dynamic (peerId -> agentIds[])
}

// AudioConfig holds audio settings.
type AudioConfig struct {
	Transcription *AudioTranscriptionConfig `json:"transcription,omitempty"`
}

// AudioTranscriptionConfig holds audio transcription settings.
type AudioTranscriptionConfig struct {
	Command        []string `json:"command"`
	TimeoutSeconds *int     `json:"timeoutSeconds,omitempty"`
}

// MessagesConfig holds messages settings.
type MessagesConfig struct {
	MessagePrefix       *string                `json:"messagePrefix,omitempty"`
	ResponsePrefix      *string                `json:"responsePrefix,omitempty"`
	GroupChat           *GroupChatConfig       `json:"groupChat,omitempty"`
	Queue               *QueueConfig           `json:"queue,omitempty"`
	Inbound             *InboundDebounceConfig `json:"inbound,omitempty"`
	AckReaction         *string                `json:"ackReaction,omitempty"`
	AckReactionScope    *string                `json:"ackReactionScope,omitempty"`
	RemoveAckAfterReply *bool                  `json:"removeAckAfterReply,omitempty"`
	Tts                 map[string]interface{} `json:"tts,omitempty"`
}

// QueueConfig holds queue configuration.
type QueueConfig struct {
	Mode                *string           `json:"mode,omitempty"`
	ByChannel           map[string]string `json:"byChannel,omitempty"`
	DebounceMs          *int              `json:"debounceMs,omitempty"`
	DebounceMsByChannel map[string]int    `json:"debounceMsByChannel,omitempty"`
	Cap                 *int              `json:"cap,omitempty"`
	Drop                *string           `json:"drop,omitempty"`
}

// InboundDebounceConfig holds inbound debounce configuration.
type InboundDebounceConfig struct {
	DebounceMs *int           `json:"debounceMs,omitempty"`
	ByChannel  map[string]int `json:"byChannel,omitempty"`
}

// CommandsConfig holds commands settings.
type CommandsConfig struct {
	Native           interface{}   `json:"native,omitempty"`       // bool | "auto"
	NativeSkills     interface{}   `json:"nativeSkills,omitempty"` // bool | "auto"
	Text             *bool         `json:"text,omitempty"`
	Bash             *bool         `json:"bash,omitempty"`
	BashForegroundMs *int          `json:"bashForegroundMs,omitempty"`
	Config           *bool         `json:"config,omitempty"`
	Debug            *bool         `json:"debug,omitempty"`
	Restart          *bool         `json:"restart,omitempty"`
	UseAccessGroups  *bool         `json:"useAccessGroups,omitempty"`
	OwnerAllowFrom   []interface{} `json:"ownerAllowFrom,omitempty"`
}

// ApprovalsConfig holds approvals settings.
type ApprovalsConfig struct {
	Exec *ExecApprovalForwardingConfig `json:"exec,omitempty"`
}

// ExecApprovalForwardingConfig holds exec approval forwarding configuration.
type ExecApprovalForwardingConfig struct {
	Enabled       *bool                       `json:"enabled,omitempty"`
	Mode          *string                     `json:"mode,omitempty"` // "session" | "targets" | "both"
	AgentFilter   []string                    `json:"agentFilter,omitempty"`
	SessionFilter []string                    `json:"sessionFilter,omitempty"`
	Targets       []ExecApprovalForwardTarget `json:"targets,omitempty"`
}

// ExecApprovalForwardTarget holds exec approval forward target.
type ExecApprovalForwardTarget struct {
	Channel   string      `json:"channel"`
	To        string      `json:"to"`
	AccountID *string     `json:"accountId,omitempty"`
	ThreadID  interface{} `json:"threadId,omitempty"` // string | number
}

// SessionConfig holds session settings.
type SessionConfig struct {
	Scope                 *string                       `json:"scope,omitempty"` // "per-sender" | "global"
	DmScope               *string                       `json:"dmScope,omitempty"`
	IdentityLinks         map[string][]string           `json:"identityLinks,omitempty"`
	ResetTriggers         []string                      `json:"resetTriggers,omitempty"`
	IdleMinutes           *int                          `json:"idleMinutes,omitempty"`
	Reset                 *SessionResetConfig           `json:"reset,omitempty"`
	ResetByType           *SessionResetByTypeConfig     `json:"resetByType,omitempty"`
	ResetByChannel        map[string]SessionResetConfig `json:"resetByChannel,omitempty"`
	Store                 *string                       `json:"store,omitempty"`
	TypingIntervalSeconds *int                          `json:"typingIntervalSeconds,omitempty"`
	TypingMode            *string                       `json:"typingMode,omitempty"`
	MainKey               *string                       `json:"mainKey,omitempty"`
	SendPolicy            *SessionSendPolicyConfig      `json:"sendPolicy,omitempty"`
	AgentToAgent          *SessionAgentToAgentConfig    `json:"agentToAgent,omitempty"`
}

// SessionResetConfig holds session reset configuration.
type SessionResetConfig struct {
	Mode        *string `json:"mode,omitempty"` // "daily" | "idle"
	AtHour      *int    `json:"atHour,omitempty"`
	IdleMinutes *int    `json:"idleMinutes,omitempty"`
}

// SessionResetByTypeConfig holds session reset by type configuration.
type SessionResetByTypeConfig struct {
	Dm     *SessionResetConfig `json:"dm,omitempty"`
	Group  *SessionResetConfig `json:"group,omitempty"`
	Thread *SessionResetConfig `json:"thread,omitempty"`
}

// SessionSendPolicyConfig holds session send policy configuration.
type SessionSendPolicyConfig struct {
	Default *string                 `json:"default,omitempty"` // "allow" | "deny"
	Rules   []SessionSendPolicyRule `json:"rules,omitempty"`
}

// SessionSendPolicyRule holds session send policy rule.
type SessionSendPolicyRule struct {
	Action string                  `json:"action"` // "allow" | "deny"
	Match  *SessionSendPolicyMatch `json:"match,omitempty"`
}

// SessionSendPolicyMatch holds session send policy match.
type SessionSendPolicyMatch struct {
	Channel   *string `json:"channel,omitempty"`
	ChatType  *string `json:"chatType,omitempty"`
	KeyPrefix *string `json:"keyPrefix,omitempty"`
}

// SessionAgentToAgentConfig holds agent-to-agent session configuration.
type SessionAgentToAgentConfig struct {
	MaxPingPongTurns *int `json:"maxPingPongTurns,omitempty"`
}

// WebConfig holds web settings.
type WebConfig struct {
	Enabled          *bool               `json:"enabled,omitempty"`
	HeartbeatSeconds *int                `json:"heartbeatSeconds,omitempty"`
	Reconnect        *WebReconnectConfig `json:"reconnect,omitempty"`
}

// WebReconnectConfig holds web reconnect configuration.
type WebReconnectConfig struct {
	InitialMs   *int     `json:"initialMs,omitempty"`
	MaxMs       *int     `json:"maxMs,omitempty"`
	Factor      *float64 `json:"factor,omitempty"`
	Jitter      *float64 `json:"jitter,omitempty"`
	MaxAttempts *int     `json:"maxAttempts,omitempty"`
}

// DiscoveryConfig holds discovery settings.
type DiscoveryConfig struct {
	WideArea *WideAreaDiscoveryConfig `json:"wideArea,omitempty"`
	Mdns     *MdnsDiscoveryConfig     `json:"mdns,omitempty"`
}

// WideAreaDiscoveryConfig holds wide area discovery configuration.
type WideAreaDiscoveryConfig struct {
	Enabled *bool   `json:"enabled,omitempty"`
	Domain  *string `json:"domain,omitempty"`
}

// MdnsDiscoveryConfig holds mDNS discovery configuration.
type MdnsDiscoveryConfig struct {
	Mode *string `json:"mode,omitempty"` // "off" | "minimal" | "full"
}

// CanvasHostConfig holds canvas host settings.
type CanvasHostConfig struct {
	Enabled    *bool   `json:"enabled,omitempty"`
	Root       *string `json:"root,omitempty"`
	Port       *int    `json:"port,omitempty"`
	LiveReload *bool   `json:"liveReload,omitempty"`
}

// TalkConfig holds talk settings.
type TalkConfig struct {
	VoiceID           *string           `json:"voiceId,omitempty"`
	VoiceAliases      map[string]string `json:"voiceAliases,omitempty"`
	ModelID           *string           `json:"modelId,omitempty"`
	OutputFormat      *string           `json:"outputFormat,omitempty"`
	APIKey            *string           `json:"apiKey,omitempty"`
	InterruptOnSpeech *bool             `json:"interruptOnSpeech,omitempty"`
}
