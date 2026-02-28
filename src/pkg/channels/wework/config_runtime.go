package wework

import (
	"fmt"

	"github.com/openocta/openocta/pkg/channels"
)

// NewRuntimeFromConfig 基于 channels.wework 的原始配置创建 WeWork Runtime。
// raw 通常来源于 OpenOctaConfig.Channels.GetChannelConfig("wework")。
//
// 推荐配置结构示例：
//
//	{
//	  "enabled": true,
//	  "allowedIds": ["user-or-chat-id"],
//	  "webhookPort": 8766,
//	  "credentials": {
//	    "corpId": "your-corp-id",
//	    "agentId": "your-agent-id",
//	    "secret": "your-secret",
//	    "token": "your-token",
//	    "encodingAESKey": "your-encoding-aes-key"
//	  }
//	}
func NewRuntimeFromConfig(raw map[string]interface{}, sink channels.InboundSink) (channels.RuntimeChannel, error) {
	if raw == nil {
		return nil, fmt.Errorf("wework: channels.wework not configured")
	}

	creds, ok := raw["credentials"].(map[string]interface{})
	if !ok || creds == nil {
		return nil, fmt.Errorf("wework: credentials not found in config")
	}

	corpID, _ := creds["corpId"].(string)
	agentID, _ := creds["agentId"].(string)
	secret, _ := creds["secret"].(string)
	token, _ := creds["token"].(string)
	encodingAESKey, _ := creds["encodingAESKey"].(string)

	if corpID == "" || secret == "" || agentID == "" || token == "" {
		return nil, fmt.Errorf("wework: corpId/agentId/secret/token are required")
	}

	webhookPort := 8766
	if v, ok := raw["webhookPort"]; ok {
		if p, ok := toInt(v); ok && p > 0 && p < 65535 {
			webhookPort = p
		}
	}

	baseCfg := channels.BaseRuntimeConfig{
		Enabled:    extractBoolWeWork(raw, "enabled", true),
		AccountID:  "default",
		Name:       "WeWork",
		AllowedIDs: extractStringSliceWeWork(raw, "allowedIds"),
	}

	return NewRuntime(corpID, agentID, secret, token, encodingAESKey, webhookPort, baseCfg, sink), nil
}

func extractBoolWeWork(m map[string]interface{}, key string, def bool) bool {
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

func extractStringSliceWeWork(m map[string]interface{}, key string) []string {
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

// toInt 尝试将任意数字类型转为 int。
func toInt(v interface{}) (int, bool) {
	switch n := v.(type) {
	case int:
		return n, true
	case int32:
		return int(n), true
	case int64:
		return int(n), true
	case float32:
		return int(n), true
	case float64:
		return int(n), true
	default:
		return 0, false
	}
}
