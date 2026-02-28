package handlers

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/session"
)

// UsageStatusResult matches TS usage.status response (UsageSummary: updatedAt + providers array).
type UsageStatusResult struct {
	UpdatedAt int64                   `json:"updatedAt"`
	Providers []ProviderUsageSnapshot `json:"providers"`
}

// ProviderUsageSnapshot matches TS ProviderUsageSnapshot (provider, displayName, windows, plan?, error?).
type ProviderUsageSnapshot struct {
	Provider    string        `json:"provider"`
	DisplayName string        `json:"displayName"`
	Windows     []UsageWindow `json:"windows"`
	Plan        string        `json:"plan,omitempty"`
	Error       string        `json:"error,omitempty"`
}

// UsageWindow matches TS UsageWindow.
type UsageWindow struct {
	Label       string  `json:"label"`
	UsedPercent float64 `json:"usedPercent"`
	ResetAt     *int64  `json:"resetAt,omitempty"`
}

// UsageCostTotals matches TS CostUsageSummary.totals.
type UsageCostTotals struct {
	Input              int     `json:"input"`
	Output             int     `json:"output"`
	CacheRead          int     `json:"cacheRead"`
	CacheWrite         int     `json:"cacheWrite"`
	TotalTokens        int     `json:"totalTokens"`
	TotalCost          float64 `json:"totalCost"`
	InputCost          float64 `json:"inputCost"`
	OutputCost         float64 `json:"outputCost"`
	CacheReadCost      float64 `json:"cacheReadCost"`
	CacheWriteCost     float64 `json:"cacheWriteCost"`
	MissingCostEntries int     `json:"missingCostEntries"`
}

// UsageCostResult matches TS usage.cost response (CostUsageSummary: updatedAt, days, daily, totals).
type UsageCostResult struct {
	UpdatedAt int64                 `json:"updatedAt"`
	Days      int                   `json:"days"`
	Daily     []CostUsageDailyEntry `json:"daily"`
	Totals    UsageCostTotals       `json:"totals"`
}

// CostUsageDailyEntry matches TS CostUsageDailyEntry (date + CostUsageTotals).
type CostUsageDailyEntry struct {
	Date string `json:"date"`
	UsageCostTotals
}

// parseDateToMs parses YYYY-MM-DD to start-of-day UTC ms. Returns 0, false if invalid.
func parseDateToMs(s string) (int64, bool) {
	s = strings.TrimSpace(s)
	if len(s) != 10 || s[4] != '-' || s[7] != '-' {
		return 0, false
	}
	y, err1 := strconv.Atoi(s[0:4])
	m, err2 := strconv.Atoi(s[5:7])
	d, err3 := strconv.Atoi(s[8:10])
	if err1 != nil || err2 != nil || err3 != nil || m < 1 || m > 12 || d < 1 || d > 31 {
		return 0, false
	}
	t := time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
	return t.UnixMilli(), true
}

// parseDays extracts integer days from params (number or numeric string).
func parseDays(raw interface{}) (int, bool) {
	switch v := raw.(type) {
	case float64:
		if v >= 1 {
			return int(v), true
		}
	case int:
		if v >= 1 {
			return v, true
		}
	case string:
		if s := strings.TrimSpace(v); s != "" {
			n, err := strconv.Atoi(s)
			if err == nil && n >= 1 {
				return n, true
			}
		}
	}
	return 0, false
}

// parseUsageCostDateRange returns startMs and endMs from params (startDate/endDate or days).
// Aligns with TS parseDateRange; default last 30 days.
func parseUsageCostDateRange(params map[string]interface{}) (startMs, endMs int64) {
	now := time.Now().UTC()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	todayEndMs := todayStart.Add(24*time.Hour - time.Millisecond).UnixMilli()
	defaultStartMs := todayStart.AddDate(0, 0, -29).UnixMilli()

	startRaw := params["startDate"]
	endRaw := params["endDate"]
	daysRaw := params["days"]

	if startRaw != nil && endRaw != nil {
		if s, ok := startRaw.(string); ok && s != "" {
			if ms, ok := parseDateToMs(s); ok {
				startMs = ms
			}
		}
		if s, ok := endRaw.(string); ok && s != "" {
			if ms, ok := parseDateToMs(s); ok {
				endMs = ms + 24*60*60*1000 - 1
			}
		}
		if startMs > 0 && endMs > 0 {
			return startMs, endMs
		}
	}

	if d, ok := parseDays(daysRaw); ok {
		if d < 1 {
			d = 1
		}
		startMs = todayStart.AddDate(0, 0, -(d - 1)).UnixMilli()
		endMs = todayEndMs
		return startMs, endMs
	}

	startMs = defaultStartMs
	endMs = todayEndMs
	return startMs, endMs
}

// formatDateStr formats ms as YYYY-MM-DD (UTC).
func formatUsageDateStr(ms int64) string {
	t := time.UnixMilli(ms).UTC()
	return t.Format("2006-01-02")
}

// UsageStatusHandler handles "usage.status". Aligns with TS: loadProviderUsageSummary() -> { updatedAt, providers }.
func UsageStatusHandler(opts HandlerOpts) error {
	now := time.Now().UnixMilli()
	opts.Respond(true, &UsageStatusResult{
		UpdatedAt: now,
		Providers: []ProviderUsageSnapshot{}, // Go gateway does not fetch provider APIs; return empty array like TS when no auths
	}, nil, nil)
	return nil
}

// usageCostTotalsFromSession converts session.CostUsageTotals to UsageCostTotals (same shape).
func usageCostTotalsFromSession(t session.CostUsageTotals) UsageCostTotals {
	return UsageCostTotals{
		Input:              t.Input,
		Output:             t.Output,
		CacheRead:          t.CacheRead,
		CacheWrite:         t.CacheWrite,
		TotalTokens:        t.TotalTokens,
		TotalCost:          t.TotalCost,
		InputCost:          t.InputCost,
		OutputCost:         t.OutputCost,
		CacheReadCost:      t.CacheReadCost,
		CacheWriteCost:     t.CacheWriteCost,
		MissingCostEntries: t.MissingCostEntries,
	}
}

// UsageCostHandler handles "usage.cost". Aligns with TS: parseDateRange -> loadCostUsageSummaryCached -> CostUsageSummary.
func UsageCostHandler(opts HandlerOpts) error {
	cfg := loadConfigFromContext(opts.Context)
	if cfg == nil {
		cfg = &config.OpenOctaConfig{}
	}
	startMs, endMs := parseUsageCostDateRange(opts.Params)
	env := func(k string) string { return os.Getenv(k) }
	agentIDs := listConfiguredAgentIDs(cfg)
	summary, err := session.LoadCostUsageSummary(agentIDs, startMs, endMs, env)
	if err != nil || summary == nil {
		summary = &session.CostUsageSummary{
			UpdatedAt: time.Now().UnixMilli(),
			Days:      1,
			Daily:     nil,
			Totals:    session.CostUsageTotals{},
		}
	}
	daily := make([]CostUsageDailyEntry, len(summary.Daily))
	for i, d := range summary.Daily {
		daily[i] = CostUsageDailyEntry{
			Date:            d.Date,
			UsageCostTotals: usageCostTotalsFromSession(d.CostUsageTotals),
		}
	}
	opts.Respond(true, &UsageCostResult{
		UpdatedAt: summary.UpdatedAt,
		Days:      summary.Days,
		Daily:     daily,
		Totals:    usageCostTotalsFromSession(summary.Totals),
	}, nil, nil)
	return nil
}
