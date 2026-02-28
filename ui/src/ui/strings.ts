/**
 * Minimal i18n: locale is read from document.documentElement.lang (e.g. zh, en).
 * Set <html lang="zh"> in index.html for Chinese.
 */

export type Locale = "zh" | "en";

export function getLocale(): Locale {
  if (typeof document === "undefined") {
    return "en";
  }
  const lang = document.documentElement?.lang?.toLowerCase() ?? "";
  if (lang.startsWith("zh")) {
    return "zh";
  }
  return "en";
}

type Strings = {
  // Tab groups (sidebar)
  tabGroupChat: string;
  tabGroupControl: string;
  tabGroupAgent: string;
  tabGroupSettings: string;
  // Tab subtitles
  subtitleAgents: string;
  subtitleOverview: string;
  subtitleChannels: string;
  subtitleInstances: string;
  subtitleSessions: string;
  subtitleUsage: string;
  subtitleCron: string;
  subtitleSkills: string;
  subtitleNodes: string;
  subtitleChat: string;
  subtitleAgentSwarm: string;
  subtitleConfig: string;
  subtitleDebug: string;
  subtitleLogs: string;
  // Nav titles (tab labels; proper nouns not translated)
  navTitleAgents: string;
  navTitleOverview: string;
  navTitleChannels: string;
  navTitleInstances: string;
  navTitleSessions: string;
  navTitleUsage: string;
  navTitleCron: string;
  navTitleSkills: string;
  navTitleNodes: string;
  navTitleChat: string;
  navTitleAgentSwarm: string;
  agentSwarmDevBadge: string;
  navTitleConfig: string;
  navTitleDebug: string;
  navTitleLogs: string;
  navTitleControl: string;
  // Overview
  overviewGatewayAccess: string;
  overviewGatewayAccessSub: string;
  overviewWebSocketUrl: string;
  overviewGatewayToken: string;
  overviewPassword: string;
  overviewDefaultSessionKey: string;
  overviewConnect: string;
  overviewRefresh: string;
  overviewConnectHint: string;
  overviewSnapshot: string;
  overviewSnapshotSub: string;
  overviewStatus: string;
  overviewConnected: string;
  overviewDisconnected: string;
  overviewUptime: string;
  overviewTickInterval: string;
  overviewLastChannelsRefresh: string;
  overviewChannelsHint: string;
  overviewInstances: string;
  overviewInstancesSub: string;
  overviewSessions: string;
  overviewSessionsSub: string;
  overviewCron: string;
  overviewCronNext: string;
  overviewCronEnabled: string;
  overviewCronDisabled: string;
  overviewNotes: string;
  overviewNotesSub: string;
  overviewNoteTailscale: string;
  overviewNoteTailscaleSub: string;
  overviewNoteSessionHygiene: string;
  overviewNoteSessionHygieneSub: string;
  overviewNoteCron: string;
  overviewNoteCronSub: string;
  // Common
  commonLoading: string;
  commonRefresh: string;
  commonRefreshing: string;
  commonSaving: string;
  commonDelete: string;
  commonFilter: string;
  commonOptional: string;
  commonInherit: string;
  commonOffExplicit: string;
  commonNA: string;
  commonYes: string;
  commonNo: string;
  // Channels
  channelsHealth: string;
  channelsHealthSub: string;
  channelsNoSnapshot: string;
  channelsSchemaUnavailable: string;
  channelsConfigSchemaUnavailable: string;
  channelsLoadingConfigSchema: string;
  commonSave: string;
  commonReload: string;
  commonCancel: string;
  channelConfigured: string;
  channelRunning: string;
  channelLastStart: string;
  channelLastProbe: string;
  channelProbe: string;
  channelProbeOk: string;
  channelProbeFailed: string;
  channelLinked: string;
  channelConnected: string;
  channelLastConnect: string;
  channelLastMessage: string;
  channelAuthAge: string;
  channelBaseUrl: string;
  channelCredential: string;
  channelAudience: string;
  channelMode: string;
  channelPublicKey: string;
  channelLastInbound: string;
  channelActive: string;
  channelGenericSub: string;
  channelAccounts: string;
  channelWhatsApp: string;
  channelWhatsAppSub: string;
  channelTelegram: string;
  channelTelegramSub: string;
  channelDiscord: string;
  channelDiscordSub: string;
  channelGoogleChat: string;
  channelGoogleChatSub: string;
  channelIMessage: string;
  channelIMessageSub: string;
  channelSignal: string;
  channelSignalSub: string;
  channelSlack: string;
  channelSlackSub: string;
  channelNostr: string;
  channelNostrSub: string;
  channelWhatsAppWorking: string;
  channelShowQr: string;
  channelRelink: string;
  channelWaitForScan: string;
  channelLogout: string;
  nostrEditProfile: string;
  nostrAccount: string;
  nostrUsername: string;
  nostrDisplayName: string;
  nostrBio: string;
  nostrAvatarUrl: string;
  nostrBannerUrl: string;
  nostrWebsite: string;
  nostrNip05: string;
  nostrLud16: string;
  nostrSavePublish: string;
  nostrImportRelays: string;
  nostrHideAdvanced: string;
  nostrShowAdvanced: string;
  nostrUnsavedChanges: string;
  nostrProfilePreview: string;
  nostrAdvanced: string;
  nostrImporting: string;
  nostrNoProfileSet: string;
  nostrProfile: string;
  nostrAbout: string;
  nostrName: string;
  // Instances
  instancesTitle: string;
  instancesSub: string;
  instancesNoReported: string;
  instancesUnknownHost: string;
  instancesLastInput: string;
  instancesReason: string;
  instancesScopes: string;
  // Sessions
  sessionsTitle: string;
  sessionsSub: string;
  sessionsActiveWithin: string;
  sessionsLimit: string;
  sessionsIncludeGlobal: string;
  sessionsIncludeUnknown: string;
  sessionsStore: string;
  sessionsKey: string;
  sessionsLabel: string;
  sessionsKind: string;
  sessionsUpdated: string;
  sessionsTokens: string;
  sessionsThinking: string;
  sessionsVerbose: string;
  sessionsReasoning: string;
  sessionsActions: string;
  sessionsNoFound: string;
  // Usage
  usageNoTimeline: string;
  usageNoData: string;
  usageHours: string;
  usageMidnight: string;
  usage4am: string;
  usage8am: string;
  usageNoon: string;
  usage4pm: string;
  usage8pm: string;
  usageDailyToken: string;
  usageDailyCost: string;
  usageOutput: string;
  usageInput: string;
  usageCacheWrite: string;
  usageCacheRead: string;
  usageClearFilters: string;
  usageRemoveFilter: string;
  usageDays: string;
  usageHoursLabel: string;
  usageSession: string;
  usageFiltered: string;
  usageVisible: string;
  usageExport: string;
  usageActivityByTime: string;
  usageMosaicSubNoData: string;
  usageTokensUnit: string;
  usageTimeZoneLocal: string;
  usageTimeZoneUtc: string;
  usageDayOfWeek: string;
  usageDailyUsage: string;
  usageTotal: string;
  usageByType: string;
  usageTokensByType: string;
  usageCostByType: string;
  usageTotalLabel: string;
  usageOverview: string;
  usageMessages: string;
  usageToolCalls: string;
  usageErrors: string;
  usageAvgTokensMsg: string;
  usageAvgCostMsg: string;
  usageSessionsCard: string;
  usageThroughput: string;
  usageErrorRate: string;
  usageCacheHitRate: string;
  usageMessagesHint: string;
  usageToolCallsHint: string;
  usageErrorsHint: string;
  usageAvgTokensMsgHint: string;
  usageSessionsHint: string;
  usageThroughputHint: string;
  usageErrorRateHint: string;
  usageCacheHitRateHint: string;
  usageTopModels: string;
  usageTopProviders: string;
  usageTopTools: string;
  usageTopAgents: string;
  usageTopChannels: string;
  usagePeakErrorDays: string;
  usagePeakErrorHours: string;
  usageNoModelData: string;
  usageNoProviderData: string;
  usageNoToolCalls: string;
  usageNoAgentData: string;
  usageNoChannelData: string;
  usageNoErrorData: string;
  usageShown: string;
  usageTotalSessions: string;
  usageAvg: string;
  usageAll: string;
  usageRecentlyViewed: string;
  usageSort: string;
  usageCost: string;
  usageErrorsCol: string;
  usageMessagesCol: string;
  usageRecent: string;
  usageTokensCol: string;
  usageDescending: string;
  usageAscending: string;
  usageClearSelection: string;
  usageNoRecentSessions: string;
  usageNoSessionsInRange: string;
  usageCopy: string;
  usageCopySessionName: string;
  usageSelectedCount: string;
  usageMoreSessions: string;
  usageUserAssistant: string;
  usageToolsUsed: string;
  usageToolResults: string;
  usageAcrossMessages: string;
  usageInRange: string;
  usageCached: string;
  usagePrompt: string;
  usageCacheHint: string;
  usageErrorHint: string;
  usageTokensHint: string;
  usageCostHint: string;
  usageCostHintMissing: string;
  usageModelMix: string;
  usageDuration: string;
  usageCloseSessionDetails: string;
  usageLoading: string;
  usageNoTimelineData: string;
  usageNoDataInRange: string;
  usageUsageOverTime: string;
  usagePerTurn: string;
  usageCumulative: string;
  usageNoContextData: string;
  usageSystemPromptBreakdown: string;
  usageExpandAll: string;
  usageCollapseAll: string;
  usageBaseContextPerMessage: string;
  usageSys: string;
  usageSkills: string;
  usageToolsLabel: string;
  usageFiles: string;
  usageConversation: string;
  usageNoMessages: string;
  usageSearchConversation: string;
  usageClear: string;
  usageHasTools: string;
  usageUser: string;
  usageAssistant: string;
  usageTool: string;
  usageToolResult: string;
  usageMessagesCount: string;
  usageNoMessagesMatchFilters: string;
  usageTokenUsage: string;
  usageToday: string;
  usage7d: string;
  usage30d: string;
  usageExportSessionsCsv: string;
  usageExportDailyCsv: string;
  usageSessionsCount: string;
  usageQueryHintMatch: string;
  usageQueryHintInRange: string;
  usagePageSubtitle: string;
  usageCalls: string;
  // Cron
  cronScheduler: string;
  cronSchedulerSub: string;
  cronEnabled: string;
  cronJobs: string;
  cronNewJob: string;
  cronNewJobSub: string;
  cronName: string;
  cronDescription: string;
  cronAgentId: string;
  cronSchedule: string;
  cronEvery: string;
  cronAt: string;
  cronCron: string;
  cronSession: string;
  cronMain: string;
  cronIsolated: string;
  cronWakeMode: string;
  cronNextHeartbeat: string;
  cronNow: string;
  cronPayload: string;
  cronSystemEvent: string;
  cronAgentTurn: string;
  cronSystemText: string;
  cronAgentMessage: string;
  cronDelivery: string;
  cronAnnounceSummary: string;
  cronNoneInternal: string;
  cronChannel: string;
  cronTo: string;
  cronAddJob: string;
  cronJobsTitle: string;
  cronJobsSub: string;
  cronNoJobsYet: string;
  cronRunHistory: string;
  cronRunHistorySub: string;
  cronSelectJob: string;
  cronNoRunsYet: string;
  cronSelectJobToInspect: string;
  cronRunAt: string;
  cronUnit: string;
  cronMinutes: string;
  cronHours: string;
  cronDays: string;
  cronExpression: string;
  cronTimeoutSeconds: string;
  cronLast: string;
  // Agents (tool sections - labels only for sidebar/cards; tool id kept as-is)
  agentsFiles: string;
  agentsRuntime: string;
  agentsWeb: string;
  agentsMemory: string;
  agentsSessions: string;
  agentsUi: string;
  agentsMessaging: string;
  agentsAutomation: string;
  agentsReadFile: string;
  agentsWriteFile: string;
  agentsEdit: string;
  agentsApplyPatch: string;
  agentsExec: string;
  agentsProcess: string;
  agentsWebSearch: string;
  agentsWebFetch: string;
  agentsMemorySearch: string;
  agentsMemoryGet: string;
  agentsSessionsList: string;
  agentsSessionsHistory: string;
  agentsSessionsSend: string;
  agentsSessionsSpawn: string;
  agentsSessionStatus: string;
  agentsBrowser: string;
  agentsCanvas: string;
  agentsMessage: string;
  agentsScheduleTasks: string;
  agentsGatewayControl: string;
  agentsNodesDevices: string;
  agentsListAgents: string;
  agentsImageUnderstanding: string;
  agentsNodes: string;
  agentsAgents: string;
  agentsMedia: string;
  agentsTitle: string;
  agentsConfigured: string;
  agentsNoFound: string;
  agentsSelectAgent: string;
  agentsSelectAgentSub: string;
  agentsWorkspaceRouting: string;
  agentsProfileMinimal: string;
  agentsProfileCoding: string;
  agentsProfileMessaging: string;
  agentsProfileFull: string;
  agentsDefault: string;
  agentsSelected: string;
  agentsAllSkills: string;
  agentsCurrentModel: string;
  agentsInheritDefault: string;
  agentsOverview: string;
  agentsOverviewSub: string;
  agentsWorkspace: string;
  agentsPrimaryModel: string;
  agentsIdentityName: string;
  agentsDefaultLabel: string;
  agentsIdentityEmoji: string;
  agentsSkillsFilter: string;
  agentsModelSelection: string;
  agentsPrimaryModelLabel: string;
  agentsPrimaryModelDefault: string;
  agentsFallbacksLabel: string;
  agentsReloadConfig: string;
  agentsAgentContext: string;
  agentsContextWorkspaceIdentity: string;
  agentsContextWorkspaceScheduling: string;
  agentsChannels: string;
  agentsChannelsSub: string;
  agentsLoadChannels: string;
  agentsNoChannels: string;
  agentsConnected: string;
  agentsConfiguredLabel: string;
  agentsEnabled: string;
  agentsDisabled: string;
  agentsNoAccounts: string;
  agentsNotConfigured: string;
  agentsScheduler: string;
  agentsSchedulerSub: string;
  agentsNextWake: string;
  agentsCronJobs: string;
  agentsCronJobsSub: string;
  agentsNoJobsAssigned: string;
  agentsCoreFiles: string;
  agentsCoreFilesSub: string;
  agentsLoadWorkspaceFiles: string;
  agentsNoFilesFound: string;
  agentsSelectFileToEdit: string;
  agentsReset: string;
  agentsFileMissingCreate: string;
  agentsUnavailable: string;
  agentsTabOverview: string;
  agentsTabFiles: string;
  agentsTabTools: string;
  agentsTabSkills: string;
  agentsTabChannels: string;
  agentsTabCron: string;
  agentsFallback: string;
  agentsNever: string;
  agentsLastRefresh: string;
  agentsSkillsPanelSub: string;
  agentsUseAll: string;
  agentsDisableAll: string;
  agentsLoadConfigForSkills: string;
  agentsCustomAllowlist: string;
  agentsAllSkillsEnabled: string;
  agentsLoadSkillsForAgent: string;
  agentsFilter: string;
  agentsNoSkillsFound: string;
  agentsToolsGlobalAllow: string;
  agentsProfile: string;
  agentsSource: string;
  agentsStatus: string;
  agentsUnsaved: string;
  agentsQuickPresets: string;
  agentsInherit: string;
  agentsToolsTitle: string;
  agentsToolsSub: string;
  agentsToolAccess: string;
  agentsToolsSubText: string;
  agentsLoadConfigForTools: string;
  agentsExplicitAllowlist: string;
  agentsEnableAll: string;
  agentsEnabledCount: string;
  // Skills
  skillsTitle: string;
  skillsSub: string;
  skillsSearchPlaceholder: string;
  skillsShown: string;
  skillsWorkspace: string;
  skillsBuiltIn: string;
  skillsInstalled: string;
  skillsExtra: string;
  skillsOther: string;
  // Nodes
  nodesTitle: string;
  nodesSub: string;
  nodesNoFound: string;
  nodesDevices: string;
  nodesDevicesSub: string;
  nodesPending: string;
  nodesPaired: string;
  nodesNoPairedDevices: string;
  nodesRoleLabel: string;
  nodesRoleNone: string;
  nodesRepairSuffix: string;
  nodesRequested: string;
  nodesApprove: string;
  nodesReject: string;
  nodesRolesLabel: string;
  nodesScopesLabel: string;
  nodesTokensNone: string;
  nodesTokens: string;
  nodesTokenRevoked: string;
  nodesTokenActive: string;
  nodesRotate: string;
  nodesRevoke: string;
  nodesBindingTitle: string;
  nodesBindingSub: string;
  nodesBindingFormModeHint: string;
  nodesLoadConfigHint: string;
  nodesLoadConfig: string;
  nodesDefaultBinding: string;
  nodesDefaultBindingSub: string;
  nodesNodeLabel: string;
  nodesAnyNode: string;
  nodesNoNodesSystemRun: string;
  nodesNoAgentsFound: string;
  nodesExecApprovalsTitle: string;
  nodesExecApprovalsSub: string;
  nodesLoadExecApprovalsHint: string;
  nodesLoadApprovals: string;
  nodesTarget: string;
  nodesTargetSub: string;
  nodesHost: string;
  nodesHostGateway: string;
  nodesHostNode: string;
  nodesSelectNode: string;
  nodesNoNodesExecApprovals: string;
  nodesScope: string;
  nodesDefaults: string;
  nodesSecurity: string;
  nodesSecurityDefaultSub: string;
  nodesSecurityAgentSubPrefix: string;
  nodesMode: string;
  nodesUseDefaultPrefix: string;
  nodesUseDefaultButton: string;
  nodesSecurityDeny: string;
  nodesSecurityAllowlist: string;
  nodesSecurityFull: string;
  nodesAsk: string;
  nodesAskDefaultSub: string;
  nodesAskAgentSubPrefix: string;
  nodesAskOff: string;
  nodesAskOnMiss: string;
  nodesAskAlways: string;
  nodesAskFallback: string;
  nodesAskFallbackDefaultSub: string;
  nodesAskFallbackAgentSubPrefix: string;
  nodesFallback: string;
  nodesAutoAllowSkills: string;
  nodesAutoAllowSkillsDefaultSub: string;
  nodesAutoAllowSkillsUsingDefault: string;
  nodesAutoAllowSkillsOverride: string;
  nodesEnabled: string;
  nodesAllowlist: string;
  nodesAllowlistSub: string;
  nodesAddPattern: string;
  nodesNoAllowlistEntries: string;
  nodesNewPattern: string;
  nodesLastUsedPrefix: string;
  nodesPattern: string;
  nodesRemove: string;
  nodesDefaultAgent: string;
  nodesAgent: string;
  nodesUsesDefault: string;
  nodesOverride: string;
  nodesBinding: string;
  nodesChipPaired: string;
  nodesChipUnpaired: string;
  nodesConnected: string;
  nodesOffline: string;
  nodesNever: string;
  // Config (section labels for sidebar)
  configEnv: string;
  configUpdate: string;
  configAgents: string;
  configAuth: string;
  configChannels: string;
  configMessages: string;
  configCommands: string;
  configHooks: string;
  configSkills: string;
  configTools: string;
  configGateway: string;
  configWizard: string;
  configMeta: string;
  configLogging: string;
  configBrowser: string;
  configUi: string;
  configModels: string;
  configBindings: string;
  configBroadcast: string;
  configAudio: string;
  configSession: string;
  configCron: string;
  configWeb: string;
  configDiscovery: string;
  configCanvasHost: string;
  configTalk: string;
  configPlugins: string;
  configEnvVars: string;
  configEnvVarsDesc: string;
  configUpdatesDesc: string;
  configAgentsDesc: string;
  configAuthDesc: string;
  configChannelsDesc: string;
  configMessagesDesc: string;
  configCommandsDesc: string;
  configHooksDesc: string;
  configSkillsDesc: string;
  configToolsDesc: string;
  configGatewayDesc: string;
  configWizardDesc: string;
  configMetaDesc: string;
  configLoggingDesc: string;
  configBrowserDesc: string;
  configUiDesc: string;
  configModelsDesc: string;
  configBindingsDesc: string;
  configBroadcastDesc: string;
  configAudioDesc: string;
  configSessionDesc: string;
  configCronDesc: string;
  configWebDesc: string;
  configDiscoveryDesc: string;
  configCanvasHostDesc: string;
  configTalkDesc: string;
  configPluginsDesc: string;
  // Config page (settings view)
  configSettingsTitle: string;
  configSearchPlaceholder: string;
  configAllSettings: string;
  configForm: string;
  configRaw: string;
  configUnsavedChanges: string;
  configUnsavedChangesLabel: string;
  configOneUnsavedChange: string;
  configNoChanges: string;
  configApplying: string;
  configApply: string;
  configUpdating: string;
  configUpdateButton: string;
  configViewPrefix: string;
  configPendingChange: string;
  configPendingChanges: string;
  configLoadingSchema: string;
  configFormUnsafeWarning: string;
  configRawJson5: string;
  configValidityValid: string;
  configValidityInvalid: string;
  configValidityUnknown: string;
  configSchemaUnavailable: string;
  configUnsupportedSchema: string;
  configNoSettingsMatchPrefix: string;
  configNoSettingsMatchSuffix: string;
  configNoSettingsInSection: string;
  configUnsupportedSchemaNode: string;
  configSubnavAll: string;
  // Debug
  debugSnapshots: string;
  debugSnapshotsSub: string;
  debugStatus: string;
  debugHealth: string;
  debugLastHeartbeat: string;
  debugSecurityAudit: string;
  debugManualRpc: string;
  debugManualRpcSub: string;
  debugMethod: string;
  debugParams: string;
  debugCall: string;
  debugCritical: string;
  debugWarnings: string;
  debugNoCritical: string;
  debugInfo: string;
  debugSecurityAuditDetails: string;
  debugModels: string;
  debugModelsSub: string;
  debugEventLog: string;
  debugEventLogSub: string;
  debugNoEvents: string;
  // Logs
  logsTitle: string;
  logsSub: string;
  logsExportFiltered: string;
  logsExportVisible: string;
};

