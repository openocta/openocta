package feishu

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	lark "github.com/larksuite/oapi-sdk-go/v3"
	larkcore "github.com/larksuite/oapi-sdk-go/v3/core"
	"github.com/larksuite/oapi-sdk-go/v3/event/dispatcher"
	larkim "github.com/larksuite/oapi-sdk-go/v3/service/im/v1"
	larkws "github.com/larksuite/oapi-sdk-go/v3/ws"
	"github.com/openocta/openocta/pkg/channels"
)

// runtimeLoggerKey is used to prefix log messages; kept minimal to avoid pulling logging deps.
const runtimeLoggerKey = "[feishu-runtime]"

// Runtime 实现 Feishu 的 RuntimeChannel，使用 WebSocket 长连接收消息。
type Runtime struct {
	*channels.BaseRuntimeImpl

	appID             string
	appSecret         string
	domain            string
	encryptKey        string
	verificationToken string

	wsClient        *larkws.Client
	eventDispatcher *dispatcher.EventDispatcher
	httpClient      *lark.Client

	typingReactions   map[string]string
	typingReactionsMu sync.RWMutex

	botOpenId string
}

// NewRuntime 创建 Feishu Runtime 实例。
func NewRuntime(appID, appSecret, domain, encryptKey, verificationToken string, cfg channels.BaseRuntimeConfig, sink channels.InboundSink) *Runtime {
	base := channels.NewBaseRuntimeImpl("feishu", cfg.AccountID, cfg, sink)

	client := lark.NewClient(
		appID,
		appSecret,
		lark.WithAppType(larkcore.AppTypeSelfBuilt),
		lark.WithOpenBaseUrl(resolveDomain(domain)),
	)

	return &Runtime{
		BaseRuntimeImpl:   base,
		appID:             appID,
		appSecret:         appSecret,
		domain:            domain,
		encryptKey:        encryptKey,
		verificationToken: verificationToken,
		httpClient:        client,
		typingReactions:   make(map[string]string),
	}
}

// Start 启动 Feishu WebSocket 连接并注册事件处理。
func (r *Runtime) Start(ctx context.Context) error {
	if err := r.BaseRuntimeImpl.Start(ctx); err != nil {
		return err
	}

	// 获取机器人的 open_id（用于 @ 检查）
	if err := r.fetchBotOpenId(); err != nil {
		fmt.Println(runtimeLoggerKey, "failed to fetch bot open_id:", err)
		r.BaseRuntimeImpl.MarkConnectionFailed(err)
		return err
	}

	// 创建事件分发器
	r.eventDispatcher = dispatcher.NewEventDispatcher(
		r.verificationToken,
		r.encryptKey,
	)

	// 注册事件处理器
	r.registerEventHandlers()

	// 创建 WebSocket 客户端
	r.wsClient = larkws.NewClient(
		r.appID,
		r.appSecret,
		larkws.WithEventHandler(r.eventDispatcher),
		larkws.WithDomain(resolveDomain(r.domain)),
		larkws.WithLogLevel(larkcore.LogLevelInfo),
	)

	// 启动 WebSocket 连接
	go r.startWebSocket(ctx)

	return nil
}

// Stop 停止运行时。
func (r *Runtime) Stop() error {
	return r.BaseRuntimeImpl.Stop()
}

// RuntimeStatus 返回 Feishu 运行时的状态，包含 appId、domain、botOpenId 等平台信息。
func (r *Runtime) RuntimeStatus() channels.RuntimeStatus {
	s := r.BaseRuntimeImpl.RuntimeStatus()
	if s.Extra == nil {
		s.Extra = make(map[string]interface{})
	}
	if r.appID != "" {
		s.Extra["appId"] = r.appID
	}
	if r.domain != "" {
		s.Extra["domain"] = r.domain
	}
	if r.botOpenId != "" {
		s.Extra["botOpenId"] = r.botOpenId
	}
	// 构建 probe 结构供 UI 展示
	if r.appID != "" || r.botOpenId != "" {
		probe := map[string]interface{}{"ok": r.BaseRuntimeImpl.IsRunning()}
		if r.appID != "" {
			probe["appId"] = r.appID
		}
		if r.botOpenId != "" {
			probe["botOpenId"] = r.botOpenId
		}
		s.Extra["probe"] = probe
	}
	// lastProbeAt：运行时无单独 probe 调用时，用 lastStartAt 表示最近一次有效状态
	if s.LastStartAt != nil {
		s.Extra["lastProbeAt"] = *s.LastStartAt
	}
	return s
}

