// Package tools provides custom tools for the agent runtime.
package tools

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

// WindowsCmdTool executes shell commands on Windows via Git Bash/bash (preferred) or native shells (fallback).
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
	return "Execute a command on Windows. Prefer Linux/POSIX-style commands: this tool runs through Git Bash/bash first, then falls back to cmd only if bash is unavailable. Avoid PowerShell/cmd syntax unless native Windows shell behavior is explicitly required. Runs silently with no console window."
}

// Schema returns the parameter schema.
func (WindowsCmdTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"command": map[string]interface{}{
				"type":        "string",
				"description": "Command to execute silently. Prefer Git Bash/Linux-style syntax (ls, grep, sed, cat, mkdir -p, etc.); avoid PowerShell/cmd syntax unless required.",
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

	// Fallback: if bash was selected but cannot start, degrade to cmd.
	// Do not fall back on command exit failures; that would mask shell-incompatible commands.
	if err != nil && shellName == "bash" && isExecutableNotFound(err) {
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
	if bash := findWindowsBash(); bash != "" {
		return bash, []string{"-lc", command}, "bash"
	}
	return "cmd", []string{"/c", command}, "cmd"
}

func findWindowsBash() string {
	for _, p := range commonGitBashPaths() {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	if git, err := exec.LookPath("git.exe"); err == nil && git != "" {
		for _, p := range gitBashPathsFromGit(git) {
			if st, err := os.Stat(p); err == nil && !st.IsDir() {
				return p
			}
		}
	}
	if git, err := exec.LookPath("git"); err == nil && git != "" {
		for _, p := range gitBashPathsFromGit(git) {
			if st, err := os.Stat(p); err == nil && !st.IsDir() {
				return p
			}
		}
	}
	for _, name := range []string{"bash.exe", "bash"} {
		if path, err := exec.LookPath(name); err == nil && path != "" && !isWindowsSystemBash(path) {
			return path
		}
	}
	return ""
}

func commonGitBashPaths() []string {
	var paths []string
	for _, root := range []string{
		os.Getenv("ProgramFiles"),
		os.Getenv("ProgramFiles(x86)"),
		os.Getenv("LocalAppData"),
	} {
		root = strings.TrimSpace(root)
		if root == "" {
			continue
		}
		paths = append(paths, filepath.Join(root, "Git", "bin", "bash.exe"))
		paths = append(paths, filepath.Join(root, "Git", "usr", "bin", "bash.exe"))
	}
	return paths
}

func gitBashPathsFromGit(gitPath string) []string {
	gitPath = strings.TrimSpace(gitPath)
	if gitPath == "" {
		return nil
	}
	dir := filepath.Dir(gitPath)
	root := filepath.Dir(dir)
	return []string{
		filepath.Join(root, "bin", "bash.exe"),
		filepath.Join(root, "usr", "bin", "bash.exe"),
	}
}

func isWindowsSystemBash(path string) bool {
	p := strings.ToLower(filepath.Clean(strings.TrimSpace(path)))
	win := strings.ToLower(filepath.Clean(os.Getenv("WINDIR")))
	if win == "" {
		win = strings.ToLower(filepath.Clean(`C:\Windows`))
	}
	return p == filepath.Join(win, "system32", "bash.exe")
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
