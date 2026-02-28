// Package dingtalk provides outbound adapter for DingTalk robot messages.
// Uses DingTalk Open API: /v1.0/robot/oToMessages/batchSend
// Config: channels.dingtalk.appKey, appSecret, corpId, agentId
package dingtalk

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/outbound"
)

const (
	dingTalkTokenURL = "https://api.dingtalk.com/v1.0/oauth2/accessToken"
	dingTalkSendURL  = "https://api.dingtalk.com/v1.0/robot/oToMessages/batchSend"
)

// Adapter sends messages via DingTalk robot batchSend API.
type Adapter struct {
	loadConfig func() (*config.OpenOctaConfig, error)
	tokenMu    sync.Mutex
	token      string
	tokenExp   time.Time
}

// NewAdapter creates a DingTalk outbound adapter.
func NewAdapter(loadConfig func() (*config.OpenOctaConfig, error)) *Adapter {
	return &Adapter{loadConfig: loadConfig}
}

func (a *Adapter) getCreds() (appKey, appSecret, corpId, agentId string, err error) {
	cfg, err := a.loadConfig()
	if err != nil || cfg == nil || cfg.Channels == nil || cfg.Channels.DingTalk == nil {
		return "", "", "", "", fmt.Errorf("dingtalk not configured")
	}
	// channels.dingtalk: { appKey, appSecret, corpId?, agentId? } or accounts.<id>.*
	m := extractDingTalkCreds(cfg.Channels.DingTalk)
	if m == nil {
		return "", "", "", "", fmt.Errorf("dingtalk credentials not found")
	}
	appKey, _ = m["appKey"].(string)
	appSecret, _ = m["appSecret"].(string)
	corpId, _ = m["corpId"].(string)
	agentId, _ = m["agentId"].(string)
	if appKey == "" || appSecret == "" {
		return "", "", "", "", fmt.Errorf("dingtalk appKey and appSecret required")
	}
	return appKey, appSecret, corpId, agentId, nil
}

func extractDingTalkCreds(d map[string]interface{}) map[string]interface{} {
	if d == nil {
		return nil
	}
	// Top-level appKey means single-account config
	if _, ok := d["appKey"]; ok {
		return d
	}
	// accounts.default or first account
	if acc, ok := d["accounts"].(map[string]interface{}); ok {
		if m, ok := acc["default"].(map[string]interface{}); ok {
			return m
		}
		for _, v := range acc {
			if m, ok := v.(map[string]interface{}); ok {
				return m
			}
		}
	}
	return nil
}

func (a *Adapter) getAccessToken(ctx context.Context) (string, error) {
	a.tokenMu.Lock()
	defer a.tokenMu.Unlock()
	if a.token != "" && time.Now().Before(a.tokenExp) {
		return a.token, nil
	}
	appKey, appSecret, _, _, err := a.getCreds()
	if err != nil {
		return "", err
	}
	body := map[string]string{
		"appKey":    appKey,
		"appSecret": appSecret,
	}
	b, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, "POST", dingTalkTokenURL, bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	var result struct {
		AccessToken string `json:"accessToken"`
		ExpireIn    int64  `json:"expireIn"`
	}
	if json.Unmarshal(data, &result) != nil || result.AccessToken == "" {
		return "", fmt.Errorf("dingtalk token failed: %s", string(data))
	}
	a.token = result.AccessToken
	a.tokenExp = time.Now().Add(time.Duration(result.ExpireIn-60) * time.Second)
	return a.token, nil
}

// SendText sends a text message to the given user (staffId).
func (a *Adapter) SendText(ctx context.Context, c *outbound.OutboundContext) (*outbound.DeliveryResult, error) {
	_, _, corpId, agentId, err := a.getCreds()
	if err != nil {
		return nil, err
	}
	to := strings.TrimSpace(c.To)
	if to == "" {
		return nil, fmt.Errorf("dingtalk: to (staffId) required")
	}
	token, err := a.getAccessToken(ctx)
	if err != nil {
		return nil, err
	}
	// batchSend: userIds, msgKey, msgParam
	msgParam := map[string]string{
		"title": "消息",
		"text":  c.Text,
	}
	msgParamJSON, _ := json.Marshal(msgParam)
	payload := map[string]interface{}{
		"userIds":  []string{to},
		"msgKey":   "sampleMarkdown",
		"msgParam": string(msgParamJSON),
	}
	if corpId != "" {
		payload["corpId"] = corpId
	}
	if agentId != "" {
		payload["robotCode"] = agentId
	}
	b, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, "POST", dingTalkSendURL, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-acs-dingtalk-access-token", token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	var result struct {
		RequestId string `json:"requestId"`
		Success   bool   `json:"success"`
		ErrMsg    string `json:"errmsg"`
	}
	_ = json.Unmarshal(data, &result)
	if !result.Success && resp.StatusCode >= 400 {
		return nil, fmt.Errorf("dingtalk send failed: %s", result.ErrMsg)
	}
	return &outbound.DeliveryResult{
		Channel:   channelID,
		MessageID: result.RequestId,
		ToJID:     to,
	}, nil
}

// SendMedia sends media (URL) - DingTalk supports image/file via different msgKey.
func (a *Adapter) SendMedia(ctx context.Context, c *outbound.OutboundContext) (*outbound.DeliveryResult, error) {
	if c.MediaURL == "" {
		return nil, fmt.Errorf("dingtalk: mediaUrl required for SendMedia")
	}
	// Fallback: send as text with link
	text := c.Text
	if text == "" {
		text = c.MediaURL
	} else {
		text = text + "\n" + c.MediaURL
	}
	oc := &outbound.OutboundContext{
		To:   c.To,
		Text: text,
	}
	return a.SendText(ctx, oc)
}
