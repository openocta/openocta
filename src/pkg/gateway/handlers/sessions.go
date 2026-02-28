package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/session"
)

// SessionsListParams matches SessionsListParams from TypeScript.
type SessionsListParams struct {
	Limit                *int    `json:"limit,omitempty"`
	ActiveMinutes        *int    `json:"activeMinutes,omitempty"`
	IncludeGlobal        *bool   `json:"includeGlobal,omitempty"`
	IncludeUnknown       *bool   `json:"includeUnknown,omitempty"`
	IncludeDerivedTitles *bool   `json:"includeDerivedTitles,omitempty"`
	IncludeLastMessage   *bool   `json:"includeLastMessage,omitempty"`
	Label                *string `json:"label,omitempty"`
	SpawnedBy            *string `json:"spawnedBy,omitempty"`
	AgentID              *string `json:"agentId,omitempty"`
	Search               *string `json:"search,omitempty"`
}

// SessionsPreviewParams matches SessionsPreviewParams from TypeScript.
type SessionsPreviewParams struct {
	Keys     []string `json:"keys"`
	Limit    *int     `json:"limit,omitempty"`
	MaxChars *int     `json:"maxChars,omitempty"`
}

// SessionsPatchParams matches SessionsPatchParams from TypeScript.
type SessionsPatchParams struct {
	Key             string  `json:"key"`
	Label           *string `json:"label,omitempty"`
	ThinkingLevel   *string `json:"thinkingLevel,omitempty"`
	VerboseLevel    *string `json:"verboseLevel,omitempty"`
	ReasoningLevel  *string `json:"reasoningLevel,omitempty"`
	ResponseUsage   *string `json:"responseUsage,omitempty"`
	ElevatedLevel   *string `json:"elevatedLevel,omitempty"`
	ExecHost        *string `json:"execHost,omitempty"`
	ExecSecurity    *string `json:"execSecurity,omitempty"`
	ExecAsk         *string `json:"execAsk,omitempty"`
	ExecNode        *string `json:"execNode,omitempty"`
	Model           *string `json:"model,omitempty"`
	SpawnedBy       *string `json:"spawnedBy,omitempty"`
	SendPolicy      *string `json:"sendPolicy,omitempty"`
	GroupActivation *string `json:"groupActivation,omitempty"`
}

// SessionsResetParams matches SessionsResetParams from TypeScript.
type SessionsResetParams struct {
	Key string `json:"key"`
}

// SessionsDeleteParams matches SessionsDeleteParams from TypeScript.
type SessionsDeleteParams struct {
	Key              string `json:"key"`
	DeleteTranscript *bool  `json:"deleteTranscript,omitempty"`
}

// SessionsCompactParams matches SessionsCompactParams from TypeScript.
type SessionsCompactParams struct {
	Key      string `json:"key"`
	MaxLines *int   `json:"maxLines,omitempty"`
}

// SessionsListResult matches SessionsListResult from TypeScript.
type SessionsListResult struct {
	Ts       int64                   `json:"ts"`
	Path     string                  `json:"path"`
	Count    int                     `json:"count"`
	Defaults GatewaySessionsDefaults `json:"defaults"`
	Sessions []GatewaySessionRow     `json:"sessions"`
}

// GatewaySessionsDefaults matches GatewaySessionsDefaults from TypeScript.
type GatewaySessionsDefaults struct {
	ModelProvider string `json:"modelProvider"`
	Model         string `json:"model"`
	ContextTokens *int   `json:"contextTokens,omitempty"`
}

// GatewaySessionRow matches GatewaySessionRow from TypeScript.
type GatewaySessionRow struct {
	Key                string                 `json:"key"`
	Kind               string                 `json:"kind"`
	Label              *string                `json:"label,omitempty"`
	DisplayName        *string                `json:"displayName,omitempty"`
	DerivedTitle       *string                `json:"derivedTitle,omitempty"`
	LastMessagePreview *string                `json:"lastMessagePreview,omitempty"`
	Channel            *string                `json:"channel,omitempty"`
	Subject            *string                `json:"subject,omitempty"`
	GroupChannel       *string                `json:"groupChannel,omitempty"`
	Space              *string                `json:"space,omitempty"`
	ChatType           *string                `json:"chatType,omitempty"`
	Origin             map[string]interface{} `json:"origin,omitempty"`
	UpdatedAt          *int64                 `json:"updatedAt,omitempty"`
	SessionID          *string                `json:"sessionId,omitempty"`
	SystemSent         *bool                  `json:"systemSent,omitempty"`
	AbortedLastRun     *bool                  `json:"abortedLastRun,omitempty"`
	ThinkingLevel      *string                `json:"thinkingLevel,omitempty"`
	VerboseLevel       *string                `json:"verboseLevel,omitempty"`
	ReasoningLevel     *string                `json:"reasoningLevel,omitempty"`
	ElevatedLevel      *string                `json:"elevatedLevel,omitempty"`
	SendPolicy         *string                `json:"sendPolicy,omitempty"`
	InputTokens        *int                   `json:"inputTokens,omitempty"`
	OutputTokens       *int                   `json:"outputTokens,omitempty"`
	TotalTokens        *int                   `json:"totalTokens,omitempty"`
	ResponseUsage      *string                `json:"responseUsage,omitempty"`
	ModelProvider      *string                `json:"modelProvider,omitempty"`
	Model              *string                `json:"model,omitempty"`
	ContextTokens      *int                   `json:"contextTokens,omitempty"`
	DeliveryContext    map[string]interface{} `json:"deliveryContext,omitempty"`
	LastChannel        *string                `json:"lastChannel,omitempty"`
	LastTo             *string                `json:"lastTo,omitempty"`
	LastAccountID      *string                `json:"lastAccountId,omitempty"`
}

// SessionsPreviewResult matches SessionsPreviewResult from TypeScript.
type SessionsPreviewResult struct {
	Ts       int64             `json:"ts"`
	Previews []SessionsPreview `json:"previews"`
}

// SessionsPreview matches SessionsPreviewEntry from TypeScript.
type SessionsPreview struct {
	Key    string        `json:"key"`
	Status string        `json:"status"`
	Items  []PreviewItem `json:"items"`
}

// PreviewItem matches SessionPreviewItem from TypeScript.
type PreviewItem struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

// SessionsPatchResult matches SessionsPatchResult from TypeScript.
type SessionsPatchResult struct {
	OK       bool                   `json:"ok"`
	Path     string                 `json:"path"`
	Key      string                 `json:"key"`
	Entry    map[string]interface{} `json:"entry"`
	Resolved *struct {
		ModelProvider *string `json:"modelProvider,omitempty"`
		Model         *string `json:"model,omitempty"`
	} `json:"resolved,omitempty"`
}

// SessionsResetResult matches the reset response from TypeScript.
type SessionsResetResult struct {
	OK    bool                   `json:"ok"`
	Key   string                 `json:"key"`
	Entry map[string]interface{} `json:"entry"`
}

// SessionsDeleteResult matches the delete response from TypeScript.
type SessionsDeleteResult struct {
	OK       bool     `json:"ok"`
	Key      string   `json:"key"`
	Deleted  bool     `json:"deleted"`
	Archived []string `json:"archived"`
}

// SessionsCompactResult matches the compact response from TypeScript.
type SessionsCompactResult struct {
	OK        bool    `json:"ok"`
	Key       string  `json:"key"`
	Compacted bool    `json:"compacted"`
	Archived  *string `json:"archived,omitempty"`
	Kept      *int    `json:"kept,omitempty"`
	Reason    *string `json:"reason,omitempty"`
}

