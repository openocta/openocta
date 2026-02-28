// Package slack provides the Slack channel plugin.
package slack

import (
	"github.com/openocta/openocta/pkg/channels"
)

const channelID = "slack"

// Plugin is the Slack channel plugin.
var Plugin = &channels.BasePlugin{
	Id:       channelID,
	MetaData: meta,
}

var meta = channels.ChannelMeta{
	ID:             channelID,
	Label:          "Slack",
	SelectionLabel: "Slack (Socket Mode)",
	DocsPath:       "/channels/slack",
	DocsLabel:      "slack",
	Blurb:          "supported (Socket Mode).",
	SystemImage:    "number",
	Order:          5,
}
