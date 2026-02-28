// Package handlers implements chat.send, chat.history, chat.abort, and chat.inject with session transcript support.
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/cexll/agentsdk-go/pkg/api"
	"github.com/google/uuid"
	"github.com/openocta/openocta/pkg/agent"
	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/logging"
	"github.com/openocta/openocta/pkg/session"
)

var chatLog = logging.Sub("chat")

// resetCommandRe matches /new, !new, /reset, !reset with optional trailing message (postResetMessage).
// Submatch 1: optional text after command (e.g. "intro" from "/new intro").
var resetCommandRe = regexp.MustCompile(`(?i)^(?:/|!)(?:new|reset)(?:\s+([\s\S]*))?$`)

// BARE_SESSION_RESET_PROMPT is the default prompt sent after a bare /new or /reset (no trailing message).
// Aligns with openclaw BARE_SESSION_RESET_PROMPT: greet user and ask what they want to do.
const BARE_SESSION_RESET_PROMPT = "当前已通过 /new 或 /reset 开启新会话。请以你配置的人设（如有）向用户打招呼，保持你的语气、风格和情绪。用 1～3 句话问候并询问用户想做什么。若当前运行模型与系统提示中的 default_model 不同，可简要说明。不要提及内部步骤、文件、工具或推理过程。"

// ChatAbortController tracks an active chat run for cancellation.
type ChatAbortController struct {
	Controller  context.CancelFunc
	SessionID   string
	SessionKey  string
	StartedAtMs int64
	ExpiresAtMs int64
}

// chatAbortControllers stores active chat runs by runId.
// TODO: This should be part of Context for proper lifecycle management.
var chatAbortControllers = sync.Map{} // map[string]*ChatAbortController

// nextChatSeq increments and returns the next sequence number for a chat run.
func nextChatSeq(agentRunSeq map[string]int64, runId string) int64 {
	if agentRunSeq == nil {
		return 0
	}
	seq := agentRunSeq[runId]
	seq++
	agentRunSeq[runId] = seq
	return seq
}

// DeliverContext 用于将 assistant 消息投递到 IM 通道（如飞书）。
type DeliverContext struct {
	Channel   string                 // 通道 ID，如 "feishu"、"qq"
	To        string                 // 接收者 ID（chatId/openId/groupId 等）
	ChatType  string                 // "dm"|"group"|"channel"，供 QQ 等区分发送 API
	UserQuery string                 // 用户原始提问，用于格式化 "| 回复 Agent: userQuery"
	AgentName string                 // 助手名称，如 "Desmond"
	Metadata  map[string]interface{} // 通道特定元数据（如 session_webhook）
}

// broadcastChatFinal broadcasts a final chat message to clients.
// 若 deliver 非 nil，同时将消息投递到对应 IM 通道，格式为 "| 回复 {agentName}: {userQuery}\n\n{content}"。
func broadcastChatFinal(ctx *Context, runId string, sessionKey string, message map[string]interface{}, deliver *DeliverContext) {
	if ctx == nil || ctx.Broadcast == nil {
		return
	}
	seq := int64(0)
	if ctx.AgentRunSeq != nil {
		seq = nextChatSeq(ctx.AgentRunSeq, runId)
	}
	payload := map[string]interface{}{
		"runId":      runId,
		"sessionKey": sessionKey,
		"seq":        seq,
		"state":      "final",
		"message":    message,
	}
	ctx.Broadcast("chat", payload, nil)
	if ctx.NodeSendToSession != nil {
		ctx.NodeSendToSession(sessionKey, "chat", payload)
	}

	// 投递到 IM 通道（飞书、QQ、企微、钉钉等）
	if deliver != nil && deliver.Channel != "" && deliver.To != "" && ctx.ChannelManager != nil {
		content := extractAssistantTextFromMessage(message)
		if content != "" {
			formatted := formatChannelReply(deliver.AgentName, deliver.UserQuery, content)
			rt, ok := ctx.ChannelManager.Get(strings.ToLower(deliver.Channel))
			if ok && rt != nil {
				outMsg := &channels.RuntimeOutboundMessage{
					Channel: deliver.Channel,
					ChatID:  deliver.To,
					Content: formatted,
				}
				if deliver.ChatType != "" {
					if outMsg.Metadata == nil {
						outMsg.Metadata = make(map[string]interface{})
					}
					outMsg.Metadata["chat_type"] = deliver.ChatType
				}
				if len(deliver.Metadata) > 0 {
					if outMsg.Metadata == nil {
						outMsg.Metadata = make(map[string]interface{})
					}
					for k, v := range deliver.Metadata {
						outMsg.Metadata[k] = v
					}
				}
				_ = rt.Send(outMsg)
			}
		}
	}
}

// extractAssistantTextFromMessage 从 message body 中提取 assistant 文本内容。
func extractAssistantTextFromMessage(message map[string]interface{}) string {
	if message == nil {
		return ""
	}
	content, ok := message["content"].([]map[string]interface{})
	if !ok {
		if c, ok := message["content"].([]interface{}); ok {
			var parts []string
			for _, item := range c {
				if m, ok := item.(map[string]interface{}); ok {
					if t, ok := m["text"].(string); ok {
						parts = append(parts, t)
					}
				}
			}
			return strings.Join(parts, "")
		}
		return ""
	}
	var parts []string
	for _, block := range content {
		if t, ok := block["text"].(string); ok {
			parts = append(parts, t)
		}
	}
	return strings.Join(parts, "")
}

// resolveAgentDisplayName 从配置解析助手显示名称，默认 "助手"。
func resolveAgentDisplayName(ctx *Context, agentID string) string {
	if ctx == nil || ctx.Config == nil || ctx.Config.Agents == nil || len(ctx.Config.Agents.List) == 0 {
		return "助手"
	}
	agentID = strings.TrimSpace(strings.ToLower(agentID))
	for i := range ctx.Config.Agents.List {
		a := &ctx.Config.Agents.List[i]
		id := strings.TrimSpace(strings.ToLower(a.ID))
		if id == agentID && a.Identity != nil && strings.TrimSpace(a.Identity.Name) != "" {
			return strings.TrimSpace(a.Identity.Name)
		}
	}
	return "助手"
}

