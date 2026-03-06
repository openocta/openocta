package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"time"

	"github.com/openocta/openocta/embed"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/paths"
	"github.com/openocta/openocta/pkg/version"
)

func configHash(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

// ConfigSnapshot is the config.get response (compatible with protocol).
type ConfigSnapshot struct {
	Path         string                  `json:"path"`
	Exists       bool                    `json:"exists"`
	Raw          string                  `json:"raw,omitempty"`
	Parsed       interface{}             `json:"parsed,omitempty"`
	Valid        bool                    `json:"valid"`
	Config       *config.OpenOctaConfig  `json:"config"`
	Hash         string                  `json:"hash,omitempty"`
	Issues       []ConfigValidationIssue `json:"issues"`
	Warnings     []ConfigValidationIssue `json:"warnings"`
	LegacyIssues []LegacyConfigIssue     `json:"legacyIssues"`
}

// ConfigValidationIssue is a validation error.
type ConfigValidationIssue struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

// LegacyConfigIssue is a legacy config issue.
type LegacyConfigIssue struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

// ConfigEnvResponse is the config.env response. Returns env-related config in three separate sections.
type ConfigEnvResponse struct {
	Vars     map[string]string            `json:"vars"`
	ModelEnv map[string]map[string]string `json:"modelEnv"`
	ShellEnv *config.ShellEnvConfig       `json:"shellEnv"`
}

// ConfigEnvHandler handles "config.env". Returns vars, modelEnv, and shellEnv separately.
func ConfigEnvHandler(opts HandlerOpts) error {
	ctx := opts.Context
	if ctx == nil || ctx.LoadConfigSnapshot == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config context not configured",
		}, nil)
		return nil
	}
	snap, err := ctx.LoadConfigSnapshot()
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}
	res := ConfigEnvResponse{
		Vars:     map[string]string{},
		ModelEnv: map[string]map[string]string{},
		ShellEnv: nil,
	}
	if snap.Config != nil && snap.Config.Env != nil {
		if snap.Config.Env.Vars != nil {
			res.Vars = snap.Config.Env.Vars
		}
		if snap.Config.Env.ModelEnv != nil {
			res.ModelEnv = snap.Config.Env.ModelEnv
		}
		res.ShellEnv = snap.Config.Env.ShellEnv
	}
	opts.Respond(true, res, nil, nil)
	return nil
}

// ConfigGetHandler handles "config.get".
func ConfigGetHandler(opts HandlerOpts) error {
	ctx := opts.Context
	if ctx == nil || ctx.LoadConfigSnapshot == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config context not configured",
		}, nil)
		return nil
	}
	snap, err := ctx.LoadConfigSnapshot()
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}
	opts.Respond(true, snap, nil, nil)
	return nil
}

// ConfigSchemaResponse is the config.schema response (compatible with protocol).
// Frontend expects { schema, uiHints, version, generatedAt }.
type ConfigSchemaResponse struct {
	Schema      map[string]interface{} `json:"schema"`
	UIHints     map[string]interface{} `json:"uiHints"`
	Version     string                 `json:"version"`
	GeneratedAt string                 `json:"generatedAt"`
}

// ConfigSchemaHandler handles "config.schema".
func ConfigSchemaHandler(opts HandlerOpts) error {
	// Phase 2e: return ConfigSchemaResponse format (schema wrapped, not raw).
	// Frontend applyConfigSchema expects res.schema, res.uiHints, res.version.
	data, err := os.ReadFile("./config-schema.json")
	if err != nil {
		data, err = embed.ConfigSchemaJSON()
		if err != nil {
			data = []byte("{}")
		}
	}
	schemaConfig := map[string]interface{}{}
	err = json.Unmarshal(data, &schemaConfig)
	schema := map[string]interface{}{}
	uiHints := map[string]interface{}{}
	if err != nil {
		schema = map[string]interface{}{}
		uiHints = map[string]interface{}{}
	} else {
		schema = schemaConfig["schema"].(map[string]interface{})
		uiHints = schemaConfig["uiHints"].(map[string]interface{})
	}

	res := ConfigSchemaResponse{
		Schema:      schema,
		UIHints:     uiHints,
		Version:     version.Version,
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
	}
	opts.Respond(true, res, nil, nil)
	return nil
}

