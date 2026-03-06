// Package http provides the Gateway HTTP server skeleton.
// Routes: /api/*, /v1/chat/completions, /v1/responses, health, WebSocket upgrade.
package http

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"io/fs"
	"log"
	"log/slog"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/cexll/agentsdk-go/pkg/middleware"
	"github.com/cexll/agentsdk-go/pkg/tool"
	"github.com/google/uuid"
	"github.com/openocta/openocta/embed"
	"github.com/openocta/openocta/pkg/acp/mcp"
	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/channels/builtin"
	"github.com/openocta/openocta/pkg/channels/dingtalk"
	"github.com/openocta/openocta/pkg/channels/discord"
	"github.com/openocta/openocta/pkg/channels/feishu"
	"github.com/openocta/openocta/pkg/channels/qq"
	"github.com/openocta/openocta/pkg/channels/slack"
	"github.com/openocta/openocta/pkg/channels/telegram"
	"github.com/openocta/openocta/pkg/channels/wework"
	"github.com/openocta/openocta/pkg/channels/whatsapp"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/cron"
	"github.com/openocta/openocta/pkg/gateway/handlers"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/gateway/ws"
	"github.com/openocta/openocta/pkg/outbound"
	"github.com/openocta/openocta/pkg/paths"
)

// Server is the Gateway HTTP server.
type Server struct {
	addr       string
	version    string
	server     *http.Server
	mux        *http.ServeMux
	hub        *ws.Hub
	ctx        *handlers.Context
	mcpManager *mcp.Manager
	distOnce   sync.Once
	distDir    string
	distErr    error
	distFS     fs.FS // embedded frontend when used
}

// isTruthyEnv returns true if the env var is set to a truthy value (1, true, yes).
func isTruthyEnv(env func(string) string, key string) bool {
	v := env(key)
	return v == "1" || v == "true" || v == "yes"
}

