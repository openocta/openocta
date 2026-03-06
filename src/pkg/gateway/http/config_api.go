// Package http provides config REST API handlers.
// Supports partial config updates (PATCH) for mcp, models, channels, etc.
package http

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/handlers"
)

// configPatchRequest is the JSON body for POST /api/config/patch.
type configPatchRequest struct {
	Patch    map[string]interface{} `json:"patch"`
	BaseHash string                 `json:"baseHash"`
}

// configPatchResponse is the JSON response.
type configPatchResponse struct {
	OK     bool                   `json:"ok"`
	Path   string                 `json:"path,omitempty"`
	Error  string                 `json:"error,omitempty"`
	Config *config.OpenOctaConfig `json:"config,omitempty"`
}

// configGetResponse is the JSON response for GET /api/config.
type configGetResponse struct {
	Path   string                 `json:"path"`
	Exists bool                   `json:"exists"`
	Hash   string                 `json:"hash,omitempty"`
	Valid  bool                   `json:"valid"`
	Config *config.OpenOctaConfig `json:"config,omitempty"`
	Issues []interface{}          `json:"issues,omitempty"`
}

// configEnvResponse is the JSON response for GET /api/config/env.
type configEnvResponse struct {
	Vars     map[string]string            `json:"vars"`
	ModelEnv map[string]map[string]string `json:"modelEnv"`
	ShellEnv *config.ShellEnvConfig       `json:"shellEnv"`
}

// handleConfigGet handles GET /api/config.
func (s *Server) handleConfigGet(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if s.ctx == nil || s.ctx.LoadConfigSnapshot == nil {
		writeConfigGetError(w, "config context not configured")
		return
	}

	snap, err := s.ctx.LoadConfigSnapshot()
	if err != nil {
		writeConfigGetError(w, "failed to load config: "+err.Error())
		return
	}

	w.WriteHeader(http.StatusOK)
	issues := make([]interface{}, 0, len(snap.Issues))
	for _, i := range snap.Issues {
		issues = append(issues, map[string]string{"path": i.Path, "message": i.Message})
	}
	_ = json.NewEncoder(w).Encode(configGetResponse{
		Path:   snap.Path,
		Exists: snap.Exists,
		Hash:   snap.Hash,
		Valid:  snap.Valid,
		Config: snap.Config,
		Issues: issues,
	})
}

func writeConfigGetError(w http.ResponseWriter, msg string) {
	w.WriteHeader(http.StatusInternalServerError)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// handleConfigEnv handles GET /api/config/env. Returns vars, modelEnv, and shellEnv separately.
func (s *Server) handleConfigEnv(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if s.ctx == nil || s.ctx.LoadConfigSnapshot == nil {
		writeConfigGetError(w, "config context not configured")
		return
	}

	snap, err := s.ctx.LoadConfigSnapshot()
	if err != nil {
		writeConfigGetError(w, "failed to load config: "+err.Error())
		return
	}

	res := configEnvResponse{
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

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(res)
}

// handleConfigPatch handles POST /api/config/patch.
// Accepts JSON body: { "patch": {...}, "baseHash": "..." }.
// Patch is merged into current config, validated, and written to ~/.openocta/openocta.json
// (or %APPDATA%\openocta\openocta.json on Windows).
func (s *Server) handleConfigPatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if s.ctx == nil || s.ctx.LoadConfigSnapshot == nil {
		writeConfigPatchError(w, "config context not configured")
		return
	}

	var req configPatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeConfigPatchError(w, "invalid JSON: "+err.Error())
		return
	}
	if req.Patch == nil {
		writeConfigPatchError(w, "patch object required")
		return
	}
	if req.BaseHash == "" {
		writeConfigPatchError(w, "baseHash required; call config.get first and retry")
		return
	}

	snap, err := s.ctx.LoadConfigSnapshot()
	if err != nil {
		writeConfigPatchError(w, "failed to load config: "+err.Error())
		return
	}
	if snap.Hash != "" && snap.Hash != req.BaseHash {
		writeConfigPatchError(w, "config changed since last load; re-run config.get and retry")
		return
	}
	if !snap.Valid {
		writeConfigPatchError(w, "invalid config; fix before patching")
		return
	}

	// Use raw file content as base to preserve all keys (struct marshal drops omitempty/extra keys)
	baseMap := handlers.ConfigSnapshotToMap(snap)
	merged := mergePatchForAPI(baseMap, req.Patch)
	data, err := json.MarshalIndent(merged, "", "  ")
	if err != nil {
		writeConfigPatchError(w, err.Error())
		return
	}

	if err := os.WriteFile(snap.Path, data, 0600); err != nil {
		writeConfigPatchError(w, "failed to write config: "+err.Error())
		return
	}

	var cfg config.OpenOctaConfig
	_ = json.Unmarshal(data, &cfg) // best-effort for response; extra keys ignored
	s.ctx.Config = &cfg
	// 若 patch 包含 channels，热重载渠道运行时
	if _, hasChannels := req.Patch["channels"]; hasChannels && s.ctx.ReloadChannelRuntimes != nil {
		s.ctx.ReloadChannelRuntimes()
	}
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(configPatchResponse{
		OK:     true,
		Path:   snap.Path,
		Config: &cfg,
	})
}

func writeConfigPatchError(w http.ResponseWriter, msg string) {
	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(configPatchResponse{OK: false, Error: msg})
}

func mergePatchForAPI(base, patch map[string]interface{}) map[string]interface{} {
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
			result["env"] = mergePatchEnvForAPI(baseEnv, patchEnv)
			continue
		}
		baseVal, baseOk := result[k].(map[string]interface{})
		patchVal, patchOk := v.(map[string]interface{})
		if baseOk && patchOk {
			result[k] = mergePatchForAPI(baseVal, patchVal)
		} else {
			result[k] = v
		}
	}
	return result
}

func mergePatchEnvForAPI(base, patch map[string]interface{}) map[string]interface{} {
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
			result[k] = mergePatchForAPI(baseVal, patchVal)
		} else {
			result[k] = v
		}
	}
	return result
}
