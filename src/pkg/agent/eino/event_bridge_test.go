package eino

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/cloudwego/eino/schema"

	"github.com/openocta/openocta/pkg/a2ui"
	"github.com/openocta/openocta/pkg/agent/model"
	"github.com/openocta/openocta/pkg/agent/stream"
	"github.com/openocta/openocta/pkg/agent/types"
)

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

func TestEmitAssistantTextOrToolResultPreservesWhitespaceChunks(t *testing.T) {
	t.Parallel()

	out := make(chan stream.StreamEvent, 16)
	textStream := a2ui.NewAssistantTextStream("sess-ws")
	emitAssistantTextOrToolResult(out, "sess-ws", textStream, pendingToolCall{}, "汇总：")
	emitAssistantTextOrToolResult(out, "sess-ws", textStream, pendingToolCall{}, "\n\n")
	emitAssistantTextOrToolResult(out, "sess-ws", textStream, pendingToolCall{}, "## 标题")
	emitAssistantTextOrToolResult(out, "sess-ws", textStream, pendingToolCall{}, "\n")
	emitAssistantTextOrToolResult(out, "sess-ws", textStream, pendingToolCall{}, " ")
	emitAssistantTextOrToolResult(out, "sess-ws", textStream, pendingToolCall{}, "- item")
	close(out)

	var lastValue string
	var textDeltas []string
	for evt := range out {
		switch evt.Type {
		case stream.EventA2UI:
			var msg a2ui.ServerMessage
			if err := json.Unmarshal(evt.A2UI, &msg); err != nil {
				t.Fatalf("unmarshal a2ui: %v", err)
			}
			if msg.UpdateDataModel != nil {
				if s, ok := msg.UpdateDataModel.Value.(string); ok {
					lastValue = s
				}
			}
		case stream.EventContentBlockDelta:
			if evt.Delta != nil {
				textDeltas = append(textDeltas, evt.Delta.Text)
			}
		}
	}

	want := "汇总：\n\n## 标题\n - item"
	if lastValue != want {
		t.Fatalf("A2UI content = %q, want %q", lastValue, want)
	}
	if got := strings.Join(textDeltas, ""); got != want {
		t.Fatalf("text deltas = %q, want %q", got, want)
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