// formatChannelReply 格式化为 "| 回复 {agentName}: {userQuery}\n\n{content}"。
func formatChannelReply(agentName, userQuery, content string) string {
	agentName = strings.TrimSpace(agentName)
	if agentName == "" {
		agentName = "助手"
	}
	userQuery = strings.TrimSpace(userQuery)
	if userQuery == "" {
		return content
	}
	return fmt.Sprintf("| 回复 %s: %s\n\n%s", agentName, userQuery, content)
}

// broadcastChatError broadcasts a chat error to clients.
func broadcastChatError(ctx *Context, runId string, sessionKey string, errorMessage string) {
	if ctx == nil || ctx.Broadcast == nil {
		return
	}
	seq := int64(0)
	if ctx.AgentRunSeq != nil {
		seq = nextChatSeq(ctx.AgentRunSeq, runId)
	}
	payload := map[string]interface{}{
		"runId":        runId,
		"sessionKey":   sessionKey,
		"seq":          seq,
		"state":        "error",
		"errorMessage": errorMessage,
	}
	ctx.Broadcast("chat", payload, nil)
	if ctx.NodeSendToSession != nil {
		ctx.NodeSendToSession(sessionKey, "chat", payload)
	}
}

// broadcastAgentEvent broadcasts a single agent stream event to clients.
// Payload format: { runId, stream, data, sessionKey, seq, ts } for GatewayEventFrame event "agent".
func broadcastAgentEvent(ctx *Context, runId string, sessionKey string, stream string, data map[string]interface{}) {
	if ctx == nil || ctx.Broadcast == nil {
		return
	}
	seq := int64(0)
	if ctx.AgentRunSeq != nil {
		seq = nextChatSeq(ctx.AgentRunSeq, runId)
	}
	payload := map[string]interface{}{
		"runId":      runId,
		"stream":     stream,
		"data":       data,
		"sessionKey": sessionKey,
		"seq":        seq,
		"ts":         time.Now().UnixMilli(),
	}
	ctx.Broadcast("agent", payload, nil)
	if ctx.NodeSendToSession != nil {
		ctx.NodeSendToSession(sessionKey, "agent", payload)
	}
}

// buildSkillsSnapshotForSession loads skills for the workspace and returns a snapshot for session store.
// Returns nil on error or when no skills. Snapshot shape matches SessionEntry.skillsSnapshot (prompt, skills, resolvedSkills, version).
func buildSkillsSnapshotForSession(projectRoot string, cfg *config.OpenOctaConfig) interface{} {
	entries, err := runtime.LoadSkillsForWorkspace(projectRoot, cfg)
	if err != nil || len(entries) == 0 {
		return nil
	}
	prompt := runtime.BuildSkillsPrompt(entries, cfg)
	skillsList := make([]map[string]interface{}, 0, len(entries))
	resolvedList := make([]map[string]interface{}, 0, len(entries))
	for _, e := range entries {
		skillsList = append(skillsList, map[string]interface{}{"name": e.Name})
		desc := e.Name
		if e.Frontmatter != nil {
			if d := strings.TrimSpace(e.Frontmatter["description"]); d != "" {
				desc = d
			}
		}
		if e.Metadata != nil && e.Metadata.SkillKey != "" && desc == e.Name {
			desc = e.Metadata.SkillKey
		}
		disableInvoke := false
		if e.Frontmatter != nil {
			if v, ok := e.Frontmatter["disable-model-invocation"]; ok && (v == "true" || v == "1") {
				disableInvoke = true
			}
		}
		resolvedList = append(resolvedList, map[string]interface{}{
			"name":                   e.Name,
			"description":            desc,
			"filePath":               e.FilePath,
			"baseDir":                e.BaseDir,
			"source":                 e.Source,
			"disableModelInvocation": disableInvoke,
		})
	}
	return map[string]interface{}{
		"prompt":         prompt,
		"skills":         skillsList,
		"resolvedSkills": resolvedList,
		"version":        0,
	}
}

// SessionRunSnapshot holds optional session data to persist after a run (systemPromptReport, skillsSnapshot, tools).
type SessionRunSnapshot struct {
	SkillsSnapshot     interface{}
	SystemPromptReport interface{}
	Tools              interface{}
}

// updateSessionAfterRun updates the session entry with channel, sessionFile, updatedAt, and optional snapshot.
func updateSessionAfterRun(ctx *Context, sessionKey string, sessionID string, sessionFile string, snapshot *SessionRunSnapshot) {
	if ctx == nil {
		return
	}
	cfg := loadConfigFromContext(ctx)
	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, sessionKey, env)
	_, err := updateSessionStore(target.storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey := target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = sessionKey
		}
		entry := store[primaryKey]
		entry.Channel = "webchat"
		entry.UpdatedAt = time.Now().UnixMilli()
		if sessionFile != "" {
			entry.SessionFile = sessionFile
		}
		if entry.SessionID == "" {
			entry.SessionID = sessionID
		}
		if snapshot != nil {
			if snapshot.SkillsSnapshot != nil {
				entry.SkillsSnapshot = snapshot.SkillsSnapshot
			}
			if snapshot.SystemPromptReport != nil {
				entry.SystemPromptReport = snapshot.SystemPromptReport
			}
			if snapshot.Tools != nil {
				entry.Tools = snapshot.Tools
			}
		}
		store[primaryKey] = entry
		return entry, nil
	})
	if err != nil {
		chatLog.Warn("update session after run failed sessionKey=%s err=%v", sessionKey, err)
	}
}

// appendErrorToTranscript appends an error message to the transcript as an assistant message.
// This ensures errors are visible to the frontend when they query chat history.
func appendErrorToTranscript(transcriptPath string, errorMsg string, runId string, sessionKey string, ctx *Context) {
	// Format error message with clear indication
	formattedMsg := fmt.Sprintf("[错误] %s", errorMsg)

	// Try to append the error message
	if err := session.AppendAssistantMessage(transcriptPath, formattedMsg); err != nil {
		chatLog.Error("failed to append error to transcript transcriptPath=%s runId=%s sessionKey=%s error=%v originalError=%s", transcriptPath, runId, sessionKey, err, errorMsg)
	} else {
		chatLog.Info("error appended to transcript runId=%s sessionKey=%s error=%s", runId, sessionKey, errorMsg)
	}

	// Broadcast error event to websocket clients for immediate notification
	broadcastChatError(ctx, runId, sessionKey, errorMsg)
}

