package eino

import (
	"encoding/json"
	"strings"

	"github.com/cloudwego/eino/schema"
)

// NormalizeToolCallArgumentsJSON ensures function.arguments is a JSON object string.
// Some providers reject empty strings, bare JSON strings, null, or double-encoded JSON.
func NormalizeToolCallArgumentsJSON(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "{}"
	}
	if !json.Valid([]byte(raw)) {
		return "{}"
	}
	if strings.HasPrefix(raw, "{") {
		return raw
	}
	var inner string
	if err := json.Unmarshal([]byte(raw), &inner); err == nil {
		inner = strings.TrimSpace(inner)
		if inner != "" && json.Valid([]byte(inner)) && strings.HasPrefix(inner, "{") {
			return inner
		}
	}
	return "{}"
}

// NormalizeToolCallArgumentsRaw normalizes raw transcript/stream tool argument bytes.
func NormalizeToolCallArgumentsRaw(raw json.RawMessage) json.RawMessage {
	return json.RawMessage(NormalizeToolCallArgumentsJSON(string(raw)))
}

func sanitizeSchemaMessagesToolCalls(msgs []*schema.Message) {
	for _, msg := range msgs {
		if msg == nil || msg.Role != schema.Assistant || len(msg.ToolCalls) == 0 {
			continue
		}
		for i := range msg.ToolCalls {
			msg.ToolCalls[i].Function.Arguments = NormalizeToolCallArgumentsJSON(msg.ToolCalls[i].Function.Arguments)
		}
	}
}

// PrepareSchemaMessagesForModel normalizes transcript/agent history so OpenAI-compatible
// providers (DeepSeek, etc.) accept tool-call turns: arguments sanitized, tool results
// reordered after assistant tool_calls, and missing tool responses filled with placeholders.
func PrepareSchemaMessagesForModel(msgs []*schema.Message) []*schema.Message {
	if len(msgs) == 0 {
		return msgs
	}
	out := append([]*schema.Message(nil), msgs...)
	sanitizeSchemaMessagesToolCalls(out)
	out = normalizeToolTurnMessageOrder(out)
	out = repairIncompleteToolCallMessages(out)
	return out
}

const interruptedToolResultText = "[工具执行未完成或被中断]"

// repairIncompleteToolCallMessages inserts placeholder tool messages when an assistant
// tool_calls turn was interrupted (e.g. preempt) before all tool results were persisted.
func repairIncompleteToolCallMessages(msgs []*schema.Message) []*schema.Message {
	if len(msgs) == 0 {
		return msgs
	}
	out := make([]*schema.Message, 0, len(msgs)+4)
	for i := 0; i < len(msgs); i++ {
		msg := msgs[i]
		out = append(out, msg)
		if msg == nil || msg.Role != schema.Assistant || len(msg.ToolCalls) == 0 {
			continue
		}
		pending := make(map[string]schema.ToolCall)
		for _, tc := range msg.ToolCalls {
			if id := strings.TrimSpace(tc.ID); id != "" {
				pending[id] = tc
			}
		}
		if len(pending) == 0 {
			continue
		}
		// Drop tool messages already emitted before this assistant (reordered history).
		for j := len(out) - 1; j >= 0; j-- {
			prev := out[j]
			if prev == nil || prev.Role != schema.Tool {
				break
			}
			if id := strings.TrimSpace(prev.ToolCallID); id != "" {
				delete(pending, id)
			}
		}
		i++
		for len(pending) > 0 && i < len(msgs) && msgs[i] != nil && msgs[i].Role == schema.Tool {
			if id := strings.TrimSpace(msgs[i].ToolCallID); id != "" {
				delete(pending, id)
			}
			out = append(out, msgs[i])
			i++
		}
		for id, tc := range pending {
			opts := []schema.ToolMessageOption{}
			if name := strings.TrimSpace(tc.Function.Name); name != "" {
				opts = append(opts, schema.WithToolName(name))
			}
			out = append(out, schema.ToolMessage(interruptedToolResultText, id, opts...))
		}
		i--
	}
	return out
}
