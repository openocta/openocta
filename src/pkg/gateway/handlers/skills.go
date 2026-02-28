// Package handlers provides skills-related Gateway method handlers.
package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strings"

	"github.com/openocta/openocta/pkg/agent"
	agentSkills "github.com/openocta/openocta/pkg/agent/skills"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/paths"
)

// SkillsStatusParams holds parameters for skills.status.
type SkillsStatusParams struct {
	AgentID string
}

// SkillsInstallParams holds parameters for skills.install.
type SkillsInstallParams struct {
	Name      string
	InstallID string
	TimeoutMs *int
}

// SkillsUpdateParams holds parameters for skills.update.
type SkillsUpdateParams struct {
	SkillKey string
	Enabled  *bool
	APIKey   *string
	Env      map[string]string
}

// SkillStatusConfigCheck represents a config path check result.
type SkillStatusConfigCheck struct {
	Path      string      `json:"path"`
	Value     interface{} `json:"value"`
	Satisfied bool        `json:"satisfied"`
}

// SkillInstallOption represents an installation option for a skill.
type SkillInstallOption struct {
	ID    string   `json:"id"`
	Kind  string   `json:"kind"` // "brew", "node", "go", "uv", "download"
	Label string   `json:"label"`
	Bins  []string `json:"bins"`
}

// SkillStatusRequirements holds skill requirements.
type SkillStatusRequirements struct {
	Bins    []string `json:"bins"`
	AnyBins []string `json:"anyBins"`
	Env     []string `json:"env"`
	Config  []string `json:"config"`
	OS      []string `json:"os"`
}

// SkillStatusMissing holds missing requirements.
type SkillStatusMissing struct {
	Bins    []string `json:"bins"`
	AnyBins []string `json:"anyBins"`
	Env     []string `json:"env"`
	Config  []string `json:"config"`
	OS      []string `json:"os"`
}

// SkillStatusEntry represents a skill status entry in the status report.
type SkillStatusEntry struct {
	Name               string                   `json:"name"`
	Description        string                   `json:"description"`
	Source             string                   `json:"source"`
	Bundled            bool                     `json:"bundled"`
	FilePath           string                   `json:"filePath"`
	BaseDir            string                   `json:"baseDir"`
	SkillKey           string                   `json:"skillKey"`
	PrimaryEnv         string                   `json:"primaryEnv,omitempty"`
	Emoji              string                   `json:"emoji,omitempty"`
	Homepage           string                   `json:"homepage,omitempty"`
	Always             bool                     `json:"always"`
	Disabled           bool                     `json:"disabled"`
	BlockedByAllowlist bool                     `json:"blockedByAllowlist"`
	Eligible           bool                     `json:"eligible"`
	Requirements       SkillStatusRequirements  `json:"requirements"`
	Missing            SkillStatusMissing       `json:"missing"`
	ConfigChecks       []SkillStatusConfigCheck `json:"configChecks"`
	Install            []SkillInstallOption     `json:"install"`
}

// SkillStatusReport represents the complete skill status report.
type SkillStatusReport struct {
	WorkspaceDir     string             `json:"workspaceDir"`
	ManagedSkillsDir string             `json:"managedSkillsDir"`
	Skills           []SkillStatusEntry `json:"skills"`
}

// SkillEntry represents a loaded skill entry for handlers.
type SkillEntry struct {
	Name        string
	Source      string
	FilePath    string
	BaseDir     string
	Description string
	Metadata    *SkillMetadata
}

// SkillMetadata holds skill metadata.
type SkillMetadata struct {
	SkillKey   string
	PrimaryEnv string
	Always     *bool
	OS         []string
	Requires   *SkillRequires
	Install    []SkillInstallSpec
	Emoji      string
	Homepage   string
}

// SkillRequires holds skill requirements.
type SkillRequires struct {
	Bins    []string
	AnyBins []string
	Env     []string
	Config  []string
}

// SkillInstallSpec holds skill installation specification.
type SkillInstallSpec struct {
	ID      string
	Kind    string
	Bins    []string
	OS      []string
	Label   string
	Formula string
	Package string
	Module  string
	URL     string
}