// ChatHistoryHandler handles "chat.history" - reads messages from transcript.
func ChatHistoryHandler(opts HandlerOpts) error {
	sessionKey, _ := opts.Params["sessionKey"].(string)
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	limitVal, _ := opts.Params["limit"]
	var limit int
	switch v := limitVal.(type) {
	case float64:
		limit = int(v)
	case int:
		limit = v
	default:
		limit = 200
	}
	hardMax := 1000
	if limit <= 0 || limit > hardMax {
		limit = 200
	}

	sessionID, _, _, err := ResolveChatSessionID(opts.Params, opts.Context)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "chat.history: invalid session: " + err.Error(),
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	transcriptPath := session.ResolveSessionFilePath(sessionID, nil, env)
	// Read all messages (limit 0), then take last N to match TS behavior
	msgs, err := session.ReadTranscriptMessages(transcriptPath, 0)
	if err != nil {
		opts.Respond(true, map[string]interface{}{
			"sessionKey": sessionKey,
			"sessionId":  sessionID,
			"messages":   []interface{}{},
		}, nil, nil)
		return nil
	}
	// Take last N messages (match TS behavior)
	start := 0
	if len(msgs) > limit {
		start = len(msgs) - limit
	}
	sliced := msgs[start:]
	messages := make([]interface{}, 0, len(sliced))
	for _, m := range sliced {
		// Convert to client format: { role, content: [{ type, text }], timestamp }
		content := make([]interface{}, 0, len(m.Content))
		for _, b := range m.Content {
			content = append(content, map[string]interface{}{
				"type": b.Type,
				"text": b.Text,
			})
		}
		messages = append(messages, map[string]interface{}{
			"role":      m.Role,
			"content":   content,
			"timestamp": m.Timestamp,
		})
	}
	// Load thinkingLevel and verboseLevel from session store when available
	thinkingLevel := "medium"
	verboseLevel := "normal"
	if key := sessionKey; key != "" {
		cfg := loadConfigFromContext(opts.Context)
		target := resolveGatewaySessionStoreTarget(cfg, key, env)
		store, err := session.LoadSessionStore(target.storePath)
		if err == nil {
			for _, k := range target.storeKeys {
				if e, ok := store[k]; ok {
					if e.ThinkingLevel != "" {
						thinkingLevel = e.ThinkingLevel
					}
					if e.VerboseLevel != "" {
						verboseLevel = e.VerboseLevel
					}
					break
				}
			}
		}
	}

	opts.Respond(true, map[string]interface{}{
		"sessionKey":    sessionKey,
		"sessionId":     sessionID,
		"messages":      messages,
		"thinkingLevel": thinkingLevel,
		"verboseLevel":  verboseLevel,
	}, nil, nil)
	return nil
}

// runSessionResetForChat performs session reset (new session) and returns new sessionID, sessionFile, storePath, transcriptPath.
// Used when user sends /new or /reset: reset first, then continue with postResetMessage or BARE_SESSION_RESET_PROMPT.
func runSessionResetForChat(sessionKey string, ctx *Context) (sessionID, sessionFile, storePath, transcriptPath string, err error) {
	if sessionKey == "" {
		sessionKey = "main"
	}
	cfg := loadConfigFromContext(ctx)
	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, sessionKey, env)
	storePath = target.storePath

	var oldSessionID string
	next, updErr := updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey := target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = sessionKey
		}
		existingKey := ""
		for _, candidate := range target.storeKeys {
			if _, ok := store[candidate]; ok {
				existingKey = candidate
				break
			}
		}
		if existingKey != "" && existingKey != primaryKey && store[primaryKey].SessionID == "" {
			store[primaryKey] = store[existingKey]
			delete(store, existingKey)
		}
		entry := store[primaryKey]
		oldSessionID = entry.SessionID
		now := time.Now().UnixMilli()
		newSessionID := uuid.New().String()
		nextEntry := session.SessionEntry{
			SessionID:     newSessionID,
			UpdatedAt:     now,
			SessionFile:   newSessionID + ".jsonl",
			Label:         entry.Label,
			Channel:       entry.Channel,
			ChatType:      entry.ChatType,
			ThinkingLevel: entry.ThinkingLevel,
			VerboseLevel:  entry.VerboseLevel,
		}
		store[primaryKey] = nextEntry
		return nextEntry, nil
	})
	if updErr != nil {
		return "", "", "", "", updErr
	}

	if oldSessionID != "" {
		projectRoot := "."
		if ctx != nil && ctx.Config != nil {
			agentID := agent.ResolveSessionAgentID(sessionKey)
			projectRoot = agent.ResolveAgentWorkspaceDir(ctx.Config, agentID, env)
		}
		if projectRoot == "" {
			projectRoot = "."
		}
		runtime.ClearSessionHistory(projectRoot, oldSessionID)
	}

	transcriptPath = session.ResolveSessionFilePath(next.SessionID, nil, env)
	if ensureErr := session.EnsureTranscriptFile(transcriptPath, next.SessionID); ensureErr != nil {
		chatLog.Warn("runSessionResetForChat: ensure transcript failed path=%s sessionID=%s error=%v", transcriptPath, next.SessionID, ensureErr)
	}
	return next.SessionID, next.SessionFile, storePath, transcriptPath, nil
}

