package handlers

import (
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// ExecApprovalsGetHandler handles "exec.approvals.get".
func ExecApprovalsGetHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"hash":   "",
		"file":   map[string]interface{}{},
		"exists": false,
	}, nil, nil)
	return nil
}

// ExecApprovalsSetHandler handles "exec.approvals.set".
func ExecApprovalsSetHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "exec.approvals.set not implemented",
	}, nil)
	return nil
}

// ExecApprovalsNodeGetHandler handles "exec.approvals.node.get".
func ExecApprovalsNodeGetHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{}, nil, nil)
	return nil
}

// ExecApprovalsNodeSetHandler handles "exec.approvals.node.set".
func ExecApprovalsNodeSetHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "exec.approvals.node.set not implemented",
	}, nil)
	return nil
}

// ExecApprovalRequestHandler handles "exec.approval.request".
func ExecApprovalRequestHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "exec.approval.request not implemented",
	}, nil)
	return nil
}