// parseSkillsStatusParams parses and validates skills.status params.
func parseSkillsStatusParams(params map[string]interface{}) (*SkillsStatusParams, error) {
	p := &SkillsStatusParams{}
	if agentIDRaw, ok := params["agentId"].(string); ok {
		p.AgentID = strings.TrimSpace(agentIDRaw)
	}
	return p, nil
}

// parseSkillsInstallParams parses and validates skills.install params.
func parseSkillsInstallParams(params map[string]interface{}) (*SkillsInstallParams, error) {
	p := &SkillsInstallParams{}
	name, ok := params["name"].(string)
	if !ok || strings.TrimSpace(name) == "" {
		return nil, fmt.Errorf("name is required")
	}
	p.Name = strings.TrimSpace(name)

	installID, ok := params["installId"].(string)
	if !ok || strings.TrimSpace(installID) == "" {
		return nil, fmt.Errorf("installId is required")
	}
	p.InstallID = strings.TrimSpace(installID)

	if timeoutMs, ok := params["timeoutMs"].(float64); ok && timeoutMs >= 1000 {
		timeoutMsInt := int(timeoutMs)
		p.TimeoutMs = &timeoutMsInt
	} else if timeoutMs, ok := params["timeoutMs"].(int); ok && timeoutMs >= 1000 {
		p.TimeoutMs = &timeoutMs
	}
	return p, nil
}

// parseSkillsUpdateParams parses and validates skills.update params.
func parseSkillsUpdateParams(params map[string]interface{}) (*SkillsUpdateParams, error) {
	p := &SkillsUpdateParams{}
	skillKey, ok := params["skillKey"].(string)
	if !ok || strings.TrimSpace(skillKey) == "" {
		return nil, fmt.Errorf("skillKey is required")
	}
	p.SkillKey = strings.TrimSpace(skillKey)

	if enabled, ok := params["enabled"].(bool); ok {
		p.Enabled = &enabled
	}

	if apiKey, ok := params["apiKey"].(string); ok {
		trimmed := strings.TrimSpace(apiKey)
		if trimmed != "" {
			p.APIKey = &trimmed
		}
	}

	if envRaw, ok := params["env"].(map[string]interface{}); ok {
		p.Env = make(map[string]string)
		for k, v := range envRaw {
			if val, ok := v.(string); ok {
				trimmedKey := strings.TrimSpace(k)
				trimmedVal := strings.TrimSpace(val)
				if trimmedKey != "" {
					if trimmedVal != "" {
						p.Env[trimmedKey] = trimmedVal
					} else {
						// Empty value means delete
						p.Env[trimmedKey] = ""
					}
				}
			}
		}
	}
	return p, nil
}

// normalizeAgentID and resolveDefaultAgentID are defined in sessions.go