// ChatSendHandler handles "chat.send" (append to transcript; optional agent dispatch).
func ChatSendHandler(opts HandlerOpts) error {
	// Extract and validate parameters
	messageRaw, _ := opts.Params["message"].(string)
	message := strings.TrimSpace(messageRaw)

	sessionKey, _ := opts.Params["sessionKey"].(string)
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	if sessionKey == "" {
		sessionKey = "main"
	}

	// Check for stop command (simplified check)
	// 停止该会话
	if strings.HasPrefix(strings.ToLower(message), "/stop") || strings.HasPrefix(strings.ToLower(message), "!stop") {
		return handleChatStopCommand(opts)
	}
	// 开启思考模式
	if strings.HasPrefix(strings.ToLower(message), "/think") || strings.HasPrefix(strings.ToLower(message), "!think") {
		return handleChatThinkingCommand(opts, message)
	}

	// Reset command (/new, !new, /reset, !reset): reset session then continue with postResetMessage or BARE_SESSION_RESET_PROMPT (do not return).
	var sessionID, sessionFile, storePathForTranscript, transcriptPath string
	var err error
	if resetCommandRe.MatchString(message) {
		sessionID, sessionFile, storePathForTranscript, transcriptPath, err = runSessionResetForChat(sessionKey, opts.Context)
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInternal,
				Message: "chat.send: session reset failed: " + err.Error(),
			}, nil)
			return nil
		}
		postReset := resetCommandRe.FindStringSubmatch(message)
		if len(postReset) > 1 && strings.TrimSpace(postReset[1]) != "" {
			message = strings.TrimSpace(postReset[1])
		} else {
			message = BARE_SESSION_RESET_PROMPT
		}
	} else {
		sessionID, sessionFile, storePathForTranscript, err = ResolveChatSessionID(opts.Params, opts.Context)
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInvalidRequest,
				Message: "chat.send: invalid session: " + err.Error(),
			}, nil)
			return nil
		}
		env := func(k string) string { return os.Getenv(k) }
		if sessionFile != "" && storePathForTranscript != "" {
			sessionsDir := filepath.Dir(storePathForTranscript)
			joined := filepath.Join(sessionsDir, sessionFile)
			if !strings.Contains(joined, "..") {
				transcriptPath = joined
			}
		}
		if transcriptPath == "" {
			transcriptPath = session.ResolveSessionFilePath(sessionID, nil, env)
		}
	}

	// Support attachments (simplified - just check if present)
	attachmentsRaw, _ := opts.Params["attachments"].([]interface{})
	hasAttachments := len(attachmentsRaw) > 0

	if message == "" && !hasAttachments {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "chat.send: message or attachment required",
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }

	// Extract idempotencyKey (use as runId)
	idempotencyKey, _ := opts.Params["idempotencyKey"].(string)
	if idempotencyKey == "" {
		idempotencyKey = uuid.New().String()
	}
	runId := idempotencyKey

	// Check for duplicate request
	if existing, ok := chatAbortControllers.Load(runId); ok {
		ctrl := existing.(*ChatAbortController)
		if ctrl.SessionKey == sessionKey {
			opts.Respond(true, map[string]interface{}{
				"runId":  runId,
				"status": "in_flight",
			}, nil, map[string]interface{}{
				"cached": true,
				"runId":  runId,
			})
			return nil
		}
	}

	if err := session.EnsureTranscriptFile(transcriptPath, sessionID); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeServiceUnavailable,
			Message: "chat.send: " + err.Error(),
		}, nil)
		return nil
	}

	// Append user message to transcript
	if message != "" {
		if err := session.AppendUserMessage(transcriptPath, message); err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInternal,
				Message: "chat.send: append failed: " + err.Error(),
			}, nil)
			return nil
		}
		// Touch session's updatedAt in sessions.json so UI can see latest activity time.
		agentID := agent.ResolveSessionAgentID(sessionKey)
		if err := session.UpdateSessionUpdatedAt(agentID, sessionID, env, 0); err != nil {
			chatLog.Warn("failed to update session updatedAt agentID=%s sessionID=%s error=%v", agentID, sessionID, err)
		}
	}

	// Extract optional parameters
	//deliver := true // default to true (matches TS behavior)
	//if d, ok := opts.Params["deliver"].(bool); ok {
	//	deliver = d
	//}
	thinking, _ := opts.Params["thinking"].(string)
	timeoutMs := 300000 // default 300 seconds
	if t, ok := opts.Params["timeoutMs"].(float64); ok && t > 0 {
		timeoutMs = int(t)
	} else if t, ok := opts.Params["timeoutMs"].(int); ok && t > 0 {
		timeoutMs = t
	}

	// Send acknowledgment immediately
	opts.Respond(true, map[string]interface{}{
		"runId":  runId,
		"status": "started",
	}, nil, map[string]interface{}{
		"runId": runId,
	})

	// When deliver is true, trigger agent run asynchronously
	if message != "" {
		// Create abort controller for this run
		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeoutMs)*time.Millisecond)
		now := time.Now().UnixMilli()
		expiresAt := now + int64(timeoutMs)

		ctrl := &ChatAbortController{
			Controller:  cancel,
			SessionID:   sessionID,
			SessionKey:  sessionKey,
			StartedAtMs: now,
			ExpiresAtMs: expiresAt,
		}
		chatAbortControllers.Store(runId, ctrl)

		// 提取投递上下文（用于飞书、QQ、企微、钉钉等通道）
		deliverChannel, _ := opts.Params["channel"].(string)
		deliverTo, _ := opts.Params["to"].(string)
		deliverChatType, _ := opts.Params["chatType"].(string)
		deliverOriginalMessage := message
		deliverAgentName := resolveAgentDisplayName(opts.Context, agent.ResolveSessionAgentID(sessionKey))
		var deliverCtx *DeliverContext
		if deliverChannel != "" && deliverTo != "" {
			deliverCtx = &DeliverContext{
				Channel:   strings.TrimSpace(deliverChannel),
				To:        strings.TrimSpace(deliverTo),
				ChatType:  strings.TrimSpace(deliverChatType),
				UserQuery: deliverOriginalMessage,
				AgentName: deliverAgentName,
			}
		}

		go func() {
			ctxForBroadcast := opts.Context // Capture context for broadcast
			deliverForGoroutine := deliverCtx
			defer func() {
				chatAbortControllers.Delete(runId)
				cancel()
			}()

			// Recover from panics and handle them as errors
			defer func() {
				if r := recover(); r != nil {
					errMsg := "agent run panic: "
					if err, ok := r.(error); ok {
						errMsg += err.Error()
					} else {
						errMsg += fmt.Sprintf("%v", r)
					}
					appendErrorToTranscript(transcriptPath, errMsg, runId, sessionKey, ctxForBroadcast)
				}
			}()

			// Build prompt with thinking injection if provided
			prompt := message
			if thinking != "" && !strings.HasPrefix(message, "/") {
				prompt = "/think " + thinking + " " + message
			}

			// Create runtime with model factory from config
			var modelFactory api.ModelFactory
			if ctxForBroadcast != nil && ctxForBroadcast.Config != nil {
				agentID := agent.ResolveSessionAgentID(sessionKey)
				factory, factoryErr := agent.CreateModelFactoryFromConfig(ctxForBroadcast.Config, agentID)
				if factoryErr != nil {
					chatLog.Warn("failed to create model factory from config, using default agentID=%s error=%v", agentID, factoryErr)
					modelFactory = runtime.DefaultModelFactory()
				} else {
					modelFactory = factory
				}
			} else {
				// Fallback to default if config not available
				modelFactory = runtime.DefaultModelFactory()
			}

			var invoker tools.GatewayInvoker
			if ctxForBroadcast != nil && ctxForBroadcast.InvokeMethod != nil {
				invoker = &gatewayInvokerAdapter{invoke: ctxForBroadcast.InvokeMethod}
			}
			// Resolve workspace root and config first so we can decide MCP source (config vs context)
			projectRoot := ""
			var runtimeConfig *config.OpenOctaConfig
			agentID := "main"
			if ctxForBroadcast != nil && ctxForBroadcast.Config != nil {
				runtimeConfig = ctxForBroadcast.Config
				agentID = agent.ResolveSessionAgentID(sessionKey)
				projectRoot = agent.ResolveAgentWorkspaceDir(ctxForBroadcast.Config, agentID, os.Getenv)
			}
			if projectRoot == "" {
				projectRoot = "."
			}
			// mcpServers := runtime.BuildMCPServersFromConfig(runtimeConfig)
			mcpServers := make([]string, 0)
			agentTools := tools.DefaultToolsWithInvoker(invoker)
			// Only add MCP tools from context when runtime is NOT given MCPServers, to avoid duplicate registration.
			// When MCPServers is set, the runtime (agentsdk-go) will connect to those servers and register tools once.
			if len(mcpServers) == 0 && ctxForBroadcast != nil && ctxForBroadcast.MCPTools != nil {
				mcpTools, mcpErr := ctxForBroadcast.MCPTools(ctx)
				if mcpErr != nil {
					chatLog.Warn("mcp tools load failed, continuing without MCP sessionKey=%s error=%v", sessionKey, mcpErr)
				} else if len(mcpTools) > 0 {
					for _, t := range mcpTools {
						agentTools = append(agentTools, t)
					}
				}
			}

			rtOpts := runtime.Options{
				Tools:              agentTools,
				ModelFactory:       modelFactory,
				ProjectRoot:        projectRoot,
				Config:             runtimeConfig,
				EnableSkills:       true,
				EnableCommands:     true,
				EnableSubagents:    true,
				EnableSandbox:      true,
				EnableSystemPrompt: true,
				MCPServers:         mcpServers,
				TokenTracking:      true,
				AgentID:            "main", // session transcript path is ~/.openclaw/agents/main/sessions/<sessionID>.jsonl
				Env:                os.Getenv,
			}
			rt, err := runtime.New(ctx, rtOpts)
			if err != nil {
				errMsg := fmt.Sprintf("无法创建运行时: %s", err.Error())
				appendErrorToTranscript(transcriptPath, errMsg, runId, sessionKey, ctxForBroadcast)
				return
			}
			defer rt.Close()

			// Execute agent run with streaming
			runStart := time.Now()
			req := api.Request{
				Prompt:    prompt,
				SessionID: sessionID,
			}
			eventChan, streamErr := rt.RunStream(ctx, req)
			if streamErr != nil {
				// Fallback to non-streaming run if RunStream is not supported
				resp, runErr := rt.Run(ctx, req)
				if ctx.Err() != nil {
					reason := "已取消"
					if ctx.Err() == context.DeadlineExceeded {
						reason = "已超时"
					} else if ctx.Err() == context.Canceled {
						reason = "已中止"
					}
					appendErrorToTranscript(transcriptPath, fmt.Sprintf("对话%s", reason), runId, sessionKey, ctxForBroadcast)
					return
				}
				if runErr != nil {
					appendErrorToTranscript(transcriptPath, fmt.Sprintf("模型执行失败: %s", runErr.Error()), runId, sessionKey, ctxForBroadcast)
					return
				}
				output := ""
				var opts *session.AssistantMessageOpts
				if resp != nil && resp.Result != nil {
					output = resp.Result.Output
					usage := resp.Result.Usage
					total := usage.TotalTokens
					if total == 0 && (usage.InputTokens > 0 || usage.OutputTokens > 0) {
						total = usage.InputTokens + usage.OutputTokens + usage.CacheReadTokens + usage.CacheCreationTokens
					}
					durationMs := time.Since(runStart).Milliseconds()
					opts = &session.AssistantMessageOpts{
						StopReason: resp.Result.StopReason,
						DurationMs: &durationMs,
					}
					if usage.InputTokens > 0 || usage.OutputTokens > 0 || total > 0 {
						opts.Usage = &session.Usage{
							Input:       usage.InputTokens,
							Output:      usage.OutputTokens,
							CacheRead:   usage.CacheReadTokens,
							CacheWrite:  usage.CacheCreationTokens,
							TotalTokens: total,
						}
					}
				}
				if output != "" {
					if err := session.AppendAssistantMessageWithUsage(transcriptPath, output, opts); err != nil {
						chatLog.Error("failed to append assistant message transcriptPath=%s runId=%s error=%v", transcriptPath, runId, err)
						appendErrorToTranscript(transcriptPath, fmt.Sprintf("无法保存回复: %s", err.Error()), runId, sessionKey, ctxForBroadcast)
						return
					}
					messageBody := map[string]interface{}{
						"role":      "assistant",
						"content":   []map[string]interface{}{{"type": "text", "text": output}},
						"timestamp": time.Now().UnixMilli(),
					}
					broadcastChatFinal(ctxForBroadcast, runId, sessionKey, messageBody, deliverForGoroutine)
				} else {
					appendErrorToTranscript(transcriptPath, "模型未返回任何输出", runId, sessionKey, ctxForBroadcast)
				}
				snapshot := &SessionRunSnapshot{SkillsSnapshot: buildSkillsSnapshotForSession(projectRoot, runtimeConfig)}
				updateSessionAfterRun(ctxForBroadcast, sessionKey, sessionID, sessionFile, snapshot)
				return
			}

			// Stream events: broadcast agent events and append to sessionFile (transcript)
			var textBuf strings.Builder
			var assistantContent []map[string]interface{}
			var lastMessageID string
			var usageSnapshot *api.Usage
			stopReason := ""

			for evt := range eventChan {
				if ctx.Err() != nil {
					break
				}
				switch evt.Type {
				case api.EventContentBlockDelta:
					if evt.Delta != nil && evt.Delta.Text != "" {
						delta := evt.Delta.Text
						textBuf.WriteString(delta)
						broadcastAgentEvent(ctxForBroadcast, runId, sessionKey, "assistant", map[string]interface{}{
							"text":  delta,
							"delta": delta,
						})
					}
					if evt.Delta != nil && evt.Delta.StopReason != "" {
						stopReason = evt.Delta.StopReason
					}
				case api.EventContentBlockStart:
					if evt.ContentBlock != nil {
						if evt.ContentBlock.Type == "tool_use" {
							tc := map[string]interface{}{
								"type":      "toolCall",
								"id":        evt.ContentBlock.ID,
								"name":      evt.ContentBlock.Name,
								"arguments": map[string]interface{}{},
							}
							if len(evt.ContentBlock.Input) > 0 {
								var args map[string]interface{}
								if json.Unmarshal(evt.ContentBlock.Input, &args) == nil {
									tc["arguments"] = args
								}
							}
							assistantContent = append(assistantContent, tc)
							broadcastAgentEvent(ctxForBroadcast, runId, sessionKey, "tool_call", map[string]interface{}{
								"toolCallId": evt.ContentBlock.ID,
								"name":       evt.ContentBlock.Name,
								"arguments":  evt.ContentBlock.Input,
							})
						} else if evt.ContentBlock.Type == "text" && evt.ContentBlock.Text != "" {
							assistantContent = append(assistantContent, map[string]interface{}{"type": "text", "text": evt.ContentBlock.Text})
						}
					}
				case api.EventToolExecutionResult:
					isErr := evt.IsError != nil && *evt.IsError
					outputStr := ""
					if evt.Output != nil {
						if s, ok := evt.Output.(string); ok {
							outputStr = s
						} else {
							b, _ := json.Marshal(evt.Output)
							outputStr = string(b)
						}
					}
					broadcastAgentEvent(ctxForBroadcast, runId, sessionKey, "tool_result", map[string]interface{}{
						"toolCallId": evt.ToolUseID,
						"toolName":   evt.Name,
						"content":    outputStr,
						"isError":    isErr,
					})
					parentID := lastMessageID
					msgID := uuid.New().String()[:8]
					lastMessageID = msgID
					ts := time.Now().UTC().Format(time.RFC3339)
					tsMs := time.Now().UnixMilli()
					line := map[string]interface{}{
						"type":      "message",
						"id":        msgID,
						"parentId":  parentID,
						"timestamp": ts,
						"message": map[string]interface{}{
							"role":       "toolResult",
							"toolCallId": evt.ToolUseID,
							"toolName":   evt.Name,
							"content":    []map[string]interface{}{{"type": "text", "text": outputStr}},
							"isError":    isErr,
							"timestamp":  tsMs,
						},
					}
					if err := session.AppendTranscriptLine(transcriptPath, line); err != nil {
						chatLog.Warn("append toolResult to transcript failed path=%s err=%v", transcriptPath, err)
					}
				case api.EventMessageDelta:
					if evt.Usage != nil {
						usageSnapshot = evt.Usage
					}
				case api.EventMessageStop:
					if evt.Usage != nil {
						usageSnapshot = evt.Usage
					}
					if stopReason == "" && evt.Delta != nil {
						stopReason = evt.Delta.StopReason
					}
					// Flush assistant message: thinking + toolCalls + text (snapshot for this turn only)
					if textBuf.Len() > 0 {
						assistantContent = append(assistantContent, map[string]interface{}{"type": "text", "text": textBuf.String()})
					}
					if len(assistantContent) > 0 {
						parentID := lastMessageID
						msgID := uuid.New().String()[:8]
						lastMessageID = msgID
						ts := time.Now().UTC().Format(time.RFC3339)
						tsMs := time.Now().UnixMilli()
						// Snapshot content for transcript and broadcast so later appends don't mutate what we send
						contentSnapshot := make([]map[string]interface{}, len(assistantContent))
						copy(contentSnapshot, assistantContent)
						msgBody := map[string]interface{}{
							"role":      "assistant",
							"content":   contentSnapshot,
							"timestamp": tsMs,
						}
						if usageSnapshot != nil {
							total := usageSnapshot.InputTokens + usageSnapshot.OutputTokens
							msgBody["usage"] = map[string]interface{}{
								"input":       usageSnapshot.InputTokens,
								"output":      usageSnapshot.OutputTokens,
								"totalTokens": total,
							}
						}
						if stopReason != "" {
							msgBody["stopReason"] = stopReason
						}
						durationMs := time.Since(runStart).Milliseconds()
						msgBody["durationMs"] = durationMs
						line := map[string]interface{}{
							"type":      "message",
							"id":        msgID,
							"parentId":  parentID,
							"timestamp": ts,
							"message":   msgBody,
						}
						if err := session.AppendTranscriptLine(transcriptPath, line); err != nil {
							chatLog.Warn("append assistant message to transcript failed path=%s err=%v", transcriptPath, err)
						}
						messageBody := map[string]interface{}{
							"role":      "assistant",
							"content":   contentSnapshot,
							"timestamp": tsMs,
						}
						broadcastChatFinal(ctxForBroadcast, runId, sessionKey, messageBody, deliverForGoroutine)
						// Reset accumulators so next EventMessageStop (if any) does not include this turn's content
						assistantContent = nil
						textBuf.Reset()
					} else if usageSnapshot != nil {
						broadcastChatFinal(ctxForBroadcast, runId, sessionKey, map[string]interface{}{
							"role": "assistant", "content": []map[string]interface{}{}, "timestamp": time.Now().UnixMilli(),
						}, deliverForGoroutine)
					}
				case api.EventError:
					outMsg := ""
					if evt.Output != nil {
						if s, ok := evt.Output.(string); ok {
							outMsg = s
						} else {
							b, _ := json.Marshal(evt.Output)
							outMsg = string(b)
						}
					}
					appendErrorToTranscript(transcriptPath, outMsg, runId, sessionKey, ctxForBroadcast)
					return
				}
			}

			// Context cancelled or stream closed
			if ctx.Err() != nil {
				reason := "已取消"
				if ctx.Err() == context.DeadlineExceeded {
					reason = "已超时"
				} else if ctx.Err() == context.Canceled {
					reason = "已中止"
				}
				appendErrorToTranscript(transcriptPath, fmt.Sprintf("对话%s", reason), runId, sessionKey, ctxForBroadcast)
				return
			}

			// If no message_stop was received but we have text, append and broadcast
			if textBuf.Len() > 0 && len(assistantContent) == 0 {
				output := textBuf.String()
				durationMs := time.Since(runStart).Milliseconds()
				opts := &session.AssistantMessageOpts{StopReason: stopReason, DurationMs: &durationMs}
				if usageSnapshot != nil {
					opts.Usage = &session.Usage{
						Input:       usageSnapshot.InputTokens,
						Output:      usageSnapshot.OutputTokens,
						TotalTokens: usageSnapshot.InputTokens + usageSnapshot.OutputTokens,
					}
				}
				if err := session.AppendAssistantMessageWithUsage(transcriptPath, output, opts); err != nil {
					chatLog.Error("failed to append assistant message transcriptPath=%s runId=%s error=%v", transcriptPath, runId, err)
				} else {
					messageBody := map[string]interface{}{
						"role":      "assistant",
						"content":   []map[string]interface{}{{"type": "text", "text": output}},
						"timestamp": time.Now().UnixMilli(),
					}
					broadcastChatFinal(ctxForBroadcast, runId, sessionKey, messageBody, deliverForGoroutine)
				}
			}

			snapshot := &SessionRunSnapshot{SkillsSnapshot: buildSkillsSnapshotForSession(projectRoot, runtimeConfig)}
			updateSessionAfterRun(ctxForBroadcast, sessionKey, sessionID, sessionFile, snapshot)
		}()
	}

	return nil
}

