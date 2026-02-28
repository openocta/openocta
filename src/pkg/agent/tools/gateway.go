package tools

import (
	"context"
	"encoding/json"

	"github.com/cexll/agentsdk-go/pkg/tool"
)

// GatewayTool exposes config.get and config.schema to the agent via the gateway.
type GatewayTool struct {
	Invoker GatewayInvoker
}

// Name returns the tool name.
func (GatewayTool) Name() string {
	return "gateway_config"
}

// Description returns the tool description.
func (GatewayTool) Description() string {
	return "Read OpenOcta config or config schema. Actions: get, schema."
}

// Schema returns the parameter schema.
func (GatewayTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"action": map[string]interface{}{
				"type":        "string",
				"description": "get or schema",
				"enum":        []string{"get", "schema"},
			},
			"path": map[string]interface{}{"type": "string", "description": "Optional config path for get"},
		},
		Required: []string{"action"},
	}
}

// Execute runs the tool.
func (t GatewayTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	if t.Invoker == nil {
		return &tool.ToolResult{Success: false, Output: "gateway_config: invoker not configured"}, nil
	}
	action, _ := params["action"].(string)
	if action == "" {
		return &tool.ToolResult{Success: false, Output: "action is required"}, nil
	}
	method := "config." + action
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
