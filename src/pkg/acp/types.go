// Package acp provides Agent Control Protocol types and stubs.
package acp

// Session represents an ACP session.
type Session struct {
	SessionID  string
	SessionKey string
	CWD        string
	CreatedAt  int64
}

// ServerOptions configures the ACP server.
type ServerOptions struct {
	GatewayURL             string
	GatewayToken           string
	GatewayPassword        string
	DefaultSessionKey      string
	DefaultSessionLabel    string
	RequireExistingSession bool
	ResetSession           bool
	PrefixCWD              bool
	Verbose                bool
}

// AgentInfo identifies the ACP agent.
var AgentInfo = struct {
	Name    string
	Title   string
	Version string
}{
	Name:    "openocta-acp",
	Title:   "OpenOcta ACP Gateway",
	Version: "0.0.1-dev",
}
