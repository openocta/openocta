// Package handlers implements sessions.usage Gateway method.
// Mirrors src/gateway/server-methods/usage.ts sessions.usage handler.
package handlers

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/openocta/openocta/pkg/agent/tools"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/session"
)

// SessionsUsageResult matches TS SessionsUsageResult.
type SessionsUsageResult struct {
	UpdatedAt  int64                   `json:"updatedAt"`
	StartDate  string                  `json:"startDate"`
	EndDate    string                  `json:"endDate"`
	Sessions   []SessionUsageEntry     `json:"sessions"`
	Totals     session.CostUsageTotals `json:"totals"`
	Aggregates SessionsUsageAggregates `json:"aggregates"`
}

// SessionUsageEntry is a single session in the usage response (aligns with TS SessionUsageEntry).
type SessionUsageEntry struct {
	Key              string                      `json:"key"`
	Label            string                      `json:"label,omitempty"`
	SessionID        string                      `json:"sessionId,omitempty"`
	UpdatedAt        int64                       `json:"updatedAt,omitempty"`
	AgentID          string                      `json:"agentId,omitempty"`
	Channel          string                      `json:"channel,omitempty"`
	ChatType         string                      `json:"chatType,omitempty"`
	Origin           map[string]interface{}      `json:"origin,omitempty"`
	ModelOverride    string                      `json:"modelOverride,omitempty"`
	ProviderOverride string                      `json:"providerOverride,omitempty"`
	ModelProvider    string                      `json:"modelProvider,omitempty"`
	Model            string                      `json:"model,omitempty"`
	Usage            *session.SessionCostSummary `json:"usage"`
	ContextWeight    interface{}                 `json:"contextWeight,omitempty"`
}

// SessionsUsageAggregates holds aggregated usage across sessions (aligns with TS SessionsUsageAggregates).
type SessionsUsageAggregates struct {
	Messages     session.SessionMessageCounts `json:"messages"`
	Tools        SessionsUsageTools           `json:"tools"`
	ByModel      []SessionModelUsageRow       `json:"byModel"`
	ByProvider   []SessionModelUsageRow       `json:"byProvider"`
	ByAgent      []SessionTotalsRow           `json:"byAgent"`
	ByChannel    []SessionChannelTotalsRow    `json:"byChannel"`
	Latency      *SessionLatencyStats         `json:"latency"`
	DailyLatency []SessionDailyLatencyEntry   `json:"dailyLatency"`
	ModelDaily   []SessionDailyModelUsage     `json:"modelDaily"`
	Daily        []SessionsUsageDaily         `json:"daily"`
}

// SessionModelUsageRow is byModel/byProvider row (provider, model, count, totals).
type SessionModelUsageRow struct {
	Provider string                  `json:"provider,omitempty"`
	Model    string                  `json:"model,omitempty"`
	Count    int                     `json:"count"`
	Totals   session.CostUsageTotals `json:"totals"`
}

// SessionTotalsRow is byAgent row (agentId + totals).
type SessionTotalsRow struct {
	AgentID string                  `json:"agentId"`
	Totals  session.CostUsageTotals `json:"totals"`
}

// SessionChannelTotalsRow is byChannel row (channel + totals).
type SessionChannelTotalsRow struct {
	Channel string                  `json:"channel"`
	Totals  session.CostUsageTotals `json:"totals"`
}

// SessionLatencyStats matches TS SessionLatencyStats.
type SessionLatencyStats struct {
	Count int     `json:"count"`
	AvgMs float64 `json:"avgMs"`
	MinMs float64 `json:"minMs"`
	MaxMs float64 `json:"maxMs"`
	P95Ms float64 `json:"p95Ms"`
}

// SessionDailyLatencyEntry is per-day latency.
type SessionDailyLatencyEntry struct {
	Date  string  `json:"date"`
	Count int     `json:"count"`
	AvgMs float64 `json:"avgMs"`
	MinMs float64 `json:"minMs"`
	MaxMs float64 `json:"maxMs"`
	P95Ms float64 `json:"p95Ms"`
}

