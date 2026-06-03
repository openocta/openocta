package http

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/scenario"
)

func (s *Server) scenarioBroadcast(job *scenario.Job) {
	if s.ctx == nil || s.ctx.Broadcast == nil {
		return
	}
	s.ctx.Broadcast("scenario.job.progress", job, nil)
}

func (s *Server) handleScenariosList(w http.ResponseWriter, r *http.Request) {
	installed := map[string]interface{}{}
	if s.ctx != nil && s.ctx.LoadConfigSnapshot != nil {
		if snap, err := s.ctx.LoadConfigSnapshot(); err == nil && snap.Config != nil {
			for id, e := range scenario.InstalledFromConfig(snap.Config) {
				b, _ := json.Marshal(e)
				var m map[string]interface{}
				_ = json.Unmarshal(b, &m)
				installed[id] = m
			}
		}
	}
	catalog := s.fetchScenarioCatalog(r)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"installed": installed,
		"catalog":   catalog,
	})
}

func (s *Server) fetchScenarioCatalog(r *http.Request) interface{} {
	base := s.siteAPIBaseURL()
	url := base + "/api/v1/scenarios"
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, url, nil)
	if err != nil {
		return s.embeddedScenarioCatalog()
	}
	client := newSiteAPIHTTPClient(siteAPIDefaultTimeout)
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			resp.Body.Close()
		}
		return s.embeddedScenarioCatalog()
	}
	defer resp.Body.Close()
	var out interface{}
	if json.NewDecoder(resp.Body).Decode(&out) == nil {
		return out
	}
	return s.embeddedScenarioCatalog()
}

func (s *Server) embeddedScenarioCatalog() interface{} {
	paths := scenario.NewPaths(os.Getenv)
	candidates := []string{
		filepath.Join("examples", "scenario-catalog.json"),
		filepath.Join("openocta", "examples", "scenario-catalog.json"),
	}
	for _, c := range candidates {
		if data, err := os.ReadFile(c); err == nil {
			var v interface{}
			if json.Unmarshal(data, &v) == nil {
				return v
			}
		}
	}
	_ = paths
	return map[string]interface{}{"items": []interface{}{}}
}

func (s *Server) handleScenarioDetail(w http.ResponseWriter, r *http.Request, id string) {
	id = strings.TrimSpace(id)
	paths := scenario.NewPaths(os.Getenv)
	dataDir := paths.DataDir(id)
	installRoot := filepath.Join(paths.ScenariosRoot(), id)
	var manifest *scenario.Manifest
	entries, _ := os.ReadDir(installRoot)
	if len(entries) > 0 {
		manifest, _ = scenario.LoadManifest(filepath.Join(installRoot, entries[len(entries)-1].Name()))
	}
	rec, _ := scenario.ReadRuntimeRecord(dataDir)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"id": id, "manifest": manifest, "runtime": rec,
	})
}

