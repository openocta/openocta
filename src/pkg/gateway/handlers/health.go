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
		"health":                     HealthHandler,
		"logs.tail":                  LogsTailHandler,
		"channels.status":            ChannelsStatusHandler,
		"channels.logout":            ChannelsLogoutHandler,
		"channels.wework.qr.start":   WeWorkQRStartHandler,
		"channels.wework.qr.poll":    WeWorkQRPollHandler,
		"channels.weixin.qr.start":   WeixinQRStartHandler,
		"channels.weixin.qr.poll":    WeixinQRPollHandler,
		"status":                     StatusHandler,
		"usage.status":               UsageStatusHandler,
		"usage.cost":                 UsageCostHandler,
		"tts.status":                 TtsStatusHandler,
		"tts.providers":              TtsProvidersHandler,
		"tts.enable":                 TtsEnableHandler,
		"tts.disable":                TtsDisableHandler,
		"tts.convert":                TtsConvertHandler,
		"tts.setProvider":            TtsSetProviderHandler,
		"config.get":                 ConfigGetHandler,
		"config.env":                 ConfigEnvHandler,
		"config.set":                 ConfigSetHandler,
		"config.apply":               ConfigApplyHandler,
		"config.patch":               ConfigPatchHandler,
		"mcp.servers.delete":         McpServersDeleteHandler,
		"config.schema":              ConfigSchemaHandler,
		"exec.approvals.get":         ExecApprovalsGetHandler,
		"exec.approvals.set":         ExecApprovalsSetHandler,
		"exec.approvals.node.get":    ExecApprovalsNodeGetHandler,
		"exec.approvals.node.set":    ExecApprovalsNodeSetHandler,
		"exec.approval.request":      ExecApprovalRequestHandler,
		"exec.approval.resolve":      ExecApprovalResolveHandler,
		"wizard.start":               WizardStubHandler,
		"wizard.next":                WizardStubHandler,
		"wizard.cancel":              WizardStubHandler,
		"wizard.status":              WizardStubHandler,
		"talk.mode":                  TalkModeHandler,
		"models.list":                ModelsListHandler,
		"agents.list":                AgentsListHandler,
		"agents.create":              AgentsCreateHandler,
		"agents.update":              AgentsUpdateHandler,
		"agents.delete":              AgentsDeleteHandler,
		"agents.files.list":          AgentsFilesListHandler,
		"agents.files.get":           AgentsFilesGetHandler,
		"agents.files.set":           AgentsFilesSetHandler,
		"employees.list":             EmployeesListHandler,
		"employees.get":              EmployeesGetHandler,
		"employees.create":           EmployeesCreateHandler,
		"employees.delete":           EmployeesDeleteHandler,
		"skills.status":              SkillsStatusHandler,
		"skills.getDoc":              SkillsGetDocHandler,
		"skills.bins":                SkillsBinsHandler,
		"skills.install":             SkillsInstallHandler,
		"skills.update":              SkillsUpdateHandler,
		"skills.delete":              SkillsDeleteHandler,
		"skills.listFiles":           SkillsListFilesHandler,
		"skills.getFile":             SkillsGetFileHandler,
		"skills.saveFile":            SkillsSaveFileHandler,
		"vault.status":               VaultStatusHandler,
		"vault.mkdir":                VaultMkdirHandler,
		"vault.createFile":           VaultCreateFileHandler,
		"vault.sync":                 VaultSyncHandler,
		"vault.listFiles":            VaultListFilesHandler,
		"vault.getFile":              VaultGetFileHandler,
		"vault.saveFile":             VaultSaveFileHandler,
		"vault.graph":                VaultGraphHandler,
		"vault.deleteFile":           VaultDeleteFileHandler,
		"vault.renameFile":           VaultRenameFileHandler,
		"vault.renameFolder":         VaultRenameFolderHandler,
		"vault.deleteFolder":         VaultDeleteFolderHandler,
		"vault.search":               VaultSearchHandler,
		"files.read":                 FilesReadHandler,
		"update.run":                 UpdateRunHandler,
		"voicewake.get":              VoicewakeGetHandler,
		"voicewake.set":              VoicewakeSetHandler,
		"sessions.list":              SessionsListHandler,
		"sessions.create":            SessionsCreateHandler,
		"sessions.ensure":            SessionsEnsureHandler,
		"sessions.preview":           SessionsPreviewHandler,
		"sessions.patch":             SessionsPatchHandler,
		"sessions.reset":             SessionsResetHandler,
		"sessions.delete":            SessionsDeleteHandler,
		"sessions.compact":           SessionsCompactHandler,
		"sessions.usage":             SessionsUsageHandler,
		"sessions.usage.timeseries":  SessionsUsageTimeseriesHandler,
		"sessions.usage.logs":        SessionsUsageLogsHandler,
		"approvals.list":             ApprovalsListHandler,
		"approvals.approve":          ApprovalsApproveHandler,
		"approvals.deny":             ApprovalsDenyHandler,
		"approvals.whitelistSession": ApprovalsWhitelistSessionHandler,
		"last-heartbeat":             LastHeartbeatHandler,
		"set-heartbeats":             SetHeartbeatsHandler,
		"wake":                       WakeHandler,
		"node.pair.request":          NodePairRequestHandler,
		"node.pair.list":             NodePairListHandler,
		"node.pair.approve":          NodePairApproveHandler,
		"node.pair.reject":           NodePairRejectHandler,
		"node.pair.verify":           NodePairVerifyHandler,
		"device.pair.list":           DevicePairListHandler,
		"device.pair.approve":        DevicePairApproveHandler,
		"device.pair.reject":         DevicePairRejectHandler,
		"device.token.rotate":        DeviceTokenRotateHandler,
		"device.token.revoke":        DeviceTokenRevokeHandler,
		"node.rename":                NodeRenameHandler,
		"node.list":                  NodeListHandler,
		"node.describe":              NodeDescribeHandler,
		"node.invoke":                NodeInvokeHandler,
		"node.invoke.result":         NodeInvokeResultHandler,
		"node.event":                 NodeEventHandler,
		"system-presence":            SystemPresenceHandler,
		"system-event":               SystemEventHandler,
		"send":                       SendHandler,
		"agent":                      AgentHandler,
		"agent.identity.get":         AgentIdentityGetHandler,
		"agent.wait":                 AgentWaitHandler,
		"browser.request":            BrowserRequestHandler,
		"chat.history":               ChatHistoryHandler,
		"chat.attachment.read":       ChatAttachmentReadHandler,
		"chat.abort":                 ChatAbortHandler,
		"chat.resume":                ChatResumeHandler,
		"chat.send":                  ChatSendHandler,
		"chat.extractSkill":          ChatExtractSkillHandler,
		"skills.compose":             SkillComposeHandler,
		"skills.analyze":             SkillAnalyzeHandler,
		"chat.inject":                ChatInjectHandler,
		"chat.a2ui.action":           ChatA2UIActionHandler,
		"swarm.workspaces.list":      SwarmWorkspacesListHandler,
		"swarm.workspaces.create":    SwarmWorkspacesCreateHandler,
		"swarm.workspaces.delete":    SwarmWorkspacesDeleteHandler,
		"swarm.workspaces.abortAll":  SwarmWorkspacesAbortAllHandler,
		"swarm.members.list":         SwarmMembersListHandler,
		"swarm.members.add":          SwarmMembersAddHandler,
		"swarm.members.remove":       SwarmMembersRemoveHandler,
		"swarm.message.send":         SwarmMessageSendHandler,
		"swarm.graph.get":            SwarmGraphGetHandler,
		"swarm.history.get":          SwarmHistoryGetHandler,
		"localAgents.probe":          LocalAgentsProbeHandler,
		"localAgents.status":         LocalAgentsStatusHandler,
		"web.login.start":            WebLoginStubHandler,
		"web.login.wait":             WebLoginStubHandler,
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
	if ctx != nil && ctx.ApiKeyService != nil {
		r["apiKeys.list"] = ApiKeysListHandler
		r["apiKeys.create"] = ApiKeysCreateHandler
		r["apiKeys.update"] = ApiKeysUpdateHandler
		r["apiKeys.remove"] = ApiKeysRemoveHandler
		r["apiKeys.defaults"] = ApiKeysDefaultsHandler
		r["apiKeys.secret"] = ApiKeysSecretHandler
		r["apiKeys.regenerate"] = ApiKeysRegenerateHandler
	}
	return r
}