// handleChatStopCommand handles stop commands (simplified version).
func handleChatStopCommand(opts HandlerOpts) error {
	sessionKey, _ := opts.Params["sessionKey"].(string)
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))

	// Find and cancel all runs for this session
	var aborted []string
	chatAbortControllers.Range(func(key, value interface{}) bool {
		runId := key.(string)
		ctrl := value.(*ChatAbortController)
		if ctrl.SessionKey == sessionKey {
			ctrl.Controller()
			chatAbortControllers.Delete(runId)
			aborted = append(aborted, runId)
		}
		return true
	})

	opts.Respond(true, map[string]interface{}{
		"ok":      true,
		"aborted": len(aborted) > 0,
		"runIds":  aborted,
	}, nil, nil)
	return nil
}

// handleChatNewCommand handles /new and !new - creates a new session, updates sessions.json, and creates a new <sessionId>.jsonl.
func handleChatNewCommand(opts HandlerOpts) error {
	sessionKey, _ := opts.Params["sessionKey"].(string)
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	if sessionKey == "" {
		sessionKey = "main"
	}

	cfg := loadConfigFromContext(opts.Context)
	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, sessionKey, env)
	storePath := target.storePath

	var oldSessionID string
	next, err := updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey := target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = sessionKey
		}
		existingKey := ""
		for _, candidate := range target.storeKeys {
			if _, ok := store[candidate]; ok {
				existingKey = candidate
				break
			}
		}
		if existingKey != "" && existingKey != primaryKey && store[primaryKey].SessionID == "" {
			store[primaryKey] = store[existingKey]
			delete(store, existingKey)
		}
		entry := store[primaryKey]
		oldSessionID = entry.SessionID
		now := time.Now().UnixMilli()
		newSessionID := uuid.New().String()
		nextEntry := session.SessionEntry{
			SessionID:     newSessionID,
			UpdatedAt:     now,
			SessionFile:   newSessionID + ".jsonl",
			Label:         entry.Label,
			Channel:       entry.Channel,
			ChatType:      entry.ChatType,
			ThinkingLevel: entry.ThinkingLevel,
			VerboseLevel:  entry.VerboseLevel,
		}
		store[primaryKey] = nextEntry
		return nextEntry, nil
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "chat.send /new: " + err.Error(),
		}, nil)
		return nil
	}

	// Clear agentsdk-go runtime history for the old session so it is not reused.
	if oldSessionID != "" {
		projectRoot := "."
		if opts.Context != nil && opts.Context.Config != nil {
			agentID := agent.ResolveSessionAgentID(sessionKey)
			projectRoot = agent.ResolveAgentWorkspaceDir(opts.Context.Config, agentID, env)
		}
		if projectRoot == "" {
			projectRoot = "."
		}
		runtime.ClearSessionHistory(projectRoot, oldSessionID)
	}

	transcriptPath := session.ResolveSessionFilePath(next.SessionID, nil, env)
	if err := session.EnsureTranscriptFile(transcriptPath, next.SessionID); err != nil {
		chatLog.Warn("failed to create new session transcript path=%s sessionID=%s error=%v", transcriptPath, next.SessionID, err)
	}

	opts.Respond(true, map[string]interface{}{
		"ok":         true,
		"key":        target.canonicalKey,
		"sessionId":  next.SessionID,
		"sessionKey": target.canonicalKey,
		"entry":      sessionEntryToMap(next),
	}, nil, nil)
	return nil
}

