// Package handlers implements the simplified agent Gateway method.
package handlers

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/openocta/openocta/pkg/agent"
	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/stellarlinkco/agentsdk-go/pkg/api"
)

// AgentHandler handles "agent" (simplified: local run, no streaming/delivery).
// Returns { runId, status, summary } compatible with TS agent response shape.
func AgentHandler(opts HandlerOpts) error {
	msg, _ := opts.Params["message"].(string)
	if msg == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "agent params: message (string) required",
		}, nil)
		return nil
	}

	runId := uuid.New().String()
	runDeadline := runtime.DefaultAgentRunDuration(os.Getenv, loadConfigFromContext(opts.Context))
	if runDeadline <= 0 {
		runDeadline = 600 * time.Second
	}
	ctx, cancel := context.WithTimeout(context.Background(), runDeadline)
	defer cancel()

	// Create runtime with model factory from config
	var modelFactory api.ModelFactory
	if opts.Context != nil && opts.Context.Config != nil {
		// Use default agent ID for agent handler
		factory, factoryErr := agent.CreateModelFactoryFromConfig(opts.Context.Config, "main")
		if factoryErr != nil {
			// Fallback to default if config error
			modelFactory = runtime.DefaultModelFactory()
		} else {
			modelFactory = factory
		}
	} else {
		// Fallback to default if config not available
		modelFactory = runtime.DefaultModelFactory()
	}

	var invoker tools.GatewayInvoker
	if opts.Context != nil && opts.Context.InvokeMethod != nil {
		invoker = &gatewayInvokerAdapter{invoke: opts.Context.InvokeMethod}
	}
	agentTools := tools.DefaultToolsWithInvoker(invoker)
	if IsAgentToAgentEnabled(opts.Context.Config) {
		agentTools = append(agentTools, SwarmTools(true)...)
	}
	if opts.Context != nil && opts.Context.MCPTools != nil {
		if mcpTools, mcpErr := opts.Context.MCPTools(ctx); mcpErr == nil && len(mcpTools) > 0 {
			agentTools = append(agentTools, mcpTools...)
		}
	}
	projectRoot := "."
	var runtimeConfig *config.OpenOctaConfig
	if opts.Context != nil && opts.Context.Config != nil {
		runtimeConfig = opts.Context.Config
		projectRoot = agent.ResolveAgentWorkspaceDir(opts.Context.Config, "main", os.Getenv)
		if projectRoot == "" {
			projectRoot = "."
		}
	}
	rt, err := runtime.New(ctx, runtime.Options{
		Tools:              agentTools,
		ModelFactory:       modelFactory,
		ProjectRoot:        projectRoot,
		Config:             runtimeConfig,
		EnableSkills:       true,
		EnableSubagents:    true,
		EnableSystemPrompt: true,
		Env:                os.Getenv,
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeServiceUnavailable,
			Message: "agent runtime: " + err.Error(),
		}, nil)
		return nil
	}
	defer rt.Close()

	// Auto-load skills: built-in (./skills), managed (~/.openclaw/skills), workspace (<workspace>/skills). Priority: workspace > managed > built-in.
	prompt := msg
	if opts.Context != nil && opts.Context.Config != nil {
		workspaceDir := agent.ResolveAgentWorkspaceDir(opts.Context.Config, "main", os.Getenv)
		entries, _ := runtime.LoadSkillsForWorkspace(workspaceDir, opts.Context.Config)
		if len(entries) > 0 {
			skillsPrompt := runtime.BuildSkillsPrompt(entries, opts.Context.Config)
			if strings.TrimSpace(skillsPrompt) != "" {
				prompt = strings.TrimSpace(skillsPrompt) + "\n\n" + msg
			}
		}
	}
	req := api.Request{Prompt: prompt}
	resp, err := rt.Run(ctx, req)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "agent run: " + err.Error(),
		}, nil)
		return nil
	}

	output := ""
	if resp != nil && resp.Result != nil {
		output = resp.Result.Output
	}
	opts.Respond(true, map[string]interface{}{
		"runId":   runId,
		"status":  "ok",
		"summary": map[string]interface{}{"output": output},
	}, nil, nil)
	return nil
}

