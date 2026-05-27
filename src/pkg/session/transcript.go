// Package session provides transcript file handling for chat sessions.
package session

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// TranscriptHeader is the first line of a session transcript file.
type TranscriptHeader struct {
	Type      string `json:"type"`
	Version   int    `json:"version"`
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	Cwd       string `json:"cwd,omitempty"`
}

// TranscriptMessage is a single message in the transcript.
type TranscriptMessage struct {
	Role             string         `json:"role"`
	Content          []ContentBlock `json:"content"`
	Timestamp        int64          `json:"timestamp"`
	Usage            *Usage         `json:"usage,omitempty"`
	StopReason       string         `json:"stopReason,omitempty"`
	Provider         string         `json:"provider,omitempty"`
	Model            string         `json:"model,omitempty"`
	DurationMs       *int64         `json:"durationMs,omitempty"`
	FirstTokenMs     *int64         `json:"firstTokenMs,omitempty"`
	ToolDurationMs   *int64         `json:"toolDurationMs,omitempty"`
	OutputDurationMs *int64         `json:"outputDurationMs,omitempty"`
	// ToolResult fields (when role == "toolResult")
	ToolCallID string `json:"toolCallId,omitempty"`
	ToolName   string `json:"toolName,omitempty"`
	IsError    bool   `json:"isError,omitempty"`
}

// ContentBlock is a content block (text, image, tool_use, tool_result, etc.).
type ContentBlock struct {
	Type     string `json:"type"`
	Text     string `json:"text,omitempty"`
	Name     string `json:"name,omitempty"`
	MimeType string `json:"mimeType,omitempty"`
	Data     string `json:"data,omitempty"`
	IsError  bool   `json:"is_error,omitempty"`
}

// Usage holds token usage.
type Usage struct {
	Input       int   `json:"input"`
	Output      int   `json:"output"`
	CacheRead   int   `json:"cacheRead"`
	CacheWrite  int   `json:"cacheWrite"`
	TotalTokens int   `json:"totalTokens"`
	Cost        *Cost `json:"cost,omitempty"`
}

// Cost holds cost breakdown (aligns with TS CostBreakdown).
type Cost struct {
	Input      float64 `json:"input"`
	Output     float64 `json:"output"`
	CacheRead  float64 `json:"cacheRead,omitempty"`
	CacheWrite float64 `json:"cacheWrite,omitempty"`
	Total      float64 `json:"total"`
}

const (
	// CurrentSessionVersion matches TS CURRENT_SESSION_VERSION.
	CurrentSessionVersion = 2
	// maxTranscriptLineBytes is the max size of one JSONL line. bufio.Scanner defaults to 64KiB;
	// long assistant/tool lines exceed that and would make ReadTranscriptMessages fail entirely.
	maxTranscriptLineBytes = 32 << 20
)

