package feishu

import (
	"fmt"

	"github.com/openocta/openocta/pkg/channels"
)

// NewRuntimeFromConfig 基于 channels.feishu 的原始配置创建 Feishu Runtime。
// raw 通常来源于 OpenOctaConfig.Channels.GetChannelConfig("feishu")。
func NewRuntimeFromConfig(raw map[string]interface{}, sink channels.InboundSink) (channels.RuntimeChannel, error) {
	if raw == nil {
		return nil, fmt.Errorf("feishu: channels.feishu not configured")
	}
	creds := extractFeishuCreds(raw)
	if creds == nil {
		return nil, fmt.Errorf("feishu: credentials not found in config")
	}

	appID, _ := creds["appId"].(string)
	appSecret, _ := creds["appSecret"].(string)
	if appID == "" || appSecret == "" {
		return nil, fmt.Errorf("feishu: appId and appSecret are required")
	}

	domain := ""
	if v, ok := creds["domain"].(string); ok {
		domain = v
	}
	if domain == "" {
		if v, ok := raw["domain"].(string); ok {
			domain = v
		}
	}

	encryptKey := ""
	if v, ok := creds["encryptKey"].(string); ok {
		encryptKey = v
	}
	if encryptKey == "" {
		if v, ok := raw["encryptKey"].(string); ok {
			encryptKey = v
		}
	}

	verificationToken := ""
	if v, ok := creds["verificationToken"].(string); ok {
		verificationToken = v
	}
	if verificationToken == "" {
		if v, ok := raw["verificationToken"].(string); ok {
			verificationToken = v
		}
	}

	baseCfg := channels.BaseRuntimeConfig{
		Enabled:    extractBool(raw, "enabled", true),
		AccountID:  "default",
		Name:       "Feishu",
		AllowedIDs: extractStringSlice(raw, "allowedIds"),
	}

	return NewRuntime(appID, appSecret, domain, encryptKey, verificationToken, baseCfg, sink), nil
}

func extractBool(m map[string]interface{}, key string, def bool) bool {
	if m == nil {
		return def
	}
	if v, ok := m[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return def
}

func extractStringSlice(m map[string]interface{}, key string) []string {
	if m == nil {
		return nil
	}
	raw, ok := m[key]
	if !ok {
		return nil
	}
	switch v := raw.(type) {
	case []interface{}:
		out := make([]string, 0, len(v))
		for _, item := range v {
			if s, ok := item.(string); ok && s != "" {
				out = append(out, s)
			}
		}
		return out
	case []string:
		return v
	default:
		return nil
	}
}
