package scenario

import (
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/paths"
)

func loadMainConfigMap(env func(string) string) (string, map[string]interface{}, error) {
	stateDir := paths.ResolveStateDir(env)
	configPath := paths.ResolveConfigPath(env, stateDir)
	data, err := os.ReadFile(configPath)
	m := map[string]interface{}{}
	if err != nil {
		if os.IsNotExist(err) {
			return configPath, m, nil
		}
		return configPath, nil, err
	}
	if len(data) > 0 {
		_ = json.Unmarshal(data, &m)
	}
	if m == nil {
		m = map[string]interface{}{}
	}
	return configPath, m, nil
}

func writeMainConfigMap(path string, m map[string]interface{}) error {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return nil
}

// PatchScenariosInstalled updates scenarios.installed in main openocta.json.
func PatchScenariosInstalled(env func(string) string, updater func(map[string]config.ScenarioInstalledEntry) map[string]config.ScenarioInstalledEntry) error {
	configPath, m, err := loadMainConfigMap(env)
	if err != nil {
		return err
	}
	cfg, _ := config.Load(env)
	installed := map[string]config.ScenarioInstalledEntry{}
	if cfg != nil && cfg.Scenarios != nil && cfg.Scenarios.Installed != nil {
		installed = cfg.Scenarios.Installed
	}
	installed = updater(installed)
	var scenarios map[string]interface{}
	if raw, ok := m["scenarios"].(map[string]interface{}); ok {
		scenarios = raw
	} else {
		scenarios = map[string]interface{}{}
	}
	instMap := make(map[string]interface{}, len(installed))
	for id, e := range installed {
		b, _ := json.Marshal(e)
		var em map[string]interface{}
		_ = json.Unmarshal(b, &em)
		instMap[id] = em
	}
	scenarios["installed"] = instMap
	m["scenarios"] = scenarios
	return writeMainConfigMap(configPath, m)
}

// ClearActiveScenario removes activeId when it matches pluginID.
func ClearActiveScenario(env func(string) string, pluginID string) error {
	configPath, m, err := loadMainConfigMap(env)
	if err != nil {
		return err
	}
	sc, ok := m["scenarios"].(map[string]interface{})
	if !ok {
		return nil
	}
	if aid, ok := sc["activeId"].(string); ok && aid == pluginID {
		delete(sc, "activeId")
		m["scenarios"] = sc
		return writeMainConfigMap(configPath, m)
	}
	return nil
}

// SetActiveScenario sets scenarios.activeId.
func SetActiveScenario(env func(string) string, pluginID string) error {
	configPath, m, err := loadMainConfigMap(env)
	if err != nil {
		return err
	}
	sc, ok := m["scenarios"].(map[string]interface{})
	if !ok {
		sc = map[string]interface{}{}
	}
	sc["activeId"] = pluginID
	m["scenarios"] = sc
	return writeMainConfigMap(configPath, m)
}

func managedSkillsDir(env func(string) string) string {
	return filepath.Join(paths.ResolveStateDir(env), "skills")
}
