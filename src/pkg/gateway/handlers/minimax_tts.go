package handlers

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

const (
	minimaxGlobalTTSEndpoint = "https://api.minimax.io/v1/t2a_v2"
	minimaxChinaTTSEndpoint  = "https://api.minimaxi.com/v1/t2a_v2"
	defaultMiniMaxTTSModel   = "speech-2.8-hd"
)

// MiniMaxSpeechRequest contains the HTTP text-to-audio fields supported by the
// MiniMax speech endpoint. Optional fields are omitted when not configured.
type MiniMaxSpeechRequest struct {
	Model             string                 `json:"model"`
	Text              string                 `json:"text"`
	Stream            *bool                  `json:"stream,omitempty"`
	LanguageBoost     string                 `json:"language_boost,omitempty"`
	OutputFormat      string                 `json:"output_format,omitempty"`
	VoiceSetting      map[string]interface{} `json:"voice_setting,omitempty"`
	PronunciationDict map[string]interface{} `json:"pronunciation_dict,omitempty"`
	AudioSetting      map[string]interface{} `json:"audio_setting,omitempty"`
	VoiceModify       map[string]interface{} `json:"voice_modify,omitempty"`
	SubtitleEnable    *bool                  `json:"subtitle_enable,omitempty"`
}

// MiniMaxSpeechResponse is the normalized result returned by Convert.
type MiniMaxSpeechResponse struct {
	Audio  []byte
	Format string
	Status int
}

type minimaxSpeechWireResponse struct {
	Data struct {
		Audio  string `json:"audio"`
		Status int    `json:"status"`
	} `json:"data"`
	BaseResp struct {
		StatusCode int    `json:"status_code"`
		StatusMsg  string `json:"status_msg"`
	} `json:"base_resp"`
}

// MiniMaxTTSProvider implements the synchronous regional MiniMax TTS API.
type MiniMaxTTSProvider struct {
	APIKey     string
	Region     string
	Endpoint   string
	HTTPClient *http.Client
}

func NewMiniMaxTTSProvider(apiKey, region string) *MiniMaxTTSProvider {
	p := &MiniMaxTTSProvider{APIKey: strings.TrimSpace(apiKey), Region: strings.TrimSpace(region), HTTPClient: http.DefaultClient}
	p.Endpoint = miniMaxTTSEndpoint(p.Region)
	return p
}

func miniMaxTTSEndpoint(region string) string {
	if strings.EqualFold(strings.TrimSpace(region), "cn_zh") || strings.EqualFold(strings.TrimSpace(region), "china") {
		return minimaxChinaTTSEndpoint
	}
	return minimaxGlobalTTSEndpoint
}

func (p *MiniMaxTTSProvider) Convert(ctx context.Context, request MiniMaxSpeechRequest) (*MiniMaxSpeechResponse, error) {
	if p == nil || strings.TrimSpace(p.APIKey) == "" {
		return nil, fmt.Errorf("minimax tts API key is not configured")
	}
	if strings.TrimSpace(request.Model) == "" {
		request.Model = defaultMiniMaxTTSModel
	}
	if strings.TrimSpace(request.Text) == "" {
		return nil, fmt.Errorf("text is required")
	}
	body, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("encode speech request: %w", err)
	}
	endpoint := p.Endpoint
	if strings.TrimSpace(endpoint) == "" {
		endpoint = miniMaxTTSEndpoint(p.Region)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create speech request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+p.APIKey)
	req.Header.Set("Content-Type", "application/json")
	client := p.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send speech request: %w", err)
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return nil, fmt.Errorf("read speech response: %w", err)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("speech endpoint returned HTTP %d", resp.StatusCode)
	}
	var wire minimaxSpeechWireResponse
	if err := json.Unmarshal(responseBody, &wire); err != nil {
		return nil, fmt.Errorf("decode speech response: %w", err)
	}
	if wire.BaseResp.StatusCode != 0 {
		message := strings.TrimSpace(wire.BaseResp.StatusMsg)
		if message == "" {
			message = "request failed"
		}
		return nil, fmt.Errorf("minimax speech request failed (%d): %s", wire.BaseResp.StatusCode, message)
	}
	audio, err := decodeMiniMaxAudio(wire.Data.Audio)
	if err != nil {
		return nil, err
	}
	format := strings.TrimSpace(request.OutputFormat)
	if format == "" {
		format = "mp3"
	}
	return &MiniMaxSpeechResponse{Audio: audio, Format: format, Status: wire.Data.Status}, nil
}

func decodeMiniMaxAudio(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, fmt.Errorf("minimax speech response did not include audio")
	}
	if decoded, err := hex.DecodeString(value); err == nil {
		return decoded, nil
	}
	if decoded, err := base64.StdEncoding.DecodeString(value); err == nil {
		return decoded, nil
	}
	return nil, fmt.Errorf("minimax speech response audio is not valid hex or base64")
}
