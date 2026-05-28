package runtime

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/session"
	"github.com/stellarlinkco/agentsdk-go/pkg/api"
	"github.com/stellarlinkco/agentsdk-go/pkg/message"
)

// SessionHistory 配置对应 agentsdk-go docs/session-history.md 中的
// SessionHistoryLoader / SessionHistoryMaxMessages / SessionHistoryRoles 策略（Transform 仅支持代码侧 Options 注入）。
func sessionHistoryCfg(cfg *config.OpenOctaConfig) *config.SessionHistoryConfig {
	if cfg == nil || cfg.Session == nil || cfg.Session.SessionHistory == nil {
		return nil
	}
	return cfg.Session.SessionHistory
}

func sessionHistoryLoadEnabled(cfg *config.SessionHistoryConfig) bool {
	if cfg == nil || cfg.Enabled == nil {
		return true
	}
	return *cfg.Enabled
}

func sessionHistoryLoadFromTranscript(cfg *config.SessionHistoryConfig) bool {
	if cfg == nil || cfg.LoadFromTranscript == nil {
		return true
	}
	return *cfg.LoadFromTranscript
}

func applySessionHistory(apiOpts *api.Options, projectRoot string, opts Options) {
	if opts.SessionHistoryLoader != nil {
		apiOpts.SessionHistoryLoader = opts.SessionHistoryLoader
		apiOpts.SessionHistoryMaxMessages = opts.SessionHistoryMaxMessages
		if len(opts.SessionHistoryRoles) > 0 {
			apiOpts.SessionHistoryRoles = append([]string(nil), opts.SessionHistoryRoles...)
		}
		apiOpts.SessionHistoryTransform = opts.SessionHistoryTransform
		return
	}

	cfg := sessionHistoryCfg(opts.Config)
	if !sessionHistoryLoadEnabled(cfg) {
		return
	}

	apiOpts.SessionHistoryLoader = defaultSessionHistoryLoader(projectRoot, opts, cfg)
	if cfg != nil && cfg.MaxMessages != nil && *cfg.MaxMessages > 0 {
		apiOpts.SessionHistoryMaxMessages = *cfg.MaxMessages
	}
	if cfg != nil && len(cfg.Roles) > 0 {
		apiOpts.SessionHistoryRoles = append([]string(nil), cfg.Roles...)
	}
	if opts.SessionHistoryMaxMessages > 0 {
		apiOpts.SessionHistoryMaxMessages = opts.SessionHistoryMaxMessages
	}
	if len(opts.SessionHistoryRoles) > 0 {
		apiOpts.SessionHistoryRoles = append([]string(nil), opts.SessionHistoryRoles...)
	}
	if opts.SessionHistoryTransform != nil {
		apiOpts.SessionHistoryTransform = opts.SessionHistoryTransform
	}
}

func defaultSessionHistoryLoader(projectRoot string, opts Options, cfg *config.SessionHistoryConfig) api.SessionHistoryLoader {
	env := opts.Env
	if env == nil {
		env = func(string) string { return "" }
	}
	agentID := strings.TrimSpace(opts.AgentID)
	if agentID == "" {
		agentID = session.DefaultAgentID
	}
	fromTranscript := sessionHistoryLoadFromTranscript(cfg)
	return func(sessionID string) ([]message.Message, error) {
		msgs, err := loadMessagesFromClaudeHistoryFile(projectRoot, sessionID)
		if err != nil {
			return nil, err
		}
		if len(msgs) > 0 {
			return msgs, nil
		}
		if !fromTranscript {
			return nil, nil
		}
		tmsgs, tErr := transcriptMessagesForSession(agentID, sessionID, env)
		if tErr != nil || len(tmsgs) == 0 {
			return nil, nil
		}

		// Truncate to last assistant message, so as to avoid duplicated current user message
		converted := transcriptMessagesToSDK(tmsgs)
		lastAssistant := -1
		for i, msg := range converted {
			if strings.EqualFold(msg.Role, "assistant") {
				lastAssistant = i
			}
		}
		if lastAssistant < 0 {
			return nil, nil
		}
		return converted[:lastAssistant+1], nil
	}
}

func transcriptPathForAgentSession(agentID, sessionID string, env func(string) string) string {
	id := strings.TrimSpace(agentID)
	if id == "" {
		id = session.DefaultAgentID
	}
	dir := session.ResolveAgentSessionsDir(id, env)
	return filepath.Join(dir, strings.TrimSpace(sessionID)+".jsonl")
}

func transcriptMessagesForSession(agentID, sessionID string, env func(string) string) ([]session.TranscriptMessage, error) {
	path := transcriptPathForAgentSession(agentID, sessionID, env)
	msgs, err := session.ReadTranscriptMessages(path, 0)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		// 与 chat.history 一致：不中断对话，回退为空（文件损坏或单行过大等）
		return nil, nil
	}
	return msgs, nil
}

func loadMessagesFromClaudeHistoryFile(projectRoot, sessionID string) ([]message.Message, error) {
	projectRoot = strings.TrimSpace(projectRoot)
	if projectRoot == "" {
		projectRoot = "."
	}
	name := historySessionFileName(sessionID)
	if name == "" {
		return nil, nil
	}
	path := filepath.Join(projectRoot, ".claude", "history", name+".json")
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	return decodeSessionHistoryJSON(data)
}