// ConfigSetHandler handles "config.set". Writes raw config after validating baseHash.
func ConfigSetHandler(opts HandlerOpts) error {
	ctx := opts.Context
	if ctx == nil || ctx.LoadConfigSnapshot == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config context not configured",
		}, nil)
		return nil
	}
	snap, err := ctx.LoadConfigSnapshot()
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}
	baseHash, _ := opts.Params["baseHash"].(string)
	if baseHash == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "config base hash required; re-run config.get and retry",
		}, nil)
		return nil
	}
	if snap.Hash != "" && snap.Hash != baseHash {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "config changed since last load; re-run config.get and retry",
		}, nil)
		return nil
	}
	raw, _ := opts.Params["raw"].(string)
	if raw == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid config.set params: raw (string) required",
		}, nil)
		return nil
	}
	var cfg config.OpenOctaConfig
	if err := json.Unmarshal([]byte(raw), &cfg); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid config JSON: " + err.Error(),
		}, nil)
		return nil
	}
	data, err := json.MarshalIndent(&cfg, "", "  ")
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}
	if err := os.WriteFile(snap.Path, data, 0600); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "failed to write config: " + err.Error(),
		}, nil)
		return nil
	}
	// Update context.Config.
	opts.Context.Config = &cfg
	opts.Respond(true, map[string]interface{}{
		"ok":     true,
		"path":   snap.Path,
		"config": cfg,
	}, nil, nil)
	return nil
}

// ConfigApplyHandler handles "config.apply". Same as config.set (writes config).
func ConfigApplyHandler(opts HandlerOpts) error {
	return ConfigSetHandler(opts)
}

// ConfigPatchHandler handles "config.patch". Merges patch into current config and writes.
func ConfigPatchHandler(opts HandlerOpts) error {
	ctx := opts.Context
	if ctx == nil || ctx.LoadConfigSnapshot == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config context not configured",
		}, nil)
		return nil
	}
	snap, err := ctx.LoadConfigSnapshot()
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}
	baseHash, _ := opts.Params["baseHash"].(string)
	if baseHash == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "config base hash required; re-run config.get and retry",
		}, nil)
		return nil
	}
	if snap.Hash != "" && snap.Hash != baseHash {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "config changed since last load; re-run config.get and retry",
		}, nil)
		return nil
	}
	if !snap.Valid {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid config; fix before patching",
		}, nil)
		return nil
	}
	raw, _ := opts.Params["raw"].(string)
	if raw == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid config.patch params: raw (string) required",
		}, nil)
		return nil
	}
	var patch map[string]interface{}
	if err := json.Unmarshal([]byte(raw), &patch); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid config.patch raw: " + err.Error(),
		}, nil)
		return nil
	}
	if patch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "config.patch raw must be an object",
		}, nil)
		return nil
	}
	// Use raw file content as base to preserve all keys (struct marshal drops omitempty/extra keys)
	baseMap := ConfigSnapshotToMap(snap)
	merged := mergePatch(baseMap, patch)
	data, err := json.MarshalIndent(merged, "", "  ")
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}
	if err := os.WriteFile(snap.Path, data, 0600); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "failed to write config: " + err.Error(),
		}, nil)
		return nil
	}
	var cfg config.OpenOctaConfig
	_ = json.Unmarshal(data, &cfg) // best-effort for response; extra keys ignored
	if opts.Context != nil {
		opts.Context.Config = &cfg
		// 若 patch 包含 channels，热重载渠道运行时（停止旧连接，按新配置重新创建）
		if _, hasChannels := patch["channels"]; hasChannels && opts.Context.ReloadChannelRuntimes != nil {
			opts.Context.ReloadChannelRuntimes()
		}
	}
	opts.Respond(true, map[string]interface{}{
		"ok":     true,
		"path":   snap.Path,
		"config": cfg,
	}, nil, nil)
	return nil
}

// ConfigSnapshotToMap returns the config as map from raw file content to preserve all keys.
func ConfigSnapshotToMap(snap *ConfigSnapshot) map[string]interface{} {
	if snap == nil {
		return map[string]interface{}{}
	}
	if m, ok := snap.Parsed.(map[string]interface{}); ok {
		result := make(map[string]interface{}, len(m))
		for k, v := range m {
			result[k] = v
		}
		return result
	}
	if snap.Raw != "" {
		var m map[string]interface{}
		if err := json.Unmarshal([]byte(snap.Raw), &m); err == nil {
			return m
		}
	}
	return map[string]interface{}{}
}

