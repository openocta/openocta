// Package http provides the Gateway HTTP server skeleton.
// Routes: /api/*, /v1/chat/completions, /v1/responses, health, WebSocket upgrade.
package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/google/uuid"
	"github.com/openocta/openocta/embed"
	"github.com/openocta/openocta/pkg/acp/mcp"
	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/channels/builtin"
	"github.com/openocta/openocta/pkg/channels/dingtalk"
	"github.com/openocta/openocta/pkg/channels/feishu"
	"github.com/openocta/openocta/pkg/channels/qq"
	"github.com/openocta/openocta/pkg/channels/weixin"
	"github.com/openocta/openocta/pkg/channels/wework"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/cron"
	"github.com/openocta/openocta/pkg/gateway/handlers"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/gateway/swarmsvc"
	"github.com/openocta/openocta/pkg/gateway/ws"
	initpkg "github.com/openocta/openocta/pkg/init"
	"github.com/openocta/openocta/pkg/logging"
	"github.com/openocta/openocta/pkg/outbound"
	"github.com/openocta/openocta/pkg/paths"
	"github.com/stellarlinkco/agentsdk-go/pkg/middleware"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"net/http/pprof"
	_ "net/http/pprof"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// httpTraceJSONLWriter implements middleware.HTTPTraceWriter (agentsdk-go v2 精简了 HTTP trace API).
type httpTraceJSONLWriter struct {
	mu   sync.Mutex
	path string
}

func newHTTPTraceJSONLWriter(dir string) (*httpTraceJSONLWriter, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}
	return &httpTraceJSONLWriter{path: filepath.Join(dir, "http.jsonl")}, nil
}

func (w *httpTraceJSONLWriter) WriteHTTPTrace(ev *middleware.HTTPTraceEvent) error {
	if w == nil || ev == nil {
		return nil
	}
	payload, err := json.Marshal(ev)
	if err != nil {
		return err
	}
	w.mu.Lock()
	defer w.mu.Unlock()
	f, err := os.OpenFile(w.path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	_, werr := f.Write(append(payload, '\n'))
	_ = f.Close()
	return werr
}

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
	// 始终注册内置 Channel 插件，保证 channels.status / 配置 UI 能反映各通道是否已配置。
	// 桌面模式仍可通过 skipChannels 跳过 Runtime 连接（registerChannelRuntimesFromConfig / Start），避免后台长连接导致不稳定。
	builtin.Register(chReg)
	for _, p := range chReg.List() {
		outReg.Register(p.ID(), &outbound.StubAdapter{ChannelID: p.ID()})
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

	// Initialize built-in employees (e.g. skill-creator) if not already present in state dir
	if err := initpkg.InitEmployee(cfg); err != nil {
		slog.Warn("init employees at startup failed", "error", err)
	}

	// MCP: connect to configured MCP servers and expose tools to the agent
	//var mcpManager *mcp.Manager
	//if cfg != nil && cfg.Mcp != nil && len(cfg.Mcp.Servers) > 0 {
	//	mgr, err := mcp.NewManager(context.Background(), cfg)
	//	if err != nil {
	//		slog.Warn("mcp: failed to start MCP manager, agent will run without MCP tools", "error", err)
	//	} else {
	//		mcpManager = mgr
	//	}
	//}
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
			// TODO: Implement node subscription and forwarding.
			// For now this is a no-op: broadcast functions already send to all
			// connected clients via ctx.Broadcast. Re-broadcasting here would
			// duplicate events and cause seq gaps on the frontend.
		},
		//MCPTools: func(ctx context.Context) ([]tool.Tool, error) {
		//	if mcpManager == nil {
		//		return nil, nil
		//	}
		//	return mcpManager.Tools(ctx)
		//},
	}

	// Update hub with context and create registry
	hub.SetContext(ctx)
	if err := swarmsvc.Init(&handlers.SwarmGatewayRunner{Ctx: ctx}, func(event string, payload interface{}) {
		if ctx.Broadcast != nil {
			ctx.Broadcast(event, payload, nil)
		}
	}, cfg, env); err != nil {
		slog.Warn("swarm: init failed", "error", err)
	}
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
		// 同时将系统事件写入主会话，使其在 Web 界面可见
		if strings.TrimSpace(text) != "" {
			go func(eventText string) {
				handlers.InvokeChatSend(ctx, handlers.ChatSendParams{
					SessionKey:     mainKey,
					Message:        "[系统事件] " + eventText,
					IdempotencyKey: uuid.New().String(),
				})
			}(text)
		}
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
				// 对数字员工会话，先确保 sessions.json 中有条目（首次对话构建 sessionId）。
				// 同时不强制传 sessionId，让 chat.send 走 ResolveChatSessionID 从 store 解析。
				lowerKey := strings.TrimSpace(strings.ToLower(sessionKey))
				if strings.HasPrefix(lowerKey, "agent:") && strings.Contains(lowerKey, ":employee:") && !strings.Contains(lowerKey, ":run:") {
					_, _, _ = ctx.InvokeMethod("sessions.ensure", map[string]interface{}{"key": sessionKey})
					sessionId = ""
				} else if sessionId == "" {
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
		addr:    addr,
		version: version,
		mux:     mux,
		hub:     hub,
		ctx:     ctx,
		//mcpManager: mcpManager,
	}
	s.registerRoutes()
	return s
}

