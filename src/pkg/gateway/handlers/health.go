package handlers

import (
	"time"

	"github.com/openocta/openocta/pkg/gateway/protocol"
)

// HealthSnapshot is a minimal health payload (compatible with protocol).
type HealthSnapshot struct {
	OK           bool                   `json:"ok"`
	Ts           int64                  `json:"ts"`
	DurationMs   int64                  `json:"durationMs"`
	Channels     map[string]interface{} `json:"channels"`
	ChannelOrder []string               `json:"channelOrder"`
	Agents       []interface{}          `json:"agents"`
	Sessions     interface{}            `json:"sessions"`
}

// HealthHandler handles the "health" method.
func HealthHandler(opts HandlerOpts) error {
	ctx := opts.Context
	if ctx == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInternal,
			Message: "health context not configured",
		}, nil)
		return nil
	}
	wantsProbe := false
	if p, ok := opts.Params["probe"].(bool); ok {
		wantsProbe = p
	}
	var snap interface{}
	if !wantsProbe && ctx.GetHealthCache != nil {
		snap = ctx.GetHealthCache()
	}
	if snap == nil && ctx.RefreshHealth != nil {
		s, err := ctx.RefreshHealth(wantsProbe)
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeServiceUnavailable,
				Message: err.Error(),
			}, nil)
			return nil
		}
		snap = s
	}
	if snap == nil {
		snap = &HealthSnapshot{
			OK:           true,
			Ts:           time.Now().UnixMilli(),
			DurationMs:   0,
			Channels:     map[string]interface{}{},
			ChannelOrder: []string{},
			Agents:       []interface{}{},
			Sessions:     map[string]interface{}{},
		}
	}
	meta := map[string]interface{}{}
	if ctx.GetHealthCache != nil && ctx.GetHealthCache() != nil {
		meta["cached"] = true
	}
	opts.Respond(true, snap, nil, meta)
	return nil
}

// StatusHandler handles the "status" method.
func StatusHandler(opts HandlerOpts) error {
	ctx := opts.Context
	if ctx != nil && ctx.GetStatusSummary != nil {
		summary, err := ctx.GetStatusSummary()
		if err != nil {
			opts.Respond(false, nil, &protocol.ErrorShape{
				Code:    protocol.ErrCodeInternal,
				Message: err.Error(),
			}, nil)
			return nil
		}
		opts.Respond(true, summary, nil, nil)
		return nil
	}
	// Phase 2c: return minimal status when no context
	opts.Respond(true, DefaultStatusSummary(), nil, nil)
	return nil
}

