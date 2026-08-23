package eino

import (
	"encoding/json"
	"testing"

	"github.com/cloudwego/eino/schema"

	"github.com/openocta/openocta/pkg/agent/model"
	"github.com/openocta/openocta/pkg/agent/stream"
	"github.com/openocta/openocta/pkg/agent/types"
)

func TestAppendStreamedToolCallAssemblesReasoningModelArguments(t *testing.T) {
	calls := make(map[string]*streamedToolCall)
	chunks := []schema.ToolCall{
		{ID: "call_1", Function: schema.FunctionCall{Name: "memory_search"}},
		{Function: schema.FunctionCall{Arguments: `{"query":`}},
		{Function: schema.FunctionCall{Arguments: `"search-term"}`}},
	}
	for _, chunk := range chunks {
		appendStreamedToolCall(calls, 0, chunk)
	}

	call := calls["call_1"]
	if call == nil {
		t.Fatal("expected tool call")
	}
	got := NormalizeToolCallArgumentsJSON(call.arguments.String())
	var args map[string]string
	if err := json.Unmarshal([]byte(got), &args); err != nil {
		t.Fatalf("assembled arguments are invalid JSON: %v", err)
	}
	if args["query"] != "search-term" {
		t.Fatalf("query = %q, want search-term", args["query"])
	}
}

func TestBuildAgentMessagesUsesTranscriptHistory(t *testing.T) {
	t.Parallel()

	msgs, err := BuildAgentMessages(types.Request{
		Prompt: "继续",
		SessionMessages: []*schema.Message{
			schema.UserMessage("你好"),
			schema.AssistantMessage("你好，有什么可以帮你？", nil),
			schema.UserMessage("继续"),
		},
	})
	if err != nil {
		t.Fatalf("BuildAgentMessages: %v", err)
	}
	if len(msgs) != 3 {
		t.Fatalf("expected 3 messages, got %d", len(msgs))
	}
}

func TestBuildAgentMessagesMergesAttachmentIntoHistory(t *testing.T) {
	t.Parallel()

	msgs, err := BuildAgentMessages(types.Request{
		Prompt: "describe",
		ContentBlocks: []model.ContentBlock{{
			Type:      model.ContentBlockImage,
			MediaType: "image/jpeg",
			Data:      "abc",
		}},
		SessionMessages: []*schema.Message{
			schema.UserMessage("hello"),
			schema.AssistantMessage("hi", nil),
			schema.UserMessage("describe"),
		},
	})
	if err != nil {
		t.Fatalf("BuildAgentMessages: %v", err)
	}
	if len(msgs) != 3 {
		t.Fatalf("expected 3 messages, got %d", len(msgs))
	}
	last := msgs[2]
	if len(last.MultiContent) < 2 {
		t.Fatalf("expected merged multimodal user message, got %+v", last)
	}
}

func TestBuildUserMessagesVideoBlock(t *testing.T) {
	t.Parallel()

	msgs, err := BuildUserMessages(types.Request{
		Prompt: "describe this clip",
		ContentBlocks: []model.ContentBlock{
			{
				Type:      model.ContentBlockVideo,
				MediaType: "video/mp4",
				Data:      "dGVzdA==",
			},
		},
	})
	if err != nil {
		t.Fatalf("BuildUserMessages: %v", err)
	}
	if len(msgs) != 1 || len(msgs[0].MultiContent) != 2 {
		t.Fatalf("unexpected message parts: %+v", msgs)
	}
	videoPart := msgs[0].MultiContent[1]
	if videoPart.Type != schema.ChatMessagePartTypeVideoURL {
		t.Fatalf("expected video_url part, got %q", videoPart.Type)
	}
	if videoPart.VideoURL == nil || videoPart.VideoURL.URL != "data:video/mp4;base64,dGVzdA==" {
		t.Fatalf("unexpected video url: %+v", videoPart.VideoURL)
	}
}

func TestMapFinishReasonToStopReason(t *testing.T) {
	t.Parallel()

	cases := []struct {
		in   string
		want string
	}{
		{"stop", "end_turn"},
		{"STOP", "end_turn"},
		{"tool_calls", "tool_use"},
		{"length", "end_turn"},
		{"content_filter", "end_turn"},
		{"", ""},
		{"null", ""},
		{"unknown", ""},
	}
	for _, tc := range cases {
		if got := mapFinishReasonToStopReason(tc.in); got != tc.want {
			t.Fatalf("mapFinishReasonToStopReason(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestEmitTurnStopFromResponseMeta(t *testing.T) {
	t.Parallel()

	out := make(chan stream.StreamEvent, 4)
	meta := &schema.ResponseMeta{FinishReason: "tool_calls"}
	if !emitTurnStopFromResponseMeta(out, "sess-1", meta, nil) {
		t.Fatal("expected turn stop to be emitted for tool_calls")
	}
	close(out)

	var stops int
	for evt := range out {
		if evt.Type != stream.EventMessageStop {
			continue
		}
		stops++
		if evt.Delta == nil || evt.Delta.StopReason != "tool_use" {
			t.Fatalf("unexpected message stop: %+v", evt.Delta)
		}
	}
	if stops != 1 {
		t.Fatalf("got %d message stops, want 1", stops)
	}

	out2 := make(chan stream.StreamEvent, 1)
	if emitTurnStopFromResponseMeta(out2, "sess-1", &schema.ResponseMeta{FinishReason: ""}, nil) {
		t.Fatal("expected no turn stop for empty finish reason")
	}
	if len(out2) != 0 {
		t.Fatalf("expected no events, got %d", len(out2))
	}
}