// NewServer creates a new HTTP server with WebSocket hub and handlers.
func NewServer(addr string, version string) *Server {
	mux := http.NewServeMux()
	env := func(k string) string { return os.Getenv(k) }
	stateDir := paths.ResolveStateDir(env)
	skipCron := isTruthyEnv(env, "OPENOCTA_SKIP_CRON")
	skipChannels := isTruthyEnv(env, "OPENOCTA_SKIP_CHANNELS") || isTruthyEnv(env, "OPENOCTA_SKIP_PROVIDERS")

	var cronSvc *cron.Service
	if !skipCron {
		svc, _ := cron.NewService(filepath.Join(stateDir, "cron", "jobs.json"))
		cronSvc = svc
	}
	var cronSvcIf interface {
		List(bool) ([]cron.CronJob, error)
		Add(cron.JobCreate) (cron.CronJob, error)
		Remove(string) error
	}
	if cronSvc != nil {
		cronSvcIf = cronSvc
	}
	chReg := channels.NewRegistry()
	chRuntimeMgr := channels.NewManager()
	outReg := outbound.NewAdapterRegistry()
	if !skipChannels {
		// 注册所有内置 Channel 插件，同时为每个通道注册一个 StubAdapter。
		// 出站发送统一走 RuntimeChannel 机制，OutboundAdapter 仅作为占位/未来扩展保留。
		builtin.Register(chReg)
		for _, p := range chReg.List() {
			outReg.Register(p.ID(), &outbound.StubAdapter{ChannelID: p.ID()})
		}
	}
	hub := ws.NewHub(version, nil, nil) // Create hub first to get broadcast functions

	// Load configuration at startup
	cfg, err := config.Load(env)
	if err != nil {
		// Log error but continue with default config
		cfg = &config.OpenOctaConfig{}
	}

	// Apply environment variables from config.env.vars
	if cfg != nil && cfg.Env != nil && cfg.Env.Vars != nil {
		for k, v := range cfg.Env.Vars {
			if os.Getenv(k) == "" {
				os.Setenv(k, v)
			}
		}
	}

	// MCP: connect to configured MCP servers and expose tools to the agent
	var mcpManager *mcp.Manager
	if cfg != nil && cfg.Mcp != nil && len(cfg.Mcp.Servers) > 0 {
		mgr, err := mcp.NewManager(context.Background(), cfg)
		if err != nil {
			slog.Warn("mcp: failed to start MCP manager, agent will run without MCP tools", "error", err)
		} else {
			mcpManager = mgr
		}
	}
	ctx := &handlers.Context{
		Version:             version,
		GetStatusSummary:    func() (interface{}, error) { return handlers.DefaultStatusSummary(), nil },
		LoadConfigSnapshot:  func() (*handlers.ConfigSnapshot, error) { return handlers.LoadConfigSnapshot(env) },
		GetSessionStorePath: func() string { return filepath.Join(stateDir, "sessions") },
		LoadModelCatalog:    func() []handlers.ModelEntry { return []handlers.ModelEntry{} },
		ChannelRegistry:     chReg,
		OutboundRegistry:    outReg,
		CronService:         cronSvcIf,
		GetCronStorePath:    func() string { return filepath.Join(stateDir, "cron", "jobs.json") },
		AgentRunSeq:         make(map[string]int64), // Initialize sequence counter
		Config:              cfg,                    // Store loaded config
		ChannelManager:      chRuntimeMgr,
		Broadcast: func(event string, payload interface{}, opts *handlers.BroadcastOptions) {
			if opts == nil {
				opts = &handlers.BroadcastOptions{
					DropIfSlow: false,
				}
			}
			hub.Broadcast(event, payload, &ws.BroadcastOptions{
				DropIfSlow:   opts != nil && opts.DropIfSlow,
				StateVersion: opts.StateVersion,
			})
		},
		BroadcastToConnIds: func(event string, payload interface{}, connIds map[string]bool, opts *handlers.BroadcastOptions) {
			hub.BroadcastToConnIds(event, payload, connIds, &ws.BroadcastOptions{
				DropIfSlow:   opts != nil && opts.DropIfSlow,
				StateVersion: opts.StateVersion,
			})
		},
		NodeSendToSession: func(sessionKey string, event string, payload interface{}) {
			// TODO: Implement node subscription and forwarding
			// For now, just broadcast to all clients
			hub.Broadcast(event, payload, nil)
		},
		MCPTools: func(ctx context.Context) ([]tool.Tool, error) {
			if mcpManager == nil {
				return nil, nil
			}
			return mcpManager.Tools(ctx)
		},
	}

	// Update hub with context and create registry
	hub.SetContext(ctx)
	reg := handlers.NewRegistry(ctx)
	// Allow agent tools to synchronously invoke gateway methods
	ctx.InvokeMethod = func(method string, params map[string]interface{}) (ok bool, payload interface{}, err *protocol.ErrorShape) {
		var resultOk bool
		var resultPayload interface{}
		var resultErr *protocol.ErrorShape
		done := make(chan struct{})
		opts := handlers.HandlerOpts{
			Req:     protocol.RequestFrame{Method: method, Params: params},
			Params:  params,
			Context: ctx,
			Respond: func(o bool, p interface{}, e *protocol.ErrorShape, meta map[string]interface{}) {
				resultOk, resultPayload, resultErr = o, p, e
				close(done)
			},
		}
		reg.Dispatch(opts)
		<-done
		return resultOk, resultPayload, resultErr
	}
	hub.SetHandlers(&reg)

	// HooksWake / HooksAgent: 参考 openclaw createGatewayHooksRequestHandler
	// EnqueueSystemEvent 向主会话广播 system-event；RequestHeartbeatNow 暂为 no-op
	mainKey := handlers.ResolveMainSessionKey(cfg)
	enqueueSystemEvent := func(text string) {
		hub.Broadcast("system-event", map[string]interface{}{"text": text, "sessionKey": mainKey}, nil)
	}
	requestHeartbeatNow := func(reason string) {} // no-op: OpenOcta 无独立心跳循环

	ctx.HooksWake = func(text string, mode string) {
		enqueueSystemEvent(text)
		if mode == "now" {
			requestHeartbeatNow("hook:wake")
		}
	}

	ctx.HooksAgent = func(p handlers.HooksAgentParams) string {
		sessionKey := strings.TrimSpace(p.SessionKey)
		runID := uuid.New().String()

		if sessionKey == "" {
			sessionKey = fmt.Sprintf("hook:%s", runID)
		}
		// 不再每次重置 session，保留多轮对话上下文
		timeoutMs := 0
		if p.TimeoutSeconds != nil && *p.TimeoutSeconds > 0 {
			timeoutMs = *p.TimeoutSeconds * 1000
		}
		rid, ok := handlers.InvokeChatSend(ctx, handlers.ChatSendParams{
			SessionKey:     sessionKey,
			Message:        p.Message,
			IdempotencyKey: runID,
			Channel:        p.Channel,
			To:             p.To,
			ChatType:       p.ChatType,
			MessageID:      p.MessageID,
			Thinking:       p.Thinking,
			TimeoutMs:      timeoutMs,
		})
		if ok && rid != "" {
			return rid
		}
		return runID
	}

	if cronSvc != nil {
		cronSvc.SetDeps(&cron.Deps{
			EnqueueSystemEvent:  enqueueSystemEvent,
			RequestHeartbeatNow: requestHeartbeatNow,
			RunIsolatedAgentJob: func(job cron.CronJob, message string) {
				agentID := job.AgentID
				if agentID == "" {
					agentID = "main"
				}
				// 旧路径仍保留，但 sessionKey 统一为 agent:main:cron:<jobId>
				handlers.RunIsolatedAgentTurn(ctx, agentID, "agent:main:cron:"+job.ID, message)
			},
			RunCronChat: func(job cron.CronJob, sessionKey, sessionId, message string) {
				if sessionKey == "" {
					sessionKey = "agent:main:cron:" + job.ID
				}
				if sessionId == "" {
					sessionId = job.ID
				}
				handlers.InvokeChatSend(ctx, handlers.ChatSendParams{
					SessionKey:     sessionKey,
					Message:        message,
					SessionID:      sessionId,
					IdempotencyKey: "cron:" + job.ID,
				})
			},
		})
		cronSvc.Start()
	}
	go hub.Run()

	// 构建入站消息下沉器，将 RuntimeChannel 的 InboundMessage 转换为 hooks.agent 调用。
	inboundSink := &hooksAgentSink{ctx: ctx}

	// 基于配置初始化各通道 Runtime（由统一注册逻辑处理）。
	registerChannelRuntimesFromConfig(chRuntimeMgr, cfg, inboundSink, skipChannels)

	// 配置热重载：当 channels 配置变更时，停止旧连接并基于新配置重新创建。
	ctx.ReloadChannelRuntimes = func() {
		if chRuntimeMgr == nil {
			return
		}
		cfg := ctx.Config
		if cfg == nil {
			return
		}
		chRuntimeMgr.StopAll()
		registerChannelRuntimesFromConfig(chRuntimeMgr, cfg, inboundSink, skipChannels)
		if err := chRuntimeMgr.Start(context.Background()); err != nil {
			slog.Warn("channels runtime: reload start error", "error", err)
		}
	}

	// 异步启动所有 RuntimeChannel。
	go func() {
		if err := chRuntimeMgr.Start(context.Background()); err != nil {
			slog.Warn("channels runtime: start error", "error", err)
		}
	}()

	s := &Server{
		addr:       addr,
		version:    version,
		mux:        mux,
		hub:        hub,
		ctx:        ctx,
		mcpManager: mcpManager,
	}
	s.registerRoutes()
	return s
}

