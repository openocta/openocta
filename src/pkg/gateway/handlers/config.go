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
	currentMap := configToMap(snap.Config)
	merged := mergePatch(currentMap, patch)
	mergedJSON, err := json.Marshal(merged)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}
	var cfg config.OpenOctaConfig
	if err := json.Unmarshal(mergedJSON, &cfg); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "merged config invalid: " + err.Error(),
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
	opts.Respond(true, map[string]interface{}{
		"ok":     true,
		"path":   snap.Path,
		"config": cfg,
	}, nil, nil)
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
