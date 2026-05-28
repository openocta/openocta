// Package tools provides custom tools for the agent runtime.
package tools

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

// OsInfoTool retrieves the operating system version and platform information of the running machine.
type OsInfoTool struct{}

// Name returns the tool name.
func (OsInfoTool) Name() string {
	return "get_os_info"
}

// Description returns the tool description.
func (OsInfoTool) Description() string {
	return "Get the operating system name, version, architecture, and hostname of the machine where the agent is running. Works on Windows, macOS, and Linux."
}

// Schema returns the parameter schema.
func (OsInfoTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"includeDetails": map[string]interface{}{
				"type":        "boolean",
				"description": "If true, run platform-specific commands to get detailed version info (e.g. Windows ver, macOS sw_vers, Linux uname). Default: true",
			},
		},
		Required: []string{},
	}
}

// Execute runs the tool.
func (OsInfoTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	_ = ctx
	includeDetails := true
	if v, ok := params["includeDetails"].(bool); ok {
		includeDetails = v
	}

	var buf strings.Builder
	buf.WriteString("OS: " + runtime.GOOS + "\n")
	buf.WriteString("Architecture: " + runtime.GOARCH + "\n")

	if hostname, err := os.Hostname(); err == nil {
		buf.WriteString("Hostname: " + hostname + "\n")
	}

	if includeDetails {
		detail := getOsVersionDetail()
		if detail != "" {
			buf.WriteString("Version details:\n" + detail)
		}
	}

	return &tool.ToolResult{Success: true, Output: strings.TrimSpace(buf.String())}, nil
}

func getOsVersionDetail() string {
	var name string
	var args []string
	switch runtime.GOOS {
	case "windows":
		name = "cmd"
		args = []string{"/c", "ver"}
	case "darwin":
		name = "sw_vers"
		args = nil
	case "linux":
		name = "uname"
		args = []string{"-a"}
	default:
		return ""
	}

	var out bytes.Buffer
	cmd := exec.Command(name, args...)
	applyExecNoWindow(cmd)
	cmd.Stdout = &out
	cmd.Stderr = &out
	if err := cmd.Run(); err != nil {
		return ""
	}
	return strings.TrimSpace(out.String())
}