// Handler returns the HTTP handler for testing (e.g. httptest).
// Wraps mux to handle WebSocket upgrade on root path (ws://host:port) for TS compatibility.
func (s *Server) Handler() http.Handler {
	handlerFunc := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" && r.Method == "GET" && strings.EqualFold(r.Header.Get("Upgrade"), "websocket") {
			s.handleWSUpgrade(w, r)
			return
		}
		s.mux.ServeHTTP(w, r)
	})

	// todo： 生产环境建议去掉，仅用于开发环境
	httpTraceDir := filepath.Join(".", ".claude-trace")
	writer, err := middleware.NewFileHTTPTraceWriter(httpTraceDir)
	var handler http.Handler
	if err != nil {
		log.Printf("HTTP trace disabled: %v", err)
	} else {
		httpTrace := middleware.NewHTTPTraceMiddleware(
			writer,
			middleware.WithHTTPTraceMaxBodyBytes(2<<20),
		)
		handler = httpTrace.Wrap(handlerFunc) // mux 为业务 handler
	}
	return handler
}

func (s *Server) registerRoutes() {
	// Serve frontend (./dist) at root for local dev / single-binary use.
	// Most-specific patterns (e.g. /api/, /ws) still win over this catch-all.
	s.mux.Handle("GET /", http.HandlerFunc(s.handleDist))
	s.mux.HandleFunc("GET /health", s.handleHealth)
	s.mux.HandleFunc("GET /api/health", s.handleHealth)
	s.mux.HandleFunc("POST /api/skills/upload", s.handleSkillsUpload)
	s.mux.HandleFunc("POST /api/employee-skills/upload", s.handleEmployeeSkillsUpload)
	s.mux.HandleFunc("OPTIONS /api/employee-skills/upload", s.handleEmployeeSkillsUpload)
	s.mux.HandleFunc("DELETE /api/employee-skills/delete", s.handleEmployeeSkillsDelete)
	s.mux.HandleFunc("OPTIONS /api/employee-skills/delete", s.handleEmployeeSkillsDelete)
	s.mux.HandleFunc("GET /api/config", s.handleConfigGet)
	s.mux.HandleFunc("GET /api/config/env", s.handleConfigEnv)
	s.mux.HandleFunc("POST /api/config/patch", s.handleConfigPatch)
	s.mux.HandleFunc("PATCH /api/config/patch", s.handleConfigPatch)
	//s.mux.HandleFunc("/api/", s.handleAPICatchAll)
	//s.mux.HandleFunc("POST /v1/chat/completions", s.handleNotImplemented)
	//s.mux.HandleFunc("POST /v1/responses", s.handleNotImplemented)
	s.mux.HandleFunc("GET /ws", s.handleWSUpgrade)
	s.mux.HandleFunc("POST /hooks/", s.handleHooks)
	s.mux.HandleFunc("POST /hooks", s.handleHooks)
}

