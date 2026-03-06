package handlers

import (
	"strings"
	"time"

	"github.com/openocta/openocta/pkg/channels"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
)

type ChannelUiMetaEntry struct {
	Id          string `json:"id"`
	Label       string `json:"label"`
	DetailLabel string `json:"detailLabel"`
	SystemImage string `json:"systemImage,omitempty"`
}

// ChannelsStatusResult is the channels.status response format.
type ChannelsStatusResult struct {
	Ts                      int                    `json:"ts"`
	ChannelLabels           map[string]string      `json:"channelLabels"`
	ChannelDetailLabels     map[string]string      `json:"channelDetailLabels"`
	ChannelSystemImages     map[string]string      `json:"channelSystemImages"`
	ChannelMeta             []ChannelUiMetaEntry   `json:"channelMeta"`
	Channels                map[string]interface{} `json:"channels"`
	ChannelOrder            []string               `json:"channelOrder"`
	ChannelAccounts         map[string]interface{} `json:"channelAccounts"`
	ChannelDefaultAccountId map[string]interface{} `json:"channelDefaultAccountId"`
}

// buildChannelUiCatalog builds UI catalog from plugins (mirrors buildChannelUiCatalog in channels.ts).
func buildChannelUiCatalog(plugins []channels.ChannelPlugin) (entries []ChannelUiMetaEntry, order []string, labels, detailLabels, systemImages map[string]string) {
	labels = make(map[string]string)
	detailLabels = make(map[string]string)
	systemImages = make(map[string]string)
	entries = make([]ChannelUiMetaEntry, 0, len(plugins))
	order = make([]string, 0, len(plugins))
	for _, p := range plugins {
		meta := p.Meta()
		detailLabel := meta.SelectionLabel
		if detailLabel == "" {
			detailLabel = meta.Label
		}
		entry := ChannelUiMetaEntry{
			Id:          meta.ID,
			Label:       meta.Label,
			DetailLabel: detailLabel,
		}
		if meta.SystemImage != "" {
			entry.SystemImage = meta.SystemImage
			systemImages[meta.ID] = meta.SystemImage
		}
		entries = append(entries, entry)
		order = append(order, meta.ID)
		labels[meta.ID] = meta.Label
		detailLabels[meta.ID] = detailLabel
	}
	return entries, order, labels, detailLabels, systemImages
}

// listChannelAccountIds returns account IDs for a channel. Uses ChannelConfigPlugin when available.
func listChannelAccountIds(cfg *config.OpenOctaConfig, channelId string, plugin channels.ChannelPlugin) []string {
	if configPlugin, ok := plugin.(channels.ChannelConfigPlugin); ok && cfg != nil {
		ids := configPlugin.ListAccountIds(cfg)
		if len(ids) > 0 {
			return ids
		}
	}
	if cfg == nil || cfg.Channels == nil {
		return []string{"default"}
	}
	chCfg := cfg.Channels.GetChannelConfig(channelId)
	if chCfg == nil {
		return []string{"default"}
	}
	if accounts, ok := chCfg["accounts"].(map[string]interface{}); ok && len(accounts) > 0 {
		ids := make([]string, 0, len(accounts))
		for k := range accounts {
			if k != "" {
				ids = append(ids, k)
			}
		}
		if len(ids) > 0 {
			return ids
		}
	}
	return []string{"default"}
}

// isChannelAccountConfigured returns whether the channel/account has meaningful config.
func isChannelAccountConfigured(cfg *config.OpenOctaConfig, channelId, accountId string) bool {
	if cfg == nil || cfg.Channels == nil {
		return false
	}
	chCfg := cfg.Channels.GetChannelConfig(channelId)
	if chCfg == nil {
		return false
	}
	if accountId == "default" {
		return len(chCfg) > 0
	}
	if accounts, ok := chCfg["accounts"].(map[string]interface{}); ok {
		if acc, ok := accounts[accountId].(map[string]interface{}); ok && len(acc) > 0 {
			return true
		}
	}
	return false
}

