// Package agent provides workspace resolution for agents.
package agent

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/paths"
)

// ResolveAgentWorkspaceDir returns the workspace directory for an agent.
// Priority: agents.list[].workspace for the agent > agents.defaults.workspace (if default agent) >
// ~/.openocta/workspace or ~/.openocta/workspace-{profile} (default agent) > ~/.openocta/agents/<id>/workspace.
// env is used for OPENOCTA_PROFILE, OPENOCTA_STATE_DIR, HOME (e.g. os.Getenv).
func ResolveAgentWorkspaceDir(cfg *config.OpenOctaConfig, agentID string, env func(string) string) string {
	id := strings.TrimSpace(strings.ToLower(agentID))
	if id == "" {
		id = "main"
	}

	// 1. Agent-specific workspace from config
	ac := resolveAgentConfig(cfg, id)
	if ac != nil && strings.TrimSpace(ac.Workspace) != "" {
		return expandUserPath(strings.TrimSpace(ac.Workspace), env)
	}

	// 2. Default agent: use agents.defaults.workspace or state dir workspace
	defaultID := resolveDefaultAgentID(cfg)
	if id == defaultID {
		if cfg != nil && cfg.Agents != nil && cfg.Agents.Defaults != nil {
			if w := strings.TrimSpace(cfg.Agents.Defaults.Workspace); w != "" {
				return expandUserPath(w, env)
			}
		}
		// OPENOCTA_PROFILE → workspace-{profile}, else workspace
		profile := strings.TrimSpace(env("OPENOCTA_PROFILE"))
		if profile != "" && strings.ToLower(profile) != "default" {
			return filepath.Join(paths.ResolveStateDir(env), "workspace-"+profile)
		}
		return filepath.Join(paths.ResolveStateDir(env), "workspace")
	}

	// 3. Non-default agent: stateDir/agents/<id>/workspace
	return filepath.Join(paths.ResolveStateDir(env), "agents", id, "workspace")
}

// resolveDefaultAgentID returns the default agent ID (first with default=true, or first in list).
func resolveDefaultAgentID(cfg *config.OpenOctaConfig) string {
	if cfg == nil || cfg.Agents == nil || len(cfg.Agents.List) == 0 {
		return "main"
	}
	for i := range cfg.Agents.List {
		if cfg.Agents.List[i].Default != nil && *cfg.Agents.List[i].Default {
			return strings.TrimSpace(strings.ToLower(cfg.Agents.List[i].ID))
		}
	}
	return strings.TrimSpace(strings.ToLower(cfg.Agents.List[0].ID))
}

// expandUserPath expands ~ to home directory and returns an absolute path.
func expandUserPath(input string, env func(string) string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return input
	}
	if strings.HasPrefix(input, "~") {
		home := env("HOME")
		if home == "" {
			home = env("USERPROFILE")
		}
		if home == "" {
			home, _ = os.UserHomeDir()
		}
		if home != "" {
			input = filepath.Join(home, strings.TrimPrefix(strings.TrimPrefix(input, "~"), string(filepath.Separator)))
		}
	}
	abs, err := filepath.Abs(input)
	if err == nil {
		return abs
	}
	return input
}
