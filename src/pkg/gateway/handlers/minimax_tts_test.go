package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMiniMaxTTSProviderConvert(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.Header.Get("Authorization") != "Bearer test-key" {
			t.Fatalf("unexpected request metadata")
		}
		var request MiniMaxSpeechRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if request.Model != "speech-2.8-hd" || request.Text != "hello" || request.OutputFormat != "wav" {
			t.Fatalf("unexpected request: %+v", request)
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"data":      map[string]interface{}{"audio": "6869", "status": 2},
			"base_resp": map[string]interface{}{"status_code": 0},
		})
	}))
	defer server.Close()

	provider := NewMiniMaxTTSProvider("test-key", "global_en")
	provider.Endpoint = server.URL
	result, err := provider.Convert(context.Background(), MiniMaxSpeechRequest{Model: "speech-2.8-hd", Text: "hello", OutputFormat: "wav"})
	if err != nil {
		t.Fatalf("convert: %v", err)
	}
	if string(result.Audio) != "hi" || result.Format != "wav" || result.Status != 2 {
		t.Fatalf("unexpected result: %+v", result)
	}
}

func TestMiniMaxTTSEndpoints(t *testing.T) {
	if got := miniMaxTTSEndpoint("global_en"); got != minimaxGlobalTTSEndpoint {
		t.Fatalf("global endpoint = %q", got)
	}
	if got := miniMaxTTSEndpoint("cn_zh"); got != minimaxChinaTTSEndpoint {
		t.Fatalf("China endpoint = %q", got)
	}
}
