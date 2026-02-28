package http

import (
	"context"
	"fmt"
	"strings"

	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/gateway/handlers"
)

// hooksAgentSink 将 RuntimeChannel 的 InboundMessage 转换为 HooksAgent 调用。
type hooksAgentSink struct {
	ctx *handlers.Context
}

func (s *hooksAgentSink) Deliver(_ context.Context, msg *channels.InboundMessage) error {
	if s == nil || s.ctx == nil || s.ctx.HooksAgent == nil || msg == nil {
		return nil
	}
	text := strings.TrimSpace(msg.Content)
	if text == "" {
		return nil
	}

	channelID := strings.TrimSpace(msg.Channel)
	if channelID == "" {
		channelID = "feishu"
	}

	to := msg.ChatID
	if to == "" {
		to = msg.SenderID
	}

	sessionKey := fmt.Sprintf("channel:%s:%s", channelID, to)

	params := handlers.HooksAgentParams{
		Message:    text,
		Name:       channelID,
		WakeMode:   "now",
		SessionKey: sessionKey,
		Deliver:    true,
		Channel:    channelID,
		To:         to,
		ChatType:   strings.TrimSpace(msg.ChatType),
	}
	_ = s.ctx.HooksAgent(params)
	return nil
}