// SessionsListHandler handles "sessions.list".
func SessionsListHandler(opts HandlerOpts) error {
	// Parse and validate params
	params, err := parseSessionsListParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid sessions.list params: %v", err),
		}, nil)
		return nil
	}

	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		cfg = &config.OpenOctaConfig{}
	}

	env := func(k string) string { return os.Getenv(k) }
	storePath, store := loadCombinedSessionStoreForGateway(cfg, env)
	result := listSessionsFromStore(cfg, storePath, store, params)
	opts.Respond(true, result, nil, nil)
	return nil
}

// SessionsPreviewHandler handles "sessions.preview".
func SessionsPreviewHandler(opts HandlerOpts) error {
	// Parse and validate params
	params, err := parseSessionsPreviewParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid sessions.preview params: %v", err),
		}, nil)
		return nil
	}

	keys := params.Keys
	if len(keys) > 64 {
		keys = keys[:64]
	}
	if len(keys) == 0 {
		opts.Respond(true, &SessionsPreviewResult{
			Ts:       time.Now().UnixMilli(),
			Previews: []SessionsPreview{},
		}, nil, nil)
		return nil
	}

	limit := 12
	if params.Limit != nil && *params.Limit >= 1 {
		limit = *params.Limit
	}
	maxChars := 240
	if params.MaxChars != nil && *params.MaxChars >= 20 {
		maxChars = *params.MaxChars
	}
	if maxChars > 2000 {
		maxChars = 2000
	}

	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		cfg = &config.OpenOctaConfig{}
	}

	env := func(k string) string { return os.Getenv(k) }
	storeCache := make(map[string]session.SessionStore)
	var previews []SessionsPreview

	for _, key := range keys {
		preview, err := resolveSessionPreviewForGateway(cfg, key, storeCache, limit, maxChars, env)
		if err != nil {
			previews = append(previews, SessionsPreview{Key: key, Status: "error", Items: []PreviewItem{}})
			continue
		}
		previews = append(previews, preview)
	}

	opts.Respond(true, &SessionsPreviewResult{
		Ts:       time.Now().UnixMilli(),
		Previews: previews,
	}, nil, nil)
	return nil
}

// SessionsPatchHandler handles "sessions.patch".
func SessionsPatchHandler(opts HandlerOpts) error {
	// Parse and validate params
	params, err := parseSessionsPatchParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid sessions.patch params: %v", err),
		}, nil)
		return nil
	}

	key := strings.TrimSpace(params.Key)
	if key == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "key required",
		}, nil)
		return nil
	}

	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config not available",
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, key, env)
	storePath := target.storePath

	updated, err := updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey := target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = key
		}
		existingKey := ""
		for _, candidate := range target.storeKeys {
			if _, ok := store[candidate]; ok {
				existingKey = candidate
				break
			}
		}
		if existingKey != "" && existingKey != primaryKey && store[primaryKey].SessionID == "" {
			store[primaryKey] = store[existingKey]
			delete(store, existingKey)
		}
		patched, patchErr := applySessionsPatchToStore(cfg, store, primaryKey, params)
		if patchErr != nil {
			return session.SessionEntry{}, patchErr
		}
		return patched, nil
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: err.Error(),
		}, nil)
		return nil
	}

	resolved := resolveSessionModelRef(cfg, updated, target.agentID)
	entryMap := sessionEntryToMap(updated)
	result := SessionsPatchResult{
		OK:    true,
		Path:  storePath,
		Key:   target.canonicalKey,
		Entry: entryMap,
		Resolved: &struct {
			ModelProvider *string `json:"modelProvider,omitempty"`
			Model         *string `json:"model,omitempty"`
		}{
			ModelProvider: &resolved.provider,
			Model:         &resolved.model,
		},
	}
	opts.Respond(true, result, nil, nil)
	return nil
}

// SessionsResetHandler handles "sessions.reset".
func SessionsResetHandler(opts HandlerOpts) error {
	// Parse and validate params
	params, err := parseSessionsResetParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid sessions.reset params: %v", err),
		}, nil)
		return nil
	}

	key := strings.TrimSpace(params.Key)
	if key == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "key required",
		}, nil)
		return nil
	}

	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config not available",
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, key, env)
	storePath := target.storePath

	next, err := updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey := target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = key
		}
		existingKey := ""
		for _, candidate := range target.storeKeys {
			if _, ok := store[candidate]; ok {
				existingKey = candidate
				break
			}
		}
		if existingKey != "" && existingKey != primaryKey && store[primaryKey].SessionID == "" {
			store[primaryKey] = store[existingKey]
			delete(store, existingKey)
		}
		entry := store[primaryKey]
		now := time.Now().UnixMilli()
		newSessionID := uuid.New().String()
		nextEntry := session.SessionEntry{
			SessionID:     newSessionID,
			UpdatedAt:     now,
			SessionFile:   newSessionID + ".jsonl",
			Label:         entry.Label,
			Channel:       entry.Channel,
			ChatType:      entry.ChatType,
			ThinkingLevel: entry.ThinkingLevel,
			VerboseLevel:  entry.VerboseLevel,
		}
		store[primaryKey] = nextEntry
		return nextEntry, nil
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}

	result := SessionsResetResult{
		OK:    true,
		Key:   target.canonicalKey,
		Entry: sessionEntryToMap(next),
	}
	opts.Respond(true, result, nil, nil)
	return nil
}

// SessionsDeleteHandler handles "sessions.delete".
func SessionsDeleteHandler(opts HandlerOpts) error {
	// Parse and validate params
	params, err := parseSessionsDeleteParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid sessions.delete params: %v", err),
		}, nil)
		return nil
	}

	key := strings.TrimSpace(params.Key)
	if key == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "key required",
		}, nil)
		return nil
	}

	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config not available",
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	mainKey := resolveMainSessionKey(cfg)
	target := resolveGatewaySessionStoreTarget(cfg, key, env)
	if target.canonicalKey == mainKey {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("Cannot delete the main session (%s).", mainKey),
		}, nil)
		return nil
	}

	deleteTranscript := true
	if params.DeleteTranscript != nil {
		deleteTranscript = *params.DeleteTranscript
	}

	storePath := target.storePath
	entry, existed := loadSessionEntryFromStore(storePath, key, target.storeKeys)
	sessionID := entry.SessionID

	var archived []string
	if deleteTranscript && sessionID != "" {
		candidates := resolveSessionTranscriptCandidates(sessionID, storePath, entry.SessionFile, target.agentID, env)
		for _, candidate := range candidates {
			if _, err := os.Stat(candidate); err != nil {
				continue
			}
			archivedPath := archiveFileOnDisk(candidate, "deleted")
			if archivedPath != "" {
				archived = append(archived, archivedPath)
			}
		}
	}

	_, err = updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey := target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = key
		}
		existingKey := ""
		for _, candidate := range target.storeKeys {
			if _, ok := store[candidate]; ok {
				existingKey = candidate
				break
			}
		}
		if existingKey != "" && existingKey != primaryKey && store[primaryKey].SessionID == "" {
			store[primaryKey] = store[existingKey]
			delete(store, existingKey)
		}
		if store[primaryKey].SessionID != "" {
			delete(store, primaryKey)
		}
		return session.SessionEntry{}, nil
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}

	result := SessionsDeleteResult{
		OK:       true,
		Key:      target.canonicalKey,
		Deleted:  existed,
		Archived: archived,
	}
	opts.Respond(true, result, nil, nil)
	return nil
}

