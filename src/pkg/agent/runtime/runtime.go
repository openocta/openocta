// Package runtime wraps agentsdk-go api.New for OPENOCTA agent execution.
package runtime

import (
	"context"
	"github.com/cexll/agentsdk-go/pkg/middleware"
	"os"
	"path/filepath"
	"strings"

	"github.com/cexll/agentsdk-go/pkg/api"
	"github.com/cexll/agentsdk-go/pkg/model"
	"github.com/cexll/agentsdk-go/pkg/sandbox"
	"github.com/cexll/agentsdk-go/pkg/tool"
	"github.com/openocta/openocta/pkg/agent"
	"github.com/openocta/openocta/pkg/config"
)

// Runtime wraps agentsdk-go Runtime for OPENOCTA.
type Runtime struct {
	rt *api.Runtime
}

// New creates a new Runtime with the given options.
// When EnableSkills is true, skills are loaded from three locations (in order of precedence):
// 1. Built-in skills (shipped with install: OPENOCTA_BUNDLED_SKILLS_DIR or executable-relative)
// 2. Managed/local skills (~/.openocta/skills)
// 3. Workspace skills (<workspace>/skills, i.e. ProjectRoot/skills)
func New(ctx context.Context, opts Options) (*Runtime, error) {
	if opts.ModelFactory == nil {
		opts.ModelFactory = DefaultModelFactory()
	}
	projectRoot := opts.ProjectRoot
	if projectRoot == "" {
		projectRoot = "."
	}
	// Built-in tools (bash, file_read, file_write, grep, glob, etc.) plus any caller-provided tools.
	tools := BuiltinTools(projectRoot)
	if len(opts.Tools) > 0 {
		tools = append(tools, opts.Tools...)
	}
	apiOpts := api.Options{
		ModelFactory: opts.ModelFactory,
		Tools:        tools,
		ProjectRoot:  projectRoot,
	}
	if len(opts.MCPServers) > 0 {
		apiOpts.MCPServers = opts.MCPServers
	}
	apiOpts.TokenTracking = opts.TokenTracking
	if apiOpts.TokenTracking && opts.TokenCallback != nil {
		apiOpts.TokenCallback = opts.TokenCallback
	} else if apiOpts.TokenTracking && opts.Env != nil {
		apiOpts.TokenCallback = NewTokenCallbackForSession(opts.AgentID, opts.Env)
	}
	if opts.EnableSkills {
		regs := BuildSkillRegistrationsFromThreeLocations(projectRoot, opts.Config)
		if len(regs) > 0 {
			apiOpts.Skills = regs
		}
	}
	if opts.EnableCommands && len(opts.Commands) > 0 {
		apiOpts.Commands = opts.Commands
	}
	if opts.EnableSubagents && len(opts.Subagents) > 0 {
		apiOpts.Subagents = opts.Subagents
	}
	if opts.EnableSandbox {
		apiOpts.Sandbox = buildSandboxOptions(projectRoot, opts.Sandbox)
	}
	if opts.EnableSystemPrompt {
		if opts.SystemPromptOverrides != "" {
			apiOpts.SystemPrompt = opts.SystemPromptOverrides
		} else {
			env := opts.Env
			if env == nil {
				env = func(string) string { return "" }
			}
			workspaceDir := agent.ResolveAgentWorkspaceDir(opts.Config, "main", env)
			prompt, err := BuildSystemPrompt(SystemPromptOptions{
				WorkspaceDir: workspaceDir,
				ProjectRoot:  projectRoot,
			})
			if err == nil {
				apiOpts.SystemPrompt = prompt
			}
		}
	}
	// todo: 生产环境建议去掉，仅用于开发环境
	//apiOpts.OTEL = api.OTELConfig{
	//	Enabled:     true,
	//	ServiceName: "openclaw",
	//	Endpoint:    "http://192.168.50.254:14318",
	//}
	traceMW := middleware.NewTraceMiddleware(filepath.Join(projectRoot, ".trace"))
	apiOpts.Middleware = []middleware.Middleware{
		traceMW,
	}

	rt, err := api.New(ctx, apiOpts)
	if err != nil {
		return nil, err
	}
	return &Runtime{rt: rt}, nil
}