// listAgentIDs lists all agent IDs from config.
func listAgentIDs(cfg *config.OpenOctaConfig) []string {
	if cfg == nil || cfg.Agents == nil || len(cfg.Agents.List) == 0 {
		return []string{"main"}
	}
	seen := make(map[string]bool)
	var ids []string
	for i := range cfg.Agents.List {
		agent := &cfg.Agents.List[i]
		id := normalizeAgentID(agent.ID)
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 {
		return []string{"main"}
	}
	return ids
}

// resolveAgentWorkspaceDir resolves workspace directory for an agent (delegates to agent package).
func resolveAgentWorkspaceDir(cfg *config.OpenOctaConfig, agentID string, env func(string) string) string {
	return agent.ResolveAgentWorkspaceDir(cfg, agentID, env)
}

// listWorkspaceDirs lists all workspace directories from config.
func listWorkspaceDirs(cfg *config.OpenOctaConfig, env func(string) string) []string {
	dirs := make(map[string]bool)
	agentIDs := listAgentIDs(cfg)
	for _, agentID := range agentIDs {
		dir := resolveAgentWorkspaceDir(cfg, agentID, env)
		dirs[dir] = true
	}
	// Also add default agent workspace
	defaultAgentID := resolveDefaultAgentID(cfg)
	defaultDir := resolveAgentWorkspaceDir(cfg, defaultAgentID, env)
	dirs[defaultDir] = true

	var result []string
	for dir := range dirs {
		result = append(result, dir)
	}
	return result
}

// loadWorkspaceSkillEntries loads skill entries from a workspace directory.
func loadWorkspaceSkillEntries(workspaceDir string, cfg *config.OpenOctaConfig) []SkillEntry {
	opts := &agentSkills.LoadOptions{
		Config:           cfg,
		ManagedSkillsDir: "",
		BundledSkillsDir: "",
	}

	entries, err := agentSkills.LoadWorkspaceEntries(workspaceDir, opts)
	if err != nil {
		// Log error but return empty list
		return []SkillEntry{}
	}

	// Convert to handler SkillEntry format
	var result []SkillEntry
	for _, entry := range entries {
		// Extract description from frontmatter
		description := entry.Name
		if desc, ok := entry.Frontmatter["description"]; ok && desc != "" {
			description = desc
		}

		skillEntry := SkillEntry{
			Name:        entry.Name,
			Source:      entry.Source,
			FilePath:    entry.FilePath,
			BaseDir:     entry.BaseDir,
			Description: description,
		}

		if entry.Metadata != nil {
			skillEntry.Metadata = &SkillMetadata{
				SkillKey:   entry.Metadata.SkillKey,
				PrimaryEnv: entry.Metadata.PrimaryEnv,
				Always:     entry.Metadata.Always,
				OS:         entry.Metadata.OS,
				Emoji:      entry.Metadata.Emoji,
				Homepage:   entry.Metadata.Homepage,
			}

			if entry.Metadata.Requires != nil {
				skillEntry.Metadata.Requires = &SkillRequires{
					Bins:    entry.Metadata.Requires.Bins,
					AnyBins: entry.Metadata.Requires.AnyBins,
					Env:     entry.Metadata.Requires.Env,
					Config:  entry.Metadata.Requires.Config,
				}
			}

			if len(entry.Metadata.Install) > 0 {
				skillEntry.Metadata.Install = make([]SkillInstallSpec, len(entry.Metadata.Install))
				for i, spec := range entry.Metadata.Install {
					skillEntry.Metadata.Install[i] = SkillInstallSpec{
						ID:      spec.ID,
						Kind:    spec.Kind,
						Bins:    spec.Bins,
						OS:      spec.OS,
						Label:   spec.Label,
						Formula: spec.Formula,
						Package: spec.Package,
						Module:  spec.Module,
						URL:     spec.URL,
					}
				}
			}
		}

		result = append(result, skillEntry)
	}

	return result
}

// collectSkillBins collects all required bins from skill entries.
func collectSkillBins(entries []SkillEntry) []string {
	bins := make(map[string]bool)
	for _, entry := range entries {
		if entry.Metadata == nil {
			continue
		}
		if entry.Metadata.Requires != nil {
			for _, bin := range entry.Metadata.Requires.Bins {
				trimmed := strings.TrimSpace(bin)
				if trimmed != "" {
					bins[trimmed] = true
				}
			}
			for _, bin := range entry.Metadata.Requires.AnyBins {
				trimmed := strings.TrimSpace(bin)
				if trimmed != "" {
					bins[trimmed] = true
				}
			}
		}
		for _, spec := range entry.Metadata.Install {
			for _, bin := range spec.Bins {
				trimmed := strings.TrimSpace(bin)
				if trimmed != "" {
					bins[trimmed] = true
				}
			}
		}
	}
	var result []string
	for bin := range bins {
		result = append(result, bin)
	}
	sort.Strings(result)
	return result
}

// hasBinary checks if a binary exists in PATH.
func hasBinary(bin string) bool {
	_, err := exec.LookPath(bin)
	return err == nil
}

// writeConfigFile writes the config to disk.
func writeConfigFile(cfg *config.OpenOctaConfig, env func(string) string) error {
	stateDir := paths.ResolveStateDir(env)
	configPath := paths.ResolveCanonicalConfigPath(env, stateDir)

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Marshal config to JSON with indentation
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Write to file atomically
	tmpPath := configPath + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}
	if err := os.Rename(tmpPath, configPath); err != nil {
		_ = os.Remove(tmpPath)
		return fmt.Errorf("failed to rename config: %w", err)
	}

	return nil
}

