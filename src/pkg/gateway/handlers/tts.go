package handlers

import (
	"context"
	"encoding/base64"
	"os"
	"strings"

	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// TtsStatusResult matches TS tts.status response.
type TtsStatusResult struct {
	Enabled           bool     `json:"enabled"`
	Auto              bool     `json:"auto"`
	Provider          string   `json:"provider"`
	FallbackProvider  *string  `json:"fallbackProvider"`
	FallbackProviders []string `json:"fallbackProviders"`
	PrefsPath         string   `json:"prefsPath"`
	HasOpenAIKey      bool     `json:"hasOpenAIKey"`
	HasElevenLabsKey  bool     `json:"hasElevenLabsKey"`
	HasMiniMaxKey     bool     `json:"hasMiniMaxKey"`
	EdgeEnabled       bool     `json:"edgeEnabled"`
}

// TtsStatusHandler handles "tts.status".
func TtsStatusHandler(opts HandlerOpts) error {
	opts.Respond(true, &TtsStatusResult{
		Enabled:           false,
		Auto:              false,
		Provider:          "openai",
		FallbackProviders: []string{},
		HasMiniMaxKey:     strings.TrimSpace(os.Getenv("MINIMAX_API_KEY")) != "",
	}, nil, nil)
	return nil
}

// TtsProvidersHandler handles "tts.providers".
func TtsProvidersHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"providers": []interface{}{
			map[string]interface{}{
				"id":      "minimax",
				"name":    "MiniMax",
				"models":  []string{"speech-2.8-hd", "speech-2.8-turbo", "speech-2.6-hd", "speech-2.6-turbo", "speech-02-hd", "speech-02-turbo", "speech-01-hd", "speech-01-turbo"},
				"formats": []string{"mp3", "wav", "flac", "pcm"},
			},
		},
	}, nil, nil)
	return nil
}

// TtsEnableHandler handles "tts.enable".
func TtsEnableHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"enabled": true}, nil, nil)
	return nil
}

// TtsDisableHandler handles "tts.disable".
func TtsDisableHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"enabled": false}, nil, nil)
	return nil
}

// TtsConvertHandler handles "tts.convert".
func TtsConvertHandler(opts HandlerOpts) error {
	text, _ := opts.Params["text"].(string)
	if text == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "tts.convert requires text",
		}, nil)
		return nil
	}
	provider, _ := opts.Params["provider"].(string)
	if strings.EqualFold(strings.TrimSpace(provider), "minimax") {
		model, _ := opts.Params["model"].(string)
		region, _ := opts.Params["region"].(string)
		outputFormat, _ := opts.Params["output_format"].(string)
		request := MiniMaxSpeechRequest{Model: model, Text: text, OutputFormat: outputFormat}
		if stream, ok := opts.Params["stream"].(bool); ok {
			request.Stream = &stream
		}
		if subtitle, ok := opts.Params["subtitle_enable"].(bool); ok {
			request.SubtitleEnable = &subtitle
		}
		request.LanguageBoost, _ = opts.Params["language_boost"].(string)
		request.VoiceSetting, _ = opts.Params["voice_setting"].(map[string]interface{})
		request.PronunciationDict, _ = opts.Params["pronunciation_dict"].(map[string]interface{})
		request.AudioSetting, _ = opts.Params["audio_setting"].(map[string]interface{})
		request.VoiceModify, _ = opts.Params["voice_modify"].(map[string]interface{})
		result, err := NewMiniMaxTTSProvider(os.Getenv("MINIMAX_API_KEY"), region).Convert(context.Background(), request)
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: err.Error()}, nil)
			return nil
		}
		opts.Respond(true, map[string]interface{}{
			"provider": "minimax",
			"format":   result.Format,
			"status":   result.Status,
			"audio":    base64.StdEncoding.EncodeToString(result.Audio),
		}, nil, nil)
		return nil
	}
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "tts.convert not implemented",
	}, nil)
	return nil
}

// TtsSetProviderHandler handles "tts.setProvider".
func TtsSetProviderHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "tts.setProvider not implemented",
	}, nil)
	return nil
}