// Options configures the Runtime.
type Options struct {
	ModelFactory api.ModelFactory
	Tools        []tool.Tool
	// ProjectRoot is the workspace/project root (used as api.Options.ProjectRoot and for loading workspace skills).
	ProjectRoot string
	// Config is optional; when set, used for skill load config (e.g. extraDirs) and eligibility.
	Config *config.OpenOctaConfig
	// EnableSkills loads skills from built-in, ~/.openocta/skills, and <workspace>/skills and registers them with the runtime.
	EnableSkills bool
	// EnableCommands enables slash-command execution when Commands is non-empty.
	EnableCommands bool
	// EnableSubagents enables subagent dispatch when Subagents is non-empty.
	EnableSubagents bool
	// EnableSandbox attaches sandbox manager for tool execution (filesystem/network/resource limits).
	EnableSandbox bool
	// Commands is the list of slash-command registrations (used when EnableCommands is true).
	Commands []api.CommandRegistration
	// Subagents is the list of subagent registrations (used when EnableSubagents is true).
	Subagents []api.SubagentRegistration
	// Sandbox overrides default sandbox options when EnableSandbox is true (optional).
	Sandbox *SandboxOpts
	// MCPServers is the list of MCP server specs (e.g. stdio://cmd args or URL). Load from config via BuildMCPServersFromConfig.
	MCPServers []string
	// TokenTracking enables token usage recording; default true when creating runtime for chat.
	TokenTracking bool
	// TokenCallback is called after each token usage; when nil and TokenTracking true, logs to ~/.openocta/agents/<agentID>/sessions/<sessionID>.jsonl.
	TokenCallback api.TokenCallback
	// AgentID is used to resolve session transcript path for default TokenCallback (e.g. "main").
	AgentID string
	// Env is used to resolve state dir for default TokenCallback (e.g. os.Getenv).
	Env func(string) string
	// EnableSystemPrompt builds system prompt from ~/.openocta/workspace and ProjectRoot/prompt (deduped by filename) and sets api.Options.SystemPrompt.
	EnableSystemPrompt bool
	// SystemPromptOverrides if non-empty replaces the auto-built system prompt when EnableSystemPrompt is true.
	SystemPromptOverrides string
}

// SandboxOpts holds optional sandbox overrides for the runtime.
type SandboxOpts struct {
	Root          string
	AllowedPaths  []string
	NetworkAllow  []string
	ResourceLimit sandbox.ResourceLimits
}

func buildSandboxOptions(projectRoot string, overrides *SandboxOpts) api.SandboxOptions {
	root := projectRoot
	allowedPaths := []string{filepath.Join(projectRoot, "workspace"), filepath.Join(projectRoot, "shared")}
	networkAllow := []string{"localhost", "127.0.0.1"}
	var resourceLimit sandbox.ResourceLimits
	if overrides != nil {
		if overrides.Root != "" {
			root = overrides.Root
		}
		if len(overrides.AllowedPaths) > 0 {
			allowedPaths = overrides.AllowedPaths
		}
		if len(overrides.NetworkAllow) > 0 {
			networkAllow = overrides.NetworkAllow
		}
		if overrides.ResourceLimit.MaxCPUPercent > 0 || overrides.ResourceLimit.MaxMemoryBytes > 0 || overrides.ResourceLimit.MaxDiskBytes > 0 {
			resourceLimit = overrides.ResourceLimit
		}
	}
	return api.SandboxOptions{
		Root:          root,
		AllowedPaths:  allowedPaths,
		NetworkAllow:  networkAllow,
		ResourceLimit: resourceLimit,
	}
}

// DefaultModelFactory returns an Anthropic provider (reads ANTHROPIC_API_KEY from env).
func DefaultModelFactory() api.ModelFactory {
	return &model.AnthropicProvider{ModelName: "claude-sonnet-4-5-20250929"}
}

// Run executes a single request.
func (r *Runtime) Run(ctx context.Context, req api.Request) (*api.Response, error) {
	return r.rt.Run(ctx, req)
}

// RunStream executes with streaming events.
func (r *Runtime) RunStream(ctx context.Context, req api.Request) (<-chan api.StreamEvent, error) {
	return r.rt.RunStream(ctx, req)
}

// Close shuts down the runtime.
func (r *Runtime) Close() error {
	return r.rt.Close()
}

// ClearSessionHistory removes the agentsdk-go persisted history for the given session ID.
// History is stored under projectRoot/.claude/history/<sessionID>.json (sessionID is path-sanitized).
// Call this when creating a new session (/new) so the old session's history is not reused.
func ClearSessionHistory(projectRoot, sessionID string) {
	projectRoot = strings.TrimSpace(projectRoot)
	sessionID = strings.TrimSpace(sessionID)
	if projectRoot == "" || sessionID == "" {
		return
	}
	name := historySessionFileName(sessionID)
	if name == "" {
		return
	}
	path := filepath.Join(projectRoot, ".claude", "history", name+".json")
	_ = os.Remove(path)
}

// historySessionFileName sanitizes sessionID for use as a filename, matching agentsdk-go's logic.
func historySessionFileName(sessionID string) string {
	const fallback = "default"
	trimmed := strings.TrimSpace(sessionID)
	if trimmed == "" {
		return fallback
	}
	var b strings.Builder
	b.Grow(len(trimmed))
	for _, r := range trimmed {
		switch {
		case r >= 'a' && r <= 'z',
			r >= 'A' && r <= 'Z',
			r >= '0' && r <= '9',
			r == '-', r == '_':
			b.WriteRune(r)
		default:
			b.WriteByte('-')
		}
	}
	sanitized := strings.Trim(b.String(), "-")
	if sanitized == "" {
		return fallback
	}
	return sanitized
}
