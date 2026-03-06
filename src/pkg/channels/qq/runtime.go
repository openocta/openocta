package qq

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/logging"
	"github.com/tencent-connect/botgo"
	"github.com/tencent-connect/botgo/dto"
	botlog "github.com/tencent-connect/botgo/log"
	"github.com/tencent-connect/botgo/openapi"
	"github.com/tencent-connect/botgo/token"
	"golang.org/x/oauth2"
)

// filteredLogger 静默 botgo SDK 的日志输出，统一走 OpenClaw 的 logging。
type filteredLogger struct{}

func (f *filteredLogger) Debug(v ...interface{})                 {}
func (f *filteredLogger) Info(v ...interface{})                  {}
func (f *filteredLogger) Warn(v ...interface{})                  {}
func (f *filteredLogger) Error(v ...interface{})                 {}
func (f *filteredLogger) Debugf(format string, v ...interface{}) {}
func (f *filteredLogger) Infof(format string, v ...interface{})  {}
func (f *filteredLogger) Warnf(format string, v ...interface{})  {}
func (f *filteredLogger) Errorf(format string, v ...interface{}) {}
func (f *filteredLogger) Sync() error                            { return nil }

// WSPayload WebSocket 消息负载（与 QQ 官方协议结构对齐）。
type WSPayload struct {
	Op int             `json:"op"`
	D  json.RawMessage `json:"d"`
	S  uint32          `json:"s"`
	T  string          `json:"t"`
}

// HelloData Hello 事件数据。
type HelloData struct {
	HeartbeatInterval int `json:"heartbeat_interval"`
}

// ReadyData Ready 事件数据。
type ReadyData struct {
	SessionID string `json:"session_id"`
	Version   int    `json:"version"`
	User      struct {
		ID       string `json:"id"`
		Username string `json:"username"`
		Bot      bool   `json:"bot"`
	} `json:"user"`
}

// C2CMessageEventData C2C 消息事件数据。
type C2CMessageEventData struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
	Author    struct {
		UserOpenID string `json:"user_openid"`
	} `json:"author"`
}

// GroupATMessageEventData 群 @消息事件数据。
type GroupATMessageEventData struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
	Author    struct {
		MemberOpenID string `json:"member_openid"`
	} `json:"author"`
	GroupOpenID string `json:"group_openid"`
}

// ATMessageEventData 频道 @消息事件数据。
type ATMessageEventData struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	Timestamp string `json:"timestamp"`
	Author    struct {
		ID       string `json:"id"`
		Username string `json:"username"`
	} `json:"author"`
	ChannelID string `json:"channel_id"`
	GuildID   string `json:"guild_id"`
}

// Runtime 实现 QQ 官方开放平台 Bot 的 RuntimeChannel。
// 逻辑整体参考 goclaw/channels/qq.go，并适配新的 Runtime 抽象。
type Runtime struct {
	*channels.BaseRuntimeImpl

	appID       string
	appSecret   string
	api         openapi.OpenAPI
	tokenSource oauth2.TokenSource
	tokenCancel context.CancelFunc

	session *dto.WebsocketAP
	ctx     context.Context
	cancel  context.CancelFunc

	conn   *websocket.Conn
	connMu sync.Mutex

	mu           sync.RWMutex
	sessionID    string
	lastSeq      uint32
	heartbeatInt int
	accessToken  string
	msgSeqMap    map[string]int64

	logger *logging.GlobalLogger
}

// NewRuntime 创建 QQ Runtime 实例。
// appID / appSecret 为 QQ 官方 Bot 的凭证。
func NewRuntime(appID, appSecret string, cfg channels.BaseRuntimeConfig, sink channels.InboundSink) *Runtime {
	base := channels.NewBaseRuntimeImpl(channelID, cfg.AccountID, cfg, sink)
	return &Runtime{
		BaseRuntimeImpl: base,
		appID:           appID,
		appSecret:       appSecret,
		msgSeqMap:       make(map[string]int64),
		logger:          logging.Sub("qq-runtime"),
	}
}

