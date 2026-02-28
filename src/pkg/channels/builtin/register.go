// Package builtin registers built-in channel plugins.
package builtin

import (
	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/channels/dingtalk"
	"github.com/openocta/openocta/pkg/channels/feishu"
	"github.com/openocta/openocta/pkg/channels/qq"
	"github.com/openocta/openocta/pkg/channels/wework"
)

// Register adds all built-in channel plugins to the registry.
func Register(r *channels.Registry) {
	if r == nil {
		return
	}
	//r.Register(discord.Plugin)
	//r.Register(telegram.Plugin)
	//r.Register(whatsapp.Plugin)
	//r.Register(slack.Plugin)
	r.Register(dingtalk.Plugin)
	r.Register(feishu.Plugin)
	r.Register(qq.Plugin)
	r.Register(wework.Plugin)
}
