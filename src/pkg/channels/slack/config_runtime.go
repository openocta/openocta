package slack

import (
	"fmt"

	"github.com/openocta/openocta/pkg/channels"
)

// NewRuntimeFromConfig 基于 channels.slack 的原始配置创建 Slack Runtime。
//
// 推荐配置结构示例（当前 Runtime 为骨架实现，主要使用通用字段）：
//
//	{
//	  "enabled": true,
//	  "allowedIds": ["user-id-1"],
//	  "accountId": "default",
//	  "name": "Slack"
//	}
func NewRuntimeFromConfig(raw map[string]interface{}, sink channels.InboundSink) (channels.RuntimeChannel, error) {
	if raw == nil {
		return nil, fmt.Errorf("slack: channels.slack not configured")
	}

	baseCfg := channels.BaseRuntimeConfig{
		Enabled:    extractBool(raw, "enabled", true),
		AccountID:  extractString(raw, "accountId", "default"),
		Name:       extractString(raw, "name", "Slack"),
		AllowedIDs: extractStringSlice(raw, "allowedIds"),
	}

	return NewRuntime(baseCfg, sink), nil
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

func extractString(m map[string]interface{}, key, def string) string {
	if m == nil {
		return def
	}
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
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
