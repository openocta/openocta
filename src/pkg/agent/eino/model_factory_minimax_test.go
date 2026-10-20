package eino

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cloudwego/eino/schema"
	"github.com/openocta/openocta/pkg/config"
)

type miniMaxTestTransport func(*http.Request) (*http.Response, error)

func (f miniMaxTestTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestMiniMaxRegionalRequestURLs(t *testing.T) {
	for _, host := range []string{"api.minimax.io", "api.minimaxi.com"} {
		for _, api := range []string{"anthropic-messages", "openai-completions"} {
			t.Run(host+"/"+api, func(t *testing.T) {
				basePath, requestPath := "/anthropic", "/anthropic/v1/messages"
				response := `{"id":"msg_test","type":"message","role":"assistant","model":"test","content":[{"type":"text","text":"ok"}],"stop_reason":"end_turn","usage":{"input_tokens":1,"output_tokens":1}}`
				if api == "openai-completions" {
					basePath, requestPath = "/v1", "/v1/chat/completions"
					response = `{"id":"test","object":"chat.completion","created":0,"model":"test","choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}]}`
				}
				original := http.DefaultTransport
				t.Cleanup(func() { http.DefaultTransport = original })
				called := false
				http.DefaultTransport = miniMaxTestTransport(func(r *http.Request) (*http.Response, error) {
					called = true
					if got, want := r.URL.String(), "https://"+host+requestPath; got != want {
						t.Errorf("URL = %s, want %s", got, want)
					}
					return &http.Response{StatusCode: http.StatusOK, Header: http.Header{"Content-Type": {"application/json"}}, Body: io.NopCloser(strings.NewReader(response)), Request: r}, nil
				})
				cfg := &config.OpenOctaConfig{Models: &config.ModelsConfig{Providers: map[string]config.ModelProvider{
					"minimax": {BaseURL: "https://" + host + basePath, APIKey: "test-key", API: &api,
						Models: []config.ModelDefinition{{ID: "MiniMax-M3.1-Flash"}}},
				}}}
				factory, err := CreateModelFactoryFromConfig(cfg, "minimax/")
				if err != nil {
					t.Fatal(err)
				}
				chatModel, err := factory.ChatModel(t.Context())
				if err != nil {
					t.Fatal(err)
				}
				if _, err = chatModel.Generate(t.Context(), []*schema.Message{schema.UserMessage("ping")}); err != nil {
					t.Fatal(err)
				}
				if !called {
					t.Fatal("request did not reach mocked transport")
				}
			})
		}
	}
}

func TestMiniMaxLegacyGatewayRequiresExplicitModel(t *testing.T) {
	t.Setenv("SYNTHETIC_API_KEY", "test-key")
	t.Setenv("SYNTHETIC_MODEL", "")
	cfg := &config.OpenOctaConfig{}
	if _, err := CreateModelFactoryFromConfig(cfg, "synthetic/"); err == nil {
		t.Fatal("expected explicit gateway model requirement")
	}
	if _, err := CreateModelFactoryFromConfig(cfg, "synthetic/hf:MiniMaxAI/MiniMax-M2.1"); err != nil {
		t.Fatalf("saved gateway model: %v", err)
	}
}

// Exercise the public factory and SDK serialization without provider credentials.
func TestMiniMaxModelSelectionPayload(t *testing.T) {
	for _, tc := range []struct {
		name, api, modelRef, envModel, savedModel, wantModel string
	}{
		{name: "built-in-default", modelRef: "minimax/", wantModel: "MiniMax-M3.1-Flash"},
		{name: "built-in-M3", modelRef: "minimax/MiniMax-M3", wantModel: "MiniMax-M3"},
		{name: "built-in-legacy", modelRef: "minimax/MiniMax-M2.7", wantModel: "MiniMax-M2.7"},
		{name: "environment-override", modelRef: "minimax/", envModel: "custom-model", wantModel: "custom-model"},
		{name: "explicit-beats-environment", modelRef: "minimax/MiniMax-M3", envModel: "custom-model", wantModel: "MiniMax-M3"},
		{name: "saved-first-model", api: "anthropic-messages", modelRef: "minimax/", savedModel: "MiniMax-M2.7", wantModel: "MiniMax-M2.7"},
		{name: "configured-flash", api: "anthropic-messages", modelRef: "minimax/MiniMax-M3.1-Flash", wantModel: "MiniMax-M3.1-Flash"},
		{name: "configured-completions-flash", api: "openai-completions", modelRef: "minimax/MiniMax-M3.1-Flash", wantModel: "MiniMax-M3.1-Flash"},
		{name: "configured-completions-M3", api: "openai-completions", modelRef: "minimax/MiniMax-M3", wantModel: "MiniMax-M3"},
		{name: "configured-completions-legacy", api: "openai-completions", modelRef: "minimax/MiniMax-M2.7", wantModel: "MiniMax-M2.7"},
		{name: "configured-custom", api: "openai-completions", modelRef: "minimax/custom-model", wantModel: "custom-model"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			basePath, wantPath := "/anthropic", "/anthropic/v1/messages"
			response := `{"id":"msg_test","type":"message","role":"assistant","model":"test","content":[{"type":"text","text":"ok"}],"stop_reason":"end_turn","usage":{"input_tokens":1,"output_tokens":1}}`
			if tc.api == "openai-completions" {
				basePath, wantPath = "/v1", "/v1/chat/completions"
				response = `{"id":"chatcmpl_test","object":"chat.completion","created":0,"model":"test","choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}`
			}
			payloads := make(chan map[string]any, 1)
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != wantPath || r.Method != http.MethodPost {
					t.Errorf("request = %s %s, want POST %s", r.Method, r.URL.Path, wantPath)
				}
				var payload map[string]any
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					t.Errorf("decode request: %v", err)
				}
				payloads <- payload
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(response))
			}))
			t.Cleanup(server.Close)
			t.Setenv("MINIMAX_API_KEY", "test-key")
			t.Setenv("MINIMAX_MODEL", tc.envModel)
			t.Setenv("MINIMAX_BASE_URL", server.URL+basePath)
			cfg := &config.OpenOctaConfig{}
			if tc.api != "" {
				maxTokens := 128
				modelID := tc.wantModel
				if tc.savedModel != "" {
					modelID = tc.savedModel
				}
				cfg.Models = &config.ModelsConfig{Providers: map[string]config.ModelProvider{
					"minimax": {BaseURL: server.URL + basePath, APIKey: "test-key", API: &tc.api,
						Models: []config.ModelDefinition{{ID: modelID, MaxTokens: &maxTokens}}},
				}}
			}
			factory, err := CreateModelFactoryFromConfig(cfg, tc.modelRef)
			if err != nil {
				t.Fatal(err)
			}
			chatModel, err := factory.ChatModel(t.Context())
			if err != nil {
				t.Fatal(err)
			}
			message := schema.UserMessage("ping")
			message.MultiContent = []schema.ChatMessagePart{
				{Type: schema.ChatMessagePartTypeText, Text: "ping"},
				{Type: schema.ChatMessagePartTypeImageURL, ImageURL: &schema.ChatMessageImageURL{URL: "https://example.com/image.png"}},
			}
			if _, err = chatModel.Generate(t.Context(), []*schema.Message{message}); err != nil {
				t.Fatal(err)
			}
			payload := <-payloads
			serialized, err := json.Marshal(payload["messages"])
			if err != nil || !strings.Contains(string(serialized), "https://example.com/image.png") || !strings.Contains(string(serialized), "ping") {
				t.Errorf("multimodal content was not preserved: %s (%v)", serialized, err)
			}
			if payload["model"] != tc.wantModel {
				t.Errorf("model = %v, want %s", payload["model"], tc.wantModel)
			}
			for _, key := range []string{"thinking", "reasoning_effort", "output_config", "service_tier", "reasoning_split"} {
				if value, exists := payload[key]; exists {
					t.Errorf("default request unexpectedly sets %s = %v", key, value)
				}
			}
			if tc.api != "" && payload["max_tokens"] != float64(128) {
				t.Errorf("max_tokens = %v, want configured limit 128", payload["max_tokens"])
			}
			if tc.api == "" && (tc.wantModel == "MiniMax-M3.1-Flash" || tc.wantModel == "MiniMax-M3") && payload["max_tokens"] != float64(4096) {
				t.Errorf("max_tokens = %v, want default limit 4096", payload["max_tokens"])
			}
			if messages, ok := payload["messages"].([]any); !ok || len(messages) != 1 {
				t.Errorf("messages = %v, want one user message", payload["messages"])
			}
		})
	}
}
