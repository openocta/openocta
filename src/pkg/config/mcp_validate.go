package config

import (
	"fmt"
	"strings"
)

// AllowedMCPCommands is the set of commands permitted for MCP server stdio execution.
// Only MCP package launchers are included — NOT general-purpose runtimes like python/node
// because they accept -c/-e flags for arbitrary code execution when args are user-controlled.
// Similarly, docker is excluded because -v/--privileged can escape container isolation.
//
// For Docker-based MCP servers, use the built-in Service mode (Service+ServiceURL fields)
// which resolves commands from hardcoded safe mappings in resolveServiceServer().
var AllowedMCPCommands = map[string]bool{
	"npx": true, // Node.js MCP package runner
	"uvx": true, // Python MCP package runner (uv)
	"uv":  true, // Python package manager / runner
}

// BlockedMCPCommands are shell interpreters and other dangerous commands
// that are explicitly blocked even if they somehow pass other checks.
var BlockedMCPCommands = map[string]bool{
	"bash": true, "sh": true, "zsh": true, "dash": true, "fish": true,
	"cmd": true, "cmd.exe": true, "powershell": true, "powershell.exe": true,
	"pwsh": true, "csh": true, "tcsh": true, "ksh": true,
}

// ValidateMcpCommand checks that an MCP server command is safe for execution.
// It rejects:
//   - Shell interpreters (bash, sh, cmd, powershell, etc.)
//   - Commands containing path separators (/ or \) to prevent absolute/relative path execution
//   - Commands not in the allowed list (npx, uvx, uv)
//
// An empty command passes validation (used for URL-based or service-based MCP servers).
func ValidateMcpCommand(command string) error {
	cmd := strings.TrimSpace(command)
	if cmd == "" {
		// Empty command is valid — the server uses URL or Service+ServiceURL mode
		return nil
	}

	// Block commands with path separators (absolute or relative paths).
	// This prevents attacks like:
	//   /bin/bash, C:\Windows\System32\cmd.exe, ./malicious, ..\..\evil
	if strings.ContainsAny(cmd, "/\\") {
		return fmt.Errorf("mcp command %q must not contain path separators; use a command name without path", cmd)
	}

	// Normalize: strip .exe/.cmd suffix on Windows for comparison
	baseName := strings.ToLower(cmd)
	baseName = strings.TrimSuffix(baseName, ".exe")
	baseName = strings.TrimSuffix(baseName, ".cmd")

	// Block shell interpreters (both Unix and Windows)
	if BlockedMCPCommands[baseName] {
		return fmt.Errorf("mcp command %q is a shell interpreter; shell interpreters are not allowed as MCP server commands", cmd)
	}

	// Allowlist check — the command must be in the allowed set
	if !AllowedMCPCommands[cmd] && !AllowedMCPCommands[baseName] {
		return fmt.Errorf("mcp command %q is not in the allowed list (allowed: npx, uvx, uv)", cmd)
	}

	return nil
}

// ValidateMcpServers validates the command field of every enabled MCP server entry.
// Disabled servers are skipped (they won't be executed).
func ValidateMcpServers(servers map[string]McpServerEntry) error {
	for key, entry := range servers {
		if !entry.Enabled {
			continue
		}
		if err := ValidateMcpCommand(entry.Command); err != nil {
			return fmt.Errorf("mcp server %q: %w", key, err)
		}
	}
	return nil
}