// NewRegistry returns a registry with all handlers.
// Methods aligned with src/gateway/server-methods-list.ts BASE_METHODS.
func NewRegistry(ctx *Context) Registry {
	r := Registry{
		"health":                    HealthHandler,
		"logs.tail":                 LogsTailHandler,
		"channels.status":           ChannelsStatusHandler,
		"channels.logout":           ChannelsLogoutHandler,
		"status":                    StatusHandler,
		"usage.status":              UsageStatusHandler,
		"usage.cost":                UsageCostHandler,
		"tts.status":                TtsStatusHandler,
		"tts.providers":             TtsProvidersHandler,
		"tts.enable":                TtsEnableHandler,
		"tts.disable":               TtsDisableHandler,
		"tts.convert":               TtsConvertHandler,
		"tts.setProvider":           TtsSetProviderHandler,
		"config.get":                ConfigGetHandler,
		"config.set":                ConfigSetHandler,
		"config.apply":              ConfigApplyHandler,
		"config.patch":              ConfigPatchHandler,
		"config.schema":             ConfigSchemaHandler,
		"exec.approvals.get":        ExecApprovalsGetHandler,
		"exec.approvals.set":        ExecApprovalsSetHandler,
		"exec.approvals.node.get":   ExecApprovalsNodeGetHandler,
		"exec.approvals.node.set":   ExecApprovalsNodeSetHandler,
		"exec.approval.request":     ExecApprovalRequestHandler,
		"exec.approval.resolve":     ExecApprovalResolveHandler,
		"wizard.start":              WizardStubHandler,
		"wizard.next":               WizardStubHandler,
		"wizard.cancel":             WizardStubHandler,
		"wizard.status":             WizardStubHandler,
		"talk.mode":                 TalkModeHandler,
		"models.list":               ModelsListHandler,
		"agents.list":               AgentsListHandler,
		"agents.create":             AgentsCreateHandler,
		"agents.update":             AgentsUpdateHandler,
		"agents.delete":             AgentsDeleteHandler,
		"agents.files.list":         AgentsFilesListHandler,
		"agents.files.get":          AgentsFilesGetHandler,
		"agents.files.set":          AgentsFilesSetHandler,
		"skills.status":             SkillsStatusHandler,
		"skills.bins":               SkillsBinsHandler,
		"skills.install":            SkillsInstallHandler,
		"skills.update":             SkillsUpdateHandler,
		"update.run":                UpdateRunHandler,
		"voicewake.get":             VoicewakeGetHandler,
		"voicewake.set":             VoicewakeSetHandler,
		"sessions.list":             SessionsListHandler,
		"sessions.preview":          SessionsPreviewHandler,
		"sessions.patch":            SessionsPatchHandler,
		"sessions.reset":            SessionsResetHandler,
		"sessions.delete":           SessionsDeleteHandler,
		"sessions.compact":          SessionsCompactHandler,
		"sessions.usage":            SessionsUsageHandler,
		"sessions.usage.timeseries": SessionsUsageTimeseriesHandler,
		"sessions.usage.logs":       SessionsUsageLogsHandler,
		"last-heartbeat":            LastHeartbeatHandler,
		"set-heartbeats":            SetHeartbeatsHandler,
		"wake":                      WakeHandler,
		"node.pair.request":         NodePairRequestHandler,
		"node.pair.list":            NodePairListHandler,
		"node.pair.approve":         NodePairApproveHandler,
		"node.pair.reject":          NodePairRejectHandler,
		"node.pair.verify":          NodePairVerifyHandler,
		"device.pair.list":          DevicePairListHandler,
		"device.pair.approve":       DevicePairApproveHandler,
		"device.pair.reject":        DevicePairRejectHandler,
		"device.token.rotate":       DeviceTokenRotateHandler,
		"device.token.revoke":       DeviceTokenRevokeHandler,
		"node.rename":               NodeRenameHandler,
		"node.list":                 NodeListHandler,
		"node.describe":             NodeDescribeHandler,
		"node.invoke":               NodeInvokeHandler,
		"node.invoke.result":        NodeInvokeResultHandler,
		"node.event":                NodeEventHandler,
		"system-presence":           SystemPresenceHandler,
		"system-event":              SystemEventHandler,
		"send":                      SendHandler,
		"agent":                     AgentHandler,
		"agent.identity.get":        AgentIdentityGetHandler,
		"agent.wait":                AgentWaitHandler,
		"browser.request":           BrowserRequestHandler,
		"chat.history":              ChatHistoryHandler,
		"chat.abort":                ChatAbortHandler,
		"chat.send":                 ChatSendHandler,
		"chat.inject":               ChatInjectHandler,
		"web.login.start":           WebLoginStubHandler,
		"web.login.wait":            WebLoginStubHandler,
	}
	if ctx != nil && ctx.CronService != nil {
		r["cron.list"] = CronListHandler
		r["cron.status"] = CronStatusHandler
		r["cron.add"] = CronAddHandler
		r["cron.remove"] = CronRemoveHandler
		r["cron.update"] = CronUpdateHandler
		r["cron.run"] = CronRunHandler
		r["cron.runs"] = CronRunsHandler
	}
	return r
}
