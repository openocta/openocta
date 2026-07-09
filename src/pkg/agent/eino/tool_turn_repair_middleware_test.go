package eino

import (
	"context"
	"testing"

	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/schema"
)

func TestToolTurnRepairMiddlewareBeforeChatModel(t *testing.T) {
	t.Parallel()
	mw := newToolTurnRepairMiddleware()
	state := &adk.ChatModelAgentState{
		Messages: []*schema.Message{
			schema.UserMessage("browse"),
			schema.ToolMessage(`{"ok":true}`, "call_a", schema.WithToolName("browser")),
			schema.AssistantMessage("", []schema.ToolCall{
				{ID: "call_a", Type: "function", Function: schema.FunctionCall{Name: "browser", Arguments: "{}"}},
				{ID: "call_b", Type: "function", Function: schema.FunctionCall{Name: "browser", Arguments: "{}"}},
			}),
		},
	}
	_, state, err := mw.(*toolTurnRepairMiddleware).BeforeModelRewriteState(context.Background(), state, nil)
	if err != nil {
		t.Fatalf("BeforeModelRewriteState: %v", err)
	}
	if len(state.Messages) != 4 {
		t.Fatalf("expected 4 messages, got %d: %#v", len(state.Messages), state.Messages)
	}
	if state.Messages[1].Role != schema.Assistant || len(state.Messages[1].ToolCalls) != 2 {
		t.Fatalf("expected assistant with tool calls at index 1, got %#v", state.Messages[1])
	}
	if state.Messages[2].Role != schema.Tool || state.Messages[2].ToolCallID != "call_a" {
		t.Fatalf("expected call_a tool result at index 2, got %#v", state.Messages[2])
	}
	// call_b missing -> placeholder inserted by repair.
	foundPlaceholder := false
	for _, m := range state.Messages {
		if m.Role == schema.Tool && m.ToolCallID == "call_b" && m.Content == interruptedToolResultText {
			foundPlaceholder = true
		}
	}
	if !foundPlaceholder {
		t.Fatalf("expected placeholder for call_b, got %#v", state.Messages)
	}
}

func TestPrepareSchemaMessagesForModelPartialToolResults(t *testing.T) {
	t.Parallel()
	out := PrepareSchemaMessagesForModel([]*schema.Message{
		schema.AssistantMessage("", []schema.ToolCall{
			{ID: "call_a", Type: "function", Function: schema.FunctionCall{Name: "read", Arguments: "{}"}},
			{ID: "call_b", Type: "function", Function: schema.FunctionCall{Name: "read", Arguments: "{}"}},
		}),
		schema.ToolMessage("done", "call_a"),
	})
	if len(out) != 3 {
		t.Fatalf("expected 3 messages, got %d: %#v", len(out), out)
	}
	if out[2].Role != schema.Tool || out[2].ToolCallID != "call_b" {
		t.Fatalf("expected placeholder for call_b, got %#v", out[2])
	}
}