// EnsureTranscriptFile creates a transcript file if it does not exist.
func EnsureTranscriptFile(transcriptPath string, sessionID string) error {
	if _, err := os.Stat(transcriptPath); err == nil {
		return nil
	}
	dir := filepath.Dir(transcriptPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("mkdir: %w", err)
	}
	header := TranscriptHeader{
		Type:      "session",
		Version:   CurrentSessionVersion,
		ID:        sessionID,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	line, _ := json.Marshal(header)
	if err := os.WriteFile(transcriptPath, append(line, '\n'), 0644); err != nil {
		return fmt.Errorf("write: %w", err)
	}
	return nil
}

// AppendUserMessage appends a user message to the transcript.
func AppendUserMessage(transcriptPath string, text string) error {
	return appendMessage(transcriptPath, "user", text)
}

// AppendUserMessageWithBlocks appends a user message with additional content blocks (e.g. images) to the transcript.
func AppendUserMessageWithBlocks(transcriptPath string, text string, extraBlocks []ContentBlock) error {
	return appendMessageWithBlocks(transcriptPath, "user", text, extraBlocks)
}

// AppendAssistantMessage appends an assistant message to the transcript.
func AppendAssistantMessage(transcriptPath string, text string) error {
	return appendMessage(transcriptPath, "assistant", text)
}

// AssistantMessageOpts holds optional fields for an assistant message (usage, provider, model, etc.).
type AssistantMessageOpts struct {
	Usage            *Usage
	Provider         string
	Model            string
	StopReason       string
	DurationMs       *int64
	FirstTokenMs     *int64
	ToolDurationMs   *int64
	OutputDurationMs *int64
}

// AppendAssistantMessageWithUsage appends an assistant message with optional usage, provider, model, stopReason, durationMs.
// If opts is nil, behavior is equivalent to AppendAssistantMessage(transcriptPath, text).
func AppendAssistantMessageWithUsage(transcriptPath string, text string, opts *AssistantMessageOpts) error {
	if err := os.MkdirAll(filepath.Dir(transcriptPath), 0755); err != nil {
		return err
	}
	f, err := os.OpenFile(transcriptPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	msg := TranscriptMessage{
		Role:      "assistant",
		Content:   []ContentBlock{{Type: "text", Text: text}},
		Timestamp: time.Now().UnixMilli(),
	}
	if opts != nil {
		msg.Usage = opts.Usage
		msg.Provider = opts.Provider
		msg.Model = opts.Model
		msg.StopReason = opts.StopReason
		msg.DurationMs = opts.DurationMs
		msg.FirstTokenMs = opts.FirstTokenMs
		msg.ToolDurationMs = opts.ToolDurationMs
		msg.OutputDurationMs = opts.OutputDurationMs
	}
	line, _ := json.Marshal(msg)
	_, err = f.Write(append(line, '\n'))
	return err
}

func appendMessage(transcriptPath string, role string, text string) error {
	if err := os.MkdirAll(filepath.Dir(transcriptPath), 0755); err != nil {
		return err
	}
	f, err := os.OpenFile(transcriptPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	msg := TranscriptMessage{
		Role:      role,
		Content:   []ContentBlock{{Type: "text", Text: text}},
		Timestamp: time.Now().UnixMilli(),
	}
	line, _ := json.Marshal(msg)
	_, err = f.Write(append(line, '\n'))
	return err
}

func appendMessageWithBlocks(transcriptPath string, role string, text string, extraBlocks []ContentBlock) error {
	if err := os.MkdirAll(filepath.Dir(transcriptPath), 0755); err != nil {
		return err
	}
	f, err := os.OpenFile(transcriptPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	blocks := make([]ContentBlock, 0, 1+len(extraBlocks))
	if text != "" {
		blocks = append(blocks, ContentBlock{Type: "text", Text: text})
	}
	blocks = append(blocks, extraBlocks...)
	msg := TranscriptMessage{
		Role:      role,
		Content:   blocks,
		Timestamp: time.Now().UnixMilli(),
	}
	line, _ := json.Marshal(msg)
	_, err = f.Write(append(line, '\n'))
	return err
}

// AppendTranscriptLine appends one JSONL line (any JSON object) to the transcript.
// Used for message entries with type/id/parentId/timestamp/message wrapper or raw message objects.
func AppendTranscriptLine(transcriptPath string, obj interface{}) error {
	if err := os.MkdirAll(filepath.Dir(transcriptPath), 0755); err != nil {
		return err
	}
	f, err := os.OpenFile(transcriptPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	line, err := json.Marshal(obj)
	if err != nil {
		return err
	}
	_, err = f.Write(append(line, '\n'))
	return err
}

// transcriptLineWrapper is a JSONL line with type "message" and nested message (reference format).
type transcriptLineWrapper struct {
	Type      string             `json:"type"`
	Message   *TranscriptMessage `json:"message,omitempty"`
	ID        string             `json:"id,omitempty"`
	ParentID  string             `json:"parentId,omitempty"`
	Timestamp string             `json:"timestamp,omitempty"`
}

// ReadTranscriptMessages reads all messages from a transcript (skips header).
// Accepts both raw { role, content, timestamp } and wrapper { type: "message", message: {...} } format.
func ReadTranscriptMessages(transcriptPath string, limit int) ([]TranscriptMessage, error) {
	f, err := os.Open(transcriptPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var msgs []TranscriptMessage
	scanner := bufio.NewScanner(f)
	scanBuf := make([]byte, 0, 256*1024)
	scanner.Buffer(scanBuf, maxTranscriptLineBytes)
	first := true
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		if first {
			first = false
			var h TranscriptHeader
			if json.Unmarshal(line, &h) == nil && h.Type == "session" {
				continue // skip header
			}
		}
		var wrapper transcriptLineWrapper
		if err := json.Unmarshal(line, &wrapper); err == nil && wrapper.Type == "message" && wrapper.Message != nil {
			msgs = append(msgs, *wrapper.Message)
			if limit > 0 && len(msgs) >= limit {
				break
			}
			continue
		}
		var m TranscriptMessage
		if err := json.Unmarshal(line, &m); err != nil {
			continue
		}
		msgs = append(msgs, m)
		if limit > 0 && len(msgs) >= limit {
			break
		}
	}
	return msgs, scanner.Err()
}
