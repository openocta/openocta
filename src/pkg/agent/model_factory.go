// Package agent provides agent configuration and model factory creation.
package agent

import (
	"fmt"
	"os"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/stellarlinkco/agentsdk-go/pkg/api"
	"github.com/stellarlinkco/agentsdk-go/pkg/model"
)

// builtInProvider describes a known provider with default base URL, API type and env key.
type builtInProvider struct {
	baseURL      string
	useAnthropic bool // true = Anthropic messages API, false = OpenAI completions
	envKey       string
	defaultModel string
}

// builtInProviders maps provider id to default settings (used when not in config.models.providers).
var builtInProviders = map[string]builtInProvider{
	"openrouter":        {"https://openrouter.ai/api/v1", false, "OPENROUTER_API_KEY", "auto"},
	"litellm":           {"http://localhost:4000", false, "LITELLM_API_KEY", ""},
	"moonshot":          {"https://api.moonshot.ai/v1", false, "MOONSHOT_API_KEY", "kimi-k2.5"},
	"moonshot-cn":       {"https://api.moonshot.cn/v1", false, "MOONSHOT_API_KEY", "kimi-k2.5"},
	"kimi-coding":       {"https://api.moonshot.ai/anthropic", true, "KIMI_API_KEY", "k2p5"},
	"opencode":          {"https://opencode.ai/zen/v1", false, "OPENCODE_API_KEY", "claude-opus-4-6"},
	"zai":               {"https://api.z.ai/api/paas/v4", false, "ZAI_API_KEY", "glm-5"},
	"xai":               {"https://api.x.ai/v1", false, "XAI_API_KEY", "grok-3-mini"},
	"together":          {"https://api.together.xyz/v1", false, "TOGETHER_API_KEY", "meta-llama/Llama-3.3-70B-Instruct-Turbo"},
	"venice":            {"https://api.venice.ai/api/v1", false, "VENICE_API_KEY", "falcon-3.1-70b"},
	"nearai":            {"https://cloud-api.near.ai/v1", false, "NEARAI_API_KEY", "zai-org/GLM-5.1-FP8"},
	"synthetic":         {"https://api.synthetic.new/anthropic", true, "SYNTHETIC_API_KEY", "hf:MiniMaxAI/MiniMax-M2.1"},
	"qianfan":           {"https://qianfan.baidubce.com/v2", false, "QIANFAN_API_KEY", "deepseek-v3-2-251201"},
	"huggingface":       {"https://router.huggingface.co/v1", false, "HUGGINGFACE_HUB_TOKEN", ""},
	"xiaomi":            {"https://api.xiaomimimo.com/anthropic", true, "XIAOMI_API_KEY", "mimo-v2-flash"},
	"minimax":           {"https://api.minimax.io/anthropic", true, "MINIMAX_API_KEY", "MiniMax-M2.7"},
	"mistral":           {"https://api.mistral.ai/v1", false, "MISTRAL_API_KEY", "mistral-large-latest"},
	"groq":              {"https://api.groq.com/openai/v1", false, "GROQ_API_KEY", "llama-3.3-70b-versatile"},
	"cerebras":          {"https://api.cerebras.ai/v1", false, "CEREBRAS_API_KEY", "llama-4-scout-17b-16e-instruct"},
	"deepseek":          {"https://api.deepseek.com/v1", false, "DEEPSEEK_API_KEY", "deepseek-chat"},
	"ollama":            {"http://127.0.0.1:11434/v1", false, "OLLAMA_API_KEY", "llama3.3"},
	"vllm":              {"http://127.0.0.1:8000/v1", false, "VLLM_API_KEY", ""},
	"vercel-ai-gateway": {"https://api.vercel.ai/v1", false, "AI_GATEWAY_API_KEY", ""},
	"xunfei":            {"https://spark-api-open.xf-yun.com/v1", false, "XUNFEI_API_KEY", "spark-lite"},
}

// ResolveSessionAgentID resolves agent ID from sessionKey.
// sessionKey format: "agent:agentId:sessionId" or "sessionId" (defaults to "main").
func ResolveSessionAgentID(sessionKey string) string {
	if sessionKey == "" {
		return "main"
	}
	parts := strings.SplitN(sessionKey, ":", 3)
	if len(parts) >= 3 {
		return strings.TrimSpace(strings.ToLower(parts[1]))
	}
	return "main"
}

