package eino

import (
	"strings"

	"github.com/cloudwego/eino/schema"

	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/session"
)

// TranscriptLoadOptions controls how transcript lines are converted for model input.
type TranscriptLoadOptions struct {
	MaxMessages int
	Roles       []string
}

func sessionHistoryConfig(cfg *config.OpenOctaConfig) *config.SessionHistoryConfig {
	if cfg == nil || cfg.Session == nil {
		return nil
	}
	return cfg.Session.SessionHistory
}

// SessionHistoryEnabled reports whether transcript history should hydrate model input.
func SessionHistoryEnabled(cfg *config.OpenOctaConfig) bool {
	sh := sessionHistoryConfig(cfg)
	if sh == nil {
		return true
	}
	if sh.Enabled != nil && !*sh.Enabled {
		return false
	}
	if sh.LoadFromTranscript != nil && !*sh.LoadFromTranscript {
		return false
	}
	return true
}

// SessionHistoryMaxMessages returns configured max transcript turns (0 = unlimited).
func SessionHistoryMaxMessages(cfg *config.OpenOctaConfig) int {
	sh := sessionHistoryConfig(cfg)
	if sh == nil {
		return 0
	}
	if v := sh.MaxMessages; v != nil && *v > 0 {
		return *v
	}
	return 0
}

// SessionHistoryRoles returns allowed transcript roles (empty = user, assistant, toolResult).
func SessionHistoryRoles(cfg *config.OpenOctaConfig) []string {
	sh := sessionHistoryConfig(cfg)
	if sh == nil {
		return nil
	}
	return sh.Roles
}

// LoadSchemaMessagesFromTranscript reads a session jsonl transcript and converts it to Eino messages.
func LoadSchemaMessagesFromTranscript(transcriptPath string, opts TranscriptLoadOptions) ([]*schema.Message, error) {
	msgs, _, err := LoadSchemaMessagesFromTranscriptCandidates([]string{transcriptPath}, opts)
	return msgs, err
}

// LoadSchemaMessagesFromTranscriptCandidates tries each transcript path until messages are loaded.
// Returns the path that succeeded when any messages were converted.
func LoadSchemaMessagesFromTranscriptCandidates(candidates []string, opts TranscriptLoadOptions) ([]*schema.Message, string, error) {
	seen := make(map[string]struct{}, len(candidates))
	var lastErr error
	for _, path := range candidates {
		path = strings.TrimSpace(path)
		if path == "" {
			continue
		}
		if _, ok := seen[path]; ok {
			continue
		}
		seen[path] = struct{}{}
		msgs, err := session.ReadTranscriptMessages(path, 0)
		if err != nil && len(msgs) == 0 {
			lastErr = err
			continue
		}
		converted := SchemaMessagesFromTranscript(msgs, opts)
		if len(converted) == 0 {
			if err != nil {
				lastErr = err
			}
			continue
		}
		return converted, path, err
	}
	if lastErr != nil {
		return nil, "", lastErr
	}
	return nil, "", nil
}

// SchemaMessagesFromTranscript converts persisted transcript messages into model input history.
func SchemaMessagesFromTranscript(msgs []session.TranscriptMessage, opts TranscriptLoadOptions) []*schema.Message {
	allowed := allowedTranscriptRoles(opts.Roles)
	filtered := make([]session.TranscriptMessage, 0, len(msgs))
	for _, m := range msgs {
		role := strings.ToLower(strings.TrimSpace(m.Role))
		if role == "" || !allowed[role] {
			continue
		}
		filtered = append(filtered, m)
	}
	if opts.MaxMessages > 0 && len(filtered) > opts.MaxMessages {
		filtered = filtered[len(filtered)-opts.MaxMessages:]
	}
	out := make([]*schema.Message, 0, len(filtered))
	for _, m := range filtered {
		out = append(out, transcriptMessageToSchema(m)...)
	}
	return normalizeToolTurnMessageOrder(out)
}

