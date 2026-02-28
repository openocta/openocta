// Package session provides session and transcript path resolution.
// Mirrors src/config/sessions/paths.ts.
package session

import (
	"path/filepath"
	"regexp"
	"strings"

	"github.com/openocta/openocta/pkg/paths"
)

const (
	// DefaultAgentID is the default agent identifier.
	DefaultAgentID = "main"
)

// SafeSessionIDRe validates session IDs.
var SafeSessionIDRe = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]{0,127}$`)

// ResolveAgentSessionsDir returns the sessions directory for an agent.
func ResolveAgentSessionsDir(agentID string, env func(string) string) string {
	stateDir := paths.ResolveStateDir(env)
	id := normalizeAgentID(agentID)
	return filepath.Join(stateDir, "agents", id, "sessions")
}

// ResolveSessionTranscriptsDir returns the default agent sessions dir.
func ResolveSessionTranscriptsDir(env func(string) string) string {
	return ResolveAgentSessionsDir(DefaultAgentID, env)
}

// ResolveSessionFilePath returns the transcript file path for a session.
func ResolveSessionFilePath(sessionID string, opts *SessionPathOptions, env func(string) string) string {
	sessionsDir := ResolveSessionTranscriptsDir(env)
	if opts != nil && opts.SessionsDir != "" {
		sessionsDir = opts.SessionsDir
	}
	// Session files are stored as <sessionId>.jsonl in sessions dir
	return filepath.Join(sessionsDir, sessionID+".jsonl")
}

// SessionPathOptions holds options for resolving session paths.
type SessionPathOptions struct {
	AgentID     string
	SessionsDir string
}

// ValidateSessionID validates and returns trimmed session ID.
func ValidateSessionID(sessionID string) (string, error) {
	s := strings.TrimSpace(sessionID)
	if s == "" {
		return "", ErrEmptySessionID
	}
	if !SafeSessionIDRe.MatchString(s) {
		return "", ErrInvalidSessionID
	}
	return s, nil
}

// ErrEmptySessionID is returned when session ID is empty.
var ErrEmptySessionID = &SessionError{Msg: "session ID must not be empty"}

// ErrInvalidSessionID is returned when session ID format is invalid.
var ErrInvalidSessionID = &SessionError{Msg: "invalid session ID format"}

// SessionError is a session-related error.
type SessionError struct {
	Msg string
}

func (e *SessionError) Error() string {
	return e.Msg
}

func normalizeAgentID(id string) string {
	s := strings.TrimSpace(strings.ToLower(id))
	if s == "" {
		return DefaultAgentID
	}
	return s
}