// Send 发送一条消息到 Feishu。
// 当前实现仅支持文本与图片的基础发送，可按需扩展。
func (r *Runtime) Send(msg *channels.RuntimeOutboundMessage) error {
	if msg == nil {
		return nil
	}

	chatID := msg.ChatID
	if chatID == "" {
		chatID = msg.MetadataString("chatId")
	}
	if chatID == "" {
		chatID = msg.MetadataString("receiveId")
	}
	if chatID == "" {
		return fmt.Errorf("feishu runtime: chatId is required for Send")
	}

	// 判断接收者类型
	receiveIDType := larkim.ReceiveIdTypeChatId
	if len(chatID) > 3 && strings.HasPrefix(chatID, "ou_") {
		receiveIDType = larkim.ReceiveIdTypeOpenId
	}

	header := msg.MetadataString("header")
	rootMessageID := msg.ReplyToID

	var err error

	// 优先发送图片媒体
	if len(msg.Media) > 0 {
		for _, m := range msg.Media {
			if m.Type == "image" {
				if err = r.sendImageMessage(chatID, m, receiveIDType, rootMessageID); err != nil {
					fmt.Println(runtimeLoggerKey, "failed to send image message:", err)
				}
			}
		}
	}

	// 文本内容通过交互式卡片发送（plain_text 避免 markdown table 限制）
	content := strings.TrimSpace(msg.Content)
	if content != "" {
		if err = r.sendCardMessage(chatID, content, receiveIDType, header, rootMessageID); err != nil {
			fmt.Println(runtimeLoggerKey, "failed to send card message:", err)
		}
	}

	return err
}

// SendStream 默认实现：收集完整内容后调用 Send。
func (r *Runtime) SendStream(chatID string, stream <-chan *channels.RuntimeStreamChunk) error {
	var buf strings.Builder
	for chunk := range stream {
		if chunk == nil {
			continue
		}
		if chunk.Error != "" {
			return fmt.Errorf("stream error: %s", chunk.Error)
		}
		if !chunk.IsThinking {
			buf.WriteString(chunk.Content)
		}
		if chunk.IsComplete {
			break
		}
	}
	msg := &channels.RuntimeOutboundMessage{
		ChatID:  chatID,
		Content: buf.String(),
	}
	return r.Send(msg)
}

// fetchBotOpenId 获取机器人的 open_id。
func (r *Runtime) fetchBotOpenId() error {
	ctx := context.Background()

	tokenReq := &larkcore.SelfBuiltAppAccessTokenReq{
		AppID:     r.appID,
		AppSecret: r.appSecret,
	}
	tokenResp, err := r.httpClient.GetAppAccessTokenBySelfBuiltApp(ctx, tokenReq)
	if err != nil {
		return fmt.Errorf("failed to get app access token: %w", err)
	}
	if !tokenResp.Success() || tokenResp.AppAccessToken == "" {
		return fmt.Errorf("app access token error: code=%d msg=%s", tokenResp.Code, tokenResp.Msg)
	}

	apiResp, err := r.httpClient.Get(ctx, "/open-apis/bot/v3/info", nil, larkcore.AccessTokenTypeApp)
	if err != nil {
		return fmt.Errorf("failed to fetch bot info: %w", err)
	}

	var result struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
		Bot  struct {
			OpenId  string `json:"open_id"`
			BotName string `json:"bot_name"`
		} `json:"bot"`
	}
	if err := json.Unmarshal(apiResp.RawBody, &result); err != nil {
		return fmt.Errorf("failed to decode bot info response: %w", err)
	}
	if result.Code != 0 {
		return fmt.Errorf("bot info API error: code=%d msg=%s", result.Code, result.Msg)
	}

	r.botOpenId = result.Bot.OpenId
	return nil
}

