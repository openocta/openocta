// Package discord provides the Discord channel plugin.
package discord

import (
	"github.com/openocta/openocta/pkg/channels"
)

const channelID = "discord"

// Plugin is the Discord channel plugin.
var Plugin = &channels.BasePlugin{
	Id:       channelID,
	MetaData: meta,
}

var meta = channels.ChannelMeta{
	ID:             channelID,
	Label:          "Discord",
	SelectionLabel: "Discord (Bot API)",
	DocsPath:       "/channels/discord",
	DocsLabel:      "discord",
	Blurb:          "very well supported right now.",
	SystemImage:    "bubble.left.and.bubble.right",
	Order:          2,
}
