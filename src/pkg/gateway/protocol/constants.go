package protocol

// Gateway client IDs (from client-info.ts).
const (
	ClientIDWebchatUI   = "webchat-ui"
	ClientIDControlUI   = "openocta-control-ui"
	ClientIDWebchat     = "webchat"
	ClientIDCLI         = "cli"
	ClientIDGateway     = "gateway-client"
	ClientIDMacOSApp    = "openocta-macos"
	ClientIDIOSApp      = "openocta-ios"
	ClientIDAndroidApp  = "openocta-android"
	ClientIDNodeHost    = "node-host"
	ClientIDTest        = "test"
	ClientIDFingerprint = "fingerprint"
	ClientIDProbe       = "openocta-probe"
)

// Gateway client modes.
const (
	ClientModeWebchat = "webchat"
	ClientModeCLI     = "cli"
	ClientModeUI      = "ui"
	ClientModeBackend = "backend"
	ClientModeNode    = "node"
	ClientModeProbe   = "probe"
	ClientModeTest    = "test"
)

// Error codes (from error-codes.ts).
const (
	ErrCodeInvalidRequest     = "invalid_request"
	ErrCodeUnauthorized       = "unauthorized"
	ErrCodeForbidden          = "forbidden"
	ErrCodeNotFound           = "not_found"
	ErrCodeMethodNotFound     = "method_not_found"
	ErrCodeConflict           = "conflict"
	ErrCodeInternal           = "internal"
	ErrCodeServiceUnavailable = "service_unavailable"
)
