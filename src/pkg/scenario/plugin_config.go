package scenario

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
)

// PluginConfigStore reads/writes scenario-data/<id>/config.json.
type PluginConfigStore struct {
	paths *Paths
}

func NewPluginConfigStore(env func(string) string) *PluginConfigStore {
	return &PluginConfigStore{paths: NewPaths(env)}
}

func (s *PluginConfigStore) configPath(pluginID string) string {
	return s.paths.ConfigPath(s.paths.DataDir(pluginID))
}

// Read loads config.json; missing file returns empty map.
func (s *PluginConfigStore) Read(pluginID string) (map[string]interface{}, string, error) {
	p := s.configPath(pluginID)
	data, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return map[string]interface{}{}, hashBytes(nil), nil
		}
		return nil, "", err
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, "", fmt.Errorf("parse config: %w", err)
	}
	if m == nil {
		m = map[string]interface{}{}
	}
	return m, hashBytes(data), nil
}

// Write persists config and returns new hash.
func (s *PluginConfigStore) Write(pluginID string, cfg map[string]interface{}) (string, error) {
	if cfg == nil {
		cfg = map[string]interface{}{}
	}
	if err := os.MkdirAll(s.paths.DataDir(pluginID), 0755); err != nil {
		return "", err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return "", err
	}
	p := s.configPath(pluginID)
	tmp := p + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return "", err
	}
	if err := os.Rename(tmp, p); err != nil {
		_ = os.Remove(tmp)
		return "", err
	}
	return hashBytes(data), nil
}

// Patch merges patch into stored config.
func (s *PluginConfigStore) Patch(pluginID string, patch map[string]interface{}) (map[string]interface{}, string, error) {
	base, _, err := s.Read(pluginID)
	if err != nil {
		return nil, "", err
	}
	merged := MergePatch(base, patch)
	h, err := s.Write(pluginID, merged)
	return merged, h, err
}

// SetPathValue sets a single path and saves.
func (s *PluginConfigStore) SetPathValue(pluginID, path string, value interface{}) (map[string]interface{}, string, error) {
	base, _, err := s.Read(pluginID)
	if err != nil {
		return nil, "", err
	}
	if err := SetPath(base, path, value); err != nil {
		return nil, "", err
	}
	h, err := s.Write(pluginID, base)
	return base, h, err
}

func hashBytes(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}
