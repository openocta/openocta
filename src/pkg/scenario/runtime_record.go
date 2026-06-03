package scenario

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// RuntimeRecord is persisted at scenario-data/<id>/runtime.json.
type RuntimeRecord struct {
	PluginID    string    `json:"pluginId"`
	Version     string    `json:"version"`
	InstallPath string    `json:"installPath"`
	DataPath    string    `json:"dataPath"`
	InstalledAt time.Time `json:"installedAt"`
	Enabled     bool      `json:"enabled"`
}

func ReadRuntimeRecord(dataDir string) (*RuntimeRecord, error) {
	p := filepath.Join(dataDir, runtimeFilename)
	data, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	var rec RuntimeRecord
	if err := json.Unmarshal(data, &rec); err != nil {
		return nil, fmt.Errorf("parse runtime.json: %w", err)
	}
	return &rec, nil
}

func WriteRuntimeRecord(dataDir string, rec *RuntimeRecord) error {
	if rec == nil {
		return fmt.Errorf("nil runtime record")
	}
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(rec, "", "  ")
	if err != nil {
		return err
	}
	p := filepath.Join(dataDir, runtimeFilename)
	tmp := p + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	if err := os.Rename(tmp, p); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return nil
}
