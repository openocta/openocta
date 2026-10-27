package eino

import (
	"context"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	ccb "github.com/cloudwego/eino-ext/callbacks/cozeloop"
	"github.com/cloudwego/eino/callbacks"
	"github.com/coze-dev/cozeloop-go"

	"github.com/openocta/openocta/pkg/config"
)

var cozeLoopMu sync.Mutex

type cozeLoopState struct {
	client cozeloop.Client
}

var cozeLoop cozeLoopState

// SetupCozeLoop registers the Eino global callback handler for CozeLoop trace export.
// Safe to call multiple times; only the first successful setup takes effect.
func SetupCozeLoop(cfg *config.OpenOctaConfig) {
	enabled, apiToken, workspaceID, apiBaseURL := resolveCozeLoopSettings(cfg)
	if !enabled {
		return
	}
	if apiToken == "" || workspaceID == "" {
		slog.Warn("cozeloop: enabled but apiToken or workspaceId is missing")
		return
	}

	cozeLoopMu.Lock()
	defer cozeLoopMu.Unlock()
	if cozeLoop.client != nil {
		return
	}

	opts := []cozeloop.Option{
		cozeloop.WithAPIToken(apiToken),
		cozeloop.WithWorkspaceID(workspaceID),
	}
	if apiBaseURL != "" {
		opts = append(opts, cozeloop.WithAPIBaseURL(apiBaseURL))
	}

	client, err := cozeloop.NewClient(opts...)
	if err != nil {
		slog.Warn("cozeloop: failed to create client", "error", err)
		return
	}

	handler := ccb.NewLoopHandler(client, ccb.WithCallbackDataParser(newCozeLoopParser()))
	callbacks.AppendGlobalHandlers(handler)
	cozeLoop.client = client

	logFields := []any{"workspace_id", workspaceID}
	if apiBaseURL != "" {
		logFields = append(logFields, "api_base_url", apiBaseURL)
	}
	slog.Info("cozeloop tracing enabled", logFields...)
}

// ShutdownCozeLoop flushes pending spans and closes the CozeLoop client.
func ShutdownCozeLoop(ctx context.Context) {
	cozeLoopMu.Lock()
	defer cozeLoopMu.Unlock()
	if cozeLoop.client == nil {
		return
	}
	time.Sleep(2 * time.Second)
	cozeLoop.client.Close(ctx)
	cozeLoop.client = nil
}

func resolveCozeLoopSettings(cfg *config.OpenOctaConfig) (enabled bool, apiToken, workspaceID, apiBaseURL string) {
	// CozeLoop is opt-in. Omitting the cozeloop section must not enable tracing
	// with baked-in credentials (that produced recurring 401 spam for users who
	// never configured CozeLoop — see #116).
	if cfg != nil && cfg.CozeLoop != nil {
		cl := cfg.CozeLoop
		enabled = cl.IsEnabled()
		if cl.APIToken != nil {
			apiToken = strings.TrimSpace(*cl.APIToken)
		}
		if cl.WorkspaceID != nil {
			workspaceID = strings.TrimSpace(*cl.WorkspaceID)
		}
		if cl.APIBaseURL != nil {
			apiBaseURL = strings.TrimSpace(*cl.APIBaseURL)
		}
	}

	if apiToken == "" {
		apiToken = strings.TrimSpace(os.Getenv("COZELOOP_API_TOKEN"))
	}
	if workspaceID == "" {
		workspaceID = strings.TrimSpace(os.Getenv("COZELOOP_WORKSPACE_ID"))
	}
	if apiBaseURL == "" {
		apiBaseURL = strings.TrimSpace(os.Getenv("COZELOOP_API_BASE_URL"))
	}
	// Env-only setup: both token and workspace imply enable.
	if !enabled && apiToken != "" && workspaceID != "" {
		enabled = true
	}
	return enabled, apiToken, workspaceID, apiBaseURL
}
