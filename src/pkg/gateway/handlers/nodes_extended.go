package handlers

import (
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// NodePairRequestHandler handles "node.pair.request".
func NodePairRequestHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"status":  "pending",
		"request": map[string]interface{}{},
	}, nil, nil)
	return nil
}

// NodePairListHandler handles "node.pair.list".
func NodePairListHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"requests": []interface{}{},
	}, nil, nil)
	return nil
}

// NodePairVerifyHandler handles "node.pair.verify".
func NodePairVerifyHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// NodeRenameHandler handles "node.rename".
func NodeRenameHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// NodeListHandler handles "node.list".
func NodeListHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"nodes": []interface{}{},
	}, nil, nil)
	return nil
}

// NodeDescribeHandler handles "node.describe".
func NodeDescribeHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    protocol.ErrCodeInvalidRequest,
		Message: "node.describe requires nodeId",
	}, nil)
	return nil
}

// NodeInvokeHandler handles "node.invoke".
func NodeInvokeHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "node.invoke not implemented",
	}, nil)
	return nil
}

// NodeInvokeResultHandler handles "node.invoke.result" (node role only).
func NodeInvokeResultHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// NodeEventHandler handles "node.event" (node role only).
func NodeEventHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}
