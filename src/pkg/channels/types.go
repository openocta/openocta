// Package channels provides channel abstraction and registry.
package channels

// ChannelId identifies a channel (e.g. "telegram", "whatsapp", "discord").
type ChannelId = string

// ChannelMeta holds channel metadata.
type ChannelMeta struct {
	ID             string   `json:"id"`
	Label          string   `json:"label"`
	SelectionLabel string   `json:"selectionLabel,omitempty"`
	DocsPath       string   `json:"docsPath,omitempty"`
	DocsLabel      string   `json:"docsLabel,omitempty"`
	Blurb          string   `json:"blurb,omitempty"`
	Order          int      `json:"order,omitempty"`
	Aliases        []string `json:"aliases,omitempty"`
	SystemImage    string   `json:"systemImage,omitempty"`
}

// ChannelAccountSnapshot is a per-account status snapshot.
type ChannelAccountSnapshot struct {
	AccountID       string                 `json:"accountId"`
	Name            string                 `json:"name,omitempty"`
	Enabled         *bool                  `json:"enabled,omitempty"`
	Configured      *bool                  `json:"configured,omitempty"`
	Linked          *bool                  `json:"linked,omitempty"`
	Running         *bool                  `json:"running,omitempty"`
	Connected       *bool                  `json:"connected,omitempty"`
	LastConnectedAt *int64                 `json:"lastConnectedAt,omitempty"`
	LastError       string                 `json:"lastError,omitempty"`
	LastStartAt     *int64                 `json:"lastStartAt,omitempty"`
	LastStopAt      *int64                 `json:"lastStopAt,omitempty"`
	LastInboundAt   *int64                 `json:"lastInboundAt,omitempty"`
	LastOutboundAt  *int64                 `json:"lastOutboundAt,omitempty"`
	LastProbeAt     *int64                 `json:"lastProbeAt,omitempty"`
	Port            *int                   `json:"port,omitempty"`
	Probe           interface{}            `json:"probe,omitempty"`
	AppID           string                 `json:"appId,omitempty"`
	Domain          string                 `json:"domain,omitempty"`
	Extra           map[string]interface{} `json:"-"`
}

// ChannelPlugin is the minimal plugin interface for Phase 4a.
type ChannelPlugin interface {
	ID() ChannelId
	Meta() ChannelMeta
	GatewayMethods() []string
}

// LogoutContext is passed to ChannelGatewayPlugin.LogoutAccount.
type LogoutContext struct {
	Config    interface{} // *config.OpenOctaConfig
	AccountID string
	Account   interface{} // resolved account config
}

// LogoutResult is returned by ChannelGatewayPlugin.LogoutAccount.
type LogoutResult struct {
	Cleared   bool
	LoggedOut bool
}

// ChannelGatewayPlugin extends ChannelPlugin with gateway lifecycle (logout).
// Plugins that support channels.logout implement this interface.
type ChannelGatewayPlugin interface {
	ChannelPlugin
	LogoutAccount(ctx *LogoutContext) (*LogoutResult, error)
}

// ChannelConfigPlugin extends ChannelPlugin with config-driven account resolution.
// Used by channels.status for listAccountIds, resolveAccount, defaultAccountId.
type ChannelConfigPlugin interface {
	ChannelPlugin
	ListAccountIds(cfg interface{}) []string
	ResolveAccount(cfg interface{}, accountId string) interface{}
	DefaultAccountId(cfg interface{}) string
}

// ChannelStatusPlugin extends ChannelPlugin with probe/audit and snapshot building.
// Used by channels.status when probe=true for richer account status.
type ChannelStatusPlugin interface {
	ChannelPlugin
	ProbeAccount(ctx *ProbeContext) (interface{}, error)
	BuildAccountSnapshot(ctx *SnapshotContext) (*ChannelAccountSnapshot, error)
	BuildChannelSummary(ctx *SummaryContext) (map[string]interface{}, error)
}

// ProbeContext is passed to ChannelStatusPlugin.ProbeAccount.
type ProbeContext struct {
	Account   interface{}
	TimeoutMs int
	Config    interface{}
}

// SnapshotContext is passed to ChannelStatusPlugin.BuildAccountSnapshot.
type SnapshotContext struct {
	AccountID string
	Account   interface{}
	Config    interface{}
	Runtime   *ChannelAccountSnapshot
	Probe     interface{}
	Audit     interface{}
}

// SummaryContext is passed to ChannelStatusPlugin.BuildChannelSummary.
type SummaryContext struct {
	Account          interface{}
	DefaultAccountId string
	Snapshot         *ChannelAccountSnapshot
	Config           interface{}
}