// resolveDistDirFile resolves the frontend dist directory from the file system.
// Order: 1) OPENOCTA_FRONTEND_DIR env; 2) cwd/dist/control-ui; 3) cwd/embed/frontend; 4) parent(cwd)/dist/control-ui.
func resolveDistDirFile() (string, error) {
	var candidates []string
	if env := strings.TrimSpace(os.Getenv("OPENOCTA_FRONTEND_DIR")); env != "" {
		p := filepath.Clean(env)
		if !strings.HasSuffix(p, "control-ui") {
			p = filepath.Join(p, "control-ui")
		}
		candidates = append(candidates, p)
	}
	cwd, _ := os.Getwd()
	candidates = append(candidates, filepath.Join(cwd, "dist", "control-ui"))
	candidates = append(candidates, filepath.Join(cwd, "embed", "frontend"))
	candidates = append(candidates, filepath.Join(cwd, "src", "embed", "frontend"))
	candidates = append(candidates, filepath.Join(filepath.Dir(cwd), "dist", "control-ui"))

	for _, dir := range candidates {
		indexPath := filepath.Join(dir, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			return filepath.Clean(dir), nil
		}
	}
	return "", fmt.Errorf("前端文件不存在，已尝试路径: %s", strings.Join(candidates, " / "))
}