// SessionDailyModelUsage is per-day per-model usage.
type SessionDailyModelUsage struct {
	Date     string  `json:"date"`
	Provider string  `json:"provider,omitempty"`
	Model    string  `json:"model,omitempty"`
	Tokens   int     `json:"tokens"`
	Cost     float64 `json:"cost"`
	Count    int     `json:"count"`
}

// SessionsUsageTools holds tool usage aggregates.
type SessionsUsageTools struct {
	TotalCalls  int                `json:"totalCalls"`
	UniqueTools int                `json:"uniqueTools"`
	Tools       []SessionToolCount `json:"tools"`
}

// SessionToolCount is name + count.
type SessionToolCount struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// SessionsUsageDaily is per-day aggregate.
type SessionsUsageDaily struct {
	Date      string  `json:"date"`
	Tokens    int     `json:"tokens"`
	Cost      float64 `json:"cost"`
	Messages  int     `json:"messages"`
	ToolCalls int     `json:"toolCalls"`
	Errors    int     `json:"errors"`
}

// parseSessionsUsageDateRange returns startMs and endMs from params. Default: last 30 days.
func parseSessionsUsageDateRange(startDate, endDate interface{}) (startMs, endMs int64) {
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	todayEnd := todayStart.Add(24*time.Hour - time.Millisecond)
	defaultStart := todayStart.AddDate(0, 0, -29)

	var startStr, endStr string
	if s, ok := startDate.(string); ok && s != "" {
		startStr = strings.TrimSpace(s)
	}
	if s, ok := endDate.(string); ok && s != "" {
		endStr = strings.TrimSpace(s)
	}
	if startStr != "" {
		if ms, ok := parseDateToMs(startStr); ok {
			startMs = ms
		} else {
			startMs = defaultStart.UnixMilli()
		}
	} else {
		startMs = defaultStart.UnixMilli()
	}
	if endStr != "" {
		if ms, ok := parseDateToMs(endStr); ok {
			endMs = ms + 24*60*60*1000 - 1
		} else {
			endMs = todayEnd.UnixMilli()
		}
	} else {
		endMs = todayEnd.UnixMilli()
	}
	return startMs, endMs
}

// validateSessionsUsageKey rejects traversal-style keys (e.g. "..").
func validateSessionsUsageKey(key string) bool {
	if key == "" {
		return true
	}
	return !strings.Contains(key, "..")
}

