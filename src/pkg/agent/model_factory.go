// Package agent provides agent configuration and model factory creation.
package agent

import (
	"fmt"
	"os"
	"strings"

	"github.com/cexll/agentsdk-go/pkg/api"
	"github.com/cexll/agentsdk-go/pkg/model"
	"github.com/openocta/openocta/pkg/config"
)

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

// getEnvVar returns config.env.vars[key] or os.Getenv(key).
func getEnvVar(cfg *config.OpenOctaConfig, key string) string {
	if cfg != nil && cfg.Env != nil && cfg.Env.Vars != nil {
		if val, ok := cfg.Env.Vars[key]; ok && val != "" {
			return val
		}
	}
	return os.Getenv(key)
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

	if cfg != nil && cfg.Models != nil && cfg.Models.Providers != nil {
		if providerCfg, ok := cfg.Models.Providers[provider]; ok {
			apiKey := providerCfg.APIKey
			if apiKey != "" {
				if strings.HasPrefix(apiKey, "$") || (!strings.HasPrefix(apiKey, "sk-") && !strings.HasPrefix(apiKey, "gsk-") && !strings.HasPrefix(apiKey, "xai-")) {
					envKey := strings.TrimPrefix(apiKey, "$")
					apiKey = getEnvVar(cfg, envKey)
					if apiKey == "" {
						return nil, fmt.Errorf("API key for provider %s not found: config.models.providers.%s.apiKey references '%s', but it's not found in config.env.vars.%s or %s environment variable", provider, provider, envKey, envKey, envKey)
					}
				}
			} else {
				apiKey = getEnvVar(cfg, strings.ToUpper(provider)+"_API_KEY")
			}
			if apiKey == "" {
				return nil, fmt.Errorf("API key for provider %s not found: check config.models.providers.%s.apiKey (can be a key value or env var name like 'LITELLM_KEY'), or set it in config.env.vars", provider, provider)
			}

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
			if foundModelID == "" {
				return nil, fmt.Errorf("no model specified for provider %s and no models defined in config.models.providers.%s", provider, provider)
			}

			return &model.OpenAIProvider{
				ModelName: foundModelID,
				APIKey:    apiKey,
				BaseURL:   providerCfg.BaseURL,
			}, nil
		}
	}

	if provider == "" {
		provider = "anthropic"
		modelID = "claude-sonnet-4-5-20250929"
	}

	switch provider {
	case "anthropic":
		apiKey := getEnvVar(cfg, "ANTHROPIC_API_KEY")
		if apiKey == "" {
			return nil, fmt.Errorf("ANTHROPIC_API_KEY not found: check config.env.vars.ANTHROPIC_API_KEY in config file or ANTHROPIC_API_KEY environment variable")
		}
		if modelID == "" {
			modelID = "claude-sonnet-4-5-20250929"
		}
		return &model.AnthropicProvider{
			ModelName: modelID,
			APIKey:    apiKey,
		}, nil
	case "openai":
		apiKey := getEnvVar(cfg, "OPENAI_API_KEY")
		if apiKey == "" {
			return nil, fmt.Errorf("OPENAI_API_KEY not found: check config.env.vars.OPENAI_API_KEY in config file or OPENAI_API_KEY environment variable")
		}
		if modelID == "" {
			modelID = "gpt-4"
		}
		return &model.OpenAIProvider{
			ModelName: modelID,
			APIKey:    apiKey,
		}, nil
	default:
		apiKey := getEnvVar(cfg, "ANTHROPIC_API_KEY")
		if apiKey == "" {
			return &model.AnthropicProvider{
				ModelName: "claude-sonnet-4-5-20250929",
			}, nil
		}
		return &model.AnthropicProvider{
			ModelName: "claude-sonnet-4-5-20250929",
			APIKey:    apiKey,
		}, nil
	}
}