// resolveAgentConfig finds agent config by ID, or returns default agent.
func resolveAgentConfig(cfg *config.OpenOctaConfig, agentID string) *config.AgentConfig {
	if cfg == nil || cfg.Agents == nil || len(cfg.Agents.List) == 0 {
		return nil
	}
	for i := range cfg.Agents.List {
		agent := &cfg.Agents.List[i]
		if strings.EqualFold(agent.ID, agentID) {
			return agent
		}
	}
	for i := range cfg.Agents.List {
		agent := &cfg.Agents.List[i]
		if agent.Default != nil && *agent.Default {
			return agent
		}
	}
	if len(cfg.Agents.List) > 0 {
		return &cfg.Agents.List[0]
	}
	return nil
}

// resolveModelFromConfig returns provider and model ID from a model reference string.
func resolveModelFromConfig(modelRef string) (provider string, modelID string) {
	if modelRef == "" {
		return "", ""
	}
	parts := strings.SplitN(strings.TrimSpace(modelRef), "/", 2)
	if len(parts) == 2 {
		return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
	}
	return "anthropic", strings.TrimSpace(modelRef)
}

// getEnvVar returns env var for key. Checks modelEnv[modelRef] first (overrides Vars), then config.env.vars, then os.Getenv.
// modelRef can be empty; if non-empty it should be "provider/modelId" to look up per-model env.
func getEnvVar(cfg *config.OpenOctaConfig, key string, modelRef string) string {
	// 1. ModelEnv overrides: per-model env vars
	if modelRef != "" && cfg != nil && cfg.Env != nil && cfg.Env.ModelEnv != nil {
		if m, ok := cfg.Env.ModelEnv[modelRef]; ok && m != nil {
			if val, ok := m[key]; ok && val != "" {
				return val
			}
		}
	}
	// 2. Global vars from config.env.vars
	if cfg != nil && cfg.Env != nil && cfg.Env.Vars != nil {
		if val, ok := cfg.Env.Vars[key]; ok && val != "" {
			return val
		}
	}
	return os.Getenv(key)
}

// CreateXunfeiImageFactory creates an api.ModelFactory for Xunfei's Image Understanding WebSocket API.
// It resolves credentials from config.Env first, then OS environment variables.
// Returns nil if credentials (AppID, APIKey, APISecret) are missing.
func CreateXunfeiImageFactory(cfg *config.OpenOctaConfig) api.ModelFactory {
	var uiKey string
	if cfg != nil && cfg.Models != nil && cfg.Models.Providers != nil {
		if providerCfg, ok := cfg.Models.Providers["xunfei"]; ok {
			uiKey = resolveProviderAPIKey(cfg, "xunfei", providerCfg.APIKey, "xunfei/spark-lite")
		}
	}
	
	appID := getEnvVar(cfg, "XUNFEI_APP_ID", "")
	apiKey := getEnvVar(cfg, "XUNFEI_API_KEY", "")
	apiSecret := getEnvVar(cfg, "XUNFEI_API_SECRET", "")
	
	// If the UI key is provided and contains | or :, parse it
	if uiKey != "" && appID == "" {
		parts := strings.Split(uiKey, "|")
		if len(parts) != 3 {
			parts = strings.Split(uiKey, ":")
		}
		if len(parts) == 3 {
			appID = strings.TrimSpace(parts[0])
			apiSecret = strings.TrimSpace(parts[1])
			apiKey = strings.TrimSpace(parts[2])
			// Some users might do appId:apiSecret:apiKey or appId:apiKey:apiSecret. We'll assume APPID:APISECRET:APIKEY or APPID|APISECRET|APIKEY based on typical usage, but let's just support both by checking length? Actually, APISecret is usually longer or APIKey is longer. Let's just trust parts 0=AppID, 1=APISecret, 2=APIKey.
		} else {
			// If it's a single key (e.g. for v1/chat/completions password), it won't work for the v2.1 image WebSocket API.
			apiKey = uiKey
		}
	}

	if apiKey == "" {
		apiKey = os.Getenv("XUNFEI_API_KEY")
	}
	if apiSecret == "" {
		apiSecret = os.Getenv("XUNFEI_API_SECRET")
	}
	if appID == "" {
		appID = os.Getenv("XUNFEI_APP_ID")
	}

	if appID == "" || apiKey == "" || apiSecret == "" {
		return nil
	}

	config := XunfeiImageConfig{
		AppID:       appID,
		APIKey:      apiKey,
		APISecret:   apiSecret,
		Host:        "spark-api.cn-huabei-1.xf-yun.com",
		Path:        "/v2.1/image",
		Domain:      "imagev3",
		Temperature: 0.5,
		MaxTokens:   2048,
		TopK:        4,
	}
	return &XunfeiImageProvider{Config: config}
}