// SessionsUsageHandler handles "sessions.usage".
func SessionsUsageHandler(opts HandlerOpts) error {
	keyVal, _ := opts.Params["key"]
	specificKey, _ := keyVal.(string)
	specificKey = strings.TrimSpace(specificKey)
	if specificKey != "" && !validateSessionsUsageKey(specificKey) {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "sessions.usage: invalid key (traversal not allowed)",
		}, nil)
		return nil
	}

	limit := 50
	if l, ok := opts.Params["limit"].(float64); ok && l >= 1 {
		limit = int(l)
	} else if l, ok := opts.Params["limit"].(int); ok && l >= 1 {
		limit = l
	}
	if limit > 1000 {
		limit = 1000
	}
	includeContextWeight := false
	if b, ok := opts.Params["includeContextWeight"].(bool); ok {
		includeContextWeight = b
	}

	startMs, endMs := parseSessionsUsageDateRange(opts.Params["startDate"], opts.Params["endDate"])
	env := func(k string) string { return os.Getenv(k) }

	type mergedEntry struct {
		key         string
		sessionID   string
		sessionFile string
		updatedAt   int64
		agentID     string
		label       string
		storeEntry  *session.SessionEntry
	}
	var merged []mergedEntry

	if specificKey != "" {
		// Resolve single session by key using gateway store target (aligns with TS resolveSessionFilePath(sessionId, storeEntry)).
		cfg := loadConfigFromContext(opts.Context)
		if cfg == nil {
			cfg = &config.OpenOctaConfig{}
		}
		target := resolveGatewaySessionStoreTarget(cfg, specificKey, env)
		entry, found := loadSessionEntryFromStore(target.storePath, specificKey, target.storeKeys)
		sessionID := tools.SessionIDFromSessionKey(specificKey)
		if found && entry.SessionID != "" {
			sessionID = entry.SessionID
		}
		if !session.SafeSessionIDRe.MatchString(sessionID) {
			sessionID = specificKey
		}
		sessionFile := resolveSessionTranscriptPath(sessionID, target.storePath, entry.SessionFile, target.agentID, env)
		if sessionFile == "" || strings.Contains(sessionFile, "..") {
			sessionFile = session.ResolveSessionFilePath(sessionID, &session.SessionPathOptions{AgentID: target.agentID}, env)
		}
		if info, err := os.Stat(sessionFile); err == nil && !info.IsDir() {
			updatedAt := info.ModTime().UnixMilli()
			if found && entry.UpdatedAt > 0 {
				updatedAt = entry.UpdatedAt
			}
			var storeEntry *session.SessionEntry
			if found {
				storeEntry = &entry
			}
			merged = append(merged, mergedEntry{
				key:         specificKey,
				sessionID:   sessionID,
				sessionFile: sessionFile,
				updatedAt:   updatedAt,
				agentID:     target.agentID,
				label:       entry.Label,
				storeEntry:  storeEntry,
			})
		}
	} else {
		// Discover all sessions for each configured agent; merge with store for labels (aligns with TS discoverAllSessions + store merge).
		cfg := loadConfigFromContext(opts.Context)
		if cfg == nil {
			cfg = &config.OpenOctaConfig{}
		}
		storePath, store := loadCombinedSessionStoreForGateway(cfg, env)
		storeBySessionID := make(map[string]struct {
			key   string
			entry session.SessionEntry
		})
		for k, e := range store {
			if e.SessionID != "" {
				storeBySessionID[e.SessionID] = struct {
					key   string
					entry session.SessionEntry
				}{k, e}
			}
		}
		agentIDs := listConfiguredAgentIDs(cfg)
		seen := make(map[string]bool)
		for _, agentID := range agentIDs {
			discovered, err := session.DiscoverAllSessions(agentID, startMs, endMs, env)
			if err != nil {
				continue
			}
			for _, d := range discovered {
				if seen[d.SessionID] {
					continue
				}
				seen[d.SessionID] = true
				key := "agent:" + agentID + ":" + d.SessionID
				updatedAt := d.Mtime
				label := ""
				var storeEntry *session.SessionEntry
				if m, ok := storeBySessionID[d.SessionID]; ok {
					key = m.key
					if m.entry.UpdatedAt > 0 {
						updatedAt = m.entry.UpdatedAt
					}
					label = m.entry.Label
					storeEntry = &m.entry
				}
				sessionFile := d.SessionFile
				if storePath != "" && storePath != "(multiple)" && storeEntry != nil && storeEntry.SessionFile != "" {
					sessionsDir := filepath.Dir(storePath)
					sessionFile = filepath.Join(sessionsDir, storeEntry.SessionFile)
				}
				merged = append(merged, mergedEntry{
					key:         key,
					sessionID:   d.SessionID,
					sessionFile: sessionFile,
					updatedAt:   updatedAt,
					agentID:     agentID,
					label:       label,
					storeEntry:  storeEntry,
				})
			}
		}
		_ = storePath
		// Sort by updatedAt desc
		for i := 0; i < len(merged)-1; i++ {
			for j := i + 1; j < len(merged); j++ {
				if merged[j].updatedAt > merged[i].updatedAt {
					merged[i], merged[j] = merged[j], merged[i]
				}
			}
		}
	}

	// Sort by updatedAt desc (already from discover)
	// Apply limit
	if len(merged) > limit {
		merged = merged[:limit]
	}

	// Load usage for each session and aggregate (aligns with TS loadSessionCostSummary + aggregates).
	cfgForRef := loadConfigFromContext(opts.Context)
	if cfgForRef == nil {
		cfgForRef = &config.OpenOctaConfig{}
	}
	var sessions []SessionUsageEntry
	var totals session.CostUsageTotals
	var aggMessages session.SessionMessageCounts
	dailyMap := make(map[string]*SessionsUsageDaily)
	byAgentMap := make(map[string]session.CostUsageTotals)
	byChannelMap := make(map[string]session.CostUsageTotals)
	byModelMap := make(map[string]*SessionModelUsageRow)    // key = "provider::model"
	byProviderMap := make(map[string]*SessionModelUsageRow) // key = "provider"
	toolAggregateMap := make(map[string]int)
	latencyTotals := struct {
		count  int
		sum    float64
		min    float64
		max    float64
		p95Max float64
	}{min: 1e9}
	dailyLatencyMap := make(map[string]*struct {
		date   string
		count  int
		sum    float64
		min    float64
		max    float64
		p95Max float64
	})
	modelDailyMap := make(map[string]*SessionDailyModelUsage)

	addUsageToTotals := func(dst *session.CostUsageTotals, u *session.SessionCostSummary) {
		if dst == nil || u == nil {
			return
		}
		dst.Input += u.Input
		dst.Output += u.Output
		dst.CacheRead += u.CacheRead
		dst.CacheWrite += u.CacheWrite
		dst.TotalTokens += u.TotalTokens
		dst.TotalCost += u.TotalCost
		dst.InputCost += u.InputCost
		dst.OutputCost += u.OutputCost
		dst.CacheReadCost += u.CacheReadCost
		dst.CacheWriteCost += u.CacheWriteCost
		dst.MissingCostEntries += u.MissingCostEntries
	}

	for _, m := range merged {
		var startPtr, endPtr *int64
		if startMs > 0 {
			startPtr = &startMs
		}
		if endMs > 0 {
			endPtr = &endMs
		}
		usage, err := session.LoadSessionCostSummary(m.sessionFile, startPtr, endPtr)
		if err != nil {
			usage = nil
		}

		channel := ""
		chatType := ""
		var origin map[string]interface{}
		modelProvider := "unknown"
		model := "unknown"
		var contextWeight interface{}
		if m.storeEntry != nil {
			channel = m.storeEntry.Channel
			chatType = m.storeEntry.ChatType
			resolved := resolveSessionModelRef(cfgForRef, *m.storeEntry, m.agentID)
			if resolved.provider != "" {
				modelProvider = resolved.provider
			}
			if resolved.model != "" {
				model = resolved.model
			}
			if includeContextWeight {
				_ = contextWeight
			}
		} else {
			resolved := resolveSessionModelRef(cfgForRef, session.SessionEntry{}, m.agentID)
			if resolved.provider != "" {
				modelProvider = resolved.provider
			}
			if resolved.model != "" {
				model = resolved.model
			}
		}

		if usage != nil {
			totals.Input += usage.Input
			totals.Output += usage.Output
			totals.CacheRead += usage.CacheRead
			totals.CacheWrite += usage.CacheWrite
			totals.TotalTokens += usage.TotalTokens
			totals.TotalCost += usage.TotalCost
			totals.InputCost += usage.InputCost
			totals.OutputCost += usage.OutputCost
			totals.CacheReadCost += usage.CacheReadCost
			totals.CacheWriteCost += usage.CacheWriteCost
			totals.MissingCostEntries += usage.MissingCostEntries
			if usage.MessageCounts != nil {
				aggMessages.Total += usage.MessageCounts.Total
				aggMessages.User += usage.MessageCounts.User
				aggMessages.Assistant += usage.MessageCounts.Assistant
				aggMessages.ToolCalls += usage.MessageCounts.ToolCalls
				aggMessages.ToolResults += usage.MessageCounts.ToolResults
				aggMessages.Errors += usage.MessageCounts.Errors
			}
			if usage.ToolUsage != nil {
				for _, tool := range usage.ToolUsage.Tools {
					toolAggregateMap[tool.Name] += tool.Count
				}
			}
			if usage.ModelUsage != nil {
				for _, entry := range usage.ModelUsage {
					modelKey := entry.Provider + "::" + entry.Model
					if row, ok := byModelMap[modelKey]; ok {
						row.Count += entry.Count
						row.Totals.Input += entry.Totals.Input
						row.Totals.Output += entry.Totals.Output
						row.Totals.CacheRead += entry.Totals.CacheRead
						row.Totals.CacheWrite += entry.Totals.CacheWrite
						row.Totals.TotalTokens += entry.Totals.TotalTokens
						row.Totals.TotalCost += entry.Totals.TotalCost
						row.Totals.InputCost += entry.Totals.InputCost
						row.Totals.OutputCost += entry.Totals.OutputCost
						row.Totals.CacheReadCost += entry.Totals.CacheReadCost
						row.Totals.CacheWriteCost += entry.Totals.CacheWriteCost
						row.Totals.MissingCostEntries += entry.Totals.MissingCostEntries
					} else {
						byModelMap[modelKey] = &SessionModelUsageRow{
							Provider: entry.Provider,
							Model:    entry.Model,
							Count:    entry.Count,
							Totals:   entry.Totals,
						}
					}
					providerKey := entry.Provider
					if row, ok := byProviderMap[providerKey]; ok {
						row.Count += entry.Count
						row.Totals.Input += entry.Totals.Input
						row.Totals.Output += entry.Totals.Output
						row.Totals.CacheRead += entry.Totals.CacheRead
						row.Totals.CacheWrite += entry.Totals.CacheWrite
						row.Totals.TotalTokens += entry.Totals.TotalTokens
						row.Totals.TotalCost += entry.Totals.TotalCost
						row.Totals.InputCost += entry.Totals.InputCost
						row.Totals.OutputCost += entry.Totals.OutputCost
						row.Totals.CacheReadCost += entry.Totals.CacheReadCost
						row.Totals.CacheWriteCost += entry.Totals.CacheWriteCost
						row.Totals.MissingCostEntries += entry.Totals.MissingCostEntries
					} else {
						byProviderMap[providerKey] = &SessionModelUsageRow{
							Provider: entry.Provider,
							Model:    "",
							Count:    entry.Count,
							Totals:   entry.Totals,
						}
					}
				}
			}
			if usage.Latency != nil {
				if usage.Latency.Count > 0 {
					latencyTotals.count += usage.Latency.Count
					latencyTotals.sum += usage.Latency.AvgMs * float64(usage.Latency.Count)
					if usage.Latency.MinMs < latencyTotals.min {
						latencyTotals.min = usage.Latency.MinMs
					}
					if usage.Latency.MaxMs > latencyTotals.max {
						latencyTotals.max = usage.Latency.MaxMs
					}
					if usage.Latency.P95Ms > latencyTotals.p95Max {
						latencyTotals.p95Max = usage.Latency.P95Ms
					}
				}
			}
			if usage.DailyLatency != nil {
				for _, day := range usage.DailyLatency {
					existing := dailyLatencyMap[day.Date]
					if existing == nil {
						existing = &struct {
							date   string
							count  int
							sum    float64
							min    float64
							max    float64
							p95Max float64
						}{date: day.Date, min: 1e9}
						dailyLatencyMap[day.Date] = existing
					}
					existing.count += day.Count
					existing.sum += day.AvgMs * float64(day.Count)
					if day.MinMs < existing.min {
						existing.min = day.MinMs
					}
					if day.MaxMs > existing.max {
						existing.max = day.MaxMs
					}
					if day.P95Ms > existing.p95Max {
						existing.p95Max = day.P95Ms
					}
				}
			}
			if usage.DailyModelUsage != nil {
				for _, entry := range usage.DailyModelUsage {
					key := entry.Date + "::" + entry.Provider + "::" + entry.Model
					existing := modelDailyMap[key]
					if existing == nil {
						existing = &SessionDailyModelUsage{
							Date:     entry.Date,
							Provider: entry.Provider,
							Model:    entry.Model,
						}
						modelDailyMap[key] = existing
					}
					existing.Tokens += entry.Tokens
					existing.Cost += entry.Cost
					existing.Count += entry.Count
				}
			}
			if m.agentID != "" {
				t := byAgentMap[m.agentID]
				addUsageToTotals(&t, usage)
				byAgentMap[m.agentID] = t
			}
			ch := ""
			if m.storeEntry != nil && m.storeEntry.Channel != "" {
				ch = m.storeEntry.Channel
			}
			if ch != "" {
				tc := byChannelMap[ch]
				addUsageToTotals(&tc, usage)
				byChannelMap[ch] = tc
			}
			if usage.DailyBreakdown != nil {
				for _, d := range usage.DailyBreakdown {
					if dailyMap[d.Date] == nil {
						dailyMap[d.Date] = &SessionsUsageDaily{Date: d.Date}
					}
					dm := dailyMap[d.Date]
					dm.Tokens += d.Tokens
					dm.Cost += d.Cost
				}
			}
			if usage.DailyMessageCounts != nil {
				for _, d := range usage.DailyMessageCounts {
					if dailyMap[d.Date] == nil {
						dailyMap[d.Date] = &SessionsUsageDaily{Date: d.Date}
					}
					dm := dailyMap[d.Date]
					dm.Messages += d.Total
					dm.ToolCalls += d.ToolCalls
					dm.Errors += d.Errors
				}
			}
		}

		sessions = append(sessions, SessionUsageEntry{
			Key:           m.key,
			Label:         m.label,
			SessionID:     m.sessionID,
			UpdatedAt:     m.updatedAt,
			AgentID:       m.agentID,
			Channel:       channel,
			ChatType:      chatType,
			Origin:        origin,
			ModelProvider: modelProvider,
			Model:         model,
			Usage:         usage,
			ContextWeight: contextWeight,
		})
	}

	var daily []SessionsUsageDaily
	if len(dailyMap) > 0 {
		var dates []string
		for k := range dailyMap {
			dates = append(dates, k)
		}
		sort.Strings(dates)
		daily = make([]SessionsUsageDaily, len(dates))
		for i, d := range dates {
			daily[i] = *dailyMap[d]
		}
	} else {
		daily = []SessionsUsageDaily{}
	}

	// ByAgent sorted by totalCost desc (aligns with TS byAgent).
	byAgent := make([]SessionTotalsRow, len(byAgentMap))
	for id, t := range byAgentMap {
		byAgent = append(byAgent, SessionTotalsRow{AgentID: id, Totals: t})
	}
	sort.Slice(byAgent, func(i, j int) bool { return byAgent[j].Totals.TotalCost < byAgent[i].Totals.TotalCost })

	// ByChannel sorted by totalCost desc (aligns with TS byChannel).
	byChannel := make([]SessionChannelTotalsRow, len(byChannelMap))
	for ch, t := range byChannelMap {
		byChannel = append(byChannel, SessionChannelTotalsRow{Channel: ch, Totals: t})
	}
	sort.Slice(byChannel, func(i, j int) bool { return byChannel[j].Totals.TotalCost < byChannel[i].Totals.TotalCost })

	// ByModel sorted by totalCost desc then totalTokens (aligns with TS byModel).
	byModel := make([]SessionModelUsageRow, len(byModelMap))
	for _, row := range byModelMap {
		byModel = append(byModel, *row)
	}
	sort.Slice(byModel, func(i, j int) bool {
		if byModel[j].Totals.TotalCost != byModel[i].Totals.TotalCost {
			return byModel[j].Totals.TotalCost < byModel[i].Totals.TotalCost
		}
		return byModel[j].Totals.TotalTokens < byModel[i].Totals.TotalTokens
	})

	// ByProvider sorted by totalCost desc then totalTokens (aligns with TS byProvider).
	byProvider := make([]SessionModelUsageRow, 0)
	for _, row := range byProviderMap {
		byProvider = append(byProvider, *row)
	}
	sort.Slice(byProvider, func(i, j int) bool {
		if byProvider[j].Totals.TotalCost != byProvider[i].Totals.TotalCost {
			return byProvider[j].Totals.TotalCost < byProvider[i].Totals.TotalCost
		}
		return byProvider[j].Totals.TotalTokens < byProvider[i].Totals.TotalTokens
	})

	// Tools: aggregate from toolAggregateMap.
	var toolsAgg SessionsUsageTools
	if len(toolAggregateMap) > 0 {
		totalCalls := 0
		var tools []SessionToolCount
		for name, count := range toolAggregateMap {
			totalCalls += count
			tools = append(tools, SessionToolCount{Name: name, Count: count})
		}
		sort.Slice(tools, func(i, j int) bool { return tools[j].Count < tools[i].Count })
		toolsAgg = SessionsUsageTools{
			TotalCalls:  totalCalls,
			UniqueTools: len(toolAggregateMap),
			Tools:       tools,
		}
	} else {
		toolsAgg = SessionsUsageTools{
			TotalCalls:  0,
			UniqueTools: 0,
			Tools:       []SessionToolCount{},
		}
	}

	// Latency: compute from latencyTotals.
	var latency *SessionLatencyStats
	if latencyTotals.count > 0 {
		latency = &SessionLatencyStats{
			Count: latencyTotals.count,
			AvgMs: latencyTotals.sum / float64(latencyTotals.count),
			MinMs: latencyTotals.min,
			MaxMs: latencyTotals.max,
			P95Ms: latencyTotals.p95Max,
		}
	}

	// DailyLatency: convert from dailyLatencyMap.
	var dailyLatency []SessionDailyLatencyEntry
	if len(dailyLatencyMap) > 0 {
		var dates []string
		for d := range dailyLatencyMap {
			dates = append(dates, d)
		}
		sort.Strings(dates)
		for _, d := range dates {
			entry := dailyLatencyMap[d]
			if entry.count > 0 {
				dailyLatency = append(dailyLatency, SessionDailyLatencyEntry{
					Date:  entry.date,
					Count: entry.count,
					AvgMs: entry.sum / float64(entry.count),
					MinMs: entry.min,
					MaxMs: entry.max,
					P95Ms: entry.p95Max,
				})
			}
		}
	} else {
		dailyLatency = []SessionDailyLatencyEntry{}
	}

	// ModelDaily: convert from modelDailyMap.
	var modelDaily []SessionDailyModelUsage
	if len(modelDailyMap) > 0 {
		for _, e := range modelDailyMap {
			modelDaily = append(modelDaily, *e)
		}
		sort.Slice(modelDaily, func(i, j int) bool {
			if modelDaily[i].Date != modelDaily[j].Date {
				return modelDaily[i].Date < modelDaily[j].Date
			}
			return modelDaily[j].Cost < modelDaily[i].Cost
		})
	} else {
		modelDaily = []SessionDailyModelUsage{}
	}

	result := &SessionsUsageResult{
		UpdatedAt: time.Now().UnixMilli(),
		StartDate: session.FormatDayKey(startMs),
		EndDate:   session.FormatDayKey(endMs),
		Sessions:  sessions,
		Totals:    totals,
		Aggregates: SessionsUsageAggregates{
			Messages:     aggMessages,
			Tools:        toolsAgg,
			ByModel:      byModel,
			ByProvider:   byProvider,
			ByAgent:      byAgent,
			ByChannel:    byChannel,
			Latency:      latency,
			DailyLatency: dailyLatency,
			ModelDaily:   modelDaily,
			Daily:        daily,
		},
	}
	opts.Respond(true, result, nil, nil)
	return nil
}

