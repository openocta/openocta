package http

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/handlers"
	"github.com/openocta/openocta/pkg/logging"
)

var hooksLog = logging.Sub("hooks")

// writeHooksError 写入 JSON 格式的 hooks 错误响应。
func writeHooksError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	b, _ := json.Marshal(map[string]string{"error": message})
	_, _ = w.Write(b)
}

// extractHooksToken 从请求中提取 hook 令牌。
// 优先级：Authorization: Bearer <token> > x-openclaw-token > ?token=<token>（已弃用）。
// 参考：https://docs.openclaw.ai/zh-CN/automation/webhook
func extractHooksToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
	}
	if got := strings.TrimSpace(r.Header.Get("X-OpenOcta-Token")); got != "" {
		return got
	}
	if got := strings.TrimSpace(r.URL.Query().Get("token")); got != "" {
		hooksLog.Warn("query param ?token= is deprecated; use Authorization: Bearer or x-openclaw-token header")
		return got
	}
	return ""
}

// hooksPayloadWake is the body for POST /hooks/wake.
type hooksPayloadWake struct {
	Text string `json:"text"`
	Mode string `json:"mode"` // "now" | "next-heartbeat"
}

// hooksPayloadAgent is the body for POST /hooks/agent.
type hooksPayloadAgent struct {
	Message        string `json:"message"`
	Name           string `json:"name"`
	WakeMode       string `json:"wakeMode"`
	SessionKey     string `json:"sessionKey"`
	Deliver        bool   `json:"deliver"`
	Channel        string `json:"channel"`
	To             string `json:"to"`
	Model          string `json:"model"`
	Thinking       string `json:"thinking"`
	TimeoutSeconds *int   `json:"timeoutSeconds"`
}

// hooksPayloadAlert is the body for POST /hooks/alert.
// It is designed to be flexible for different third-party alert sources.
type hooksPayloadAlert struct {
	// Optional high-level fields
	AlertID  string `json:"alertId"`
	Title    string `json:"title"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
	Source   string `json:"source"`
	// Arbitrary original payload from the alert source
	Data map[string]interface{} `json:"data"`
}

func (s *Server) handleHooks(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ctx := s.ctx
	if ctx == nil || ctx.Config == nil || ctx.Config.Hooks == nil {
		writeHooksError(w, http.StatusNotFound, "hooks not configured")
		return
	}
	cfg := ctx.Config.Hooks

	// 1) 若 HooksConfig.Enabled 为 false，直接返回 403
	if cfg.Enabled != nil && !*cfg.Enabled {
		writeHooksError(w, http.StatusForbidden, "hooks disabled")
		return
	}

	// 2) 若配置了 Token，则从请求头（及查询参数）获取并校验
	if cfg.Token != nil {
		token := strings.TrimSpace(*cfg.Token)
		if token != "" {
			got := extractHooksToken(r)
			if got != token {
				writeHooksError(w, http.StatusUnauthorized, "unauthorized")
				return
			}
		}
	}

	pathPrefix := "/hooks"
	if cfg.Path != nil && *cfg.Path != "" {
		pathPrefix = strings.TrimSuffix(*cfg.Path, "/")
	}
	path := r.URL.Path
	if pathPrefix != "" && !strings.HasPrefix(path, pathPrefix) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	subpath := strings.TrimPrefix(path, pathPrefix)
	subpath = strings.TrimPrefix(subpath, "/")
	subpath = strings.ToLower(subpath)

	switch subpath {
	case "wake":
		s.handleHooksWake(w, r, ctx)
		return
	case "agent":
		s.handleHooksAgent(w, r, ctx)
		return
	case "alert":
		s.handleHooksAlert(w, r, ctx)
		return
	}
	// Try mapping by path (config.HookMappingConfig)
	if cfg.Mappings != nil {
		for i := range cfg.Mappings {
			m := &cfg.Mappings[i]
			if m.Match != nil && m.Match.Path != nil && *m.Match.Path == subpath {
				action := "wake"
				if m.Action != nil {
					action = *m.Action
				}
				if action == "agent" {
					s.handleHooksAgentWithMapping(w, r, ctx, m)
					return
				}
				s.handleHooksWakeWithMapping(w, r, ctx, m)
				return
			}
		}
	}
	http.Error(w, "not found", http.StatusNotFound)
}

func (s *Server) handleHooksWake(w http.ResponseWriter, r *http.Request, ctx *handlers.Context) {
	var body hooksPayloadWake
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	text := strings.TrimSpace(body.Text)
	mode := body.Mode
	if mode == "" {
		mode = "next-heartbeat"
	}
	if mode != "now" && mode != "next-heartbeat" {
		mode = "next-heartbeat"
	}
	if ctx.HooksWake != nil {
		ctx.HooksWake(text, mode)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
		return
	}
	hooksLog.Warn("hooks wake not implemented (no HooksWake callback)")
	w.WriteHeader(http.StatusNotImplemented)
}

func (s *Server) handleHooksWakeWithMapping(w http.ResponseWriter, r *http.Request, ctx *handlers.Context, m *config.HookMappingConfig) {
	// Simplified: use text from body or template
	var body struct {
		Text string `json:"text"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	text := body.Text
	if m.TextTemplate != nil {
		text = *m.TextTemplate
	}
	mode := "next-heartbeat"
	if m.WakeMode != nil {
		mode = *m.WakeMode
	}
	if ctx.HooksWake != nil {
		ctx.HooksWake(text, mode)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
		return
	}
	w.WriteHeader(http.StatusNotImplemented)
}