// SessionsCompactHandler handles "sessions.compact".
func SessionsCompactHandler(opts HandlerOpts) error {
	// Parse and validate params
	params, err := parseSessionsCompactParams(opts.Params)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: fmt.Sprintf("invalid sessions.compact params: %v", err),
		}, nil)
		return nil
	}

	key := strings.TrimSpace(params.Key)
	if key == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "key required",
		}, nil)
		return nil
	}

	maxLines := 400
	if params.MaxLines != nil && *params.MaxLines >= 1 {
		maxLines = *params.MaxLines
	}

	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "config not available",
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, key, env)
	storePath := target.storePath

	var entry session.SessionEntry
	var primaryKey string
	_, err = updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		primaryKey = target.storeKeys[0]
		if primaryKey == "" {
			primaryKey = key
		}
		existingKey := ""
		for _, candidate := range target.storeKeys {
			if _, ok := store[candidate]; ok {
				existingKey = candidate
				break
			}
		}
		if existingKey != "" && existingKey != primaryKey && store[primaryKey].SessionID == "" {
			store[primaryKey] = store[existingKey]
			delete(store, existingKey)
		}
		entry = store[primaryKey]
		return entry, nil
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}

	sessionID := entry.SessionID
	if sessionID == "" {
		reason := "no sessionId"
		result := SessionsCompactResult{
			OK:        true,
			Key:       target.canonicalKey,
			Compacted: false,
			Reason:    &reason,
		}
		opts.Respond(true, result, nil, nil)
		return nil
	}

	candidates := resolveSessionTranscriptCandidates(sessionID, storePath, entry.SessionFile, target.agentID, env)
	var filePath string
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			filePath = candidate
			break
		}
	}
	if filePath == "" {
		reason := "no transcript"
		result := SessionsCompactResult{
			OK:        true,
			Key:       target.canonicalKey,
			Compacted: false,
			Reason:    &reason,
		}
		opts.Respond(true, result, nil, nil)
		return nil
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}

	lines := strings.Split(string(data), "\n")
	var nonEmptyLines []string
	for _, line := range lines {
		if strings.TrimSpace(line) != "" {
			nonEmptyLines = append(nonEmptyLines, line)
		}
	}

	if len(nonEmptyLines) <= maxLines {
		kept := len(nonEmptyLines)
		result := SessionsCompactResult{
			OK:        true,
			Key:       target.canonicalKey,
			Compacted: false,
			Kept:      &kept,
		}
		opts.Respond(true, result, nil, nil)
		return nil
	}

	archived := archiveFileOnDisk(filePath, "bak")
	if archived == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "failed to archive file",
		}, nil)
		return nil
	}

	keptLines := nonEmptyLines[len(nonEmptyLines)-maxLines:]
	content := strings.Join(keptLines, "\n") + "\n"
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}

	_, err = updateSessionStore(storePath, func(store session.SessionStore) (session.SessionEntry, error) {
		entryToUpdate := store[primaryKey]
		entryToUpdate.UpdatedAt = time.Now().UnixMilli()
		store[primaryKey] = entryToUpdate
		return entryToUpdate, nil
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: err.Error(),
		}, nil)
		return nil
	}

	kept := len(keptLines)
	result := SessionsCompactResult{
		OK:        true,
		Key:       target.canonicalKey,
		Compacted: true,
		Archived:  &archived,
		Kept:      &kept,
	}
	opts.Respond(true, result, nil, nil)
	return nil
}

// Helper types and functions

type sessionStoreTarget struct {
	agentID      string
	storePath    string
	canonicalKey string
	storeKeys    []string
}

// loadConfigFromContext loads config from context or returns nil.
func loadConfigFromContext(ctx *Context) *config.OpenOctaConfig {
	if ctx == nil {
		return nil
	}
	if ctx.Config != nil {
		return ctx.Config
	}
	if ctx.LoadConfigSnapshot != nil {
		snap, err := ctx.LoadConfigSnapshot()
		if err == nil && snap != nil {
			return snap.Config
		}
	}
	return nil
}

// ResolveMainSessionKey returns the main session key from config (exported for hooks).
func ResolveMainSessionKey(cfg *config.OpenOctaConfig) string {
	if cfg == nil || cfg.Session == nil || cfg.Session.MainKey == nil {
		return "main"
	}
	key := strings.TrimSpace(*cfg.Session.MainKey)
	if key == "" {
		return "main"
	}
	return strings.ToLower(key)
}

// resolveMainSessionKey resolves the main session key from config.
func resolveMainSessionKey(cfg *config.OpenOctaConfig) string {
	return ResolveMainSessionKey(cfg)
}

// resolveSessionStoreKey resolves the canonical session store key.
func resolveSessionStoreKey(cfg *config.OpenOctaConfig, sessionKey string) string {
	raw := strings.TrimSpace(sessionKey)
	if raw == "" {
		return raw
	}
	if raw == "global" || raw == "unknown" {
		return raw
	}
	// Parse agent:agentId:sessionId format
	parts := strings.SplitN(raw, ":", 3)
	if len(parts) >= 3 && strings.ToLower(parts[0]) == "agent" {
		agentID := strings.TrimSpace(strings.ToLower(parts[1]))
		sessionID := parts[2]
		return "agent:" + agentID + ":" + sessionID
	}
	// Check if it's main session alias
	mainKey := resolveMainSessionKey(cfg)
	if raw == "main" || raw == mainKey {
		return mainKey
	}
	// Default to agent:main:key format
	return "agent:main:" + raw
}

// resolveSessionStoreAgentID resolves agent ID from canonical key.
func resolveSessionStoreAgentID(cfg *config.OpenOctaConfig, canonicalKey string) string {
	if canonicalKey == "global" || canonicalKey == "unknown" {
		return "main"
	}
	parts := strings.SplitN(canonicalKey, ":", 3)
	if len(parts) >= 3 && strings.ToLower(parts[0]) == "agent" {
		return strings.TrimSpace(strings.ToLower(parts[1]))
	}
	return "main"
}

// resolveGatewaySessionStoreTarget resolves session store target for gateway operations.
func resolveGatewaySessionStoreTarget(cfg *config.OpenOctaConfig, key string, env func(string) string) sessionStoreTarget {
	canonicalKey := resolveSessionStoreKey(cfg, key)
	agentID := resolveSessionStoreAgentID(cfg, canonicalKey)

	// Resolve store path
	storePath := session.ResolveDefaultSessionStorePath(agentID, env)
	if cfg != nil && cfg.Session != nil && cfg.Session.Store != nil {
		storePathRaw := *cfg.Session.Store
		if storePathRaw != "" && !strings.Contains(storePathRaw, "{agentId}") {
			storePath = storePathRaw
		}
	}

	storeKeys := []string{canonicalKey}
	if key != "" && key != canonicalKey {
		storeKeys = append(storeKeys, key)
	}

	return sessionStoreTarget{
		agentID:      agentID,
		storePath:    storePath,
		canonicalKey: canonicalKey,
		storeKeys:    storeKeys,
	}
}

// updateSessionStore updates session store atomically.
func updateSessionStore(storePath string, updater func(session.SessionStore) (session.SessionEntry, error)) (session.SessionEntry, error) {
	store, err := session.LoadSessionStore(storePath)
	if err != nil {
		return session.SessionEntry{}, err
	}
	entry, err := updater(store)
	if err != nil {
		return session.SessionEntry{}, err
	}
	// Save store
	if err := os.MkdirAll(filepath.Dir(storePath), 0755); err != nil {
		return session.SessionEntry{}, err
	}
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return session.SessionEntry{}, err
	}
	if err := os.WriteFile(storePath, data, 0644); err != nil {
		return session.SessionEntry{}, err
	}
	return entry, nil
}

