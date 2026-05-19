package handlers

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"time"

	"github.com/openocta/openocta/pkg/a2a/executor"
	"github.com/openocta/openocta/pkg/agent"
	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/employees"
	"github.com/openocta/openocta/pkg/gateway/swarmsvc"
	"github.com/openocta/openocta/pkg/session"
	"github.com/openocta/openocta/pkg/swarm"
	"github.com/stellarlinkco/agentsdk-go/pkg/api"
)

// SwarmGatewayRunner executes agent turns for swarm members.
type SwarmGatewayRunner struct {
	Ctx *Context
}

// Run implements executor.Runner.
func (r *SwarmGatewayRunner) Run(ctx context.Context, agentID, sessionKey, message string, onDelta executor.StreamCallback) (string, error) {
	if r.Ctx == nil {
		return "", nil
	}
	gw := r.Ctx
	var modelFactory api.ModelFactory
	if gw.Config != nil {
		factory, err := agent.CreateModelFactoryFromConfig(gw.Config, agentID)
		if err != nil {
			modelFactory = runtime.DefaultModelFactory()
		} else {
			modelFactory = factory
		}
	} else {
		modelFactory = runtime.DefaultModelFactory()
	}

	var invoker tools.GatewayInvoker
	if gw.InvokeMethod != nil {
		invoker = &gatewayInvokerAdapter{invoke: gw.InvokeMethod}
	}
	projectRoot := "."
	if gw.Config != nil {
		projectRoot = agent.ResolveAgentWorkspaceDir(gw.Config, agentID, os.Getenv)
		if projectRoot == "" {
			projectRoot = "."
		}
	}

	agentTools := tools.DefaultToolsWithInvoker(invoker)
	canSpawn := true
	if swarm.IsSwarmSessionKey(sessionKey) {
		if _, wsID, memberID, ok := swarm.ParseMemberSessionKey(sessionKey); ok {
			if orch := swarmsvc.Orch(); orch != nil && orch.Store != nil {
				canSpawn, _ = swarm.CanMemberSpawn(orch.Store, wsID, memberID)
			}
		}
		agentTools = append(agentTools, SwarmTools(canSpawn)...)
	} else if IsAgentToAgentEnabled(gw.Config) {
		agentTools = append(agentTools, SwarmTools(true)...)
	}

	employeeID := parseEmployeeIDFromSessionKey(sessionKey)
	systemPromptOverrides := ""
	if employeeID != "" {
		if m, err := employees.LoadManifest(employeeID, os.Getenv); err == nil && m != nil {
			systemPromptOverrides = strings.TrimSpace(m.Prompt)
		}
	}
	if _, wsID, memberID, ok := swarm.ParseMemberSessionKey(sessionKey); ok {
		opts := swarm.SwarmPromptOpts{
			WorkspaceID: wsID,
			MemberID:    memberID,
			CanSpawn:    canSpawn,
			ProjectRoot: projectRoot,
		}
		if orch := swarmsvc.Orch(); orch != nil && orch.Store != nil {
			opts.Depth = orch.Store.MemberDepth(memberID)
			opts.DirectChildren = orch.Store.CountDirectChildren(memberID)
		}
		swarmPrompt := swarm.BuildSwarmSystemPrompt(opts)
		if swarmPrompt != "" {
			if systemPromptOverrides != "" {
				systemPromptOverrides = swarmPrompt + "\n\n" + systemPromptOverrides
			} else {
				systemPromptOverrides = swarmPrompt
			}
		}
	}

	rt, err := runtime.New(ctx, runtime.Options{
		Tools:                 agentTools,
		ModelFactory:          modelFactory,
		ProjectRoot:           projectRoot,
		Config:                gw.Config,
		EnableSkills:          true,
		EmployeeID:            employeeID,
		EnableSubagents:       true,
		EnableSandbox:         true,
		EnableApprovalQueue:   true,
		EnableSystemPrompt:    true,
		SystemPromptOverrides: systemPromptOverrides,
		AgentID:               agentID,
		Env:                   os.Getenv,
	})
	if err != nil {
		return "", err
	}
	defer rt.Close()

	ensureSwarmSessionEntry(gw, sessionKey, employeeID, "")
	appendSwarmChatTranscript(gw, sessionKey, agentID, message, "")

	prompt := message
	if gw.Config != nil {
		workspaceDir := agent.ResolveAgentWorkspaceDir(gw.Config, agentID, os.Getenv)
		entries := runtime.LoadEmployeeSkillEntries(workspaceDir, gw.Config, employeeID, os.Getenv)
		if len(entries) == 0 {
			entries, _ = runtime.LoadSkillsForWorkspace(workspaceDir, gw.Config)
		}
		if len(entries) > 0 {
			skillsPrompt := runtime.BuildSkillsPrompt(entries, gw.Config)
			if strings.TrimSpace(skillsPrompt) != "" {
				prompt = strings.TrimSpace(skillsPrompt) + "\n\n" + message
			}
		}
	}

	eventChan, streamErr := rt.RunStream(ctx, api.Request{Prompt: prompt, SessionID: sessionKey})
	if streamErr != nil {
		resp, runErr := rt.Run(ctx, api.Request{Prompt: prompt, SessionID: sessionKey})
		if runErr != nil {
			return "", runErr
		}
		out := ""
		if resp != nil && resp.Result != nil {
			out = resp.Result.Output
		}
		if onDelta != nil && out != "" {
			onDelta("assistant", map[string]interface{}{"text": out})
		}
		ensureSwarmSessionEntry(gw, sessionKey, employeeID, "")
		appendSwarmChatTranscript(gw, sessionKey, agentID, "", out)
		return out, nil
	}

	var lastText strings.Builder
	for ev := range eventChan {
		switch ev.Type {
		case api.EventContentBlockDelta:
			if ev.Delta != nil && ev.Delta.Text != "" {
				lastText.WriteString(ev.Delta.Text)
				if onDelta != nil {
					onDelta("assistant", map[string]interface{}{"text": ev.Delta.Text})
				}
			}
		case api.EventContentBlockStart:
			if onDelta != nil && ev.ContentBlock != nil && ev.ContentBlock.Type == "tool_use" {
				onDelta("tool_call", map[string]interface{}{
					"toolCallId": ev.ContentBlock.ID,
					"name":       ev.ContentBlock.Name,
					"arguments":  ev.ContentBlock.Input,
				})
			}
		case api.EventToolExecutionResult:
			if onDelta != nil {
				isErr := ev.IsError != nil && *ev.IsError
				outputStr := ""
				if ev.Output != nil {
					if s, ok := ev.Output.(string); ok {
						outputStr = s
					} else {
						b, _ := json.Marshal(ev.Output)
						outputStr = string(b)
					}
				}
				onDelta("tool_result", map[string]interface{}{
					"toolCallId": ev.ToolUseID,
					"toolName":   ev.Name,
					"content":    outputStr,
					"isError":    isErr,
				})
			}
		}
	}
	out := strings.TrimSpace(lastText.String())
	ensureSwarmSessionEntry(gw, sessionKey, employeeID, "")
	appendSwarmChatTranscript(gw, sessionKey, agentID, "", out)
	return out, nil
}

