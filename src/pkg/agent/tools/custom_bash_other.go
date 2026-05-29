//go:build !windows

package tools

import (
	"context"

	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

// CustomBashTool is a stub on non-Windows platforms.
type CustomBashTool struct{}

func (CustomBashTool) Name() string        { return "bash" }
func (CustomBashTool) Description() string { return "stub" }
func (CustomBashTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{Type: "object"}
}
func (CustomBashTool) Execute(_ context.Context, _ map[string]interface{}) (*tool.ToolResult, error) {
	return &tool.ToolResult{Success: false, Output: "CustomBashTool is only available on Windows"}, nil
}
