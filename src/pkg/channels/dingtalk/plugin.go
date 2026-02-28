// Package dingtalk provides the DingTalk (钉钉) channel plugin.
package dingtalk

import (
	"github.com/openocta/openocta/pkg/channels"
)

const channelID = "dingtalk"

// Plugin is the DingTalk channel plugin.
var Plugin = &channels.BasePlugin{
	Id:       channelID,
	MetaData: meta,
}

var meta = channels.ChannelMeta{
	ID:             channelID,
	Label:          "DingTalk",
	SelectionLabel: "DingTalk (钉钉)",
	DocsPath:       "/channels/dingtalk",
	DocsLabel:      "dingtalk",
	Blurb:          "钉钉企业通讯，支持 Stream 模式接入与消息推送。",
	SystemImage:    "message-square",
	Order:          60,
}
