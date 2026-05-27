package runtime

import (
	"context"
	"fmt"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

// WrapToolWithCommandValidation returns a tool wrapper that applies OpenOcta sandbox.validator
// rules before delegating to the underlying tool. Intended for Bash-like tools.
func WrapToolWithCommandValidation(inner tool.Tool, cfg *config.SandboxValidatorConfig) tool.Tool {
	if inner == nil {
		return nil
	}
	return &commandValidatedTool{inner: inner, cfg: cfg}
}

type commandValidatedTool struct {
	inner tool.Tool
	cfg   *config.SandboxValidatorConfig
}

func (t *commandValidatedTool) Name() string        { return t.inner.Name() }
func (t *commandValidatedTool) Description() string { return t.inner.Description() }
func (t *commandValidatedTool) Schema() *tool.JSONSchema {
	return t.inner.Schema()
}

func (t *commandValidatedTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	if shouldValidateCommandTool(t.inner.Name()) {
		if cmd, _ := params["command"].(string); strings.TrimSpace(cmd) != "" {
			if err := ValidateCommandWithConfig(cmd, t.cfg); err != nil {
				return nil, fmt.Errorf("validator: %w", err)
			}
		}
	}
	return t.inner.Execute(ctx, params)
}

// shouldValidateCommandTool reports whether the given tool name should be subject
// to command string validation. This allows us to extend validation beyond "bash"
// to other shell-like tools across different platforms.
func shouldValidateCommandTool(name string) bool {
	n := strings.ToLower(strings.TrimSpace(name))
	switch n {
	case "bash":
		return true
	case "sh", "shell":
		return true
	case "powershell", "pwsh":
		return true
	case "cmd":
		return true
	case "windows_exec_cmd":
		return true
	default:
		return false
	}
}
