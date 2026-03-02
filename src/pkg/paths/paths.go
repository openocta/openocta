package paths

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

const (
	newStateDirname      = ".openocta"
	newStateDirnameWin   = "openocta"
	configFilename       = "openocta.json"
	defaultGatewayPort   = 18900
	legacyStateDirname   = ".clawdbot"
	legacyConfigClawdbot = "clawdbot.json"
)

// ResolveStateDir returns the state directory for mutable data (sessions, logs, caches).
// Override via OPENOCTA_STATE_DIR or CLAWDBOT_STATE_DIR.
// Default: ~/.openocta on Linux/macOS, %APPDATA%\openocta on Windows.
func ResolveStateDir(env func(string) string) string {
	override := strings.TrimSpace(env("OPENOCTA_STATE_DIR"))
	if override == "" {
		override = strings.TrimSpace(env("CLAWDBOT_STATE_DIR"))
	}
	if override != "" {
		return expandUserPath(override, env)
	}
	if runtime.GOOS == "windows" {
		appData := strings.TrimSpace(env("APPDATA"))
		if appData == "" {
			appData = strings.TrimSpace(env("LOCALAPPDATA"))
		}
		if appData == "" {
			home := resolveHomeDir(env)
			appData = filepath.Join(home, "AppData", "Roaming")
		}
		newDir := filepath.Join(appData, newStateDirnameWin)
		legacyDir := filepath.Join(appData, legacyStateDirname)
		if pathExists(newDir) {
			return newDir
		}
		if pathExists(legacyDir) {
			return legacyDir
		}
		return newDir
	}
	home := resolveHomeDir(env)
	newDir := filepath.Join(home, newStateDirname)
	legacyDir := filepath.Join(home, legacyStateDirname)
	if pathExists(newDir) {
		return newDir
	}
	if pathExists(legacyDir) {
		return legacyDir
	}
	return newDir
}

// ResolveConfigPath returns the active config file path.
// Override via OPENOCTA_CONFIG_PATH or CLAWDBOT_CONFIG_PATH.
// Default: $STATE_DIR/openocta.json
func ResolveConfigPath(env func(string) string, stateDir string) string {
	override := strings.TrimSpace(env("OPENOCTA_CONFIG_PATH"))
	if override == "" {
		override = strings.TrimSpace(env("CLAWDBOT_CONFIG_PATH"))
	}
	if override != "" {
		return expandUserPath(override, env)
	}
	candidates := []string{
		filepath.Join(stateDir, configFilename),
		filepath.Join(stateDir, legacyConfigClawdbot),
	}
	for _, c := range candidates {
		if pathExists(c) {
			return c
		}
	}
	return filepath.Join(stateDir, configFilename)
}

// ResolveCanonicalConfigPath returns the canonical config path regardless of existence.
func ResolveCanonicalConfigPath(env func(string) string, stateDir string) string {
	override := strings.TrimSpace(env("OPENOCTA_CONFIG_PATH"))
	if override == "" {
		override = strings.TrimSpace(env("CLAWDBOT_CONFIG_PATH"))
	}
	if override != "" {
		return expandUserPath(override, env)
	}
	return filepath.Join(stateDir, configFilename)
}

// DefaultGatewayPort is the default gateway listen port.
func DefaultGatewayPort() int {
	return defaultGatewayPort
}

// ResolveGatewayPort returns the gateway port from config or env.
func ResolveGatewayPort(portFromConfig *int, env func(string) string) int {
	envRaw := strings.TrimSpace(env("OPENOCTA_GATEWAY_PORT"))
	if envRaw == "" {
		envRaw = strings.TrimSpace(env("CLAWDBOT_GATEWAY_PORT"))
	}
	if envRaw != "" {
		var n int
		if _, err := fmt.Sscanf(envRaw, "%d", &n); err == nil && n > 0 {
			return n
		}
	}
	if portFromConfig != nil && *portFromConfig > 0 {
		return *portFromConfig
	}
	return defaultGatewayPort
}

// ResolveOAuthDir returns the OAuth credentials directory.
func ResolveOAuthDir(env func(string) string, stateDir string) string {
	override := strings.TrimSpace(env("OPENOCTA_OAUTH_DIR"))
	if override != "" {
		return expandUserPath(override, env)
	}
	return filepath.Join(stateDir, "credentials")
}

func resolveHomeDir(env func(string) string) string {
	home := env("OPENOCTA_HOME")
	if home == "" {
		home = env("HOME")
	}
	if home == "" {
		home = env("USERPROFILE")
	}
	if home != "" {
		home = strings.TrimSpace(home)
		if strings.HasPrefix(home, "~") {
			base := env("HOME")
			if base == "" {
				base = env("USERPROFILE")
			}
			if base != "" {
				home = filepath.Join(base, strings.TrimPrefix(home, "~"))
			}
		}
		return filepath.Clean(home)
	}
	dir, err := os.UserHomeDir()
	if err == nil {
		return dir
	}
	return "."
}

func expandUserPath(input string, env func(string) string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return input
	}
	if strings.HasPrefix(input, "~") {
		home := resolveHomeDir(env)
		return filepath.Join(home, strings.TrimPrefix(strings.TrimPrefix(input, "~"), "/"))
	}
	abs, err := filepath.Abs(input)
	if err != nil {
		return input
	}
	return abs
}

func pathExists(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}
