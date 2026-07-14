package eino

import (
	"testing"

	"github.com/cloudwego/eino/schema"

	"github.com/openocta/openocta/pkg/session"
)

func TestSchemaMessagesFromTranscriptMultiTurn(t *testing.T) {
	msgs := []session.TranscriptMessage{
		{Role: "user", Content: []session.ContentBlock{{Type: "text", Text: "你好"}}},
		{Role: "assistant", Content: []session.ContentBlock{{Type: "text", Text: "你好，有什么可以帮你？"}}},
		{Role: "user", Content: []session.ContentBlock{{Type: "text", Text: "继续"}}},
	}
	out := SchemaMessagesFromTranscript(msgs, TranscriptLoadOptions{})
	if len(out) != 3 {
		t.Fatalf("expected 3 messages, got %d", len(out))
	}
	if out[0].Role != schema.User || out[0].Content != "你好" {
		t.Fatalf("first message: %#v", out[0])
	}
	if out[1].Role != schema.Assistant || out[1].Content != "你好，有什么可以帮你？" {
		t.Fatalf("second message: %#v", out[1])
	}
	if out[2].Role != schema.User || out[2].Content != "继续" {
		t.Fatalf("third message: %#v", out[2])
	}
}

func TestSchemaMessagesFromTranscriptToolTurn(t *testing.T) {
	msgs := []session.TranscriptMessage{
		{
			Role: "assistant",
			Content: []session.ContentBlock{
				{Type: "toolCall", ID: "call_1", Name: "read_file", Arguments: []byte(`{"path":"a.txt"}`)},
			},
		},
		{
			Role:       "toolResult",
			ToolCallID: "call_1",
			ToolName:   "read_file",
			Content:    []session.ContentBlock{{Type: "text", Text: "file contents"}},
		},
	}
	out := SchemaMessagesFromTranscript(msgs, TranscriptLoadOptions{})
	if len(out) != 2 {
		t.Fatalf("expected 2 messages, got %d", len(out))
	}
	if len(out[0].ToolCalls) != 1 || out[0].ToolCalls[0].ID != "call_1" {
		t.Fatalf("assistant tool call: %#v", out[0].ToolCalls)
	}
	if out[1].Role != schema.Tool || out[1].ToolCallID != "call_1" {
		t.Fatalf("tool message: %#v", out[1])
	}
}

func TestSchemaMessagesFromTranscriptToolResultsBeforeAssistant(t *testing.T) {
	msgs := []session.TranscriptMessage{
		{Role: "user", Content: []session.ContentBlock{{Type: "text", Text: "open browser"}}},
		{
			Role:       "toolResult",
			ToolCallID: "call_a",
			ToolName:   "browser",
			Content:    []session.ContentBlock{{Type: "text", Text: `{"ok":true}`}},
		},
		{
			Role:       "toolResult",
			ToolCallID: "call_b",
			ToolName:   "browser",
			Content:    []session.ContentBlock{{Type: "text", Text: "screenshot"}},
		},
		{
			Role: "assistant",
			Content: []session.ContentBlock{
				{Type: "toolCall", ID: "call_a", Name: "browser", Arguments: []byte(`{}`)},
				{Type: "toolCall", ID: "call_b", Name: "browser", Arguments: []byte(`{}`)},
			},
		},
		{Role: "user", Content: []session.ContentBlock{{Type: "text", Text: "next"}}},
	}
	out := SchemaMessagesFromTranscript(msgs, TranscriptLoadOptions{})
	if len(out) != 5 {
		t.Fatalf("expected 5 messages, got %d: %#v", len(out), out)
	}
	if out[0].Role != schema.User {
		t.Fatalf("expected user first, got %#v", out[0])
	}
	if out[1].Role != schema.Assistant || len(out[1].ToolCalls) != 2 {
		t.Fatalf("expected assistant with tool calls, got %#v", out[1])
	}
	if out[2].Role != schema.Tool || out[2].ToolCallID != "call_a" {
		t.Fatalf("expected first tool result after assistant, got %#v", out[2])
	}
	if out[3].Role != schema.Tool || out[3].ToolCallID != "call_b" {
		t.Fatalf("expected second tool result after assistant, got %#v", out[3])
	}
	if out[4].Role != schema.User || out[4].Content != "next" {
		t.Fatalf("expected trailing user message, got %#v", out[4])
	}
}

func TestSchemaMessagesFromTranscriptMaxMessages(t *testing.T) {
	msgs := []session.TranscriptMessage{
		{Role: "user", Content: []session.ContentBlock{{Type: "text", Text: "1"}}},
		{Role: "assistant", Content: []session.ContentBlock{{Type: "text", Text: "2"}}},
		{Role: "user", Content: []session.ContentBlock{{Type: "text", Text: "3"}}},
	}
	out := SchemaMessagesFromTranscript(msgs, TranscriptLoadOptions{MaxMessages: 2})
	if len(out) != 2 {
		t.Fatalf("expected 2 messages, got %d", len(out))
	}
	if out[0].Content != "2" || out[1].Content != "3" {
		t.Fatalf("unexpected trim: %#v", out)
	}
}

// Two sequential in-order tool turns must not re-attach the first tool result under the second assistant.
func TestNormalizeToolTurnMessageOrderKeepsSequentialPairs(t *testing.T) {
	t.Parallel()
	in := []*schema.Message{
		schema.SystemMessage("sys"),
		schema.UserMessage("q1"),
		schema.UserMessage("q2"),
		schema.AssistantMessage("", []schema.ToolCall{
			{ID: "call_a", Type: "function", Function: schema.FunctionCall{Name: "weather", Arguments: "{}"}},
		}),
		schema.ToolMessage(`{"ok":1}`, "call_a", schema.WithToolName("weather")),
		schema.AssistantMessage("", []schema.ToolCall{
			{ID: "call_b", Type: "function", Function: schema.FunctionCall{Name: "weather", Arguments: "{}"}},
		}),
		schema.ToolMessage(`{"ok":2}`, "call_b", schema.WithToolName("weather")),
	}
	out := PrepareSchemaMessagesForModel(in)
	if len(out) != 7 {
		t.Fatalf("expected 7 messages, got %d: %#v", len(out), out)
	}
	if out[3].Role != schema.Assistant || out[3].ToolCalls[0].ID != "call_a" {
		t.Fatalf("assistant1: %#v", out[3])
	}
	if out[4].Role != schema.Tool || out[4].ToolCallID != "call_a" {
		t.Fatalf("tool1 should stay under assistant1, got %#v", out[4])
	}
	if out[5].Role != schema.Assistant || out[5].ToolCalls[0].ID != "call_b" {
		t.Fatalf("assistant2: %#v", out[5])
	}
	if out[6].Role != schema.Tool || out[6].ToolCallID != "call_b" {
		t.Fatalf("tool2 should stay under assistant2, got %#v", out[6])
	}
}
