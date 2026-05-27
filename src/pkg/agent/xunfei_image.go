package agent

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stellarlinkco/agentsdk-go/pkg/model"
)

// XunfeiImageConfig holds configuration for the Xunfei Image Understanding WebSocket API.
type XunfeiImageConfig struct {
	AppID       string  // XUNFEI_APP_ID
	APIKey      string  // XUNFEI_API_KEY
	APISecret   string  // XUNFEI_API_SECRET
	Host        string  // spark-api.cn-huabei-1.xf-yun.com
	Path        string  // /v2.1/image
	Domain      string  // "general" or "imagev3"
	Temperature float64 // 0~1, default 0.5
	MaxTokens   int     // default 2048, max 8192
	TopK        int     // 1~6, default 4
}

// DefaultXunfeiImageConfig returns a config populated from environment variables.
func DefaultXunfeiImageConfig() XunfeiImageConfig {
	return XunfeiImageConfig{
		AppID:       os.Getenv("XUNFEI_APP_ID"),
		APIKey:      os.Getenv("XUNFEI_API_KEY"),
		APISecret:   os.Getenv("XUNFEI_API_SECRET"),
		Host:        "spark-api.cn-huabei-1.xf-yun.com",
		Path:        "/v2.1/image",
		Domain:      "imagev3",
		Temperature: 0.5,
		MaxTokens:   2048,
		TopK:        4,
	}
}

const xunfeiImageDialTimeout = 30 * time.Second
const xunfeiImageReadTimeout = 120 * time.Second

// ---- Auth URL builder ----

// buildXunfeiWSSURL builds the authenticated WebSocket URL for Xunfei APIs.
func buildXunfeiWSSURL(host, path, apiKey, apiSecret string) string {
	if host == "" {
		host = "spark-api.cn-huabei-1.xf-yun.com"
	}
	if path == "" {
		path = "/v2.1/image"
	}

	now := time.Now().UTC()
	date := now.Format(time.RFC1123) // RFC1123 = "Mon, 02 Jan 2006 15:04:05 GMT"

	// 1. Build signature string
	signStr := fmt.Sprintf("host: %s\ndate: %s\nGET %s HTTP/1.1", host, date, path)

	// 2. HMAC-SHA256
	mac := hmac.New(sha256.New, []byte(apiSecret))
	mac.Write([]byte(signStr))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	// 3. Build authorization origin
	authOrigin := fmt.Sprintf(
		`api_key="%s", algorithm="hmac-sha256", headers="host date request-line", signature="%s"`,
		apiKey, signature,
	)

	// 4. Base64 encode authorization origin
	authorization := base64.StdEncoding.EncodeToString([]byte(authOrigin))

	// 5. Build query params
	params := url.Values{}
	params.Set("authorization", authorization)
	params.Set("date", date)
	params.Set("host", host)

	return fmt.Sprintf("wss://%s%s?%s", host, path, params.Encode())
}

// ---- WebSocket request/response types ----

type xunfeiWSHeader struct {
	AppID string `json:"app_id"`
	UID   string `json:"uid,omitempty"`
}

type xunfeiWSParameter struct {
	Chat xunfeiWSChatParam `json:"chat"`
}

type xunfeiWSChatParam struct {
	Domain      string  `json:"domain"`
	Temperature float64 `json:"temperature,omitempty"`
	TopK        int     `json:"top_k,omitempty"`
	MaxTokens   int     `json:"max_tokens,omitempty"`
}

type xunfeiWSMessageText struct {
	Role        string `json:"role"`
	Content     string `json:"content"`
	ContentType string `json:"content_type"` // "image" or "text"
}

type xunfeiWSMessage struct {
	Text []xunfeiWSMessageText `json:"text"`
}

type xunfeiWSPayload struct {
	Message xunfeiWSMessage `json:"message"`
}

// xunfeiWSRequest is the JSON structure sent over WebSocket to Xunfei image API.
type xunfeiWSRequest struct {
	Header    xunfeiWSHeader    `json:"header"`
	Parameter xunfeiWSParameter `json:"parameter"`
	Payload   xunfeiWSPayload   `json:"payload"`
}

// ---- Response types ----

type xunfeiWSRespHeader struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	SID     string `json:"sid"`
	Status  int    `json:"status"` // 0=first, 1=intermediate, 2=final
}

type xunfeiWSRespChoiceText struct {
	Content     string `json:"content"`
	ContentType string `json:"content_type"`
	Index       int    `json:"index"`
	Role        string `json:"role"`
}

type xunfeiWSRespChoices struct {
	Status int                       `json:"status"`
	Seq    int                       `json:"seq"`
	Text   []xunfeiWSRespChoiceText `json:"text"`
}

