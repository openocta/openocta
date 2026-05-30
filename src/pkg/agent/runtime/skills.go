// Package runtime provides skill integration for agent runtime.
package runtime

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	agentSkills "github.com/openocta/openocta/pkg/agent/skills"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/employees"
	"github.com/openocta/openocta/pkg/paths"
	"github.com/stellarlinkco/agentsdk-go/pkg/api"
	sdkSkills "github.com/stellarlinkco/agentsdk-go/pkg/runtime/skills"
)

// LoadSkillRegistrationsWithBaseDirs loads skills the same way as BuildSkillRegistrationsFromThreeLocations and
// returns absolute base directories (folders containing SKILL.md) for sandbox allowlists and path resolution.
func LoadSkillRegistrationsWithBaseDirs(workspaceDir string, cfg *config.OpenOctaConfig) ([]api.SkillRegistration, []string) {
	entries, err := LoadWorkspaceSkillEntries(workspaceDir, cfg)
	if err != nil || len(entries) == 0 {
		return nil, nil
	}
	return entriesToSkillRegistrations(entries), uniqueAbsSkillBaseDirs(entries)
}

// LoadWorkspaceSkillEntries loads global/workspace skills (bundled, managed, workspace).
func LoadWorkspaceSkillEntries(workspaceDir string, cfg *config.OpenOctaConfig) ([]agentSkills.Entry, error) {
	opts := &agentSkills.LoadOptions{
		Config:           cfg,
		ManagedSkillsDir: "",
		BundledSkillsDir: "",
	}
	return agentSkills.LoadWorkspaceEntries(workspaceDir, opts)
}

// LoadEmployeeSkillEntries loads skills for a digital employee session:
// workspace skills (optionally filtered by manifest.skillIds), legacy employee dir skills,
// and ~/.openocta/employee_skills/<employeeID> uploads. Employee-managed entries override same name.
func LoadEmployeeSkillEntries(workspaceDir string, cfg *config.OpenOctaConfig, employeeID string, env func(string) string) []agentSkills.Entry {
	employeeID = strings.TrimSpace(employeeID)
	if employeeID == "" {
		return nil
	}
	if env == nil {
		env = os.Getenv
	}

	baseEntries, _ := LoadWorkspaceSkillEntries(workspaceDir, cfg)
	merged := make(map[string]agentSkills.Entry)
	for _, e := range baseEntries {
		if e.Name != "" {
			merged[e.Name] = e
		}
	}

	m, _ := employees.LoadManifest(employeeID, env)

	employeesRoot := employees.ResolveEmployeesDir(env)
	legacySkillsDir := filepath.Join(employeesRoot, employeeID, "skills")
	if entries, err := agentSkills.LoadEntriesFromDir(legacySkillsDir, "employee-managed"); err == nil {
		for _, e := range entries {
			if e.Name != "" {
				merged[e.Name] = e
			}
		}
	}

	stateDir := paths.ResolveStateDir(env)
	employeeSkillsDir := filepath.Join(stateDir, "employee_skills", employeeID)
	if entries, err := agentSkills.LoadEntriesFromDir(employeeSkillsDir, "employee-managed"); err == nil {
		for _, e := range entries {
			if e.Name != "" {
				merged[e.Name] = e
			}
		}
	}

	if m != nil && len(m.SkillIDs) > 0 {
		allowed := make(map[string]struct{}, len(m.SkillIDs))
		for _, id := range m.SkillIDs {
			if id = strings.TrimSpace(id); id != "" {
				allowed[id] = struct{}{}
			}
		}
		if len(allowed) > 0 {
			for name, e := range merged {
				if _, ok := allowed[name]; !ok && e.Source != "employee-managed" {
					delete(merged, name)
				}
			}
		}
	}

	if len(merged) == 0 {
		return nil
	}
	out := make([]agentSkills.Entry, 0, len(merged))
	for _, e := range merged {
		out = append(out, e)
	}
	return out
}

// LoadSkillRegistrationsForEmployee converts employee skill entries to SDK registrations and base dirs.
func LoadSkillRegistrationsForEmployee(workspaceDir string, cfg *config.OpenOctaConfig, employeeID string, env func(string) string) ([]api.SkillRegistration, []string) {
	entries := LoadEmployeeSkillEntries(workspaceDir, cfg, employeeID, env)
	if len(entries) == 0 {
		return nil, nil
	}
	return entriesToSkillRegistrations(entries), uniqueAbsSkillBaseDirs(entries)
}

// mergeSkillRegistrations merges b into a; registrations in b override same sanitized name in a.
func mergeSkillRegistrations(a, b []api.SkillRegistration) []api.SkillRegistration {
	if len(b) == 0 {
		return a
	}
	byName := make(map[string]api.SkillRegistration, len(a)+len(b))
	order := make([]string, 0, len(a)+len(b))
	add := func(r api.SkillRegistration) {
		name := strings.TrimSpace(r.Definition.Name)
		if name == "" {
			return
		}
		if _, ok := byName[name]; !ok {
			order = append(order, name)
		}
		byName[name] = r
	}
	for _, r := range a {
		add(r)
	}
	for _, r := range b {
		add(r)
	}
	out := make([]api.SkillRegistration, 0, len(order))
	for _, name := range order {
		out = append(out, byName[name])
	}
	return out
}