// WriteConfigMap writes a config map to the given path, preserving all keys.
func WriteConfigMap(path string, m map[string]interface{}) error {
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return err
	}
	tmpPath := path + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0600); err != nil {
		return err
	}
	if err := os.Rename(tmpPath, path); err != nil {
		_ = os.Remove(tmpPath)
		return err
	}
	return nil
}

func configToMap(cfg *config.OpenOctaConfig) map[string]interface{} {
	if cfg == nil {
		return map[string]interface{}{}
	}
	data, err := json.Marshal(cfg)
	if err != nil {
		return map[string]interface{}{}
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		return map[string]interface{}{}
	}
	return m
}

func mergePatch(base, patch map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range base {
		result[k] = v
	}
	for k, v := range patch {
		if v == nil {
			delete(result, k)
			continue
		}
		if k == "env" {
			baseEnv, _ := result["env"].(map[string]interface{})
			patchEnv, ok := v.(map[string]interface{})
			if !ok {
				result[k] = v
				continue
			}
			result["env"] = mergePatchEnv(baseEnv, patchEnv)
			continue
		}
		baseVal, baseOk := result[k].(map[string]interface{})
		patchVal, patchOk := v.(map[string]interface{})
		if baseOk && patchOk {
			result[k] = mergePatch(baseVal, patchVal)
		} else {
			result[k] = v
		}
	}
	return result
}

// mergePatchEnv merges env with special handling: modelEnv uses replace-per-modelRef (not recursive merge).
func mergePatchEnv(base, patch map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	for k, v := range base {
		result[k] = v
	}
	for k, v := range patch {
		if v == nil {
			delete(result, k)
			continue
		}
		if k == "modelEnv" {
			baseModelEnv, _ := result["modelEnv"].(map[string]interface{})
			patchModelEnv, ok := v.(map[string]interface{})
			if !ok {
				result[k] = v
				continue
			}
			merged := make(map[string]interface{})
			for kk, vv := range baseModelEnv {
				merged[kk] = vv
			}
			for kk, vv := range patchModelEnv {
				if vv == nil {
					delete(merged, kk)
				} else {
					merged[kk] = vv
				}
			}
			result["modelEnv"] = merged
			continue
		}
		baseVal, baseOk := result[k].(map[string]interface{})
		patchVal, patchOk := v.(map[string]interface{})
		if baseOk && patchOk {
			result[k] = mergePatch(baseVal, patchVal)
		} else {
			result[k] = v
		}
	}
	return result
}

// loadConfigSnapshot loads config and returns a snapshot (used by Context).
func LoadConfigSnapshot(env func(string) string) (*ConfigSnapshot, error) {
	stateDir := paths.ResolveStateDir(env)
	configPath := paths.ResolveConfigPath(env, stateDir)
	data, err := os.ReadFile(configPath)
	exists := err == nil
	raw := ""
	if exists {
		raw = string(data)
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	cfg, err := config.Load(env)
	if err != nil {
		return &ConfigSnapshot{
			Path:         configPath,
			Exists:       exists,
			Raw:          raw,
			Hash:         configHash(raw),
			Valid:        false,
			Config:       &config.OpenOctaConfig{},
			Issues:       []ConfigValidationIssue{{Path: "", Message: err.Error()}},
			Warnings:     []ConfigValidationIssue{},
			LegacyIssues: []LegacyConfigIssue{},
		}, nil
	}
	var parsed interface{}
	if len(raw) > 0 {
		_ = json.Unmarshal([]byte(raw), &parsed)
	}
	return &ConfigSnapshot{
		Path:         configPath,
		Exists:       exists,
		Raw:          raw,
		Hash:         configHash(raw),
		Parsed:       parsed,
		Valid:        true,
		Config:       cfg,
		Issues:       []ConfigValidationIssue{},
		Warnings:     []ConfigValidationIssue{},
		LegacyIssues: []LegacyConfigIssue{},
	}, nil
}
