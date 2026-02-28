// Package telegram provides the Telegram channel plugin.
package telegram

import (
	"github.com/openocta/openocta/pkg/channels"
)

const channelID = "telegram"

// Plugin is the Telegram channel plugin.
var Plugin = &channels.BasePlugin{
	Id:       channelID,
	MetaData: meta,
}

var meta = channels.ChannelMeta{
	ID:             channelID,
	Label:          "Telegram",
	SelectionLabel: "Telegram (Bot API)",
	DocsPath:       "/channels/telegram",
	DocsLabel:      "telegram",
	Blurb:          "simplest way to get started — register a bot with @BotFather and get going.",
	SystemImage:    "paperplane",
	Order:          0,
}
