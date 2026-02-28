package handlers

import (
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// DeviceTokenRotateHandler handles "device.token.rotate".
func DeviceTokenRotateHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "device.token.rotate not implemented",
	}, nil)
	return nil
}

// DeviceTokenRevokeHandler handles "device.token.revoke".
func DeviceTokenRevokeHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "device.token.revoke not implemented",
	}, nil)
	return nil
}
