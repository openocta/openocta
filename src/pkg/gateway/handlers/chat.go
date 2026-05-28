// Package handlers implements chat.send, chat.history, chat.abort, and chat.inject with session transcript support.
package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/openocta/openocta/pkg/paths"

	"github.com/google/uuid"
	mcpManager "github.com/openocta/openocta/pkg/acp/mcp"
	"github.com/openocta/openocta/pkg/agent"
	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/employees"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/logging"
	"github.com/openocta/openocta/pkg/session"
	"github.com/stellarlinkco/agentsdk-go/pkg/api"
	"github.com/stellarlinkco/agentsdk-go/pkg/model"
	sdkTool "github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

var chatLog = logging.Sub("chat")

// xunfeiProviderName extracts the provider name from a modelRef string
// (e.g. "xunfei/spark-lite" → "xunfei"). Returns empty string if no slash.
func xunfeiProviderName(modelRef string) string {
	if idx := strings.IndexByte(modelRef, '/'); idx >= 0 {
		return strings.TrimSpace(modelRef[:idx])
	}
	return ""
}

// resetCommandRe matches /new, !new, /reset, !reset with optional trailing message (postResetMessage).
// Submatch 1: optional text after command (e.g. "intro" from "/new intro").
var resetCommandRe = regexp.MustCompile(`(?i)^(?:/|!)(?:new|reset)(?:\s+([\s\S]*))?$`)

// BARE_SESSION_RESET_PROMPT is the default prompt sent after a bare /new or /reset (no trailing message).
// Aligns with openclaw BARE_SESSION_RESET_PROMPT: greet user and ask what they want to do.
const BARE_SESSION_RESET_PROMPT = "当前已通过 /new 或 /reset 开启新会话。请以你配置的人设（如有）向用户打招呼，保持你的语气、风格和情绪。用 1～3 句话问候并询问用户想做什么。若当前运行模型与系统提示中的 default_model 不同，可简要说明。不要提及内部步骤、文件、工具或推理过程。"

// agentRunSeqMu protects Context.AgentRunSeq from concurrent access.
// Chat runs are executed in goroutines and broadcast functions call nextChatSeq
// concurrently; plain Go maps would panic ("concurrent map writes") without a lock.
var agentRunSeqMu sync.Mutex

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
	agentRunSeqMu.Lock()
	defer agentRunSeqMu.Unlock()
	seq := agentRunSeq[runId]
	seq++
	agentRunSeq[runId] = seq
	return seq
}

// DeliverContext 用于将 assistant 消息投递到 IM 通道（如飞书）。
type DeliverContext struct {
	Channel       string                 // 通道 ID，如 "feishu"、"qq"
	To            string                 // 接收者 ID（chatId/openId/groupId 等）
	ChatType      string                 // "dm"|"group"|"channel"，供 QQ 等区分发送 API
	RootMessageID string                 // 用户消息 ID，用于飞书回复 API
	UserQuery     string                 // 用户原始提问，用于格式化 "| 回复 Agent: userQuery"
	AgentName     string                 // 助手名称，如 "Desmond"
	Metadata      map[string]interface{} // 通道特定元数据（如 session_webhook）
	Header        string                 // 卡片 header 标题（如定时任务运行内容）
}

// broadcastChatDelta sends an incremental streaming text delta to the frontend.
// The UI uses these to render partial assistant responses in real time (typing effect).
func broadcastChatDelta(ctx *Context, runId string, sessionKey string, accumulatedText string) {
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
		"state":      "delta",
		"message": map[string]interface{}{
			"role": "assistant",
			"content": []map[string]interface{}{
				{"type": "text", "text": accumulatedText},
			},
		},
	}
	ctx.Broadcast("chat", payload, nil)
	if ctx.NodeSendToSession != nil {
		ctx.NodeSendToSession(sessionKey, "chat", payload)
	}
}

// broadcastChatFinal 向 Web/UI 客户端广播一条最终 chat 消息（不写 IM）。
// 飞书 / 钉钉 / 企微 / QQ 等出站由 deliverAssistantToIM 在适当时机单独调用，避免多段 EventMessageStop 多次推送中间过程。
func broadcastChatFinal(ctx *Context, runId string, sessionKey string, message map[string]interface{}) {
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
}

// broadcastChatAborted 通知 Web/UI 客户端本次 run 已被中止，便于清除 chatRunId / 流式状态。
func broadcastChatAborted(ctx *Context, runId string, sessionKey string) {
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
		"state":      "aborted",
	}
	ctx.Broadcast("chat", payload, nil)
	if ctx.NodeSendToSession != nil {
		ctx.NodeSendToSession(sessionKey, "chat", payload)
	}
}

// deliverAssistantToIM 将已格式化好的「最终可见」纯文本投递到 IM（与通道 Runtime.Send 对接；钉钉/企微/飞书共用）。
func deliverAssistantToIM(ctx *Context, deliver *DeliverContext, plainText string) {
	if ctx == nil || deliver == nil || strings.TrimSpace(plainText) == "" {
		return
	}
	if deliver.Channel == "" || deliver.To == "" || ctx.ChannelManager == nil {
		return
	}
	formatted := formatChannelReply(deliver.AgentName, deliver.UserQuery, strings.TrimSpace(plainText))
	rt, ok := ctx.ChannelManager.Get(strings.ToLower(deliver.Channel))
	if !ok || rt == nil {
		return
	}
	outMsg := &channels.RuntimeOutboundMessage{
		Channel:   deliver.Channel,
		ChatID:    deliver.To,
		Content:   formatted,
		ReplyToID: deliver.RootMessageID,
	}
	if deliver.ChatType != "" {
		if outMsg.Metadata == nil {
			outMsg.Metadata = make(map[string]interface{})
		}
		outMsg.Metadata["chat_type"] = deliver.ChatType
	}
	if deliver.Header != "" {
		if outMsg.Metadata == nil {
			outMsg.Metadata = make(map[string]interface{})
		}
		outMsg.Metadata["header"] = deliver.Header
	}
	if len(deliver.Metadata) > 0 {
		if outMsg.Metadata == nil {
			outMsg.Metadata = make(map[string]interface{})
		}
		for k, v := range deliver.Metadata {
			outMsg.Metadata[k] = v
		}
	}
	if err := rt.Send(outMsg); err != nil {
		chatLog.Error("failed to deliver message to IM channel=%s chatID=%s error=%v",
			deliver.Channel, deliver.To, err)
	}
}

