package eino

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/cloudwego/eino-ext/components/model/claude"
	"github.com/cloudwego/eino-ext/components/model/openai"
	einomodel "github.com/cloudwego/eino/components/model"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/embeddedmodels"
)

type builtInProvider struct {
	baseURL      string
	useAnthropic bool
	envKey       string
	defaultModel string
}

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
	"volces_ark":        {"https://ark.cn-beijing.volces.com/api/coding/v3", false, "VOLCES_ARK_API_KEY", "ark-code-latest"},
}

func getEnvVar(cfg *config.OpenOctaConfig, key, modelRef string) string {
	if modelRef != "" && cfg != nil && cfg.Env != nil && cfg.Env.ModelEnv != nil {
		if m, ok := cfg.Env.ModelEnv[modelRef]; ok && m != nil {
			if val, ok := m[key]; ok && val != "" {
				return val
			}
		}
	}
	if cfg != nil && cfg.Env != nil && cfg.Env.Vars != nil {
		if val, ok := cfg.Env.Vars[key]; ok && val != "" {
			return val
		}
	}
	return os.Getenv(key)
}

func resolveProviderAPIKey(cfg *config.OpenOctaConfig, provider, apiKeyFromConfig, modelRef string) string {
	apiKey := strings.TrimSpace(apiKeyFromConfig)
	if apiKey != "" {
		if strings.HasPrefix(apiKey, "$") {
			return getEnvVar(cfg, strings.TrimPrefix(apiKey, "$"), modelRef)
		}
		return apiKey
	}
	envKey := strings.ToUpper(strings.ReplaceAll(provider, "-", "_")) + "_API_KEY"
	return getEnvVar(cfg, envKey, modelRef)
}

func resolveModelFromConfig(modelRef string) (provider, modelID string) {
	if modelRef == "" {
		return "", ""
	}
	parts := strings.SplitN(strings.TrimSpace(modelRef), "/", 2)
	if len(parts) == 2 {
		return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
	}
	return "anthropic", strings.TrimSpace(modelRef)
}

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

// directHTTPClient returns an http.Client that bypasses any system/environment
// proxy (HTTP_PROXY / HTTPS_PROXY / Windows system proxy). A local proxy (e.g.
// Clash/V2Ray) breaks TLS to provider APIs like volces_ark with an EOF on Post,
// so model traffic must go direct. The 180s timeout is intentionally generous
// because stream-mode responses arrive in chunks — short per-request timeouts
// get hit before deepseek-v4-flash produces its first reasoning token.
func directHTTPClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			Proxy:                 nil, // never use proxy for model API traffic
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   15 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			ResponseHeaderTimeout: 30 * time.Second,
		},
	}
}

func buildChatModel(ctx context.Context, useAnthropic bool, modelName, apiKey, baseURL string, maxTokens int) (einomodel.ToolCallingChatModel, error) {
	if useAnthropic {
		cfg := &claude.Config{
			APIKey: apiKey,
			Model:  modelName,
		}
		if baseURL != "" {
			cfg.BaseURL = &baseURL
		}
		if maxTokens > 0 {
			cfg.MaxTokens = maxTokens
		}
		// Bypass local proxy: a proxy can cause TLS EOF to provider endpoints.
		cfg.HTTPClient = directHTTPClient(180 * time.Second)
		return claude.NewChatModel(ctx, cfg)
	}
	cfg := &openai.ChatModelConfig{
		APIKey: apiKey,
		Model:  modelName,
	}
	if baseURL != "" {
		cfg.BaseURL = baseURL
	}
	if maxTokens > 0 {
		cfg.MaxTokens = &maxTokens
	}
	// Bypass local proxy: a proxy can cause TLS EOF to provider endpoints.
	cfg.HTTPClient = directHTTPClient(180 * time.Second)
	return openai.NewChatModel(ctx, cfg)
}

func createEmbeddedChatModelFactory(cfg *config.OpenOctaConfig, provider, modelID string) (ChatModelFactory, error) {
	if provider == embeddedmodels.EmbeddedEmbeddingProviderKey {
		return nil, fmt.Errorf("provider %q is for embedding models; use %q for chat", provider, embeddedmodels.EmbeddedChatProviderKey)
	}
	foundModelID := strings.TrimSpace(modelID)
	var maxOut int
	if cfg != nil && cfg.Models != nil && cfg.Models.Providers != nil {
		if providerCfg, ok := cfg.Models.Providers[provider]; ok {
			if foundModelID == "" && len(providerCfg.Models) > 0 {
				foundModelID = providerCfg.Models[0].ID
			}
			if def := modelDefFromProviderCfg(providerCfg, foundModelID); def != nil && def.MaxTokens != nil {
				maxOut = *def.MaxTokens
			}
		}
	}
	if foundModelID == "" {
		return nil, fmt.Errorf("no model specified for provider %s", provider)
	}
	baseURL := embeddedmodels.GatewayProxyBaseURL(cfg, os.Getenv)
	modelName := foundModelID
	return chatModelFactoryFunc(func(ctx context.Context) (einomodel.ToolCallingChatModel, error) {
		// Gateway proxy at /api/embedded-models/v1 is OpenAI-compatible.
		return buildChatModel(ctx, false, modelName, "local", baseURL, maxOut)
	}), nil
}