// Start 启动 QQ 官方 Bot Runtime：初始化 token / OpenAPI，并建立 WebSocket 连接。
func (r *Runtime) Start(ctx context.Context) error {
	if err := r.BaseRuntimeImpl.Start(ctx); err != nil {
		return err
	}

	if r.appID == "" || r.appSecret == "" {
		return fmt.Errorf("qq runtime: appID and appSecret are required")
	}

	r.logger.Info("starting QQ Official Bot runtime, app_id=%s", r.appID)

	// 静默 botgo SDK 自身的日志，由 OpenClaw 统一输出。
	botlog.DefaultLogger = &filteredLogger{}

	// 创建 token source。
	credentials := &token.QQBotCredentials{
		AppID:     r.appID,
		AppSecret: r.appSecret,
	}
	r.tokenSource = token.NewQQBotTokenSource(credentials)

	// 启动 access token 自动刷新。
	tokenCtx, cancel := context.WithCancel(context.Background())
	r.tokenCancel = cancel
	if err := token.StartRefreshAccessToken(tokenCtx, r.tokenSource); err != nil {
		return fmt.Errorf("qq runtime: failed to start token refresh: %w", err)
	}

	// 初始化 OpenAPI。
	r.api = botgo.NewOpenAPI(r.appID, r.tokenSource).
		WithTimeout(10 * time.Second).
		SetDebug(false)

	// 启动 WebSocket 连接管理循环。
	r.ctx, r.cancel = context.WithCancel(ctx)
	go r.connectWebSocket(r.ctx)

	r.logger.Info("QQ Official Bot runtime started (WebSocket mode)")
	return nil
}

// Stop 停止 QQ Runtime，关闭 WebSocket 和 token 刷新。
func (r *Runtime) Stop() error {
	r.logger.Info("stopping QQ Official Bot runtime")

	if r.tokenCancel != nil {
		r.tokenCancel()
	}
	if r.cancel != nil {
		r.cancel()
	}
	r.closeConnection()

	return r.BaseRuntimeImpl.Stop()
}

// Send 发送一条出站消息到 QQ。
func (r *Runtime) Send(msg *channels.RuntimeOutboundMessage) error {
	if msg == nil {
		return nil
	}
	if r.api == nil {
		return fmt.Errorf("qq runtime: API not initialized")
	}

	chatID := msg.ChatID
	if chatID == "" {
		chatID = msg.MetadataString("chat_id")
	}
	if chatID == "" {
		return fmt.Errorf("qq runtime: chatID is required for Send")
	}

	ctx := context.Background()

	// 获取或递增 msg_seq（目前主要用于与 goclaw 行为保持一致）。
	msgSeq := r.getNextMsgSeq(chatID)

	toCreate := &dto.MessageToCreate{
		Content:   msg.Content,
		Timestamp: time.Now().UnixMilli(),
	}

	var err error
	chatType := ""
	if msg.Metadata != nil {
		if v, ok := msg.Metadata["chat_type"]; ok {
			if s, ok := v.(string); ok {
				chatType = s
			}
		}
	}

	switch chatType {
	case "group":
		err = r.sendGroupMessage(ctx, chatID, toCreate, msgSeq)
	case "channel":
		err = r.sendChannelMessage(ctx, chatID, toCreate, msgSeq)
	default:
		// 默认当作 C2C 私聊。
		err = r.sendC2CMessage(ctx, chatID, toCreate, msgSeq)
	}

	return err
}

// SendStream 默认实现：聚合完整内容后调用 Send。
func (r *Runtime) SendStream(chatID string, stream <-chan *channels.RuntimeStreamChunk) error {
	var buf strings.Builder
	for chunk := range stream {
		if chunk == nil {
			continue
		}
		if chunk.Error != "" {
			return fmt.Errorf("qq runtime stream error: %s", chunk.Error)
		}
		if !chunk.IsThinking {
			buf.WriteString(chunk.Content)
		}
		if chunk.IsComplete {
			break
		}
	}
	return r.Send(&channels.RuntimeOutboundMessage{
		ChatID:  chatID,
		Content: buf.String(),
	})
}

// connectWebSocket 负责生命周期内的自动重连。
func (r *Runtime) connectWebSocket(ctx context.Context) {
	reconnectDelay := 1 * time.Second
	maxDelay := 60 * time.Second

	for {
		select {
		case <-ctx.Done():
			r.logger.Info("QQ WebSocket connection stopped by context")
			return
		default:
			if err := r.doConnect(ctx); err != nil {
				r.logger.Error("QQ WebSocket connection failed, retry_after=%s, err=%v",
					reconnectDelay, err)
				r.BaseRuntimeImpl.MarkConnectionFailed(err)
				time.Sleep(reconnectDelay)
				reconnectDelay *= 2
				if reconnectDelay > maxDelay {
					reconnectDelay = maxDelay
				}
			} else {
				reconnectDelay = 1 * time.Second
				r.BaseRuntimeImpl.MarkConnectionRestored()
				r.waitForConnection(ctx)
			}
		}
	}
}