// buildAccountSnapshot builds ChannelAccountSnapshot. Uses ChannelStatusPlugin when available.
// runtimeStatus 为 nil 时仅基于配置构建；非 nil 时会将运行状态合并进快照。
func buildAccountSnapshot(cfg *config.OpenOctaConfig, plugin channels.ChannelPlugin, channelId, accountId string, runtimeStatus *channels.RuntimeStatus) *channels.ChannelAccountSnapshot {
	configured := isChannelAccountConfigured(cfg, channelId, accountId)
	var snap *channels.ChannelAccountSnapshot
	if statusPlugin, ok := plugin.(channels.ChannelStatusPlugin); ok && cfg != nil {
		account := resolveAccountForStatus(plugin, cfg, channelId, accountId)
		ctx := &channels.SnapshotContext{
			AccountID: accountId,
			Account:   account,
			Config:    cfg,
			Runtime:   nil,
			Probe:     nil,
			Audit:     nil,
		}
		if s, err := statusPlugin.BuildAccountSnapshot(ctx); err == nil && s != nil {
			snap = s
		}
	}
	if snap == nil {
		snap = &channels.ChannelAccountSnapshot{
			AccountID:  accountId,
			Configured: boolPtr(configured),
		}
	}
	if runtimeStatus != nil {
		mergeRuntimeStatusIntoSnapshot(snap, runtimeStatus)
	}
	return snap
}

// mergeRuntimeStatusIntoSnapshot 将运行时状态合并到账号快照中。
func mergeRuntimeStatusIntoSnapshot(snap *channels.ChannelAccountSnapshot, status *channels.RuntimeStatus) {
	if snap == nil || status == nil {
		return
	}
	snap.Running = boolPtr(status.Running)
	snap.LastStartAt = status.LastStartAt
	snap.LastStopAt = status.LastStopAt
	snap.LastError = status.LastError
	snap.Port = status.Port
	if snap.Enabled == nil {
		snap.Enabled = boolPtr(true)
	}
	// 对于 WebSocket/长连接渠道，Running 表示已连接
	if snap.Connected == nil && status.Running {
		snap.Connected = boolPtr(true)
	} else if snap.Connected == nil && !status.Running {
		snap.Connected = boolPtr(false)
	}
	if status.Extra != nil {
		if v, ok := status.Extra["appId"].(string); ok && v != "" {
			snap.AppID = v
		}
		if v, ok := status.Extra["domain"].(string); ok && v != "" {
			snap.Domain = v
		}
		if probe, ok := status.Extra["probe"]; ok && probe != nil {
			snap.Probe = probe
		}
		if v, ok := status.Extra["lastProbeAt"].(int64); ok {
			snap.LastProbeAt = &v
		} else if status.LastStartAt != nil {
			snap.LastProbeAt = status.LastStartAt
		}
		if v, ok := status.Extra["lastInboundAt"].(int64); ok {
			snap.LastInboundAt = &v
		}
		if v, ok := status.Extra["lastConnectedAt"].(int64); ok {
			snap.LastConnectedAt = &v
		}
	} else if status.LastStartAt != nil {
		snap.LastProbeAt = status.LastStartAt
	}
}

func resolveAccountForStatus(plugin channels.ChannelPlugin, cfg *config.OpenOctaConfig, channelId, accountId string) interface{} {
	if configPlugin, ok := plugin.(channels.ChannelConfigPlugin); ok {
		return configPlugin.ResolveAccount(cfg, accountId)
	}
	if cfg == nil || cfg.Channels == nil {
		return nil
	}
	chCfg := cfg.Channels.GetChannelConfig(channelId)
	if chCfg == nil {
		return nil
	}
	if accountId == "default" {
		return chCfg
	}
	if accounts, ok := chCfg["accounts"].(map[string]interface{}); ok {
		if acc, ok := accounts[accountId].(map[string]interface{}); ok {
			return acc
		}
	}
	return chCfg
}