// resolveSkillConfig resolves skill configuration from config.
func resolveSkillConfig(cfg *config.OpenOctaConfig, skillKey string) *config.SkillConfig {
	if cfg == nil || cfg.Skills == nil || cfg.Skills.Entries == nil {
		return nil
	}
	entry, ok := cfg.Skills.Entries[skillKey]
	if !ok {
		return nil
	}
	return &entry
}

// resolveBundledAllowlist resolves the bundled skills allowlist from config.
func resolveBundledAllowlist(cfg *config.OpenOctaConfig) []string {
	if cfg == nil || cfg.Skills == nil || len(cfg.Skills.AllowBundled) == 0 {
		return nil
	}
	var result []string
	for _, name := range cfg.Skills.AllowBundled {
		trimmed := strings.TrimSpace(name)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// isBundledSkillAllowed checks if a bundled skill is allowed based on allowlist.
func isBundledSkillAllowed(skillName string, skillKey string, source string, allowlist []string) bool {
	if len(allowlist) == 0 {
		return true
	}
	// Only check bundled skills
	if source != "openclaw-bundled" {
		return true
	}
	// Check if skill name or key is in allowlist
	for _, allowed := range allowlist {
		if allowed == skillName || allowed == skillKey {
			return true
		}
	}
	return false
}

// resolveConfigPath resolves a config path value (e.g., "browser.enabled").
func resolveConfigPath(cfg *config.OpenOctaConfig, pathStr string) interface{} {
	if cfg == nil || pathStr == "" {
		return nil
	}
	parts := strings.Split(pathStr, ".")
	var current interface{} = cfg
	for _, part := range parts {
		if part == "" {
			continue
		}
		// Use reflection or type assertion to navigate config
		// For now, handle common cases
		switch part {
		case "browser":
			if cfg.Browser != nil {
				current = cfg.Browser
			} else {
				return nil
			}
		case "enabled":
			if browser, ok := current.(*config.BrowserConfig); ok && browser.Enabled != nil {
				return *browser.Enabled
			}
			return nil
		case "evaluateEnabled":
			if browser, ok := current.(*config.BrowserConfig); ok && browser.EvaluateEnabled != nil {
				return *browser.EvaluateEnabled
			}
			return nil
		default:
			// For other paths, return nil (can be extended later)
			return nil
		}
	}
	return current
}

// isConfigPathTruthy checks if a config path value is truthy.
func isConfigPathTruthy(cfg *config.OpenOctaConfig, pathStr string) bool {
	value := resolveConfigPath(cfg, pathStr)
	if value == nil {
		// Check default values
		defaultValues := map[string]bool{
			"browser.enabled":         true,
			"browser.evaluateEnabled": true,
		}
		if defaultValue, ok := defaultValues[pathStr]; ok {
			return defaultValue
		}
		return false
	}
	switch v := value.(type) {
	case bool:
		return v
	case int:
		return v != 0
	case string:
		return strings.TrimSpace(v) != ""
	default:
		return true
	}
}

// resolveSkillsInstallPreferences resolves skill installation preferences from config.
func resolveSkillsInstallPreferences(cfg *config.OpenOctaConfig) (preferBrew bool, nodeManager string) {
	preferBrew = true
	nodeManager = "npm"

	if cfg == nil || cfg.Skills == nil || cfg.Skills.Install == nil {
		return preferBrew, nodeManager
	}

	if cfg.Skills.Install.PreferBrew != nil {
		preferBrew = *cfg.Skills.Install.PreferBrew
	}

	if cfg.Skills.Install.NodeManager != nil {
		manager := strings.ToLower(strings.TrimSpace(*cfg.Skills.Install.NodeManager))
		switch manager {
		case "pnpm", "yarn", "bun", "npm":
			nodeManager = manager
		default:
			nodeManager = "npm"
		}
	}

	return preferBrew, nodeManager
}

// resolveRuntimePlatform returns the current runtime platform.
func resolveRuntimePlatform() string {
	return runtime.GOOS
}

// resolveManagedSkillsDir resolves the managed skills directory path.
func resolveManagedSkillsDir(env func(string) string) string {
	stateDir := paths.ResolveStateDir(env)
	return filepath.Join(stateDir, "skills")
}

// selectPreferredInstallSpec selects the preferred install spec based on preferences.
func selectPreferredInstallSpec(install []SkillInstallSpec, preferBrew bool, nodeManager string) *SkillInstallSpec {
	if len(install) == 0 {
		return nil
	}

	// Find specs by kind
	var brewSpec, nodeSpec, goSpec, uvSpec *SkillInstallSpec
	for i := range install {
		spec := &install[i]
		switch spec.Kind {
		case "brew":
			if brewSpec == nil {
				brewSpec = spec
			}
		case "node":
			if nodeSpec == nil {
				nodeSpec = spec
			}
		case "go":
			if goSpec == nil {
				goSpec = spec
			}
		case "uv":
			if uvSpec == nil {
				uvSpec = spec
			}
		}
	}

	// Select based on preferences
	if preferBrew && hasBinary("brew") && brewSpec != nil {
		return brewSpec
	}
	if uvSpec != nil {
		return uvSpec
	}
	if nodeSpec != nil {
		return nodeSpec
	}
	if brewSpec != nil {
		return brewSpec
	}
	if goSpec != nil {
		return goSpec
	}

	// Return first available
	return &install[0]
}

// normalizeInstallOptions normalizes install options for a skill entry.
func normalizeInstallOptions(entry SkillEntry, preferBrew bool, nodeManager string) []SkillInstallOption {
	if entry.Metadata == nil || len(entry.Metadata.Install) == 0 {
		return []SkillInstallOption{}
	}

	install := entry.Metadata.Install
	currentPlatform := resolveRuntimePlatform()

	// Filter by OS
	filtered := []SkillInstallSpec{}
	for _, spec := range install {
		if len(spec.OS) == 0 {
			filtered = append(filtered, spec)
		} else {
			for _, osName := range spec.OS {
				if osName == currentPlatform {
					filtered = append(filtered, spec)
					break
				}
			}
		}
	}

	if len(filtered) == 0 {
		return []SkillInstallOption{}
	}

	// Check if all are downloads
	allDownloads := true
	for _, spec := range filtered {
		if spec.Kind != "download" {
			allDownloads = false
			break
		}
	}

	if allDownloads {
		// Return all download options
		options := []SkillInstallOption{}
		for i, spec := range filtered {
			options = append(options, buildInstallOption(&spec, i, nodeManager))
		}
		return options
	}

	// Select preferred spec
	preferred := selectPreferredInstallSpec(filtered, preferBrew, nodeManager)
	if preferred == nil {
		return []SkillInstallOption{}
	}

	// Find index
	index := 0
	for i, spec := range filtered {
		if spec.ID == preferred.ID && spec.Kind == preferred.Kind {
			index = i
			break
		}
	}

	return []SkillInstallOption{buildInstallOption(preferred, index, nodeManager)}
}

// buildInstallOption builds a SkillInstallOption from an InstallSpec.
func buildInstallOption(spec *SkillInstallSpec, index int, nodeManager string) SkillInstallOption {
	id := spec.ID
	if id == "" {
		id = fmt.Sprintf("%s-%d", spec.Kind, index)
	}
	id = strings.TrimSpace(id)

	bins := spec.Bins
	if bins == nil {
		bins = []string{}
	}

	label := strings.TrimSpace(spec.Label)
	if label == "" {
		switch spec.Kind {
		case "brew":
			if spec.Formula != "" {
				label = fmt.Sprintf("Install %s (brew)", spec.Formula)
			} else {
				label = "Run installer"
			}
		case "node":
			if spec.Package != "" {
				label = fmt.Sprintf("Install %s (%s)", spec.Package, nodeManager)
			} else {
				label = "Run installer"
			}
		case "go":
			if spec.Module != "" {
				label = fmt.Sprintf("Install %s (go)", spec.Module)
			} else {
				label = "Run installer"
			}
		case "uv":
			if spec.Package != "" {
				label = fmt.Sprintf("Install %s (uv)", spec.Package)
			} else {
				label = "Run installer"
			}
		case "download":
			if spec.URL != "" {
				url := strings.TrimSpace(spec.URL)
				parts := strings.Split(url, "/")
				last := ""
				if len(parts) > 0 {
					last = parts[len(parts)-1]
				}
				if last != "" {
					label = fmt.Sprintf("Download %s", last)
				} else {
					label = fmt.Sprintf("Download %s", url)
				}
			} else {
				label = "Run installer"
			}
		default:
			label = "Run installer"
		}
	}

	return SkillInstallOption{
		ID:    id,
		Kind:  spec.Kind,
		Label: label,
		Bins:  bins,
	}
}

// buildSkillStatus builds a skill status entry from a skill entry.
func buildSkillStatus(entry SkillEntry, cfg *config.OpenOctaConfig, preferBrew bool, nodeManager string) SkillStatusEntry {
	skillKey := entry.Name
	if entry.Metadata != nil && entry.Metadata.SkillKey != "" {
		skillKey = entry.Metadata.SkillKey
	}

	skillConfig := resolveSkillConfig(cfg, skillKey)
	disabled := skillConfig != nil && skillConfig.Enabled != nil && !*skillConfig.Enabled
	allowBundled := resolveBundledAllowlist(cfg)
	source := entry.Source
	if source == "" {
		source = "unknown"
	}
	blockedByAllowlist := !isBundledSkillAllowed(entry.Name, skillKey, source, allowBundled)

	// Use description from entry (already extracted from frontmatter)
	description := entry.Description
	if description == "" {
		description = entry.Name
	}

	// Extract emoji and homepage
	emoji := ""
	homepage := ""
	if entry.Metadata != nil {
		emoji = entry.Metadata.Emoji
		homepage = entry.Metadata.Homepage
	}

	// Check if bundled
	bundled := source == "openclaw-bundled"

	// Check requirements
	// Initialize all slices as empty arrays, not nil
	missingBins := []string{}
	missingAnyBins := []string{}
	missingEnv := []string{}
	missingConfig := []string{}
	missingOs := []string{}
	requiredBins := []string{}
	requiredAnyBins := []string{}
	requiredEnv := []string{}
	requiredConfig := []string{}
	requiredOs := []string{}

	if entry.Metadata != nil && entry.Metadata.Requires != nil {
		if entry.Metadata.Requires.Bins != nil {
			requiredBins = entry.Metadata.Requires.Bins
		}
		if entry.Metadata.Requires.AnyBins != nil {
			requiredAnyBins = entry.Metadata.Requires.AnyBins
		}
		if entry.Metadata.Requires.Env != nil {
			requiredEnv = entry.Metadata.Requires.Env
		}
		if entry.Metadata.Requires.Config != nil {
			requiredConfig = entry.Metadata.Requires.Config
		}

		// Check bins
		for _, bin := range requiredBins {
			if !hasBinary(bin) {
				missingBins = append(missingBins, bin)
			}
		}
		// Check anyBins
		if len(requiredAnyBins) > 0 {
			anyFound := false
			for _, bin := range requiredAnyBins {
				if hasBinary(bin) {
					anyFound = true
					break
				}
			}
			if !anyFound {
				missingAnyBins = requiredAnyBins
			}
		}
		// Check env
		for _, envName := range requiredEnv {
			if os.Getenv(envName) == "" {
				if skillConfig == nil || skillConfig.Env == nil || skillConfig.Env[envName] == "" {
					if skillConfig == nil || skillConfig.APIKey == "" || entry.Metadata.PrimaryEnv != envName {
						missingEnv = append(missingEnv, envName)
					}
				}
			}
		}
		// Check config
		for _, configPath := range requiredConfig {
			if !isConfigPathTruthy(cfg, configPath) {
				missingConfig = append(missingConfig, configPath)
			}
		}
	}

	// Check OS
	if entry.Metadata != nil {
		requiredOs = entry.Metadata.OS
		if len(requiredOs) > 0 {
			currentPlatform := resolveRuntimePlatform()
			found := false
			for _, osName := range requiredOs {
				if osName == currentPlatform {
					found = true
					break
				}
			}
			if !found {
				missingOs = requiredOs
			}
		}
	}

	// Build config checks
	configChecks := []SkillStatusConfigCheck{}
	for _, configPath := range requiredConfig {
		value := resolveConfigPath(cfg, configPath)
		satisfied := isConfigPathTruthy(cfg, configPath)
		configChecks = append(configChecks, SkillStatusConfigCheck{
			Path:      configPath,
			Value:     value,
			Satisfied: satisfied,
		})
	}

	always := entry.Metadata != nil && entry.Metadata.Always != nil && *entry.Metadata.Always

	// If always is true, missing should be empty
	if always {
		missingBins = []string{}
		missingAnyBins = []string{}
		missingEnv = []string{}
		missingConfig = []string{}
		missingOs = []string{}
	}

	eligible := !disabled && !blockedByAllowlist && (always ||
		(len(missingBins) == 0 && len(missingAnyBins) == 0 && len(missingEnv) == 0 && len(missingConfig) == 0 && len(missingOs) == 0))

	// Build install options
	installOptions := normalizeInstallOptions(entry, preferBrew, nodeManager)

	primaryEnv := ""
	if entry.Metadata != nil {
		primaryEnv = entry.Metadata.PrimaryEnv
	}

	return SkillStatusEntry{
		Name:               entry.Name,
		Description:        description,
		Source:             source,
		Bundled:            bundled,
		FilePath:           entry.FilePath,
		BaseDir:            entry.BaseDir,
		SkillKey:           skillKey,
		PrimaryEnv:         primaryEnv,
		Emoji:              emoji,
		Homepage:           homepage,
		Always:             always,
		Disabled:           disabled,
		BlockedByAllowlist: blockedByAllowlist,
		Eligible:           eligible,
		Requirements: SkillStatusRequirements{
			Bins:    requiredBins,
			AnyBins: requiredAnyBins,
			Env:     requiredEnv,
			Config:  requiredConfig,
			OS:      requiredOs,
		},
		Missing: SkillStatusMissing{
			Bins:    missingBins,
			AnyBins: missingAnyBins,
			Env:     missingEnv,
			Config:  missingConfig,
			OS:      missingOs,
		},
		ConfigChecks: configChecks,
		Install:      installOptions,
	}
}

// buildWorkspaceSkillStatus builds a skill status report for a workspace.
func buildWorkspaceSkillStatus(workspaceDir string, cfg *config.OpenOctaConfig, env func(string) string) SkillStatusReport {
	managedSkillsDir := resolveManagedSkillsDir(env)
	entries := loadWorkspaceSkillEntries(workspaceDir, cfg)

	preferBrew, nodeManager := resolveSkillsInstallPreferences(cfg)

	// Build skill status entries
	skillStatuses := []SkillStatusEntry{}
	for _, entry := range entries {
		status := buildSkillStatus(entry, cfg, preferBrew, nodeManager)
		skillStatuses = append(skillStatuses, status)
	}

	return SkillStatusReport{
		WorkspaceDir:     workspaceDir,
		ManagedSkillsDir: managedSkillsDir,
		Skills:           skillStatuses,
	}
}

// SkillsStatusHandler handles "skills.status".
func SkillsStatusHandler(opts HandlerOpts) error {
	params, err := parseSkillsStatusParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid skills.status params: %v", err),
		}, nil)
		return nil
	}

	// Load config
	var cfg *config.OpenOctaConfig
	if opts.Context != nil && opts.Context.Config != nil {
		cfg = opts.Context.Config
	} else {
		env := func(k string) string { return os.Getenv(k) }
		loaded, err := config.Load(env)
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInternal,
				Message: "failed to load config: " + err.Error(),
			}, nil)
			return nil
		}
		cfg = loaded
	}

	// Resolve agent ID
	agentIDRaw := params.AgentID
	agentID := agentIDRaw
	if agentID == "" {
		agentID = resolveDefaultAgentID(cfg)
	} else {
		agentID = normalizeAgentID(agentID)
		// Validate agent ID
		knownAgents := listAgentIDs(cfg)
		found := false
		for _, knownID := range knownAgents {
			if knownID == agentID {
				found = true
				break
			}
		}
		if !found && agentIDRaw != "" {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInvalidRequest,
				Message: fmt.Sprintf("unknown agent id \"%s\"", agentIDRaw),
			}, nil)
			return nil
		}
	}

	// Resolve workspace directory
	env := func(k string) string { return os.Getenv(k) }
	workspaceDir := resolveAgentWorkspaceDir(cfg, agentID, env)

	// Build status report
	report := buildWorkspaceSkillStatus(workspaceDir, cfg, env)

	opts.Respond(true, report, nil, nil)
	return nil
}