// resolveSessionPreview resolves preview for a session key.
func resolveSessionPreview(key, storePath string, store session.SessionStore, limit, maxChars int, env func(string) string) (SessionsPreview, error) {
	target := resolveGatewaySessionStoreTarget(nil, key, env)
	entry, inStore := store[target.canonicalKey]
	if !inStore {
		// Try alternative keys
		for _, altKey := range target.storeKeys {
			if e, ok := store[altKey]; ok {
				entry = e
				inStore = true
				break
			}
		}
	}

	var transcriptPath string
	if inStore && entry.SessionFile != "" {
		sessionsDir := filepath.Dir(storePath)
		transcriptPath = filepath.Join(sessionsDir, entry.SessionFile)
	} else {
		sessionID := key
		if strings.HasPrefix(strings.ToLower(key), "agent:") {
			parts := strings.SplitN(key, ":", 3)
			if len(parts) >= 3 {
				sessionID = parts[2]
			}
		}
		transcriptPath = session.ResolveSessionFilePath(sessionID, &session.SessionPathOptions{AgentID: target.agentID}, env)
	}

	items := session.ReadSessionPreviewItems(transcriptPath, limit, maxChars)
	status := "missing"
	if len(items) > 0 {
		status = "ok"
	} else if inStore {
		status = "empty"
	}

	previewItems := make([]PreviewItem, len(items))
	for i, it := range items {
		previewItems[i] = PreviewItem{Role: it.Role, Text: it.Text}
	}

	return SessionsPreview{Key: key, Status: status, Items: previewItems}, nil
}

// resolveSessionModelRef resolves model reference for a session entry.
func resolveSessionModelRef(cfg *config.OpenOctaConfig, entry session.SessionEntry, agentID string) struct {
	provider string
	model    string
} {
	provider := "anthropic"
	model := "claude-sonnet-4-5-20250929"

	if cfg != nil && cfg.Agents != nil {
		// Try to find agent config
		for _, a := range cfg.Agents.List {
			if strings.EqualFold(a.ID, agentID) {
				if a.Model != nil {
					if modelStr, ok := a.Model.(string); ok && modelStr != "" {
						parts := strings.SplitN(modelStr, "/", 2)
						if len(parts) == 2 {
							provider = strings.TrimSpace(parts[0])
							model = strings.TrimSpace(parts[1])
						} else {
							model = strings.TrimSpace(modelStr)
						}
					}
				}
				break
			}
		}
		// Check defaults
		if cfg.Agents.Defaults != nil && cfg.Agents.Defaults.Model != nil {
			if primary := cfg.Agents.Defaults.Model.Primary; primary != nil && *primary != "" {
				parts := strings.SplitN(*primary, "/", 2)
				if len(parts) == 2 {
					provider = strings.TrimSpace(parts[0])
					model = strings.TrimSpace(parts[1])
				} else {
					model = strings.TrimSpace(*primary)
				}
			}
		}
	}

	return struct {
		provider string
		model    string
	}{provider: provider, model: model}
}

// resolveSessionTranscriptCandidates returns candidate paths for a session transcript.
func resolveSessionTranscriptCandidates(sessionID, storePath, sessionFile, agentID string, env func(string) string) []string {
	candidates := []string{}
	if sessionFile != "" {
		candidates = append(candidates, sessionFile)
	}
	if storePath != "" {
		sessionsDir := filepath.Dir(storePath)
		candidates = append(candidates, filepath.Join(sessionsDir, sessionID+".jsonl"))
	}
	if agentID != "" {
		candidates = append(candidates, session.ResolveSessionFilePath(sessionID, &session.SessionPathOptions{AgentID: agentID}, env))
	}
	// Default sessions dir
	home := env("HOME")
	if home == "" {
		home = env("USERPROFILE")
	}
	if home != "" {
		candidates = append(candidates, filepath.Join(home, ".openclaw", "sessions", sessionID+".jsonl"))
	}
	return candidates
}

// archiveFileOnDisk archives a file by renaming it with timestamp.
func archiveFileOnDisk(filePath, reason string) string {
	ts := time.Now().UTC().Format("2006-01-02T15-04-05Z07-00")
	archived := fmt.Sprintf("%s.%s.%s", filePath, reason, ts)
	if err := os.Rename(filePath, archived); err != nil {
		return ""
	}
	return archived
}

// loadSessionEntryFromStore loads a session entry from store.
func loadSessionEntryFromStore(storePath, key string, storeKeys []string) (session.SessionEntry, bool) {
	store, err := session.LoadSessionStore(storePath)
	if err != nil {
		return session.SessionEntry{}, false
	}
	for _, candidate := range storeKeys {
		if entry, ok := store[candidate]; ok {
			return entry, true
		}
	}
	return session.SessionEntry{}, false
}

// ResolveChatSessionID resolves session ID from params and optional context (sessions store).
// Used by chat.history, chat.send, chat.inject. Order: params["sessionId"] if set; else store by sessionKey; else SessionIDFromSessionKey(sessionKey).
// Returns validated sessionID, sessionFile (if from store), storePath (if from store), and any validation error.
func ResolveChatSessionID(params map[string]interface{}, ctx *Context) (sessionID, sessionFile, storePath string, err error) {
	env := func(k string) string { return os.Getenv(k) }
	sk, _ := params["sessionKey"].(string)
	sessionKey := strings.TrimSpace(strings.ToLower(sk))
	sid, _ := params["sessionId"].(string)
	sid = strings.TrimSpace(sid)
	if sid != "" {
		validated, err := session.ValidateSessionID(sid)
		if err != nil {
			return "", "", "", err
		}
		return validated, "", "", nil
	}
	key := sessionKey
	if key == "" {
		key = "main"
	}
	cfg := loadConfigFromContext(ctx)
	target := resolveGatewaySessionStoreTarget(cfg, key, env)
	entry, found := loadSessionEntryFromStore(target.storePath, key, target.storeKeys)
	if found && entry.SessionID != "" {
		validated, err := session.ValidateSessionID(entry.SessionID)
		if err != nil {
			return "", "", "", err
		}
		return validated, entry.SessionFile, target.storePath, nil
	}
	fallbackID := tools.SessionIDFromSessionKey(sessionKey)
	validated, err := session.ValidateSessionID(fallbackID)
	if err != nil {
		return "", "", "", err
	}
	return validated, "", "", nil
}

// Parameter parsing functions

func parseSessionsListParams(params map[string]interface{}) (*SessionsListParams, error) {
	p := &SessionsListParams{}
	if limit, ok := params["limit"].(float64); ok && limit >= 1 {
		limitInt := int(limit)
		p.Limit = &limitInt
	} else if limit, ok := params["limit"].(int); ok && limit >= 1 {
		p.Limit = &limit
	}
	if activeMinutes, ok := params["activeMinutes"].(float64); ok && activeMinutes >= 1 {
		activeInt := int(activeMinutes)
		p.ActiveMinutes = &activeInt
	} else if activeMinutes, ok := params["activeMinutes"].(int); ok && activeMinutes >= 1 {
		p.ActiveMinutes = &activeMinutes
	}
	if includeGlobal, ok := params["includeGlobal"].(bool); ok {
		p.IncludeGlobal = &includeGlobal
	}
	if includeUnknown, ok := params["includeUnknown"].(bool); ok {
		p.IncludeUnknown = &includeUnknown
	}
	if includeDerivedTitles, ok := params["includeDerivedTitles"].(bool); ok {
		p.IncludeDerivedTitles = &includeDerivedTitles
	}
	if includeLastMessage, ok := params["includeLastMessage"].(bool); ok {
		p.IncludeLastMessage = &includeLastMessage
	}
	if label, ok := params["label"].(string); ok && label != "" {
		p.Label = &label
	}
	if spawnedBy, ok := params["spawnedBy"].(string); ok && spawnedBy != "" {
		p.SpawnedBy = &spawnedBy
	}
	if agentID, ok := params["agentId"].(string); ok && agentID != "" {
		p.AgentID = &agentID
	}
	if search, ok := params["search"].(string); ok {
		p.Search = &search
	}
	return p, nil
}