func createChatModelFactory(cfg *config.OpenOctaConfig, provider, modelID string) (ChatModelFactory, error) {
	if embeddedmodels.IsEmbeddedProvider(provider) {
		return createEmbeddedChatModelFactory(cfg, provider, modelID)
	}

	if cfg != nil && cfg.Models != nil && cfg.Models.Providers != nil {
		if providerCfg, ok := cfg.Models.Providers[provider]; ok {
			foundModelID := modelID
			if foundModelID == "" && len(providerCfg.Models) > 0 {
				foundModelID = providerCfg.Models[0].ID
			}
			modelRefForEnv := provider + "/" + foundModelID
			apiKey := resolveProviderAPIKey(cfg, provider, providerCfg.APIKey, modelRefForEnv)
			if foundModelID == "" {
				return nil, fmt.Errorf("no model specified for provider %s", provider)
			}
			var maxOut int
			if def := modelDefFromProviderCfg(providerCfg, foundModelID); def != nil && def.MaxTokens != nil {
				maxOut = *def.MaxTokens
			}
			useAnthropic := providerCfg.API != nil && (strings.EqualFold(*providerCfg.API, "anthropic-messages") || *providerCfg.API == "anthropic")
			baseURL := strings.TrimSpace(providerCfg.BaseURL)
			modelName := foundModelID
			return chatModelFactoryFunc(func(ctx context.Context) (einomodel.ToolCallingChatModel, error) {
				return buildChatModel(ctx, useAnthropic, modelName, apiKey, baseURL, maxOut)
			}), nil
		}
	}

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
			return nil, fmt.Errorf("no model specified for provider %s", provider)
		}
		modelRefForEnv := provider + "/" + resolvedModel
		apiKey := getEnvVar(cfg, builtIn.envKey, modelRefForEnv)
		if apiKey == "" {
			return nil, fmt.Errorf("API key for provider %s not found", provider)
		}
		namePrefix := strings.ToUpper(strings.ReplaceAll(provider, "-", "_"))
		if provider == "kimi-coding" {
			namePrefix = "KIMI"
		}
		baseURL := builtIn.baseURL
		if envBase := getEnvVar(cfg, namePrefix+"_BASE_URL", modelRefForEnv); envBase != "" {
			baseURL = strings.TrimSpace(envBase)
		}
		useAnthropic := builtIn.useAnthropic
		modelName := resolvedModel
		return chatModelFactoryFunc(func(ctx context.Context) (einomodel.ToolCallingChatModel, error) {
			return buildChatModel(ctx, useAnthropic, modelName, apiKey, baseURL, 0)
		}), nil
	}

	if provider == "" {
		provider = "anthropic"
		modelID = "claude-sonnet-4-5-20250929"
	}
	switch provider {
	case "anthropic":
		if modelID == "" {
			return nil, fmt.Errorf("model id required")
		}
		apiKey := getEnvVar(cfg, "ANTHROPIC_API_KEY", "anthropic/"+modelID)
		if apiKey == "" {
			return nil, fmt.Errorf("ANTHROPIC_API_KEY not found")
		}
		name := modelID
		return chatModelFactoryFunc(func(ctx context.Context) (einomodel.ToolCallingChatModel, error) {
			return buildChatModel(ctx, true, name, apiKey, "", 0)
		}), nil
	case "openai":
		if modelID == "" {
			return nil, fmt.Errorf("model id required")
		}
		apiKey := getEnvVar(cfg, "OPENAI_API_KEY", "openai/"+modelID)
		if apiKey == "" {
			return nil, fmt.Errorf("OPENAI_API_KEY not found")
		}
		name := modelID
		return chatModelFactoryFunc(func(ctx context.Context) (einomodel.ToolCallingChatModel, error) {
			return buildChatModel(ctx, false, name, apiKey, "", 0)
		}), nil
	default:
		return nil, fmt.Errorf("model provider %q not found in config", provider)
	}
}

// CreateModelFactoryFromConfig builds a ChatModelFactory from OpenOcta config.
func CreateModelFactoryFromConfig(cfg *config.OpenOctaConfig, modelRef string) (ChatModelFactory, error) {
	provider, modelID := resolveModelFromConfig(modelRef)
	return createChatModelFactory(cfg, provider, modelID)
}

// CreateModelFactoryForModelRef builds a factory for an explicit model reference.
func CreateModelFactoryForModelRef(cfg *config.OpenOctaConfig, modelRef string) (ChatModelFactory, error) {
	provider, modelID := resolveModelFromConfig(strings.TrimSpace(modelRef))
	return createChatModelFactory(cfg, provider, modelID)
}

// DefaultModelFactory returns a default Anthropic chat model factory.
func DefaultModelFactory() ChatModelFactory {
	return chatModelFactoryFunc(func(ctx context.Context) (einomodel.ToolCallingChatModel, error) {
		apiKey := os.Getenv("ANTHROPIC_API_KEY")
		return buildChatModel(ctx, true, "claude-sonnet-4-5-20250929", apiKey, "", 0)
	})
}
