// Package runtime: TokenCallback that appends token_usage JSON lines to session transcript files.
package runtime

import (
	"path/filepath"
	"strings"
	"time"

	"github.com/cexll/agentsdk-go/pkg/api"
	"github.com/openocta/openocta/pkg/logging"
	"github.com/openocta/openocta/pkg/session"
)

// NewTokenCallbackForSession returns an api.TokenCallback that appends a token_usage JSON line
// to the session transcript file at ~/.openocta/agents/<agentID>/sessions/<sessionID>.jsonl.
// Path is resolved per stats.SessionID using agentID and env. The callback is lightweight and
// appends one line per invocation; use from the SDK's token tracker (non-blocking recommended).
func NewTokenCallbackForSession(agentID string, env func(string) string) api.TokenCallback {
	if env == nil {
		env = func(string) string { return "" }
	}
	if strings.TrimSpace(agentID) == "" {
		agentID = session.DefaultAgentID
	}
	sessionsDir := session.ResolveAgentSessionsDir(agentID, env)
	return func(stats api.TokenStats) {
		sid := stats.SessionID
		if sid == "" {
			return
		}
		path := filepath.Join(sessionsDir, sid+".jsonl")
		line := logging.TokenUsageSessionLine{
			Timestamp:     stats.Timestamp.UTC().Format(time.RFC3339),
			SessionID:     stats.SessionID,
			RequestID:     stats.RequestID,
			Model:         stats.Model,
			Input:         stats.InputTokens,
			Output:        stats.OutputTokens,
			CacheRead:     stats.CacheRead,
			CacheCreation: stats.CacheCreation,
			TotalTokens:   stats.TotalTokens,
		}
		_ = logging.AppendTokenUsageToSession(path, line)
	}
}