// SkillsBinsHandler handles "skills.bins".
func SkillsBinsHandler(opts HandlerOpts) error {
	// Load config
	var cfg *config.OpenOctaConfig
	if opts.Context != nil && opts.Context.Config != nil {
		cfg = opts.Context.Config
	} else {
		env := func(k string) string { return os.Getenv(k) }
		loaded, err := config.Load(env)
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInternal,
				Message: "failed to load config: " + err.Error(),
			}, nil)
			return nil
		}
		cfg = loaded
	}

	// List all workspace directories
	env := func(k string) string { return os.Getenv(k) }
	workspaceDirs := listWorkspaceDirs(cfg, env)

	// Collect bins from all workspaces
	bins := make(map[string]bool)
	for _, workspaceDir := range workspaceDirs {
		entries := loadWorkspaceSkillEntries(workspaceDir, cfg)
		for _, bin := range collectSkillBins(entries) {
			bins[bin] = true
		}
	}

	// Convert to sorted slice
	var result []string
	for bin := range bins {
		result = append(result, bin)
	}
	sort.Strings(result)

	opts.Respond(true, map[string]interface{}{
		"bins": result,
	}, nil, nil)
	return nil
}

// SkillsInstallHandler handles "skills.install" (stub: not implemented).
func SkillsInstallHandler(opts HandlerOpts) error {
	_, err := parseSkillsInstallParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid skills.install params: %v", err),
		}, nil)
		return nil
	}

	// Stub: return not implemented error
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "skills.install not implemented",
	}, nil)
	return nil

	// TODO: Implement full installation logic:
	// 1. Load config
	// 2. Resolve default agent workspace directory
	// 3. Call installSkill equivalent
	// 4. Return result
}

