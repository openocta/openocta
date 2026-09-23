package test

import (
	"strings"
	"testing"

	"github.com/openocta/openocta/pkg/config"
)

func TestValidateMcpCommand_AllowedCommands(t *testing.T) {
	allowed := []string{"npx", "uvx", "uv"}
	for _, cmd := range allowed {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err != nil {
				t.Errorf("ValidateMcpCommand(%q) should pass but got: %v", cmd, err)
			}
		})
	}
}

func TestValidateMcpCommand_EmptyCommand(t *testing.T) {
	tests := []string{"", "  ", "\t"}
	for _, cmd := range tests {
		t.Run("empty_"+cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err != nil {
				t.Errorf("ValidateMcpCommand(%q) should pass for empty command but got: %v", cmd, err)
			}
		})
	}
}

func TestValidateMcpCommand_BlockedShells(t *testing.T) {
	blocked := []string{
		"bash", "sh", "zsh", "dash", "fish",
		"cmd", "cmd.exe", "powershell", "powershell.exe",
		"pwsh", "csh", "tcsh", "ksh",
	}
	for _, cmd := range blocked {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err == nil {
				t.Errorf("ValidateMcpCommand(%q) should fail (blocked shell) but passed", cmd)
			}
		})
	}
}

func TestValidateMcpCommand_BlockedPaths(t *testing.T) {
	blocked := []string{
		"/bin/bash",
		"/usr/bin/sh",
		"/bin/zsh",
		"C:\\Windows\\System32\\cmd.exe",
		"./malicious",
		"../evil",
		"../../bad",
		"\\evil\\path",
	}
	for _, cmd := range blocked {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err == nil {
				t.Errorf("ValidateMcpCommand(%q) should fail (contains path separator) but passed", cmd)
			} else if !strings.Contains(err.Error(), "path separator") {
				t.Errorf("ValidateMcpCommand(%q) should mention 'path separator' but got: %v", cmd, err)
			}
		})
	}
}

func TestValidateMcpCommand_BlockedUnknown(t *testing.T) {
	// Arbitrary commands that are not in the allowlist - should all be rejected.
	// docker/python/node are also blocked despite being "legitimate" tools,
	// because with user-controlled args they enable arbitrary code execution
	// (docker -v mount escape, python -c, node -e).
	blocked := []string{"touch", "curl", "wget", "nc", "netcat", "ssh", "telnet", "perl", "ruby", "php", "docker", "python", "python3", "node"}
	for _, cmd := range blocked {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err == nil {
				t.Errorf("ValidateMcpCommand(%q) should fail (not in allowlist) but passed", cmd)
			}
		})
	}
}

func TestValidateMcpCommand_ExeSuffixNormalization(t *testing.T) {
	// On Windows, commands may be specified with .exe and should normalize to the allowlist.
	tests := []string{"npx.exe", "uvx.exe", "uv.exe"}
	for _, cmd := range tests {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err != nil {
				t.Errorf("ValidateMcpCommand(%q) should pass (normalized to allowed command) but got: %v", cmd, err)
			}
		})
	}
}

func TestValidateMcpCommand_CmdSuffixNormalization(t *testing.T) {
	tests := []string{"npx.cmd", "uvx.cmd"}
	for _, cmd := range tests {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err != nil {
				t.Errorf("ValidateMcpCommand(%q) should pass (normalized to allowed command) but got: %v", cmd, err)
			}
		})
	}
}

func TestValidateMcpCommand_BlockedShellWithExeSuffix(t *testing.T) {
	// Shell interpreters with .exe suffix should still be blocked.
	tests := []string{"bash.exe", "sh.exe", "powershell.exe"}
	for _, cmd := range tests {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err == nil {
				t.Errorf("ValidateMcpCommand(%q) should fail (blocked shell with .exe) but passed", cmd)
			}
		})
	}
}

func TestValidateMcpCommand_TrailingWhitespace(t *testing.T) {
	// Commands with whitespace should be trimmed and still work.
	if err := config.ValidateMcpCommand("  npx  "); err != nil {
		t.Errorf("ValidateMcpCommand('  npx  ') should pass after trimming but got: %v", err)
	}
	if err := config.ValidateMcpCommand("  bash  "); err == nil {
		t.Errorf("ValidateMcpCommand('  bash  ') should fail (blocked shell) but passed")
	}
}

func TestValidateMcpServers_AllValid(t *testing.T) {
	servers := map[string]config.McpServerEntry{
		"npx-server":      {Enabled: true, Command: "npx"},
		"uvx-server":      {Enabled: true, Command: "uvx"},
		"url-server":      {Enabled: true, Command: "", URL: "http://localhost:8080"},
		"disabled-server": {Enabled: false, Command: "touch"}, // disabled, should be skipped
	}
	if err := config.ValidateMcpServers(servers); err != nil {
		t.Errorf("ValidateMcpServers should pass for valid config but got: %v", err)
	}
}

func TestValidateMcpServers_InvalidCommand(t *testing.T) {
	servers := map[string]config.McpServerEntry{
		"bad-server": {Enabled: true, Command: "touch"},
	}
	if err := config.ValidateMcpServers(servers); err == nil {
		t.Errorf("ValidateMcpServers should fail for invalid command but passed")
	} else if !strings.Contains(err.Error(), "bad-server") {
		t.Errorf("ValidateMcpServers error should mention server key 'bad-server' but got: %v", err)
	}
}

func TestValidateMcpServers_EmptyServers(t *testing.T) {
	if err := config.ValidateMcpServers(nil); err != nil {
		t.Errorf("ValidateMcpServers(nil) should pass but got: %v", err)
	}
	if err := config.ValidateMcpServers(map[string]config.McpServerEntry{}); err != nil {
		t.Errorf("ValidateMcpServers({}) should pass but got: %v", err)
	}
}

func TestValidateMcpServers_AllDisabled(t *testing.T) {
	servers := map[string]config.McpServerEntry{
		"bad-1": {Enabled: false, Command: "touch"},
		"bad-2": {Enabled: false, Command: "/bin/bash"},
	}
	if err := config.ValidateMcpServers(servers); err != nil {
		t.Errorf("ValidateMcpServers should skip disabled servers but got: %v", err)
	}
}

func TestValidateMcpCommand_CaseInsensitiveShell(t *testing.T) {
	// Shell interpreter names should be blocked regardless of case.
	tests := []string{"BASH", "Bash", "CMD", "PowerShell", "POWERSHELL.EXE"}
	for _, cmd := range tests {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err == nil {
				t.Errorf("ValidateMcpCommand(%q) should fail (case-insensitive shell block) but passed", cmd)
			}
		})
	}
}

func TestValidateMcpCommand_CaseSensitiveAllowlist(t *testing.T) {
	// Allowlist is case-sensitive: exact match required.
	tests := []string{"NPX", "Uvx", "UV"}
	for _, cmd := range tests {
		t.Run(cmd, func(t *testing.T) {
			if err := config.ValidateMcpCommand(cmd); err == nil {
				t.Errorf("ValidateMcpCommand(%q) should fail (case-sensitive allowlist) but passed", cmd)
			}
		})
	}
}