func (s *Server) handleScenarioConfig(w http.ResponseWriter, r *http.Request, pluginID string) {
	pluginID = strings.TrimSpace(pluginID)
	store := scenario.NewPluginConfigStore(os.Getenv)
	switch r.Method {
	case http.MethodGet:
		cfg, hash, err := store.Read(pluginID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"config": cfg, "hash": hash})
	case http.MethodPut:
		var body struct {
			Config map[string]interface{} `json:"config"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		hash, err := store.Write(pluginID, body.Config)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "hash": hash})
	case http.MethodPatch:
		var body struct {
			Patch map[string]interface{} `json:"patch"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		merged, hash, err := store.Patch(pluginID, body.Patch)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"config": merged, "hash": hash})
	case http.MethodPost:
		var body struct {
			Path  string      `json:"path"`
			Value interface{} `json:"value"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		merged, hash, err := store.SetPathValue(pluginID, body.Path, body.Value)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"config": merged, "hash": hash})
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleScenarioView(w http.ResponseWriter, r *http.Request, pluginID, subPath string) {
	paths := scenario.NewPaths(os.Getenv)
	installRoot := filepath.Join(paths.ScenariosRoot(), pluginID)
	entries, err := os.ReadDir(installRoot)
	if err != nil || len(entries) == 0 {
		http.NotFound(w, r)
		return
	}
	installDir := filepath.Join(installRoot, entries[len(entries)-1].Name())
	root := filepath.Join(installDir, "ui", "dist")
	if subPath == "" || subPath == "/" {
		subPath = "index.html"
	}
	clean := filepath.Clean(subPath)
	if strings.Contains(clean, "..") {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}
	full := filepath.Join(root, clean)
	if st, err := os.Stat(full); err != nil || st.IsDir() {
		http.NotFound(w, r)
		return
	}
	http.ServeFile(w, r, full)
}

func (s *Server) handleScenarioInstall(w http.ResponseWriter, r *http.Request, pluginID string) {
	var zipData []byte
	if ct := r.Header.Get("Content-Type"); strings.Contains(ct, "multipart") {
		_ = r.ParseMultipartForm(50 << 20)
		f, _, err := r.FormFile("file")
		if err == nil {
			zipData, _ = io.ReadAll(f)
			f.Close()
		}
	} else {
		zipData, _ = io.ReadAll(io.LimitReader(r.Body, 50<<20))
	}
	jobID := scenario.StartBootstrapAsync(r.Context(), pluginID, zipData, os.Getenv, s.scenarioBroadcast)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "jobId": jobID})
}

func (s *Server) handleScenarioDelete(w http.ResponseWriter, r *http.Request, pluginID string) {
	if err := scenario.Uninstall(pluginID, os.Getenv); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// clear activeId if needed
	_ = scenario.ClearActiveScenario(os.Getenv, pluginID)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
}

func (s *Server) handleScenarioJob(w http.ResponseWriter, r *http.Request, jobID string) {
	j, ok := scenario.DefaultJobStore().Get(jobID)
	if !ok {
		http.NotFound(w, r)
		return
	}
	_ = json.NewEncoder(w).Encode(j)
}

func (s *Server) handleScenarioActivate(w http.ResponseWriter, r *http.Request, pluginID string) {
	if err := scenario.SetActiveScenario(os.Getenv, pluginID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "activeId": pluginID})
}

func (s *Server) registerScenarioRoutes() {
	s.mux.HandleFunc("GET /api/v1/scenarios", s.requireGatewayToken(s.handleScenariosList))
	// Literal "install/jobs" avoids conflicting with "/api/v1/scenarios/{id}/config" when id="jobs".
	s.mux.HandleFunc("GET /api/v1/scenarios/install/jobs/{jobId}", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioJob(w, r, r.PathValue("jobId"))
	}))
	s.mux.HandleFunc("GET /api/v1/scenarios/{id}", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioDetail(w, r, r.PathValue("id"))
	}))
	s.mux.HandleFunc("GET /api/v1/scenarios/{id}/config", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioConfig(w, r, r.PathValue("id"))
	}))
	s.mux.HandleFunc("PUT /api/v1/scenarios/{id}/config", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioConfig(w, r, r.PathValue("id"))
	}))
	s.mux.HandleFunc("PATCH /api/v1/scenarios/{id}/config", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioConfig(w, r, r.PathValue("id"))
	}))
	s.mux.HandleFunc("POST /api/v1/scenarios/{id}/config", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioConfig(w, r, r.PathValue("id"))
	}))
	s.mux.HandleFunc("GET /api/v1/scenarios/{id}/view/{path...}", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioView(w, r, r.PathValue("id"), r.PathValue("path"))
	}))
	s.mux.HandleFunc("POST /api/v1/scenarios/{id}/install", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioInstall(w, r, r.PathValue("id"))
	}))
	s.mux.HandleFunc("POST /api/v1/scenarios/{id}/activate", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioActivate(w, r, r.PathValue("id"))
	}))
	s.mux.HandleFunc("DELETE /api/v1/scenarios/{id}", s.requireGatewayToken(func(w http.ResponseWriter, r *http.Request) {
		s.handleScenarioDelete(w, r, r.PathValue("id"))
	}))
}