// mergeAbsDirs deduplicates absolute directory paths.
func mergeAbsDirs(a, b []string) []string {
	seen := make(map[string]struct{})
	var out []string
	for _, list := range [][]string{a, b} {
		for _, p := range list {
			p = strings.TrimSpace(p)
			if p == "" {
				continue
			}
			abs, err := filepath.Abs(p)
			if err != nil || abs == "" {
				continue
			}
			if _, ok := seen[abs]; ok {
				continue
			}
			seen[abs] = struct{}{}
			out = append(out, abs)
		}
	}
	return out
}

// entriesToSkillRegistrations converts OPENOCTA skill entries to agentsdk-go SkillRegistration.
// It parses name/description from SKILL.md frontmatter (OpenOcta/AgentSkills format), fills
// Definition.Metadata, builds Matchers (e.g. KeywordMatcher from name/description), and
// a Handler that reads the skill markdown and returns its content as Result.Output.
func uniqueAbsSkillBaseDirs(entries []agentSkills.Entry) []string {
	seen := make(map[string]struct{})
	var out []string
	for _, e := range entries {
		d := strings.TrimSpace(e.BaseDir)
		if d == "" {
			continue
		}
		abs, err := filepath.Abs(d)
		if err != nil || abs == "" {
			continue
		}
		if _, ok := seen[abs]; ok {
			continue
		}
		seen[abs] = struct{}{}
		out = append(out, abs)
	}
	return out
}

// skillActivationPreamble 注入到 SKILL 正文前，避免模型把「代理工作区」与「Skill 落盘目录」混用。
func skillActivationPreamble(skillBaseDir string) string {
	skillBaseDir = strings.TrimSpace(skillBaseDir)
	if skillBaseDir == "" {
		return ""
	}
	abs := skillBaseDir
	if a, err := filepath.Abs(skillBaseDir); err == nil && a != "" {
		abs = a
	}
	return fmt.Sprintf("## Skill 根目录（scripts 等与此目录对齐；与对话工作区根目录不一定相同）\n\n"+
		"`%s`\n\n"+
		"本文中相对路径（例如 `scripts/...`）均相对于上述目录。\n\n---\n\n", abs)
}

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
		embeddedContent := e.EmbeddedContent
		skillBaseDir := e.BaseDir
		regs = append(regs, api.SkillRegistration{
			Definition: sdkSkills.Definition{
				Name:                  name,
				Description:           desc,
				Metadata:              meta,
				Matchers:              matchers,
				DisableAutoActivation: disableAuto,
			},
			Handler: sdkSkills.HandlerFunc(func(ctx context.Context, _ sdkSkills.ActivationContext) (sdkSkills.Result, error) {
				pre := skillActivationPreamble(skillBaseDir)
				if len(embeddedContent) > 0 {
					return sdkSkills.Result{Output: pre + string(embeddedContent)}, nil
				}
				data, err := os.ReadFile(filePath)
				if err != nil {
					return sdkSkills.Result{}, err
				}
				return sdkSkills.Result{Output: pre + string(data)}, nil
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
		if v, ok := e.Frontmatter["allowed-tools"]; ok && v != "" {
			m["allowed-tools"] = v
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
	return LoadWorkspaceSkillEntries(workspaceDir, cfg)
}

// BuildSkillsPrompt builds a skills prompt string for agent runs.
func BuildSkillsPrompt(entries []agentSkills.Entry, cfg *config.OpenOctaConfig) string {
	// Filter entries based on eligibility
	eligibility := &agentSkills.EligibilityContext{}
	filtered := agentSkills.FilterEntries(entries, cfg, eligibility)

	// Build prompt
	body := agentSkills.BuildPrompt(filtered)
	if body == "" {
		return ""
	}
	return "## 可用技能\n\n" + body
}

// BuildSystemPromptSkillsSection loads skills for the current run (employee or workspace) and returns a system-prompt block.
func BuildSystemPromptSkillsSection(projectRoot string, opts Options) string {
	if !opts.EnableSkills {
		return ""
	}
	env := opts.Env
	if env == nil {
		env = os.Getenv
	}
	var entries []agentSkills.Entry
	employeeID := strings.TrimSpace(opts.EmployeeID)
	if employeeID != "" {
		entries = LoadEmployeeSkillEntries(projectRoot, opts.Config, employeeID, env)
	}
	if len(entries) == 0 {
		entries, _ = LoadWorkspaceSkillEntries(projectRoot, opts.Config)
	}
	prompt := BuildSkillsPrompt(entries, opts.Config)
	if prompt == "" {
		return ""
	}
	return prompt + "\n\n可通过 `skill` 工具按名称激活；匹配关键词时也会自动注入技能内容。"
}

// ApplySkillEnvOverrides applies skill environment variable overrides.
// Returns a restore function to revert changes.
func ApplySkillEnvOverrides(entries []agentSkills.Entry, cfg *config.OpenOctaConfig) func() {
	return agentSkills.ApplyEnvOverrides(entries, cfg)
}
