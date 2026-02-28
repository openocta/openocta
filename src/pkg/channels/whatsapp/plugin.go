// Package whatsapp provides the WhatsApp channel plugin.
package whatsapp

import (
	"github.com/openocta/openocta/pkg/channels"
)

const channelID = "whatsapp"

// Plugin is the WhatsApp channel plugin.
var Plugin = &channels.BasePlugin{
	Id:       channelID,
	MetaData: meta,
}

var meta = channels.ChannelMeta{
	ID:             channelID,
	Label:          "WhatsApp",
	SelectionLabel: "WhatsApp (QR link)",
	DocsPath:       "/channels/whatsapp",
	DocsLabel:      "whatsapp",
	Blurb:          "works with your own number; recommend a separate phone + eSIM.",
	SystemImage:    "message",
	Order:          1,
}
