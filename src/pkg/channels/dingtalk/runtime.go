package dingtalk

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/open-dingtalk/dingtalk-stream-sdk-go/chatbot"
	"github.com/open-dingtalk/dingtalk-stream-sdk-go/client"

	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/logging"
)

// Runtime 实现钉钉的 RuntimeChannel，使用官方 Stream SDK 收消息并通过 sessionWebhook 回复。
// 逻辑整体参考 /Users/ZhanBei/GoProjects/goclaw/channels/dingtalk.go，并适配新的 Runtime 抽象。
type Runtime struct {
	*channels.BaseRuntimeImpl

	clientID     string
	clientSecret string

	streamClient *client.StreamClient
	ctx          context.Context
	cancel       context.CancelFunc

	// 每个会话对应一个 sessionWebhook，用于后续回复。
	// key 为 ChatID（私聊为用户 ID，群聊为会话 ID）。
	sessionWebhooks sync.Map // chatID -> sessionWebhook

	logger *logging.GlobalLogger
}

// NewRuntime 创建一个 DingTalk Runtime 实例。
// clientID / clientSecret 为钉钉应用凭证。
func NewRuntime(clientID, clientSecret string, cfg channels.BaseRuntimeConfig, sink channels.InboundSink) *Runtime {
	base := channels.NewBaseRuntimeImpl(channelID, cfg.AccountID, cfg, sink)
	return &Runtime{
		BaseRuntimeImpl: base,
		clientID:        clientID,
		clientSecret:    clientSecret,
		logger:          logging.Sub("dingtalk-runtime"),
	}
}

// Start 启动 DingTalk Stream Client，接收机器人回调消息。
func (r *Runtime) Start(ctx context.Context) error {
	if err := r.BaseRuntimeImpl.Start(ctx); err != nil {
		return err
	}

	if r.clientID == "" || r.clientSecret == "" {
		return fmt.Errorf("dingtalk runtime: clientID and clientSecret are required")
	}

	r.logger.Info("starting DingTalk runtime (Stream mode), client_id=%s", r.clientID)

	r.ctx, r.cancel = context.WithCancel(ctx)

	// 创建凭证配置
	cred := client.NewAppCredentialConfig(r.clientID, r.clientSecret)

	// 创建 StreamClient，启用自动重连
	r.streamClient = client.NewStreamClient(
		client.WithAppCredential(cred),
		client.WithAutoReconnect(true),
	)

	// 注册机器人回调处理器
	r.streamClient.RegisterChatBotCallbackRouter(r.onChatBotMessageReceived)

	// 启动 StreamClient
	if err := r.streamClient.Start(r.ctx); err != nil {
		r.logger.Error("dingtalk runtime: failed to start stream client: %w", err)
		return fmt.Errorf("dingtalk runtime: failed to start stream client: %w", err)
	}

	r.logger.Info("DingTalk runtime started (Stream mode)")
	return nil
}

// Stop 停止 DingTalk Runtime。
func (r *Runtime) Stop() error {
	r.logger.Info("stopping DingTalk runtime")

	if r.cancel != nil {
		r.cancel()
	}
	if r.streamClient != nil {
		r.streamClient.Close()
	}

	return r.BaseRuntimeImpl.Stop()
}

// Send 使用 sessionWebhook 将消息发送到钉钉。
func (r *Runtime) Send(msg *channels.RuntimeOutboundMessage) error {
	if msg == nil {
		return nil
	}
	if !r.BaseRuntimeImpl.IsRunning() {
		return fmt.Errorf("dingtalk runtime: not running")
	}

	chatID := msg.ChatID
	if chatID == "" {
		chatID = msg.MetadataString("chat_id")
	}
	if chatID == "" {
		return fmt.Errorf("dingtalk runtime: chatID is required for Send")
	}

	// 根据 chatID 获取 sessionWebhook
	raw, ok := r.sessionWebhooks.Load(chatID)
	if !ok {
		return fmt.Errorf("dingtalk runtime: no session_webhook found for chat %s", chatID)
	}
	sessionWebhook, ok := raw.(string)
	if !ok || sessionWebhook == "" {
		return fmt.Errorf("dingtalk runtime: invalid session_webhook for chat %s", chatID)
	}

	r.logger.Info("DingTalk message to send, chat_id=%s, content_length=%d", chatID, len(msg.Content))

	return r.sendDirectReply(sessionWebhook, msg.Content)
}