// resolveProviderAPIKey returns the API key for a provider from config or env.
// modelRef is passed to getEnvVar for per-model env override (e.g. "provider/modelId").
func resolveProviderAPIKey(cfg *config.OpenOctaConfig, provider, apiKeyFromConfig, modelRef string) string {
	apiKey := strings.TrimSpace(apiKeyFromConfig)
	if apiKey != "" {
		if strings.HasPrefix(apiKey, "$") {
			envKey := strings.TrimPrefix(apiKey, "$")
			return getEnvVar(cfg, envKey, modelRef)
		} else {
			return apiKey
		}
		// If it looks like a literal key (sk-, gsk-, xai-, bce-, magik-, etc.), use as-is
		//if strings.HasPrefix(apiKey, "sk-") || strings.HasPrefix(apiKey, "gsk-") || strings.HasPrefix(apiKey, "xai-") || strings.HasPrefix(apiKey, "bce-") || strings.HasPrefix(apiKey, "magik-") {
		//	return apiKey
		//}
		// Otherwise treat as env var name (e.g. LITELLM_API_KEY)
		//return getEnvVar(cfg, apiKey, modelRef)
	}
	envKey := strings.ToUpper(strings.ReplaceAll(provider, "-", "_")) + "_API_KEY"
	return getEnvVar(cfg, envKey, modelRef)
}

// ResolveAgentModelRef returns the primary model reference from agent config or defaults.
// Exported for use by handlers package (e.g. Xunfei image format detection).
func ResolveAgentModelRef(cfg *config.OpenOctaConfig, agentID string) string {
	return resolveAgentModelRef(cfg, agentID)
}

// resolveAgentModelRef returns the primary model reference from agent config or defaults.
func resolveAgentModelRef(cfg *config.OpenOctaConfig, agentID string) string {
	agentCfg := resolveAgentConfig(cfg, agentID)
	if agentCfg != nil && agentCfg.Model != nil {
		if modelStr, ok := agentCfg.Model.(string); ok && modelStr != "" {
			return strings.TrimSpace(modelStr)
		}
		if modelMap, ok := agentCfg.Model.(map[string]interface{}); ok {
			if primary, ok := modelMap["primary"].(string); ok && primary != "" {
				return strings.TrimSpace(primary)
			}
		}
	}
	if cfg != nil && cfg.Agents != nil && cfg.Agents.Defaults != nil && cfg.Agents.Defaults.Model != nil {
		if cfg.Agents.Defaults.Model.Primary != nil && *cfg.Agents.Defaults.Model.Primary != "" {
			return strings.TrimSpace(*cfg.Agents.Defaults.Model.Primary)
		}
	}
	return ""
}

// CreateModelFactoryFromConfig creates a ModelFactory from config.
// It checks config.models.providers first, then falls back to built-in providers.
func CreateModelFactoryFromConfig(cfg *config.OpenOctaConfig, agentID string) (api.ModelFactory, error) {
	modelRef := resolveAgentModelRef(cfg, agentID)
	provider, modelID := resolveModelFromConfig(modelRef)
	return createModelFactoryForProviderModel(cfg, provider, modelID)
}

