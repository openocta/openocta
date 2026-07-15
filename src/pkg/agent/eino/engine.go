package eino

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	localbk "github.com/cloudwego/eino-ext/adk/backend/local"
	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/adk/prebuilt/deep"
	einotool "github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"

	"github.com/openocta/openocta/pkg/agent/eino/localbackend"
	"github.com/openocta/openocta/pkg/config"

	octool "github.com/openocta/openocta/pkg/agent/tool"
)

// KnowledgeOptions configures vault indexing tools.
type KnowledgeOptions struct {
	Enabled  bool
	VaultDir string
	IndexDir string
}

// BuildConfig holds parameters for constructing an Eino engine.
type BuildConfig struct {
	ModelFactory    ChatModelFactory
	Tools           []octool.Tool
	ProjectRoot     string
	Instruction     string
	DisableTools    bool
	SkillsDir       string
	Knowledge       *KnowledgeOptions
	MaxIteration    int
	ValidateCommand func(string) error
	EnableApproval  bool
	CheckPointStore adk.CheckPointStore
	Env             func(string) string
	Config          *config.OpenOctaConfig
	TokenLimit      int
	AgentID         string
	TokenTracking   bool
}

// Engine wraps Eino DeepAgent + Runner (+ optional session TurnLoop).
type Engine struct {
	agent          adk.Agent
	runner         *adk.Runner
	checkpoints    adk.CheckPointStore
	agentRunBudget time.Duration
	agentID        string
	tokenTracking  bool
	closeOnce      sync.Once
	closed         bool
}

// NewEngine builds a DeepAgent-backed engine.
func NewEngine(ctx context.Context, cfg BuildConfig) (*Engine, error) {
	if cfg.ModelFactory == nil {
		cfg.ModelFactory = DefaultModelFactory()
	}
	projectRoot := cfg.ProjectRoot
	if projectRoot == "" {
		projectRoot = "."
	}
	cm, err := cfg.ModelFactory.ChatModel(ctx)
	if err != nil {
		return nil, fmt.Errorf("chat model: %w", err)
	}

	fsBackend, err := localbackend.NewBackend(ctx, &localbk.Config{
		ValidateCommand: cfg.ValidateCommand,
	}, localbackend.Options{WorkspaceDir: projectRoot})
	if err != nil {
		return nil, fmt.Errorf("filesystem backend: %w", err)
	}

	var dynamicTools []einotool.BaseTool
	if !cfg.DisableTools {
		dynamicTools = WrapTools(cfg.Tools)
		if cfg.Knowledge != nil && cfg.Knowledge.Enabled {
			dynamicTools = append(dynamicTools, KnowledgeTools(cfg.Knowledge)...)
		}
	}

	settings := resolveContextMiddlewareSettings(cfg)
	useToolSearch := settings.enableToolSearch && len(dynamicTools) >= minToolSearchTools

	handlers, err := buildAgentMiddlewares(ctx, cfg, cm, fsBackend, cfg.SkillsDir, dynamicTools)
	if err != nil {
		return nil, err
	}
	handlers = append(handlers, newExecuteToolHintMiddleware())
	handlers = append(handlers, newToolArgumentsGuardMiddleware())
	if cfg.EnableApproval {
		handlers = append(handlers, newApprovalMiddleware("execute"))
	}
	// Last BeforeChatModel hook: repair tool-call turns after reduction/summarization.
	handlers = append(handlers, newToolTurnRepairMiddleware())

	var baseTools []einotool.BaseTool
	if !cfg.DisableTools && !useToolSearch {
		baseTools = dynamicTools
	}

	maxIter := cfg.MaxIteration
	if maxIter <= 0 {
		maxIter = 50
	}

	deepCfg := &deep.Config{
		Name:              "openocta-agent",
		Description:       "OpenOcta DeepAgent (filesystem, shell, sub-agents)",
		ChatModel:         cm,
		Instruction:       cfg.Instruction,
		Backend:           fsBackend,
		StreamingShell:    fsBackend,
		MaxIteration:      maxIter,
		Handlers:          handlers,
		WithoutWriteTodos: !deepAgentTodosEnabled(cfg.Env),
	}
	if len(baseTools) > 0 {
		deepCfg.ToolsConfig = adk.ToolsConfig{
			ToolsNodeConfig: compose.ToolsNodeConfig{Tools: baseTools},
		}
	}

	agent, err := deep.New(ctx, deepCfg)
	if err != nil {
		return nil, fmt.Errorf("deep agent: %w", err)
	}

	store := cfg.CheckPointStore
	if store == nil {
		store = SharedCheckPointStore(cfg.Env)
	}
	runner := adk.NewRunner(ctx, adk.RunnerConfig{
		Agent:           agent,
		EnableStreaming: true,
		CheckPointStore: store,
	})

	return &Engine{
		agent:         agent,
		runner:        runner,
		checkpoints:   store,
		agentID:       strings.TrimSpace(cfg.AgentID),
		tokenTracking: cfg.TokenTracking,
	}, nil
}

func deepAgentTodosEnabled(env func(string) string) bool {
	if env == nil {
		env = os.Getenv
	}
	v := strings.TrimSpace(strings.ToLower(env("OPENOCTA_DEEP_AGENT_TODOS")))
	return v == "1" || v == "true" || v == "yes"
}

// Agent returns the underlying DeepAgent instance (for TurnLoop PrepareAgent).
func (e *Engine) Agent() adk.Agent {
	if e == nil {
		return nil
	}
	return e.agent
}

// Runner returns the ADK runner.
func (e *Engine) Runner() *adk.Runner {
	if e == nil {
		return nil
	}
	return e.runner
}

// CheckPointStore returns the checkpoint store used by this engine.
func (e *Engine) CheckPointStore() adk.CheckPointStore {
	if e == nil {
		return nil
	}
	return e.checkpoints
}

// AgentRunBudget returns default per-turn timeout when request context has no deadline.
func (e *Engine) AgentRunBudget() time.Duration {
	if e == nil {
		return 0
	}
	return e.agentRunBudget
}

// Close releases engine resources.
func (e *Engine) Close() error {
	if e == nil {
		return nil
	}
	e.closeOnce.Do(func() {
		e.closed = true
	})
	return nil
}

// ClearSession removes checkpoint state for a session (Runner interrupt/resume).
func (e *Engine) ClearSession(sessionID string) {
	deleteCheckpoint(e.checkpoints, strings.TrimSpace(sessionID))
}

// ClearAllSessionCheckpoints removes Runner and TurnLoop checkpoints for a session.
func (e *Engine) ClearAllSessionCheckpoints(sessionID string) {
	ClearPersistedSessionCheckpoints(sessionID)
}

// SetAgentRunBudget sets default run timeout when ctx has no deadline.
func (e *Engine) SetAgentRunBudget(d time.Duration) {
	if e != nil {
		e.agentRunBudget = d
	}
}