// RunIsolatedAgentTurn runs one agent turn (used by cron and hooks). agentID and sessionKey identify the run.
func RunIsolatedAgentTurn(ctx *Context, agentID string, sessionKey string, message string) {
	if ctx == nil {
		return
	}
	runDeadline := runtime.DefaultAgentRunDuration(os.Getenv, loadConfigFromContext(ctx))
	if runDeadline <= 0 {
		runDeadline = 600 * time.Second
	}
	runCtx, cancel := context.WithTimeout(context.Background(), runDeadline)
	defer cancel()
	var modelFactory api.ModelFactory
	if ctx.Config != nil {
		factory, err := agent.CreateModelFactoryFromConfig(ctx.Config, agentID)
		if err != nil {
			modelFactory = runtime.DefaultModelFactory()
		} else {
			modelFactory = factory
		}
	} else {
		modelFactory = runtime.DefaultModelFactory()
	}
	var invoker tools.GatewayInvoker
	if ctx.InvokeMethod != nil {
		invoker = &gatewayInvokerAdapter{invoke: ctx.InvokeMethod}
	}
	agentTools := tools.DefaultToolsWithInvoker(invoker)
	if IsAgentToAgentEnabled(ctx.Config) {
		agentTools = append(agentTools, SwarmTools(true)...)
	}
	if ctx.MCPTools != nil {
		if mcpTools, mcpErr := ctx.MCPTools(runCtx); mcpErr == nil && len(mcpTools) > 0 {
			agentTools = append(agentTools, mcpTools...)
		}
	}
	projectRoot := "."
	if ctx.Config != nil {
		projectRoot = agent.ResolveAgentWorkspaceDir(ctx.Config, agentID, os.Getenv)
		if projectRoot == "" {
			projectRoot = "."
		}
	}
	rt, err := runtime.New(runCtx, runtime.Options{
		Tools:               agentTools,
		ModelFactory:        modelFactory,
		ProjectRoot:         projectRoot,
		Config:              ctx.Config,
		EnableSkills:        true,
		EmployeeID:          parseEmployeeIDFromSessionKey(sessionKey),
		EnableSubagents:     true,
		EnableSandbox:       true,
		EnableApprovalQueue: true,
		EnableSystemPrompt:  true,
		Env:                 os.Getenv,
	})
	if err != nil {
		return
	}
	defer rt.Close()
	prompt := message
	if ctx.Config != nil {
		workspaceDir := agent.ResolveAgentWorkspaceDir(ctx.Config, agentID, os.Getenv)
		entries := runtime.LoadEmployeeSkillEntries(workspaceDir, ctx.Config, parseEmployeeIDFromSessionKey(sessionKey), os.Getenv)
		if len(entries) == 0 {
			entries, _ = runtime.LoadSkillsForWorkspace(workspaceDir, ctx.Config)
		}
		if len(entries) > 0 {
			skillsPrompt := runtime.BuildSkillsPrompt(entries, ctx.Config)
			if strings.TrimSpace(skillsPrompt) != "" {
				prompt = strings.TrimSpace(skillsPrompt) + "\n\n" + message
			}
		}
	}
	_, _ = rt.Run(runCtx, api.Request{Prompt: prompt, SessionID: sessionKey})
}

// RunCronAgentOnce runs one non-streaming agent turn for a cron job and returns the output text.
// It mirrors RunIsolatedAgentTurn but exposes the model output so callers can persist it.
func RunCronAgentOnce(ctx *Context, agentID string, sessionKey string, message string) (string, error) {
	if ctx == nil {
		return "", fmt.Errorf("nil gateway context")
	}
	runDeadline := runtime.DefaultAgentRunDuration(os.Getenv, loadConfigFromContext(ctx))
	if runDeadline <= 0 {
		runDeadline = 600 * time.Second
	}
	runCtx, cancel := context.WithTimeout(context.Background(), runDeadline)
	defer cancel()

	var modelFactory api.ModelFactory
	if ctx.Config != nil {
		factory, err := agent.CreateModelFactoryFromConfig(ctx.Config, agentID)
		if err != nil {
			modelFactory = runtime.DefaultModelFactory()
		} else {
			modelFactory = factory
		}
	} else {
		modelFactory = runtime.DefaultModelFactory()
	}

	var invoker tools.GatewayInvoker
	if ctx.InvokeMethod != nil {
		invoker = &gatewayInvokerAdapter{invoke: ctx.InvokeMethod}
	}
	agentTools := tools.DefaultToolsWithInvoker(invoker)
	if IsAgentToAgentEnabled(ctx.Config) {
		agentTools = append(agentTools, SwarmTools(true)...)
	}
	if ctx.MCPTools != nil {
		if mcpTools, mcpErr := ctx.MCPTools(runCtx); mcpErr == nil && len(mcpTools) > 0 {
			agentTools = append(agentTools, mcpTools...)
		}
	}

	projectRoot := "."
	if ctx.Config != nil {
		projectRoot = agent.ResolveAgentWorkspaceDir(ctx.Config, agentID, os.Getenv)
		if projectRoot == "" {
			projectRoot = "."
		}
	}

	rt, err := runtime.New(runCtx, runtime.Options{
		Tools:               agentTools,
		ModelFactory:        modelFactory,
		ProjectRoot:         projectRoot,
		Config:              ctx.Config,
		EnableSkills:        true,
		EmployeeID:          parseEmployeeIDFromSessionKey(sessionKey),
		EnableSubagents:     true,
		EnableSandbox:       true,
		EnableApprovalQueue: true,
		EnableSystemPrompt:  true,
		Env:                 os.Getenv,
	})
	if err != nil {
		return "", err
	}
	defer rt.Close()

	prompt := message
	if ctx.Config != nil {
		workspaceDir := agent.ResolveAgentWorkspaceDir(ctx.Config, agentID, os.Getenv)
		entries := runtime.LoadEmployeeSkillEntries(workspaceDir, ctx.Config, parseEmployeeIDFromSessionKey(sessionKey), os.Getenv)
		if len(entries) == 0 {
			entries, _ = runtime.LoadSkillsForWorkspace(workspaceDir, ctx.Config)
		}
		if len(entries) > 0 {
			skillsPrompt := runtime.BuildSkillsPrompt(entries, ctx.Config)
			if strings.TrimSpace(skillsPrompt) != "" {
				prompt = strings.TrimSpace(skillsPrompt) + "\n\n" + message
			}
		}
	}

	resp, err := rt.Run(runCtx, api.Request{Prompt: prompt, SessionID: sessionKey})
	if err != nil {
		return "", err
	}
	if resp == nil || resp.Result == nil {
		return "", nil
	}
	return resp.Result.Output, nil
}
