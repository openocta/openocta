package eino

import (
	"testing"

	"github.com/openocta/openocta/pkg/config"
)

func TestCozeLoopConfigIsEnabled(t *testing.T) {
	t.Parallel()

	trueVal := true
	falseVal := false

	tests := []struct {
		name string
		cfg  *config.CozeLoopConfig
		want bool
	}{
		{"nil", nil, false},
		{"enable true", &config.CozeLoopConfig{Enable: &trueVal}, true},
		{"enable false", &config.CozeLoopConfig{Enable: &falseVal}, false},
		{"enabled true", &config.CozeLoopConfig{Enabled: &trueVal}, true},
		{"enable wins over enabled", &config.CozeLoopConfig{Enable: &falseVal, Enabled: &trueVal}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := tt.cfg.IsEnabled(); got != tt.want {
				t.Fatalf("IsEnabled() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestResolveCozeLoopSettingsDefaultsWhenMissing(t *testing.T) {
	t.Setenv("COZELOOP_API_TOKEN", "")
	t.Setenv("COZELOOP_WORKSPACE_ID", "")
	t.Setenv("COZELOOP_API_BASE_URL", "")

	enabled, token, ws, base := resolveCozeLoopSettings(&config.OpenOctaConfig{})
	if enabled {
		t.Fatal("expected enabled=false when cozeloop is not configured")
	}
	if token != "" {
		t.Fatalf("apiToken = %q, want empty", token)
	}
	if ws != "" {
		t.Fatalf("workspaceID = %q, want empty", ws)
	}
	if base != "" {
		t.Fatalf("apiBaseURL = %q, want empty", base)
	}
}

func TestResolveCozeLoopSettingsFromEnvWhenMissingConfig(t *testing.T) {
	t.Setenv("COZELOOP_API_TOKEN", "env-token")
	t.Setenv("COZELOOP_WORKSPACE_ID", "env-ws")
	t.Setenv("COZELOOP_API_BASE_URL", "http://env.test")

	enabled, token, ws, base := resolveCozeLoopSettings(&config.OpenOctaConfig{})
	if !enabled {
		t.Fatal("expected enabled=true when COZELOOP env credentials are set")
	}
	if token != "env-token" || ws != "env-ws" || base != "http://env.test" {
		t.Fatalf("resolveCozeLoopSettings() = (%v, %q, %q, %q)", enabled, token, ws, base)
	}
}

func TestResolveCozeLoopSettingsDisabledConfigIgnoresDefaults(t *testing.T) {
	t.Setenv("COZELOOP_API_TOKEN", "")
	t.Setenv("COZELOOP_WORKSPACE_ID", "")
	t.Setenv("COZELOOP_API_BASE_URL", "")

	falseVal := false
	enabled, token, ws, base := resolveCozeLoopSettings(&config.OpenOctaConfig{
		CozeLoop: &config.CozeLoopConfig{Enable: &falseVal},
	})
	if enabled {
		t.Fatal("expected enabled=false when cozeloop.enable=false")
	}
	if token != "" || ws != "" || base != "" {
		t.Fatalf("resolveCozeLoopSettings() = (%v, %q, %q, %q)", enabled, token, ws, base)
	}
}

func TestResolveCozeLoopSettingsFromConfig(t *testing.T) {
	trueVal := true
	apiToken := "token"
	workspaceID := "ws"
	apiBaseURL := "http://example.test"

	enabled, token, ws, base := resolveCozeLoopSettings(&config.OpenOctaConfig{
		CozeLoop: &config.CozeLoopConfig{
			Enable:      &trueVal,
			APIToken:    &apiToken,
			WorkspaceID: &workspaceID,
			APIBaseURL:  &apiBaseURL,
		},
	})

	if !enabled || token != apiToken || ws != workspaceID || base != apiBaseURL {
		t.Fatalf("resolveCozeLoopSettings() = (%v, %q, %q, %q)", enabled, token, ws, base)
	}
}
