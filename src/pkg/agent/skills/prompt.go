// Package skills provides skill prompt building for agents.
package skills

import (
	"strings"

	"github.com/openocta/openocta/pkg/config"
)

// BuildPrompt builds a skills prompt string from skill entries.
// This is a simplified version that formats skill names and descriptions.
func BuildPrompt(entries []Entry) string {
	if len(entries) == 0 {
		return ""
	}

	var parts []string
	for _, entry := range entries {
		if entry.Name == "" {
			continue
		}

		desc := strings.TrimSpace(entry.Name)
		if entry.Frontmatter != nil {
			if d := strings.TrimSpace(entry.Frontmatter["description"]); d != "" {
				desc = d
			}
		}
		if entry.Metadata != nil && entry.Metadata.SkillKey != "" && desc == entry.Name {
			desc = entry.Metadata.SkillKey
		}
		line := "- **" + entry.Name + "**"
		if desc != "" && desc != entry.Name {
			line += ": " + desc
		}
		if entry.Metadata != nil && entry.Metadata.PrimaryEnv != "" {
			line += " (env: " + entry.Metadata.PrimaryEnv + ")"
		}
		parts = append(parts, line)
	}

	if len(parts) == 0 {
		return ""
	}

	return strings.Join(parts, "\n")
}

// ResolvePromptForRun resolves the skills prompt for an agent run.
func ResolvePromptForRun(params struct {
	Entries      []Entry
	Config       *config.OpenOctaConfig
	WorkspaceDir string
}) string {
	if len(params.Entries) == 0 {
		return ""
	}

	prompt := BuildPrompt(params.Entries)
	return strings.TrimSpace(prompt)
}

// FilterForRun filters skill entries for agent run (excludes disabled, checks eligibility).
func FilterForRun(entries []Entry, cfg *config.OpenOctaConfig, eligibility *EligibilityContext) []Entry {
	return FilterEntries(entries, cfg, eligibility)
}
