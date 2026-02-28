package handlers

import (
	"encoding/json"

	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// Dispatch dispatches a request to the appropriate handler.
func (r Registry) Dispatch(opts HandlerOpts) error {
	handler := r[opts.Req.Method]
	if handler == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeMethodNotFound,
			Message: "method not found: " + opts.Req.Method,
		}, nil)
		return nil
	}
	opts.Params = unwrapParams(opts.Req)
	return handler(opts)
}

func unwrapParams(req protocol.RequestFrame) map[string]interface{} {
	if req.Params == nil {
		return nil
	}
	if m, ok := req.Params.(map[string]interface{}); ok {
		return m
	}
	b, err := json.Marshal(req.Params)
	if err != nil {
		return nil
	}
	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		return nil
	}
	return m
}