// extractAssistantTextFromMessage 从 message body 中提取 assistant 文本内容（完整拼接非工具块文本，供转写等）。
func extractAssistantTextFromMessage(message map[string]interface{}) string {
	blocks := assistantMessageContentBlocks(message)
	var parts []string
	for _, block := range blocks {
		if isAssistantToolBlock(block) {
			continue
		}
		if t, ok := block["text"].(string); ok {
			parts = append(parts, t)
		}
	}
	return strings.Join(parts, "")
}

// assistantMessageContentBlocks 将 message["content"] 规范为块列表。
func assistantMessageContentBlocks(message map[string]interface{}) []map[string]interface{} {
	if message == nil {
		return nil
	}
	content, ok := message["content"].([]map[string]interface{})
	if ok {
		return content
	}
	c, ok := message["content"].([]interface{})
	if !ok {
		return nil
	}
	out := make([]map[string]interface{}, 0, len(c))
	for _, item := range c {
		if m, ok := item.(map[string]interface{}); ok {
			out = append(out, m)
		}
	}
	return out
}

func isAssistantToolBlock(block map[string]interface{}) bool {
	if block == nil {
		return false
	}
	typ, _ := block["type"].(string)
	switch strings.ToLower(strings.TrimSpace(typ)) {
	case "toolcall", "tool_call", "tool_use":
		return true
	default:
		return false
	}
}