// normalizeToolTurnMessageOrder reorders messages so each assistant tool_calls turn
// is immediately followed by its tool results, matching Eino / provider API contracts.
// Transcript append order can place toolResult rows before the assistant row when tool
// execution events are persisted before MessageStop (e.g. long browser tool runs).
//
// In-order turns (assistant then its tools, then next assistant) must keep each tool
// attached to its own assistant. Buffering every tool until the *next* assistant
// mis-attributes the previous turn's results (provider 400: missing tool_call_id).
func normalizeToolTurnMessageOrder(msgs []*schema.Message) []*schema.Message {
	if len(msgs) < 2 {
		return msgs
	}
	out := make([]*schema.Message, 0, len(msgs))
	// Tools seen before their assistant (out-of-order persistence).
	var pendingBefore []*schema.Message
	flushPendingBefore := func() {
		if len(pendingBefore) == 0 {
			return
		}
		out = append(out, pendingBefore...)
		pendingBefore = nil
	}
	for _, msg := range msgs {
		if msg == nil {
			continue
		}
		switch msg.Role {
		case schema.Tool:
			if tryAppendToolAfterTrailingAssistant(&out, msg) {
				continue
			}
			pendingBefore = append(pendingBefore, msg)
		case schema.Assistant:
			if len(msg.ToolCalls) > 0 {
				matched, rest := matchToolMessagesToCalls(pendingBefore, msg.ToolCalls)
				pendingBefore = rest
				out = append(out, msg)
				out = append(out, matched...)
			} else {
				flushPendingBefore()
				out = append(out, msg)
			}
		default:
			flushPendingBefore()
			out = append(out, msg)
		}
	}
	flushPendingBefore()
	return out
}

// tryAppendToolAfterTrailingAssistant attaches an in-order tool result to the most
// recent assistant tool_calls turn already emitted in out.
func tryAppendToolAfterTrailingAssistant(out *[]*schema.Message, tool *schema.Message) bool {
	if out == nil || tool == nil {
		return false
	}
	msgs := *out
	asstIdx := -1
	for i := len(msgs) - 1; i >= 0; i-- {
		m := msgs[i]
		if m == nil {
			continue
		}
		if m.Role == schema.Tool {
			continue
		}
		if m.Role == schema.Assistant && len(m.ToolCalls) > 0 {
			asstIdx = i
		}
		break
	}
	if asstIdx < 0 {
		return false
	}
	id := strings.TrimSpace(tool.ToolCallID)
	if id == "" {
		return false
	}
	asst := msgs[asstIdx]
	declared := false
	for _, tc := range asst.ToolCalls {
		if strings.TrimSpace(tc.ID) == id {
			declared = true
			break
		}
	}
	if !declared {
		return false
	}
	for i := asstIdx + 1; i < len(msgs); i++ {
		if msgs[i] != nil && msgs[i].Role == schema.Tool && strings.TrimSpace(msgs[i].ToolCallID) == id {
			return false
		}
	}
	*out = append(msgs, tool)
	return true
}

func matchToolMessagesToCalls(tools []*schema.Message, calls []schema.ToolCall) (matched, unmatched []*schema.Message) {
	if len(tools) == 0 || len(calls) == 0 {
		return nil, tools
	}
	idOrder := make([]string, 0, len(calls))
	idSet := make(map[string]struct{})
	for _, tc := range calls {
		if id := strings.TrimSpace(tc.ID); id != "" {
			idOrder = append(idOrder, id)
			idSet[id] = struct{}{}
		}
	}
	byID := make(map[string]*schema.Message)
	for _, t := range tools {
		id := strings.TrimSpace(t.ToolCallID)
		if _, ok := idSet[id]; ok {
			byID[id] = t
		} else {
			unmatched = append(unmatched, t)
		}
	}
	for _, id := range idOrder {
		if t, ok := byID[id]; ok {
			matched = append(matched, t)
		}
	}
	return matched, unmatched
}

func allowedTranscriptRoles(configured []string) map[string]bool {
	if len(configured) == 0 {
		return map[string]bool{
			"user":       true,
			"assistant":  true,
			"toolresult": true,
		}
	}
	out := make(map[string]bool, len(configured))
	for _, role := range configured {
		r := strings.ToLower(strings.TrimSpace(role))
		if r == "tool" {
			r = "toolresult"
		}
		if r != "" {
			out[r] = true
		}
	}
	return out
}

func transcriptMessageToSchema(m session.TranscriptMessage) []*schema.Message {
	switch strings.ToLower(strings.TrimSpace(m.Role)) {
	case "user":
		if msg := userTranscriptToSchema(m); msg != nil {
			return []*schema.Message{msg}
		}
	case "assistant":
		if msg := assistantTranscriptToSchema(m); msg != nil {
			return []*schema.Message{msg}
		}
	case "toolresult":
		if msg := toolResultTranscriptToSchema(m); msg != nil {
			return []*schema.Message{msg}
		}
	}
	return nil
}

func userTranscriptToSchema(m session.TranscriptMessage) *schema.Message {
	parts := transcriptBlocksToParts(m.Content)
	if len(parts) == 0 {
		return nil
	}
	if len(parts) == 1 && parts[0].Type == schema.ChatMessagePartTypeText {
		return schema.UserMessage(parts[0].Text)
	}
	return &schema.Message{Role: schema.User, MultiContent: parts}
}