// handleChatThinkingCommand handles /thinking and !thinking - sets or toggles thinking level in sessions.json.
func handleChatThinkingCommand(opts HandlerOpts, message string) error {
	sessionKey, _ := opts.Params["sessionKey"].(string)
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	if sessionKey == "" {
		sessionKey = "main"
	}

	// Parse level from message: "/thinking" or "/thinking medium" etc.
	level := strings.TrimSpace(message)
	for _, prefix := range []string{"/thinking", "!thinking"} {
		if strings.HasPrefix(strings.ToLower(level), prefix) {
			level = strings.TrimSpace(level[len(prefix):])
			break
		}
	}
	if level == "" {
		level = "medium"
	}
	level = strings.ToLower(level)

	cfg := loadConfigFromContext(opts.Context)
	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, sessionKey, env)
	storePath := target.storePath

	now := time.Now().UnixMilli()
	updated, err := updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey := target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = sessionKey
		}
		existingKey := ""
		for _, candidate := range target.storeKeys {
			if _, ok := store[candidate]; ok {
				existingKey = candidate
				break
			}
		}
		entry := store[primaryKey]
		if existingKey != "" && existingKey != primaryKey && entry.SessionID == "" {
			entry = store[existingKey]
			store[primaryKey] = entry
			delete(store, existingKey)
		}
		if entry.SessionID == "" {
			// Resolve sessionId from key (e.g. agent:main:main -> main)
			sessionID := primaryKey
			if strings.HasPrefix(strings.ToLower(primaryKey), "agent:") {
				parts := strings.SplitN(primaryKey, ":", 3)
				if len(parts) >= 3 {
					sessionID = parts[2]
				}
			}
			entry = session.SessionEntry{SessionID: sessionID, UpdatedAt: now}
		}
		entry.ThinkingLevel = level
		entry.UpdatedAt = now
		store[primaryKey] = entry
		return entry, nil
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "chat.send /thinking: " + err.Error(),
		}, nil)
		return nil
	}

	opts.Respond(true, map[string]interface{}{
		"ok":            true,
		"thinkingLevel": updated.ThinkingLevel,
	}, nil, nil)
	return nil
}