// resolveSessionFileByKey resolves sessionId and session file path for a gateway session key.
// Returns sessionID, sessionFile, agentID; sessionFile is empty if transcript not found.
func resolveSessionFileByKey(opts HandlerOpts, key string) (sessionID, sessionFile, agentID string) {
	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		cfg = &config.OpenOctaConfig{}
	}
	env := func(k string) string { return os.Getenv(k) }
	target := resolveGatewaySessionStoreTarget(cfg, key, env)
	entry, found := loadSessionEntryFromStore(target.storePath, key, target.storeKeys)
	sessionID = tools.SessionIDFromSessionKey(key)
	if found && entry.SessionID != "" {
		sessionID = entry.SessionID
	}
	sessionFile = resolveSessionTranscriptPath(sessionID, target.storePath, entry.SessionFile, target.agentID, env)
	if sessionFile == "" || strings.Contains(sessionFile, "..") {
		sessionFile = session.ResolveSessionFilePath(sessionID, &session.SessionPathOptions{AgentID: target.agentID}, env)
	}
	return sessionID, sessionFile, target.agentID
}

// SessionsUsageTimeseriesResult matches TS sessions.usage.timeseries response (SessionUsageTimeSeries).
type SessionsUsageTimeseriesResult struct {
	SessionID string                   `json:"sessionId,omitempty"`
	Points    []session.UsageTimePoint `json:"points"`
}