func parseSessionsPreviewParams(params map[string]interface{}) (*SessionsPreviewParams, error) {
	p := &SessionsPreviewParams{}
	keysRaw, ok := params["keys"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("keys must be an array")
	}
	keys := make([]string, 0, len(keysRaw))
	for _, v := range keysRaw {
		if s, ok := v.(string); ok && strings.TrimSpace(s) != "" {
			keys = append(keys, strings.TrimSpace(s))
		}
	}
	if len(keys) == 0 {
		return nil, fmt.Errorf("keys array must not be empty")
	}
	p.Keys = keys
	if limit, ok := params["limit"].(float64); ok && limit >= 1 {
		limitInt := int(limit)
		p.Limit = &limitInt
	} else if limit, ok := params["limit"].(int); ok && limit >= 1 {
		p.Limit = &limit
	}
	if maxChars, ok := params["maxChars"].(float64); ok && maxChars >= 20 {
		maxCharsInt := int(maxChars)
		p.MaxChars = &maxCharsInt
	} else if maxChars, ok := params["maxChars"].(int); ok && maxChars >= 20 {
		p.MaxChars = &maxChars
	}
	return p, nil
}

func parseSessionsPatchParams(params map[string]interface{}) (*SessionsPatchParams, error) {
	p := &SessionsPatchParams{}
	key, ok := params["key"].(string)
	if !ok || strings.TrimSpace(key) == "" {
		return nil, fmt.Errorf("key is required")
	}
	p.Key = strings.TrimSpace(key)
	if label, ok := params["label"].(string); ok {
		if label == "" {
			p.Label = nil
		} else {
			p.Label = &label
		}
	} else if params["label"] == nil {
		p.Label = nil
	}
	// Similar for other optional fields...
	if thinkingLevel, ok := params["thinkingLevel"].(string); ok {
		p.ThinkingLevel = &thinkingLevel
	} else if params["thinkingLevel"] == nil {
		p.ThinkingLevel = nil
	}
	if verboseLevel, ok := params["verboseLevel"].(string); ok {
		p.VerboseLevel = &verboseLevel
	} else if params["verboseLevel"] == nil {
		p.VerboseLevel = nil
	}
	if reasoningLevel, ok := params["reasoningLevel"].(string); ok {
		p.ReasoningLevel = &reasoningLevel
	} else if params["reasoningLevel"] == nil {
		p.ReasoningLevel = nil
	}
	if responseUsage, ok := params["responseUsage"].(string); ok {
		p.ResponseUsage = &responseUsage
	} else if params["responseUsage"] == nil {
		p.ResponseUsage = nil
	}
	if model, ok := params["model"].(string); ok {
		p.Model = &model
	} else if params["model"] == nil {
		p.Model = nil
	}
	if sendPolicy, ok := params["sendPolicy"].(string); ok {
		p.SendPolicy = &sendPolicy
	} else if params["sendPolicy"] == nil {
		p.SendPolicy = nil
	}
	return p, nil
}

func parseSessionsResetParams(params map[string]interface{}) (*SessionsResetParams, error) {
	p := &SessionsResetParams{}
	key, ok := params["key"].(string)
	if !ok || strings.TrimSpace(key) == "" {
		return nil, fmt.Errorf("key is required")
	}
	p.Key = strings.TrimSpace(key)
	return p, nil
}

func parseSessionsDeleteParams(params map[string]interface{}) (*SessionsDeleteParams, error) {
	p := &SessionsDeleteParams{}
	key, ok := params["key"].(string)
	if !ok || strings.TrimSpace(key) == "" {
		return nil, fmt.Errorf("key is required")
	}
	p.Key = strings.TrimSpace(key)
	if deleteTranscript, ok := params["deleteTranscript"].(bool); ok {
		p.DeleteTranscript = &deleteTranscript
	}
	return p, nil
}

func parseSessionsCompactParams(params map[string]interface{}) (*SessionsCompactParams, error) {
	p := &SessionsCompactParams{}
	key, ok := params["key"].(string)
	if !ok || strings.TrimSpace(key) == "" {
		return nil, fmt.Errorf("key is required")
	}
	p.Key = strings.TrimSpace(key)
	if maxLines, ok := params["maxLines"].(float64); ok && maxLines >= 1 {
		maxLinesInt := int(maxLines)
		p.MaxLines = &maxLinesInt
	} else if maxLines, ok := params["maxLines"].(int); ok && maxLines >= 1 {
		p.MaxLines = &maxLines
	}
	return p, nil
}

// Additional helper functions

func isStorePathTemplate(store *string) bool {
	if store == nil {
		return false
	}
	return strings.Contains(*store, "{agentId}")
}

func resolveStorePath(store *string, agentID string, env func(string) string) string {
	normalizedAgentID := normalizeAgentID(agentID)
	if store == nil || *store == "" {
		return session.ResolveDefaultSessionStorePath(normalizedAgentID, env)
	}
	storePath := *store
	if strings.Contains(storePath, "{agentId}") {
		storePath = strings.ReplaceAll(storePath, "{agentId}", normalizedAgentID)
	}
	// Handle ~ expansion
	if strings.HasPrefix(storePath, "~") {
		home := env("HOME")
		if home == "" {
			home = env("USERPROFILE")
		}
		if home != "" {
			storePath = strings.Replace(storePath, "~", home, 1)
		}
	}
	return filepath.Clean(storePath)
}

func normalizeAgentID(id string) string {
	s := strings.TrimSpace(strings.ToLower(id))
	if s == "" {
		return "main"
	}
	return s
}

func resolveDefaultAgentID(cfg *config.OpenOctaConfig) string {
	if cfg == nil || cfg.Agents == nil || len(cfg.Agents.List) == 0 {
		return "main"
	}
	// Find default agent
	for _, agent := range cfg.Agents.List {
		if agent.Default != nil && *agent.Default {
			return normalizeAgentID(agent.ID)
		}
	}
	// Use first agent if no default
	if cfg.Agents.List[0].ID != "" {
		return normalizeAgentID(cfg.Agents.List[0].ID)
	}
	return "main"
}

func listConfiguredAgentIDs(cfg *config.OpenOctaConfig) []string {
	ids := make(map[string]bool)
	if cfg != nil && cfg.Agents != nil && len(cfg.Agents.List) > 0 {
		for _, agent := range cfg.Agents.List {
			if agent.ID != "" {
				ids[normalizeAgentID(agent.ID)] = true
			}
		}
		defaultID := normalizeAgentID(resolveDefaultAgentID(cfg))
		ids[defaultID] = true
	} else {
		defaultID := normalizeAgentID(resolveDefaultAgentID(cfg))
		ids[defaultID] = true
		// TODO: Add listExistingAgentIDsFromDisk() if needed
	}

	// Sort and return
	sorted := make([]string, 0, len(ids))
	for id := range ids {
		sorted = append(sorted, id)
	}
	// Simple sort
	for i := 0; i < len(sorted)-1; i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	// Put default first
	defaultID := normalizeAgentID(resolveDefaultAgentID(cfg))
	for i, id := range sorted {
		if id == defaultID && i > 0 {
			sorted = append([]string{id}, append(sorted[:i], sorted[i+1:]...)...)
			break
		}
	}

	return sorted
}