func (r *Runtime) registerEventHandlers() {
	r.eventDispatcher.OnP2MessageReceiveV1(func(ctx context.Context, event *larkim.P2MessageReceiveV1) error {
		r.handleMessageReceived(ctx, event)
		return nil
	})

	// 其余事件目前忽略，仅保留最重要的消息接收。
}

func (r *Runtime) startWebSocket(ctx context.Context) {
	if err := r.wsClient.Start(ctx); err != nil {
		fmt.Println(runtimeLoggerKey, "WebSocket error:", err)
		r.BaseRuntimeImpl.MarkConnectionFailed(err)
	}
}

func (r *Runtime) handleMessageReceived(ctx context.Context, event *larkim.P2MessageReceiveV1) {
	if event == nil || event.Event == nil || event.Event.Sender == nil || event.Event.Message == nil {
		return
	}

	senderID := ""
	if event.Event.Sender.SenderId != nil {
		if event.Event.Sender.SenderId.OpenId != nil {
			senderID = *event.Event.Sender.SenderId.OpenId
		} else if event.Event.Sender.SenderId.UserId != nil {
			senderID = *event.Event.Sender.SenderId.UserId
		}
	}

	chatID := ""
	if event.Event.Message.ChatId != nil {
		chatID = *event.Event.Message.ChatId
	}

	messageID := ""
	if event.Event.Message.MessageId != nil {
		messageID = *event.Event.Message.MessageId
	}

	chatType := ""
	if event.Event.Message.ChatType != nil {
		chatType = *event.Event.Message.ChatType
	}

	// 权限检查
	if senderID != "" && !r.IsAllowed(senderID) {
		return
	}

	// 群聊消息时，默认需要 @bot 才处理
	if chatType == "group" && r.botOpenId != "" {
		if !r.checkBotMentioned(event.Event.Message) {
			return
		}
	}

	content, media := r.extractMessageContentAndMedia(event.Event.Message)
	if content == "" && len(media) == 0 {
		return
	}

	// 1) 表情回复用户消息为：敲键盘（在调用 Agent 之前）
	if messageID != "" {
		_ = r.addReactionToMessage(messageID, "Typing")
	}

	var ts time.Time
	if event.Event.Message.CreateTime != nil {
		if ms, err := strconv.ParseInt(*event.Event.Message.CreateTime, 10, 64); err == nil {
			ts = time.UnixMilli(ms)
		}
	}
	if ts.IsZero() {
		ts = time.Now()
	}

	in := &channels.InboundMessage{
		ID:       messageID,
		SenderID: senderID,
		ChatID:   chatID,
		ChatType: chatType,
		Content:  content,
		Media:    media,
		Time:     ts,
		Meta:     map[string]interface{}{},
	}

	_ = r.PublishInbound(ctx, in)
}

func (r *Runtime) extractMessageContentAndMedia(msg *larkim.EventMessage) (string, []channels.RuntimeMedia) {
	if msg == nil || msg.Content == nil {
		return "", nil
	}
	contentRaw := *msg.Content

	msgType := "text"
	if msg.MessageType != nil {
		msgType = *msg.MessageType
	}

	switch msgType {
	case "text":
		var content map[string]string
		if err := json.Unmarshal([]byte(contentRaw), &content); err != nil {
			return "", nil
		}
		return content["text"], nil

	case "image":
		var content map[string]string
		if err := json.Unmarshal([]byte(contentRaw), &content); err != nil {
			return "", nil
		}
		imageKey := content["image_key"]
		if imageKey == "" {
			return "", nil
		}
		media := []channels.RuntimeMedia{
			{
				Type: "image",
				URL:  "feishu:" + imageKey,
			},
		}
		return "[图片]", media

	case "post":
		var content map[string]interface{}
		if err := json.Unmarshal([]byte(contentRaw), &content); err != nil {
			return "", nil
		}
		post, ok := content["post"].(map[string]interface{})
		if !ok {
			return "", nil
		}
		zhCn, ok := post["zh_cn"].([]interface{})
		if !ok || len(zhCn) == 0 {
			return "", nil
		}
		var result strings.Builder
		var media []channels.RuntimeMedia
		for _, elem := range zhCn {
			elemMap, ok := elem.(map[string]interface{})
			if !ok {
				continue
			}
			tag, _ := elemMap["tag"].(string)
			switch tag {
			case "text":
				if text, ok := elemMap["text"].(string); ok {
					result.WriteString(text)
				}
			case "img":
				if imageKey, ok := elemMap["image_key"].(string); ok && imageKey != "" {
					media = append(media, channels.RuntimeMedia{
						Type: "image",
						URL:  "feishu:" + imageKey,
					})
					result.WriteString("[图片]")
				}
			}
		}
		return result.String(), media
	default:
		return "", nil
	}
}