// buildChannelSummary builds channel summary for channels map. Uses ChannelStatusPlugin when available.
func buildChannelSummary(cfg *config.OpenOctaConfig, plugin channels.ChannelPlugin, defaultAccountId string, accounts []channels.ChannelAccountSnapshot) map[string]interface{} {
	var defaultSnapshot *channels.ChannelAccountSnapshot
	for i := range accounts {
		if accounts[i].AccountID == defaultAccountId {
			defaultSnapshot = &accounts[i]
			break
		}
	}
	if defaultSnapshot == nil && len(accounts) > 0 {
		defaultSnapshot = &accounts[0]
	}
	if statusPlugin, ok := plugin.(channels.ChannelStatusPlugin); ok && cfg != nil {
		account := resolveAccountForStatus(plugin, cfg, plugin.ID(), defaultAccountId)
		ctx := &channels.SummaryContext{
			Account:          account,
			DefaultAccountId: defaultAccountId,
			Snapshot:         defaultSnapshot,
			Config:           cfg,
		}
		if summary, err := statusPlugin.BuildChannelSummary(ctx); err == nil && summary != nil {
			return summary
		}
	}
	fallbackConfigured := false
	for _, acc := range accounts {
		if acc.Configured != nil && *acc.Configured {
			fallbackConfigured = true
			break
		}
	}
	summary := map[string]interface{}{
		"configured": fallbackConfigured,
	}
	if defaultSnapshot != nil {
		if defaultSnapshot.Running != nil {
			summary["running"] = *defaultSnapshot.Running
		}
		if defaultSnapshot.LastStartAt != nil {
			summary["lastStartAt"] = *defaultSnapshot.LastStartAt
		}
		if defaultSnapshot.LastStopAt != nil {
			summary["lastStopAt"] = *defaultSnapshot.LastStopAt
		}
		if defaultSnapshot.LastError != "" {
			summary["lastError"] = defaultSnapshot.LastError
		} else {
			summary["lastError"] = nil
		}
		if defaultSnapshot.LastProbeAt != nil {
			summary["lastProbeAt"] = *defaultSnapshot.LastProbeAt
		} else {
			summary["lastProbeAt"] = nil
		}
		if defaultSnapshot.Port != nil {
			summary["port"] = *defaultSnapshot.Port
		} else {
			summary["port"] = nil
		}
		if defaultSnapshot.Probe != nil {
			summary["probe"] = defaultSnapshot.Probe
		} else {
			summary["probe"] = nil
		}
	}
	if _, ok := summary["running"]; !ok {
		summary["running"] = false
	}
	if _, ok := summary["lastError"]; !ok {
		summary["lastError"] = nil
	}
	if _, ok := summary["lastProbeAt"]; !ok {
		summary["lastProbeAt"] = nil
	}
	if _, ok := summary["lastStartAt"]; !ok {
		summary["lastStartAt"] = nil
	}
	if _, ok := summary["lastStopAt"]; !ok {
		summary["lastStopAt"] = nil
	}
	if _, ok := summary["port"]; !ok {
		summary["port"] = nil
	}
	if _, ok := summary["probe"]; !ok {
		summary["probe"] = nil
	}
	return summary
}

// ChannelsStatusHandler handles "channels.status".
func ChannelsStatusHandler(opts HandlerOpts) error {
	ctx := opts.Context
	if ctx == nil || ctx.ChannelRegistry == nil {
		opts.Respond(true, &ChannelsStatusResult{
			Ts:                      int(time.Now().UnixMilli()),
			ChannelLabels:           map[string]string{},
			ChannelDetailLabels:     map[string]string{},
			ChannelSystemImages:     map[string]string{},
			ChannelMeta:             []ChannelUiMetaEntry{},
			Channels:                map[string]interface{}{},
			ChannelOrder:            []string{},
			ChannelAccounts:         map[string]interface{}{},
			ChannelDefaultAccountId: map[string]interface{}{},
		}, nil, nil)
		return nil
	}
	plugins := ctx.ChannelRegistry.List()
	entries, order, labels, detailLabels, systemImages := buildChannelUiCatalog(plugins)
	channelsMap := make(map[string]interface{})
	accountsMap := make(map[string]interface{})
	defaultAccountIdMap := make(map[string]interface{})
	cfg := ctx.Config
	var runtimeStatuses map[string]map[string]channels.RuntimeStatus
	if ctx.ChannelManager != nil {
		runtimeStatuses = ctx.ChannelManager.ListRuntimes()
	}
	for _, p := range plugins {
		id := p.ID()
		accountIds := listChannelAccountIds(cfg, id, p)
		defaultAccountId := "default"
		if len(accountIds) > 0 {
			defaultAccountId = accountIds[0]
		}
		if configPlugin, ok := p.(channels.ChannelConfigPlugin); ok && cfg != nil {
			if def := configPlugin.DefaultAccountId(cfg); def != "" {
				defaultAccountId = def
			}
		}
		accounts := make([]channels.ChannelAccountSnapshot, 0, len(accountIds))
		for _, accId := range accountIds {
			var rtStatus *channels.RuntimeStatus
			if runtimeStatuses != nil {
				if byAcc, ok := runtimeStatuses[id]; ok {
					if s, ok := byAcc[accId]; ok {
						rtStatus = &s
					}
				}
			}
			snapshot := buildAccountSnapshot(cfg, p, id, accId, rtStatus)
			accounts = append(accounts, *snapshot)
		}
		summary := buildChannelSummary(cfg, p, defaultAccountId, accounts)
		channelsMap[id] = summary
		accountsMap[id] = accounts
		defaultAccountIdMap[id] = defaultAccountId
	}
	opts.Respond(true, &ChannelsStatusResult{
		Ts:                      int(time.Now().UnixMilli()),
		ChannelLabels:           labels,
		ChannelDetailLabels:     detailLabels,
		ChannelSystemImages:     systemImages,
		ChannelMeta:             entries,
		Channels:                channelsMap,
		ChannelOrder:            order,
		ChannelAccounts:         accountsMap,
		ChannelDefaultAccountId: defaultAccountIdMap,
	}, nil, nil)
	return nil
}

