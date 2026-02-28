// Package tools bridges OpenOcta tools to agentsdk-go tool.Tool interface.
package tools

// GatewayInvoker invokes gateway methods synchronously (used by agent tools).
// Implementations are provided by the gateway when creating the runtime.
type GatewayInvoker interface {
	Invoke(method string, params map[string]interface{}) (ok bool, payload interface{}, err error)
}
