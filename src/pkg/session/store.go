// Package session provides session store loading.
// Mirrors src/config/sessions/store.ts loadSessionStore.
package session

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// SessionEntry is a minimal session store entry.
// Mirrors SessionEntry from src/config/sessions/types.ts.
// Extended with systemPromptReport, skillsSnapshot, tools for UI and next-session load.
type SessionEntry struct {
	SessionID          string      `json:"sessionId"`
	UpdatedAt          int64       `json:"updatedAt"`
	SessionFile        string      `json:"sessionFile,omitempty"`
	Label              string      `json:"label,omitempty"`
	SpawnedBy          string      `json:"spawnedBy,omitempty"`
	Channel            string      `json:"channel,omitempty"`
	ChatType           string      `json:"chatType,omitempty"`
	ThinkingLevel      string      `json:"thinkingLevel,omitempty"`
	VerboseLevel       string      `json:"verboseLevel,omitempty"`
	SystemPromptReport interface{} `json:"systemPromptReport,omitempty"`
	SkillsSnapshot     interface{} `json:"skillsSnapshot,omitempty"`
	Tools              interface{} `json:"tools,omitempty"`
}

// SessionStore is a map of key -> SessionEntry.
type SessionStore map[string]SessionEntry

// ResolveDefaultSessionStorePath returns the default sessions.json path for an agent.
func ResolveDefaultSessionStorePath(agentID string, env func(string) string) string {
	sessionsDir := ResolveAgentSessionsDir(agentID, env)
	return filepath.Join(sessionsDir, "sessions.json")
}

// LoadSessionStore reads sessions.json and returns the store.
func LoadSessionStore(storePath string) (SessionStore, error) {
	data, err := os.ReadFile(storePath)
	if err != nil {
		if os.IsNotExist(err) {
			return SessionStore{}, nil
		}
		return nil, err
	}
	var store SessionStore
	if err := json.Unmarshal(data, &store); err != nil {
		return nil, err
	}
	if store == nil {
		store = SessionStore{}
	}
	return store, nil
}

// LoadCombinedSessionStore loads and merges session stores for the given agents.
// If agentIDs is empty, uses ["main"].
func LoadCombinedSessionStore(env func(string) string, agentIDs []string) (storePath string, store SessionStore) {
	if len(agentIDs) == 0 {
		agentIDs = []string{"main"}
	}
	store = SessionStore{}
	for _, agentID := range agentIDs {
		p := ResolveDefaultSessionStorePath(agentID, env)
		s, err := LoadSessionStore(p)
		if err != nil {
			continue
		}
		for k, e := range s {
			canonical := k
			if agentID != "main" && !strings.HasPrefix(k, "agent:") {
				canonical = "agent:" + agentID + ":" + k
			}
			store[canonical] = e
			// Only add agent:agentID:sessionID alias when key is bare (e.g. bare sessionID).
			// Skip when key already has agent: prefix to avoid duplicate like
			// "agent:main:channel:feishu:oc_xxx" vs "agent:main:channel-feishu-oc_xxx".
			if e.SessionID != "" && !strings.HasPrefix(k, "agent:") {
				store["agent:"+agentID+":"+e.SessionID] = e
			}
		}
		if storePath == "" {
			storePath = p
		}
	}
	if len(agentIDs) > 1 {
		storePath = "(multiple)"
	}
	return storePath, store
}

// SaveSessionStore writes the session store back to disk.
func SaveSessionStore(storePath string, store SessionStore) error {
	if storePath == "" {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(storePath), 0o755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(storePath, data, 0o644)
}

// UpdateSessionUpdatedAt updates or creates a session entry's updatedAt for the given agent/session.
// This mirrors the behavior of touching a session on new activity.
func UpdateSessionUpdatedAt(agentID, sessionID string, env func(string) string, nowMs int64) error {
	if env == nil {
		env = os.Getenv
	}
	if nowMs == 0 {
		nowMs = time.Now().UnixMilli()
	}
	id := normalizeAgentID(agentID)
	storePath := ResolveDefaultSessionStorePath(id, env)
	store, err := LoadSessionStore(storePath)
	if err != nil {
		return err
	}
	if store == nil {
		store = SessionStore{}
	}

	// Try to find an existing entry for this session.
	canonicalKey := "agent:" + id + ":" + sessionID
	for k, e := range store {
		if k == sessionID || k == canonicalKey || e.SessionID == sessionID {
			e.UpdatedAt = nowMs
			if e.SessionID == "" {
				e.SessionID = sessionID
			}
			store[k] = e
			return SaveSessionStore(storePath, store)
		}
	}

	// If not found, do NOT create entry keyed by bare sessionID.
	// Creating store[sessionID] would produce a duplicate key (e.g. "channel-feishu-oc_xxx")
	// that differs from the canonical sessionKey (e.g. "agent:main:channel:feishu:oc_xxx").
	// The entry will be created by updateSessionAfterRun with the correct sessionKey.
	return nil
}