func (r *Runtime) checkBotMentioned(msg *larkim.EventMessage) bool {
	if msg == nil {
		return false
	}
	for _, mention := range msg.Mentions {
		if mention.Id != nil && mention.Id.OpenId != nil {
			if *mention.Id.OpenId == r.botOpenId {
				return true
			}
		}
	}
	return false
}

// addReactionToMessage 在用户消息上添加表情回复（如敲键盘），表示正在处理。
func (r *Runtime) addReactionToMessage(messageID, emojiType string) error {
	if messageID == "" || emojiType == "" {
		return nil
	}
	emoji := emojiType
	req := larkim.NewCreateMessageReactionReqBuilder().
		MessageId(messageID).
		Body(larkim.NewCreateMessageReactionReqBodyBuilder().
			ReactionType(&larkim.Emoji{EmojiType: &emoji}).
			Build()).
		Build()
	resp, err := r.httpClient.Im.MessageReaction.Create(context.Background(), req)
	if err != nil {
		return err
	}
	if !resp.Success() {
		return fmt.Errorf("feishu add reaction: %d %s", resp.Code, resp.Msg)
	}
	return nil
}

// truncateForHeader 截断字符串作为 header，过长时用 "......" 代替。
func truncateForHeader(s string, maxLen int) string {
	s = strings.TrimSpace(s)
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "......"
}

// sendCardMessage 发送卡片消息。使用 plain_text 避免 markdown table 限制；可选 header。
func (r *Runtime) sendCardMessage(chatID, content, receiveIDType, header, rootMessageID string) error {
	// 使用 plain_text 组件，content 可能为 markdown 格式但会按纯文本展示
	plainContent := jsonEscape(content)
	var cardContent string
	if header != "" {
		headerTitle := jsonEscape(truncateForHeader(header, 50))
		cardContent = fmt.Sprintf(`{
			"schema": "2.0",
			"config": {"wide_screen_mode": true},
			"header": {"title": {"tag":"plain_text","content":%s,"lines":1}},
			"body": {"elements": [{"tag":"div","text":{"tag":"plain_text","content":%s}}]}
		}`, headerTitle, plainContent)
	} else {
		cardContent = fmt.Sprintf(`{
			"schema": "2.0",
			"config": {"wide_screen_mode": true},
			"body": {"elements": [{"tag":"div","text":{"tag":"plain_text","content":%s}}]}
		}`, plainContent)
	}

	if rootMessageID != "" {
		// 使用回复 API，将消息回复到用户消息下
		req := larkim.NewReplyMessageReqBuilder().
			MessageId(rootMessageID).
			Body(larkim.NewReplyMessageReqBodyBuilder().
				Content(cardContent).
				MsgType(larkim.MsgTypeInteractive).
				Build()).
			Build()
		resp, err := r.httpClient.Im.Message.Reply(context.Background(), req)
		if err != nil {
			return err
		}
		if !resp.Success() {
			return fmt.Errorf("feishu reply api error: %d %s", resp.Code, resp.Msg)
		}
		return nil
	}

	req := larkim.NewCreateMessageReqBuilder().
		ReceiveIdType(receiveIDType).
		Body(larkim.NewCreateMessageReqBodyBuilder().
			ReceiveId(chatID).
			MsgType(larkim.MsgTypeInteractive).
			Content(cardContent).
			Build(),
		).
		Build()
	resp, err := r.httpClient.Im.Message.Create(context.Background(), req)
	if err != nil {
		return err
	}
	if !resp.Success() {
		return fmt.Errorf("feishu api error: %d %s", resp.Code, resp.Msg)
	}
	return nil
}

