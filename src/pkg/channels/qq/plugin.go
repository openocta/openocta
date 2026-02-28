package qq

import "github.com/openocta/openocta/pkg/channels"

const channelID = "qq"

// Plugin is the QQ channel plugin metadata.
var Plugin = &channels.BasePlugin{
	Id: channelID,
	MetaData: channels.ChannelMeta{
		ID:             channelID,
		Label:          "QQ Bot",
		SelectionLabel: "QQ 官方 Bot",
		DocsPath:       "/channels/qq",
		DocsLabel:      "qq",
		Blurb:          "QQ 官方开放平台 Bot 通道。",
		SystemImage:    "message-square",
		Order:          80,
	},
}
