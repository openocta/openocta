package handlers

import (
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
	EdgeEnabled       bool     `json:"edgeEnabled"`
}

// TtsStatusHandler handles "tts.status".
func TtsStatusHandler(opts HandlerOpts) error {
	opts.Respond(true, &TtsStatusResult{
		Enabled:           false,
		Auto:              false,
		Provider:          "openai",
		FallbackProviders: []string{},
	}, nil, nil)
	return nil
}

// TtsProvidersHandler handles "tts.providers".
func TtsProvidersHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"providers": []interface{}{},
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