const EN: Strings = {
  tabGroupChat: "Chat",
  tabGroupControl: "Control",
  tabGroupAgent: "Agent",
  tabGroupSettings: "Settings",
  subtitleAgents: "Manage agent workspaces, tools, and identities.",
  subtitleOverview: "Gateway status, entry points, and a fast health read.",
  subtitleChannels: "Manage channels and settings.",
  subtitleInstances: "Presence beacons from connected clients and nodes.",
  subtitleSessions: "Inspect active sessions and adjust per-session defaults.",
  subtitleUsage: "",
  subtitleCron: "Schedule wakeups and recurring agent runs.",
  subtitleSkills: "Manage skill availability and API key injection.",
  subtitleNodes: "Paired devices, capabilities, and command exposure.",
  subtitleChat: "Direct gateway chat session for quick interventions.",
  subtitleAgentSwarm: "Multi-agent swarm collaboration for ops and SRE.",
  subtitleConfig: "Edit ~/.openclaw/openclaw.json safely.",
  subtitleDebug: "Gateway snapshots, events, and manual RPC calls.",
  subtitleLogs: "Live tail of the gateway file logs.",
  navTitleAgents: "Agents",
  navTitleOverview: "Overview",
  navTitleChannels: "Channels",
  navTitleInstances: "Instances",
  navTitleSessions: "Sessions",
  navTitleUsage: "Usage",
  navTitleCron: "Cron Jobs",
  navTitleSkills: "Skills",
  navTitleNodes: "Nodes",
  navTitleChat: "Chat",
  navTitleAgentSwarm: "Agent Swarm",
  agentSwarmDevBadge: "In Development",
  navTitleConfig: "Config",
  navTitleDebug: "Debug",
  navTitleLogs: "Logs",
  navTitleControl: "Control",
  overviewGatewayAccess: "Gateway Access",
  overviewGatewayAccessSub: "Where the dashboard connects and how it authenticates.",
  overviewWebSocketUrl: "WebSocket URL",
  overviewGatewayToken: "Gateway Token",
  overviewPassword: "Password (not stored)",
  overviewDefaultSessionKey: "Default Session Key",
  overviewConnect: "Connect",
  overviewRefresh: "Refresh",
  overviewConnectHint: "Click Connect to apply connection changes.",
  overviewSnapshot: "Snapshot",
  overviewSnapshotSub: "Latest gateway handshake information.",
  overviewStatus: "Status",
  overviewConnected: "Connected",
  overviewDisconnected: "Disconnected",
  overviewUptime: "Uptime",
  overviewTickInterval: "Tick Interval",
  overviewLastChannelsRefresh: "Last Channels Refresh",
  overviewChannelsHint: "Use Channels to link WhatsApp, Telegram, Discord, Signal, or iMessage.",
  overviewInstances: "Instances",
  overviewInstancesSub: "Presence beacons in the last 5 minutes.",
  overviewSessions: "Sessions",
  overviewSessionsSub: "Recent session keys tracked by the gateway.",
  overviewCron: "Cron",
  overviewCronNext: "Next wake",
  overviewCronEnabled: "Enabled",
  overviewCronDisabled: "Disabled",
  overviewNotes: "Notes",
  overviewNotesSub: "Quick reminders for remote control setups.",
  overviewNoteTailscale: "Tailscale serve",
  overviewNoteTailscaleSub: "Prefer serve mode to keep the gateway on loopback with tailnet auth.",
  overviewNoteSessionHygiene: "Session hygiene",
  overviewNoteSessionHygieneSub: "Use /new or sessions.patch to reset context.",
  overviewNoteCron: "Cron reminders",
  overviewNoteCronSub: "Use isolated sessions for recurring runs.",
  commonLoading: "Loading…",
  commonRefresh: "Refresh",
  commonRefreshing: "Refreshing…",
  commonSaving: "Saving…",
  commonDelete: "Delete",
  commonFilter: "Filter",
  commonOptional: "(optional)",
  commonInherit: "inherit",
  commonOffExplicit: "off (explicit)",
  commonNA: "n/a",
  commonYes: "Yes",
  commonNo: "No",
  channelsHealth: "Channel health",
  channelsHealthSub: "Channel status snapshots from the gateway.",
  channelsNoSnapshot: "No snapshot yet.",
  channelsSchemaUnavailable: "Schema unavailable. Use Raw.",
  channelsConfigSchemaUnavailable: "Channel config schema unavailable.",
  channelsLoadingConfigSchema: "Loading config schema…",
  commonSave: "Save",
  commonReload: "Reload",
  commonCancel: "Cancel",
  channelConfigured: "Configured",
  channelRunning: "Running",
  channelLastStart: "Last start",
  channelLastProbe: "Last probe",
  channelProbe: "Probe",
  channelProbeOk: "ok",
  channelProbeFailed: "failed",
  channelLinked: "Linked",
  channelConnected: "Connected",
  channelLastConnect: "Last connect",
  channelLastMessage: "Last message",
  channelAuthAge: "Auth age",
  channelBaseUrl: "Base URL",
  channelCredential: "Credential",
  channelAudience: "Audience",
  channelMode: "Mode",
  channelPublicKey: "Public Key",
  channelLastInbound: "Last inbound",
  channelActive: "Active",
  channelGenericSub: "Channel status and configuration.",
  channelAccounts: "Accounts",
  channelWhatsApp: "WhatsApp",
  channelWhatsAppSub: "Link WhatsApp Web and monitor connection health.",
  channelTelegram: "Telegram",
  channelTelegramSub: "Bot status and channel configuration.",
  channelDiscord: "Discord",
  channelDiscordSub: "Bot status and channel configuration.",
  channelGoogleChat: "Google Chat",
  channelGoogleChatSub: "Chat API webhook status and channel configuration.",
  channelIMessage: "iMessage",
  channelIMessageSub: "macOS bridge status and channel configuration.",
  channelSignal: "Signal",
  channelSignalSub: "signal-cli status and channel configuration.",
  channelSlack: "Slack",
  channelSlackSub: "Socket mode status and channel configuration.",
  channelNostr: "Nostr",
  channelNostrSub: "Decentralized DMs via Nostr relays (NIP-04).",
  channelWhatsAppWorking: "Working…",
  channelShowQr: "Show QR",
  channelRelink: "Relink",
  channelWaitForScan: "Wait for scan",
  channelLogout: "Logout",
  nostrEditProfile: "Edit Profile",
  nostrAccount: "Account",
  nostrUsername: "Username",
  nostrDisplayName: "Display Name",
  nostrBio: "Bio",
  nostrAvatarUrl: "Avatar URL",
  nostrBannerUrl: "Banner URL",
  nostrWebsite: "Website",
  nostrNip05: "NIP-05 Identifier",
  nostrLud16: "Lightning Address",
  nostrSavePublish: "Save & Publish",
  nostrImportRelays: "Import from Relays",
  nostrHideAdvanced: "Hide Advanced",
  nostrShowAdvanced: "Show Advanced",
  nostrUnsavedChanges: "You have unsaved changes",
  nostrProfilePreview: "Profile picture preview",
  nostrAdvanced: "Advanced",
  nostrImporting: "Importing…",
  nostrNoProfileSet: 'No profile set. Click "Edit Profile" to add your name, bio, and avatar.',
  nostrProfile: "Profile",
  nostrAbout: "About",
  nostrName: "Name",
  instancesTitle: "Connected Instances",
  instancesSub: "Presence beacons from the gateway and clients.",
  instancesNoReported: "No instances reported yet.",
  instancesUnknownHost: "unknown host",
  instancesLastInput: "Last input",
  instancesReason: "Reason",
  instancesScopes: "scopes",
  sessionsTitle: "Sessions",
  sessionsSub: "Active session keys and per-session overrides.",
  sessionsActiveWithin: "Active within (minutes)",
  sessionsLimit: "Limit",
  sessionsIncludeGlobal: "Include global",
  sessionsIncludeUnknown: "Include unknown",
  sessionsStore: "Store",
  sessionsKey: "Key",
  sessionsLabel: "Label",
  sessionsKind: "Kind",
  sessionsUpdated: "Updated",
  sessionsTokens: "Tokens",
  sessionsThinking: "Thinking",
  sessionsVerbose: "Verbose",
  sessionsReasoning: "Reasoning",
  sessionsActions: "Actions",
  sessionsNoFound: "No sessions found.",
  usageNoTimeline: "No timeline data yet.",
  usageNoData: "No data",
  usageHours: "Hours",
  usageMidnight: "Midnight",
  usage4am: "4am",
  usage8am: "8am",
  usageNoon: "Noon",
  usage4pm: "4pm",
  usage8pm: "8pm",
  usageDailyToken: "Daily Token Usage",
  usageDailyCost: "Daily Cost Usage",
  usageOutput: "Output",
  usageInput: "Input",
  usageCacheWrite: "Cache Write",
  usageCacheRead: "Cache Read",
  usageClearFilters: "Clear filters",
  usageRemoveFilter: "Remove filter",
  usageDays: "Days",
  usageHoursLabel: "Hours",
  usageSession: "Session",
  usageFiltered: "filtered",
  usageVisible: "visible",
  usageExport: "Export",
  usageActivityByTime: "Activity by Time",
  usageMosaicSubNoData: "Estimates require session timestamps.",
  usageTokensUnit: "tokens",
  usageTimeZoneLocal: "Local",
  usageTimeZoneUtc: "UTC",
  usageDayOfWeek: "Day of Week",
  usageDailyUsage: "Daily Usage",
  usageTotal: "Total",
  usageByType: "By Type",
  usageTokensByType: "Tokens by Type",
  usageCostByType: "Cost by Type",
  usageTotalLabel: "Total",
  usageOverview: "Usage Overview",
  usageMessages: "Messages",
  usageToolCalls: "Tool Calls",
  usageErrors: "Errors",
  usageAvgTokensMsg: "Avg Tokens / Msg",
  usageAvgCostMsg: "Avg Cost / Msg",
  usageSessionsCard: "Sessions",
  usageThroughput: "Throughput",
  usageErrorRate: "Error Rate",
  usageCacheHitRate: "Cache Hit Rate",
  usageMessagesHint: "Total user + assistant messages in range.",
  usageToolCallsHint: "Total tool call count across sessions.",
  usageErrorsHint: "Total message/tool errors in range.",
  usageAvgTokensMsgHint: "Average tokens per message in this range.",
  usageSessionsHint: "Distinct sessions in the range.",
  usageThroughputHint: "Throughput shows tokens per minute over active time. Higher is better.",
  usageErrorRateHint: "Error rate = errors / total messages. Lower is better.",
  usageCacheHitRateHint: "Cache hit rate = cache read / (input + cache read). Higher is better.",
  usageTopModels: "Top Models",
  usageTopProviders: "Top Providers",
  usageTopTools: "Top Tools",
  usageTopAgents: "Top Agents",
  usageTopChannels: "Top Channels",
  usagePeakErrorDays: "Peak Error Days",
  usagePeakErrorHours: "Peak Error Hours",
  usageNoModelData: "No model data",
  usageNoProviderData: "No provider data",
  usageNoToolCalls: "No tool calls",
  usageNoAgentData: "No agent data",
  usageNoChannelData: "No channel data",
  usageNoErrorData: "No error data",
  usageShown: "shown",
  usageTotalSessions: "total",
  usageAvg: "avg",
  usageAll: "All",
  usageRecentlyViewed: "Recently viewed",
  usageSort: "Sort",
  usageCost: "Cost",
  usageErrorsCol: "Errors",
  usageMessagesCol: "Messages",
  usageRecent: "Recent",
  usageTokensCol: "Tokens",
  usageDescending: "Descending",
  usageAscending: "Ascending",
  usageClearSelection: "Clear Selection",
  usageNoRecentSessions: "No recent sessions",
  usageNoSessionsInRange: "No sessions in range",
  usageCopy: "Copy",
  usageCopySessionName: "Copy session name",
  usageSelectedCount: "Selected",
  usageMoreSessions: "more",
  usageUserAssistant: "user · assistant",
  usageToolsUsed: "tools used",
  usageToolResults: "tool results",
  usageAcrossMessages: "Across messages",
  usageInRange: "in range",
  usageCached: "cached",
  usagePrompt: "prompt",
  usageCacheHint: "Cache hit rate = cache read / (input + cache read). Higher is better.",
  usageErrorHint: "Error rate = errors / total messages. Lower is better.",
  usageTokensHint: "Average tokens per message in this range.",
  usageCostHint: "Average cost per message when providers report costs.",
  usageCostHintMissing:
    "Average cost per message when providers report costs. Cost data is missing for some or all sessions in this range.",
  usageModelMix: "Model Mix",
  usageDuration: "Duration",
  usageCloseSessionDetails: "Close session details",
  usageLoading: "Loading…",
  usageNoTimelineData: "No timeline data",
  usageNoDataInRange: "No data in range",
  usageUsageOverTime: "Usage Over Time",
  usagePerTurn: "Per Turn",
  usageCumulative: "Cumulative",
  usageNoContextData: "No context data",
  usageSystemPromptBreakdown: "System Prompt Breakdown",
  usageExpandAll: "Expand all",
  usageCollapseAll: "Collapse All",
  usageBaseContextPerMessage: "Base context per message",
  usageSys: "Sys",
  usageSkills: "Skills",
  usageToolsLabel: "Tools",
  usageFiles: "Files",
  usageConversation: "Conversation",
  usageNoMessages: "No messages",
  usageSearchConversation: "Search conversation",
  usageClear: "Clear",
  usageHasTools: "Has tools",
  usageUser: "User",
  usageAssistant: "Assistant",
  usageTool: "Tool",
  usageToolResult: "Tool result",
  usageMessagesCount: "messages",
  usageNoMessagesMatchFilters: "No messages match the filters.",
  usageTokenUsage: "Token Usage",
  usageToday: "Today",
  usage7d: "7d",
  usage30d: "30d",
  usageExportSessionsCsv: "Sessions (CSV)",
  usageExportDailyCsv: "Daily (CSV)",
  usageSessionsCount: "sessions",
  usageQueryHintMatch: "{count} of {total} sessions match",
  usageQueryHintInRange: "{total} sessions in range",
  usagePageSubtitle: "See where tokens go, when sessions spike, and what drives cost.",
  usageCalls: "calls",
  cronScheduler: "Scheduler",
  cronSchedulerSub: "Gateway-owned cron scheduler status.",
  cronEnabled: "Enabled",
  cronJobs: "Jobs",
  cronNewJob: "New Job",
  cronNewJobSub: "Create a scheduled wakeup or agent run.",
  cronName: "Name",
  cronDescription: "Description",
  cronAgentId: "Agent ID",
  cronSchedule: "Schedule",
  cronEvery: "Every",
  cronAt: "At",
  cronCron: "Cron",
  cronSession: "Session",
  cronMain: "Main",
  cronIsolated: "Isolated",
  cronWakeMode: "Wake mode",
  cronNextHeartbeat: "Next heartbeat",
  cronNow: "Now",
  cronPayload: "Payload",
  cronSystemEvent: "System event",
  cronAgentTurn: "Agent turn",
  cronSystemText: "System text",
  cronAgentMessage: "Agent message",
  cronDelivery: "Delivery",
  cronAnnounceSummary: "Announce summary (default)",
  cronNoneInternal: "None (internal)",
  cronChannel: "Channel",
  cronTo: "To",
  cronAddJob: "Add job",
  cronJobsTitle: "Jobs",
  cronJobsSub: "All scheduled jobs stored in the gateway.",
  cronNoJobsYet: "No jobs yet.",
  cronRunHistory: "Run history",
  cronRunHistorySub: "Latest runs for",
  cronSelectJob: "(select a job)",
  cronNoRunsYet: "No runs yet.",
  cronSelectJobToInspect: "Select a job to inspect run history.",
  cronRunAt: "Run at",
  cronUnit: "Unit",
  cronMinutes: "Minutes",
  cronHours: "Hours",
  cronDays: "Days",
  cronExpression: "Expression",
  cronTimeoutSeconds: "Timeout (seconds)",
  cronLast: "last",
  agentsFiles: "Files",
  agentsRuntime: "Runtime",
  agentsWeb: "Web",
  agentsMemory: "Memory",
  agentsSessions: "Sessions",
  agentsUi: "UI",
  agentsMessaging: "Messaging",
  agentsAutomation: "Automation",
  agentsReadFile: "Read file contents",
  agentsWriteFile: "Create or overwrite files",
  agentsEdit: "Make precise edits",
  agentsApplyPatch: "Patch files (OpenAI)",
  agentsExec: "Run shell commands",
  agentsProcess: "Manage background processes",
  agentsWebSearch: "Search the web",
  agentsWebFetch: "Fetch web content",
  agentsMemorySearch: "Semantic search",
  agentsMemoryGet: "Read memory files",
  agentsSessionsList: "List sessions",
  agentsSessionsHistory: "Session history",
  agentsSessionsSend: "Send to session",
  agentsSessionsSpawn: "Spawn sub-agent",
  agentsSessionStatus: "Session status",
  agentsBrowser: "Control web browser",
  agentsCanvas: "Control canvases",
  agentsMessage: "Send messages",
  agentsScheduleTasks: "Schedule tasks",
  agentsGatewayControl: "Gateway control",
  agentsNodesDevices: "Nodes + devices",
  agentsListAgents: "List agents",
  agentsImageUnderstanding: "Image understanding",
  agentsNodes: "Nodes",
  agentsAgents: "Agents",
  agentsMedia: "Media",
  agentsTitle: "Agents",
  agentsConfigured: "configured.",
  agentsNoFound: "No agents found.",
  agentsSelectAgent: "Select an agent",
  agentsSelectAgentSub: "Pick an agent to inspect its workspace and tools.",
  agentsWorkspaceRouting: "Agent workspace and routing.",
  agentsProfileMinimal: "Minimal",
  agentsProfileCoding: "Coding",
  agentsProfileMessaging: "Messaging",
  agentsProfileFull: "Full",
  agentsDefault: "default",
  agentsSelected: "selected",
  agentsAllSkills: "all skills",
  agentsCurrentModel: "Current",
  agentsInheritDefault: "Inherit default",
  agentsOverview: "Overview",
  agentsOverviewSub: "Workspace paths and identity metadata.",
  agentsWorkspace: "Workspace",
  agentsPrimaryModel: "Primary Model",
  agentsIdentityName: "Identity Name",
  agentsDefaultLabel: "Default",
  agentsIdentityEmoji: "Identity Emoji",
  agentsSkillsFilter: "Skills Filter",
  agentsModelSelection: "Model Selection",
  agentsPrimaryModelLabel: "Primary model",
  agentsPrimaryModelDefault: "(default)",
  agentsFallbacksLabel: "Fallbacks (comma-separated)",
  agentsReloadConfig: "Reload Config",
  agentsAgentContext: "Agent Context",
  agentsContextWorkspaceIdentity: "Workspace, identity, and model configuration.",
  agentsContextWorkspaceScheduling: "Workspace and scheduling targets.",
  agentsChannels: "Channels",
  agentsChannelsSub: "Gateway-wide channel status snapshot.",
  agentsLoadChannels: "Load channels to see live status.",
  agentsNoChannels: "No channels found.",
  agentsConnected: "connected",
  agentsConfiguredLabel: "configured",
  agentsEnabled: "enabled",
  agentsDisabled: "disabled",
  agentsNoAccounts: "no accounts",
  agentsNotConfigured: "not configured",
  agentsScheduler: "Scheduler",
  agentsSchedulerSub: "Gateway cron status.",
  agentsNextWake: "Next wake",
  agentsCronJobs: "Agent Cron Jobs",
  agentsCronJobsSub: "Scheduled jobs targeting this agent.",
  agentsNoJobsAssigned: "No jobs assigned.",
  agentsCoreFiles: "Core Files",
  agentsCoreFilesSub: "Bootstrap persona, identity, and tool guidance.",
  agentsLoadWorkspaceFiles: "Load the agent workspace files to edit core instructions.",
  agentsNoFilesFound: "No files found.",
  agentsSelectFileToEdit: "Select a file to edit.",
  agentsReset: "Reset",
  agentsFileMissingCreate: "This file is missing. Saving will create it in the agent workspace.",
  agentsUnavailable: "Unavailable",
  agentsTabOverview: "Overview",
  agentsTabFiles: "Files",
  agentsTabTools: "Tools",
  agentsTabSkills: "Skills",
  agentsTabChannels: "Channels",
  agentsTabCron: "Cron Jobs",
  agentsFallback: "fallback",
  agentsNever: "never",
  agentsLastRefresh: "Last refresh",
  agentsSkillsPanelSub: "Per-agent skill allowlist and workspace skills.",
  agentsUseAll: "Use All",
  agentsDisableAll: "Disable All",
  agentsLoadConfigForSkills: "Load the gateway config to set per-agent skills.",
  agentsCustomAllowlist: "This agent uses a custom skill allowlist.",
  agentsAllSkillsEnabled:
    "All skills are enabled. Disabling any skill will create a per-agent allowlist.",
  agentsLoadSkillsForAgent: "Load skills for this agent to view workspace-specific entries.",
  agentsFilter: "Filter",
  agentsNoSkillsFound: "No skills found.",
  agentsToolsGlobalAllow:
    "Global tools.allow is set. Agent overrides cannot enable tools that are globally blocked.",
  agentsProfile: "Profile",
  agentsSource: "Source",
  agentsStatus: "Status",
  agentsUnsaved: "unsaved",
  agentsQuickPresets: "Quick Presets",
  agentsInherit: "Inherit",
  agentsToolsTitle: "Tools",
  agentsToolsSub: "Per-agent tool profile and overrides.",
  agentsToolAccess: "Tool Access",
  agentsToolsSubText: "Profile + per-tool overrides for this agent.",
  agentsLoadConfigForTools: "Load the gateway config to adjust tool profiles.",
  agentsExplicitAllowlist:
    "This agent is using an explicit allowlist in config. Tool overrides are managed in the Config tab.",
  agentsEnableAll: "Enable All",
  agentsEnabledCount: "enabled.",
  skillsTitle: "Skills",
  skillsSub: "Bundled, managed, and workspace skills.",
  skillsSearchPlaceholder: "Search skills",
  skillsShown: "shown",
  skillsWorkspace: "Workspace Skills",
  skillsBuiltIn: "Built-in Skills",
  skillsInstalled: "Installed Skills",
  skillsExtra: "Extra Skills",
  skillsOther: "Other Skills",
  nodesTitle: "Nodes",
  nodesSub: "Paired devices and live links.",
  nodesNoFound: "No nodes found.",
  nodesDevices: "Devices",
  nodesDevicesSub: "Pairing requests + role tokens.",
  nodesPending: "Pending",
  nodesPaired: "Paired",
  nodesNoPairedDevices: "No paired devices.",
  nodesRoleLabel: "role: ",
  nodesRoleNone: "role: -",
  nodesRepairSuffix: " · repair",
  nodesRequested: "requested ",
  nodesApprove: "Approve",
  nodesReject: "Reject",
  nodesRolesLabel: "roles: ",
  nodesScopesLabel: "scopes: ",
  nodesTokensNone: "Tokens: none",
  nodesTokens: "Tokens",
  nodesTokenRevoked: "revoked",
  nodesTokenActive: "active",
  nodesRotate: "Rotate",
  nodesRevoke: "Revoke",
  nodesBindingTitle: "Exec node binding",
  nodesBindingSub: "Pin agents to a specific node when using ",
  nodesBindingFormModeHint: "Switch the Config tab to Form mode to edit bindings here.",
  nodesLoadConfigHint: "Load config to edit bindings.",
  nodesLoadConfig: "Load config",
  nodesDefaultBinding: "Default binding",
  nodesDefaultBindingSub: "Used when agents do not override a node binding.",
  nodesNodeLabel: "Node",
  nodesAnyNode: "Any node",
  nodesNoNodesSystemRun: "No nodes with system.run available.",
  nodesNoAgentsFound: "No agents found.",
  nodesExecApprovalsTitle: "Exec approvals",
  nodesExecApprovalsSub: "Allowlist and approval policy for exec host=gateway/node.",
  nodesLoadExecApprovalsHint: "Load exec approvals to edit allowlists.",
  nodesLoadApprovals: "Load approvals",
  nodesTarget: "Target",
  nodesTargetSub: "Gateway edits local approvals; node edits the selected node.",
  nodesHost: "Host",
  nodesHostGateway: "Gateway",
  nodesHostNode: "Node",
  nodesSelectNode: "Select node",
  nodesNoNodesExecApprovals: "No nodes advertise exec approvals yet.",
  nodesScope: "Scope",
  nodesDefaults: "Defaults",
  nodesSecurity: "Security",
  nodesSecurityDefaultSub: "Default security mode.",
  nodesSecurityAgentSubPrefix: "Default: ",
  nodesMode: "Mode",
  nodesUseDefaultPrefix: "Use default (",
  nodesUseDefaultButton: "Use default",
  nodesSecurityDeny: "Deny",
  nodesSecurityAllowlist: "Allowlist",
  nodesSecurityFull: "Full",
  nodesAsk: "Ask",
  nodesAskDefaultSub: "Default prompt policy.",
  nodesAskAgentSubPrefix: "Default: ",
  nodesAskOff: "Off",
  nodesAskOnMiss: "On miss",
  nodesAskAlways: "Always",
  nodesAskFallback: "Ask fallback",
  nodesAskFallbackDefaultSub: "Applied when the UI prompt is unavailable.",
  nodesAskFallbackAgentSubPrefix: "Default: ",
  nodesFallback: "Fallback",
  nodesAutoAllowSkills: "Auto-allow skill CLIs",
  nodesAutoAllowSkillsDefaultSub: "Allow skill executables listed by the Gateway.",
  nodesAutoAllowSkillsUsingDefault: "Using default (",
  nodesAutoAllowSkillsOverride: "Override (",
  nodesEnabled: "Enabled",
  nodesAllowlist: "Allowlist",
  nodesAllowlistSub: "Case-insensitive glob patterns.",
  nodesAddPattern: "Add pattern",
  nodesNoAllowlistEntries: "No allowlist entries yet.",
  nodesNewPattern: "New pattern",
  nodesLastUsedPrefix: "Last used: ",
  nodesPattern: "Pattern",
  nodesRemove: "Remove",
  nodesDefaultAgent: "default agent",
  nodesAgent: "agent",
  nodesUsesDefault: "uses default (",
  nodesOverride: "override: ",
  nodesBinding: "Binding",
  nodesChipPaired: "paired",
  nodesChipUnpaired: "unpaired",
  nodesConnected: "connected",
  nodesOffline: "offline",
  nodesNever: "never",
  configEnv: "Environment",
  configUpdate: "Updates",
  configAgents: "Agents",
  configAuth: "Authentication",
  configChannels: "Channels",
  configMessages: "Messages",
  configCommands: "Commands",
  configHooks: "Hooks",
  configSkills: "Skills",
  configTools: "Tools",
  configGateway: "Gateway",
  configWizard: "Setup Wizard",
  configMeta: "Metadata",
  configLogging: "Logging",
  configBrowser: "Browser",
  configUi: "UI",
  configModels: "Models",
  configBindings: "Bindings",
  configBroadcast: "Broadcast",
  configAudio: "Audio",
  configSession: "Session",
  configCron: "Cron",
  configWeb: "Web",
  configDiscovery: "Discovery",
  configCanvasHost: "Canvas Host",
  configTalk: "Talk",
  configPlugins: "Plugins",
  configEnvVars: "Environment Variables",
  configEnvVarsDesc: "Environment variables passed to the gateway process",
  configUpdatesDesc: "Auto-update settings and release channel",
  configAgentsDesc: "Agent configurations, models, and identities",
  configAuthDesc: "API keys and authentication profiles",
  configChannelsDesc: "Messaging channels (Telegram, Discord, Slack, etc.)",
  configMessagesDesc: "Message handling and routing settings",
  configCommandsDesc: "Custom slash commands",
  configHooksDesc: "Webhooks and event hooks",
  configSkillsDesc: "Skill packs and capabilities",
  configToolsDesc: "Tool configurations (browser, search, etc.)",
  configGatewayDesc: "Gateway server settings (port, auth, binding)",
  configWizardDesc: "Setup wizard state and history",
  configMetaDesc: "Gateway metadata and version information",
  configLoggingDesc: "Log levels and output configuration",
  configBrowserDesc: "Browser automation settings",
  configUiDesc: "User interface preferences",
  configModelsDesc: "AI model configurations and providers",
  configBindingsDesc: "Key bindings and shortcuts",
  configBroadcastDesc: "Broadcast and notification settings",
  configAudioDesc: "Audio input/output settings",
  configSessionDesc: "Session management and persistence",
  configCronDesc: "Scheduled tasks and automation",
  configWebDesc: "Web server and API settings",
  configDiscoveryDesc: "Service discovery and networking",
  configCanvasHostDesc: "Canvas rendering and display",
  configTalkDesc: "Voice and speech settings",
  configPluginsDesc: "Plugin management and extensions",
  configSettingsTitle: "Settings",
  configSearchPlaceholder: "Search settings…",
  configAllSettings: "All Settings",
  configForm: "Form",
  configRaw: "Raw",
  configUnsavedChanges: "Unsaved changes",
  configUnsavedChangesLabel: "unsaved changes",
  configOneUnsavedChange: "1 unsaved change",
  configNoChanges: "No changes",
  configApplying: "Applying…",
  configApply: "Apply",
  configUpdating: "Updating…",
  configUpdateButton: "Update",
  configViewPrefix: "View ",
  configPendingChange: "pending change",
  configPendingChanges: "pending changes",
  configLoadingSchema: "Loading schema…",
  configFormUnsafeWarning:
    "Form view can't safely edit some fields. Use Raw to avoid losing config entries.",
  configRawJson5: "Raw JSON5",
  configValidityValid: "valid",
  configValidityInvalid: "invalid",
  configValidityUnknown: "unknown",
  configSchemaUnavailable: "Schema unavailable.",
  configUnsupportedSchema: "Unsupported schema. Use Raw.",
  configNoSettingsMatchPrefix: 'No settings match "',
  configNoSettingsMatchSuffix: '"',
  configNoSettingsInSection: "No settings in this section",
  configUnsupportedSchemaNode: "Unsupported schema node. Use Raw mode.",
  configSubnavAll: "All",
  debugSnapshots: "Snapshots",
  debugSnapshotsSub: "Status, health, and heartbeat data.",
  debugStatus: "Status",
  debugHealth: "Health",
  debugLastHeartbeat: "Last heartbeat",
  debugSecurityAudit: "Security audit",
  debugManualRpc: "Manual RPC",
  debugManualRpcSub: "Send a raw gateway method with JSON params.",
  debugMethod: "Method",
  debugParams: "Params",
  debugCall: "Call",
  debugCritical: "critical",
  debugWarnings: "warnings",
  debugNoCritical: "No critical issues",
  debugInfo: "info",
  debugSecurityAuditDetails: "Run openclaw security audit --deep for details.",
  debugModels: "Models",
  debugModelsSub: "Catalog from models.list.",
  debugEventLog: "Event Log",
  debugEventLogSub: "Latest gateway events.",
  debugNoEvents: "No events yet.",
  logsTitle: "Logs",
  logsSub: "Gateway file logs (JSONL).",
  logsExportFiltered: "Export filtered",
  logsExportVisible: "Export visible",
};

