package runtime

import (
	"path/filepath"
	"testing"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/session"
	"github.com/stellarlinkco/agentsdk-go/pkg/api"
)

func TestDecodeSessionHistoryJSONArray(t *testing.T) {
	raw := []byte(`[
  {"role":"user","content":"hi"},
  {"role":"assistant","content":"hello"}
]`)
	msgs, err := decodeSessionHistoryJSON(raw)
	if err != nil {
		t.Fatal(err)
	}
	if len(msgs) != 2 || msgs[0].Role != "user" || msgs[1].Content != "hello" {
		t.Fatalf("got %+v", msgs)
	}
}

func TestDecodeSessionHistoryWrapped(t *testing.T) {
	raw := []byte(`{"messages":[{"role":"user","content":"a"},{"role":"assistant","tool_calls":[{"id":"1","name":"bash","arguments":{"command":"ls"},"result":"ok"}]}]}`)
	msgs, err := decodeSessionHistoryJSON(raw)
	if err != nil {
		t.Fatal(err)
	}
	if len(msgs) != 2 {
		t.Fatalf("len=%d", len(msgs))
	}
	if len(msgs[1].ToolCalls) != 1 || msgs[1].ToolCalls[0].Name != "bash" {
		t.Fatalf("tool calls %+v", msgs[1].ToolCalls)
	}
}

func TestTranscriptMessagesToSDK(t *testing.T) {
	in := []session.TranscriptMessage{
		{Role: "user", Content: []session.ContentBlock{{Type: "text", Text: "u1"}}},
		{Role: "toolResult", ToolCallID: "tc1", ToolName: "bash", Content: []session.ContentBlock{{Type: "text", Text: "x"}}},
		{Role: "assistant", Content: []session.ContentBlock{{Type: "text", Text: "a1"}}},
	}
	got := transcriptMessagesToSDK(in)
	if len(got) != 3 {
		t.Fatalf("expected 3 messages, got %d", len(got))
	}
	if got[0].Content != "u1" || got[0].Role != "user" {
		t.Fatalf("expected user message with content u1, got %+v", got[0])
	}
	if got[1].Role != "assistant" || len(got[1].ToolCalls) != 1 || got[1].ToolCalls[0].Name != "bash" || got[1].ToolCalls[0].Result != "x" {
		t.Fatalf("expected assistant message with tool call, got %+v", got[1])
	}
	if got[2].Role != "assistant" || got[2].Content != "a1" {
		t.Fatalf("expected assistant message with content a1, got %+v", got[2])
	}
}

func TestLoadMessagesFromClaudeHistoryFileMissing(t *testing.T) {
	msgs, err := loadMessagesFromClaudeHistoryFile(t.TempDir(), "sess-1")
	if err != nil {
		t.Fatal(err)
	}
	if len(msgs) != 0 {
		t.Fatalf("expected empty, got %d", len(msgs))
	}
}

func TestApplySessionHistoryRespectsEnabledFalse(t *testing.T) {
	off := false
	cfg := &config.OpenOctaConfig{
		Session: &config.SessionConfig{
			SessionHistory: &config.SessionHistoryConfig{Enabled: &off},
		},
	}
	var apiOpts api.Options
	applySessionHistory(&apiOpts, ".", Options{Config: cfg})
	if apiOpts.SessionHistoryLoader != nil {
		t.Fatal("expected no loader when disabled")
	}
}

func TestDefaultSessionHistoryLoaderFromTranscript(t *testing.T) {
	stateDir := t.TempDir()
	env := func(k string) string {
		if k == "OPENOCTA_STATE_DIR" {
			return stateDir
		}
		return ""
	}
	agentID := "main"
	sid := "abc"
	transcript := filepath.Join(session.ResolveAgentSessionsDir(agentID, env), sid+".jsonl")
	if err := session.EnsureTranscriptFile(transcript, sid); err != nil {
		t.Fatal(err)
	}
	if err := session.AppendUserMessage(transcript, "ping"); err != nil {
		t.Fatal(err)
	}
	if err := session.AppendAssistantMessage(transcript, "pong"); err != nil {
		t.Fatal(err)
	}

	ld := defaultSessionHistoryLoader(".", Options{AgentID: agentID, Env: env}, nil)
	msgs, err := ld(sid)
	if err != nil {
		t.Fatal(err)
	}
	if len(msgs) != 2 || msgs[0].Content != "ping" || msgs[1].Content != "pong" {
		t.Fatalf("got %+v", msgs)
	}
}
