// Package http provides gateway token validation for HTTP API handlers.
package http

import (
	"net/http"
	"os"
	"strings"
)

const (
	headerAuthorization = "Authorization"
	headerGatewayToken  = "X-Gateway-Token"
	envGatewayToken     = "OPENOCTA_GATEWAY_TOKEN"
)

// gatewayHTTPAuthDisabled 为 true 时不校验 HTTP 网关令牌（全部放行）。需要恢复校验时改为 false。
const gatewayHTTPAuthDisabled = true

// getExpectedToken returns the gateway token from config or env.
// Config takes precedence; env OPENOCTA_GATEWAY_TOKEN overrides when set.
func (s *Server) getExpectedToken() string {
	if s.ctx != nil && s.ctx.LoadConfigSnapshot != nil {
		snap, err := s.ctx.LoadConfigSnapshot()
		if err == nil && snap != nil && snap.Config != nil &&
			snap.Config.Gateway != nil && snap.Config.Gateway.Auth != nil {
			t := strings.TrimSpace(snap.Config.Gateway.Auth.Token)
			if t != "" {
				return t
			}
		}
	}
	return strings.TrimSpace(os.Getenv(envGatewayToken))
}

// extractRequestToken extracts token from Authorization: Bearer <token> or X-Gateway-Token.
// Also accepts ?token= query param — the preview iframe navigation cannot attach
// headers, so the front-end appends the token to preview URLs (localFilePreviewUrl).
func extractRequestToken(r *http.Request) string {
	if ah := r.Header.Get(headerAuthorization); ah != "" {
		if strings.HasPrefix(strings.TrimSpace(ah), "Bearer ") {
			return strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(ah), "Bearer "))
		}
	}
	if t := strings.TrimSpace(r.Header.Get(headerGatewayToken)); t != "" {
		return t
	}
	if t := strings.TrimSpace(r.URL.Query().Get("token")); t != "" {
		return t
	}
	return ""
}

// validateGatewayToken returns true if the request has a valid token.
// When expectedToken is empty (no auth configured), allows all requests.
func (s *Server) validateGatewayToken(r *http.Request) bool {
	if gatewayHTTPAuthDisabled {
		return true
	}
	expected := s.getExpectedToken()
	if expected == "" {
		return true
	}
	got := extractRequestToken(r)
	return got != "" && got == expected
}

// writeTokenError writes 401 JSON response with a clear message.
func writeTokenError(w http.ResponseWriter) {
	setSiteProxyCORSHeaders(w)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = w.Write([]byte(`{"error":"网关令牌无效或未提供。请在 Control UI 的 Overview 中配置正确的 Gateway Token，或使用 openocta doctor --generate-gateway-token 生成。","code":"invalid_gateway_token"}`))
}

// requireGatewayToken wraps an http.HandlerFunc and validates the gateway token before calling it.
func (s *Server) requireGatewayToken(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.validateGatewayToken(r) {
			writeTokenError(w)
			return
		}
		next(w, r)
	}
}