const ZH: Strings = {
  tabGroupChat: "聊天",
  tabGroupControl: "控制",
  tabGroupAgent: "代理",
  tabGroupSettings: "设置",
  subtitleAgents: "管理代理工作区、工具与身份。",
  subtitleOverview: "网关状态、入口与健康概览。",
  subtitleChannels: "管理通道与设置。",
  subtitleInstances: "已连接客户端与节点的在线状态。",
  subtitleSessions: "查看活跃会话并调整每会话默认值。",
  subtitleUsage: "",
  subtitleCron: "安排唤醒与定时代理任务。",
  subtitleSkills: "管理技能可用性与 API 密钥注入。",
  subtitleNodes: "已配对设备、能力与命令。",
  subtitleChat: "直接与网关聊天进行快速操作。",
  subtitleAgentSwarm: "多Agent集群协作，面向运维与 SRE。",
  subtitleConfig: "安全编辑 ~/.openocta/openocta.json。",
  subtitleDebug: "网关快照、事件与手动 RPC 调用。",
  subtitleLogs: "网关日志实时查看。",
  navTitleAgents: "代理",
  navTitleOverview: "概览",
  navTitleChannels: "通道",
  navTitleInstances: "实例",
  navTitleSessions: "会话",
  navTitleUsage: "用量",
  navTitleCron: "定时任务",
  navTitleSkills: "技能",
  navTitleNodes: "节点",
  navTitleChat: "Chat",
  navTitleAgentSwarm: "Agent Swarm",
  agentSwarmDevBadge: "开发中",
  navTitleConfig: "配置",
  navTitleDebug: "测试",
  navTitleLogs: "日志",
  navTitleControl: "控制",
  overviewGatewayAccess: "网关访问",
  overviewGatewayAccessSub: "控制台连接地址与认证方式。",
  overviewWebSocketUrl: "WebSocket 地址",
  overviewGatewayToken: "网关令牌",
  overviewPassword: "密码（不保存）",
  overviewDefaultSessionKey: "默认会话 Key",
  overviewConnect: "连接",
  overviewRefresh: "刷新",
  overviewConnectHint: "点击连接以应用连接变更。",
  overviewSnapshot: "快照",
  overviewSnapshotSub: "最近一次网关握手信息。",
  overviewStatus: "状态",
  overviewConnected: "已连接",
  overviewDisconnected: "未连接",
  overviewUptime: "运行时长",
  overviewTickInterval: "心跳间隔",
  overviewLastChannelsRefresh: "最近通道刷新",
  overviewChannelsHint: "在通道中关联 WhatsApp、Telegram、Discord、Signal 或 iMessage。",
  overviewInstances: "实例",
  overviewInstancesSub: "过去 5 分钟内的在线实例数。",
  overviewSessions: "会话",
  overviewSessionsSub: "网关跟踪的最近会话 Key。",
  overviewCron: "定时任务",
  overviewCronNext: "下次执行",
  overviewCronEnabled: "已启用",
  overviewCronDisabled: "已禁用",
  overviewNotes: "说明",
  overviewNotesSub: "远程控制相关简要提示。",
  overviewNoteTailscale: "Tailscale serve",
  overviewNoteTailscaleSub: "建议使用 serve 模式，使网关仅监听本机并由 tailnet 认证。",
  overviewNoteSessionHygiene: "会话清理",
  overviewNoteSessionHygieneSub: "使用 /new 或 sessions.patch 重置上下文。",
  overviewNoteCron: "定时提醒",
  overviewNoteCronSub: "定时任务请使用独立会话。",
  commonLoading: "加载中…",
  commonRefresh: "刷新",
  commonRefreshing: "刷新中…",
  commonSaving: "保存中…",
  commonDelete: "删除",
  commonFilter: "筛选",
  commonOptional: "（可选）",
  commonInherit: "继承",
  commonOffExplicit: "关闭（显式）",
  commonNA: "无",
  commonYes: "是",
  commonNo: "否",
  channelsHealth: "通道健康",
  channelsHealthSub: "网关返回的通道状态快照。",
  channelsNoSnapshot: "暂无快照。",
  channelsSchemaUnavailable: "Schema 不可用，请使用 Raw。",
  channelsConfigSchemaUnavailable: "通道配置 Schema 不可用。",
  channelsLoadingConfigSchema: "正在加载配置 Schema…",
  commonSave: "保存",
  commonReload: "重新加载",
  commonCancel: "取消",
  channelConfigured: "已配置",
  channelRunning: "运行中",
  channelLastStart: "最近启动",
  channelLastProbe: "最近探测",
  channelProbe: "探测",
  channelProbeOk: "正常",
  channelProbeFailed: "失败",
  channelLinked: "已链接",
  channelConnected: "已连接",
  channelLastConnect: "最近连接",
  channelLastMessage: "最近消息",
  channelAuthAge: "认证时长",
  channelBaseUrl: "Base URL",
  channelCredential: "凭证",
  channelAudience: "受众",
  channelMode: "模式",
  channelPublicKey: "公钥",
  channelLastInbound: "最近入站",
  channelActive: "活跃",
  channelGenericSub: "通道状态与配置。",
  channelAccounts: "账号",
  channelWhatsApp: "WhatsApp",
  channelWhatsAppSub: "链接 WhatsApp Web 并监控连接状态。",
  channelTelegram: "Telegram",
  channelTelegramSub: "机器人状态与通道配置。",
  channelDiscord: "Discord",
  channelDiscordSub: "机器人状态与通道配置。",
  channelGoogleChat: "Google Chat",
  channelGoogleChatSub: "Chat API Webhook 状态与通道配置。",
  channelIMessage: "iMessage",
  channelIMessageSub: "macOS 桥接状态与通道配置。",
  channelSignal: "Signal",
  channelSignalSub: "signal-cli 状态与通道配置。",
  channelSlack: "Slack",
  channelSlackSub: "Socket 模式状态与通道配置。",
  channelNostr: "Nostr",
  channelNostrSub: "通过 Nostr 中继的分布式私信（NIP-04）。",
  channelWhatsAppWorking: "处理中…",
  channelShowQr: "显示二维码",
  channelRelink: "重新链接",
  channelWaitForScan: "等待扫码",
  channelLogout: "登出",
  nostrEditProfile: "编辑资料",
  nostrAccount: "账号",
  nostrUsername: "用户名",
  nostrDisplayName: "显示名称",
  nostrBio: "简介",
  nostrAvatarUrl: "头像 URL",
  nostrBannerUrl: "横幅 URL",
  nostrWebsite: "网站",
  nostrNip05: "NIP-05 标识",
  nostrLud16: "Lightning 地址",
  nostrSavePublish: "保存并发布",
  nostrImportRelays: "从中继导入",
  nostrHideAdvanced: "隐藏高级",
  nostrShowAdvanced: "显示高级",
  nostrUnsavedChanges: "您有未保存的更改",
  nostrProfilePreview: "头像预览",
  nostrAdvanced: "高级",
  nostrImporting: "导入中…",
  nostrNoProfileSet: "未设置资料。点击「编辑资料」添加姓名、简介与头像。",
  nostrProfile: "资料",
  nostrAbout: "关于",
  nostrName: "名称",
  instancesTitle: "已连接实例",
  instancesSub: "网关与客户端的在线状态。",
  instancesNoReported: "暂无实例上报。",
  instancesUnknownHost: "未知主机",
  instancesLastInput: "最近输入",
  instancesReason: "原因",
  instancesScopes: "范围",
  sessionsTitle: "会话",
  sessionsSub: "活跃会话 Key 及每会话覆盖项。",
  sessionsActiveWithin: "活跃时间（分钟）",
  sessionsLimit: "数量上限",
  sessionsIncludeGlobal: "包含全局",
  sessionsIncludeUnknown: "包含未知",
  sessionsStore: "存储",
  sessionsKey: "Key",
  sessionsLabel: "标签",
  sessionsKind: "类型",
  sessionsUpdated: "更新时间",
  sessionsTokens: "Token",
  sessionsThinking: "思考",
  sessionsVerbose: "详细",
  sessionsReasoning: "推理",
  sessionsActions: "操作",
  sessionsNoFound: "未找到会话。",
  usageNoTimeline: "暂无时间线数据。",
  usageNoData: "暂无数据",
  usageHours: "小时",
  usageMidnight: "0 点",
  usage4am: "4 点",
  usage8am: "8 点",
  usageNoon: "12 点",
  usage4pm: "16 点",
  usage8pm: "20 点",
  usageDailyToken: "每日 Token 用量",
  usageDailyCost: "每日费用",
  usageOutput: "输出",
  usageInput: "输入",
  usageCacheWrite: "缓存写入",
  usageCacheRead: "缓存读取",
  usageClearFilters: "清除筛选",
  usageRemoveFilter: "移除筛选",
  usageDays: "天",
  usageHoursLabel: "小时",
  usageSession: "会话",
  usageFiltered: "已筛选",
  usageVisible: "当前可见",
  usageExport: "导出",
  usageActivityByTime: "按时间活动",
  usageMosaicSubNoData: "估算需要会话时间戳。",
  usageTokensUnit: "tokens",
  usageTimeZoneLocal: "本地",
  usageTimeZoneUtc: "UTC",
  usageDayOfWeek: "星期",
  usageDailyUsage: "每日用量",
  usageTotal: "合计",
  usageByType: "按类型",
  usageTokensByType: "按类型 Token",
  usageCostByType: "按类型费用",
  usageTotalLabel: "合计",
  usageOverview: "用量概览",
  usageMessages: "消息数",
  usageToolCalls: "工具调用",
  usageErrors: "错误数",
  usageAvgTokensMsg: "平均 Token/条",
  usageAvgCostMsg: "平均费用/条",
  usageSessionsCard: "会话",
  usageThroughput: "吞吐",
  usageErrorRate: "错误率",
  usageCacheHitRate: "缓存命中率",
  usageMessagesHint: "范围内用户+助手消息总数。",
  usageToolCallsHint: "会话中工具调用总次数。",
  usageErrorsHint: "范围内消息/工具错误总数。",
  usageAvgTokensMsgHint: "该范围内每条消息平均 token 数。",
  usageSessionsHint: "范围内的不同会话数。",
  usageThroughputHint: "吞吐为活跃时间内每分钟 token 数，越高越好。",
  usageErrorRateHint: "错误率 = 错误数/总消息数，越低越好。",
  usageCacheHitRateHint: "缓存命中率 = 缓存读取/(输入+缓存读取)，越高越好。",
  usageTopModels: "Top 模型",
  usageTopProviders: "Top 提供商",
  usageTopTools: "Top 工具",
  usageTopAgents: "Top 代理",
  usageTopChannels: "Top 渠道",
  usagePeakErrorDays: "错误高峰日",
  usagePeakErrorHours: "错误高峰时",
  usageNoModelData: "无模型数据",
  usageNoProviderData: "无提供商数据",
  usageNoToolCalls: "无工具调用",
  usageNoAgentData: "无代理数据",
  usageNoChannelData: "无渠道数据",
  usageNoErrorData: "无错误数据",
  usageShown: "显示",
  usageTotalSessions: "总计",
  usageAvg: "平均",
  usageAll: "全部",
  usageRecentlyViewed: "最近查看",
  usageSort: "排序",
  usageCost: "费用",
  usageErrorsCol: "错误",
  usageMessagesCol: "消息",
  usageRecent: "最近",
  usageTokensCol: "Token",
  usageDescending: "降序",
  usageAscending: "升序",
  usageClearSelection: "清除选择",
  usageNoRecentSessions: "无最近会话",
  usageNoSessionsInRange: "范围内无会话",
  usageCopy: "复制",
  usageCopySessionName: "复制会话名",
  usageSelectedCount: "已选",
  usageMoreSessions: "更多",
  usageUserAssistant: "用户 · 助手",
  usageToolsUsed: "使用工具数",
  usageToolResults: "工具结果",
  usageAcrossMessages: "跨消息",
  usageInRange: "范围内",
  usageCached: "缓存",
  usagePrompt: "提示",
  usageCacheHint: "缓存命中率 = 缓存读取/(输入+缓存读取)，越高越好。",
  usageErrorHint: "错误率 = 错误数/总消息数，越低越好。",
  usageTokensHint: "该范围内每条消息平均 token 数。",
  usageCostHint: "提供商上报费用时每条消息平均费用。",
  usageCostHintMissing: "提供商上报费用时每条消息平均费用。部分或全部会话缺少费用数据。",
  usageModelMix: "模型组合",
  usageDuration: "时长",
  usageCloseSessionDetails: "关闭会话详情",
  usageLoading: "加载中…",
  usageNoTimelineData: "无时间线数据",
  usageNoDataInRange: "范围内无数据",
  usageUsageOverTime: "用量随时间",
  usagePerTurn: "每轮",
  usageCumulative: "累计",
  usageNoContextData: "无上下文数据",
  usageSystemPromptBreakdown: "系统提示分解",
  usageExpandAll: "全部展开",
  usageCollapseAll: "全部折叠",
  usageBaseContextPerMessage: "每条消息的基础上下文",
  usageSys: "系统",
  usageSkills: "技能",
  usageToolsLabel: "工具",
  usageFiles: "文件",
  usageConversation: "对话",
  usageNoMessages: "无消息",
  usageSearchConversation: "搜索对话",
  usageClear: "清除",
  usageHasTools: "含工具",
  usageUser: "用户",
  usageAssistant: "助手",
  usageTool: "工具",
  usageToolResult: "工具结果",
  usageMessagesCount: "条消息",
  usageNoMessagesMatchFilters: "没有消息符合筛选条件。",
  usageTokenUsage: "Token 用量",
  usageToday: "今天",
  usage7d: "7 天",
  usage30d: "30 天",
  usageExportSessionsCsv: "会话 (CSV)",
  usageExportDailyCsv: "每日 (CSV)",
  usageSessionsCount: "会话",
  usageQueryHintMatch: "{count} / {total} 个会话匹配",
  usageQueryHintInRange: "{total} 个会话在范围内",
  usagePageSubtitle: "查看 token 消耗、会话高峰与费用驱动因素。",
  usageCalls: "次",
  cronScheduler: "调度器",
  cronSchedulerSub: "网关内置定时调度状态。",
  cronEnabled: "已启用",
  cronJobs: "任务数",
  cronNewJob: "新建任务",
  cronNewJobSub: "创建定时唤醒或代理运行任务。",
  cronName: "名称",
  cronDescription: "描述",
  cronAgentId: "代理 ID",
  cronSchedule: "调度",
  cronEvery: "每",
  cronAt: "在",
  cronCron: "Cron",
  cronSession: "会话",
  cronMain: "主会话",
  cronIsolated: "独立会话",
  cronWakeMode: "唤醒方式",
  cronNextHeartbeat: "下次心跳",
  cronNow: "立即",
  cronPayload: "负载",
  cronSystemEvent: "系统事件",
  cronAgentTurn: "代理轮次",
  cronSystemText: "系统文本",
  cronAgentMessage: "代理消息",
  cronDelivery: "投递",
  cronAnnounceSummary: "公布摘要（默认）",
  cronNoneInternal: "无（内部）",
  cronChannel: "通道",
  cronTo: "发送至",
  cronAddJob: "添加任务",
  cronJobsTitle: "任务列表",
  cronJobsSub: "网关中所有已调度任务。",
  cronNoJobsYet: "暂无任务。",
  cronRunHistory: "运行历史",
  cronRunHistorySub: "最近运行：",
  cronSelectJob: "（选择任务）",
  cronNoRunsYet: "暂无运行记录。",
  cronSelectJobToInspect: "选择任务以查看运行历史。",
  cronRunAt: "运行时间",
  cronUnit: "单位",
  cronMinutes: "分钟",
  cronHours: "小时",
  cronDays: "天",
  cronExpression: "表达式",
  cronTimeoutSeconds: "超时（秒）",
  cronLast: "上次",
  agentsFiles: "文件",
  agentsRuntime: "运行时",
  agentsWeb: "网页",
  agentsMemory: "记忆",
  agentsSessions: "会话",
  agentsUi: "界面",
  agentsMessaging: "消息",
  agentsAutomation: "自动化",
  agentsReadFile: "读取文件内容",
  agentsWriteFile: "创建或覆盖文件",
  agentsEdit: "精确编辑",
  agentsApplyPatch: "应用补丁（OpenAI）",
  agentsExec: "执行 shell 命令",
  agentsProcess: "管理后台进程",
  agentsWebSearch: "网页搜索",
  agentsWebFetch: "抓取网页内容",
  agentsMemorySearch: "语义搜索",
  agentsMemoryGet: "读取记忆文件",
  agentsSessionsList: "列出会话",
  agentsSessionsHistory: "会话历史",
  agentsSessionsSend: "发送到会话",
  agentsSessionsSpawn: "派生子代理",
  agentsSessionStatus: "会话状态",
  agentsBrowser: "控制浏览器",
  agentsCanvas: "控制画布",
  agentsMessage: "发送消息",
  agentsScheduleTasks: "安排任务",
  agentsGatewayControl: "网关控制",
  agentsNodesDevices: "节点与设备",
  agentsListAgents: "列出代理",
  agentsImageUnderstanding: "图像理解",
  agentsNodes: "节点",
  agentsAgents: "代理",
  agentsMedia: "媒体",
  agentsTitle: "代理",
  agentsConfigured: "已配置。",
  agentsNoFound: "未找到代理。",
  agentsSelectAgent: "选择代理",
  agentsSelectAgentSub: "选择一个代理以查看其工作区与工具。",
  agentsWorkspaceRouting: "代理工作区与路由。",
  agentsProfileMinimal: "最小",
  agentsProfileCoding: "编程",
  agentsProfileMessaging: "消息",
  agentsProfileFull: "完整",
  agentsDefault: "默认",
  agentsSelected: "已选",
  agentsAllSkills: "全部技能",
  agentsCurrentModel: "当前",
  agentsInheritDefault: "继承默认",
  agentsOverview: "概览",
  agentsOverviewSub: "工作区路径与身份元数据。",
  agentsWorkspace: "工作区",
  agentsPrimaryModel: "主模型",
  agentsIdentityName: "身份名称",
  agentsDefaultLabel: "默认",
  agentsIdentityEmoji: "身份表情",
  agentsSkillsFilter: "技能筛选",
  agentsModelSelection: "模型选择",
  agentsPrimaryModelLabel: "主模型",
  agentsPrimaryModelDefault: "（默认）",
  agentsFallbacksLabel: "备选（逗号分隔）",
  agentsReloadConfig: "重新加载配置",
  agentsAgentContext: "代理上下文",
  agentsContextWorkspaceIdentity: "工作区、身份与模型配置。",
  agentsContextWorkspaceScheduling: "工作区与调度目标。",
  agentsChannels: "渠道",
  agentsChannelsSub: "网关渠道状态快照。",
  agentsLoadChannels: "加载渠道以查看实时状态。",
  agentsNoChannels: "未找到渠道。",
  agentsConnected: "已连接",
  agentsConfiguredLabel: "已配置",
  agentsEnabled: "已启用",
  agentsDisabled: "已禁用",
  agentsNoAccounts: "无账号",
  agentsNotConfigured: "未配置",
  agentsScheduler: "调度器",
  agentsSchedulerSub: "网关定时状态。",
  agentsNextWake: "下次唤醒",
  agentsCronJobs: "代理定时任务",
  agentsCronJobsSub: "针对此代理的定时任务。",
  agentsNoJobsAssigned: "未分配任务。",
  agentsCoreFiles: "核心文件",
  agentsCoreFilesSub: "引导人设、身份与工具指引。",
  agentsLoadWorkspaceFiles: "加载代理工作区文件以编辑核心说明。",
  agentsNoFilesFound: "未找到文件。",
  agentsSelectFileToEdit: "选择要编辑的文件。",
  agentsReset: "重置",
  agentsFileMissingCreate: "该文件不存在。保存将在代理工作区中创建。",
  agentsUnavailable: "不可用",
  agentsTabOverview: "概览",
  agentsTabFiles: "文件",
  agentsTabTools: "工具",
  agentsTabSkills: "技能",
  agentsTabChannels: "渠道",
  agentsTabCron: "定时任务",
  agentsFallback: "备选",
  agentsNever: "从未",
  agentsLastRefresh: "上次刷新",
  agentsSkillsPanelSub: "每代理技能允许列表与工作区技能。",
  agentsUseAll: "全部启用",
  agentsDisableAll: "全部禁用",
  agentsLoadConfigForSkills: "加载网关配置以设置每代理技能。",
  agentsCustomAllowlist: "此代理使用自定义技能允许列表。",
  agentsAllSkillsEnabled: "所有技能已启用。禁用任意技能将创建每代理允许列表。",
  agentsLoadSkillsForAgent: "加载此代理的技能以查看工作区相关条目。",
  agentsFilter: "筛选",
  agentsNoSkillsFound: "未找到技能。",
  agentsToolsGlobalAllow: "已设置全局 tools.allow。代理覆盖无法启用被全局禁止的工具。",
  agentsProfile: "配置集",
  agentsSource: "来源",
  agentsStatus: "状态",
  agentsUnsaved: "未保存",
  agentsQuickPresets: "快捷预设",
  agentsInherit: "继承",
  agentsToolsTitle: "工具",
  agentsToolsSub: "每代理工具配置集与覆盖。",
  agentsToolAccess: "工具访问",
  agentsToolsSubText: "此代理的配置集与每工具覆盖。",
  agentsLoadConfigForTools: "加载网关配置以调整工具配置集。",
  agentsExplicitAllowlist: "此代理在配置中使用显式允许列表。工具覆盖在配置页管理。",
  agentsEnableAll: "全部启用",
  agentsEnabledCount: "已启用。",
  skillsTitle: "技能",
  skillsSub: "内置、托管与工作区技能。",
  skillsSearchPlaceholder: "搜索技能",
  skillsShown: "条显示",
  skillsWorkspace: "工作区技能",
  skillsBuiltIn: "内置技能",
  skillsInstalled: "已安装技能",
  skillsExtra: "额外技能",
  skillsOther: "其他技能",
  nodesTitle: "节点",
  nodesSub: "已配对设备与在线连接。",
  nodesNoFound: "未找到节点。",
  nodesDevices: "设备",
  nodesDevicesSub: "配对请求与角色令牌。",
  nodesPending: "待处理",
  nodesPaired: "已配对",
  nodesNoPairedDevices: "暂无已配对设备。",
  nodesRoleLabel: "角色：",
  nodesRoleNone: "角色：-",
  nodesRepairSuffix: " · 修复",
  nodesRequested: "请求于 ",
  nodesApprove: "批准",
  nodesReject: "拒绝",
  nodesRolesLabel: "角色：",
  nodesScopesLabel: "范围：",
  nodesTokensNone: "令牌：无",
  nodesTokens: "令牌",
  nodesTokenRevoked: "已撤销",
  nodesTokenActive: "有效",
  nodesRotate: "轮换",
  nodesRevoke: "撤销",
  nodesBindingTitle: "Exec 节点绑定",
  nodesBindingSub: "在使用 ",
  nodesBindingFormModeHint: "请在 Config 选项卡中切换到表单模式以在此编辑绑定。",
  nodesLoadConfigHint: "加载配置以编辑绑定。",
  nodesLoadConfig: "加载配置",
  nodesDefaultBinding: "默认绑定",
  nodesDefaultBindingSub: "当代理未覆盖节点绑定时使用。",
  nodesNodeLabel: "节点",
  nodesAnyNode: "任意节点",
  nodesNoNodesSystemRun: "没有支持 system.run 的节点。",
  nodesNoAgentsFound: "未找到代理。",
  nodesExecApprovalsTitle: "Exec 审批",
  nodesExecApprovalsSub: "exec host=gateway/node 的允许列表与审批策略。",
  nodesLoadExecApprovalsHint: "加载 exec 审批以编辑允许列表。",
  nodesLoadApprovals: "加载审批",
  nodesTarget: "目标",
  nodesTargetSub: "网关编辑本地审批；节点编辑所选节点。",
  nodesHost: "主机",
  nodesHostGateway: "网关",
  nodesHostNode: "节点",
  nodesSelectNode: "选择节点",
  nodesNoNodesExecApprovals: "尚无节点提供 exec 审批。",
  nodesScope: "范围",
  nodesDefaults: "默认",
  nodesSecurity: "安全",
  nodesSecurityDefaultSub: "默认安全模式。",
  nodesSecurityAgentSubPrefix: "默认：",
  nodesMode: "模式",
  nodesUseDefaultPrefix: "使用默认（",
  nodesUseDefaultButton: "使用默认",
  nodesSecurityDeny: "拒绝",
  nodesSecurityAllowlist: "允许列表",
  nodesSecurityFull: "完全",
  nodesAsk: "询问",
  nodesAskDefaultSub: "默认提示策略。",
  nodesAskAgentSubPrefix: "默认：",
  nodesAskOff: "关",
  nodesAskOnMiss: "缺失时",
  nodesAskAlways: "始终",
  nodesAskFallback: "询问回退",
  nodesAskFallbackDefaultSub: "当 UI 提示不可用时应用。",
  nodesAskFallbackAgentSubPrefix: "默认：",
  nodesFallback: "回退",
  nodesAutoAllowSkills: "自动允许技能 CLI",
  nodesAutoAllowSkillsDefaultSub: "允许网关列出的技能可执行文件。",
  nodesAutoAllowSkillsUsingDefault: "使用默认（",
  nodesAutoAllowSkillsOverride: "覆盖（",
  nodesEnabled: "启用",
  nodesAllowlist: "允许列表",
  nodesAllowlistSub: "不区分大小写的 glob 模式。",
  nodesAddPattern: "添加模式",
  nodesNoAllowlistEntries: "尚无允许列表条目。",
  nodesNewPattern: "新模式",
  nodesLastUsedPrefix: "上次使用：",
  nodesPattern: "模式",
  nodesRemove: "移除",
  nodesDefaultAgent: "默认代理",
  nodesAgent: "代理",
  nodesUsesDefault: "使用默认（",
  nodesOverride: "覆盖：",
  nodesBinding: "绑定",
  nodesChipPaired: "已配对",
  nodesChipUnpaired: "未配对",
  nodesConnected: "已连接",
  nodesOffline: "离线",
  nodesNever: "从未",
  configEnv: "环境",
  configUpdate: "更新",
  configAgents: "代理",
  configAuth: "认证",
  configChannels: "通道",
  configMessages: "消息",
  configCommands: "命令",
  configHooks: "钩子",
  configSkills: "技能",
  configTools: "工具",
  configGateway: "网关",
  configWizard: "设置向导",
  configMeta: "元数据",
  configLogging: "日志",
  configBrowser: "浏览器",
  configUi: "界面",
  configModels: "模型",
  configBindings: "绑定",
  configBroadcast: "广播",
  configAudio: "音频",
  configSession: "会话",
  configCron: "定时",
  configWeb: "Web",
  configDiscovery: "发现",
  configCanvasHost: "画布主机",
  configTalk: "语音",
  configPlugins: "插件",
  configEnvVars: "环境变量",
  configEnvVarsDesc: "传入网关进程的环境变量",
  configUpdatesDesc: "自动更新与发布渠道",
  configAgentsDesc: "代理配置、模型与身份",
  configAuthDesc: "API 密钥与认证配置",
  configChannelsDesc: "消息通道（Telegram、Discord、Slack 等）",
  configMessagesDesc: "消息处理与路由",
  configCommandsDesc: "自定义斜杠命令",
  configHooksDesc: "Webhook 与事件钩子",
  configSkillsDesc: "技能包与能力",
  configToolsDesc: "工具配置（浏览器、搜索等）",
  configGatewayDesc: "网关服务（端口、认证、绑定）",
  configWizardDesc: "设置向导状态与历史",
  configMetaDesc: "网关元数据与版本",
  configLoggingDesc: "日志级别与输出",
  configBrowserDesc: "浏览器自动化",
  configUiDesc: "界面偏好",
  configModelsDesc: "AI 模型与提供商",
  configBindingsDesc: "快捷键绑定",
  configBroadcastDesc: "广播与通知",
  configAudioDesc: "音频输入/输出",
  configSessionDesc: "会话管理与持久化",
  configCronDesc: "定时任务与自动化",
  configWebDesc: "Web 服务与 API",
  configDiscoveryDesc: "服务发现与网络",
  configCanvasHostDesc: "画布渲染与显示",
  configTalkDesc: "语音与朗读",
  configPluginsDesc: "插件管理",
  configSettingsTitle: "设置",
  configSearchPlaceholder: "搜索设置…",
  configAllSettings: "全部设置",
  configForm: "表单",
  configRaw: "原始",
  configUnsavedChanges: "未保存的更改",
  configUnsavedChangesLabel: "未保存的更改",
  configOneUnsavedChange: "1 项未保存的更改",
  configNoChanges: "无更改",
  configApplying: "应用中…",
  configApply: "应用",
  configUpdating: "更新中…",
  configUpdateButton: "更新",
  configViewPrefix: "查看 ",
  configPendingChange: "项待处理更改",
  configPendingChanges: "项待处理更改",
  configLoadingSchema: "正在加载架构…",
  configFormUnsafeWarning: "表单视图无法安全编辑部分字段，请使用原始模式以免丢失配置项。",
  configRawJson5: "原始 JSON5",
  configValidityValid: "有效",
  configValidityInvalid: "无效",
  configValidityUnknown: "未知",
  configSchemaUnavailable: "架构不可用。",
  configUnsupportedSchema: "不支持的架构，请使用原始模式。",
  configNoSettingsMatchPrefix: "没有匹配「",
  configNoSettingsMatchSuffix: "」的设置",
  configNoSettingsInSection: "本部分暂无设置",
  configUnsupportedSchemaNode: "不支持的架构节点，请使用原始模式。",
  configSubnavAll: "全部",
  debugSnapshots: "快照",
  debugSnapshotsSub: "状态、健康与心跳数据。",
  debugStatus: "状态",
  debugHealth: "健康",
  debugLastHeartbeat: "最近心跳",
  debugSecurityAudit: "安全审计",
  debugManualRpc: "手动 RPC",
  debugManualRpcSub: "使用 JSON 参数发送原始网关方法。",
  debugMethod: "方法",
  debugParams: "参数",
  debugCall: "调用",
  debugCritical: "严重",
  debugWarnings: "警告",
  debugNoCritical: "无严重问题",
  debugInfo: "信息",
  debugSecurityAuditDetails: "运行 openclaw security audit --deep 查看详细信息。",
  debugModels: "模型",
  debugModelsSub: "来自 models.list 的目录。",
  debugEventLog: "事件日志",
  debugEventLogSub: "最新的网关事件。",
  debugNoEvents: "暂无事件。",
  logsTitle: "日志",
  logsSub: "网关文件日志（JSONL）。",
  logsExportFiltered: "导出已筛选",
  logsExportVisible: "导出可见",
};