// ChatAbortHandler handles "chat.abort" - cancels an active chat run.
func ChatAbortHandler(opts HandlerOpts) error {
	sessionKey, _ := opts.Params["sessionKey"].(string)
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	runId, _ := opts.Params["runId"].(string)
	runId = strings.TrimSpace(runId)

	// If no runId specified, abort all runs for this session
	if runId == "" {
		var aborted []string
		chatAbortControllers.Range(func(key, value interface{}) bool {
			rid := key.(string)
			ctrl := value.(*ChatAbortController)
			if ctrl.SessionKey == sessionKey {
				ctrl.Controller()
				chatAbortControllers.Delete(rid)
				aborted = append(aborted, rid)
			}
			return true
		})
		opts.Respond(true, map[string]interface{}{
			"ok":      true,
			"aborted": len(aborted) > 0,
			"runIds":  aborted,
		}, nil, nil)
		return nil
	}

	// Abort specific runId
	existing, ok := chatAbortControllers.Load(runId)
	if !ok {
		opts.Respond(true, map[string]interface{}{
			"ok":      true,
			"aborted": false,
			"runIds":  []string{},
		}, nil, nil)
		return nil
	}

	ctrl := existing.(*ChatAbortController)
	if ctrl.SessionKey != sessionKey {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "runId does not match sessionKey",
		}, nil)
		return nil
	}

	ctrl.Controller()
	chatAbortControllers.Delete(runId)

	opts.Respond(true, map[string]interface{}{
		"ok":      true,
		"aborted": true,
		"runIds":  []string{runId},
	}, nil, nil)
	return nil
}

