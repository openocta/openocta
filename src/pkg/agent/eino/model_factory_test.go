package eino

import (
	"os"
	"testing"

	"github.com/openocta/openocta/pkg/config"
)

func TestCreateModelFactoryFromConfig_EmbeddedChatWithoutProviderConfig(t *testing.T) {
	port := 18900
	cfg := &config.OpenOctaConfig{
		Gateway: &config.GatewayConfig{Port: &port},
	}
	factory, err := CreateModelFactoryFromConfig(cfg, "openocta-embedded-chat/test-model")
	if err != nil {
		t.Fatalf("CreateModelFactoryFromConfig: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestCreateModelFactoryFromConfig_UnknownProvider(t *testing.T) {
	_, err := CreateModelFactoryFromConfig(&config.OpenOctaConfig{}, "unknown-provider/some-model")
	if err == nil {
		t.Fatal("expected error for unknown provider")
	}
}

func TestCreateModelFactoryFromConfig_EmbeddedEmbeddingRejectedForChat(t *testing.T) {
	_, err := CreateModelFactoryFromConfig(&config.OpenOctaConfig{}, "openocta-embedded-embedding/test-model")
	if err == nil {
		t.Fatal("expected error when using embedding provider for chat")
	}
}

func TestCreateModelFactoryFromConfig_MiniMax(t *testing.T) {
	t.Setenv("MINIMAX_API_KEY", "test-key")
	cfg := &config.OpenOctaConfig{
		Models: &config.ModelsConfig{
			Providers: map[string]config.ModelProvider{
				"minimax": {
					Models: []config.ModelDefinition{{ID: "MiniMax-M2.7"}},
				},
			},
		},
	}
	factory, err := CreateModelFactoryFromConfig(cfg, "minimax/MiniMax-M2.7")
	if err != nil {
		t.Fatalf("CreateModelFactoryFromConfig: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestCreateModelFactoryFromConfig_AtlasCloud(t *testing.T) {
	t.Setenv("ATLASCLOUD_API_KEY", "test-key")
	cfg := &config.OpenOctaConfig{
		Models: &config.ModelsConfig{
			Providers: map[string]config.ModelProvider{
				"atlascloud": {
					Models: []config.ModelDefinition{{ID: "qwen/qwen3.5-flash"}},
				},
			},
		},
	}
	factory, err := CreateModelFactoryFromConfig(cfg, "atlascloud/qwen/qwen3.5-flash")
	if err != nil {
		t.Fatalf("CreateModelFactoryFromConfig: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
	_, err = factory.ChatModel(t.Context())
	if err != nil {
		// API key is fake; model construction should still succeed.
		if os.Getenv("CI") != "" {
			t.Fatalf("ChatModel: %v", err)
		}
	}
}

func TestCreateModelFactoryFromConfig_NearAI(t *testing.T) {
	t.Setenv("NEARAI_API_KEY", "test-key")
	cfg := &config.OpenOctaConfig{
		Models: &config.ModelsConfig{
			Providers: map[string]config.ModelProvider{
				"nearai": {
					Models: []config.ModelDefinition{{ID: "zai-org/GLM-5.1-FP8"}},
				},
			},
		},
	}
	factory, err := CreateModelFactoryFromConfig(cfg, "nearai/zai-org/GLM-5.1-FP8")
	if err != nil {
		t.Fatalf("CreateModelFactoryFromConfig: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
	_, err = factory.ChatModel(t.Context())
	if err != nil {
		// API key is fake; model construction should still succeed.
		if os.Getenv("CI") != "" {
			t.Fatalf("ChatModel: %v", err)
		}
	}
}
