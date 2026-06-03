package scenario

import (
	"encoding/json"
	"os"
	"strings"
	"sync"

	"github.com/openocta/openocta/pkg/config"
)

// RuntimeRegistry holds loaded scenario plugin runtime state (skills dirs, MCP servers).
type RuntimeRegistry struct {
	mu sync.RWMutex

	PluginSkillDirs map[string][]string               // pluginId -> skill dir paths
	McpServers      map[string]map[string]interface{} // prefixed key -> server config
	Loaded          map[string]*RuntimeRecord
}

var defaultRegistry = &RuntimeRegistry{
	PluginSkillDirs: make(map[string][]string),
	McpServers:      make(map[string]map[string]interface{}),
	Loaded:          make(map[string]*RuntimeRecord),
}

// DefaultRegistry returns the process-wide scenario runtime registry.
func DefaultRegistry() *RuntimeRegistry {
	return defaultRegistry
}

func (r *RuntimeRegistry) Reset() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.PluginSkillDirs = make(map[string][]string)
	r.McpServers = make(map[string]map[string]interface{})
	r.Loaded = make(map[string]*RuntimeRecord)
}

func (r *RuntimeRegistry) Register(pluginID string, rec *RuntimeRecord, skillDirs []string, mcp map[string]map[string]interface{}) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if rec != nil {
		r.Loaded[pluginID] = rec
	}
	if len(skillDirs) > 0 {
		r.PluginSkillDirs[pluginID] = skillDirs
	} else {
		delete(r.PluginSkillDirs, pluginID)
	}
	for k, v := range mcp {
		r.McpServers[k] = v
	}
}

func (r *RuntimeRegistry) Unregister(pluginID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.Loaded, pluginID)
	delete(r.PluginSkillDirs, pluginID)
	prefix := pluginID + ":"
	for k := range r.McpServers {
		if strings.HasPrefix(k, prefix) {
			delete(r.McpServers, k)
		}
	}
}

func (r *RuntimeRegistry) AllSkillDirs() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var out []string
	for _, dirs := range r.PluginSkillDirs {
		out = append(out, dirs...)
	}
	return out
}

func (r *RuntimeRegistry) McpServersCopy() map[string]map[string]interface{} {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make(map[string]map[string]interface{}, len(r.McpServers))
	for k, v := range r.McpServers {
		cp := make(map[string]interface{}, len(v))
		for kk, vv := range v {
			cp[kk] = vv
		}
		out[k] = cp
	}
	return out
}

// InstalledFromConfig reads scenarios.installed from main config snapshot.
func InstalledFromConfig(cfg *config.OpenOctaConfig) map[string]config.ScenarioInstalledEntry {
	if cfg == nil || cfg.Scenarios == nil || cfg.Scenarios.Installed == nil {
		return nil
	}
	return cfg.Scenarios.Installed
}

// ReadMcpJSON loads mcp.json from data dir.
func ReadMcpJSON(dataDir string) (map[string]interface{}, error) {
	p := filepathJoinMcp(dataDir)
	data, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return map[string]interface{}{}, nil
		}
		return nil, err
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	if m == nil {
		m = map[string]interface{}{}
	}
	return m, nil
}

func filepathJoinMcp(dataDir string) string {
	return NewPaths(nil).McpPath(dataDir)
}
