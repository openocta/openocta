package dingtalk

import (
	"fmt"

	"github.com/openocta/openocta/pkg/channels"
)

// NewRuntimeFromConfig 基于 channels.dingtalk 的原始配置创建 DingTalk Runtime。
//
// 推荐配置结构示例：
//
//	{
//	  "enabled": true,
//	  "allowedIds": ["user-id-1"],
//	  "credentials": {
//	    "clientId": "your-client-id",
//	    "clientSecret": "your-client-secret"
//	  }
//	}
func NewRuntimeFromConfig(raw map[string]interface{}, sink channels.InboundSink) (channels.RuntimeChannel, error) {
	if raw == nil {
		return nil, fmt.Errorf("dingtalk: channels.dingtalk not configured")
	}

	creds, ok := raw["credentials"].(map[string]interface{})
	if !ok || creds == nil {
		return nil, fmt.Errorf("dingtalk: credentials not found in config")
	}

	clientID, _ := creds["clientId"].(string)
	clientSecret, _ := creds["clientSecret"].(string)
	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("dingtalk: clientId and clientSecret are required")
	}

	baseCfg := channels.BaseRuntimeConfig{
		Enabled:    extractBool(raw, "enabled", true),
		AccountID:  "default",
		Name:       "DingTalk",
		AllowedIDs: extractStringSlice(raw, "allowedIds"),
	}

	return NewRuntime(clientID, clientSecret, baseCfg, sink), nil
}

// extractBool 是从 Feishu 复用风格的简单布尔解析。
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

// extractStringSlice 将任意 slice 转成 []string。
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