// CreateModelFactoryForModelRef creates a ModelFactory for an explicit model reference (provider/modelId).
// This is used by the web chat model picker to override the agent's configured model per request.
func CreateModelFactoryForModelRef(cfg *config.OpenOctaConfig, modelRef string) (api.ModelFactory, error) {
	provider, modelID := resolveModelFromConfig(strings.TrimSpace(modelRef))
	return createModelFactoryForProviderModel(cfg, provider, modelID)
}

// modelDefFromProviderCfg returns the model definition for resolvedModelID, or the first model when id is empty.
func modelDefFromProviderCfg(prov config.ModelProvider, resolvedModelID string) *config.ModelDefinition {
	foundModelID := resolvedModelID
	if foundModelID == "" && len(prov.Models) > 0 {
		foundModelID = prov.Models[0].ID
	}
	for i := range prov.Models {
		if prov.Models[i].ID == foundModelID {
			return &prov.Models[i]
		}
	}
	return nil
}

// TokenLimitForSessionHistory returns api.Options.TokenLimit (conversation history trim budget) from
// models.providers.*.models[].contextWindow for the effective model ref.
func TokenLimitForSessionHistory(cfg *config.OpenOctaConfig, agentID string, modelRefOverride string) int {
	if cfg == nil {
		return 0
	}
	ref := strings.TrimSpace(modelRefOverride)
	if ref == "" {
		ref = resolveAgentModelRef(cfg, agentID)
	}
	if ref == "" || cfg.Models == nil || cfg.Models.Providers == nil {
		return 0
	}
	provider, mid := resolveModelFromConfig(ref)
	prov, ok := cfg.Models.Providers[provider]
	if !ok {
		return 0
	}
	resolved := mid
	if resolved == "" && len(prov.Models) > 0 {
		resolved = prov.Models[0].ID
	} else if resolved != "" {
		modelFound := false
		for _, m := range prov.Models {
			if m.ID == resolved {
				modelFound = true
				break
			}
		}
		if !modelFound && len(prov.Models) > 0 {
			resolved = prov.Models[0].ID
		}
	}
	def := modelDefFromProviderCfg(prov, resolved)
	if def != nil && def.ContextWindow != nil && *def.ContextWindow > 0 {
		return *def.ContextWindow
	}
	return 0
}

