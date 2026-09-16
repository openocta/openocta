package eino

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/cloudwego/eino/schema"

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
					Models: []config.ModelDefinition{{ID: "MiniMax-M3"}, {ID: "MiniMax-M2.7"}},
				},
			},
		},
	}
	factory, err := CreateModelFactoryFromConfig(cfg, "minimax/MiniMax-M3")
	if err != nil {
		t.Fatalf("CreateModelFactoryFromConfig: %v", err)
	}
	if factory == nil {
		t.Fatal("expected non-nil factory")
	}
}

func TestBuiltInMiniMaxProvider(t *testing.T) {
	provider, ok := builtInProviders["minimax"]
	if !ok {
		t.Fatal("expected MiniMax built-in provider")
	}
	if provider.defaultModel != "MiniMax-M3" {
		t.Fatalf("default model = %q, want MiniMax-M3", provider.defaultModel)
	}
	if provider.baseURL != "https://api.minimax.io/anthropic" {
		t.Fatalf("base URL = %q, want global Anthropic-compatible base URL", provider.baseURL)
	}
	if !provider.useAnthropic {
		t.Fatal("expected Anthropic-compatible adapter")
	}
}

func TestMiniMaxCompatibleRequestPaths(t *testing.T) {
	tests := []struct {
		name     string
		api      string
		basePath string
		wantPath string
		response string
	}{
		{
			name:     "Anthropic",
			api:      "anthropic-messages",
			basePath: "/anthropic",
			wantPath: "/anthropic/v1/messages",
			response: `{"id":"msg_test","type":"message","role":"assistant","model":"MiniMax-M3","content":[{"type":"text","text":"ok"}],"stop_reason":"end_turn","stop_sequence":null,"usage":{"input_tokens":1,"output_tokens":1}}`,
		},
		{
			name:     "OpenAI",
			api:      "openai-completions",
			basePath: "/v1",
			wantPath: "/v1/chat/completions",
			response: `{"id":"chatcmpl_test","object":"chat.completion","created":0,"model":"MiniMax-M3","choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}`,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			requestPath := make(chan string, 1)
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				requestPath <- r.URL.Path
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(tc.response))
			}))
			t.Cleanup(server.Close)

			api := tc.api
			maxTokens := 128
			cfg := &config.OpenOctaConfig{
				Models: &config.ModelsConfig{
					Providers: map[string]config.ModelProvider{
						"minimax-test": {
							BaseURL: server.URL + tc.basePath,
							APIKey:  "test-key",
							API:     &api,
							Models:  []config.ModelDefinition{{ID: "MiniMax-M3", MaxTokens: &maxTokens}},
						},
					},
				},
			}
			factory, err := CreateModelFactoryFromConfig(cfg, "minimax-test/MiniMax-M3")
			if err != nil {
				t.Fatalf("CreateModelFactoryFromConfig: %v", err)
			}
			chatModel, err := factory.ChatModel(t.Context())
			if err != nil {
				t.Fatalf("ChatModel: %v", err)
			}
			if _, err := chatModel.Generate(t.Context(), []*schema.Message{schema.UserMessage("ping")}); err != nil {
				t.Fatalf("Generate: %v", err)
			}
			if got := <-requestPath; got != tc.wantPath {
				t.Fatalf("request path = %q, want %q", got, tc.wantPath)
			}
		})
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
