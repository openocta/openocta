package handlers

import (
	"context"
	"strings"

	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/outbound"
)

// DefaultChatChannel is the default channel for send (matches TS).
const DefaultChatChannel = "whatsapp"

// SendHandler handles "send".
func SendHandler(opts HandlerOpts) error {
	to, _ := opts.Params["to"].(string)
	to = strings.TrimSpace(to)
	if to == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "send params: to (string) required",
		}, nil)
		return nil
	}

	message, _ := opts.Params["message"].(string)
	message = strings.TrimSpace(message)
	mediaUrl, _ := opts.Params["mediaUrl"].(string)
	mediaUrl = strings.TrimSpace(mediaUrl)
	channel, _ := opts.Params["channel"].(string)
	channel = strings.TrimSpace(channel)
	if channel == "" {
		channel = DefaultChatChannel
	}
	accountId, _ := opts.Params["accountId"].(string)
	accountId = strings.TrimSpace(accountId)

	if message == "" && mediaUrl == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "send params: text or media is required",
		}, nil)
		return nil
	}

	hctx := opts.Context
	if hctx == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    "method_not_implemented",
			Message: "send requires handler context",
		}, nil)
		return nil
	}

	// 优先走 RuntimeChannel 机制：根据 channelName 查找对应 Runtime 并发送。
	lowerChannel := strings.ToLower(channel)
	if hctx.ChannelManager != nil {
		if rt, ok := hctx.ChannelManager.Get(lowerChannel); ok && rt != nil {
			rtMsg := &channels.RuntimeOutboundMessage{
				Channel:   lowerChannel,
				AccountID: accountId,
				ChatID:    to,
				Content:   message,
				Metadata:  map[string]interface{}{},
			}
			if mediaUrl != "" {
				rtMsg.Media = []channels.RuntimeMedia{
					{
						Type: "image",
						URL:  mediaUrl,
					},
				}
			}

			if err := rt.Send(rtMsg); err != nil {
				opts.Respond(false, nil, &protocol.ErrorShape{
					Code:    protocol.ErrCodeServiceUnavailable,
					Message: err.Error(),
				}, nil)
				return nil
			}

			payload := map[string]interface{}{
				"channel":   lowerChannel,
				"messageId": "",
				"chatId":    to,
			}
			opts.Respond(true, payload, nil, nil)
			return nil
		}
	}

	// 兼容路径：若未找到对应 Runtime，则退回到 OutboundAdapterRegistry（主要用于尚未实现 Runtime 的通道）。
	if hctx.OutboundRegistry == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    "method_not_implemented",
			Message: "send requires runtime channel or outbound registry",
		}, nil)
		return nil
	}

	oc := &outbound.OutboundContext{
		To:        to,
		Text:      message,
		MediaURL:  mediaUrl,
		AccountID: accountId,
	}

	reqCtx := context.Background()
	var result *outbound.DeliveryResult
	var err error
	if mediaUrl != "" {
		result, err = hctx.OutboundRegistry.DeliverMedia(reqCtx, lowerChannel, oc)
	} else {
		result, err = hctx.OutboundRegistry.DeliverText(reqCtx, lowerChannel, oc)
	}
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeServiceUnavailable,
			Message: err.Error(),
		}, nil)
		return nil
	}

	payload := map[string]interface{}{
		"channel":   result.Channel,
		"messageId": result.MessageID,
	}
	if result.ChatID != "" {
		payload["chatId"] = result.ChatID
	}
	opts.Respond(true, payload, nil, nil)
	return nil
}
