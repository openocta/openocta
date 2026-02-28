package tools

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/cexll/agentsdk-go/pkg/tool"
	"github.com/openocta/openocta/pkg/session"
)

// SessionIDFromSessionKey derives a session ID from a session key when no store is available.
// Session key formats: "agent:main:sessionId", a single safe ID, or "main". Empty key returns "main".
// Used as fallback when sessions.json does not contain an entry for the key.
func SessionIDFromSessionKey(sessionKey string) string {
	key := strings.TrimSpace(strings.ToLower(sessionKey))
	if key == "" {
		return "main"
	}
	parts := strings.SplitN(key, ":", 3)
	if len(parts) >= 3 {
		return parts[2]
	}
	if len(parts) == 1 && session.SafeSessionIDRe.MatchString(parts[0]) {
		return parts[0]
	}
	return "main"
}

// SessionsTool exposes sessions.list (and optionally send/history) to the agent via the gateway.
type SessionsTool struct {
	Invoker GatewayInvoker
}

// Name returns the tool name.
func (SessionsTool) Name() string {
	return "sessions"
}

// Description returns the tool description.
func (SessionsTool) Description() string {
	return "List or query chat sessions. Actions: list, preview. Use sessions.list to list session keys."
}

// Schema returns the parameter schema.
func (SessionsTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"action": map[string]interface{}{
				"type":        "string",
				"description": "list or preview",
				"enum":        []string{"list", "preview"},
			},
			"sessionKey": map[string]interface{}{"type": "string", "description": "Session key for preview"},
			"limit":      map[string]interface{}{"type": "number", "description": "Max items for list"},
		},
		Required: []string{"action"},
	}
}

// Execute runs the tool.
func (t SessionsTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	if t.Invoker == nil {
		return &tool.ToolResult{Success: false, Output: "sessions: invoker not configured"}, nil
	}
	action, _ := params["action"].(string)
	if action == "" {
		return &tool.ToolResult{Success: false, Output: "action is required"}, nil
	}
	method := "sessions." + action
	ok, payload, err := t.Invoker.Invoke(method, params)
	if err != nil {
		return &tool.ToolResult{Success: false, Output: err.Error()}, nil
	}
	if !ok {
		return &tool.ToolResult{Success: false, Output: method + " failed"}, nil
	}
	out, _ := json.Marshal(payload)
	return &tool.ToolResult{Success: true, Output: string(out)}, nil
}
