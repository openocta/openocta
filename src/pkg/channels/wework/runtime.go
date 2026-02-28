package wework

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/logging"
)

// runtimeLoggerKey is used to prefix log messages; kept minimal to avoid pulling logging deps.
const runtimeLoggerKey = "[wework-runtime]"

// Runtime 实现企业微信应用消息通道的 RuntimeChannel。
// 逻辑参考 goclaw/channels/wework.go，并适配新的 Runtime 抽象。
type Runtime struct {
	*channels.BaseRuntimeImpl

	corpID         string
	agentID        string
	secret         string
	token          string
	encodingAESKey string
	webhookPort    int
	recvMsg        bool // 是否使用加密模式

	accessToken    string
	tokenExpiresAt int64
	mu             sync.Mutex
	httpClient     *http.Client

	server *http.Server
	logger *logging.GlobalLogger
}

// NewRuntime 创建 WeWork Runtime 实例。
// 所有凭证均通过参数显式传入，便于从配置文件加载，而不是依赖环境变量。
func NewRuntime(
	corpID, agentID, secret, token, encodingAESKey string,
	webhookPort int,
	cfg channels.BaseRuntimeConfig,
	sink channels.InboundSink,
) *Runtime {
	base := channels.NewBaseRuntimeImpl(channelID, cfg.AccountID, cfg, sink)

	if webhookPort <= 0 || webhookPort >= 65535 {
		webhookPort = 8766
	}

	return &Runtime{
		BaseRuntimeImpl: base,
		corpID:          strings.TrimSpace(corpID),
		agentID:         strings.TrimSpace(agentID),
		secret:          strings.TrimSpace(secret),
		token:           strings.TrimSpace(token),
		encodingAESKey:  strings.TrimSpace(encodingAESKey),
		webhookPort:     webhookPort,
		recvMsg:         strings.TrimSpace(encodingAESKey) != "",
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logging.Sub("wework-runtime"),
	}
}

// Start 启动企业微信 Runtime：启动基础运行时并开启 Webhook HTTP 服务。
func (r *Runtime) Start(ctx context.Context) error {
	if err := r.BaseRuntimeImpl.Start(ctx); err != nil {
		return err
	}

	// 若未配置 Token 或 CorpID，则仅启动基础逻辑，不开启 Webhook。
	if r.token == "" || r.corpID == "" {
		if r.logger != nil {
			r.logger.Warn("%s missing WEWORK_TOKEN or WEWORK_CORP_ID, webhook server will not start", runtimeLoggerKey)
		}
		return nil
	}

	r.startWebhookServer(ctx)
	return nil
}

// Stop 停止企业微信 Runtime。
func (r *Runtime) Stop() error {
	if r.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_ = r.server.Shutdown(ctx)
		cancel()
	}
	return r.BaseRuntimeImpl.Stop()
}