// handleDist serves the static frontend from the resolved dist directory.
// - GET / returns dist/index.html (200, no redirect)
// - GET /assets/... serves static files
// - If a path does not exist and the client accepts HTML, fall back to index.html (SPA routing)
func (s *Server) handleDist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		http.NotFound(w, r)
		return
	}
	s.distOnce.Do(func() {
		if efs, err := embed.FrontendFS(); err == nil {
			if _, err := fs.Stat(efs, "index.html"); err == nil {
				s.distFS = efs
				return
			}
		}
		s.distDir, s.distErr = resolveDistDirFile()
	})
	if s.distErr != nil {
		http.Error(w, s.distErr.Error(), http.StatusInternalServerError)
		return
	}
	// Serve index.html for root or SPA fallback (no FileServer to avoid 301 redirects)
	serveIndex := func() {
		var f fs.File
		var err error
		if s.distFS != nil {
			f, err = s.distFS.Open("index.html")
		} else {
			var of *os.File
			of, err = os.Open(filepath.Join(s.distDir, "index.html"))
			if of != nil {
				f = of
			}
		}
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer f.Close()
		info, err := f.Stat()
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		var rs io.ReadSeeker
		if rsf, ok := f.(io.ReadSeeker); ok {
			rs = rsf
		} else {
			data, _ := io.ReadAll(f)
			rs = bytes.NewReader(data)
		}
		http.ServeContent(w, r, "index.html", info.ModTime(), rs)
	}

	cleanPath := path.Clean("/" + strings.TrimSpace(r.URL.Path))
	if cleanPath == "/" || cleanPath == "" {
		serveIndex()
		return
	}

	// Static file: resolve under distDir or distFS (no .. escape)
	name := strings.TrimPrefix(cleanPath, "/")
	name = filepath.ToSlash(filepath.Clean(name))
	if name == "" || strings.Contains(name, "..") {
		http.NotFound(w, r)
		return
	}
	var f fs.File
	var err error
	if s.distFS != nil {
		f, err = s.distFS.Open(name)
	} else {
		var of *os.File
		of, err = os.Open(filepath.Join(s.distDir, name))
		if of != nil {
			f = of
		}
	}
	if err != nil {
		accept := strings.ToLower(r.Header.Get("Accept"))
		if strings.Contains(accept, "text/html") || strings.Contains(accept, "*/*") {
			serveIndex()
			return
		}
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		http.NotFound(w, r)
		return
	}
	if info.IsDir() {
		http.NotFound(w, r)
		return
	}
	var rs io.ReadSeeker
	if rsf, ok := f.(io.ReadSeeker); ok {
		rs = rsf
	} else {
		data, _ := io.ReadAll(f)
		rs = bytes.NewReader(data)
	}
	http.ServeContent(w, r, info.Name(), info.ModTime(), rs)
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"ok":true,"version":"` + s.version + `"}`))
}

func (s *Server) handleAPICatchAll(w http.ResponseWriter, _ *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (s *Server) handleNotImplemented(w http.ResponseWriter, _ *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (s *Server) handleWSUpgrade(w http.ResponseWriter, r *http.Request) {
	s.hub.ServeWS(w, r)
}

// registerChannelRuntimesFromConfig 根据配置初始化并注册各通道 Runtime。
// 若某个通道配置不合法，会记录日志并继续处理其它通道。
func registerChannelRuntimesFromConfig(
	mgr *channels.Manager,
	cfg *config.OpenOctaConfig,
	sink channels.InboundSink,
	skipChannels bool,
) {
	if skipChannels || cfg == nil || cfg.Channels == nil {
		return
	}

	// 约定：所有通道的 NewRuntimeFromConfig 签名均为 RuntimeFactoryFunc。
	factories := map[string]channels.RuntimeFactoryFunc{
		"feishu":   feishu.NewRuntimeFromConfig,
		"qq":       qq.NewRuntimeFromConfig,
		"wework":   wework.NewRuntimeFromConfig,
		"dingtalk": dingtalk.NewRuntimeFromConfig,
		"telegram": telegram.NewRuntimeFromConfig,
		"slack":    slack.NewRuntimeFromConfig,
		"whatsapp": whatsapp.NewRuntimeFromConfig,
		"discord":  discord.NewRuntimeFromConfig,
	}

	for id, factory := range factories {
		raw := cfg.Channels.GetChannelConfig(id)
		if raw == nil {
			continue
		}

		rt, err := factory(raw, sink)
		if err != nil {
			slog.Warn("channel runtime: failed to init from config", "channel", id, "error", err)
			continue
		}

		if err := mgr.Register(rt); err != nil {
			slog.Warn("channel runtime: failed to register", "channel", id, "error", err)
		}
	}
}

// ListenAndServe starts the HTTP server.
func (s *Server) ListenAndServe() error {
	s.server = &http.Server{
		Addr:         s.addr,
		Handler:      s.Handler(),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
	return s.server.ListenAndServe()
}

// Shutdown gracefully stops the server.
func (s *Server) Shutdown(ctx context.Context) error {
	if s.mcpManager != nil {
		_ = s.mcpManager.Close()
		s.mcpManager = nil
	}
	if s.server == nil {
		return nil
	}
	return s.server.Shutdown(ctx)
}
