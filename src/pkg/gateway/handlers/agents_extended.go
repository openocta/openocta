package handlers

import (
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// AgentsListHandler handles "agents.list".
func AgentsListHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"agents": []interface{}{},
	}, nil, nil)
	return nil
}

// AgentsCreateHandler handles "agents.create".
func AgentsCreateHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "agents.create not implemented",
	}, nil)
	return nil
}

// AgentsUpdateHandler handles "agents.update".
func AgentsUpdateHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "agents.update not implemented",
	}, nil)
	return nil
}

// AgentsDeleteHandler handles "agents.delete".
func AgentsDeleteHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "agents.delete not implemented",
	}, nil)
	return nil
}

// AgentsFilesListHandler handles "agents.files.list".
func AgentsFilesListHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"files": []interface{}{},
	}, nil, nil)
	return nil
}

// AgentsFilesGetHandler handles "agents.files.get".
func AgentsFilesGetHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    protocol.ErrCodeInvalidRequest,
		Message: "agents.files.get requires agentId and name",
	}, nil)
	return nil
}

// AgentsFilesSetHandler handles "agents.files.set".
func AgentsFilesSetHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "agents.files.set not implemented",
	}, nil)
	return nil
}