func createModelFactoryForProviderModel(cfg *config.OpenOctaConfig, provider, modelID string) (api.ModelFactory, error) {

	if cfg != nil && cfg.Models != nil && cfg.Models.Providers != nil {
		if providerCfg, ok := cfg.Models.Providers[provider]; ok {
			// Resolve foundModelID first for modelRef in env lookup
			foundModelID := modelID
			if foundModelID == "" && len(providerCfg.Models) > 0 {
				foundModelID = providerCfg.Models[0].ID
			} else if foundModelID != "" {
				modelFound := false
				for _, m := range providerCfg.Models {
					if m.ID == foundModelID {
						modelFound = true
						break
					}
				}
				if !modelFound && len(providerCfg.Models) > 0 {
					foundModelID = providerCfg.Models[0].ID
				}
			}
			modelRefForEnv := provider + "/" + foundModelID
			apiKey := resolveProviderAPIKey(cfg, provider, providerCfg.APIKey, modelRefForEnv)
			//if apiKey == "" {
			//	return nil, fmt.Errorf("API key for provider %s not found: check config.models.providers.%s.apiKey (can be a key value or env var name like $LITELLM_API_KEY), or set it in config.env.vars", provider, provider)
			//}
			if foundModelID == "" {
				return nil, fmt.Errorf("no model specified for provider %s and no models defined in config.models.providers.%s", provider, provider)
			}

			var maxOut int
			if def := modelDefFromProviderCfg(providerCfg, foundModelID); def != nil && def.MaxTokens != nil && *def.MaxTokens > 0 {
				maxOut = *def.MaxTokens
			}

			useAnthropic := providerCfg.API != nil && (strings.EqualFold(*providerCfg.API, "anthropic-messages") || *providerCfg.API == "anthropic")
			baseURL := strings.TrimSpace(providerCfg.BaseURL)
			if useAnthropic {
				ap := &model.AnthropicProvider{
					ModelName: foundModelID,
					APIKey:    apiKey,
					BaseURL:   baseURL,
				}
				if maxOut > 0 {
					ap.MaxTokens = maxOut
				}
				return ap, nil
			}
			op := &model.OpenAIProvider{
				ModelName: foundModelID,
				APIKey:    apiKey,
				BaseURL:   baseURL,
			}
			if maxOut > 0 {
				op.MaxTokens = maxOut
			}
			return op, nil
		}
	}

	// Built-in providers (when not defined in config.models.providers)
	if builtIn, ok := builtInProviders[provider]; ok {
		resolvedModel := modelID
		if resolvedModel == "" {
			namePrefix := strings.ToUpper(strings.ReplaceAll(provider, "-", "_"))
			if provider == "kimi-coding" {
				namePrefix = "KIMI"
			}
			if envModel := getEnvVar(cfg, namePrefix+"_MODEL", ""); envModel != "" {
				resolvedModel = strings.TrimSpace(envModel)
			} else if builtIn.defaultModel != "" {
				resolvedModel = builtIn.defaultModel
			}
		}
		if resolvedModel == "" {
			return nil, fmt.Errorf("no model specified for provider %s (use model ref like %s/<modelId>)", provider, provider)
		}
		modelRefForEnv := provider + "/" + resolvedModel
		apiKey := getEnvVar(cfg, builtIn.envKey, modelRefForEnv)
		if apiKey == "" {
			return nil, fmt.Errorf("API key for provider %s not found: set %s in config.env.vars or environment", provider, builtIn.envKey)
		}
		// Allow overriding model/baseURL via env vars, with special handling for kimi-coding (KIMI_*).
		namePrefix := strings.ToUpper(strings.ReplaceAll(provider, "-", "_"))
		if provider == "kimi-coding" {
			namePrefix = "KIMI"
		}
		baseURL := builtIn.baseURL
		if envBase := getEnvVar(cfg, namePrefix+"_BASE_URL", modelRefForEnv); envBase != "" {
			baseURL = strings.TrimSpace(envBase)
		}
		if builtIn.useAnthropic {
			return &model.AnthropicProvider{
				ModelName: resolvedModel,
				APIKey:    apiKey,
				BaseURL:   baseURL,
			}, nil
		}
		return &model.OpenAIProvider{
			ModelName: resolvedModel,
			APIKey:    apiKey,
			BaseURL:   baseURL,
		}, nil
	}

	if provider == "" {
		provider = "anthropic"
		modelID = "claude-sonnet-4-5-20250929"
	}

	switch provider {
	case "anthropic":
		if modelID == "" {
			return nil, fmt.Errorf("模型缺少 ModelID 配置")
		}
		modelRefForEnv := "anthropic/" + modelID
		apiKey := getEnvVar(cfg, "ANTHROPIC_API_KEY", modelRefForEnv)
		if apiKey == "" {
			return nil, fmt.Errorf("大模型配置缺少API Key")
		}
		return &model.AnthropicProvider{
			ModelName: modelID,
			APIKey:    apiKey,
		}, nil
	case "openai":
		if modelID == "" {
			return nil, fmt.Errorf("模型缺少 ModelID 配置")
		}
		modelRefForEnv := "openai/" + modelID
		apiKey := getEnvVar(cfg, "OPENAI_API_KEY", modelRefForEnv)
		if apiKey == "" {
			return nil, fmt.Errorf("OPENAI_API_KEY not found: check config.env.vars.OPENAI_API_KEY in config file or OPENAI_API_KEY environment variable")
		}
		return &model.OpenAIProvider{
			ModelName: modelID,
			APIKey:    apiKey,
		}, nil
	default:
		apiKey := getEnvVar(cfg, "ANTHROPIC_API_KEY", "anthropic/claude-sonnet-4-5-20250929")
		if apiKey == "" {
			return nil, fmt.Errorf("OPENAI_API_KEY not found: check config.env.vars.OPENAI_API_KEY in config file or OPENAI_API_KEY environment variable")
		}
		return &model.AnthropicProvider{
			ModelName: "claude-sonnet-4-5-20250929",
			APIKey:    apiKey,
		}, nil
	}
}