// sendImageMessage 上传并发送图片消息。rootMessageID 非空时使用回复 API。
func (r *Runtime) sendImageMessage(chatID string, media channels.RuntimeMedia, receiveIDType, rootMessageID string) error {
	var imageReader io.Reader

	if media.URL != "" {
		var imageBody io.ReadCloser
		var err error
		if strings.HasPrefix(media.URL, "feishu:") {
			imageKey := strings.TrimPrefix(media.URL, "feishu:")
			imageBody, err = r.downloadFeishuImage(imageKey)
			if err != nil {
				return fmt.Errorf("failed to download feishu image: %w", err)
			}
		} else {
			req, err := http.NewRequest("GET", media.URL, nil)
			if err != nil {
				return fmt.Errorf("failed to create download request: %w", err)
			}
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				return fmt.Errorf("failed to download image from URL: %w", err)
			}
			if resp.StatusCode != http.StatusOK {
				resp.Body.Close()
				return fmt.Errorf("failed to download image, status: %d", resp.StatusCode)
			}
			imageBody = resp.Body
		}
		defer imageBody.Close()
		imageReader = imageBody
	} else if media.Base64 != "" {
		data, err := base64.StdEncoding.DecodeString(media.Base64)
		if err != nil {
			return fmt.Errorf("failed to decode base64 image: %w", err)
		}
		imageReader = bytes.NewReader(data)
	} else {
		return fmt.Errorf("no valid image data (URL or Base64) provided")
	}

	imageKey, err := r.uploadImage(imageReader)
	if err != nil {
		return fmt.Errorf("failed to upload image: %w", err)
	}

	content := fmt.Sprintf(`{"image_key":"%s"}`, imageKey)

	if rootMessageID != "" {
		req := larkim.NewReplyMessageReqBuilder().
			MessageId(rootMessageID).
			Body(larkim.NewReplyMessageReqBodyBuilder().
				Content(content).
				MsgType(larkim.MsgTypeImage).
				Build()).
			Build()
		resp, err := r.httpClient.Im.Message.Reply(context.Background(), req)
		if err != nil {
			return err
		}
		if !resp.Success() {
			return fmt.Errorf("feishu reply api error: %d %s", resp.Code, resp.Msg)
		}
		return nil
	}

	imageMsgReq := larkim.NewCreateMessageReqBuilder().
		ReceiveIdType(receiveIDType).
		Body(
			larkim.NewCreateMessageReqBodyBuilder().
				ReceiveId(chatID).
				MsgType(larkim.MsgTypeImage).
				Content(content).
				Build(),
		).
		Build()

	resp, err := r.httpClient.Im.Message.Create(context.Background(), imageMsgReq)
	if err != nil {
		return err
	}
	if !resp.Success() {
		return fmt.Errorf("feishu api error: %d %s", resp.Code, resp.Msg)
	}
	return nil
}

func (r *Runtime) downloadFeishuImage(imageKey string) (io.ReadCloser, error) {
	req := larkim.NewGetImageReqBuilder().
		ImageKey(imageKey).
		Build()

	resp, err := r.httpClient.Im.Image.Get(context.Background(), req)
	if err != nil {
		return nil, fmt.Errorf("failed to get image: %w", err)
	}
	if !resp.Success() || resp.File == nil {
		return nil, fmt.Errorf("get image failed: code=%d msg=%s", resp.Code, resp.Msg)
	}
	data, err := io.ReadAll(resp.File)
	if err != nil {
		return nil, fmt.Errorf("failed to read image data: %w", err)
	}
	return io.NopCloser(bytes.NewReader(data)), nil
}

func (r *Runtime) uploadImage(imageData io.Reader) (string, error) {
	imageType := "message"
	req := larkim.NewCreateImageReqBuilder().
		Body(
			larkim.NewCreateImageReqBodyBuilder().
				ImageType(imageType).
				Image(imageData).
				Build(),
		).
		Build()

	resp, err := r.httpClient.Im.Image.Create(context.Background(), req)
	if err != nil {
		return "", fmt.Errorf("failed to upload image: %w", err)
	}
	if !resp.Success() || resp.Data == nil {
		return "", fmt.Errorf("upload image failed: code=%d msg=%s", resp.Code, resp.Msg)
	}
	if resp.Data.ImageKey == nil {
		return "", fmt.Errorf("upload image response missing image_key")
	}
	return *resp.Data.ImageKey, nil
}
