// Package daemon provides launchd/systemd service management for the Gateway.
package daemon

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

const (
	// GatewayLaunchAgentLabel is the default launchd label for the Gateway.
	GatewayLaunchAgentLabel = "ai.openocta.gateway"
)

// ResolvePlistPath returns the LaunchAgent plist path for the given label.
func ResolvePlistPath(label string) string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "Library", "LaunchAgents", label+".plist")
}

// IsLoaded returns true if the launchd service is loaded.
func IsLoaded(label string) (bool, error) {
	if runtime.GOOS != "darwin" {
		return false, fmt.Errorf("launchd only on macOS")
	}
	out, err := exec.Command("launchctl", "list", label).CombinedOutput()
	if err != nil {
		// Exit 1 when not found
		if strings.Contains(string(out), "Could not find") {
			return false, nil
		}
		return false, err
	}
	return strings.TrimSpace(string(out)) != "", nil
}

// Bootout unloads the launchd service.
func Bootout(label string) error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("launchd only on macOS")
	}
	uid := os.Getuid()
	scope := fmt.Sprintf("gui/%d", uid)
	return exec.Command("launchctl", "bootout", scope, ResolvePlistPath(label)).Run()
}

// Kickstart restarts the launchd service (with -k to kill first).
func Kickstart(label string) error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("launchd only on macOS")
	}
	uid := os.Getuid()
	scope := fmt.Sprintf("gui/%d", uid)
	return exec.Command("launchctl", "kickstart", "-k", scope+"/"+label).Run()
}

// Bootstrap loads the plist into launchd.
func Bootstrap(label string) error {
	if runtime.GOOS != "darwin" {
		return fmt.Errorf("launchd only on macOS")
	}
	uid := os.Getuid()
	scope := fmt.Sprintf("gui/%d", uid)
	return exec.Command("launchctl", "bootstrap", scope, ResolvePlistPath(label)).Run()
}