func canonicalizeSessionKeyForAgent(agentID string, key string) string {
	if key == "global" || key == "unknown" {
		return key
	}
	if strings.HasPrefix(key, "agent:") {
		return key
	}
	return "agent:" + normalizeAgentID(agentID) + ":" + key
}

func mergeSessionEntryIntoCombined(combined session.SessionStore, entry session.SessionEntry, agentID string, canonicalKey string) {
	existing, exists := combined[canonicalKey]
	if exists && existing.UpdatedAt > entry.UpdatedAt {
		// Keep existing if it's newer
		return
	}
	// Merge entry (for now, just use the newer one)
	combined[canonicalKey] = entry
}

func loadCombinedSessionStoreForGateway(cfg *config.OpenOctaConfig, env func(string) string) (string, session.SessionStore) {
	var storeConfig *string
	if cfg.Session != nil && cfg.Session.Store != nil && !isStorePathTemplate(cfg.Session.Store) {
		// Single store path (not a template)
		storeConfig = cfg.Session.Store
		storePath := resolveStorePath(storeConfig, "", env)
		defaultAgentID := normalizeAgentID(resolveDefaultAgentID(cfg))
		store, err := session.LoadSessionStore(storePath)
		if err != nil {
			store = session.SessionStore{}
		}
		combined := make(session.SessionStore)
		for key, entry := range store {
			canonicalKey := canonicalizeSessionKeyForAgent(defaultAgentID, key)
			mergeSessionEntryIntoCombined(combined, entry, defaultAgentID, canonicalKey)
		}
		return storePath, combined
	}

	// Multiple agent stores
	agentIDs := listConfiguredAgentIDs(cfg)
	combined := make(session.SessionStore)
	firstStorePath := ""

	for _, agentID := range agentIDs {
		storePath := resolveStorePath(storeConfig, agentID, env)
		store, err := session.LoadSessionStore(storePath)
		if err != nil {
			continue
		}
		if firstStorePath == "" {
			firstStorePath = storePath
		}
		for key, entry := range store {
			canonicalKey := canonicalizeSessionKeyForAgent(agentID, key)
			mergeSessionEntryIntoCombined(combined, entry, agentID, canonicalKey)
		}
	}

	storePath := "(multiple)"
	if storeConfig != nil && *storeConfig != "" {
		storePath = strings.TrimSpace(*storeConfig)
	}
	return storePath, combined
}

func isCronRunSessionKey(key string) bool {
	// Check if key matches pattern: cron:*:run:*
	parts := strings.Split(key, ":")
	if len(parts) >= 4 {
		return parts[0] == "cron" && parts[2] == "run"
	}
	return false
}

func parseAgentSessionKey(key string) (agentID string, rest string, ok bool) {
	parts := strings.SplitN(key, ":", 3)
	if len(parts) >= 3 && strings.ToLower(parts[0]) == "agent" {
		return strings.ToLower(parts[1]), parts[2], true
	}
	return "", key, false
}

func parseGroupKey(key string) (channel string, kind string, id string, ok bool) {
	_, rest, _ := parseAgentSessionKey(key)
	parts := strings.Split(rest, ":")
	if len(parts) >= 3 {
		ch := parts[0]
		k := parts[1]
		if k == "group" || k == "channel" {
			id := strings.Join(parts[2:], ":")
			return ch, k, id, true
		}
	}
	return "", "", "", false
}

func classifySessionKey(key string, entry session.SessionEntry) string {
	if key == "global" {
		return "global"
	}
	if key == "unknown" {
		return "unknown"
	}
	if entry.ChatType == "group" || entry.ChatType == "channel" {
		return "group"
	}
	if strings.Contains(key, ":group:") || strings.Contains(key, ":channel:") {
		return "group"
	}
	return "direct"
}

func buildGroupDisplayName(channel, subject, groupChannel, space, id, key string) string {
	// Simple implementation - can be enhanced later
	if subject != "" {
		return subject
	}
	if channel != "" && id != "" {
		return channel + ":" + id
	}
	return key
}

func normalizeSessionDeliveryFields(entry session.SessionEntry) (deliveryContext map[string]interface{}, lastChannel *string, lastTo *string, lastAccountID *string) {
	// TODO: Implement full delivery context normalization when SessionEntry supports it
	return nil, nil, nil, nil
}