// isAPIPath returns true if the path should be handled by the mux (API routes), not the frontend.
func isAPIPath(path string) bool {
	return strings.HasPrefix(path, "/_ready") ||
		strings.HasPrefix(path, "/_dist_debug") ||
		strings.HasPrefix(path, "/.well-known/") ||
		strings.HasPrefix(path, "/api/") ||
		path == "/ws" || strings.HasPrefix(path, "/ws/") || strings.HasPrefix(path, "/ws?") ||
		strings.HasPrefix(path, "/health") ||
		strings.HasPrefix(path, "/hooks") ||
		strings.HasPrefix(path, "/debug/")
}

// Handler returns the HTTP handler for testing (e.g. httptest).
// Wraps mux to handle WebSocket upgrade on root path (ws://host:port) for TS compatibility.
// 非 API 路径的 GET/HEAD 直接走 handleDist，避免 ServeMux 在 app 环境下匹配异常导致 404。
func (s *Server) Handler() http.Handler {
	handlerFunc := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" && r.Method == "GET" && strings.EqualFold(r.Header.Get("Upgrade"), "websocket") {
			s.handleWSUpgrade(w, r)
			return
		}
		// 非 API 路径的 GET/HEAD 直接走前端静态服务，不依赖 ServeMux 匹配
		if (r.Method == http.MethodGet || r.Method == http.MethodHead) && !isAPIPath(r.URL.Path) {
			s.handleDist(w, r)
			return
		}
		s.mux.ServeHTTP(w, r)
	})

	var handler http.Handler = handlerFunc
	return handler
}