func boolPtr(b bool) *bool {
	return &b
}

// ChannelsLogoutHandler handles "channels.logout".
// Mirrors channels.ts logoutChannelAccount logic.
func ChannelsLogoutHandler(opts HandlerOpts) error {
	ctx := opts.Context
	params := opts.Params
	if params == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid channels.logout params: channel required",
		}, nil)
		return nil
	}
	rawChannel, _ := params["channel"].(string)
	channelId := channels.NormalizeChannelId(rawChannel)
	if channelId == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid channels.logout channel",
		}, nil)
		return nil
	}
	if ctx == nil || ctx.ChannelRegistry == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "channel registry not available",
		}, nil)
		return nil
	}
	var plugin channels.ChannelPlugin
	for _, p := range ctx.ChannelRegistry.List() {
		if channels.NormalizeChannelId(p.ID()) == channelId {
			plugin = p
			break
		}
	}
	if plugin == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "channel " + channelId + " not found",
		}, nil)
		return nil
	}
	gatewayPlugin, supportsLogout := plugin.(channels.ChannelGatewayPlugin)
	if !supportsLogout {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "channel " + channelId + " does not support logout",
		}, nil)
		return nil
	}
	snapshot, err := ctx.LoadConfigSnapshot()
	if err != nil || snapshot == nil || !snapshot.Valid {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "config invalid; fix it before logging out",
		}, nil)
		return nil
	}
	cfg := ctx.Config
	if cfg == nil && snapshot.Config != nil {
		cfg = snapshot.Config
	}
	accountIds := listChannelAccountIds(cfg, channelId, plugin)
	resolvedAccountId := "default"
	if len(accountIds) > 0 {
		resolvedAccountId = accountIds[0]
	}
	if rawAccountId, ok := params["accountId"].(string); ok && strings.TrimSpace(rawAccountId) != "" {
		resolvedAccountId = strings.TrimSpace(rawAccountId)
	} else if configPlugin, ok := plugin.(channels.ChannelConfigPlugin); ok {
		if def := configPlugin.DefaultAccountId(cfg); def != "" {
			resolvedAccountId = def
		}
	}
	account := resolveAccountForLogout(cfg, plugin, channelId, resolvedAccountId)
	if ctx.ChannelManager != nil {
		_ = ctx.ChannelManager.StopChannel(channelId, resolvedAccountId)
	}
	logoutCtx := &channels.LogoutContext{
		Config:    cfg,
		AccountID: resolvedAccountId,
		Account:   account,
	}
	result, err := gatewayPlugin.LogoutAccount(logoutCtx)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeServiceUnavailable,
			Message: err.Error(),
		}, nil)
		return nil
	}
	if result == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "channel " + channelId + " does not support logout",
		}, nil)
		return nil
	}
	cleared := result.Cleared
	loggedOut := result.LoggedOut
	if !loggedOut {
		loggedOut = cleared
	}
	if loggedOut && ctx.MarkChannelLoggedOut != nil {
		ctx.MarkChannelLoggedOut(channelId, true, resolvedAccountId)
	}
	payload := map[string]interface{}{
		"channel":   channelId,
		"accountId": resolvedAccountId,
		"cleared":   cleared,
	}
	if result.LoggedOut {
		payload["loggedOut"] = result.LoggedOut
	}
	opts.Respond(true, payload, nil, nil)
	return nil
}

func resolveAccountForLogout(cfg *config.OpenOctaConfig, plugin channels.ChannelPlugin, channelId, accountId string) interface{} {
	if configPlugin, ok := plugin.(channels.ChannelConfigPlugin); ok && cfg != nil {
		return configPlugin.ResolveAccount(cfg, accountId)
	}
	if cfg == nil || cfg.Channels == nil {
		return nil
	}
	chCfg := cfg.Channels.GetChannelConfig(channelId)
	if chCfg == nil {
		return nil
	}
	if accountId == "default" {
		return chCfg
	}
	if accounts, ok := chCfg["accounts"].(map[string]interface{}); ok {
		if acc, ok := accounts[accountId].(map[string]interface{}); ok {
			return acc
		}
	}
	return chCfg
}
