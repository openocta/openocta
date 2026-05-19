// Package mapper converts between gateway chat payloads and A2A messages.
package mapper

import (
	"github.com/a2aproject/a2a-go/v2/a2a"
)

// UserMessage builds an A2A user message from plain text.
func UserMessage(text string) *a2a.Message {
	return a2a.NewMessage(a2a.MessageRoleUser, a2a.NewTextPart(text))
}

// AgentMessage builds an A2A agent message from plain text.
func AgentMessage(text string) *a2a.Message {
	return a2a.NewMessage(a2a.MessageRoleAgent, a2a.NewTextPart(text))
}

// TextFromMessage extracts concatenated text parts from a message.
func TextFromMessage(msg *a2a.Message) string {
	if msg == nil {
		return ""
	}
	var b []byte
	for _, p := range msg.Parts {
		if p == nil {
			continue
		}
		text := p.Text()
		if text == "" {
			continue
		}
		if len(b) > 0 {
			b = append(b, '\n')
		}
		b = append(b, text...)
	}
	return string(b)
}
