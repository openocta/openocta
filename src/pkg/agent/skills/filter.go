// Package skills provides skill filtering and eligibility checking.
package skills

import (
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/openocta/openocta/pkg/config"
)

// EligibilityContext provides context for skill eligibility checking.
type EligibilityContext struct {
	Remote *RemoteEligibility
}

// RemoteEligibility provides remote eligibility checks.
type RemoteEligibility struct {
	Platforms []string
	HasBin    func(string) bool
	HasAnyBin func([]string) bool
	Note      string
}

// ShouldInclude checks if a skill entry should be included based on config and eligibility.
func ShouldInclude(entry Entry, cfg *config.OpenOctaConfig, eligibility *EligibilityContext) bool {
	skillKey := resolveSkillKey(entry)
	skillConfig := resolveSkillConfig(cfg, skillKey)
	allowBundled := resolveBundledAllowlist(cfg)
	osList := entry.Metadata.OS

	var remotePlatforms []string
	if eligibility != nil && eligibility.Remote != nil {
		remotePlatforms = eligibility.Remote.Platforms
	}

	// Check if disabled
	if skillConfig != nil && skillConfig.Enabled != nil && !*skillConfig.Enabled {
		return false
	}

	// Check bundled allowlist
	if !isBundledSkillAllowed(entry, allowBundled) {
		return false
	}

	// Check OS requirements
	if len(osList) > 0 {
		currentPlatform := runtime.GOOS
		found := false
		for _, osName := range osList {
			if osName == currentPlatform {
				found = true
				break
			}
		}
		if !found {
			// Check remote platforms
			remoteFound := false
			for _, platform := range remotePlatforms {
				for _, osName := range osList {
					if osName == platform {
						remoteFound = true
						break
					}
				}
				if remoteFound {
					break
				}
			}
			if !remoteFound {
				return false
			}
		}
	}

	// Always include if marked as always
	if entry.Metadata != nil && entry.Metadata.Always != nil && *entry.Metadata.Always {
		return true
	}

	// Check required bins
	if entry.Metadata != nil && entry.Metadata.Requires != nil {
		for _, bin := range entry.Metadata.Requires.Bins {
			if !hasBinary(bin) {
				if eligibility == nil || eligibility.Remote == nil || eligibility.Remote.HasBin == nil {
					return false
				}
				if !eligibility.Remote.HasBin(bin) {
					return false
				}
			}
		}

		// Check anyBins
		if len(entry.Metadata.Requires.AnyBins) > 0 {
			anyFound := false
			for _, bin := range entry.Metadata.Requires.AnyBins {
				if hasBinary(bin) {
					anyFound = true
					break
				}
			}
			if !anyFound {
				if eligibility == nil || eligibility.Remote == nil || eligibility.Remote.HasAnyBin == nil {
					return false
				}
				if !eligibility.Remote.HasAnyBin(entry.Metadata.Requires.AnyBins) {
					return false
				}
			}
		}

		// Check required env
		for _, envName := range entry.Metadata.Requires.Env {
			if os.Getenv(envName) == "" {
				if skillConfig == nil || skillConfig.Env == nil || skillConfig.Env[envName] == "" {
					if skillConfig == nil || skillConfig.APIKey == "" || entry.Metadata.PrimaryEnv != envName {
						return false
					}
				}
			}
		}

		// Check required config
		for _, configPath := range entry.Metadata.Requires.Config {
			if !isConfigPathTruthy(cfg, configPath) {
				return false
			}
		}
	}

	return true
}

// resolveSkillKey resolves the skill key (metadata.skillKey or name).
func resolveSkillKey(entry Entry) string {
	if entry.Metadata != nil && entry.Metadata.SkillKey != "" {
		return entry.Metadata.SkillKey
	}
	return entry.Name
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

// resolveBundledAllowlist resolves the bundled skills allowlist.
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

// isBundledSkillAllowed checks if a bundled skill is allowed.
func isBundledSkillAllowed(entry Entry, allowlist []string) bool {
	if len(allowlist) == 0 {
		return true
	}
	if entry.Source != "openclaw-bundled" {
		return true
	}
	skillKey := resolveSkillKey(entry)
	for _, allowed := range allowlist {
		if allowed == entry.Name || allowed == skillKey {
			return true
		}
	}
	return false
}

// hasBinary checks if a binary exists in PATH.
func hasBinary(bin string) bool {
	_, err := exec.LookPath(bin)
	return err == nil
}

// isConfigPathTruthy checks if a config path value is truthy.
func isConfigPathTruthy(cfg *config.OpenOctaConfig, pathStr string) bool {
	// Simplified implementation
	// TODO: Full config path resolution
	defaultValues := map[string]bool{
		"browser.enabled":         true,
		"browser.evaluateEnabled": true,
	}
	if defaultValue, ok := defaultValues[pathStr]; ok {
		return defaultValue
	}
	return false
}

// FilterEntries filters skill entries based on config and eligibility.
func FilterEntries(entries []Entry, cfg *config.OpenOctaConfig, eligibility *EligibilityContext) []Entry {
	var filtered []Entry
	for _, entry := range entries {
		if ShouldInclude(entry, cfg, eligibility) {
			filtered = append(filtered, entry)
		}
	}
	return filtered
}