// doConnect 执行一次 WebSocket 连接流程（含 Hello / Identify / Resume）。
func (r *Runtime) doConnect(ctx context.Context) error {
	// 获取 access token。
	tk, err := r.tokenSource.Token()
	if err != nil {
		return fmt.Errorf("failed to get access token: %w", err)
	}
	r.accessToken = tk.AccessToken

	// 获取 WebSocket URL。
	wsResp, err := r.api.WS(ctx, map[string]string{}, "")
	if err != nil {
		return fmt.Errorf("failed to get websocket URL: %w", err)
	}

	r.mu.Lock()
	r.session = wsResp
	r.mu.Unlock()

	r.logger.Debug("QQ WebSocket URL obtained")

	// 连接 WebSocket。
	r.connMu.Lock()
	dialer := websocket.DefaultDialer
	conn, _, err := dialer.DialContext(ctx, wsResp.URL, nil)
	r.connMu.Unlock()
	if err != nil {
		return fmt.Errorf("failed to dial websocket: %w", err)
	}

	r.connMu.Lock()
	r.conn = conn
	r.connMu.Unlock()

	r.logger.Debug("QQ WebSocket connected")

	// 等待 Hello 并发送 Identify 或 Resume。
	return r.waitForHello(ctx)
}

// waitForHello 读取 Hello 消息并据此发送 Identify/Resume。
func (r *Runtime) waitForHello(ctx context.Context) error {
	r.connMu.Lock()
	conn := r.conn
	r.connMu.Unlock()
	if conn == nil {
		return fmt.Errorf("connection is nil")
	}

	_, message, err := conn.ReadMessage()
	if err != nil {
		return fmt.Errorf("failed to read Hello message: %w", err)
	}

	var payload WSPayload
	if err := json.Unmarshal(message, &payload); err != nil {
		return fmt.Errorf("failed to parse Hello message: %w", err)
	}

	if payload.Op != 10 {
		return fmt.Errorf("expected Hello (op=10), got op=%d", payload.Op)
	}

	var helloData HelloData
	if err := json.Unmarshal(payload.D, &helloData); err != nil {
		return fmt.Errorf("failed to parse Hello data: %w", err)
	}

	r.heartbeatInt = helloData.HeartbeatInterval
	r.logger.Debug("QQ Hello received, heartbeat_interval=%d", r.heartbeatInt)

	if r.sessionID != "" {
		return r.sendResume()
	}
	return r.sendIdentify()
}

// sendIdentify 发送 Identify。
func (r *Runtime) sendIdentify() error {
	intents := (1 << 25) | (1 << 12) | (1 << 30) | (1 << 0) | (1 << 1)

	payload := map[string]interface{}{
		"op": 2,
		"d": map[string]interface{}{
			"token":   fmt.Sprintf("QQBot %s", r.accessToken),
			"intents": intents,
			"shard":   []uint32{0, 1},
		},
	}

	r.connMu.Lock()
	defer r.connMu.Unlock()
	if r.conn == nil {
		return fmt.Errorf("connection is nil")
	}
	if err := r.conn.WriteJSON(payload); err != nil {
		return fmt.Errorf("failed to send identify: %w", err)
	}

	r.logger.Debug("QQ Identify sent, intents=%d", intents)
	return nil
}

// sendResume 发送 Resume。
func (r *Runtime) sendResume() error {
	payload := map[string]interface{}{
		"op": 6,
		"d": map[string]interface{}{
			"token":      fmt.Sprintf("QQBot %s", r.accessToken),
			"session_id": r.sessionID,
			"seq":        r.lastSeq,
		},
	}

	r.connMu.Lock()
	defer r.connMu.Unlock()
	if r.conn == nil {
		return fmt.Errorf("connection is nil")
	}
	if err := r.conn.WriteJSON(payload); err != nil {
		return fmt.Errorf("failed to send resume: %w", err)
	}

	r.logger.Debug("QQ Resume sent, session_id=%s, seq=%d", r.sessionID, r.lastSeq)
	return nil
}

