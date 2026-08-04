package wework

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/go-sphere/wecom-aibot-go-sdk/aibot"
	"github.com/openocta/openocta/pkg/channels"
)

// Runtime 使用企业微信智能机器人 WebSocket 长连接（aibot SDK）收发消息。
// 参考：https://developer.work.weixin.qq.com/document/path/101463
type Runtime struct {
	*channels.BaseRuntimeImpl

	botID     string
	botSecret string
	wsURL     string

	mu            sync.Mutex
	client        *aibot.WSClient
	authenticated bool
	lastInboundMs int64
	chatIDCanon   map[string]string
}

// NewRuntime 使用 BotID + Secret 创建企业微信智能机器人运行时。
func NewRuntime(botID, botSecret, wsURL string, cfg channels.BaseRuntimeConfig, sink channels.InboundSink) *Runtime {
	base := channels.NewBaseRuntimeImpl(channelID, cfg.AccountID, cfg, sink)
	return &Runtime{
		BaseRuntimeImpl: base,
		botID:           strings.TrimSpace(botID),
		botSecret:       strings.TrimSpace(botSecret),
		wsURL:           strings.TrimSpace(wsURL),
		chatIDCanon:     make(map[string]string),
	}
}

// Start 启动企微入站 WebSocket；出站由网关 handlers.deliverAssistantToIM 在整轮流式结束后调用 Send（与飞书/钉钉一致）。
func (r *Runtime) Start(ctx context.Context) error {
	if err := r.BaseRuntimeImpl.Start(ctx); err != nil {
		return err
	}
	if !r.BaseRuntimeImpl.IsRunning() {
		return nil
	}
	// 在 WebSocket 认证完成前不把通道标为 running
	r.BaseRuntimeImpl.MarkConnectionFailed(nil)
	if r.botID == "" || r.botSecret == "" {
		r.SetLastError(fmt.Errorf("wework: botId and botSecret are required when enabled"))
		return nil
	}
	go r.runClient(ctx)
	return nil
}

func (r *Runtime) runClient(ctx context.Context) {
	opts := aibot.WSClientOptions{
		BotID:  r.botID,
		Secret: r.botSecret,
		Logger: newSDKLogger("wework-aibot-sdk"),
	}
	if r.wsURL != "" {
		opts.WSURL = r.wsURL
	}
	client := aibot.NewWSClient(opts)

	client.OnAuthenticated(func() {
		r.mu.Lock()
		r.authenticated = true
		r.mu.Unlock()
		r.SetLastError(nil)
		r.BaseRuntimeImpl.MarkConnectionRestored()
	})

	client.OnDisconnected(func(reason string) {
		r.mu.Lock()
		r.authenticated = false
		r.mu.Unlock()
		r.BaseRuntimeImpl.MarkConnectionFailed(fmt.Errorf("wework ws disconnected: %s", reason))
	})

	client.OnError(func(_ error) {})

	client.OnMessageText(func(frame *aibot.WsFrame) {
		var msg aibot.TextMessage
		if err := aibot.ParseMessageBody(frame, &msg); err != nil {
			return
		}
		chatID := strings.TrimSpace(msg.ChatID)
		if chatID == "" {
			chatID = strings.TrimSpace(msg.From.UserID)
		}
		sender := strings.TrimSpace(msg.From.UserID)
		if sender == "" {
			sender = chatID
		}
		if !r.IsAllowed(sender) {
			return
		}
		var ts time.Time
		if msg.CreateTime > 0 {
			ts = time.Unix(msg.CreateTime, 0)
		} else {
			ts = time.Now()
		}
		atomic.StoreInt64(&r.lastInboundMs, time.Now().UnixMilli())
		content := ""
		if msg.Text.Content != "" {
			content = msg.Text.Content
		}
		if msg.ChatID != "" {
			r.mu.Lock()
			r.chatIDCanon[strings.ToLower(strings.TrimSpace(msg.ChatID))] = strings.TrimSpace(msg.ChatID)
			r.mu.Unlock()
		}
		fmt.Printf("[wework-runtime] Inbound text received, msg_id=%s, req_id=%s, raw_chat_id=%s, raw_chat_type=%s, sender=%s, content_preview=%.50s\n",
			msg.MsgID, frame.Headers.ReqID, msg.ChatID, msg.ChatType, sender, content)
		rawChatType := strings.TrimSpace(msg.ChatType)
		normalizedChatType := "dm"
		switch strings.ToLower(rawChatType) {
		case "group":
			normalizedChatType = "group"
		case "single", "":
			normalizedChatType = "dm"
		default:
			normalizedChatType = rawChatType
		}
		in := &channels.InboundMessage{
			ID:       msg.MsgID,
			SenderID: sender,
			ChatID:   chatID,
			ChatType: normalizedChatType,
			Content:  content,
			Time:     ts,
			Meta: map[string]interface{}{
				"msgtype":    "text",
				"chattype":   msg.ChatType,
				"aibot_mode": "wecom_ws",
			},
		}
		_ = r.PublishInbound(context.Background(), in)
	})

	r.mu.Lock()
	r.client = client
	r.mu.Unlock()

	client.Connect()

	select {
	case <-ctx.Done():
	case <-r.WaitForStop():
	}

	client.Disconnect()
	r.mu.Lock()
	r.client = nil
	r.authenticated = false
	r.mu.Unlock()
}

