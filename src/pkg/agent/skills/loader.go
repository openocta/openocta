// Package skills provides skill loading and management for agents.
package skills

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/paths"
)

// Entry represents a loaded skill entry.
type Entry struct {
	Name        string
	Source      string
	FilePath    string
	BaseDir     string
	Metadata    *Metadata
	Frontmatter map[string]string
}

// Metadata holds skill metadata parsed from frontmatter.
type Metadata struct {
	SkillKey   string
	PrimaryEnv string
	Always     *bool
	OS         []string
	Requires   *Requires
	Install    []InstallSpec
	Emoji      string
	Homepage   string
}

// Requires holds skill requirements.
type Requires struct {
	Bins    []string
	AnyBins []string
	Env     []string
	Config  []string
}

// InstallSpec holds skill installation specification.
type InstallSpec struct {
	ID    string
	Kind  string // "brew", "node", "go", "uv", "download"
	Bins  []string
	OS    []string
	Label string
	// Kind-specific fields
	Formula string // for brew
	Package string // for node/uv
	Module  string // for go
	URL     string // for download
}

// LoadOptions configures skill loading.
type LoadOptions struct {
	Config           *config.OpenOctaConfig
	ManagedSkillsDir string
	BundledSkillsDir string
}

// LoadWorkspaceEntries loads skill entries from a workspace directory.
// Skills are loaded from multiple locations with the following precedence (lowest to highest):
// 1. Extra directories (from config.skills.load.extraDirs) - lowest priority
// 2. Bundled skills (built-in: default ./skills or OPENCLAW_BUNDLED_SKILLS_DIR) - low priority
// 3. Managed skills (~/.openclaw/skills) - medium priority
// 4. Workspace skills (<workspace>/skills) - highest priority
//
// Name conflict resolution: workspace (highest) > managed > built-in (lowest).
func LoadWorkspaceEntries(workspaceDir string, opts *LoadOptions) ([]Entry, error) {
	env := func(k string) string { return os.Getenv(k) }

	// Resolve directories
	managedSkillsDir := opts.ManagedSkillsDir
	if managedSkillsDir == "" {
		stateDir := paths.ResolveStateDir(env)
		managedSkillsDir = filepath.Join(stateDir, "skills")
	}

	bundledSkillsDir := opts.BundledSkillsDir
	if bundledSkillsDir == "" {
		bundledSkillsDir = resolveBundledSkillsDir(env)
	}

	workspaceSkillsDir := filepath.Join(workspaceDir, "skills")

	// Get extra directories from config
	var extraDirs []string
	if opts.Config != nil && opts.Config.Skills != nil && opts.Config.Skills.Load != nil {
		for _, dir := range opts.Config.Skills.Load.ExtraDirs {
			trimmed := strings.TrimSpace(dir)
			if trimmed != "" {
				extraDirs = append(extraDirs, resolveUserPath(trimmed, env))
			}
		}
	}

	// TODO: Add plugin skill directories when plugin support is available
	// pluginSkillDirs := resolvePluginSkillDirs(workspaceDir, opts.Config)
	// extraDirs = append(extraDirs, pluginSkillDirs...)

	// Load skills from each directory with precedence
	// Priority order (lowest to highest):
	// 1. Extra directories (from config.skills.load.extraDirs) - lowest
	// 2. Bundled skills (built-in, shipped with install) - low
	// 3. Managed skills (~/.openclaw/skills) - medium
	// 4. Workspace skills (<workspace>/skills) - highest
	merged := make(map[string]Entry)

	// 1. Extra directories (lowest precedence)
	for _, dir := range extraDirs {
		skills, _ := loadSkillsFromDir(dir, "openclaw-extra")
		for _, skill := range skills {
			if skill.Name != "" {
				merged[skill.Name] = skill
			}
		}
	}

	// 2. Bundled skills (built-in, shipped with install) - lowest built-in priority
	if bundledSkillsDir != "" {
		skills, _ := loadSkillsFromDir(bundledSkillsDir, "openclaw-bundled")
		for _, skill := range skills {
			if skill.Name != "" {
				merged[skill.Name] = skill
			}
		}
	}

	// 3. Managed skills (~/.openclaw/skills) - medium priority
	skills, _ := loadSkillsFromDir(managedSkillsDir, "openclaw-managed")
	for _, skill := range skills {
		if skill.Name != "" {
			merged[skill.Name] = skill
		}
	}

	// 4. Workspace skills (<workspace>/skills) - highest precedence
	skills, _ = loadSkillsFromDir(workspaceSkillsDir, "openclaw-workspace")
	for _, skill := range skills {
		if skill.Name != "" {
			merged[skill.Name] = skill
		}
	}

	// Convert map to slice
	var result []Entry
	for _, skill := range merged {
		result = append(result, skill)
	}

	return result, nil
}

// loadSkillsFromDir loads skills from a directory.
// Returns empty slice if directory doesn't exist or has no skills.
func loadSkillsFromDir(dir string, source string) ([]Entry, error) {
	if dir == "" {
		return []Entry{}, nil
	}

	info, err := os.Stat(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []Entry{}, nil
		}
		return nil, err
	}

	if !info.IsDir() {
		return []Entry{}, nil
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return []Entry{}, nil
	}

	var skills []Entry
	for _, entry := range entries {
		if entry.IsDir() {
			skillDir := filepath.Join(dir, entry.Name())
			skillFile := filepath.Join(skillDir, "SKILL.md")
			if _, err := os.Stat(skillFile); err == nil {
				skill, err := loadSkillFromDir(skillDir, source)
				if err == nil && skill.Name != "" {
					skills = append(skills, skill)
				}
			}
		} else if strings.HasSuffix(entry.Name(), ".md") {
			// Single file skill
			skillFile := filepath.Join(dir, entry.Name())
			skill, err := loadSkillFromFile(skillFile, source)
			if err == nil && skill.Name != "" {
				skills = append(skills, skill)
			}
		}
	}

	return skills, nil
}