func listSessionsFromStore(cfg *config.OpenOctaConfig, storePath string, store session.SessionStore, params *SessionsListParams) *SessionsListResult {
	now := time.Now().UnixMilli()

	includeGlobal := params.IncludeGlobal != nil && *params.IncludeGlobal
	includeUnknown := params.IncludeUnknown != nil && *params.IncludeUnknown
	includeDerivedTitles := params.IncludeDerivedTitles != nil && *params.IncludeDerivedTitles
	includeLastMessage := params.IncludeLastMessage != nil && *params.IncludeLastMessage

	spawnedBy := ""
	if params.SpawnedBy != nil {
		spawnedBy = strings.TrimSpace(*params.SpawnedBy)
	}
	label := ""
	if params.Label != nil {
		label = strings.TrimSpace(*params.Label)
	}
	agentID := ""
	if params.AgentID != nil {
		agentID = normalizeAgentID(*params.AgentID)
	}
	search := ""
	if params.Search != nil {
		search = strings.TrimSpace(strings.ToLower(*params.Search))
	}
	activeMinutes := 0
	if params.ActiveMinutes != nil {
		activeMinutes = *params.ActiveMinutes
		if activeMinutes < 1 {
			activeMinutes = 0
		}
	}

	// Filter sessions
	var sessions []struct {
		key   string
		entry session.SessionEntry
	}

	for key, entry := range store {
		// Filter cron run session keys
		if isCronRunSessionKey(key) {
			continue
		}

		// Filter global/unknown
		if !includeGlobal && key == "global" {
			continue
		}
		if !includeUnknown && key == "unknown" {
			continue
		}

		// Filter by agentId
		if agentID != "" {
			if key == "global" || key == "unknown" {
				continue
			}
			parsedAgentID, _, ok := parseAgentSessionKey(key)
			if !ok || normalizeAgentID(parsedAgentID) != agentID {
				continue
			}
		}

		// Filter by spawnedBy
		if spawnedBy != "" {
			if key == "unknown" || key == "global" {
				continue
			}
			// TODO: Check entry.SpawnedBy when SessionEntry supports it
		}

		// Filter by label
		if label != "" && entry.Label != label {
			continue
		}

		sessions = append(sessions, struct {
			key   string
			entry session.SessionEntry
		}{key: key, entry: entry})
	}

	// Map to GatewaySessionRow
	var rows []GatewaySessionRow
	for _, s := range sessions {
		key := s.key
		entry := s.entry

		updatedAt := entry.UpdatedAt
		inputTokens := 0
		outputTokens := 0
		totalTokens := 0
		// TODO: Get tokens from entry when SessionEntry supports them

		parsedChannel, _, parsedID, parsedGroupOK := parseGroupKey(key)
		channel := entry.Channel
		if parsedGroupOK && parsedChannel != "" {
			channel = parsedChannel
		}

		subject := ""      // TODO: Get from entry when SessionEntry supports it
		groupChannel := "" // TODO: Get from entry when SessionEntry supports it
		space := ""        // TODO: Get from entry when SessionEntry supports it
		id := ""
		if parsedGroupOK {
			id = parsedID
		}

		origin := make(map[string]interface{}) // TODO: Get from entry when SessionEntry supports it
		originLabel := ""                      // TODO: Get from origin.label

		displayName := "" // TODO: Get from entry.displayName
		if displayName == "" && channel != "" {
			displayName = buildGroupDisplayName(channel, subject, groupChannel, space, id, key)
		}
		if displayName == "" {
			displayName = entry.Label
		}
		if displayName == "" {
			displayName = originLabel
		}

		deliveryFields, lastChannel, lastTo, lastAccountID := normalizeSessionDeliveryFields(entry)

		parsedAgentID, _, _ := parseAgentSessionKey(key)
		sessionAgentID := normalizeAgentID(parsedAgentID)
		if sessionAgentID == "" {
			sessionAgentID = normalizeAgentID(resolveDefaultAgentID(cfg))
		}
		resolvedModel := resolveSessionModelRef(cfg, entry, sessionAgentID)
		modelProvider := resolvedModel.provider
		if modelProvider == "" {
			modelProvider = "anthropic"
		}
		model := resolvedModel.model
		if model == "" {
			model = "claude-sonnet-4-5-20250929"
		}

		row := GatewaySessionRow{
			Key:           key,
			Kind:          classifySessionKey(key, entry),
			UpdatedAt:     &updatedAt,
			ModelProvider: &modelProvider,
			Model:         &model,
		}

		if entry.SessionID != "" {
			row.SessionID = &entry.SessionID
		}
		if entry.Label != "" {
			row.Label = &entry.Label
		}
		if displayName != "" {
			row.DisplayName = &displayName
		}
		if channel != "" {
			row.Channel = &channel
		}
		if subject != "" {
			row.Subject = &subject
		}
		if groupChannel != "" {
			row.GroupChannel = &groupChannel
		}
		if space != "" {
			row.Space = &space
		}
		if entry.ChatType != "" {
			row.ChatType = &entry.ChatType
		}
		if len(origin) > 0 {
			row.Origin = origin
		}
		if inputTokens > 0 {
			row.InputTokens = &inputTokens
		}
		if outputTokens > 0 {
			row.OutputTokens = &outputTokens
		}
		if totalTokens > 0 {
			row.TotalTokens = &totalTokens
		}
		if deliveryFields != nil {
			row.DeliveryContext = deliveryFields
		}
		if lastChannel != nil {
			row.LastChannel = lastChannel
		}
		if lastTo != nil {
			row.LastTo = lastTo
		}
		if lastAccountID != nil {
			row.LastAccountID = lastAccountID
		}

		rows = append(rows, row)
	}

	// Sort by updatedAt desc
	for i := 0; i < len(rows)-1; i++ {
		for j := i + 1; j < len(rows); j++ {
			tsI := int64(0)
			tsJ := int64(0)
			if rows[i].UpdatedAt != nil {
				tsI = *rows[i].UpdatedAt
			}
			if rows[j].UpdatedAt != nil {
				tsJ = *rows[j].UpdatedAt
			}
			if tsJ > tsI {
				rows[i], rows[j] = rows[j], rows[i]
			}
		}
	}

	// Apply search filter
	if search != "" {
		filtered := rows[:0]
		for _, s := range rows {
			match := false
			if s.DisplayName != nil && strings.Contains(strings.ToLower(*s.DisplayName), search) {
				match = true
			}
			if s.Label != nil && strings.Contains(strings.ToLower(*s.Label), search) {
				match = true
			}
			if s.Subject != nil && strings.Contains(strings.ToLower(*s.Subject), search) {
				match = true
			}
			if s.SessionID != nil && strings.Contains(strings.ToLower(*s.SessionID), search) {
				match = true
			}
			if strings.Contains(strings.ToLower(s.Key), search) {
				match = true
			}
			if match {
				filtered = append(filtered, s)
			}
		}
		rows = filtered
	}

	// Apply activeMinutes filter
	if activeMinutes > 0 {
		cutoff := now - int64(activeMinutes*60*1000)
		filtered := rows[:0]
		for _, s := range rows {
			if s.UpdatedAt != nil && *s.UpdatedAt >= cutoff {
				filtered = append(filtered, s)
			}
		}
		rows = filtered
	}

	// Apply limit
	if params.Limit != nil && *params.Limit > 0 && len(rows) > *params.Limit {
		rows = rows[:*params.Limit]
	}

	// Add derivedTitle and lastMessagePreview if requested
	env := func(k string) string { return os.Getenv(k) }
	finalRows := make([]GatewaySessionRow, len(rows))
	for i, row := range rows {
		finalRows[i] = row
		if (includeDerivedTitles || includeLastMessage) && row.SessionID != nil {
			entry, found := store[row.Key]
			if found {
				// Resolve agent ID for this session
				parsedAgentID, _, _ := parseAgentSessionKey(row.Key)
				sessionAgentID := normalizeAgentID(parsedAgentID)
				if sessionAgentID == "" {
					sessionAgentID = normalizeAgentID(resolveDefaultAgentID(cfg))
				}

				if includeDerivedTitles {
					firstUserMsg := readFirstUserMessageFromTranscript(*row.SessionID, storePath, entry.SessionFile, sessionAgentID, env)
					derivedTitle := deriveSessionTitle(entry, firstUserMsg)
					if derivedTitle != "" {
						finalRows[i].DerivedTitle = &derivedTitle
					}
				}
				if includeLastMessage {
					lastMsg := readLastMessagePreviewFromTranscript(*row.SessionID, storePath, entry.SessionFile, sessionAgentID, env)
					if lastMsg != "" {
						finalRows[i].LastMessagePreview = &lastMsg
					}
				}
			}
		}
	}

	// Get defaults
	defaults := getSessionDefaults(cfg)

	return &SessionsListResult{
		Ts:       now,
		Path:     storePath,
		Count:    len(finalRows),
		Defaults: defaults,
		Sessions: finalRows,
	}
}

func resolveSessionPreviewForGateway(cfg *config.OpenOctaConfig, key string, storeCache map[string]session.SessionStore, limit, maxChars int, env func(string) string) (SessionsPreview, error) {
	target := resolveGatewaySessionStoreTarget(cfg, key, env)
	store, ok := storeCache[target.storePath]
	if !ok {
		var err error
		store, err = session.LoadSessionStore(target.storePath)
		if err != nil {
			return SessionsPreview{Key: key, Status: "error", Items: []PreviewItem{}}, err
		}
		storeCache[target.storePath] = store
	}

	var entry session.SessionEntry
	found := false
	for _, candidate := range target.storeKeys {
		if e, ok := store[candidate]; ok {
			entry = e
			found = true
			break
		}
	}
	if !found {
		if e, ok := store[target.canonicalKey]; ok {
			entry = e
			found = true
		}
	}

	if !found || entry.SessionID == "" {
		return SessionsPreview{Key: key, Status: "missing", Items: []PreviewItem{}}, nil
	}

	items := session.ReadSessionPreviewItems(
		resolveSessionTranscriptPath(entry.SessionID, target.storePath, entry.SessionFile, target.agentID, env),
		limit,
		maxChars,
	)

	status := "empty"
	if len(items) > 0 {
		status = "ok"
	}

	previewItems := make([]PreviewItem, len(items))
	for i, it := range items {
		previewItems[i] = PreviewItem{Role: it.Role, Text: it.Text}
	}

	return SessionsPreview{Key: key, Status: status, Items: previewItems}, nil
}

func applySessionsPatchToStore(cfg *config.OpenOctaConfig, store session.SessionStore, storeKey string, params *SessionsPatchParams) (session.SessionEntry, error) {
	entry := store[storeKey]
	now := time.Now().UnixMilli()
	if entry.SessionID == "" {
		entry.SessionID = uuid.New().String()
		entry.UpdatedAt = now
	} else {
		if entry.UpdatedAt < now {
			entry.UpdatedAt = now
		}
	}

	// Apply patch fields
	if params.Label != nil {
		if *params.Label == "" {
			entry.Label = ""
		} else {
			entry.Label = *params.Label
		}
	}
	if params.ThinkingLevel != nil {
		entry.ThinkingLevel = *params.ThinkingLevel
	}
	if params.VerboseLevel != nil {
		entry.VerboseLevel = *params.VerboseLevel
	}

	store[storeKey] = entry
	return entry, nil
}