// Stop 断开 WebSocket 并停止基础运行时。
func (r *Runtime) Stop() error {
	r.mu.Lock()
	c := r.client
	r.mu.Unlock()
	if c != nil {
		c.Disconnect()
	}
	return r.BaseRuntimeImpl.Stop()
}

// Send 通过长连接主动发送 Markdown（或作为普通文本通道使用）。
func (r *Runtime) Send(msg *channels.RuntimeOutboundMessage) error {
	if msg == nil {
		fmt.Println("[wework-runtime] Send called with nil message")
		return nil
	}
	r.mu.Lock()
	cl := r.client
	r.mu.Unlock()
	if cl == nil || !cl.IsConnected() {
		fmt.Println("[wework-runtime] Send failed: websocket not connected")
		return fmt.Errorf("wework runtime: websocket not connected")
	}
	chatID := strings.TrimSpace(msg.ChatID)
	if chatID == "" {
		chatID = strings.TrimSpace(msg.MetadataString("chat_id"))
	}
	chatType := strings.TrimSpace(strings.ToLower(msg.MetadataString("chat_type")))
	if chatID == "" {
		fmt.Println("[wework-runtime] Send failed: chatID is required")
		return fmt.Errorf("wework runtime: chatID is required for Send")
	}
	if chatType == "group" {
		r.mu.Lock()
		if resolved := strings.TrimSpace(r.chatIDCanon[strings.ToLower(chatID)]); resolved != "" && resolved != chatID {
			fmt.Printf("[wework-runtime] Resolved canonical group chat_id: requested=%s resolved=%s\n", chatID, resolved)
			chatID = resolved
		}
		r.mu.Unlock()
	}

	content := strings.TrimSpace(msg.Content)
	fmt.Printf("[wework-runtime] Send started, chat_id=%s, content_length=%d, content_preview=%.50s\n",
		chatID, len(content), content)

	var err error
	sendMode := "send_markdown_default"
	var payload interface{}
	switch chatType {
	case "group":
		sendMode = "send_message_group"
		payload = map[string]interface{}{
			"msgtype":   "markdown",
			"chat_type": 2,
			"markdown": map[string]interface{}{
				"content": content,
			},
		}
		_, err = cl.SendMessage(chatID, payload)
	case "dm", "single":
		sendMode = "send_message_dm"
		payload = map[string]interface{}{
			"msgtype":   "markdown",
			"chat_type": 1,
			"markdown": map[string]interface{}{
				"content": content,
			},
		}
		_, err = cl.SendMessage(chatID, payload)
	default:
		payload = map[string]interface{}{
			"msgtype": "markdown",
			"markdown": map[string]interface{}{
				"content": content,
			},
		}
		_, err = cl.SendMarkdown(chatID, content)
	}
	fmt.Printf("[wework-runtime] Send payload, mode=%s, chat_id=%s, chat_type=%s, payload=%s\n",
		sendMode, chatID, chatType, marshalCompact(payload))
	if err != nil {
		fmt.Printf("[wework-runtime] Send failed: %v\n", err)
		return fmt.Errorf("wework runtime: send markdown: %w", err)
	}

	fmt.Printf("[wework-runtime] Message sent successfully, chat_id=%s\n", chatID)
	return nil
}

func marshalCompact(v interface{}) string {
	data, err := json.Marshal(v)
	if err != nil {
		return fmt.Sprintf("marshal_error:%v", err)
	}
	return string(data)
}

// SendStream 仅聚合最终输出片段后一次性发送（与 QQ 一致，避免将思考/中间态发到企微）。
func (r *Runtime) SendStream(chatID string, stream <-chan *channels.RuntimeStreamChunk) error {
	var buf strings.Builder
	for chunk := range stream {
		if chunk == nil {
			continue
		}
		if chunk.Error != "" {
			return fmt.Errorf("wework runtime stream error: %s", chunk.Error)
		}
		if !chunk.IsThinking && chunk.IsFinal {
			buf.WriteString(chunk.Content)
		}
		if chunk.IsComplete {
			break
		}
	}
	if buf.Len() == 0 {
		return nil
	}
	return r.Send(&channels.RuntimeOutboundMessage{
		ChatID:  chatID,
		Content: buf.String(),
	})
}

// RuntimeStatus 反映 WebSocket 认证与连接状态。
func (r *Runtime) RuntimeStatus() channels.RuntimeStatus {
	s := r.BaseRuntimeImpl.RuntimeStatus()
	r.mu.Lock()
	auth := r.authenticated
	cl := r.client
	r.mu.Unlock()
	connected := cl != nil && cl.IsConnected()
	s.Running = auth && connected
	if s.Extra == nil {
		s.Extra = map[string]interface{}{}
	}
	s.Extra["transport"] = "wecom_aibot_ws"
	s.Extra["botIdMasked"] = maskBotID(r.botID)
	if ts := atomic.LoadInt64(&r.lastInboundMs); ts > 0 {
		s.Extra["lastInboundAt"] = ts
	}
	return s
}

func maskBotID(id string) string {
	id = strings.TrimSpace(id)
	if len(id) <= 6 {
		if id == "" {
			return ""
		}
		return "****"
	}
	return id[:3] + "…" + id[len(id)-3:]
}
