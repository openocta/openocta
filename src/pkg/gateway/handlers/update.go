package handlers

// UpdateRunHandler handles "update.run".
// For Go binaries, self-update is not supported; returns success with status "skipped".
func UpdateRunHandler(opts HandlerOpts) error {
	result := map[string]interface{}{
		"status":     "skipped",
		"mode":       "go",
		"reason":     "Go binary does not support self-update; rebuild from source",
		"steps":      []interface{}{},
		"durationMs": 0,
	}
	opts.Respond(true, map[string]interface{}{
		"ok":      true,
		"result":  result,
		"restart": nil,
		"sentinel": map[string]interface{}{
			"path":    nil,
			"payload": nil,
		},
	}, nil, nil)
	return nil
}
