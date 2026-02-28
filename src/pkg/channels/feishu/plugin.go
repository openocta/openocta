// Package feishu provides the Feishu (飞书) channel plugin.
package feishu

import (
	"github.com/openocta/openocta/pkg/channels"
)

const channelID = "feishu"

// feishuGatewayPlugin extends BasePlugin with LogoutAccount for channels.logout.
type feishuGatewayPlugin struct {
	*channels.BasePlugin
}

func (p *feishuGatewayPlugin) LogoutAccount(ctx *channels.LogoutContext) (*channels.LogoutResult, error) {
	return &channels.LogoutResult{Cleared: true, LoggedOut: true}, nil
}

// Plugin is the Feishu channel plugin (supports channels.logout).
var Plugin = &feishuGatewayPlugin{
	BasePlugin: &channels.BasePlugin{
		Id:       channelID,
		MetaData: meta,
	},
}

var meta = channels.ChannelMeta{
	ID:             channelID,
	Label:          "Feishu",
	SelectionLabel: "Feishu/Lark (飞书)",
	DocsPath:       "/channels/feishu",
	DocsLabel:      "feishu",
	Blurb:          "飞书/Lark 企业通讯，支持 IM 消息与卡片。",
	SystemImage:    "message-square",
	Order:          70,
}