// SkillsUpdateHandler handles "skills.update".
func SkillsUpdateHandler(opts HandlerOpts) error {
	params, err := parseSkillsUpdateParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid skills.update params: %v", err),
		}, nil)
		return nil
	}

	// Load config
	var cfg *config.OpenOctaConfig
	if opts.Context != nil && opts.Context.Config != nil {
		cfg = opts.Context.Config
	} else {
		env := func(k string) string { return os.Getenv(k) }
		loaded, err := config.Load(env)
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInternal,
				Message: "failed to load config: " + err.Error(),
			}, nil)
			return nil
		}
		cfg = loaded
	}

	// Ensure skills config exists
	if cfg.Skills == nil {
		cfg.Skills = &config.SkillsConfig{}
	}
	if cfg.Skills.Entries == nil {
		cfg.Skills.Entries = make(map[string]config.SkillConfig)
	}

	// Get current skill config
	current := cfg.Skills.Entries[params.SkillKey]
	if current.Enabled == nil {
		enabled := true
		current.Enabled = &enabled
	}

	// Apply updates
	if params.Enabled != nil {
		current.Enabled = params.Enabled
	}

	if params.APIKey != nil {
		if *params.APIKey == "" {
			current.APIKey = ""
		} else {
			current.APIKey = *params.APIKey
		}
	}

	if params.Env != nil {
		if current.Env == nil {
			current.Env = make(map[string]string)
		}
		// Apply env updates
		for k, v := range params.Env {
			if v == "" {
				// Empty value means delete
				delete(current.Env, k)
			} else {
				current.Env[k] = v
			}
		}
	}

	// Update config
	cfg.Skills.Entries[params.SkillKey] = current

	// Write config file
	env := func(k string) string { return os.Getenv(k) }
	if err := writeConfigFile(cfg, env); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "failed to write config: " + err.Error(),
		}, nil)
		return nil
	}

	// Build response
	result := map[string]interface{}{
		"ok":       true,
		"skillKey": params.SkillKey,
		"config": map[string]interface{}{
			"enabled": current.Enabled,
			"apiKey":  current.APIKey,
			"env":     current.Env,
		},
	}

	opts.Respond(true, result, nil, nil)
	return nil
}
