package wework

import "github.com/openocta/openocta/pkg/channels"

const channelID = "wework"

// Plugin is the WeWork (企业微信) channel plugin metadata.
var Plugin = &channels.BasePlugin{
	Id: channelID,
	MetaData: channels.ChannelMeta{
		ID:             channelID,
		Label:          "WeWork",
		SelectionLabel: "WeWork 企业微信",
		DocsPath:       "/channels/wework",
		DocsLabel:      "wework",
		Blurb:          "企业微信应用消息通道。",
		SystemImage:    "message-square",
		Order:          85,
	},
}