// appendSwarmChatTranscript mirrors chat.send transcript writes so swarm turns appear in chat.history.
func appendSwarmChatTranscript(ctx *Context, sessionKey, agentID, userText, assistantText string) {
	if ctx == nil {
		return
	}
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	if sessionKey == "" {
		return
	}
	if agentID == "" {
		agentID = agent.ResolveSessionAgentID(sessionKey)
	}
	sessionID, sessionFile, storePath, err := ResolveChatSessionID(map[string]interface{}{
		"sessionKey": sessionKey,
	}, ctx)
	if err != nil {
		chatLog.Warn("swarm transcript: resolve session failed key=%s err=%v", sessionKey, err)
		return
	}
	env := os.Getenv
	transcriptPath := resolveSessionTranscriptPath(sessionID, storePath, sessionFile, agentID, env)
	if transcriptPath == "" {
		return
	}
	if err := session.EnsureTranscriptFile(transcriptPath, sessionID); err != nil {
		chatLog.Warn("swarm transcript: ensure file failed path=%s err=%v", transcriptPath, err)
	}
	if t := strings.TrimSpace(userText); t != "" {
		if err := session.AppendUserMessage(transcriptPath, t); err != nil {
			chatLog.Warn("swarm transcript: append user failed path=%s err=%v", transcriptPath, err)
		}
	}
	if t := strings.TrimSpace(assistantText); t != "" {
		if err := session.AppendAssistantMessage(transcriptPath, t); err != nil {
			chatLog.Warn("swarm transcript: append assistant failed path=%s err=%v", transcriptPath, err)
		}
	}
}

func ensureSwarmSessionEntry(ctx *Context, sessionKey, employeeID, spawnedBy string) {
	if ctx == nil || sessionKey == "" {
		return
	}
	agentID := agent.ResolveSessionAgentID(sessionKey)
	storePath := session.ResolveDefaultSessionStorePath(agentID, os.Getenv)
	store, err := session.LoadSessionStore(storePath)
	if err != nil {
		store = session.SessionStore{}
	}
	entry, ok := store[sessionKey]
	if !ok {
		entry = session.SessionEntry{
			SessionID: session.SanitizeForSessionID(sessionKey),
			UpdatedAt: time.Now().UnixMilli(),
		}
	}
	if strings.TrimSpace(entry.SessionID) == "" {
		entry.SessionID = session.SanitizeForSessionID(sessionKey)
	}
	if strings.TrimSpace(entry.SessionFile) == "" && strings.TrimSpace(entry.SessionID) != "" {
		entry.SessionFile = entry.SessionID + ".jsonl"
	}
	entry.UpdatedAt = time.Now().UnixMilli()
	if spawnedBy != "" {
		entry.SpawnedBy = spawnedBy
	}
	if employeeID != "" {
		entry.Label = employeeID
	}
	store[sessionKey] = entry
	_ = session.SaveSessionStore(storePath, store)
}