// ChatInjectHandler handles "chat.inject" - injects an assistant message into the transcript.
func ChatInjectHandler(opts HandlerOpts) error {
	sessionKey, _ := opts.Params["sessionKey"].(string)
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	message, _ := opts.Params["message"].(string)
	message = strings.TrimSpace(message)
	label, _ := opts.Params["label"].(string)

	if message == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "chat.inject: message required",
		}, nil)
		return nil
	}

	sessionID, _, _, err := ResolveChatSessionID(opts.Params, opts.Context)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "chat.inject: invalid session: " + err.Error(),
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	transcriptPath := session.ResolveSessionFilePath(sessionID, nil, env)

	// Ensure transcript file exists
	if err := session.EnsureTranscriptFile(transcriptPath, sessionID); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeServiceUnavailable,
			Message: "chat.inject: " + err.Error(),
		}, nil)
		return nil
	}

	// Build message with optional label prefix
	messageText := message
	if label != "" {
		messageText = "[" + label + "]\n\n" + message
	}

	// Create transcript entry
	now := time.Now().UnixMilli()
	messageID := uuid.New().String()[:8]
	messageBody := map[string]interface{}{
		"role":       "assistant",
		"content":    []map[string]interface{}{{"type": "text", "text": messageText}},
		"timestamp":  now,
		"stopReason": "injected",
		"usage": map[string]interface{}{
			"input":       0,
			"output":      0,
			"totalTokens": 0,
		},
	}
	transcriptEntry := map[string]interface{}{
		"type":      "message",
		"id":        messageID,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"message":   messageBody,
	}

	// Append to transcript file
	entryJSON, err := json.Marshal(transcriptEntry)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "chat.inject: failed to marshal entry: " + err.Error(),
		}, nil)
		return nil
	}

	f, err := os.OpenFile(transcriptPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeServiceUnavailable,
			Message: "chat.inject: failed to write transcript: " + err.Error(),
		}, nil)
		return nil
	}
	defer f.Close()

	if _, err := f.WriteString(string(entryJSON) + "\n"); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeServiceUnavailable,
			Message: "chat.inject: failed to write transcript: " + err.Error(),
		}, nil)
		return nil
	}

	// Broadcast to webchat clients for immediate UI update
	runId := fmt.Sprintf("inject-%s", messageID)
	if opts.Context != nil {
		broadcastChatFinal(opts.Context, runId, sessionKey, messageBody, nil)
	}

	opts.Respond(true, map[string]interface{}{
		"ok":        true,
		"messageId": messageID,
	}, nil, nil)
	return nil
}