// Send 发送一条文本消息到企业微信。
func (r *Runtime) Send(msg *channels.RuntimeOutboundMessage) error {
	if msg == nil {
		return nil
	}
	if r.corpID == "" || r.secret == "" || r.agentID == "" {
		return fmt.Errorf("wework runtime: corpID/secret/agentID not configured")
	}

	chatID := strings.TrimSpace(msg.ChatID)
	if chatID == "" {
		chatID = strings.TrimSpace(msg.MetadataString("chat_id"))
	}
	if chatID == "" {
		return fmt.Errorf("wework runtime: chatID is required for Send")
	}

	token, err := r.getAccessToken()
	if err != nil {
		return err
	}

	url := fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=%s", token)

	payload := map[string]interface{}{
		"touser":  chatID,
		"msgtype": "text",
		"agentid": r.agentID,
		"text": map[string]string{
			"content": msg.Content,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("wework runtime: json marshal failed: %w", err)
	}

	resp, err := r.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("wework runtime: http post failed: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("wework runtime: json decode failed: %w", err)
	}

	if result.ErrCode != 0 {
		return fmt.Errorf("wework runtime: failed to send message: %s", result.ErrMsg)
	}

	if r.logger != nil {
		r.logger.Info("%s message sent, chat_id=%s, len=%d", runtimeLoggerKey, chatID, len(msg.Content))
	}

	return nil
}

// SendStream 默认实现：收集完整内容后调用 Send。
func (r *Runtime) SendStream(chatID string, stream <-chan *channels.RuntimeStreamChunk) error {
	var buf strings.Builder
	for chunk := range stream {
		if chunk == nil {
			continue
		}
		if chunk.Error != "" {
			return fmt.Errorf("wework runtime stream error: %s", chunk.Error)
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

// startWebhookServer 启动企业微信回调 HTTP 服务。
func (r *Runtime) startWebhookServer(ctx context.Context) {
	mux := http.NewServeMux()
	mux.HandleFunc("/wework/event", r.handleWebhook)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", r.webhookPort),
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}
	r.server = server

	go func() {
		if r.logger != nil {
			r.logger.Info("%s webhook server started, addr=%s", runtimeLoggerKey, server.Addr)
		}
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			if r.logger != nil {
				r.logger.Error("%s webhook server error: %v", runtimeLoggerKey, err)
			}
		}
	}()

	go func() {
		<-ctx.Done()
		_ = server.Shutdown(context.Background())
	}()
}

// handleWebhook 处理企业微信回调请求（验证 + 加解密 + 消息转发）。
func (r *Runtime) handleWebhook(w http.ResponseWriter, req *http.Request) {
	query := req.URL.Query()
	signature := query.Get("msg_signature")
	timestamp := query.Get("timestamp")
	nonce := query.Get("nonce")
	echostr := query.Get("echostr")

	if req.Method == http.MethodGet {
		// 验证回调 URL
		if !r.verifySignature(r.token, timestamp, nonce, echostr, signature) {
			if r.logger != nil {
				expected := r.computeSignature(r.token, timestamp, nonce, echostr)
				r.logger.Warn("%s invalid signature for GET, expected=%s, got=%s", runtimeLoggerKey, expected, signature)
			}
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// 如果有加密密钥，需要解密 echostr
		if r.recvMsg && r.encodingAESKey != "" {
			decrypted, err := r.decryptMsg(echostr)
			if err != nil {
				if r.logger != nil {
					r.logger.Error("%s failed to decrypt echostr: %v", runtimeLoggerKey, err)
				}
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			_, _ = w.Write(decrypted)
		} else {
			_, _ = w.Write([]byte(echostr))
		}
		return
	}

	if req.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// 处理 POST 请求
	body, err := io.ReadAll(req.Body)
	if err != nil {
		if r.logger != nil {
			r.logger.Error("%s failed to read body: %v", runtimeLoggerKey, err)
		}
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// 解析 XML 提取 Encrypt 字段用于签名验证
	var encryptedMsg struct {
		XMLName    xml.Name `xml:"xml"`
		ToUserName string   `xml:"ToUserName"`
		Encrypt    string   `xml:"Encrypt"`
		AgentID    string   `xml:"AgentID"`
	}

	// 尝试解析为加密格式
	if err := xml.Unmarshal(body, &encryptedMsg); err == nil && encryptedMsg.Encrypt != "" {
		if !r.verifySignature(r.token, timestamp, nonce, encryptedMsg.Encrypt, signature) {
			if r.logger != nil {
				expected := r.computeSignature(r.token, timestamp, nonce, encryptedMsg.Encrypt)
				r.logger.Warn("%s invalid signature for POST, expected=%s, got=%s", runtimeLoggerKey, expected, signature)
			}
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// 解密 body
		decryptedBody, err := r.decryptMsg(encryptedMsg.Encrypt)
		if err != nil {
			if r.logger != nil {
				r.logger.Error("%s failed to decrypt message: %v", runtimeLoggerKey, err)
			}
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		body = decryptedBody
	}

	// 解析明文 XML (或者解密后的内容)
	var msg struct {
		XMLName      xml.Name `xml:"xml"`
		ToUserName   string   `xml:"ToUserName"`
		FromUserName string   `xml:"FromUserName"`
		CreateTime   int64    `xml:"CreateTime"`
		MsgType      string   `xml:"MsgType"`
		Content      string   `xml:"Content"`
		MsgId        string   `xml:"MsgId"`
		AgentID      string   `xml:"AgentID"`
	}

	if err := xml.Unmarshal(body, &msg); err != nil {
		if r.logger != nil {
			r.logger.Error("%s failed to unmarshal XML: %v, body=%s", runtimeLoggerKey, err, string(body))
		}
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// 权限检查
	if msg.FromUserName != "" && !r.IsAllowed(msg.FromUserName) {
		w.WriteHeader(http.StatusOK)
		return
	}

	if msg.MsgType == "text" {
		ts := time.Unix(msg.CreateTime, 0)
		if ts.IsZero() {
			ts = time.Now()
		}
		inMsg := &channels.InboundMessage{
			ID:       msg.MsgId,
			SenderID: msg.FromUserName,
			ChatID:   msg.FromUserName,
			ChatType: "dm",
			Content:  msg.Content,
			Time:     ts,
			Meta: map[string]interface{}{
				"agent_id":  msg.AgentID,
				"to_user":   msg.ToUserName,
				"msg_type":  msg.MsgType,
				"raw_agent": msg.AgentID,
			},
		}
		_ = r.PublishInbound(context.Background(), inMsg)
	}

	w.WriteHeader(http.StatusOK)
}

// decryptMsg 解密企业微信加密消息。
func (r *Runtime) decryptMsg(encrypted string) ([]byte, error) {
	if r.encodingAESKey == "" {
		return nil, fmt.Errorf("encoding_aes_key not configured")
	}

	// Base64 解码
	ciphertext, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return nil, fmt.Errorf("base64 decode failed: %w", err)
	}

	// EncodingAESKey 需要填充为 32 字节 (AES-256)
	key := r.encodingAESKey + "="
	keyBytes, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		return nil, fmt.Errorf("key decode failed: %w", err)
	}

	// AES-CBC 解密
	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		return nil, fmt.Errorf("aes cipher failed: %w", err)
	}

	if len(ciphertext) < aes.BlockSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	if len(ciphertext)%aes.BlockSize != 0 {
		return nil, fmt.Errorf("ciphertext not a multiple of block size")
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(ciphertext, ciphertext)

	// 去掉 PKCS7 填充
	padding := int(ciphertext[len(ciphertext)-1])
	if padding < 1 || padding > aes.BlockSize {
		return nil, fmt.Errorf("invalid padding")
	}
	ciphertext = ciphertext[:len(ciphertext)-padding]

	// 去掉前 16 字节随机字符串
	if len(ciphertext) < 16 {
		return nil, fmt.Errorf("decrypted text too short")
	}
	content := ciphertext[16:]

	// 读取 4 字节消息长度
	if len(content) < 4 {
		return nil, fmt.Errorf("content too short for length header")
	}
	msgLen := int(content[0])<<24 | int(content[1])<<16 | int(content[2])<<8 | int(content[3])

	if len(content) < 4+msgLen {
		return nil, fmt.Errorf("content too short for message")
	}

	// 提取消息体
	message := content[4 : 4+msgLen]

	// 验证 CorpID
	if len(content) < 4+msgLen+len(r.corpID) {
		return nil, fmt.Errorf("content too short for corp_id")
	}
	receivedCorpID := string(content[4+msgLen:])
	if receivedCorpID != r.corpID {
		return nil, fmt.Errorf("corp_id mismatch: expected %s, got %s", r.corpID, receivedCorpID)
	}

	return message, nil
}

// computeSignature 计算企业微信消息签名。
func (r *Runtime) computeSignature(token, timestamp, nonce, data string) string {
	strs := []string{token, timestamp, nonce, data}
	sort.Strings(strs)
	str := strings.Join(strs, "")

	h := sha1.New()
	h.Write([]byte(str))
	bs := h.Sum(nil)
	return hex.EncodeToString(bs)
}

// verifySignature 校验签名。
func (r *Runtime) verifySignature(token, timestamp, nonce, data, signature string) bool {
	expected := r.computeSignature(token, timestamp, nonce, data)
	if expected != signature {
		if r.logger != nil {
			r.logger.Debug("%s signature mismatch, expected=%s, received=%s", runtimeLoggerKey, expected, signature)
		}
		return false
	}
	return true
}

// getAccessToken 获取并缓存企业微信 access_token。
func (r *Runtime) getAccessToken() (string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.accessToken != "" && time.Now().Unix() < r.tokenExpiresAt {
		return r.accessToken, nil
	}

	url := fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=%s&corpsecret=%s", r.corpID, r.secret)
	resp, err := r.httpClient.Get(url)
	if err != nil {
		return "", fmt.Errorf("wework runtime: http get failed: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode     int    `json:"errcode"`
		ErrMsg      string `json:"errmsg"`
		AccessToken string `json:"access_token"`
		ExpiresIn   int64  `json:"expires_in"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("wework runtime: json decode failed: %w", err)
	}

	if result.ErrCode != 0 {
		return "", fmt.Errorf("wework runtime: wechat api error: %s", result.ErrMsg)
	}

	r.accessToken = result.AccessToken
	r.tokenExpiresAt = time.Now().Unix() + result.ExpiresIn - 200
	return r.accessToken, nil
}
