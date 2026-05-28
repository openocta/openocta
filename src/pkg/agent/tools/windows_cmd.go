// Package tools provides custom tools for the agent runtime.
package tools

import (
	"bytes"
	"context"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

// WindowsCmdTool executes shell commands on Windows via PowerShell (preferred)
// or cmd (fallback). PowerShell provides broad cross-platform command compatibility.
// Only available when the agent runs on Windows.
type WindowsCmdTool struct {
	Timeout time.Duration // Optional: command timeout, defaults to 60s
}

// Name returns the tool name.
func (WindowsCmdTool) Name() string {
	return "windows_exec_cmd"
}

// Description returns the tool description.
func (WindowsCmdTool) Description() string {
	return "Execute a command on Windows. Uses PowerShell by default for maximum compatibility with both Windows-native and Unix-style commands. Falls back to cmd if PowerShell is unavailable. Runs silently with no console window."
}

// Schema returns the parameter schema.
func (WindowsCmdTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"command": map[string]interface{}{
				"type":        "string",
				"description": "Command to execute silently. PowerShell supports most common Unix-style aliases (ls, cat, ps, curl, ssh, etc.) as well as native Windows commands.",
			},
			"timeout": map[string]interface{}{
				"type":        "integer",
				"description": "Optional timeout in seconds (default 60)",
			},
		},
		Required: []string{"command"},
	}
}

// Execute runs the tool.
func (t WindowsCmdTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	if runtime.GOOS != "windows" {
		return &tool.ToolResult{
			Success: false,
			Output:  "windows_exec_cmd: this tool only works on Windows. Current OS is " + runtime.GOOS + ".",
		}, nil
	}

	cmdStr, _ := params["command"].(string)
	cmdStr = strings.TrimSpace(cmdStr)
	if cmdStr == "" {
		return &tool.ToolResult{Success: false, Output: "command is required"}, nil
	}

	// Parse optional timeout parameter
	timeout := t.Timeout
	if timeout == 0 {
		timeout = 60 * time.Second // default 60 seconds
	}
	if timeoutSec, ok := params["timeout"].(float64); ok && timeoutSec > 0 {
		timeout = time.Duration(timeoutSec) * time.Second
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var stdout, stderr bytes.Buffer

	shell, args, shellName := resolvePreferredWindowsShell(cmdStr)
	cmd := exec.CommandContext(timeoutCtx, shell, args...)
	applyExecNoWindow(cmd)
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	cmd.Stdin = nil

	err := cmd.Run()

	// Fallback: if PowerShell was selected but cannot start, degrade to cmd.
	// Do not fall back on command exit failures; that would mask shell-incompatible commands.
	if err != nil && shellName == "powershell" && isExecutableNotFound(err) {
		stdout.Reset()
		stderr.Reset()
		cmd = exec.CommandContext(timeoutCtx, "cmd", "/c", cmdStr)
		applyExecNoWindow(cmd)
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr
		cmd.Stdin = nil
		err = cmd.Run()
	}

	// Handle timeout
	if timeoutCtx.Err() == context.DeadlineExceeded {
		return &tool.ToolResult{Success: false, Output: "command timeout after " + timeout.String()}, nil
	}

	outStr := strings.TrimSpace(stdout.String())
	errStr := strings.TrimSpace(stderr.String())

	if err != nil {
		combined := outStr
		if errStr != "" {
			if combined != "" {
				combined += "\n"
			}
			combined += errStr
		}
		if combined == "" {
			combined = err.Error()
		}
		return &tool.ToolResult{Success: false, Output: combined}, nil
	}

	output := outStr
	if errStr != "" {
		output = outStr + "\n" + errStr
	}
	if output == "" {
		output = "(command completed with no output)"
	}
	return &tool.ToolResult{Success: true, Output: output}, nil
}

func resolvePreferredWindowsShell(command string) (exe string, argv []string, name string) {
	// 优先使用 PowerShell（Windows 内置，兼容大多数 Unix 命令别名）
	if ps := findPowerShell(); ps != "" {
		return ps, []string{"-NoProfile", "-Command", command}, "powershell"
	}
	// 回退到 cmd
	return "cmd", []string{"/c", command}, "cmd"
}

// findPowerShell 查找 Windows PowerShell 或 PowerShell Core
func findPowerShell() string {
	for _, name := range []string{"powershell.exe", "pwsh.exe", "powershell", "pwsh"} {
		if path, err := exec.LookPath(name); err == nil && path != "" {
			return path
		}
	}
	return ""
}

// isExecutableNotFound checks if the error indicates a shell executable is not available.
// Covers multiple languages and Windows versions.
func isExecutableNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "not found") ||
		strings.Contains(msg, "no such file") ||
		strings.Contains(msg, "cannot find") ||
		strings.Contains(msg, "executable file not found")
}
