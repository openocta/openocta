package handlers

import (
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// AgentIdentityGetHandler handles "agent.identity.get".
func AgentIdentityGetHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"agentId": "",
		"name":    "",
	}, nil, nil)
	return nil
}

// AgentWaitHandler handles "agent.wait".
func AgentWaitHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "agent.wait not implemented",
	}, nil)
	return nil
}
