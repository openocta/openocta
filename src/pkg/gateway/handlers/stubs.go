// Package handlers provides stub implementations for Gateway methods
// used by macOS/iOS/Android apps. Full implementations in later phases.
package handlers

import (
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// SetHeartbeatsHandler handles "set-heartbeats" (stub: no-op).
func SetHeartbeatsHandler(opts HandlerOpts) error {
	enabled := false
	if v, ok := opts.Params["enabled"].(bool); ok {
		enabled = v
	}
	opts.Respond(true, map[string]interface{}{"ok": true, "enabled": enabled}, nil, nil)
	return nil
}

// SystemEventHandler handles "system-event" (stub: no-op).
func SystemEventHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// WizardStubHandler handles wizard.* methods (stub).
func WizardStubHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "wizard not implemented",
	}, nil)
	return nil
}

// TalkModeHandler handles "talk.mode" (stub: no-op).
func TalkModeHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// WebLoginStubHandler handles web.login.* (stub).
func WebLoginStubHandler(opts HandlerOpts) error {
	opts.Respond(false, nil, &protocol.ErrorShape{
		Code:    "method_not_implemented",
		Message: "web.login not implemented",
	}, nil)
	return nil
}

// SkillsStatusHandler, SkillsInstallHandler, and SkillsUpdateHandler are now in skills.go

// VoicewakeGetHandler handles "voicewake.get" (stub: empty triggers).
func VoicewakeGetHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"triggers": []interface{}{}}, nil, nil)
	return nil
}

// VoicewakeSetHandler handles "voicewake.set" (stub: no-op).
func VoicewakeSetHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// NodePairApproveHandler handles "node.pair.approve" (stub).
func NodePairApproveHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// NodePairRejectHandler handles "node.pair.reject" (stub).
func NodePairRejectHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// DevicePairListHandler handles "device.pair.list" (stub: empty list).
func DevicePairListHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"requests": []interface{}{}}, nil, nil)
	return nil
}

// DevicePairApproveHandler handles "device.pair.approve" (stub).
func DevicePairApproveHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// DevicePairRejectHandler handles "device.pair.reject" (stub).
func DevicePairRejectHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// ExecApprovalResolveHandler handles "exec.approval.resolve" (stub).
func ExecApprovalResolveHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}
