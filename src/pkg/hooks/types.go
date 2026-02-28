// Package hooks provides the OpenOcta hook system for agent events.
package hooks

import "time"

// EventType is the hook event category.
type EventType string

const (
	EventCommand EventType = "command"
	EventSession EventType = "session"
	EventAgent   EventType = "agent"
	EventGateway EventType = "gateway"
)

// Event represents a hook event.
type Event struct {
	Type       EventType      `json:"type"`
	Action     string         `json:"action"`
	SessionKey string         `json:"sessionKey"`
	Context    map[string]any `json:"context"`
	Timestamp  time.Time      `json:"timestamp"`
	Messages   []string       `json:"messages"`
}

// Handler is a hook handler function.
type Handler func(event *Event) error