// waitForConnection 在当前连接上循环收发心跳与消息，直到出错或上下文取消。
func (r *Runtime) waitForConnection(ctx context.Context) {
	r.connMu.Lock()
	conn := r.conn
	r.connMu.Unlock()
	if conn == nil {
		return
	}

	heartbeatTicker := time.NewTicker(time.Duration(r.heartbeatInt) * time.Millisecond)
	defer heartbeatTicker.Stop()

	messageChan := make(chan []byte, 100)
	errorChan := make(chan error, 1)

	// 消息读取 goroutine。
	go func() {
		for {
			r.connMu.Lock()
			currentConn := r.conn
			r.connMu.Unlock()
			if currentConn == nil {
				errorChan <- fmt.Errorf("connection closed")
				return
			}
			_, message, err := currentConn.ReadMessage()
			if err != nil {
				errorChan <- err
				return
			}
			messageChan <- message
		}
	}()

	for {
		select {
		case <-ctx.Done():
			r.logger.Debug("QQ WebSocket context cancelled")
			return
		case <-heartbeatTicker.C:
			r.sendHeartbeat()
		case message := <-messageChan:
			r.handleMessage(message)
		case err := <-errorChan:
			r.logger.Warn("QQ WebSocket read error: %v", err)
			r.BaseRuntimeImpl.MarkConnectionFailed(err)
			return
		}
	}
}

// sendMessage 发送一条 WebSocket 消息。
func (r *Runtime) sendMessage(op int, d interface{}) error {
	r.connMu.Lock()
	defer r.connMu.Unlock()
	if r.conn == nil {
		return fmt.Errorf("connection is nil")
	}

	payload := map[string]interface{}{
		"op": op,
		"d":  d,
	}
	return r.conn.WriteJSON(payload)
}

// sendHeartbeat 发送心跳。
func (r *Runtime) sendHeartbeat() {
	if err := r.sendMessage(1, r.lastSeq); err != nil {
		r.logger.Warn("failed to send heartbeat: %v", err)
	}
}

// handleMessage 处理原始 WebSocket 消息。
func (r *Runtime) handleMessage(message []byte) {
	var payload WSPayload
	if err := json.Unmarshal(message, &payload); err != nil {
		r.logger.Warn("failed to parse WebSocket message: %v", err)
		return
	}

	if payload.S > 0 {
		r.lastSeq = payload.S
	}

	switch payload.Op {
	case 0:
		r.handleDispatch(payload.T, payload.D)
	case 1:
		r.logger.Debug("QQ Heartbeat ACK")
	case 7:
		r.logger.Debug("QQ Reconnect requested")
	default:
		r.logger.Debug("QQ WebSocket message, op=%d, t=%s", payload.Op, payload.T)
	}
}

// handleDispatch 分发各种事件类型。
func (r *Runtime) handleDispatch(eventType string, data json.RawMessage) {
	switch eventType {
	case "READY":
		r.handleReady(data)
	case "RESUMED":
		r.logger.Debug("QQ Session resumed")
	case "C2C_MESSAGE_CREATE":
		r.handleC2CMessage(data)
	case "GROUP_AT_MESSAGE_CREATE":
		r.handleGroupATMessage(data)
	case "AT_MESSAGE_CREATE":
		r.handleChannelATMessage(data)
	case "DIRECT_MESSAGE_CREATE":
		// 频道私信：暂不处理。
	default:
		r.logger.Debug("QQ Event, type=%s", eventType)
	}
}

// handleReady 处理 READY 事件。
func (r *Runtime) handleReady(data json.RawMessage) {
	var readyData ReadyData
	if err := json.Unmarshal(data, &readyData); err != nil {
		r.logger.Warn("failed to parse Ready data: %v", err)
		return
	}
	r.sessionID = readyData.SessionID
	r.logger.Debug("QQ Ready, session_id=%s", r.sessionID)
}