func (s *Server) handleHooksAgent(w http.ResponseWriter, r *http.Request, ctx *handlers.Context) {
	var body hooksPayloadAgent
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	message := strings.TrimSpace(body.Message)
	if message == "" {
		http.Error(w, "message required", http.StatusBadRequest)
		return
	}
	if ctx.HooksAgent != nil {
		runID := ctx.HooksAgent(handlers.HooksAgentParams{
			Message:        message,
			Name:           body.Name,
			WakeMode:       body.WakeMode,
			SessionKey:     body.SessionKey,
			Deliver:        body.Deliver,
			Channel:        body.Channel,
			To:             body.To,
			Model:          body.Model,
			Thinking:       body.Thinking,
			TimeoutSeconds: body.TimeoutSeconds,
		})
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_, _ = w.Write([]byte(`{"runId":"` + runID + `"}`))
		return
	}
	hooksLog.Warn("hooks agent not implemented (no HooksAgent callback)")
	w.WriteHeader(http.StatusNotImplemented)
}

func (s *Server) handleHooksAgentWithMapping(w http.ResponseWriter, r *http.Request, ctx *handlers.Context, m *config.HookMappingConfig) {
	var body struct {
		Message string `json:"message"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	message := body.Message
	if m.MessageTemplate != nil {
		message = *m.MessageTemplate
	}
	if message == "" {
		http.Error(w, "message required", http.StatusBadRequest)
		return
	}
	if ctx.HooksAgent != nil {
		p := handlers.HooksAgentParams{Message: message}
		if m.Name != nil {
			p.Name = *m.Name
		}
		if m.WakeMode != nil {
			p.WakeMode = *m.WakeMode
		}
		if m.SessionKey != nil {
			p.SessionKey = *m.SessionKey
		}
		if m.Deliver != nil {
			p.Deliver = *m.Deliver
		}
		if m.Channel != nil {
			p.Channel = *m.Channel
		}
		if m.To != nil {
			p.To = *m.To
		}
		if m.Model != nil {
			p.Model = *m.Model
		}
		if m.Thinking != nil {
			p.Thinking = *m.Thinking
		}
		runID := ctx.HooksAgent(p)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_, _ = w.Write([]byte(`{"runId":"` + runID + `"}`))
		return
	}
	w.WriteHeader(http.StatusNotImplemented)
}

// handleHooksAlert handles POST /hooks/alert.
// 与 HooksAgent 保持相同消息发送逻辑：通过 HooksAgent 调用 sessions.reset + chat.send。
func (s *Server) handleHooksAlert(w http.ResponseWriter, r *http.Request, ctx *handlers.Context) {
	if ctx == nil || ctx.HooksAgent == nil {
		hooksLog.Warn("hooks alert not available (HooksAgent not configured)")
		http.Error(w, "alert hook not available", http.StatusNotImplemented)
		return
	}

	var body hooksPayloadAlert
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}
	rawStr := strings.TrimSpace(string(bodyBytes))
	if rawStr == "" {
		http.Error(w, "empty body", http.StatusBadRequest)
		return
	}
	// 优先尝试按 hooksPayloadAlert 解析；如果结构不匹配或没有 message 字段，
	// 则将原始内容整体作为 message，提升对不同第三方告警体的兼容性。
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		body.Message = rawStr
	} else if strings.TrimSpace(body.Message) == "" {
		body.Message = rawStr
	}

	alertPrompt := buildAlertPrompt(body)
	alertUUID := uuid.New().String()
	sessionKey := fmt.Sprintf("agent:main:alert:%s", alertUUID)

	runID := ctx.HooksAgent(handlers.HooksAgentParams{
		Message:    alertPrompt,
		Name:       "Alert",
		SessionKey: sessionKey,
		WakeMode:   "now",
		Deliver:    true,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	resp := map[string]interface{}{
		"runId":      runID,
		"sessionKey": sessionKey,
	}
	_ = json.NewEncoder(w).Encode(resp)
}

// buildAlertPrompt constructs an analysis prompt for the agent from the alert payload.
func buildAlertPrompt(body hooksPayloadAlert) string {
	title := strings.TrimSpace(body.Title)
	if title == "" {
		title = "未命名告警"
	}
	severity := strings.TrimSpace(body.Severity)
	if severity == "" {
		severity = "unknown"
	}
	source := strings.TrimSpace(body.Source)
	if source == "" {
		source = "unknown"
	}
	message := strings.TrimSpace(body.Message)

	// Serialize Data for extra context (best-effort).
	var dataJSON string
	if body.Data != nil {
		if b, err := json.MarshalIndent(body.Data, "", "  "); err == nil {
			dataJSON = string(b)
		}
	}

	builder := &strings.Builder{}
	builder.WriteString("You are a senior SRE/ops alert analysis assistant. ")
	builder.WriteString("Below is an alert event from a monitoring/alerting system.\n\n")
	builder.WriteString("## Important: Fetch data first, then analyze\n")
	builder.WriteString("Before drawing conclusions, you MUST:\n")
	builder.WriteString("1. **Use MCP tools**: If you have MCP servers connected (e.g. Prometheus, Grafana, log systems), actively call relevant tools to query metrics, alerts, logs, etc., and use real data to support your analysis. Examples: prometheus_query, prometheus_query_range, prometheus_alerts.\n")
	builder.WriteString("2. **Use Skills**: If you have available Skills (e.g. Prometheus Analysis, log analysis), select relevant skills based on the alert content and follow their guidance for querying and interpretation.\n")
	builder.WriteString("3. **Combine context**: Correlate data fetched from MCP/Skills with the alert payload below before inferring root cause and assessing impact.\n\n")
	builder.WriteString("## Analysis requirements\n")
	builder.WriteString("After fetching data, please: 1) identify possible root causes; 2) assess impact scope and urgency; 3) provide step-by-step troubleshooting suggestions; 4) if needed, provide temporary mitigation and follow-up optimization recommendations. ")
	builder.WriteString("**Output your final response in Simplified Chinese**, using structured subheadings.\n\n")

	builder.WriteString("【Alert Title】\n")
	builder.WriteString(title + "\n\n")

	builder.WriteString("【Severity】\n")
	builder.WriteString(severity + "\n\n")

	builder.WriteString("【Source】\n")
	builder.WriteString(source + "\n\n")

	if body.AlertID != "" {
		builder.WriteString("【Alert ID】\n")
		builder.WriteString(strings.TrimSpace(body.AlertID) + "\n\n")
	}

	if message != "" {
		builder.WriteString("【Description】\n")
		builder.WriteString(message + "\n\n")
	}

	if dataJSON != "" {
		builder.WriteString("【Raw Data (JSON)】\n")
		builder.WriteString(dataJSON + "\n")
	}

	return builder.String()
}