const STRINGS: Record<Locale, Strings> = { en: EN, zh: ZH };

export function t<K extends keyof Strings>(key: K): Strings[K] {
  return STRINGS[getLocale()][key];
}

const SECTION_META_KEYS: Record<string, { label: keyof Strings; desc: keyof Strings }> = {
  env: { label: "configEnvVars", desc: "configEnvVarsDesc" },
  update: { label: "configUpdate", desc: "configUpdatesDesc" },
  agents: { label: "configAgents", desc: "configAgentsDesc" },
  auth: { label: "configAuth", desc: "configAuthDesc" },
  channels: { label: "configChannels", desc: "configChannelsDesc" },
  messages: { label: "configMessages", desc: "configMessagesDesc" },
  commands: { label: "configCommands", desc: "configCommandsDesc" },
  hooks: { label: "configHooks", desc: "configHooksDesc" },
  skills: { label: "configSkills", desc: "configSkillsDesc" },
  tools: { label: "configTools", desc: "configToolsDesc" },
  gateway: { label: "configGateway", desc: "configGatewayDesc" },
  wizard: { label: "configWizard", desc: "configWizardDesc" },
  meta: { label: "configMeta", desc: "configMetaDesc" },
  logging: { label: "configLogging", desc: "configLoggingDesc" },
  browser: { label: "configBrowser", desc: "configBrowserDesc" },
  ui: { label: "configUi", desc: "configUiDesc" },
  models: { label: "configModels", desc: "configModelsDesc" },
  bindings: { label: "configBindings", desc: "configBindingsDesc" },
  broadcast: { label: "configBroadcast", desc: "configBroadcastDesc" },
  audio: { label: "configAudio", desc: "configAudioDesc" },
  session: { label: "configSession", desc: "configSessionDesc" },
  cron: { label: "configCron", desc: "configCronDesc" },
  web: { label: "configWeb", desc: "configWebDesc" },
  discovery: { label: "configDiscovery", desc: "configDiscoveryDesc" },
  canvasHost: { label: "configCanvasHost", desc: "configCanvasHostDesc" },
  talk: { label: "configTalk", desc: "configTalkDesc" },
  plugins: { label: "configPlugins", desc: "configPluginsDesc" },
};

export function getSectionMeta(key: string): { label: string; description: string } {
  const meta = SECTION_META_KEYS[key];
  if (meta) {
    return { label: t(meta.label), description: t(meta.desc) };
  }
  return { label: key, description: "" };
}
