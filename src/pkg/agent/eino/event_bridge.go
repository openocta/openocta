package eino

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/adk"
	"github.com/cloudwego/eino/schema"

	"github.com/openocta/openocta/pkg/a2ui"
	"github.com/openocta/openocta/pkg/agent/model"
	"github.com/openocta/openocta/pkg/agent/stream"
	"github.com/openocta/openocta/pkg/agent/types"
)

// BuildAgentMessages returns the full model input for a chat turn.
// When SessionMessages is populated (e.g. from transcript), it is used as-is.
func BuildAgentMessages(req types.Request) ([]*schema.Message, error) {
	msgs := req.SessionMessages
	if len(msgs) == 0 && strings.TrimSpace(req.TranscriptPath) != "" {
		loaded, _, err := LoadSchemaMessagesFromTranscriptCandidates(
			[]string{req.TranscriptPath},
			TranscriptLoadOptions{
				MaxMessages: req.SessionHistoryMaxMessages,
				Roles:       req.SessionHistoryRoles,
			},
		)
		if err != nil && len(loaded) == 0 {
			return nil, err
		}
		msgs = loaded
	}
	if len(msgs) > 0 {
		var out []*schema.Message
		if merged, err := mergeCurrentRequestIntoHistory(msgs, req); err != nil {
			return nil, err
		} else if merged != nil {
			out = merged
		} else {
			out = msgs
		}
		return PrepareSchemaMessagesForModel(out), nil
	}
	return BuildUserMessages(req)
}

func mergeCurrentRequestIntoHistory(history []*schema.Message, req types.Request) ([]*schema.Message, error) {
	if len(history) == 0 || len(req.ContentBlocks) == 0 {
		return history, nil
	}
	current, err := BuildUserMessages(req)
	if err != nil || len(current) == 0 {
		return history, err
	}
	out := append([]*schema.Message(nil), history...)
	last := out[len(out)-1]
	cur := current[0]
	if last.Role == schema.User && cur.Role == schema.User {
		if len(cur.MultiContent) > 0 {
			last.MultiContent = append(append([]schema.ChatMessagePart(nil), last.MultiContent...), cur.MultiContent...)
			last.Content = ""
		} else if strings.TrimSpace(cur.Content) != "" {
			if strings.TrimSpace(last.Content) != "" {
				last.Content = strings.TrimSpace(last.Content) + "\n" + strings.TrimSpace(cur.Content)
			} else {
				last.Content = cur.Content
			}
		}
		return out, nil
	}
	return append(out, cur), nil
}

// BuildUserMessages converts an OpenOcta request into Eino user messages.
func BuildUserMessages(req types.Request) ([]*schema.Message, error) {
	if len(req.ContentBlocks) == 0 {
		prompt := strings.TrimSpace(req.Prompt)
		if prompt == "" {
			return nil, fmt.Errorf("empty prompt")
		}
		return []*schema.Message{schema.UserMessage(prompt)}, nil
	}
	var parts []schema.ChatMessagePart
	if p := strings.TrimSpace(req.Prompt); p != "" {
		parts = append(parts, schema.ChatMessagePart{Type: schema.ChatMessagePartTypeText, Text: p})
	}
	for _, b := range req.ContentBlocks {
		switch b.Type {
		case model.ContentBlockText:
			if strings.TrimSpace(b.Text) != "" {
				parts = append(parts, schema.ChatMessagePart{Type: schema.ChatMessagePartTypeText, Text: b.Text})
			}
		case model.ContentBlockImage:
			url := b.URL
			if url == "" && b.Data != "" {
				mime := b.MediaType
				if mime == "" {
					mime = "image/jpeg"
				}
				url = "data:" + mime + ";base64," + b.Data
			}
			if url != "" {
				parts = append(parts, schema.ChatMessagePart{
					Type:     schema.ChatMessagePartTypeImageURL,
					ImageURL: &schema.ChatMessageImageURL{URL: url},
				})
			}
		case model.ContentBlockVideo:
			url := b.URL
			if url == "" && b.Data != "" {
				mime := b.MediaType
				if mime == "" {
					mime = "video/mp4"
				}
				url = "data:" + mime + ";base64," + b.Data
			}
			if url != "" {
				parts = append(parts, schema.ChatMessagePart{
					Type: schema.ChatMessagePartTypeVideoURL,
					VideoURL: &schema.ChatMessageVideoURL{
						URL:      url,
						MIMEType: b.MediaType,
					},
				})
			}
		case model.ContentBlockDocument:
			url := b.URL
			if url == "" && b.Data != "" {
				mime := b.MediaType
				if mime == "" {
					mime = "application/pdf"
				}
				url = "data:" + mime + ";base64," + b.Data
			}
			if url != "" {
				parts = append(parts, schema.ChatMessagePart{
					Type:    schema.ChatMessagePartTypeFileURL,
					FileURL: &schema.ChatMessageFileURL{URL: url},
				})
			}
		}
	}
	if len(parts) == 0 {
		return nil, fmt.Errorf("empty multimodal content")
	}
	return []*schema.Message{{Role: schema.User, MultiContent: parts}}, nil
}

