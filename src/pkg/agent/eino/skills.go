package eino

import (
	"os"
	"path/filepath"
	"strings"

	agentSkills "github.com/openocta/openocta/pkg/agent/skills"
	"github.com/openocta/openocta/pkg/config"
)

// ResolveSkillsDir merges OpenOcta skill sources into a single directory path for Eino skill middleware.
// When multiple sources exist, prefers workspace skills directory.
func ResolveSkillsDir(projectRoot string, cfg *config.OpenOctaConfig, employeeID string, skillFilter *[]string, env func(string) string) string {
	if env == nil {
		env = os.Getenv
	}
	var entries []agentSkills.Entry
	if strings.TrimSpace(employeeID) != "" {
		entries = agentSkills.LoadEmployeeEntries(projectRoot, cfg, employeeID, env)
	}
	if len(entries) == 0 {
		entries, _ = agentSkills.LoadWorkspaceEntries(projectRoot, &agentSkills.LoadOptions{Config: cfg})
	}
	if skillFilter != nil {
		entries = filterSkillEntries(entries, *skillFilter)
	}
	if len(entries) == 0 {
		return ""
	}
	// Prefer first skill base dir when employee-exclusive skills live outside workspace/skills.
	if strings.TrimSpace(employeeID) != "" {
		for _, e := range entries {
			if e.BaseDir != "" {
				if abs, err := filepath.Abs(e.BaseDir); err == nil && isExistingDir(abs) {
					return abs
				}
			}
			if e.FilePath != "" {
				dir := filepath.Dir(e.FilePath)
				if abs, err := filepath.Abs(dir); err == nil && isExistingDir(abs) {
					// SKILL.md parent is the skill folder; middleware scans immediate subdirs of a root.
					parent := filepath.Dir(abs)
					if isExistingDir(parent) {
						return parent
					}
					return abs
				}
			}
		}
	}
	// Use workspace skills dir when present; Eino skill middleware scans immediate subdirs.
	ws := filepath.Join(projectRoot, "skills")
	if fi, err := os.Stat(ws); err == nil && fi.IsDir() {
		return ws
	}
	// Fallback: first skill base dir.
	if entries[0].BaseDir != "" {
		if abs, err := filepath.Abs(filepath.Dir(entries[0].FilePath)); err == nil {
			if strings.HasSuffix(strings.ToLower(filepath.Base(entries[0].FilePath)), "skill.md") {
				return filepath.Dir(abs)
			}
		}
	}
	return ws
}

func isExistingDir(path string) bool {
	path = strings.TrimSpace(path)
	if path == "" {
		return false
	}
	fi, err := os.Stat(path)
	return err == nil && fi.IsDir()
}

func filterSkillEntries(entries []agentSkills.Entry, allowed []string) []agentSkills.Entry {
	return agentSkills.FilterEntriesByNames(entries, allowed)
}
