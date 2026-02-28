// Package skills provides skill environment variable management.
package skills

import (
	"os"

	"github.com/openocta/openocta/pkg/config"
)

// ApplyEnvOverrides applies skill environment variable overrides.
// Returns a function to restore original environment.
func ApplyEnvOverrides(entries []Entry, cfg *config.OpenOctaConfig) func() {
	restore := make(map[string]string)

	for _, entry := range entries {
		if entry.Metadata == nil {
			continue
		}

		skillKey := resolveSkillKey(entry)
		skillConfig := resolveSkillConfig(cfg, skillKey)

		if skillConfig == nil {
			continue
		}

		// Apply env vars from skill config
		if skillConfig.Env != nil {
			for key, value := range skillConfig.Env {
				// Only set if not already set
				if os.Getenv(key) == "" {
					restore[key] = "" // Mark as unset originally
					os.Setenv(key, value)
				}
			}
		}

		// Apply apiKey to primaryEnv if applicable
		if skillConfig.APIKey != "" && entry.Metadata.PrimaryEnv != "" {
			key := entry.Metadata.PrimaryEnv
			if os.Getenv(key) == "" {
				if _, exists := restore[key]; !exists {
					restore[key] = "" // Mark as unset originally
				}
				os.Setenv(key, skillConfig.APIKey)
			}
		}
	}

	// Return restore function
	return func() {
		for key, originalValue := range restore {
			if originalValue == "" {
				os.Unsetenv(key)
			} else {
				os.Setenv(key, originalValue)
			}
		}
	}
}
