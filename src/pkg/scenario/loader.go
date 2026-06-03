package scenario

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/config"
)

var startupSteps = []struct{ ID, Label string }{
	{"load", "加载场景插件"},
}

// LoadAll loads all enabled scenario packs at gateway startup.
func LoadAll(ctx context.Context, cfg *config.OpenOctaConfig, env func(string) string, broadcast ProgressBroadcaster) error {
	if env == nil {
		env = os.Getenv
	}
	installed := InstalledFromConfig(cfg)
	if len(installed) == 0 {
		return nil
	}
	store := DefaultJobStore()
	j := store.Create("startup_load", "", startupSteps)
	store.SetStepRunning(j.ID, "load", "", broadcast)
	DefaultRegistry().Reset()
	var firstErr error
	for id, entry := range installed {
		if entry.Enabled != nil && !*entry.Enabled {
			continue
		}
		if err := LoadPlugin(ctx, id, env, cfg); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	if firstErr != nil {
		store.FailJob(j.ID, "load", firstErr.Error(), broadcast)
		return firstErr
	}
	store.SetStepDone(j.ID, "load", fmt.Sprintf("%d plugins", len(installed)), broadcast)
	store.CompleteJob(j.ID, broadcast)
	return nil
}

// LoadPlugin registers one scenario pack into DefaultRegistry.
func LoadPlugin(ctx context.Context, pluginID string, env func(string) string, cfg *config.OpenOctaConfig) error {
	_ = ctx
	if env == nil {
		env = os.Getenv
	}
	paths := NewPaths(env)
	var entry config.ScenarioInstalledEntry
	if cfg != nil && cfg.Scenarios != nil && cfg.Scenarios.Installed != nil {
		entry = cfg.Scenarios.Installed[pluginID]
	}
	dataDir := entry.DataPath
	installDir := entry.InstallPath
	if dataDir == "" {
		dataDir = paths.DataDir(pluginID)
	}
	if installDir == "" {
		// guess latest version dir
		verDirs, _ := os.ReadDir(filepath.Join(paths.ScenariosRoot(), pluginID))
		if len(verDirs) > 0 {
			installDir = filepath.Join(paths.ScenariosRoot(), pluginID, verDirs[len(verDirs)-1].Name())
		}
	}
	rec, err := ReadRuntimeRecord(dataDir)
	if err != nil {
		rec = &RuntimeRecord{
			PluginID: pluginID, DataPath: dataDir, InstallPath: installDir, Enabled: true,
		}
	}
	skillDirs := []string{}
	skillsRoot := paths.SkillsDir(dataDir)
	if st, err := os.Stat(skillsRoot); err == nil && st.IsDir() {
		skillDirs = append(skillDirs, skillsRoot)
	}
	mcpMerged := map[string]map[string]interface{}{}
	mcpRaw, err := ReadMcpJSON(dataDir)
	if err == nil {
		servers, _ := mcpRaw["servers"].(map[string]interface{})
		for k, v := range servers {
			srv, ok := v.(map[string]interface{})
			if !ok {
				continue
			}
			prefixed := pluginID + ":" + k
			mcpMerged[prefixed] = srv
		}
	}
	DefaultRegistry().Register(pluginID, rec, skillDirs, mcpMerged)
	return nil
}

// Uninstall removes install + data dirs and registry entry.
func Uninstall(pluginID string, env func(string) string) error {
	if env == nil {
		env = os.Getenv
	}
	paths := NewPaths(env)
	dataDir := paths.DataDir(pluginID)
	installRoot := filepath.Join(paths.ScenariosRoot(), pluginID)
	DefaultRegistry().Unregister(pluginID)
	_ = os.RemoveAll(dataDir)
	_ = os.RemoveAll(installRoot)
	return PatchScenariosInstalled(env, func(m map[string]config.ScenarioInstalledEntry) map[string]config.ScenarioInstalledEntry {
		delete(m, pluginID)
		return m
	})
}

// McpServersForChat converts scenario registry MCP maps to McpServerEntry.
func McpServersForChat() map[string]config.McpServerEntry {
	raw := DefaultRegistry().McpServersCopy()
	out := make(map[string]config.McpServerEntry, len(raw))
	for k, v := range raw {
		entry := config.McpServerEntry{Enabled: true}
		if en, ok := v["enabled"].(bool); ok {
			entry.Enabled = en
		}
		if cmd, ok := v["command"].(string); ok {
			entry.Command = cmd
		}
		if args, ok := v["args"].([]interface{}); ok {
			for _, a := range args {
				if s, ok := a.(string); ok {
					entry.Args = append(entry.Args, s)
				}
			}
		}
		if envMap, ok := v["env"].(map[string]interface{}); ok {
			entry.Env = map[string]string{}
			for ek, ev := range envMap {
				if s, ok := ev.(string); ok {
					entry.Env[ek] = s
				}
			}
		}
		out[k] = entry
	}
	return out
}

// ParseMcpJSONFile reads servers from mcp.json path.
func ParseMcpJSONFile(path string) (map[string]config.McpServerEntry, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var root map[string]interface{}
	if err := json.Unmarshal(data, &root); err != nil {
		return nil, err
	}
	servers, _ := root["servers"].(map[string]interface{})
	out := map[string]config.McpServerEntry{}
	for k, v := range servers {
		b, _ := json.Marshal(v)
		var e config.McpServerEntry
		_ = json.Unmarshal(b, &e)
		out[k] = e
	}
	return out, nil
}

// IsEnabled returns whether plugin is enabled in config.
func IsEnabled(entry config.ScenarioInstalledEntry) bool {
	if entry.Enabled == nil {
		return true
	}
	return *entry.Enabled
}

// ActiveID returns active scenario id from config.
func ActiveID(cfg *config.OpenOctaConfig) string {
	if cfg == nil || cfg.Scenarios == nil || cfg.Scenarios.ActiveId == nil {
		return ""
	}
	return strings.TrimSpace(*cfg.Scenarios.ActiveId)
}
