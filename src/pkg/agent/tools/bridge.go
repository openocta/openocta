// Package tools bridges OpenOcta tools to agentsdk-go tool.Tool interface.
package tools

import (
	"context"

	"github.com/cexll/agentsdk-go/pkg/tool"
)

// Registry holds custom tools for the agent runtime.
type Registry struct {
	tools []tool.Tool
}

// NewRegistry creates a new tool registry.
func NewRegistry() *Registry {
	return &Registry{tools: nil}
}

// Register adds a tool.
func (r *Registry) Register(t tool.Tool) {
	if t != nil {
		r.tools = append(r.tools, t)
	}
}

// Tools returns all registered tools.
func (r *Registry) Tools() []tool.Tool {
	if r.tools == nil {
		return []tool.Tool{}
	}
	return r.tools
}

// EchoTool is a minimal demo tool (Phase 3b).
type EchoTool struct{}

// Name returns the tool name.
func (EchoTool) Name() string {
	return "echo"
}

// Description returns the tool description.
func (EchoTool) Description() string {
	return "Echo back the input text (demo tool)"
}

// Schema returns the parameter schema.
func (EchoTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"text": map[string]interface{}{
				"type":        "string",
				"description": "Text to echo back",
			},
		},
		Required: []string{"text"},
	}
}

// Execute runs the tool.
func (EchoTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	_ = ctx
	text, _ := params["text"].(string)
	if text == "" {
		return &tool.ToolResult{Success: false, Output: "text is required"}, nil
	}
	return &tool.ToolResult{Success: true, Output: text}, nil
}

// DefaultTools returns the default tool set (Echo only). Use DefaultToolsWithInvoker when gateway context is available.
func DefaultTools() []tool.Tool {
	return []tool.Tool{EchoTool{}}
}

// DefaultToolsWithInvoker returns built-in tools that can call the gateway (cron, config, sessions, etc.).
// Pass nil invoker to get only EchoTool.
func DefaultToolsWithInvoker(invoker GatewayInvoker) []tool.Tool {
	list := []tool.Tool{EchoTool{}}
	if invoker != nil {
		list = append(list,
			CronTool{Invoker: invoker},
			GatewayTool{Invoker: invoker},
			SessionsTool{Invoker: invoker},
		)
	}
	return list
}