// mapFinishReasonToStopReason maps Eino schema.ResponseMeta.FinishReason to OpenOcta stop reasons
// consumed by gateway chat handlers (tool_use = intermediate turn, end_turn = final text turn).
func mapFinishReasonToStopReason(finishReason string) string {
	switch strings.ToLower(strings.TrimSpace(finishReason)) {
	case "tool_calls":
		return "tool_use"
	case "stop", "length", "content_filter":
		return "end_turn"
	default:
		return ""
	}
}

func emitUsageFromResponseMeta(out chan<- stream.StreamEvent, sessionID string, meta *schema.ResponseMeta) {
	if meta == nil || meta.Usage == nil {
		return
	}
	u := meta.Usage
	out <- stream.StreamEvent{
		Type:      stream.EventMessageDelta,
		SessionID: sessionID,
		Usage: &stream.Usage{
			InputTokens:  int(u.PromptTokens),
			OutputTokens: int(u.CompletionTokens),
		},
	}
}

// emitTurnStopFromResponseMeta emits EventMessageStop when FinishReason marks a model turn boundary.
// Returns true when a turn-ending stop was emitted (so Action.Exit can avoid duplicating end_turn).
func emitTurnStopFromResponseMeta(out chan<- stream.StreamEvent, sessionID string, meta *schema.ResponseMeta, textStream *a2ui.AssistantTextStream) bool {
	if meta == nil {
		return false
	}
	emitUsageFromResponseMeta(out, sessionID, meta)
	stop := mapFinishReasonToStopReason(meta.FinishReason)
	if stop == "" {
		return false
	}
	out <- stream.StreamEvent{
		Type:      stream.EventMessageStop,
		SessionID: sessionID,
		Delta:     &stream.Delta{StopReason: stop},
	}
	if textStream != nil {
		textStream.Reset()
	}
	return true
}

type pendingToolCall struct {
	id   string
	name string
}

func emitToolOutputAsResult(out chan<- stream.StreamEvent, sessionID string, pending pendingToolCall, output string) {
	name := strings.TrimSpace(pending.name)
	if name == "" {
		name = "execute"
	}
	out <- stream.StreamEvent{
		Type:      stream.EventToolExecutionResult,
		SessionID: sessionID,
		ToolUseID: strings.TrimSpace(pending.id),
		Name:      name,
		Output:    output,
	}
}

func emitAssistantTextOrToolResult(
	out chan<- stream.StreamEvent,
	sessionID string,
	textStream *a2ui.AssistantTextStream,
	pending pendingToolCall,
	text string,
) {
	if strings.TrimSpace(text) == "" {
		return
	}
	if IsLeakedToolOutputText(text) {
		emitToolOutputAsResult(out, sessionID, pending, text)
		return
	}
	emitAssistantTextDelta(out, sessionID, textStream, text)
	out <- stream.StreamEvent{
		Type:      stream.EventContentBlockDelta,
		SessionID: sessionID,
		Delta:     &stream.Delta{Type: "text_delta", Text: text},
	}
}

func emitAssistantMessageEvents(
	out chan<- stream.StreamEvent,
	sessionID string,
	msg *schema.Message,
	textStream *a2ui.AssistantTextStream,
	pending *pendingToolCall,
) bool {
	if msg == nil {
		return false
	}
	if thinking := assistantThinkingText(msg); thinking != "" {
		out <- stream.StreamEvent{
			Type:      stream.EventContentBlockStart,
			SessionID: sessionID,
			ContentBlock: &stream.ContentBlock{
				Type:     "thinking",
				Thinking: thinking,
			},
		}
	}
	if text := visibleAssistantText(msg); text != "" {
		emitAssistantTextOrToolResult(out, sessionID, textStream, *pending, text)
	}
	for _, tc := range msg.ToolCalls {
		input := json.RawMessage(NormalizeToolCallArgumentsJSON(tc.Function.Arguments))
		if pending != nil {
			pending.id = tc.ID
			pending.name = tc.Function.Name
		}
		out <- stream.StreamEvent{
			Type:      stream.EventToolExecutionStart,
			SessionID: sessionID,
			Name:      tc.Function.Name,
			ToolUseID: tc.ID,
			ContentBlock: &stream.ContentBlock{
				Type:  "tool_use",
				ID:    tc.ID,
				Name:  tc.Function.Name,
				Input: input,
			},
		}
	}
	return emitTurnStopFromResponseMeta(out, sessionID, msg.ResponseMeta, textStream)
}

