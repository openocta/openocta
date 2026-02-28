package handlers

import (
	"time"
)

// LastHeartbeatHandler handles "last-heartbeat".
func LastHeartbeatHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{
		"ts": time.Now().UnixMilli(),
	}, nil, nil)
	return nil
}

// SystemPresenceHandler handles "system-presence".
func SystemPresenceHandler(opts HandlerOpts) error {
	opts.Respond(true, []interface{}{}, nil, nil)
	return nil
}

// WakeHandler handles "wake".
func WakeHandler(opts HandlerOpts) error {
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}
