// Package runtime provides skill integration for agent runtime.
package runtime

import (
	"context"
	"os"
	"regexp"
	"strings"

	"github.com/cexll/agentsdk-go/pkg/api"
	sdkSkills "github.com/cexll/agentsdk-go/pkg/runtime/skills"
	agentSkills "github.com/openocta/openocta/pkg/agent/skills"
	"github.com/openocta/openocta/pkg/config"
)

// BuildSkillRegistrationsFromThreeLocations loads skills from three locations and returns
// api.SkillRegistration slice for use with api.Options.Skills. Locations (lowest to highest precedence):
// 1. Built-in skills (shipped with install: OPENCLAW_BUNDLED_SKILLS_DIR or executable-relative)
// 2. Managed/local skills (~/.openclaw/skills)
// 3. Workspace skills (<workspace>/skills, i.e. workspaceDir/skills)
func BuildSkillRegistrationsFromThreeLocations(workspaceDir string, cfg *config.OpenOctaConfig) []api.SkillRegistration {
	opts := &agentSkills.LoadOptions{
		Config:           cfg,
		ManagedSkillsDir: "",
		BundledSkillsDir: "",
	}
	entries, err := agentSkills.LoadWorkspaceEntries(workspaceDir, opts)
	if err != nil || len(entries) == 0 {
		return nil
	}
	return entriesToSkillRegistrations(entries)
}

// entriesToSkillRegistrations converts OPENOCTA skill entries to agentsdk-go SkillRegistration.
// It parses name/description from SKILL.md frontmatter (OpenOcta/AgentSkills format), fills
// Definition.Metadata, builds Matchers (e.g. KeywordMatcher from name/description), and
// a Handler that reads the skill markdown and returns its content as Result.Output.
func entriesToSkillRegistrations(entries []agentSkills.Entry) []api.SkillRegistration {
	var regs []api.SkillRegistration
	seen := make(map[string]struct{})
	for _, e := range entries {
		name := sanitizeSkillName(e.Name)
		if name == "" {
			continue
		}
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		filePath := e.FilePath
		desc := skillDescription(e)
		meta := entryToDefinitionMetadata(e)
		matchers := buildMatchers(e)
		disableAuto := false
		if e.Frontmatter != nil {
			if v, ok := e.Frontmatter["disable-model-invocation"]; ok && (v == "true" || v == "1") {
				disableAuto = true
			}
		}
		regs = append(regs, api.SkillRegistration{
			Definition: sdkSkills.Definition{
				Name:                  name,
				Description:           desc,
				Metadata:              meta,
				Matchers:              matchers,
				DisableAutoActivation: disableAuto,
			},
			Handler: sdkSkills.HandlerFunc(func(ctx context.Context, _ sdkSkills.ActivationContext) (sdkSkills.Result, error) {
				data, err := os.ReadFile(filePath)
				if err != nil {
					return sdkSkills.Result{}, err
				}
				return sdkSkills.Result{Output: string(data)}, nil
			}),
		})
	}
	return regs
}

// skillDescription returns the skill description from frontmatter, then SkillKey, then name.
func skillDescription(e agentSkills.Entry) string {
	if e.Frontmatter != nil {
		if d := strings.TrimSpace(e.Frontmatter["description"]); d != "" {
			return d
		}
	}
	if e.Metadata != nil && e.Metadata.SkillKey != "" {
		return e.Metadata.SkillKey
	}
	return e.Name
}

// entryToDefinitionMetadata builds a map for Definition.Metadata from Entry (OpenOcta metadata + frontmatter).
func entryToDefinitionMetadata(e agentSkills.Entry) map[string]string {
	m := make(map[string]string)
	if e.Source != "" {
		m["source"] = e.Source
	}
	if e.BaseDir != "" {
		m["baseDir"] = e.BaseDir
	}
	if e.Metadata != nil {
		if e.Metadata.SkillKey != "" {
			m["skillKey"] = e.Metadata.SkillKey
		}
		if e.Metadata.PrimaryEnv != "" {
			m["primaryEnv"] = e.Metadata.PrimaryEnv
		}
		if e.Metadata.Emoji != "" {
			m["emoji"] = e.Metadata.Emoji
		}
		if e.Metadata.Homepage != "" {
			m["homepage"] = e.Metadata.Homepage
		}
	}
	if e.Frontmatter != nil {
		if v, ok := e.Frontmatter["homepage"]; ok && v != "" {
			m["homepage"] = v
		}
	}
	return m
}