type persistedContentBlock struct {
	Type      string `json:"type"`
	Text      string `json:"text,omitempty"`
	MediaType string `json:"media_type,omitempty"`
	Data      string `json:"data,omitempty"`
	URL       string `json:"url,omitempty"`
}

type persistedToolCall struct {
	ID        string         `json:"id"`
	Name      string         `json:"name"`
	Arguments map[string]any `json:"arguments,omitempty"`
	Result    string         `json:"result,omitempty"`
}

type persistedMessage struct {
	Role             string                  `json:"role"`
	Content          string                  `json:"content,omitempty"`
	ContentBlocks    []persistedContentBlock `json:"content_blocks,omitempty"`
	ToolCalls        []persistedToolCall     `json:"tool_calls,omitempty"`
	ReasoningContent string                  `json:"reasoning_content,omitempty"`
	LegacyToolCalls  []persistedToolCall     `json:"toolCalls,omitempty"`
}

type persistedHistoryFile struct {
	Messages []persistedMessage `json:"messages"`
}

func decodeSessionHistoryJSON(data []byte) ([]message.Message, error) {
	data = bytes.TrimSpace(data)
	if len(data) == 0 {
		return nil, nil
	}
	if data[0] == '{' {
		var wrap persistedHistoryFile
		if err := json.Unmarshal(data, &wrap); err == nil && len(wrap.Messages) > 0 {
			return persistedToMessages(wrap.Messages)
		}
	}
	var arr []persistedMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return nil, err
	}
	return persistedToMessages(arr)
}

func persistedToMessages(in []persistedMessage) ([]message.Message, error) {
	if len(in) == 0 {
		return nil, nil
	}
	out := make([]message.Message, 0, len(in))
	for _, pm := range in {
		role := strings.TrimSpace(pm.Role)
		if role == "" {
			continue
		}
		msg := message.Message{
			Role:             role,
			Content:          strings.TrimSpace(pm.Content),
			ReasoningContent: strings.TrimSpace(pm.ReasoningContent),
		}
		if len(pm.ContentBlocks) > 0 {
			blocks := make([]message.ContentBlock, 0, len(pm.ContentBlocks))
			for _, b := range pm.ContentBlocks {
				blocks = append(blocks, message.ContentBlock{
					Type:      message.ContentBlockType(b.Type),
					Text:      b.Text,
					MediaType: b.MediaType,
					Data:      b.Data,
					URL:       b.URL,
				})
			}
			msg.ContentBlocks = blocks
		}
		calls := pm.ToolCalls
		if len(calls) == 0 {
			calls = pm.LegacyToolCalls
		}
		if len(calls) > 0 {
			tc := make([]message.ToolCall, 0, len(calls))
			for _, c := range calls {
				args := c.Arguments
				if args == nil {
					args = map[string]any{}
				}
				tc = append(tc, message.ToolCall{ID: c.ID, Name: c.Name, Arguments: args, Result: c.Result})
			}
			msg.ToolCalls = tc
		}
		// 跳过完全空行（无正文、无块、无 tool）
		if msg.Content == "" && len(msg.ContentBlocks) == 0 && len(msg.ToolCalls) == 0 && msg.ReasoningContent == "" {
			continue
		}
		out = append(out, msg)
	}
	if len(out) == 0 {
		return nil, nil
	}
	return out, nil
}

func transcriptMessagesToSDK(msgs []session.TranscriptMessage) []message.Message {
	var out []message.Message
	for _, m := range msgs {
		role := strings.ToLower(strings.TrimSpace(m.Role))
		if role == "toolresult" {
			// Convert toolResult to a tool-role message with the result content.
			// Kimi API requires: assistant message with tool_calls must be followed
			// by tool messages responding to each tool_call_id.
			var resultText string
			for _, c := range m.Content {
				if strings.EqualFold(c.Type, "text") {
					resultText = c.Text
					break
				}
			}
			msg := message.Message{
				Role:       "tool",
				ToolCallID: m.ToolCallID,
				Content:    resultText,
			}
			out = append(out, msg)
			continue
		}
		if role != "user" && role != "assistant" {
			continue
		}
		var sdkBlocks []message.ContentBlock
		hasImage := false
		for _, c := range m.Content {
			if strings.EqualFold(c.Type, "text") && c.Text != "" {
				sdkBlocks = append(sdkBlocks, message.ContentBlock{
					Type: message.ContentBlockType("text"),
					Text: c.Text,
				})
			} else if strings.EqualFold(c.Type, "image") {
				hasImage = true
				sdkBlocks = append(sdkBlocks, message.ContentBlock{
					Type:      message.ContentBlockType("image"),
					MediaType: c.MimeType,
					Data:      c.Data,
				})
			}
		}

		msg := message.Message{Role: role}
		if hasImage {
			msg.ContentBlocks = sdkBlocks
		} else {
			var b strings.Builder
			for _, c := range sdkBlocks {
				if c.Type == message.ContentBlockType("text") && c.Text != "" {
					if b.Len() > 0 {
						b.WriteByte('\n')
					}
					b.WriteString(c.Text)
				}
			}
			msg.Content = b.String()
		}

		if msg.Content == "" && len(msg.ContentBlocks) == 0 && len(msg.ToolCalls) == 0 {
			continue
		}
		out = append(out, msg)
	}
	return out
}