func sessionEntryToMap(entry session.SessionEntry) map[string]interface{} {
	m := make(map[string]interface{})
	m["sessionId"] = entry.SessionID
	m["updatedAt"] = entry.UpdatedAt
	if entry.SessionFile != "" {
		m["sessionFile"] = entry.SessionFile
	}
	if entry.Label != "" {
		m["label"] = entry.Label
	}
	if entry.Channel != "" {
		m["channel"] = entry.Channel
	}
	if entry.ChatType != "" {
		m["chatType"] = entry.ChatType
	}
	if entry.ThinkingLevel != "" {
		m["thinkingLevel"] = entry.ThinkingLevel
	}
	if entry.VerboseLevel != "" {
		m["verboseLevel"] = entry.VerboseLevel
	}
	return m
}

func resolveSessionTranscriptPath(sessionID, storePath, sessionFile, agentID string, env func(string) string) string {
	if sessionFile != "" {
		sessionsDir := filepath.Dir(storePath)
		joined := filepath.Join(sessionsDir, sessionFile)
		if !strings.Contains(joined, "..") {
			return joined
		}
	}
	return session.ResolveSessionFilePath(sessionID, &session.SessionPathOptions{AgentID: agentID}, env)
}

func getSessionDefaults(cfg *config.OpenOctaConfig) GatewaySessionsDefaults {
	defaults := GatewaySessionsDefaults{
		ModelProvider: "anthropic",
		Model:         "claude-sonnet-4-5-20250929",
	}
	if cfg != nil && cfg.Agents != nil && cfg.Agents.Defaults != nil && cfg.Agents.Defaults.Model != nil {
		if primary := cfg.Agents.Defaults.Model.Primary; primary != nil && *primary != "" {
			parts := strings.SplitN(*primary, "/", 2)
			if len(parts) == 2 {
				defaults.ModelProvider = strings.TrimSpace(parts[0])
				defaults.Model = strings.TrimSpace(parts[1])
			} else {
				defaults.Model = strings.TrimSpace(*primary)
			}
		}
	}
	return defaults
}

// readFirstUserMessageFromTranscript reads the first user message from a transcript.
func readFirstUserMessageFromTranscript(sessionID, storePath, sessionFile, agentID string, env func(string) string) string {
	candidates := resolveSessionTranscriptCandidates(sessionID, storePath, sessionFile, agentID, env)
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err != nil {
			continue
		}
		f, err := os.Open(candidate)
		if err != nil {
			continue
		}
		defer f.Close()

		buf := make([]byte, 8192)
		n, err := f.Read(buf)
		if err != nil || n == 0 {
			continue
		}

		lines := strings.Split(string(buf[:n]), "\n")
		maxLines := 10
		if len(lines) > maxLines {
			lines = lines[:maxLines]
		}

		first := true
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}
			if first {
				first = false
				var h struct {
					Type string `json:"type"`
				}
				if json.Unmarshal([]byte(line), &h) == nil && h.Type == "session" {
					continue
				}
			}
			var parsed struct {
				Message *struct {
					Role    string      `json:"role"`
					Content interface{} `json:"content"`
				} `json:"message"`
			}
			if json.Unmarshal([]byte(line), &parsed) != nil {
				continue
			}
			if parsed.Message != nil && parsed.Message.Role == "user" {
				text := extractTextFromContentAny(parsed.Message.Content)
				if text != "" {
					return text
				}
			}
		}
	}
	return ""
}

// readLastMessagePreviewFromTranscript reads the last message preview from a transcript.
func readLastMessagePreviewFromTranscript(sessionID, storePath, sessionFile, agentID string, env func(string) string) string {
	candidates := resolveSessionTranscriptCandidates(sessionID, storePath, sessionFile, agentID, env)
	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err != nil {
			continue
		}
		f, err := os.Open(candidate)
		if err != nil {
			continue
		}
		defer f.Close()

		stat, err := f.Stat()
		if err != nil || stat.Size() == 0 {
			continue
		}

		const maxBytes = 16384
		const maxLines = 20
		readStart := int64(0)
		readLen := stat.Size()
		if readLen > maxBytes {
			readStart = readLen - maxBytes
			readLen = maxBytes
		}

		buf := make([]byte, readLen)
		_, err = f.ReadAt(buf, readStart)
		if err != nil {
			continue
		}

		lines := strings.Split(string(buf), "\n")
		var nonEmptyLines []string
		for _, line := range lines {
			if strings.TrimSpace(line) != "" {
				nonEmptyLines = append(nonEmptyLines, line)
			}
		}

		if len(nonEmptyLines) > maxLines {
			nonEmptyLines = nonEmptyLines[len(nonEmptyLines)-maxLines:]
		}

		// Read from end
		for i := len(nonEmptyLines) - 1; i >= 0; i-- {
			line := nonEmptyLines[i]
			var parsed struct {
				Message *struct {
					Role    string      `json:"role"`
					Content interface{} `json:"content"`
				} `json:"message"`
			}
			if json.Unmarshal([]byte(line), &parsed) != nil {
				continue
			}
			if parsed.Message != nil && (parsed.Message.Role == "user" || parsed.Message.Role == "assistant") {
				text := extractTextFromContentAny(parsed.Message.Content)
				if text != "" {
					return text
				}
			}
		}
	}
	return ""
}

func extractTextFromContentAny(content interface{}) string {
	if s, ok := content.(string); ok {
		return strings.TrimSpace(s)
	}
	arr, ok := content.([]interface{})
	if !ok {
		return ""
	}
	for _, v := range arr {
		m, ok := v.(map[string]interface{})
		if !ok {
			continue
		}
		t, _ := m["type"].(string)
		txt, _ := m["text"].(string)
		if (t == "text" || t == "output_text" || t == "input_text") && txt != "" {
			return strings.TrimSpace(txt)
		}
	}
	return ""
}

const derivedTitleMaxLen = 60

func truncateTitle(text string, maxLen int) string {
	if len(text) <= maxLen {
		return text
	}
	cut := text[:maxLen-1]
	lastSpace := strings.LastIndex(cut, " ")
	if lastSpace > int(float64(maxLen)*0.6) {
		return cut[:lastSpace] + "…"
	}
	return cut + "…"
}

func formatSessionIDPrefix(sessionID string, updatedAt *int64) string {
	prefix := sessionID
	if len(prefix) > 8 {
		prefix = prefix[:8]
	}
	if updatedAt != nil && *updatedAt > 0 {
		t := time.Unix(*updatedAt/1000, (*updatedAt%1000)*1000000)
		date := t.Format("2006-01-02")
		return fmt.Sprintf("%s (%s)", prefix, date)
	}
	return prefix
}

func deriveSessionTitle(entry session.SessionEntry, firstUserMessage string) string {
	// TODO: Check entry.DisplayName when SessionEntry supports it
	// TODO: Check entry.Subject when SessionEntry supports it

	if firstUserMessage != "" {
		normalized := strings.Join(strings.Fields(firstUserMessage), " ")
		normalized = strings.TrimSpace(normalized)
		if normalized != "" {
			return truncateTitle(normalized, derivedTitleMaxLen)
		}
	}

	if entry.SessionID != "" {
		return formatSessionIDPrefix(entry.SessionID, &entry.UpdatedAt)
	}

	return ""
}
