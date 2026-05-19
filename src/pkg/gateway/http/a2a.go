package http

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/openocta/openocta/pkg/a2a/card"
	"github.com/openocta/openocta/pkg/gateway/handlers"
)

func a2aAgentCardExposed(cfgEnabled bool) bool {
	if cfgEnabled {
		return true
	}
	v := strings.TrimSpace(os.Getenv("OPENOCTA_A2A_AGENT_CARD"))
	return v == "1" || strings.EqualFold(v, "true") || strings.EqualFold(v, "yes")
}

func (s *Server) handleWellKnownAgentJSON(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	cfgEnabled := s.ctx != nil && handlers.IsAgentToAgentEnabled(s.ctx.Config)
	if !a2aAgentCardExposed(cfgEnabled) {
		http.NotFound(w, r)
		return
	}
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	host := r.Host
	if host == "" {
		host = "127.0.0.1:18900"
	}
	baseURL := scheme + "://" + host
	agentID := "main"
	ac := card.Build(card.BuildOpts{
		Name:    "OpenOcta",
		AgentID: agentID,
		URL:     baseURL,
	})
	w.Header().Set("Content-Type", "application/json")
	if r.Method == http.MethodHead {
		w.WriteHeader(http.StatusOK)
		return
	}
	_ = json.NewEncoder(w).Encode(ac)
}
