package qq

import (
	"fmt"

	"github.com/openocta/openocta/pkg/channels"
)

// NewRuntimeFromConfig 基于 channels.qq 的原始配置创建 QQ Runtime。
// raw 通常来源于 OpenOctaConfig.Channels.GetChannelConfig("qq")。
//
// 约定配置结构示例（与 Feishu 类似）：
//
//	{
//	  "enabled": true,
//	  "allowedIds": ["user-openid-1"],
//	  "credentials": {
//	    "appId": "your-app-id",
//	    "appSecret": "your-app-secret"
//	  }
//	}
func NewRuntimeFromConfig(raw map[string]interface{}, sink channels.InboundSink) (channels.RuntimeChannel, error) {
	if raw == nil {
		return nil, fmt.Errorf("qq: channels.qq not configured")
	}

	creds, ok := raw["credentials"].(map[string]interface{})
	if !ok || creds == nil {
		return nil, fmt.Errorf("qq: credentials not found in config")
	}

	appID, _ := creds["appId"].(string)
	appSecret, _ := creds["appSecret"].(string)
	if appID == "" || appSecret == "" {
		return nil, fmt.Errorf("qq: appId and appSecret are required")
	}

	baseCfg := channels.BaseRuntimeConfig{
		Enabled:    extractBoolQQ(raw, "enabled", true),
		AccountID:  "default",
		Name:       "QQ Bot",
		AllowedIDs: extractStringSliceQQ(raw, "allowedIds"),
	}

	return NewRuntime(appID, appSecret, baseCfg, sink), nil
}

// extractBoolQQ 是 QQ runtime 专用的配置解析辅助函数。
func extractBoolQQ(m map[string]interface{}, key string, def bool) bool {
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

// extractStringSliceQQ 将任意 slice 转成 []string。
func extractStringSliceQQ(m map[string]interface{}, key string) []string {
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