// handleC2CMessage 处理 C2C 消息。
func (r *Runtime) handleC2CMessage(data json.RawMessage) {
	var event C2CMessageEventData
	if err := json.Unmarshal(data, &event); err != nil {
		r.logger.Warn("failed to parse C2C message: %v", err)
		return
	}

	senderID := event.Author.UserOpenID
	if senderID != "" && !r.IsAllowed(senderID) {
		return
	}

	msg := &channels.InboundMessage{
		ID:       event.ID,
		SenderID: senderID,
		ChatID:   senderID,
		ChatType: "c2c",
		Content:  event.Content,
		Time:     time.Now(),
		Meta: map[string]interface{}{
			"chat_type": "c2c",
			"msg_id":    event.ID,
		},
	}

	r.logger.Debug("QQ C2C message, sender=%s, content=%s", senderID, event.Content)
	_ = r.PublishInbound(context.Background(), msg)
}

// handleGroupATMessage 处理群 @消息。
func (r *Runtime) handleGroupATMessage(data json.RawMessage) {
	var event GroupATMessageEventData
	if err := json.Unmarshal(data, &event); err != nil {
		r.logger.Warn("failed to parse Group @message: %v", err)
		return
	}

	senderID := event.Author.MemberOpenID
	if senderID != "" && !r.IsAllowed(senderID) && !r.IsAllowed(event.GroupOpenID) {
		return
	}

	msg := &channels.InboundMessage{
		ID:       event.ID,
		SenderID: senderID,
		ChatID:   event.GroupOpenID,
		ChatType: "group",
		Content:  event.Content,
		Time:     time.Now(),
		Meta: map[string]interface{}{
			"chat_type":     "group",
			"group_id":      event.GroupOpenID,
			"member_openid": senderID,
			"msg_id":        event.ID,
		},
	}

	r.logger.Debug("QQ Group @message, group=%s, sender=%s, content=%s",
		event.GroupOpenID, senderID, event.Content)
	_ = r.PublishInbound(context.Background(), msg)
}

// handleChannelATMessage 处理频道 @消息。
func (r *Runtime) handleChannelATMessage(data json.RawMessage) {
	var event ATMessageEventData
	if err := json.Unmarshal(data, &event); err != nil {
		r.logger.Warn("failed to parse Channel @message: %v", err)
		return
	}

	senderID := event.Author.ID
	if senderID != "" && !r.IsAllowed(senderID) && !r.IsAllowed(event.ChannelID) {
		return
	}

	msg := &channels.InboundMessage{
		ID:       event.ID,
		SenderID: senderID,
		ChatID:   event.ChannelID,
		ChatType: "channel",
		Content:  event.Content,
		Time:     time.Now(),
		Meta: map[string]interface{}{
			"chat_type":  "channel",
			"channel_id": event.ChannelID,
			"group_id":   event.GuildID,
			"msg_id":     event.ID,
		},
	}

	r.logger.Debug("QQ Channel @message, channel=%s, sender=%s, content=%s",
		event.ChannelID, senderID, event.Content)
	_ = r.PublishInbound(context.Background(), msg)
}

// sendC2CMessage 发送 C2C 消息。
func (r *Runtime) sendC2CMessage(ctx context.Context, openID string, msg *dto.MessageToCreate, msgSeq int64) error {
	_ = msgSeq // 目前 QQ 官方接口内部自行处理去重，此处保留参数以兼容旧逻辑。
	_, err := r.api.PostC2CMessage(ctx, openID, msg)
	return err
}

// sendGroupMessage 发送群消息。
func (r *Runtime) sendGroupMessage(ctx context.Context, groupID string, msg *dto.MessageToCreate, msgSeq int64) error {
	_ = msgSeq
	_, err := r.api.PostGroupMessage(ctx, groupID, msg)
	return err
}

// sendChannelMessage 发送频道消息。
func (r *Runtime) sendChannelMessage(ctx context.Context, channelID string, msg *dto.MessageToCreate, msgSeq int64) error {
	_ = msgSeq
	_, err := r.api.PostMessage(ctx, channelID, msg)
	return err
}

// getNextMsgSeq 获取下一个消息序列号。
func (r *Runtime) getNextMsgSeq(chatID string) int64 {
	r.mu.Lock()
	defer r.mu.Unlock()
	seq := r.msgSeqMap[chatID] + 1
	r.msgSeqMap[chatID] = seq
	return seq
}

// closeConnection 关闭当前 WebSocket 连接。
func (r *Runtime) closeConnection() {
	r.connMu.Lock()
	conn := r.conn
	r.conn = nil
	r.connMu.Unlock()
	if conn != nil {
		_ = conn.Close()
	}
}