// loadSkillFromDir loads a skill from a directory containing SKILL.md.
func loadSkillFromDir(skillDir string, source string) (Entry, error) {
	skillFile := filepath.Join(skillDir, "SKILL.md")
	return loadSkillFromFile(skillFile, source)
}

// loadSkillFromFile loads a skill from a SKILL.md file.
func loadSkillFromFile(skillFile string, source string) (Entry, error) {
	data, err := os.ReadFile(skillFile)
	if err != nil {
		return Entry{}, err
	}

	// Parse frontmatter (simplified - just extract name for now)
	// TODO: Full frontmatter parsing with metadata extraction
	name := filepath.Base(filepath.Dir(skillFile))
	if name == "." || name == "/" {
		name = strings.TrimSuffix(filepath.Base(skillFile), ".md")
	}

	// Try to extract name from frontmatter
	frontmatter := parseFrontmatter(string(data))
	if nameFromFM, ok := frontmatter["name"]; ok && nameFromFM != "" {
		name = nameFromFM
	}

	baseDir := filepath.Dir(skillFile)
	if baseDir == "." {
		baseDir = filepath.Dir(skillFile)
	}

	metadata := parseMetadata(frontmatter)

	return Entry{
		Name:        name,
		Source:      source,
		FilePath:    skillFile,
		BaseDir:     baseDir,
		Metadata:    metadata,
		Frontmatter: frontmatter,
	}, nil
}

// parseFrontmatter parses YAML frontmatter from markdown content.
// Simplified implementation - extracts basic key-value pairs.
func parseFrontmatter(content string) map[string]string {
	result := make(map[string]string)

	lines := strings.Split(content, "\n")
	inFrontmatter := false

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "---" {
			if !inFrontmatter {
				inFrontmatter = true
				continue
			} else {
				break
			}
		}
		if inFrontmatter {
			parts := strings.SplitN(trimmed, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				// Remove quotes if present
				value = strings.Trim(value, `"'`)
				result[key] = value
			}
		}
	}

	return result
}

// parseMetadata parses OpenOcta metadata from frontmatter.
func parseMetadata(frontmatter map[string]string) *Metadata {
	// TODO: Parse JSON5 metadata field
	// For now, return basic metadata
	return &Metadata{
		Requires: &Requires{},
	}
}

// resolveBundledSkillsDir resolves the bundled skills directory.
// Checks in order:
// 1. Environment override (OPENCLAW_BUNDLED_SKILLS_DIR)
// 2. Current working directory ./skills (built-in default)
// 3. Executable directory ../skills (for compiled binaries)
// 4. Common system locations
func resolveBundledSkillsDir(env func(string) string) string {
	// 1. Check environment override
	override := strings.TrimSpace(env("OPENCLAW_BUNDLED_SKILLS_DIR"))
	if override != "" {
		return override
	}

	// 2. Check current working directory ./skills (built-in default)
	cwd, err := os.Getwd()
	if err == nil {
		localSkills := filepath.Join(cwd, "skills")
		if info, err := os.Stat(localSkills); err == nil && info.IsDir() {
			if looksLikeSkillsDir(localSkills) {
				return localSkills
			}
		}
	}

	// 3. Try to find skills directory relative to executable
	execPath, err := os.Executable()
	if err == nil {
		execDir := filepath.Dir(execPath)
		sibling := filepath.Join(execDir, "skills")
		if info, err := os.Stat(sibling); err == nil && info.IsDir() {
			if looksLikeSkillsDir(sibling) {
				return sibling
			}
		}
	}

	// 4. Try to find in common system locations
	candidates := []string{
		"/usr/local/share/openclaw/skills",
		"/opt/openclaw/skills",
	}

	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			if looksLikeSkillsDir(candidate) {
				return candidate
			}
		}
	}

	return ""
}

// looksLikeSkillsDir checks if a directory looks like a skills directory.
// A skills directory should contain at least one .md file or a subdirectory with SKILL.md.
func looksLikeSkillsDir(dir string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}

	for _, entry := range entries {
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		// Check for .md files (single-file skills)
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".md") {
			return true
		}

		// Check for subdirectories with SKILL.md
		if entry.IsDir() {
			skillFile := filepath.Join(dir, entry.Name(), "SKILL.md")
			if _, err := os.Stat(skillFile); err == nil {
				return true
			}
		}
	}

	return false
}

// resolveUserPath resolves a user path (expands ~ and resolves to absolute).
func resolveUserPath(input string, env func(string) string) string {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return trimmed
	}

	if strings.HasPrefix(trimmed, "~") {
		home := env("HOME")
		if home == "" {
			home = env("USERPROFILE")
		}
		if home == "" {
			homeDir, err := os.UserHomeDir()
			if err == nil {
				home = homeDir
			}
		}
		if home != "" {
			trimmed = strings.Replace(trimmed, "~", home, 1)
		}
	}

	abs, err := filepath.Abs(trimmed)
	if err == nil {
		return abs
	}
	return trimmed
}
