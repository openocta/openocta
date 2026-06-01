package agent

import (
	"os"
	"testing"

	"github.com/openocta/openocta/pkg/config"
)

func TestBuiltInMiniMaxProvider_DefaultModel(t *testing.T) {
	bp, ok := builtInProviders["minimax"]
	if !ok {
		t.Fatal("minimax not found in builtInProviders")
	}
	if bp.defaultModel != "MiniMax-M3" {
		t.Errorf("expected default model MiniMax-M3, got %s", bp.defaultModel)
	}
}

func TestBuiltInMiniMaxProvider_BaseURL(t *testing.T) {
	bp := builtInProviders["minimax"]
	want := "https://api.minimax.io/anthropic"
	if bp.baseURL != want {
		t.Errorf("expected baseURL %s, got %s", want, bp.baseURL)
	}
}

func TestBuiltInMiniMaxProvider_UsesAnthropicAPI(t *testing.T) {
	bp := builtInProviders["minimax"]
	if !bp.useAnthropic {
		t.Error("expected MiniMax provider to use Anthropic Messages API")
	}
}

func TestBuiltInMiniMaxProvider_EnvKey(t *testing.T) {
	bp := builtInProviders["minimax"]
	if bp.envKey != "MINIMAX_API_KEY" {
		t.Errorf("expected envKey MINIMAX_API_KEY, got %s", bp.envKey)
	}
}

func TestResolveModelFromConfig_MiniMaxRef(t *testing.T) {
	tests := []struct {
		ref      string
		provider string
		modelID  string
	}{
		{"minimax/MiniMax-M3", "minimax", "MiniMax-M3"},
		{"minimax/MiniMax-M2.7", "minimax", "MiniMax-M2.7"},
		{"minimax/MiniMax-M2.7-highspeed", "minimax", "MiniMax-M2.7-highspeed"},
	}
	for _, tt := range tests {
		p, m := resolveModelFromConfig(tt.ref)
		if p != tt.provider || m != tt.modelID {
			t.Errorf("resolveModelFromConfig(%q) = (%q, %q), want (%q, %q)", tt.ref, p, m, tt.provider, tt.modelID)
		}
	}
}

func TestCreateModelFactory_MiniMax_BuiltIn(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-minimax-key-123")

	cfg := &config.OpenOctaConfig{}
	factory, err := createModelFactoryForProviderModel(cfg, "minimax", "MiniMax-M2.7")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestCreateModelFactory_MiniMax_DefaultModel(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-minimax-key-123")

	cfg := &config.OpenOctaConfig{}
	// Empty model ID should fall back to built-in default (MiniMax-M3)
	factory, err := createModelFactoryForProviderModel(cfg, "minimax", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestCreateModelFactory_MiniMax_HighspeedModel(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-minimax-key-123")

	cfg := &config.OpenOctaConfig{}
	factory, err := createModelFactoryForProviderModel(cfg, "minimax", "MiniMax-M2.7-highspeed")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestCreateModelFactory_MiniMax_MissingAPIKey(t *testing.T) {
	// Ensure MINIMAX_API_KEY is not set
	os.Unsetenv("MINIMAX_API_KEY")
	t.Setenv("MINIMAX_API_KEY", "")
	os.Unsetenv("MINIMAX_API_KEY")

	cfg := &config.OpenOctaConfig{}
	_, err := createModelFactoryForProviderModel(cfg, "minimax", "MiniMax-M2.7")
	if err == nil {
		t.Error("expected error for missing MINIMAX_API_KEY, got nil")
	}
}

func TestCreateModelFactory_MiniMax_ConfigProvider(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-minimax-key-456")
	api := "anthropic-messages"

	cfg := &config.OpenOctaConfig{
		Models: &config.ModelsConfig{
			Providers: map[string]config.ModelProvider{
				"minimax": {
					BaseURL: "https://api.minimax.io/anthropic",
					APIKey:  "$MINIMAX_API_KEY",
					API:     &api,
					Models: []config.ModelDefinition{
						{ID: "MiniMax-M3", Name: "MiniMax M3"},
						{ID: "MiniMax-M2.7", Name: "MiniMax M2.7"},
						{ID: "MiniMax-M2.7-highspeed", Name: "MiniMax M2.7 Highspeed"},
					},
				},
			},
		},
	}

	factory, err := createModelFactoryForProviderModel(cfg, "minimax", "MiniMax-M2.7")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestCreateModelFactory_MiniMax_EnvOverrideModel(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-minimax-key-123")
	t.Setenv("MINIMAX_MODEL", "MiniMax-M3")

	cfg := &config.OpenOctaConfig{}
	// Empty model ID should pick up MINIMAX_MODEL env var
	factory, err := createModelFactoryForProviderModel(cfg, "minimax", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestGetEnvVar_MiniMaxFromConfig(t *testing.T) {
	cfg := &config.OpenOctaConfig{
		Env: &config.EnvConfig{
			Vars: map[string]string{
				"MINIMAX_API_KEY": "config-minimax-key",
			},
		},
	}
	val := getEnvVar(cfg, "MINIMAX_API_KEY", "")
	if val != "config-minimax-key" {
		t.Errorf("expected config-minimax-key, got %s", val)
	}
}

func TestGetEnvVar_MiniMaxModelEnvOverride(t *testing.T) {
	cfg := &config.OpenOctaConfig{
		Env: &config.EnvConfig{
			Vars: map[string]string{
				"MINIMAX_API_KEY": "global-key",
			},
			ModelEnv: map[string]map[string]string{
				"minimax/MiniMax-M2.7": {
					"MINIMAX_API_KEY": "per-model-key",
				},
			},
		},
	}
	val := getEnvVar(cfg, "MINIMAX_API_KEY", "minimax/MiniMax-M2.7")
	if val != "per-model-key" {
		t.Errorf("expected per-model-key, got %s", val)
	}
}

func TestResolveAgentModelRef_MiniMax(t *testing.T) {
	boolTrue := true
	cfg := &config.OpenOctaConfig{
		Agents: &config.AgentsConfig{
			List: []config.AgentConfig{
				{
					ID:      "main",
					Default: &boolTrue,
					Model:   "minimax/MiniMax-M2.7",
				},
			},
		},
	}
	ref := resolveAgentModelRef(cfg, "main")
	if ref != "minimax/MiniMax-M2.7" {
		t.Errorf("expected minimax/MiniMax-M2.7, got %s", ref)
	}
}

func TestResolveSessionAgentID_Default(t *testing.T) {
	id := ResolveSessionAgentID("")
	if id != "main" {
		t.Errorf("expected main, got %s", id)
	}
}

func TestResolveSessionAgentID_FromKey(t *testing.T) {
	id := ResolveSessionAgentID("agent:ops:sess123")
	if id != "ops" {
		t.Errorf("expected ops, got %s", id)
	}
}