// extractAssistantTextForIMDelivery 提取「对用户的最终可见回复」：只拼接「最后一个工具块之后」的文本，
// 用于 IM 投递与 cron 摘要，避免把工具调用前的说明等写入飞书/企微或 cron 结果文件。
func extractAssistantTextForIMDelivery(message map[string]interface{}) string {
	blocks := assistantMessageContentBlocks(message)
	if len(blocks) == 0 {
		return ""
	}
	lastToolIdx := -1
	for i := range blocks {
		if isAssistantToolBlock(blocks[i]) {
			lastToolIdx = i
		}
	}
	var parts []string
	for i := lastToolIdx + 1; i < len(blocks); i++ {
		b := blocks[i]
		if isAssistantToolBlock(b) {
			continue
		}
		t, ok := b["text"].(string)
		if !ok || strings.TrimSpace(t) == "" {
			continue
		}
		typ, _ := b["type"].(string)
		if strings.TrimSpace(strings.ToLower(typ)) == "thinking" {
			continue
		}
		if typ != "" && typ != "text" {
			continue
		}
		parts = append(parts, t)
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
	return content
	// return fmt.Sprintf("| 回复 %s: %s\n\n%s", agentName, userQuery, content)
}

// isCronSessionKey 检测 sessionKey 是否表示 cron 会话。
// 统一只支持 "agent:<agentId>:cron:<jobId>" 形式，不再接受 "cron:<jobId>"。
func isCronSessionKey(sessionKey string) bool {
	key := strings.TrimSpace(strings.ToLower(sessionKey))
	if key == "" {
		return false
	}
	parts := strings.Split(key, ":")
	if len(parts) >= 4 && parts[0] == "agent" && parts[2] == "cron" {
		return true
	}
	return false
}

// writeCronSessionResult 将 cron 会话的最终结果写入
// ~/.openocta/cron/runs/<sessionId>.jsonl，单行 JSON 结构与 cron.run 日志保持一致：
// {"ts":..., "jobId":..., "action":"finished", "status":"ok", "summary": "...", "sessionId": "...", "sessionKey": "...", "runAtMs":..., "durationMs":...}
// 注意：这里只做 best-effort 写入，任何错误只记录日志而不会向上冒泡。
func writeCronSessionResult(sessionKey, sessionID, summary, status string, runAtMs, durationMs int64) {
	summary = strings.TrimSpace(summary)
	if summary == "" {
		return
	}
	if !isCronSessionKey(sessionKey) {
		return
	}

	// 解析 "agent:<agentId>:cron:<jobId>"，提取 jobId。
	rawKey := strings.TrimSpace(sessionKey)
	parts := strings.Split(strings.ToLower(rawKey), ":")
	jobID := ""
	if len(parts) >= 4 && parts[0] == "agent" && parts[2] == "cron" {
		// 使用原始大小写的第 4 段作为 jobId
		rawParts := strings.Split(rawKey, ":")
		if len(rawParts) >= 4 {
			jobID = rawParts[3]
		}
	}
	if jobID == "" {
		return
	}

	nowMs := time.Now().UnixMilli()
	if runAtMs <= 0 {
		runAtMs = nowMs
	}
	if durationMs < 0 {
		durationMs = 0
	}
	if strings.TrimSpace(status) == "" {
		status = "ok"
	}

	stateDir := paths.ResolveStateDir(os.Getenv)
	runsDir := filepath.Join(stateDir, "cron", "runs")
	if err := os.MkdirAll(runsDir, 0o755); err != nil {
		chatLog.Warn("cron: failed to create runs dir dir=%s err=%v", runsDir, err)
		return
	}
	resultPath := filepath.Join(runsDir, sessionID+".jsonl")

	// 结果中的 sessionKey 带上 run 前缀，方便在 UI 中区分不同运行：
	// agent:main:cron:<jobId>:run:<sessionId>
	resultSessionKey := fmt.Sprintf("agent:main:cron:%s:run:%s", jobID, sessionID)

	doc := map[string]interface{}{
		"ts":         nowMs,
		"jobId":      jobID,
		"action":     "finished",
		"status":     status,
		"summary":    summary,
		"sessionId":  sessionID,
		"sessionKey": resultSessionKey,
		"runAtMs":    runAtMs,
		"durationMs": durationMs,
	}
	data, err := json.Marshal(doc)
	if err != nil {
		chatLog.Warn("cron: failed to marshal session result jobId=%s err=%v", jobID, err)
		return
	}
	f, err := os.OpenFile(resultPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		chatLog.Warn("cron: failed to open session result path=%s err=%v", resultPath, err)
		return
	}
	defer f.Close()
	if _, err := f.Write(append(data, '\n')); err != nil {
		chatLog.Warn("cron: failed to append session result path=%s err=%v", resultPath, err)
	}
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

// buildSkillsSnapshotForSession loads skills for the workspace and returns a snapshot for session store。
// 对于普通会话，直接基于 workspace 构建；对于数字员工会话（employee- 前缀），会优先加载该员工专属 skills。
// 返回值形状与 SessionEntry.skillsSnapshot 一致（prompt, skills, resolvedSkills, version）。
// Returns nil on error or when no skills.
func buildSkillsSnapshotForSession(projectRoot string, cfg *config.OpenOctaConfig, sessionKey string) interface{} {
	if employeeID := parseEmployeeIDFromSessionKey(sessionKey); employeeID != "" {
		if snap := buildSkillsSnapshotForEmployee(projectRoot, cfg, employeeID); snap != nil {
			return snap
		}
	}

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

// buildSkillsSnapshotForEmployee 针对数字员工会话构建 skills 快照：
// 1) ~/.openocta/employees/<employeeID>/skills 下的用户自建 skills
// 2) manifest.skillIds 中引用的全局 skills（基于 workspace 加载并按名称过滤）
func buildSkillsSnapshotForEmployee(projectRoot string, cfg *config.OpenOctaConfig, employeeID string) interface{} {
	entries := runtime.LoadEmployeeSkillEntries(projectRoot, cfg, employeeID, os.Getenv)
	if len(entries) == 0 {
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

// buildMCPForSession 为会话构建 MCP 规格列表。
// 对于数字员工会话（employee- 前缀），会合并全局 mcp.servers 与员工 manifest.mcpServers（同 key 时员工覆盖）。
func buildMCPForSession(sessionKey string, cfg *config.OpenOctaConfig) map[string]config.McpServerEntry {
	merged := &config.McpConfig{Servers: make(map[string]config.McpServerEntry)}
	if cfg != nil && cfg.Mcp != nil {
		for k, v := range cfg.Mcp.Servers {
			if !v.Enabled {
				continue
			}
			merged.Servers[k] = v
		}
	}
	if employeeID := parseEmployeeIDFromSessionKey(sessionKey); employeeID != "" {
		env := func(k string) string { return os.Getenv(k) }
		if m, err := employees.LoadManifest(employeeID, env); err == nil && m != nil && len(m.McpServers) > 0 {
			for k, v := range m.McpServers {
				if !v.Enabled {
					continue
				}
				merged.Servers[k] = v
			}
		}
	}
	return merged.Servers
}

// parseEmployeeIDFromSessionKey 解析 sessionKey 中的数字员工 ID。
// 支持以下格式：
// - agent:main:employee:<employeeId>:run:<sessionId>（推荐格式）
// - agent:<agentId>:employee-<employeeId>-<rest>
// - employee-<employeeId>-<rest>
// - employee-<employeeId>
func parseEmployeeIDFromSessionKey(sessionKey string) string {
	sessionKey = strings.TrimSpace(strings.ToLower(sessionKey))
	if sessionKey == "" {
		return ""
	}
	parts := strings.Split(sessionKey, ":")
	// agent:main:employee:<id>:run:<sessionId>
	if len(parts) >= 4 && parts[2] == "employee" && parts[3] != "" && parts[3] != "run" {
		return parts[3]
	}
	suffix := sessionKey
	if strings.HasPrefix(sessionKey, "agent:") {
		if len(parts) >= 3 {
			suffix = parts[2]
		} else {
			return ""
		}
	}
	if strings.HasPrefix(suffix, "employee-") {
		rest := strings.TrimPrefix(suffix, "employee-")
		if rest == "" {
			return ""
		}
		if idx := strings.IndexByte(rest, '-'); idx > 0 {
			return rest[:idx]
		}
		return rest
	}
	return ""
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
		limit = 100
	}
	hardMax := 1000
	if limit <= 0 || limit > hardMax {
		limit = 100
	}

	sessionID, sessionFile, storePath, err := ResolveChatSessionID(opts.Params, opts.Context)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "chat.history: invalid session: " + err.Error(),
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	cfg := loadConfigFromContext(opts.Context)
	resolveKey := sessionKey
	if resolveKey == "" {
		resolveKey = "main"
	}
	target := resolveGatewaySessionStoreTarget(cfg, resolveKey, env)
	transcriptPath := resolveSessionTranscriptPath(sessionID, storePath, sessionFile, target.agentID, env)
	// Read all messages (limit 0), then take last N to match TS behavior
	msgs, err := session.ReadTranscriptMessages(transcriptPath, 0)
	if err != nil {
		for _, alt := range resolveSessionTranscriptCandidates(sessionID, storePath, sessionFile, target.agentID, env) {
			if alt == transcriptPath {
				continue
			}
			if m2, e2 := session.ReadTranscriptMessages(alt, 0); e2 == nil {
				msgs, err = m2, nil
				transcriptPath = alt
				break
			}
		}
	}
	// ReadTranscriptMessages may return a non-nil error after the first oversize line (legacy 64KiB scanner limit)
	// while still holding messages parsed so far. Do not drop those — empty UI history is worse than truncated.
	if err != nil && len(msgs) > 0 {
		chatLog.Warn("chat.history: transcript read incomplete path=%s err=%v keptMessages=%d", transcriptPath, err, len(msgs))
		err = nil
	}
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
			if b.Type == "image" {
				content = append(content, map[string]interface{}{
					"type": "image",
					"source": map[string]interface{}{
						"type":       "base64",
						"media_type": b.MimeType,
						"data":       b.Data,
					},
				})
			} else {
				content = append(content, map[string]interface{}{
					"type": b.Type,
					"text": b.Text,
				})
			}
		}
		msgMap := map[string]interface{}{
			"role":      m.Role,
			"content":   content,
			"timestamp": m.Timestamp,
		}
		if m.DurationMs != nil {
			msgMap["durationMs"] = *m.DurationMs
		}
		if m.FirstTokenMs != nil {
			msgMap["firstTokenMs"] = *m.FirstTokenMs
		}
		if m.ToolDurationMs != nil {
			msgMap["toolDurationMs"] = *m.ToolDurationMs
		}
		if m.OutputDurationMs != nil {
			msgMap["outputDurationMs"] = *m.OutputDurationMs
		}
		messages = append(messages, msgMap)
	}
	// Load thinkingLevel and verboseLevel from session store when available
	thinkingLevel := "medium"
	verboseLevel := "normal"
	if key := sessionKey; key != "" {
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
	cronSession := isCronSessionKey(sessionKey)

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

	// 若是 cron 会话且还没有显式的 sessionFile，则使用默认规则 <sessionId>.jsonl，
	// 方便后续 sessions.json 与转录文件建立稳定映射。
	if cronSession && sessionFile == "" {
		sessionFile = sessionID + ".jsonl"
	}

	// 对于 cron 会话，在真正请求大模型前，就先在 sessions.json 中建立或更新一条记录，
	// 这样控制台可以及时看到该会话。
	if cronSession {
		updateSessionAfterRun(opts.Context, sessionKey, sessionID, sessionFile, nil)
	}

	// Support attachments (simplified - just check if present)
	attachmentsRaw, _ := opts.Params["attachments"].([]interface{})
	hasAttachments := len(attachmentsRaw) > 0
	if hasAttachments {
		env := func(k string) string { return os.Getenv(k) }
		cfg := loadConfigFromContext(opts.Context)
		agentID := agent.ResolveSessionAgentID(sessionKey)
		projectRoot := agent.ResolveAgentWorkspaceDir(cfg, agentID, env)
		if projectRoot == "" {
			projectRoot = "."
		}
		attachmentsDir := filepath.Join(projectRoot, "attachments")
		_ = os.MkdirAll(attachmentsDir, 0755)

		names := make([]string, 0, len(attachmentsRaw))
		for _, raw := range attachmentsRaw {
			obj, ok := raw.(map[string]interface{})
			if !ok {
				continue
			}
			fn, _ := obj["filename"].(string)
			fn = strings.TrimSpace(fn)
			if fn == "" {
				fn = "attachment"
			}

			// Process and save the attachment to workspace
			// Support both dataUrl (legacy) and content (new format with raw base64)
			var base64Data string
			dataUrl, _ := obj["dataUrl"].(string)
			contentRaw, _ := obj["content"].(string)
			mimeType, _ := obj["mimeType"].(string)

			if dataUrl != "" {
				parts := strings.SplitN(dataUrl, ",", 2)
				if len(parts) == 2 {
					base64Data = strings.TrimSpace(parts[1])
				}
			} else if contentRaw != "" {
				base64Data = strings.TrimSpace(contentRaw)
			}

			if base64Data != "" {
				base64Data = strings.ReplaceAll(base64Data, "\r", "")
				base64Data = strings.ReplaceAll(base64Data, "\n", "")

				dec, err := base64.StdEncoding.DecodeString(base64Data)
				if err != nil {
					dec, err = base64.RawStdEncoding.DecodeString(base64Data)
				}
				if err == nil {
					// Auto-add extension from mimeType if filename lacks one
					saveName := fn
					if filepath.Ext(saveName) == "" && mimeType != "" {
						switch {
						case strings.HasPrefix(mimeType, "image/png"):
							saveName = fn + ".png"
						case strings.HasPrefix(mimeType, "image/jpeg"):
							saveName = fn + ".jpg"
						case strings.HasPrefix(mimeType, "image/gif"):
							saveName = fn + ".gif"
						case strings.HasPrefix(mimeType, "image/webp"):
							saveName = fn + ".webp"
						case strings.HasPrefix(mimeType, "image/bmp"):
							saveName = fn + ".bmp"
						case strings.HasPrefix(mimeType, "image/svg+xml"):
							saveName = fn + ".svg"
						}
					}
					filePath := filepath.Join(attachmentsDir, saveName)
					if writeErr := os.WriteFile(filePath, dec, 0644); writeErr == nil {
						relPath := filepath.Join("attachments", saveName)
						names = append(names, fmt.Sprintf("%s (已保存到 %s)", saveName, filepath.ToSlash(relPath)))
						continue
					} else {
						chatLog.Warn("ChatSendHandler: failed to write attachment file path=%s error=%v", filePath, writeErr)
					}
				} else {
					chatLog.Warn("ChatSendHandler: failed to decode base64 attachment filename=%s error=%v", fn, err)
				}
			}
			names = append(names, fn)
		}
		if message == "" {
			if len(names) > 0 {
				message = "[附件] " + strings.Join(names, ", ")
			} else {
				message = "[附件]"
			}
		} else {
			if len(names) > 0 {
				message = message + "\n\n[附件] " + strings.Join(names, ", ")
			}
		}
	}

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

	// Append user message to transcript (include image blocks so they persist across turns)
	hasContent := message != "" || hasAttachments
	if hasContent {
		// Build image ContentBlocks for transcript persistence
		var transcriptImageBlocks []session.ContentBlock
		for _, raw := range attachmentsRaw {
			obj, ok := raw.(map[string]interface{})
			if !ok {
				continue
			}
			content, _ := obj["content"].(string)
			dataUrl, _ := obj["dataUrl"].(string)
			mimeType, _ := obj["mimeType"].(string)
			if content == "" && dataUrl == "" {
				continue
			}
			var base64Data string
			if content != "" {
				base64Data = content
			} else {
				parts := strings.SplitN(dataUrl, ",", 2)
				if len(parts) == 2 {
					base64Data = parts[1]
				}
			}
			if base64Data != "" {
				blockType := "document"
				if strings.HasPrefix(strings.ToLower(mimeType), "image/") {
					blockType = "image"
				}
				transcriptImageBlocks = append(transcriptImageBlocks, session.ContentBlock{
					Type:     blockType,
					MimeType: mimeType,
					Data:     base64Data,
				})
			}
		}
		appendErr := session.AppendUserMessageWithBlocks(transcriptPath, message, transcriptImageBlocks)
		// Fallback: if the new method fails (e.g. old binary reading new transcript),
		// try the plain-text AppendUserMessage
		if appendErr != nil {
			appendErr = session.AppendUserMessage(transcriptPath, message)
		}
		if appendErr != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInternal,
				Message: "chat.send: append failed: " + appendErr.Error(),
			}, nil)
			return nil
		}
		// Touch session's updatedAt in sessions.json so UI can see latest activity time。
		// 对于 cron 会话，依赖 updateSessionAfterRun 使用 canonical sessionKey
		// 更新，避免基于裸 sessionId 再写一份重复 entry。
		if !cronSession {
			agentID := agent.ResolveSessionAgentID(sessionKey)
			if err := session.UpdateSessionUpdatedAt(agentID, sessionID, env, 0); err != nil {
				chatLog.Warn("failed to update session updatedAt agentID=%s sessionID=%s error=%v", agentID, sessionID, err)
			}
		}
	}

	// Extract optional parameters
	//deliver := true // default to true (matches TS behavior)
	//if d, ok := opts.Params["deliver"].(bool); ok {
	//	deliver = d
	//}
	thinking, _ := opts.Params["thinking"].(string)
	timeoutMs := 0
	if t, ok := opts.Params["timeoutMs"].(float64); ok && t > 0 {
		timeoutMs = int(t)
	} else if t, ok := opts.Params["timeoutMs"].(int); ok && t > 0 {
		timeoutMs = t
	} else if t, ok := opts.Params["timeoutMs"].(int64); ok && t > 0 {
		timeoutMs = int(t)
	}
	if timeoutMs <= 0 {
		cfg := loadConfigFromContext(opts.Context)
		if d := runtime.DefaultAgentRunDuration(os.Getenv, cfg); d > 0 {
			timeoutMs = int(d / time.Millisecond)
		} else {
			timeoutMs = 600000 // OPENOCTA_AGENT_RUN_TIMEOUT=0 等：回退 10 分钟
		}
	}

	// When deliver is true, trigger agent run asynchronously
	if message != "" {
		// Create abort controller for this run（须在 Respond 之前注册，避免客户端收到 started 后立即 chat.abort 时 map 中尚无 runId）
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
		deliverMessageID, _ := opts.Params["messageId"].(string)
		deliverHeader, _ := opts.Params["header"].(string)
		deliverOriginalMessage := message
		deliverAgentName := resolveAgentDisplayName(opts.Context, agent.ResolveSessionAgentID(sessionKey))
		var deliverCtx *DeliverContext
		if deliverChannel != "" && deliverTo != "" {
			deliverCtx = &DeliverContext{
				Channel:       strings.TrimSpace(deliverChannel),
				To:            strings.TrimSpace(deliverTo),
				ChatType:      strings.TrimSpace(deliverChatType),
				RootMessageID: strings.TrimSpace(deliverMessageID),
				Header:        strings.TrimSpace(deliverHeader),
				UserQuery:     deliverOriginalMessage,
				AgentName:     deliverAgentName,
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

			// Build prompt with thinking injection if provided.
			// NOTE: Do NOT use "/think" prefix - agentsdk-go parses lines starting with "/"
			// as slash commands. If "think" is not registered in .claude/commands/, it
			// returns "commands: unknown command". Use a non-command format instead.
			prompt := message
			if thinking != "" && !strings.HasPrefix(message, "/") {
				prompt = "[思考级别: " + thinking + "]\n\n" + message
			}

			// Create runtime with model factory from config
			var modelFactory api.ModelFactory
			var isXunfeiProvider bool
			if cfg := loadConfigFromContext(ctxForBroadcast); cfg != nil {
				agentID := agent.ResolveSessionAgentID(sessionKey)
				modelRefOverride, _ := opts.Params["modelRef"].(string)
				modelRefOverride = strings.TrimSpace(modelRefOverride)
				// Extract provider name for image format detection
				providerName := xunfeiProviderName(modelRefOverride)
				// If no explicit modelRef, resolve from agent's default config
				if providerName == "" && modelRefOverride == "" {
					providerName = xunfeiProviderName(agent.ResolveAgentModelRef(cfg, agentID))
				}
				isXunfeiProvider = strings.EqualFold(providerName, "xunfei") || strings.EqualFold(providerName, "spark")
				// Detect whether this request has image attachments (for Xunfei image-API routing)
				hasImageAttachments := false
				for _, raw := range attachmentsRaw {
					if obj, ok := raw.(map[string]interface{}); ok {
						if mime, _ := obj["mimeType"].(string); strings.HasPrefix(strings.ToLower(mime), "image/") {
							hasImageAttachments = true
							break
						}
					}
				}
				var factory api.ModelFactory
				var factoryErr error
				if modelRefOverride != "" {
					factory, factoryErr = agent.CreateModelFactoryForModelRef(cfg, modelRefOverride)
				} else {
					factory, factoryErr = agent.CreateModelFactoryFromConfig(cfg, agentID)
				}
				if factoryErr != nil {
					chatLog.Warn("failed to create model factory from config, using default agentID=%s error=%v", agentID, factoryErr)
					errMsg := fmt.Sprintf("无法创建运行时: %s", factoryErr)
					appendErrorToTranscript(transcriptPath, errMsg, runId, sessionKey, ctxForBroadcast)
					return
					//modelFactory = runtime.DefaultModelFactory()
				} else {
					modelFactory = factory
				}
				// Route to Xunfei Image Understanding WebSocket API when:
				// 1. Provider is xunfei/spark, AND
				// 2. Request contains image attachments
				// The Xunfei OpenAI-compatible chat endpoint does NOT support image_url.
				if isXunfeiProvider && hasImageAttachments {
					imageFactory := agent.CreateXunfeiImageFactory(cfg)
					if imageFactory != nil {
						chatLog.Info("routing to xunfei image understanding API (has images)")
						modelFactory = imageFactory
					} else {
						chatLog.Warn("xunfei image credentials missing, falling back to OpenAI-compatible endpoint")
					}
				}
			} else {
				// Fallback to default if config not available
				modelFactory = runtime.DefaultModelFactory()
			}

			var invoker tools.GatewayInvoker
			if ctxForBroadcast != nil && ctxForBroadcast.InvokeMethod != nil {
				invoker = &gatewayInvokerAdapter{invoke: ctxForBroadcast.InvokeMethod}
			}
			// Resolve workspace root and config first so we can decide MCP source (config vs context).
			// 使用 loadConfigFromContext 确保在 ctx.Config 为空时也能从 LoadConfigSnapshot 获取最新配置（含 MCP）。
			projectRoot := ""
			runtimeConfig := loadConfigFromContext(ctxForBroadcast)
			agentID := "main"
			if runtimeConfig != nil {
				agentID = agent.ResolveSessionAgentID(sessionKey)
				projectRoot = agent.ResolveAgentWorkspaceDir(runtimeConfig, agentID, os.Getenv)
			}
			if projectRoot == "" {
				projectRoot = "."
			}
			mcpServers := buildMCPForSession(sessionKey, runtimeConfig)
			agentTools := tools.DefaultToolsWithInvoker(invoker)

			// Merge tools by name, prefer later source on conflicts.
			toolOrder := make([]string, 0, len(agentTools))
			toolByName := make(map[string]sdkTool.Tool, len(agentTools))
			addTool := func(t sdkTool.Tool) {
				if t == nil {
					return
				}
				name := strings.TrimSpace(t.Name())
				if name == "" {
					return
				}
				if _, ok := toolByName[name]; !ok {
					toolOrder = append(toolOrder, name)
				}
				toolByName[name] = t
			}
			for _, t := range agentTools {
				addTool(t)
			}
			// Add MCP tools from gateway context (env injection + long-lived connections).
			if ctxForBroadcast != nil && ctxForBroadcast.MCPTools != nil {
				mcpTools, mcpErr := ctxForBroadcast.MCPTools(ctx)
				if mcpErr != nil {
					chatLog.Warn("mcp tools load failed, continuing without MCP sessionKey=%s error=%v", sessionKey, mcpErr)
				} else if len(mcpTools) > 0 {
					for _, t := range mcpTools {
						// Lower precedence than tools generated from mcpServers below.
						addTool(t)
					}
				}
			}

			// Add MCP tools from merged server specs (global config + employee manifest).
			// On duplicates, tools built from mcpServers take precedence over context-injected MCP tools.
			if len(mcpServers) > 0 {
				// IMPORTANT: Do not mutate runtimeConfig.Mcp.Servers here; that is the loaded config snapshot.
				// Build a merged server map for MCP manager only.
				serversMerged := make(map[string]config.McpServerEntry)
				if runtimeConfig != nil && runtimeConfig.Mcp != nil && len(runtimeConfig.Mcp.Servers) > 0 {
					for k, v := range runtimeConfig.Mcp.Servers {
						if !v.Enabled {
							continue
						}
						serversMerged[k] = v
					}
				}
				// Session/employee derived servers override duplicates.
				for k, v := range mcpServers {
					if !v.Enabled {
						continue
					}
					serversMerged[k] = v
				}

				mgr, err := mcpManager.NewManager(context.Background(), serversMerged)
				if err == nil && mgr != nil {
					defer mgr.Close()
					mcpTools, mcpToolsErr := mgr.Tools(ctx)
					if mcpToolsErr == nil {
						for _, t := range mcpTools {
							addTool(t)
						}
					}
				}
			}

			if IsAgentToAgentEnabled(runtimeConfig) {
				for _, t := range SwarmTools(true) {
					addTool(t)
				}
			}

			agentTools = make([]sdkTool.Tool, 0, len(toolOrder))
			for _, name := range toolOrder {
				if t, ok := toolByName[name]; ok && t != nil {
					agentTools = append(agentTools, t)
				}
			}

			// 数字员工会话：若 manifest 有 Prompt，作为 SystemPromptOverrides 传入，/new 后仍保留人设
			systemPromptOverrides := ""
			if empID := parseEmployeeIDFromSessionKey(sessionKey); empID != "" {
				env := func(k string) string { return os.Getenv(k) }
				if m, err := employees.LoadManifest(empID, env); err == nil && m != nil && strings.TrimSpace(m.Prompt) != "" {
					systemPromptOverrides = strings.TrimSpace(m.Prompt)
				}
			}
			sessionAgentID := agent.ResolveSessionAgentID(sessionKey)
			modelRefForBudget, _ := opts.Params["modelRef"].(string)
			tokenLimit := agent.TokenLimitForSessionHistory(runtimeConfig, sessionAgentID, strings.TrimSpace(modelRefForBudget))
			rtOpts := runtime.Options{
				Tools:                 agentTools,
				ModelFactory:          modelFactory,
				ProjectRoot:           projectRoot,
				Config:                runtimeConfig,
				EnableSkills:          true,
				EmployeeID:            parseEmployeeIDFromSessionKey(sessionKey),
				EnableSubagents:       true,
				EnableSandbox:         true,
				EnableApprovalQueue:   true,
				EnableSystemPrompt:    true,
				SystemPromptOverrides: systemPromptOverrides,
				TokenTracking:         true,
				AgentID:               sessionAgentID, // 与 sessions jsonl 目录 ~/.openocta/agents/<agentId>/sessions 一致
				Env:                   os.Getenv,
				TokenLimit:            tokenLimit,
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

			var contentBlocks []model.ContentBlock
			for _, raw := range attachmentsRaw {
				obj, ok := raw.(map[string]interface{})
				if !ok {
					continue
				}
				// Frontend sends 'content' field with base64 data (without dataUrl prefix)
				// Fallback to 'dataUrl' for backward compatibility
				content, _ := obj["content"].(string)
				dataUrl, _ := obj["dataUrl"].(string)
				mimeType, _ := obj["mimeType"].(string)
				if content == "" && dataUrl == "" {
					continue
				}

				var base64Data string
				if content != "" {
					// New format: content field contains raw base64 data
					base64Data = content
				} else {
					// Legacy format: dataUrl field contains full data URL with prefix
					parts := strings.SplitN(dataUrl, ",", 2)
					if len(parts) != 2 {
						continue
					}
					base64Data = parts[1]
				}

			var blockType model.ContentBlockType = model.ContentBlockDocument
			if strings.HasPrefix(strings.ToLower(mimeType), "image/") {
				blockType = model.ContentBlockImage
			}

			// Xunfei's OpenAI-compatible chat endpoint (like Spark 4.0 Ultra) supports image/image_url
			// in messages. We do not skip image blocks.
			contentBlocks = append(contentBlocks, model.ContentBlock{
				Type:      blockType,
				MediaType: mimeType,
				Data:      base64Data,
			})
			}

			req := api.Request{
				Prompt:        prompt,
				ContentBlocks: contentBlocks,
				SessionID:     sessionID,
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
					if ctx.Err() == context.Canceled {
						broadcastChatAborted(ctxForBroadcast, runId, sessionKey)
					} else {
						broadcastChatError(ctxForBroadcast, runId, sessionKey, reason)
					}
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
						StopReason:       resp.Result.StopReason,
						DurationMs:       &durationMs,
						OutputDurationMs: &durationMs,
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
					if opts != nil && opts.DurationMs != nil {
						messageBody["durationMs"] = *opts.DurationMs
						messageBody["outputDurationMs"] = *opts.DurationMs
					}
					broadcastChatFinal(ctxForBroadcast, runId, sessionKey, messageBody)
					cronSummary := extractAssistantTextForIMDelivery(messageBody)
					if cronSummary == "" {
						cronSummary = output
					}
					deliverAssistantToIM(ctxForBroadcast, deliverForGoroutine, cronSummary)
					if cronSession {
						runAtMs := runStart.UnixMilli()
						durationMs := time.Since(runStart).Milliseconds()
						writeCronSessionResult(sessionKey, sessionID, cronSummary, "ok", runAtMs, durationMs)
						DeliverCronResultIfNeeded(ctxForBroadcast, sessionKey, cronSummary, "ok")
					}
				} else {
					appendErrorToTranscript(transcriptPath, "模型未返回任何输出", runId, sessionKey, ctxForBroadcast)
				}
				snapshot := &SessionRunSnapshot{SkillsSnapshot: buildSkillsSnapshotForSession(projectRoot, runtimeConfig, sessionKey)}
				updateSessionAfterRun(ctxForBroadcast, sessionKey, sessionID, sessionFile, snapshot)
				return
			}

			// Stream events: broadcast agent events and append to sessionFile (transcript)
			var textBuf strings.Builder
			var assistantContent []map[string]interface{}
			var lastMessageID string
			var usageSnapshot *api.Usage
			stopReason := ""
			// 每轮 EventMessageStop 可能对应「工具前说明 / 工具 / 最终回答」之一；只对飞书等 IM 保留「最后一次非空」的可见摘录，流结束再发一条。
			lastAssistantContent := ""
			streamIMPlain := ""

			var firstTokenTime time.Time
			var totalToolDurationMs int64
			toolStartTimes := make(map[string]time.Time)

			for evt := range eventChan {
				if ctx.Err() != nil {
					break
				}
				switch evt.Type {
				case api.EventContentBlockDelta:
					if firstTokenTime.IsZero() {
						firstTokenTime = time.Now()
					}
					if evt.Delta != nil && evt.Delta.Text != "" {
						delta := evt.Delta.Text
						textBuf.WriteString(delta)
						broadcastAgentEvent(ctxForBroadcast, runId, sessionKey, "assistant", map[string]interface{}{
							"text":  delta,
							"delta": delta,
						})
						broadcastChatDelta(ctxForBroadcast, runId, sessionKey, textBuf.String())
					}
					if evt.Delta != nil && evt.Delta.StopReason != "" {
						stopReason = evt.Delta.StopReason
					}
				case api.EventContentBlockStart:
					if firstTokenTime.IsZero() {
						firstTokenTime = time.Now()
					}
					if evt.ContentBlock != nil {
						if evt.ContentBlock.Type == "tool_use" {
							toolStartTimes[evt.ContentBlock.ID] = time.Now()
							tc := map[string]interface{}{
								"type":      "toolCall",
								"id":        evt.ContentBlock.ID,
								"name":      evt.ContentBlock.Name,
								"arguments": map[string]interface{}{},
							}
							if len(evt.ContentBlock.Input) > 0 {
								var args map[string]interface{}
								if json.Unmarshal(evt.ContentBlock.Input, &args) == nil {
									tc["arguments"] = nil
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
					if startTime, ok := toolStartTimes[evt.ToolUseID]; ok {
						totalToolDurationMs += time.Since(startTime).Milliseconds()
					}
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
						var currentFirstTokenMs int64
						if !firstTokenTime.IsZero() {
							currentFirstTokenMs = firstTokenTime.Sub(runStart).Milliseconds()
						}
						currentOutputMs := durationMs - totalToolDurationMs - currentFirstTokenMs
						if currentOutputMs < 0 {
							currentOutputMs = 0
						}
						msgBody["firstTokenMs"] = currentFirstTokenMs
						msgBody["toolDurationMs"] = totalToolDurationMs
						msgBody["outputDurationMs"] = currentOutputMs

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
						"role":             "assistant",
						"content":          contentSnapshot,
						"timestamp":        tsMs,
						"durationMs":       durationMs,
						"firstTokenMs":     currentFirstTokenMs,
						"toolDurationMs":   totalToolDurationMs,
						"outputDurationMs": currentOutputMs,
					}
					// 只在真正结束时广播 final；工具调用轮次不广播，避免前端反复刷新
					if stopReason != "tool_use" {
						broadcastChatFinal(ctxForBroadcast, runId, sessionKey, messageBody)
					}
					if t := extractAssistantTextForIMDelivery(messageBody); t != "" {
							streamIMPlain = t
							lastAssistantContent = t
						}
						// Reset accumulators so next EventMessageStop (if any) does not include this turn's content
						assistantContent = nil
						textBuf.Reset()
				} else if usageSnapshot != nil && stopReason != "tool_use" {
					broadcastChatFinal(ctxForBroadcast, runId, sessionKey, map[string]interface{}{
						"role": "assistant", "content": []map[string]interface{}{}, "timestamp": time.Now().UnixMilli(),
					})
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
					// 将最终文本内容写入 cron 会话结果文件（若是 cron 会话）
					// 对于 cron，会将最后一次成功的 assistant 内容作为 summary，错误内容写入 transcript。
					return
				}
			}
			// 流式正常结束：只向 IM 发送一条，内容为多次 MessageStop 中最后一次非空的「最终可见」摘录（与钉钉/企微/飞书同一逻辑）。
			if ctx.Err() == nil {
				// 兜底逻辑：如果 streamIMPlain 为空（如只有工具调用无文本回复），使用 lastAssistantContent
				textToSend := streamIMPlain
				if strings.TrimSpace(textToSend) == "" && lastAssistantContent != "" {
					textToSend = lastAssistantContent
					chatLog.Debug("streamIMPlain empty, fallback to lastAssistantContent sessionKey=%s", sessionKey)
				}
				if strings.TrimSpace(textToSend) != "" {
					deliverAssistantToIM(ctxForBroadcast, deliverForGoroutine, textToSend)
				} else {
					chatLog.Warn("IM delivery skipped: no content to deliver sessionKey=%s", sessionKey)
				}
			}
			if cronSession {
				durationMs := time.Since(runStart).Milliseconds()
				runAtMs := runStart.UnixMilli()
				writeCronSessionResult(sessionKey, sessionID, lastAssistantContent, "ok", runAtMs, durationMs)
				DeliverCronResultIfNeeded(ctxForBroadcast, sessionKey, lastAssistantContent, "ok")
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
				if ctx.Err() == context.Canceled {
					broadcastChatAborted(ctxForBroadcast, runId, sessionKey)
				} else {
					broadcastChatError(ctxForBroadcast, runId, sessionKey, reason)
				}
				return
			}

			// If no message_stop was received but we have text, append and broadcast
			if textBuf.Len() > 0 && len(assistantContent) == 0 {
				output := textBuf.String()
				durationMs := time.Since(runStart).Milliseconds()
				var finalFirstTokenMs int64
				if !firstTokenTime.IsZero() {
					finalFirstTokenMs = firstTokenTime.Sub(runStart).Milliseconds()
				}
				finalOutputMs := durationMs - totalToolDurationMs - finalFirstTokenMs
				if finalOutputMs < 0 {
					finalOutputMs = 0
				}
				opts := &session.AssistantMessageOpts{
					StopReason:       stopReason,
					DurationMs:       &durationMs,
					FirstTokenMs:     &finalFirstTokenMs,
					ToolDurationMs:   &totalToolDurationMs,
					OutputDurationMs: &finalOutputMs,
				}
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
						"role":             "assistant",
						"content":          []map[string]interface{}{{"type": "text", "text": output}},
						"timestamp":        time.Now().UnixMilli(),
						"durationMs":       durationMs,
						"firstTokenMs":     finalFirstTokenMs,
						"toolDurationMs":   totalToolDurationMs,
						"outputDurationMs": finalOutputMs,
					}
					broadcastChatFinal(ctxForBroadcast, runId, sessionKey, messageBody)
					cronSummary := extractAssistantTextForIMDelivery(messageBody)
					if cronSummary == "" {
						cronSummary = output
					}
					deliverAssistantToIM(ctxForBroadcast, deliverForGoroutine, cronSummary)
					if cronSession {
						runAtMs := runStart.UnixMilli()
						writeCronSessionResult(sessionKey, sessionID, cronSummary, "ok", runAtMs, durationMs)
						DeliverCronResultIfNeeded(ctxForBroadcast, sessionKey, cronSummary, "ok")
					}
				}
			}

			snapshot := &SessionRunSnapshot{SkillsSnapshot: buildSkillsSnapshotForSession(projectRoot, runtimeConfig, sessionKey)}
			updateSessionAfterRun(ctxForBroadcast, sessionKey, sessionID, sessionFile, snapshot)
		}()
	}

	// Send acknowledgment（在注册 abort 控制器之后，保证客户端收到 started 起即可 chat.abort）
	opts.Respond(true, map[string]interface{}{
		"runId":  runId,
		"status": "started",
	}, nil, map[string]interface{}{
		"runId": runId,
	})

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
		// 记录警告日志，但仍允许停止操作（runId本身已唯一标识运行实例）
		chatLog.Warn("chat.abort sessionKey mismatch but allowing: runId=%s storedSessionKey=%s receivedSessionKey=%s",
			runId, ctrl.SessionKey, sessionKey)
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
		broadcastChatFinal(opts.Context, runId, sessionKey, messageBody)
	}

	opts.Respond(true, map[string]interface{}{
		"ok":        true,
		"messageId": messageID,
	}, nil, nil)
	return nil
}
