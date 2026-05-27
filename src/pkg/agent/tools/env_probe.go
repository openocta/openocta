// Package tools provides custom tools for the agent runtime.
package tools

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"

	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

// EnvProbeTool reports whether common CLI programs exist and captures a short version string.
// Use this before choosing among multiple implementation options (e.g. JMeter vs curl vs a Python script).
type EnvProbeTool struct{}

// Name returns the tool name.
func (EnvProbeTool) Name() string {
	return "probe_environment"
}

// Description returns the tool description.
func (EnvProbeTool) Description() string {
	return "Check which CLI programs are available on this machine and their versions (lightweight probes via LookPath and --version / -V / -v). " +
		"Call this early when several tools could solve the same task (e.g. load test: jmeter vs wrk vs ab vs Python requests) to pick the smallest dependency before executing."
}

// Schema returns the parameter schema.
func (EnvProbeTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"names": map[string]interface{}{
				"type": "array",
				"items": map[string]interface{}{
					"type": "string",
				},
				"description": "CLI names to probe (e.g. [\"curl\",\"python3\",\"jmeter\"]). If omitted or empty, a built-in list of common utilities is used.",
			},
			"includePreset": map[string]interface{}{
				"type":        "string",
				"description": "Optional: \"minimal\" (curl, wget, git, python3, bash/sh), \"dev\" (+ node, npm, go, docker), \"load\" (+ jmeter, java, wrk, ab, hey). Ignored if \"names\" is non-empty.",
				"enum":        []string{"minimal", "dev", "load"},
			},
		},
		Required: []string{},
	}
}

var probeNameRe = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$`)

const maxProbeTargets = 24

// Execute runs the tool.
func (EnvProbeTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	names := normalizeProbeNames(params["names"])
	if len(names) == 0 {
		preset, _ := params["includePreset"].(string)
		names = presetProbeNames(strings.ToLower(strings.TrimSpace(preset)))
	}
	if len(names) == 0 {
		names = presetProbeNames("minimal")
	}
	if len(names) > maxProbeTargets {
		names = names[:maxProbeTargets]
	}

	var buf strings.Builder
	buf.WriteString(fmt.Sprintf("Platform: %s/%s\n\n", runtime.GOOS, runtime.GOARCH))
	for _, name := range names {
		line := probeOne(ctx, name)
		buf.WriteString(line)
		buf.WriteByte('\n')
	}
	return &tool.ToolResult{Success: true, Output: strings.TrimSpace(buf.String())}, nil
}

func normalizeProbeNames(raw interface{}) []string {
	arr, ok := raw.([]interface{})
	if !ok || len(arr) == 0 {
		return nil
	}
	seen := make(map[string]bool)
	var out []string
	for _, v := range arr {
		s, _ := v.(string)
		s = strings.TrimSpace(s)
		if s == "" || !probeNameRe.MatchString(s) {
			continue
		}
		base := filepath.Base(s)
		if base != s || strings.Contains(s, string(filepath.Separator)) {
			continue
		}
		key := strings.ToLower(s)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, s)
	}
	return out
}

func presetProbeNames(preset string) []string {
	minimal := []string{"curl", "wget", "git", "python3", "python", "bash"}
	if runtime.GOOS == "windows" {
		minimal = []string{"bash", "git", "curl", "python", "py"}
	}
	switch preset {
	case "dev":
		if runtime.GOOS == "windows" {
			return []string{"bash", "git", "curl", "python", "py", "node", "npm", "go", "docker"}
		}
		return []string{"curl", "wget", "git", "python3", "python", "node", "npm", "go", "docker"}
	case "load":
		if runtime.GOOS == "windows" {
			return []string{"bash", "curl", "python", "py", "java", "jmeter", "docker"}
		}
		return []string{"curl", "wget", "python3", "python", "java", "jmeter", "wrk", "ab", "hey"}
	default:
		return minimal
	}
}

func probeOne(parentCtx context.Context, name string) string {
	path, err := exec.LookPath(name)
	if err != nil || path == "" {
		return fmt.Sprintf("- %s: not found in PATH", name)
	}

	ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)
	defer cancel()

	version := tryVersionLines(ctx, path, name)
	version = strings.TrimSpace(version)
	if version == "" {
		return fmt.Sprintf("- %s: present at %s (version probe produced no output)", name, path)
	}
	// Keep output short for the model
	if len(version) > 500 {
		version = version[:500] + "…"
	}
	return fmt.Sprintf("- %s: %s\n  %s", name, path, version)
}

func tryVersionLines(ctx context.Context, resolvedPath, displayName string) string {
	// Prefer --version, then -V, then -v; JMeter and some JVM tools use -v.
	flags := []string{"--version", "-version", "-V", "-v"}
	for _, flag := range flags {
		out := runCmd(ctx, resolvedPath, []string{flag})
		if out != "" {
			return firstLineOrTwo(out)
		}
	}
	// java -version writes to stderr
	if strings.EqualFold(filepath.Base(resolvedPath), "java") ||
		strings.EqualFold(displayName, "java") {
		out := runCmdCombined(ctx, resolvedPath, []string{"-version"})
		if out != "" {
			return firstLineOrTwo(out)
		}
	}
	return ""
}

func runCmd(ctx context.Context, path string, args []string) string {
	cmd := exec.CommandContext(ctx, path, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	_ = cmd.Run()
	s := strings.TrimSpace(stdout.String())
	if s != "" {
		return s
	}
	return strings.TrimSpace(stderr.String())
}

func runCmdCombined(ctx context.Context, path string, args []string) string {
	cmd := exec.CommandContext(ctx, path, args...)
	var buf bytes.Buffer
	cmd.Stdout = &buf
	cmd.Stderr = &buf
	_ = cmd.Run()
	return strings.TrimSpace(buf.String())
}

func firstLineOrTwo(s string) string {
	lines := strings.Split(strings.ReplaceAll(s, "\r\n", "\n"), "\n")
	var b strings.Builder
	n := 0
	for _, ln := range lines {
		ln = strings.TrimSpace(ln)
		if ln == "" {
			continue
		}
		if b.Len() > 0 {
			b.WriteString(" | ")
		}
		b.WriteString(ln)
		n++
		if n >= 2 {
			break
		}
	}
	return b.String()
}