type xunfeiWSUsage struct {
	Text struct {
		CompletionTokens int `json:"completion_tokens"`
		QuestionTokens   int `json:"question_tokens"`
		PromptTokens     int `json:"prompt_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"text"`
}

type xunfeiWSResponse struct {
	Header  xunfeiWSRespHeader   `json:"header"`
	Payload *xunfeiWSRespPayload `json:"payload,omitempty"`
}

type xunfeiWSRespPayload struct {
	Choices *xunfeiWSRespChoices `json:"choices,omitempty"`
	Usage   *xunfeiWSUsage       `json:"usage,omitempty"`
}

// ---- Model implementation ----

// ensureXunfeiConfig fills missing values with defaults.
func ensureXunfeiConfig(cfg XunfeiImageConfig) XunfeiImageConfig {
	if cfg.Host == "" {
		cfg.Host = "spark-api.cn-huabei-1.xf-yun.com"
	}
	if cfg.Path == "" {
		cfg.Path = "/v2.1/image"
	}
	if cfg.Domain == "" {
		cfg.Domain = "imagev3"
	}
	if cfg.Temperature == 0 {
		cfg.Temperature = 0.5
	}
	if cfg.MaxTokens == 0 {
		cfg.MaxTokens = 2048
	}
	if cfg.TopK == 0 {
		cfg.TopK = 4
	}
	return cfg
}

// XunfeiImageModel implements model.Model for Xunfei's Image Understanding WebSocket API.
type XunfeiImageModel struct {
	config XunfeiImageConfig
}

// Complete performs a non-streaming image understanding request.
func (m *XunfeiImageModel) Complete(ctx context.Context, req model.Request) (*model.Response, error) {
	var fullText string
	var finalUsage model.Usage

	err := m.CompleteStream(ctx, req, func(sr model.StreamResult) error {
		if sr.Final && sr.Response != nil {
			fullText = sr.Response.Message.Content
			finalUsage = sr.Response.Usage
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &model.Response{
		Message: model.Message{
			Role:    "assistant",
			Content: fullText,
		},
		Usage: finalUsage,
	}, nil
}

// CompleteStream performs a streaming image understanding request via WebSocket.
func (m *XunfeiImageModel) CompleteStream(ctx context.Context, req model.Request, cb model.StreamHandler) error {
	cfg := ensureXunfeiConfig(m.config)
	if cfg.AppID == "" || cfg.APIKey == "" || cfg.APISecret == "" {
		return fmt.Errorf("xunfei image: missing AppID/APIKey/APISecret, set XUNFEI_APP_ID, XUNFEI_API_KEY, XUNFEI_API_SECRET")
	}

	// Build WSS URL
	wssURL := buildXunfeiWSSURL(cfg.Host, cfg.Path, cfg.APIKey, cfg.APISecret)

	// Build Xunfei request payload
	wsReq := m.buildRequest(cfg, req)

	// Connect WebSocket
	dialer := websocket.Dialer{
		HandshakeTimeout: xunfeiImageDialTimeout,
	}
	conn, _, err := dialer.DialContext(ctx, wssURL, nil)
	if err != nil {
		return fmt.Errorf("xunfei image: dial failed: %w", err)
	}
	defer conn.Close()

	// Set read deadline
	conn.SetReadDeadline(time.Now().Add(xunfeiImageReadTimeout))

	// Send request
	if err := conn.WriteJSON(wsReq); err != nil {
		return fmt.Errorf("xunfei image: write request failed: %w", err)
	}

	// Read stream
	var accumulated strings.Builder
	var finalUsage model.Usage
	hasFirstChunk := false

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		// Reset read deadline for each message
		conn.SetReadDeadline(time.Now().Add(xunfeiImageReadTimeout))

		_, msg, err := conn.ReadMessage()
		if err != nil {
			if ce, ok := err.(*websocket.CloseError); ok {
				if ce.Code == websocket.CloseNormalClosure {
					break
				}
			}
			return fmt.Errorf("xunfei image: read failed: %w", err)
		}

		var resp xunfeiWSResponse
		if err := json.Unmarshal(msg, &resp); err != nil {
			return fmt.Errorf("xunfei image: unmarshal response failed: %w", err)
		}

		// Check for errors
		if resp.Header.Code != 0 {
			return fmt.Errorf("xunfei image: code=%d, sid=%s, msg=%s", resp.Header.Code, resp.Header.SID, resp.Header.Message)
		}

		// Extract content
		if resp.Payload != nil && resp.Payload.Choices != nil {
			for _, t := range resp.Payload.Choices.Text {
				if t.ContentType == "text" && t.Role == "assistant" {
					if !hasFirstChunk {
						hasFirstChunk = true
					}
					accumulated.WriteString(t.Content)

					// Emit delta
					if err := cb(model.StreamResult{Delta: t.Content}); err != nil {
						return err
					}
				}
			}
		}

		// Extract usage from final frame
		if resp.Payload != nil && resp.Payload.Usage != nil {
			finalUsage = model.Usage{
				InputTokens:  resp.Payload.Usage.Text.PromptTokens,
				OutputTokens: resp.Payload.Usage.Text.CompletionTokens,
				TotalTokens:  resp.Payload.Usage.Text.TotalTokens,
			}
		}

		// Check if final frame
		if resp.Header.Status == 2 {
			break
		}
	}

	// Send final event
	return cb(model.StreamResult{
		Final: true,
		Response: &model.Response{
			Message: model.Message{
				Role:    "assistant",
				Content: accumulated.String(),
			},
			Usage:      finalUsage,
			StopReason: "end_turn",
		},
	})
}

// buildRequest converts the model.Request into a Xunfei WebSocket request.
// Images and text are extracted from the last user message in req.Messages.
func (m *XunfeiImageModel) buildRequest(cfg XunfeiImageConfig, req model.Request) xunfeiWSRequest {
	wsReq := xunfeiWSRequest{
		Header: xunfeiWSHeader{
			AppID: cfg.AppID,
			UID:   req.SessionID,
		},
		Parameter: xunfeiWSParameter{
			Chat: xunfeiWSChatParam{
				Domain:      cfg.Domain,
				Temperature: cfg.Temperature,
				TopK:        cfg.TopK,
				MaxTokens:   cfg.MaxTokens,
			},
		},
	}

	textParts := make([]xunfeiWSMessageText, 0)

	// Extract images and text from the last user message
	var userContent string
	var userBlocks []model.ContentBlock
	for i := len(req.Messages) - 1; i >= 0; i-- {
		if req.Messages[i].Role == "user" {
			userContent = req.Messages[i].Content
			userBlocks = req.Messages[i].ContentBlocks
			break
		}
	}

		// Add images first (Xunfei requires first message to be image)
	for _, block := range userBlocks {
		if block.Type == model.ContentBlockImage {
			data := block.Data
			if data == "" {
				data = block.URL
			}
			if data != "" {
				// Xunfei API requires raw base64 without the data URI prefix.
				if idx := strings.Index(data, ","); idx != -1 && strings.HasPrefix(data, "data:") {
					data = data[idx+1:]
				}
				
				// Strip any accidental whitespace or newlines from base64
				data = strings.TrimSpace(data)
				data = strings.ReplaceAll(data, "\n", "")
				data = strings.ReplaceAll(data, "\r", "")

				dbgFile, _ := os.OpenFile("xunfei_debug.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
				if dbgFile != nil {
					fmt.Fprintf(dbgFile, "[XUNFEI DEBUG] Image block found! Data length: %d\n", len(data))
					if len(data) > 50 {
						fmt.Fprintf(dbgFile, "[XUNFEI DEBUG] Snippet: %s...%s\n", data[:20], data[len(data)-20:])
					}
					dbgFile.Close()
				}

				textParts = append(textParts, xunfeiWSMessageText{
					Role:        "user",
					Content:     data,
					ContentType: "image",
				})
			}
		}
	}

	// Add text question
	prompt := strings.TrimSpace(userContent)
	if prompt == "" {
		prompt = "请描述这张图片的内容"
	}
	textParts = append(textParts, xunfeiWSMessageText{
		Role:        "user",
		Content:     prompt,
		ContentType: "text",
	})

	wsReq.Payload.Message.Text = textParts
	return wsReq
}

// ---- Provider implementation ----

// XunfeiImageProvider implements model.Provider to create XunfeiImageModel instances.
type XunfeiImageProvider struct {
	Config XunfeiImageConfig
}

// Model creates a new XunfeiImageModel.
func (p *XunfeiImageProvider) Model(ctx context.Context) (model.Model, error) {
	return &XunfeiImageModel{config: p.Config}, nil
}

// NewXunfeiImageFactory creates an api.ModelFactory backed by the Xunfei Image Understanding API.
// Credentials are resolved from cfg.Env first, then OS environment.
func NewXunfeiImageFactory(getenv func(string) string) *XunfeiImageProvider {
	if getenv == nil {
		getenv = os.Getenv
	}
	cfg := XunfeiImageConfig{
		AppID:       getenv("XUNFEI_APP_ID"),
		APIKey:      getenv("XUNFEI_API_KEY"),
		APISecret:   getenv("XUNFEI_API_SECRET"),
		Host:        "spark-api.cn-huabei-1.xf-yun.com",
		Path:        "/v2.1/image",
		Domain:      "imagev3",
		Temperature: 0.5,
		MaxTokens:   2048,
		TopK:        4,
	}
	return &XunfeiImageProvider{Config: cfg}
}