// SessionsUsageTimeseriesHandler handles "sessions.usage.timeseries". Requires key param.
func SessionsUsageTimeseriesHandler(opts HandlerOpts) error {
	keyVal, _ := opts.Params["key"]
	key, _ := keyVal.(string)
	key = strings.TrimSpace(key)
	if key == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "key is required for timeseries",
		}, nil)
		return nil
	}
	sessionID, sessionFile, _ := resolveSessionFileByKey(opts, key)
	if sessionFile == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "No transcript found for session: " + key,
		}, nil)
		return nil
	}
	if info, err := os.Stat(sessionFile); err != nil || info.IsDir() {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "No transcript found for session: " + key,
		}, nil)
		return nil
	}
	points, err := session.LoadSessionUsageTimeSeries(sessionFile, 200)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "No transcript found for session: " + key,
		}, nil)
		return nil
	}
	opts.Respond(true, &SessionsUsageTimeseriesResult{SessionID: sessionID, Points: points}, nil, nil)
	return nil
}

// SessionsUsageLogsResult matches TS sessions.usage.logs response.
type SessionsUsageLogsResult struct {
	Logs []session.LogEntry `json:"logs"`
}

// SessionsUsageLogsHandler handles "sessions.usage.logs". Requires key param; limit optional (default 200, max 1000).
func SessionsUsageLogsHandler(opts HandlerOpts) error {
	keyVal, _ := opts.Params["key"]
	key, _ := keyVal.(string)
	key = strings.TrimSpace(key)
	if key == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "key is required for logs",
		}, nil)
		return nil
	}
	limit := 200
	if l, ok := opts.Params["limit"].(float64); ok && l >= 1 {
		limit = int(l)
	} else if l, ok := opts.Params["limit"].(int); ok && l >= 1 {
		limit = l
	}
	if limit > 1000 {
		limit = 1000
	}
	_, sessionFile, _ := resolveSessionFileByKey(opts, key)
	if sessionFile == "" {
		opts.Respond(true, &SessionsUsageLogsResult{Logs: []session.LogEntry{}}, nil, nil)
		return nil
	}
	if info, err := os.Stat(sessionFile); err != nil || info.IsDir() {
		opts.Respond(true, &SessionsUsageLogsResult{Logs: []session.LogEntry{}}, nil, nil)
		return nil
	}
	logs, err := session.LoadSessionLogs(sessionFile, limit)
	if err != nil {
		opts.Respond(true, &SessionsUsageLogsResult{Logs: []session.LogEntry{}}, nil, nil)
		return nil
	}
	opts.Respond(true, &SessionsUsageLogsResult{Logs: logs}, nil, nil)
	return nil
}