func assistantTranscriptToSchema(m session.TranscriptMessage) *schema.Message {
	var textParts []string
	var toolCalls []schema.ToolCall
	for _, block := range m.Content {
		typ := strings.ToLower(strings.TrimSpace(block.Type))
		switch typ {
		case "text":
			text := strings.TrimSpace(tools.StripOpenOctaAttachmentsMarker(block.Text))
			if text != "" {
				textParts = append(textParts, text)
			}
		case "thinking":
			if t := strings.TrimSpace(block.Thinking); t != "" {
				textParts = append(textParts, t)
			}
		case "toolcall", "tool_call", "tooluse", "tool_use":
			if tc := transcriptToolCall(block); tc != nil {
				toolCalls = append(toolCalls, *tc)
			}
		}
	}
	text := strings.TrimSpace(strings.Join(textParts, "\n"))
	if text == "" && len(toolCalls) == 0 {
		return nil
	}
	return schema.AssistantMessage(text, toolCalls)
}

func toolResultTranscriptToSchema(m session.TranscriptMessage) *schema.Message {
	text := strings.TrimSpace(transcriptToolResultText(m))
	if text == "" {
		return nil
	}
	toolCallID := strings.TrimSpace(m.ToolCallID)
	if toolCallID == "" {
		for _, block := range m.Content {
			if id := strings.TrimSpace(block.ID); id != "" {
				toolCallID = id
				break
			}
		}
	}
	if toolCallID == "" {
		return nil
	}
	opts := []schema.ToolMessageOption{}
	if name := strings.TrimSpace(m.ToolName); name != "" {
		opts = append(opts, schema.WithToolName(name))
	}
	return schema.ToolMessage(text, toolCallID, opts...)
}

func transcriptToolResultText(m session.TranscriptMessage) string {
	var parts []string
	for _, block := range m.Content {
		typ := strings.ToLower(strings.TrimSpace(block.Type))
		switch typ {
		case "text", "toolresult", "tool_result":
			if t := strings.TrimSpace(tools.StripOpenOctaAttachmentsMarker(block.Text)); t != "" {
				parts = append(parts, t)
			}
		default:
			if t := strings.TrimSpace(block.Text); t != "" {
				parts = append(parts, t)
			}
		}
	}
	return strings.Join(parts, "\n")
}

func transcriptToolCall(block session.ContentBlock) *schema.ToolCall {
	id := strings.TrimSpace(block.ID)
	name := strings.TrimSpace(block.Name)
	if id == "" || name == "" {
		return nil
	}
	args := NormalizeToolCallArgumentsJSON(string(block.Arguments))
	return &schema.ToolCall{
		ID:   id,
		Type: "function",
		Function: schema.FunctionCall{
			Name:      name,
			Arguments: args,
		},
	}
}

func transcriptBlocksToParts(blocks []session.ContentBlock) []schema.ChatMessagePart {
	var parts []schema.ChatMessagePart
	for _, block := range blocks {
		typ := strings.ToLower(strings.TrimSpace(block.Type))
		switch typ {
		case "text":
			text := strings.TrimSpace(block.Text)
			if text != "" {
				parts = append(parts, schema.ChatMessagePart{Type: schema.ChatMessagePartTypeText, Text: text})
			}
		case "image":
			url := transcriptImageURL(block)
			if url != "" {
				parts = append(parts, schema.ChatMessagePart{
					Type:     schema.ChatMessagePartTypeImageURL,
					ImageURL: &schema.ChatMessageImageURL{URL: url},
				})
			}
		case "video":
			url := transcriptMediaDataURL(block.MimeType, block.Data, block.URL, "video/mp4")
			if url != "" {
				parts = append(parts, schema.ChatMessagePart{
					Type: schema.ChatMessagePartTypeVideoURL,
					VideoURL: &schema.ChatMessageVideoURL{
						URL:      url,
						MIMEType: block.MimeType,
					},
				})
			}
		case "file", "document":
			url := transcriptMediaDataURL(block.MimeType, block.Data, block.URL, "application/octet-stream")
			if url != "" {
				parts = append(parts, schema.ChatMessagePart{
					Type:    schema.ChatMessagePartTypeFileURL,
					FileURL: &schema.ChatMessageFileURL{URL: url},
				})
			}
		}
	}
	return parts
}

func transcriptImageURL(block session.ContentBlock) string {
	return transcriptMediaDataURL(block.MimeType, block.Data, block.URL, "image/jpeg")
}

func transcriptMediaDataURL(mimeType, data, url, defaultMime string) string {
	if strings.TrimSpace(url) != "" {
		return strings.TrimSpace(url)
	}
	data = strings.TrimSpace(data)
	if data == "" {
		return ""
	}
	mime := strings.TrimSpace(mimeType)
	if mime == "" {
		mime = defaultMime
	}
	return "data:" + mime + ";base64," + data
}
