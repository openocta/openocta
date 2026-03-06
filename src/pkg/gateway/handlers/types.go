// Package handlers defines Gateway request handlers and dispatch types.
package handlers

import (
	"context"
	"fmt"

	"github.com/cexll/agentsdk-go/pkg/tool"
	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/cron"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/outbound"
)

// gatewayInvokerAdapter adapts Context.InvokeMethod to tools.GatewayInvoker.
type gatewayInvokerAdapter struct {
	invoke func(method string, params map[string]interface{}) (ok bool, payload interface{}, err *protocol.ErrorShape)
}

func (a *gatewayInvokerAdapter) Invoke(method string, params map[string]interface{}) (ok bool, payload interface{}, err error) {
	ok, payload, errShape := a.invoke(method, params)
	if errShape != nil {
		return ok, payload, fmt.Errorf("%s", errShape.Message)
	}
	return ok, payload, nil
}

var _ tools.GatewayInvoker = (*gatewayInvokerAdapter)(nil)

// Client represents a connected WebSocket client (minimal for Phase 2c).
type Client struct {
	Connect protocol.ConnectParams
	ConnID  string
}

// RespondFn sends a response frame.
type RespondFn func(ok bool, payload interface{}, err *protocol.ErrorShape, meta map[string]interface{})

// ChannelRegistryList lists channel plugins.
type ChannelRegistryList interface {
	List() []channels.ChannelPlugin
}

// BroadcastOptions configures broadcast behavior.
type BroadcastOptions struct {
	DropIfSlow   bool
	StateVersion *protocol.StateVersion
}

// Context holds handler dependencies.
type Context struct {
	Version             string
	GetHealthCache      func() interface{}
	RefreshHealth       func(probe bool) (interface{}, error)
	GetStatusSummary    func() (interface{}, error)
	LoadConfigSnapshot  func() (*ConfigSnapshot, error)
	GetSessionStorePath func() string
	LoadModelCatalog    func() []ModelEntry
	ChannelRegistry     ChannelRegistryList
	OutboundRegistry    *outbound.AdapterRegistry
	CronService         interface {
		List(bool) ([]cron.CronJob, error)
		Add(cron.JobCreate) (cron.CronJob, error)
		Remove(string) error
	}
	// GetCronStorePath returns the cron store file path (used for cron.runs run log). May be nil.
	GetCronStorePath func() string
	// Broadcast functions for sending events to websocket clients
	Broadcast          func(event string, payload interface{}, opts *BroadcastOptions)
	BroadcastToConnIds func(event string, payload interface{}, connIds map[string]bool, opts *BroadcastOptions)
	// NodeSendToSession sends event to nodes subscribed to a session (stub for now)
	NodeSendToSession func(sessionKey string, event string, payload interface{})
	// AgentRunSeq tracks sequence numbers for agent/chat events (map[runId]seq)
	AgentRunSeq map[string]int64
	// Config holds the loaded configuration (cached for performance)
	Config *config.OpenOctaConfig
	// MCPTools returns agent tools from configured MCP servers (prometheus, etc.). Nil if MCP not configured.
	MCPTools func(ctx context.Context) ([]tool.Tool, error)
	// InvokeMethod synchronously invokes a gateway method (used by agent tools). Set by server after registry is built.
	InvokeMethod func(method string, params map[string]interface{}) (ok bool, payload interface{}, err *protocol.ErrorShape)
	// HooksWake is called for POST /hooks/wake. If nil, hooks handler returns 501.
	HooksWake func(text string, mode string)
	// HooksAgent is called for POST /hooks/agent. Returns runId; if nil, hooks handler returns 501.
	HooksAgent func(params HooksAgentParams) (runID string)
	// ChannelManager holds runtime channels (IM integrations). Nil if runtime channels are disabled.
	ChannelManager *channels.Manager
	// ReloadChannelRuntimes reloads channel runtimes from current config (stop all, re-register, start). Nil to skip.
	ReloadChannelRuntimes func()
	// MarkChannelLoggedOut is called after successful logout to update in-memory state. Nil to skip.
	MarkChannelLoggedOut func(channelId string, cleared bool, accountId string)
}

// HooksAgentParams is the input for HooksAgent callback.
type HooksAgentParams struct {
	Message        string
	MessageID      string // 用户消息 ID，用于飞书等通道的回复 API
	Name           string
	WakeMode       string
	SessionKey     string
	Deliver        bool
	Channel        string
	To             string
	ChatType       string // "dm"|"group"|"channel" 等，供 QQ 等通道区分发送 API
	Model          string
	Thinking       string
	TimeoutSeconds *int
}

// Handler processes a request and calls respond.
type Handler func(opts HandlerOpts) error

// HandlerOpts is passed to each handler.
type HandlerOpts struct {
	Req     protocol.RequestFrame
	Params  map[string]interface{}
	Client  *Client
	Respond RespondFn
	Context *Context
}

// Registry maps method names to handlers.
type Registry map[string]Handler