// buildMatchers builds default matchers for auto-activation: KeywordMatcher from name and description.
// Name is split by hyphens/spaces; description is tokenized into words (len>2); all lowercased and deduped.
func buildMatchers(e agentSkills.Entry) []sdkSkills.Matcher {
	desc := skillDescription(e)
	keywords := keywordsFromNameAndDescription(e.Name, desc)
	if len(keywords) == 0 {
		return nil
	}
	return []sdkSkills.Matcher{
		sdkSkills.KeywordMatcher{Any: keywords},
	}
}

// keywordsFromNameAndDescription extracts lowercase tokens for matching: name parts + description words.
func keywordsFromNameAndDescription(name, description string) []string {
	seen := make(map[string]struct{})
	var out []string
	// Name: whole and parts (e.g. "nano-banana-pro" -> "nano-banana-pro", "nano", "banana", "pro")
	nameNorm := strings.ToLower(strings.TrimSpace(name))
	if nameNorm != "" {
		seen[nameNorm] = struct{}{}
		out = append(out, nameNorm)
		for _, part := range strings.FieldsFunc(name, func(r rune) bool { return r == '-' || r == ' ' || r == '_' }) {
			p := strings.ToLower(strings.TrimSpace(part))
			if len(p) >= 2 && p != "" {
				if _, ok := seen[p]; !ok {
					seen[p] = struct{}{}
					out = append(out, p)
				}
			}
		}
	}
	// Description: first ~120 chars, words of len > 2, cap at 10 extra
	const maxDescChars = 120
	const maxDescWords = 10
	descTrim := description
	if len(descTrim) > maxDescChars {
		descTrim = descTrim[:maxDescChars]
	}
	descWords := 0
	for _, w := range strings.Fields(descTrim) {
		if descWords >= maxDescWords {
			break
		}
		w = strings.ToLower(strings.Trim(w, ".,;:!?—-"))
		if len(w) <= 2 {
			continue
		}
		if _, ok := seen[w]; ok {
			continue
		}
		seen[w] = struct{}{}
		out = append(out, w)
		descWords++
	}
	return out
}

// sanitizeSkillName normalizes a skill name to agentsdk-go rules: 1-64 chars, lowercase alphanumeric + hyphens.
var skillNameSanitizeRe = regexp.MustCompile(`[^a-z0-9-]+`)

func sanitizeSkillName(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	if s == "" {
		return ""
	}
	s = skillNameSanitizeRe.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 64 {
		s = strings.TrimRight(s[:64], "-")
	}
	if s == "" {
		return ""
	}
	return s
}

// LoadSkillsForWorkspace loads skills for a workspace directory.
func LoadSkillsForWorkspace(workspaceDir string, cfg *config.OpenOctaConfig) ([]agentSkills.Entry, error) {
	opts := &agentSkills.LoadOptions{
		Config:           cfg,
		ManagedSkillsDir: "",
		BundledSkillsDir: "",
	}

	return agentSkills.LoadWorkspaceEntries(workspaceDir, opts)
}

// BuildSkillsPrompt builds a skills prompt string for agent runs.
func BuildSkillsPrompt(entries []agentSkills.Entry, cfg *config.OpenOctaConfig) string {
	// Filter entries based on eligibility
	eligibility := &agentSkills.EligibilityContext{}
	filtered := agentSkills.FilterEntries(entries, cfg, eligibility)

	// Build prompt
	return agentSkills.BuildPrompt(filtered)
}

// ApplySkillEnvOverrides applies skill environment variable overrides.
// Returns a restore function to revert changes.
func ApplySkillEnvOverrides(entries []agentSkills.Entry, cfg *config.OpenOctaConfig) func() {
	return agentSkills.ApplyEnvOverrides(entries, cfg)
}