func (s *Server) registerRoutes() {
	// 桌面应用健康检查（无需认证，不依赖前端）
	s.mux.HandleFunc("GET /_ready", s.handleReady)
	s.mux.HandleFunc("GET /_dist_debug", s.handleDistDebug)
	// Serve frontend (./dist) at root for local dev / single-binary use.
	// GET / 在 Go 1.22 中因末尾为 / 成为前缀匹配，会匹配 /、/assets/xxx 等所有路径。
	// 更具体的路由（/api/、/ws 等）优先匹配。
	s.mux.Handle("GET /", http.HandlerFunc(s.handleDist))
	s.mux.HandleFunc("GET /.well-known/agent.json", s.handleWellKnownAgentJSON)
	s.mux.HandleFunc("HEAD /.well-known/agent.json", s.handleWellKnownAgentJSON)
	s.mux.HandleFunc("GET /health", s.requireGatewayToken(s.handleHealth))
	s.mux.HandleFunc("GET /api/health", s.requireGatewayToken(s.handleHealth))
	s.mux.HandleFunc("POST /api/skills/upload", s.requireGatewayToken(s.handleSkillsUpload))
	s.mux.HandleFunc("POST /api/employee-skills/upload", s.requireGatewayToken(s.handleEmployeeSkillsUpload))
	s.mux.HandleFunc("OPTIONS /api/employee-skills/upload", s.handleEmployeeSkillsUpload)
	s.mux.HandleFunc("DELETE /api/employee-skills/delete", s.requireGatewayToken(s.handleEmployeeSkillsDelete))
	s.mux.HandleFunc("OPTIONS /api/employee-skills/delete", s.handleEmployeeSkillsDelete)
	s.mux.HandleFunc("GET /api/config", s.requireGatewayToken(s.handleConfigGet))
	s.mux.HandleFunc("GET /api/config/env", s.requireGatewayToken(s.handleConfigEnv))
	s.mux.HandleFunc("POST /api/config/patch", s.requireGatewayToken(s.handleConfigPatch))
	s.mux.HandleFunc("PATCH /api/config/patch", s.requireGatewayToken(s.handleConfigPatch))
	s.mux.HandleFunc("POST /api/desktop/uninstall", s.requireGatewayToken(s.handleDesktopUninstall))
	s.mux.HandleFunc("OPTIONS /api/desktop/uninstall", s.handleDesktopUninstallOptions)
	s.mux.HandleFunc("POST /api/desktop/clear-workspace", s.requireGatewayToken(s.handleDesktopClearWorkspace))
	s.mux.HandleFunc("OPTIONS /api/desktop/clear-workspace", s.handleDesktopClearWorkspaceOptions)
	s.mux.HandleFunc("POST /api/desktop/open-url", s.requireGatewayToken(s.handleDesktopOpenURL))
	s.mux.HandleFunc("OPTIONS /api/desktop/open-url", s.handleDesktopOpenURLOptions)

	// Site API proxies (employee market / skills / mcps / tutorials).
	// Frontend calls Gateway same-origin; Gateway forwards to OPENOCTA_SITE_API_BASE_URL.
	// CORS: allow dev UI (e.g. localhost:5173) to call gateway (e.g. 127.0.0.1:18900).
	s.mux.HandleFunc("OPTIONS /api/v1/", s.handleSiteOptions)
	s.mux.HandleFunc("GET /api/v1/employees", s.requireGatewayToken(s.handleSiteEmployees))
	s.mux.HandleFunc("GET /api/v1/employees/{id}", s.requireGatewayToken(s.handleSiteEmployeeDetail))
	s.mux.HandleFunc("GET /api/v1/employees/{id}/download", s.requireGatewayToken(s.handleSiteEmployeeDownload))
	s.mux.HandleFunc("GET /api/v1/mcps", s.requireGatewayToken(s.handleSiteMcps))
	s.mux.HandleFunc("GET /api/v1/mcps/{id}", s.requireGatewayToken(s.handleSiteMcpDetail))
	s.mux.HandleFunc("GET /api/v1/mcps/{id}/download", s.requireGatewayToken(s.handleSiteMcpDownload))
	s.mux.HandleFunc("GET /api/v1/skills", s.requireGatewayToken(s.handleSiteSkills))
	s.mux.HandleFunc("GET /api/v1/skills/{folder}", s.requireGatewayToken(s.handleSiteSkillDetail))
	s.mux.HandleFunc("GET /api/v1/skills/{folder}/download", s.requireGatewayToken(s.handleSiteSkillDownload))
	s.mux.HandleFunc("GET /api/v1/categories", s.requireGatewayToken(s.handleSiteCategories))
	s.mux.HandleFunc("GET /api/v1/edu/categories", s.requireGatewayToken(s.handleSiteEduCategories))
	s.mux.HandleFunc("GET /api/v1/edu/lessons/{id}", s.requireGatewayToken(s.handleSiteEduLessonDetail))
	s.mux.HandleFunc("GET /api/v1/site/uploads/{path...}", s.handleSiteUploads)
	s.mux.HandleFunc("POST /api/v1/install", s.requireGatewayToken(s.handleSiteInstall))

	//s.mux.HandleFunc("/api/", s.handleAPICatchAll)
	//s.mux.HandleFunc("POST /v1/chat/completions", s.handleNotImplemented)
	//s.mux.HandleFunc("POST /v1/responses", s.handleNotImplemented)
	s.mux.HandleFunc("GET /ws", s.handleWSUpgrade)
	s.mux.HandleFunc("POST /hooks/", s.handleHooks)
	s.mux.HandleFunc("POST /hooks", s.handleHooks)
	s.mux.HandleFunc("GET /debug/pprof/", pprof.Index)

	// 为了支持 cmdline 和 profile 等特定功能，建议也显式注册这几个（Index 里其实包含了大部分，但显式注册更稳妥）
	s.mux.HandleFunc("GET /debug/pprof/cmdline", pprof.Cmdline)
	s.mux.HandleFunc("GET /debug/pprof/profile", pprof.Profile)
	s.mux.HandleFunc("GET /debug/pprof/symbol", pprof.Symbol)
	s.mux.HandleFunc("GET /debug/pprof/trace", pprof.Trace)
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

// handleDistDebug returns JSON with distFS/distDir/distErr state for debugging 404.
func (s *Server) handleDistDebug(w http.ResponseWriter, _ *http.Request) {
	s.distOnce.Do(func() {
		if efs, err := embed.FrontendFS(); err == nil {
			if _, err := fs.Stat(efs, "index.html"); err == nil {
				s.distFS = efs
				return
			}
		}
		s.distDir, s.distErr = resolveDistDirFile()
	})
	w.Header().Set("Content-Type", "application/json")
	var distErrStr string
	if s.distErr != nil {
		distErrStr = s.distErr.Error()
	}
	body := fmt.Sprintf(`{"distFS":%t,"distDir":%q,"distErr":%q}`,
		s.distFS != nil, s.distDir, distErrStr)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(body))
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
		// 500 而非 404，便于区分 embed 失败与路由问题
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

func (s *Server) handleReady(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
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
	if skipChannels {
		logging.Info("gateway: channel runtimes skipped (OPENOCTA_SKIP_CHANNELS or OPENOCTA_SKIP_PROVIDERS set)")
		return
	}
	if cfg == nil || cfg.Channels == nil {
		return
	}

	// 约定：所有通道的 NewRuntimeFromConfig 签名均为 RuntimeFactoryFunc。
	factories := map[string]channels.RuntimeFactoryFunc{
		"wework":   wework.NewRuntimeFromConfig,
		"weixin":   weixin.NewRuntimeFromConfig,
		"dingtalk": dingtalk.NewRuntimeFromConfig,
		"feishu":   feishu.NewRuntimeFromConfig,
		"qq":       qq.NewRuntimeFromConfig,
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