// StreamEventsFromIterator converts Eino agent events into OpenOcta stream events.
func StreamEventsFromIterator(ctx context.Context, sessionID, runID string, iter *adk.AsyncIterator[*adk.AgentEvent]) <-chan stream.StreamEvent {
	out := make(chan stream.StreamEvent, 64)
	go func() {
		defer close(out)
		textStream := a2ui.NewAssistantTextStream(sessionID)
		var pending pendingToolCall
		turnStopEmitted := false
		for {
			evt, ok := iter.Next()
			if !ok {
				return
			}
			if ctx.Err() != nil {
				return
			}
			if evt == nil {
				continue
			}
			if evt.Err != nil {
				out <- stream.StreamEvent{Type: stream.EventError, Name: evt.Err.Error(), SessionID: sessionID}
				return
			}
			if evt.Action != nil && evt.Action.Interrupted != nil {
				payload := interruptPayloadFromInfo(sessionID, runID, evt.Action.Interrupted)
				out <- stream.StreamEvent{
					Type:      stream.EventRunInterrupted,
					SessionID: sessionID,
					Interrupt: payload,
				}
				stop := "interrupt"
				out <- stream.StreamEvent{
					Type:      stream.EventMessageStop,
					SessionID: sessionID,
					Delta:     &stream.Delta{StopReason: stop},
				}
				return
			}
			if evt.Output != nil && evt.Output.MessageOutput != nil {
				mo := evt.Output.MessageOutput
				if mo.IsStreaming && mo.MessageStream != nil {
					var lastReasoning string
					var lastChunk *schema.Message
					for {
						chunk, err := mo.MessageStream.Recv()
						if err != nil {
							break
						}
						if chunk == nil {
							continue
						}
						lastChunk = chunk
						if thinking := assistantThinkingText(chunk); thinking != "" {
							merged := thinking
							if lastReasoning != "" {
								if strings.HasPrefix(thinking, lastReasoning) {
									merged = thinking
								} else if strings.HasPrefix(lastReasoning, thinking) {
									merged = lastReasoning
								} else {
									merged = lastReasoning + thinking
								}
							}
							if len(merged) > len(lastReasoning) {
								delta := merged[len(lastReasoning):]
								lastReasoning = merged
								if delta != "" {
									out <- stream.StreamEvent{
										Type:      stream.EventContentBlockDelta,
										SessionID: sessionID,
										Delta:     &stream.Delta{Type: "thinking_delta", Thinking: delta},
									}
								}
							}
						}
						if text := visibleStreamingText(chunk); text != "" {
							emitAssistantTextOrToolResult(out, sessionID, textStream, pending, text)
						}
						for _, tc := range chunk.ToolCalls {
							input := json.RawMessage(NormalizeToolCallArgumentsJSON(tc.Function.Arguments))
							pending.id = tc.ID
							pending.name = tc.Function.Name
							out <- stream.StreamEvent{
								Type:      stream.EventToolExecutionStart,
								SessionID: sessionID,
								Name:      tc.Function.Name,
								ToolUseID: tc.ID,
								ContentBlock: &stream.ContentBlock{
									Type:  "tool_use",
									ID:    tc.ID,
									Name:  tc.Function.Name,
									Input: input,
								},
							}
						}
					}
					if lastChunk != nil && emitTurnStopFromResponseMeta(out, sessionID, lastChunk.ResponseMeta, textStream) {
						turnStopEmitted = true
					}
				} else if mo.Message != nil {
					switch mo.Role {
					case schema.Assistant:
						if emitAssistantMessageEvents(out, sessionID, mo.Message, textStream, &pending) {
							turnStopEmitted = true
						}
					case schema.Tool:
						content, _ := mo.GetMessage()
						output := ""
						if content != nil {
							output = content.Content
						}
						toolID := ""
						toolName := ""
						if mo.Message != nil {
							toolID = strings.TrimSpace(mo.Message.ToolCallID)
							toolName = strings.TrimSpace(mo.Message.ToolName)
						}
						if toolName == "" {
							toolName = pending.name
						}
						out <- stream.StreamEvent{
							Type:      stream.EventToolExecutionResult,
							SessionID: sessionID,
							ToolUseID: toolID,
							Name:      toolName,
							Output:    output,
						}
						pending.id = ""
						pending.name = ""
					}
				}
			}
			if evt.Action != nil && evt.Action.Exit {
				if !turnStopEmitted {
					out <- stream.StreamEvent{
						Type:      stream.EventMessageStop,
						SessionID: sessionID,
						Delta:     &stream.Delta{StopReason: "end_turn"},
					}
				}
				return
			}
		}
	}()
	return out
}