// SendStream：DingTalk 不支持真正的流式消息，这里聚合后一次性发送。
func (r *Runtime) SendStream(chatID string, stream <-chan *channels.RuntimeStreamChunk) error {
	var buf string

	for chunk := range stream {
		if chunk == nil {
			continue
		}
		if chunk.Error != "" {
			return fmt.Errorf("dingtalk runtime stream error: %s", chunk.Error)
		}
		if !chunk.IsThinking && !chunk.IsFinal {
			buf += chunk.Content
		}
		if chunk.IsComplete {
			break
		}
	}

	if buf == "" {
		return nil
	}

	return r.Send(&channels.RuntimeOutboundMessage{
		ChatID:  chatID,
		Content: buf,
	})
}

// onChatBotMessageReceived 处理来自钉钉 Stream SDK 的机器人消息。
func (r *Runtime) onChatBotMessageReceived(ctx context.Context, data *chatbot.BotCallbackDataModel) ([]byte, error) {
	if data == nil {
		return nil, nil
	}

	// 优先从 Text 字段提取内容
	content := data.Text.Content
	if content == "" {
		// 兼容 Content 为 map 的情况
		if m, ok := data.Content.(map[string]interface{}); ok {
			if v, ok := m["content"].(string); ok {
				content = v
			}
		}
	}
	if content == "" {
		return nil, nil
	}

	senderID := data.SenderStaffId
	senderNick := data.SenderNick

	// 私聊：chatID 使用 senderID；群聊：使用 ConversationId
	chatID := senderID
	chatType := "dm"
	if data.ConversationType != "1" {
		chatID = data.ConversationId
		chatType = "group"
	}

	// 白名单校验
	if senderID != "" && !r.IsAllowed(senderID) {
		r.logger.Debug("DingTalk message from unauthorized sender, sender_id=%s, sender_nick=%s", senderID, senderNick)
		return nil, nil
	}

	// 记录当前会话的 sessionWebhook，后续回复使用
	if data.SessionWebhook != "" {
		r.sessionWebhooks.Store(chatID, data.SessionWebhook)
		// 像飞书一样，立即发送表情/占位回复，表示正在处理（钉钉无消息表情 API，用简短占位消息代替）
		_ = r.sendTypingIndicator(data.SessionWebhook)
	}

	r.logger.Info("DingTalk message received, sender_nick=%s, sender_id=%s, chat_id=%s, conversation_type=%s, content_length=%d",
		senderNick, senderID, chatID, data.ConversationType, len(content))

	// MsgId 用于 deliverMessageID，供 chat.send 投递时作为 RootMessageID 回复到用户消息
	msgID := data.MsgId
	if msgID == "" {
		msgID = data.ConversationId + ":" + fmt.Sprintf("%d", time.Now().UnixMilli())
	}

	in := &channels.InboundMessage{
		ID:       msgID,
		SenderID: senderID,
		ChatID:   chatID,
		ChatType: chatType,
		Content:  content,
		Time:     time.Now(),
		Meta: map[string]interface{}{
			"sender_name":       senderNick,
			"conversation_id":   data.ConversationId,
			"conversation_type": data.ConversationType,
			"platform":          "dingtalk",
			"session_webhook":   data.SessionWebhook,
		},
	}

	_ = r.PublishInbound(ctx, in)

	// 返回 nil 表示已异步处理，不需要同步回复。
	return nil, nil
}

// sendTypingIndicator 发送“正在处理”占位消息，类似飞书的 Typing 表情回复，给用户即时反馈。
func (r *Runtime) sendTypingIndicator(sessionWebhook string) error {
	if sessionWebhook == "" {
		return nil
	}
	replier := chatbot.NewChatbotReplier()
	content := []byte("🖐️ 正在处理...")
	title := []byte("OpenOcta...")
	return replier.SimpleReplyMarkdown(context.Background(), sessionWebhook, title, content)
}

// sendDirectReply 使用 sessionWebhook 发送 Markdown 文本回复。
func (r *Runtime) sendDirectReply(sessionWebhook, content string) error {
	if sessionWebhook == "" {
		return fmt.Errorf("dingtalk runtime: empty sessionWebhook")
	}

	replier := chatbot.NewChatbotReplier()

	contentBytes := []byte(content)
	titleBytes := []byte("OpenOcta...")

	if err := replier.SimpleReplyMarkdown(
		context.Background(),
		sessionWebhook,
		titleBytes,
		contentBytes,
	); err != nil {
		r.logger.Error("failed to send DingTalk reply: %v", err)
		return fmt.Errorf("dingtalk runtime: failed to send reply: %w", err)
	}

	return nil
}
