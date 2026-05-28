import { LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { EventLogEntry } from "./app-events.ts";
import type { AppViewState } from "./app-view-state.ts";
import type { DevicePairingList } from "./controllers/devices.ts";
import type { ExecApprovalRequest } from "./controllers/exec-approval.ts";
import type { ExecApprovalsFile, ExecApprovalsSnapshot } from "./controllers/exec-approvals.ts";
import type { SkillMessage } from "./controllers/skills.ts";
import type { GatewayBrowserClient, GatewayHelloOk } from "./gateway.ts";
import {
  getProductTourSteps,
  markProductTourCompleted,
  shouldShowProductTour,
  type Tab,
} from "./navigation.ts";
import type { ResolvedTheme, ThemeMode } from "./theme.ts";
import type {
  AgentsListResult,
  AgentsFilesListResult,
  AgentIdentityResult,
  ConfigSnapshot,
  ConfigUiHints,
  CronJob,
  CronRunLogEntry,
  CronStatus,
  HealthSnapshot,
  LogEntry,
  LogLevel,
  PresenceEntry,
  ChannelsStatusSnapshot,
  SessionsListResult,
  SkillStatusReport,
  StatusSummary,
  NostrProfile,
} from "./types.ts";
import type { NostrProfileFormState } from "./views/channels.nostr-profile-form.ts";
import {
  handleChannelConfigReload as handleChannelConfigReloadInternal,
  handleChannelConfigSave as handleChannelConfigSaveInternal,
  handleNostrProfileCancel as handleNostrProfileCancelInternal,
  handleNostrProfileEdit as handleNostrProfileEditInternal,
  handleNostrProfileFieldChange as handleNostrProfileFieldChangeInternal,
  handleNostrProfileImport as handleNostrProfileImportInternal,
  handleNostrProfileSave as handleNostrProfileSaveInternal,
  handleNostrProfileToggleAdvanced as handleNostrProfileToggleAdvancedInternal,
  handleWeWorkQrStart as handleWeWorkQrStartInternal,
  handleWeWorkQrModalClose as handleWeWorkQrModalCloseInternal,
  handleWeixinQrStart as handleWeixinQrStartInternal,
  handleWeixinQrModalClose as handleWeixinQrModalCloseInternal,
  handleWhatsAppLogout as handleWhatsAppLogoutInternal,
  handleWhatsAppStart as handleWhatsAppStartInternal,
  handleWhatsAppWait as handleWhatsAppWaitInternal,
} from "./app-channels.ts";
import {
  handleAbortChat as handleAbortChatInternal,
  handleSendChat as handleSendChatInternal,
  removeQueuedMessage as removeQueuedMessageInternal,
} from "./app-chat.ts";
import { DEFAULT_CRON_FORM, DEFAULT_LOG_LEVEL_FILTERS } from "./app-defaults.ts";
import { connectGateway as connectGatewayInternal } from "./app-gateway.ts";
import {
  handleConnected,
  handleDisconnected,
  handleFirstUpdated,
  handleUpdated,
} from "./app-lifecycle.ts";
import { renderApp } from "./app-render.ts";
import {
  exportLogs as exportLogsInternal,
  handleChatScroll as handleChatScrollInternal,
  handleLogsScroll as handleLogsScrollInternal,
  resetChatScroll as resetChatScrollInternal,
  scheduleChatScroll as scheduleChatScrollInternal,
} from "./app-scroll.ts";
import {
  applySettings as applySettingsInternal,
  loadCron as loadCronInternal,
  loadOverview as loadOverviewInternal,
  setTab as setTabInternal,
  setTheme as setThemeInternal,
  onPopState as onPopStateInternal,
} from "./app-settings.ts";
import {
  resetToolStream as resetToolStreamInternal,
  type ToolStreamEntry,
  type CompactionStatus,
} from "./app-tool-stream.ts";
import { resolveInjectedAssistantIdentity } from "./assistant-identity.ts";
import { loadAssistantIdentity as loadAssistantIdentityInternal } from "./controllers/assistant-identity.ts";
import {
  registerNativeDialogInvoker,
  unregisterNativeDialogInvoker,
  type NativeDialogInvoker,
} from "./native-dialog-bridge.ts";
import { bootstrapShellModeFromUrl, isDesktopShell } from "./open-external-url.ts";
import { loadSettings, type UiSettings } from "./storage.ts";
import type { NativeDialogModel } from "./views/native-dialog-overlay.ts";
import { type ChatAttachment, type ChatQueueItem, type CronFormState } from "./ui-types.ts";

declare global {
  interface Window {
    __OPENCLAW_CONTROL_UI_BASE_PATH__?: string;
    runtime?: {
      Environment?: () => Promise<{ platform?: string }>;
      WindowIsMaximised?: () => Promise<boolean>;
      WindowMinimise?: () => void;
      WindowToggleMaximise?: () => void;
      Quit?: () => void;
    };
  }
}

const injectedAssistantIdentity = resolveInjectedAssistantIdentity();

bootstrapShellModeFromUrl();

function resolveOnboardingMode(): boolean {
  if (!window.location.search) {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("onboarding");
  if (!raw) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

@customElement("openclaw-app")
export class OpenClawApp extends LitElement implements NativeDialogInvoker {
  @state() settings: UiSettings = loadSettings();
  @state() password = "";
  @state() tab: Tab = "message";
  @state() onboarding = resolveOnboardingMode();
  @state() productTourActive = false;
  @state() productTourStepIndex = 0;
  private productTourStartTimer: number | null = null;
  @state() isDesktopShell = isDesktopShell();
  @state() isWindowsDesktop = false;
  @state() isWindowMaximised = false;
  @state() connected = false;
  @state() theme: ThemeMode = this.settings.theme ?? "light";
  @state() themeResolved: ResolvedTheme = "dark";
  @state() hello: GatewayHelloOk | null = null;
  @state() lastError: string | null = null;
  @state() eventLog: EventLogEntry[] = [];
  private eventLogBuffer: EventLogEntry[] = [];
  private toolStreamSyncTimer: number | null = null;
  private sidebarCloseTimer: number | null = null;

  @state() assistantName = injectedAssistantIdentity.name;
  @state() assistantAvatar = injectedAssistantIdentity.avatar;
  @state() assistantAgentId = injectedAssistantIdentity.agentId ?? null;

  @state() sessionKey = this.settings.sessionKey;
  @state() chatLoading = false;
  @state() chatSending = false;
  @state() chatMessage = "";
  @state() chatMessages: unknown[] = [];
  @state() chatToolMessages: unknown[] = [];
  @state() chatStream: string | null = null;
  @state() chatStreamStartedAt: number | null = null;
  @state() chatRunId: string | null = null;
  @state() compactionStatus: CompactionStatus | null = null;
  @state() chatAvatarUrl: string | null = null;
  @state() chatThinkingLevel: string | null = null;
  @state() chatModelRef: string | null = null;
  @state() chatQueue: ChatQueueItem[] = [];
  @state() chatAttachments: ChatAttachment[] = [];
  // Sidebar state for tool output viewing
  @state() sidebarOpen = false;
  @state() sidebarContent: string | null = null;
  @state() sidebarError: string | null = null;
  @state() splitRatio = this.settings.splitRatio;

  @state() nodesLoading = false;
  @state() nodes: Array<Record<string, unknown>> = [];
  @state() devicesLoading = false;
  @state() devicesError: string | null = null;
  @state() devicesList: DevicePairingList | null = null;
  @state() execApprovalsLoading = false;
  @state() execApprovalsSaving = false;
  @state() execApprovalsDirty = false;
  @state() execApprovalsSnapshot: ExecApprovalsSnapshot | null = null;
  @state() execApprovalsForm: ExecApprovalsFile | null = null;
  @state() execApprovalsSelectedAgent: string | null = null;
  @state() execApprovalsTarget: "gateway" | "node" = "gateway";
  @state() execApprovalsTargetNodeId: string | null = null;
  @state() execApprovalQueue: ExecApprovalRequest[] = [];
  @state() execApprovalBusy = false;
  @state() execApprovalError: string | null = null;
  @state() pendingGatewayUrl: string | null = null;

  @state() configLoading = false;
  @state() configRaw = "{\n}\n";
  @state() configRawOriginal = "";
  @state() configValid: boolean | null = null;
  @state() configIssues: unknown[] = [];
  @state() configSaving = false;
  @state() configApplying = false;
  @state() updateRunning = false;
  @state() applySessionKey = this.settings.lastActiveSessionKey;
  @state() configSnapshot: ConfigSnapshot | null = null;
  @state() configSchema: unknown = null;
  @state() configSchemaVersion: string | null = null;
  @state() configSchemaLoading = false;
  @state() configUiHints: ConfigUiHints = {};
  @state() configForm: Record<string, unknown> | null = null;
  @state() configFormOriginal: Record<string, unknown> | null = null;
  @state() configFormDirty = false;
  @state() configFormMode: "form" | "raw" = "raw";
  @state() configSearchQuery = "";
  @state() configActiveSection: string | null = null;
  @state() configActiveSubsection: string | null = null;

  @state() channelsLoading = false;
  @state() channelsSnapshot: ChannelsStatusSnapshot | null = null;
  @state() channelsError: string | null = null;
  @state() channelsLastSuccess: number | null = null;
  @state() whatsappLoginMessage: string | null = null;
  @state() whatsappLoginQrDataUrl: string | null = null;
  @state() whatsappLoginConnected: boolean | null = null;
  @state() whatsappBusy = false;
  @state() weworkQrModalOpen = false;
  @state() weworkQrModalLoading = false;
  @state() weworkQrModalPolling = false;
  @state() weworkQrModalSuccess = false;
  @state() weworkQrModalError: string | null = null;
  @state() weworkQrModalReplaceWarn = false;
  @state() weworkQrModalAuthUrl: string | null = null;
  @state() weworkQrModalGenPageUrl: string | null = null;
  @state() weixinQrModalOpen = false;
  @state() weixinQrModalLoading = false;
  @state() weixinQrModalPolling = false;
  @state() weixinQrModalSuccess = false;
  @state() weixinQrModalError: string | null = null;
  @state() weixinQrModalReplaceWarn = false;
  @state() weixinQrModalImageSrc: string | null = null;
  @state() weixinQrModalScanPageUrl: string | null = null;
  @state() weixinQrModalScanned = false;
  @state() nativeDialog: NativeDialogModel = null;
  @state() nativePromptInput = "";
  /** Browser interval id for WeCom QR polling (not reactive) */
  weworkQrPollTimer: number | null = null;
  weworkQrSuccessCloseTimer: number | null = null;
  weixinQrPollAbort = false;
  weixinQrSuccessCloseTimer: number | null = null;
  weixinQrSessionQrcode = "";
  weixinQrSessionBaseUrl = "";
  weixinQrSessionBotType = "";
  private nativeResolveConfirm: ((ok: boolean) => void) | null = null;
  private nativeResolveAlert: (() => void) | null = null;
  private nativeResolvePrompt: ((v: string | null) => void) | null = null;
  @state() nostrProfileFormState: NostrProfileFormState | null = null;
  @state() nostrProfileAccountId: string | null = null;
  @state() channelsSelectedChannelId: string | null = null;
  @state() mcpSelectedKey: string | null = null;
  @state() mcpViewMode: "list" | "card" = "card";
  @state() mcpEditMode: "form" | "raw" = "form";
  @state() mcpEditConnectionType: "stdio" | "url" | "service" = "stdio";
  @state() mcpFormDirty = false;
  @state() mcpRawJson = "";
  @state() mcpRawError: string | null = null;
  @state() mcpAddModalOpen = false;
  @state() mcpAddName = "";
  @state() mcpAddDraft: Record<string, unknown> = {};
  @state() mcpAddConnectionType: "stdio" | "url" | "service" = "stdio";
  @state() mcpAddEditMode: "form" | "raw" = "form";
  @state() mcpAddRawJson = "{}";
  @state() mcpAddRawError: string | null = null;
  @state() llmTraceLoading = false;
  @state() llmTraceResult: import("./controllers/llm-trace.js").TraceListResult | null = null;
  @state() llmTraceError: string | null = null;
  @state() llmTraceMode: "active" | "all" = "active";
  @state() llmTraceSearch = "";
  @state() llmTraceEnabled = false;
  @state() llmTraceSaving = false;
  @state() llmTraceViewContent: string | null = null;
  @state() llmTraceViewingSessionId: string | null = null;
  @state() llmTraceViewLoading = false;
  @state() securityForm: import("./controllers/security.js").SecurityConfigForm | Record<string, unknown> | null = null;
  @state() approvalsLoading = false;
  @state() approvalsResult: import("./controllers/approvals.js").ApprovalsListResult | null = null;
  @state() approvalsError: string | null = null;
  @state() approvalBannerVisible = false;
  @state() approvalBannerPollInitialized = false;
  @state() approvalBannerBaselineIds: string[] = [];
  @state() approvalBannerPendingCount = 0;
  @state() modelsSelectedProvider: string | null = null;
  @state() modelsProviderSearchQuery = "";
  @state() modelsViewMode: "list" | "card" = "card";
  @state() modelsFormDirty = false;
  @state() modelsAddProviderModalOpen = false;
  @state() modelsAddProviderForm: {
    providerId: string;
    displayName: string;
    baseUrl: string;
    apiKey: string;
    apiKeyPrefix: string;
  } = {
    providerId: "",
    displayName: "",
    baseUrl: "",
    apiKey: "",
    apiKeyPrefix: "",
  };
  @state() modelsAddModelModalOpen = false;
  @state() modelsAddModelForm: { modelId: string; modelName: string; contextWindow: string; maxTokens: string } = {
    modelId: "",
    modelName: "",
    contextWindow: "",
    maxTokens: "",
  };
  @state() modelsUseModelModalOpen = false;
  @state() modelsUseModelModalProvider: string | null = null;
  @state() modelsSaveError: string | null = null;
  @state() modelLibraryCategory: "__all__" | "public" | "local" = "__all__";
  @state() modelLibrarySelectedProvider: string | null = null;
  @state() skillsSelectedSkillKey: string | null = null;
  @state() skillsSkillDocContent: string | null = null;
  @state() skillsSkillDocLoading = false;
  @state() skillsSkillDocError: string | null = null;
  @state() skillsViewMode: "list" | "card" = "card";

  @state() presenceLoading = false;
  @state() presenceEntries: PresenceEntry[] = [];
  @state() presenceError: string | null = null;
  @state() presenceStatus: string | null = null;

  @state() agentsLoading = false;
  @state() agentsList: AgentsListResult | null = null;
  @state() agentsError: string | null = null;
  @state() agentsSelectedId: string | null = null;
  @state() agentsPanel: "overview" | "files" | "tools" | "skills" | "channels" | "cron" =
    "overview";
  @state() agentFilesLoading = false;
  @state() agentFilesError: string | null = null;
  @state() agentFilesList: AgentsFilesListResult | null = null;
  @state() agentFileContents: Record<string, string> = {};
  @state() agentFileDrafts: Record<string, string> = {};
  @state() agentFileActive: string | null = null;
  @state() agentFileSaving = false;
  @state() agentIdentityLoading = false;
  @state() agentIdentityError: string | null = null;
  @state() agentIdentityById: Record<string, AgentIdentityResult> = {};
  @state() agentSkillsLoading = false;
  @state() agentSkillsError: string | null = null;
  @state() agentSkillsReport: SkillStatusReport | null = null;
  @state() agentSkillsAgentId: string | null = null;

  @state() sessionsLoading = false;
  @state() sessionsResult: SessionsListResult | null = null;
  @state() sessionEditingKey: string | null = null;
  @state() sessionOverflow: { top: number; right: number; key: string } | null = null;
  @state() sessionSidebarQuery = "";
  @state() sessionsError: string | null = null;
  @state() sessionsFilterActive = "";
  @state() sessionsFilterLimit = "120";
  @state() sessionsIncludeGlobal = true;
  @state() sessionsIncludeUnknown = false;
  @state() sessionsBulkMode = false;
  @state() sessionsSelectedKeys: string[] = [];

  @state() usageLoading = false;
  @state() usageResult: import("./types.js").SessionsUsageResult | null = null;
  @state() usageCostSummary: import("./types.js").CostUsageSummary | null = null;
  @state() usageError: string | null = null;
  @state() usageStartDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  @state() usageEndDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  @state() usageSelectedSessions: string[] = [];
  @state() usageSelectedDays: string[] = [];
  @state() usageSelectedHours: number[] = [];
  @state() usageChartMode: "tokens" | "cost" = "tokens";
  @state() usageDailyChartMode: "total" | "by-type" = "by-type";
  @state() usageTimeSeriesMode: "cumulative" | "per-turn" = "per-turn";
  @state() usageTimeSeriesBreakdownMode: "total" | "by-type" = "by-type";
  @state() usageTimeSeries: import("./types.js").SessionUsageTimeSeries | null = null;
  @state() usageTimeSeriesLoading = false;
  @state() usageSessionLogs: import("./views/usage.js").SessionLogEntry[] | null = null;
  @state() usageSessionLogsLoading = false;
  @state() usageSessionLogsExpanded = false;
  // Applied query (used to filter the already-loaded sessions list client-side).
  @state() usageQuery = "";
  // Draft query text (updates immediately as the user types; applied via debounce or "Search").
  @state() usageQueryDraft = "";
  @state() usageSessionSort: "tokens" | "cost" | "recent" | "messages" | "errors" = "recent";
  @state() usageSessionSortDir: "desc" | "asc" = "desc";
  @state() usageRecentSessions: string[] = [];
  @state() usageTimeZone: "local" | "utc" = "local";
  @state() usageContextExpanded = false;
  @state() usageHeaderPinned = false;
  @state() usageSessionsTab: "all" | "recent" = "all";
  @state() usageVisibleColumns: string[] = [
    "channel",
    "agent",
    "provider",
    "model",
    "messages",
    "tools",
    "errors",
    "duration",
  ];
  @state() usageLogFilterRoles: import("./views/usage.js").SessionLogRole[] = [];
  @state() usageLogFilterTools: string[] = [];
  @state() usageLogFilterHasTools = false;
  @state() usageLogFilterQuery = "";

  // Non-reactive (don’t trigger renders just for timer bookkeeping).
  usageQueryDebounceTimer: number | null = null;

  @state() cronLoading = false;
  @state() cronJobs: CronJob[] = [];
  @state() cronStatus: CronStatus | null = null;
  @state() cronError: string | null = null;
  @state() cronForm: CronFormState = { ...DEFAULT_CRON_FORM };
  @state() cronRunsJobId: string | null = null;
  @state() cronRuns: CronRunLogEntry[] = [];
  @state() cronBusy = false;
  @state() cronAddModalOpen = false;
  @state() cronEditModalOpen = false;
  @state() cronEditJobId: string | null = null;

  @state() skillsLoading = false;
  @state() skillsReport: SkillStatusReport | null = null;
  @state() skillsError: string | null = null;
  @state() skillsFilter = "";
  @state() skillEdits: Record<string, string> = {};
  @state() skillsBusyKey: string | null = null;
  @state() skillMessages: Record<string, SkillMessage> = {};
  @state() skillsAddModalOpen = false;
  @state() skillsUploadName = "";
  @state() skillsUploadFiles: File[] = [];
  @state() skillsUploadError: string | null = null;
  @state() skillsUploadTemplate: string | null = null;
  @state() skillsUploadBusy = false;

  @state() swarmLoading = false;
  @state() swarmError: string | null = null;
  @state() swarmWorkspaces: import("./types/swarm-types.ts").SwarmWorkspace[] = [];
  @state() swarmActiveWorkspaceId: string | null = null;
  @state() swarmMembers: import("./types/swarm-types.ts").SwarmMember[] = [];
  @state() swarmSelectedMemberId: string | null = null;
  @state() swarmGraph: import("./types/swarm-types.ts").SwarmGraph | null = null;
  @state() swarmHistory: import("./types/swarm-types.ts").SwarmHistoryEntry[] = [];
  @state() swarmInput = "";
  @state() swarmSending = false;
  @state() swarmStreamText = "";
  @state() swarmReasoningText = "";
  @state() swarmToolEntries: import("./controllers/swarm.ts").SwarmToolEntry[] = [];
  @state() swarmTreeCollapsed: Record<string, boolean> = {};
  @state() swarmMidSplit = 0.52;
  @state() swarmEventsCollapsed = false;
  @state() swarmVizScale = 0.9;
  @state() swarmVizOffsetX = 0;
  @state() swarmVizOffsetY = 0;
  @state() swarmPanelCollapsed: Record<string, boolean> = { reasoning: true, tools: true };
  @state() swarmCreateModalOpen = false;
  @state() swarmCreateModalLabel = "AgentSwarm";
  @state() swarmDeleteModalOpen = false;
  @state() swarmDeleteTargetId: string | null = null;
  @state() swarmDeleteTargetLabel = "";
  @state() swarmAddMemberModalOpen = false;
  @state() swarmAddMemberEmployeeId = "";
  @state() swarmAddMemberLabel = "子任务";

  @state() digitalEmployeesLoading = false;
  @state() digitalEmployeesError: string | null = null;
  @state() digitalEmployeesFilter = "";
  @state() digitalEmployeesViewMode: "list" | "card" = "list";
  @state() digitalEmployees: {
    id: string;
    name: string;
    description: string;
    prompt?: string;
    enabled?: boolean;
    createdAt?: number;
    builtin: boolean;
    skillIds?: string[];
    skillNames?: string[];
    mcpServerKeys?: string[];
  }[] = [];
  @state() digitalEmployeeCreateModalOpen = false;
  @state() digitalEmployeeCreateName = "";
  @state() digitalEmployeeCreateDescription = "";
  @state() digitalEmployeeCreatePrompt = "";
  @state() digitalEmployeeCreateError: string | null = null;
  @state() digitalEmployeeCreateBusy = false;
  @state() digitalEmployeeAdvancedOpen = false;
  @state() digitalEmployeeCreateMcpMode: "builder" | "raw" = "builder";
  @state() digitalEmployeeCreateMcpJson = "";
  @state() digitalEmployeeCreateMcpItems: import("./views/digital-employee.js").EmployeeMcpItem[] = [];
  @state() digitalEmployeeSkillUploadName = "";
  @state() digitalEmployeeSkillUploadFiles: File[] = [];
  @state() digitalEmployeeSkillUploadError: string | null = null;
  @state() digitalEmployeeSkillUploadBusy = false;
  @state() digitalEmployeeEditModalOpen = false;
  @state() digitalEmployeeEditId = "";
  @state() digitalEmployeeEditName = "";
  @state() digitalEmployeeEditDescription = "";
  @state() digitalEmployeeEditPrompt = "";
  @state() digitalEmployeeEditMcpJson = "";
  @state() digitalEmployeeEditMcpMode: "builder" | "raw" = "raw";
  @state() digitalEmployeeEditMcpItems: import("./views/digital-employee.js").EmployeeMcpItem[] = [];
  @state() digitalEmployeeEditSkillNames: string[] = [];
  @state() digitalEmployeeEditSkillFilesToUpload: File[] = [];
  @state() digitalEmployeeEditSkillsToDelete: string[] = [];
  @state() digitalEmployeeEditEnabled = true;
  @state() digitalEmployeeEditError: string | null = null;
  @state() digitalEmployeeEditBusy = false;

  // Remote catalogs (employee market / skill library / tool library / tutorials)
  @state() employeeMarketLoadedOnce = false;
  @state() employeeMarketLoading = false;
  @state() employeeMarketError: string | null = null;
  @state() employeeMarketQuery = "";
  @state() employeeMarketCategory = "__all__";
  @state() employeeMarketCategoryDescendants: string[] = [];
  @state() employeeMarketViewMode: "list" | "card" = "card";
  @state() employeeMarketItems: import("./controllers/remote-market.ts").EmployeeListItem[] = [];
  @state() employeeMarketSelectedId: number | string | null = null;
  @state() employeeMarketSelectedDetail: import("./controllers/remote-market.ts").EmployeeDetail | null = null;
  @state() employeeMarketInstalledRemoteIds = new Set<string>();
  @state() employeeMarketRemoteToLocal: Record<string, string> = {};
  @state() employeeMarketInstallingId: string | null = null;

  @state() skillLibraryLoadedOnce = false;
  @state() skillLibraryLoading = false;
  @state() skillLibraryError: string | null = null;
  @state() skillLibraryQuery = "";
  @state() skillLibraryCategory = "__all__";
  @state() skillLibraryCategoryDescendants: string[] = [];
  @state() skillLibraryStatus = "__all__";
  @state() skillLibraryItems: import("./controllers/remote-market.ts").SkillListItem[] = [];
  @state() skillLibrarySelectedFolder: string | null = null;
  @state() skillLibrarySelectedDetail: import("./controllers/remote-market.ts").SkillDetail | null = null;
  @state() skillLibraryInstallingFolder: string | null = null;
  @state() skillLibraryInstallSuccess: string | null = null;
  @state() skillLibraryEditModalOpen = false;
  @state() skillLibraryEditSkillKey: string | null = null;
  @state() skillLibraryEditFiles: string[] = [];
  @state() skillLibraryEditSelectedFile: string | null = null;
  @state() skillLibraryEditContent = "";
  @state() skillLibraryEditOriginalContent = "";
  @state() skillLibraryEditLoading = false;
  @state() skillLibraryEditSaving = false;
  @state() skillLibraryEditError: string | null = null;
  @state() skillLibraryEditSyntaxError: string | null = null;
  @state() skillLibraryEditSuccessMessage: string | null = null;

  @state() toolLibraryLoadedOnce = false;
  @state() toolLibraryLoading = false;
  @state() toolLibraryError: string | null = null;
  @state() toolLibraryQuery = "";
  @state() toolLibraryCategory = "__all__";
  @state() toolLibraryCategoryDescendants: string[] = [];
  @state() toolLibraryItems: import("./controllers/remote-market.ts").McpListItem[] = [];
  @state() toolLibrarySelectedId: number | string | null = null;
  @state() toolLibrarySelectedDetail: import("./controllers/remote-market.ts").McpDetail | null = null;
  @state() toolLibraryInstalledRemoteIds = new Set<string>();
  @state() toolLibraryInstalledMcpMap = new Map<number | string, string>();
  @state() toolLibraryInstallingId: number | null = null;
  @state() toolLibraryMcpEditModalOpen = false;
  @state() toolLibraryMcpEditServerKey = "";

  @state() tutorialsLoadedOnce = false;
  @state() tutorialsLoading = false;
  @state() tutorialsError: string | null = null;
  @state() tutorialCategories: import("./controllers/remote-market.ts").EduCategory[] = [];
  @state() tutorialsQuery = "";
  @state() tutorialsSelectedCategoryId: number | null = null;
  @state() tutorialsPlayingLink: string | null = null;
  @state() aboutUninstallModalOpen = false;
  @state() aboutUninstallMode: "program" | "full" = "program";
  @state() aboutUninstallLoading = false;
  @state() aboutUninstallError: string | null = null;
  @state() aboutClearWorkspaceLoading = false;
  @state() aboutClearWorkspaceError: string | null = null;

  @state() debugLoading = false;
  @state() debugStatus: StatusSummary | null = null;
  @state() debugHealth: HealthSnapshot | null = null;
  @state() debugModels: unknown[] = [];
  @state() debugHeartbeat: unknown = null;
  @state() debugCallMethod = "";
  @state() debugCallParams = "{}";
  @state() debugCallResult: string | null = null;
  @state() debugCallError: string | null = null;

  @state() logsLoading = false;
  @state() logsError: string | null = null;
  @state() logsFile: string | null = null;
  @state() logsEntries: LogEntry[] = [];
  @state() logsFilterText = "";
  @state() logsLevelFilters: Record<LogLevel, boolean> = {
    ...DEFAULT_LOG_LEVEL_FILTERS,
  };
  @state() logsAutoFollow = true;
  @state() logsTruncated = false;
  @state() logsCursor: number | null = null;
  @state() logsLastFetchAt: number | null = null;
  @state() logsLimit = 500;
  @state() logsMaxBytes = 250_000;
  @state() logsAtBottom = true;

  client: GatewayBrowserClient | null = null;
  approvalBannerPollInterval: number | null = null;
  private chatScrollFrame: number | null = null;
  private chatScrollTimeout: number | null = null;
  private chatHasAutoScrolled = false;
  private chatUserNearBottom = true;
  @state() chatNewMessagesBelow = false;
  /** true = only assistant/user in thread; false = show tool rows (I/O still collapsible in UI). */
  @state() chatConversationOnly = true;
  private nodesPollInterval: number | null = null;
  private logsPollInterval: number | null = null;
  private debugPollInterval: number | null = null;
  private logsScrollFrame: number | null = null;
  private toolStreamById = new Map<string, ToolStreamEntry>();
  private toolStreamOrder: string[] = [];
  refreshSessionsAfterChat = new Set<string>();
  basePath = "";
  private popStateHandler = () =>
    onPopStateInternal(this as unknown as Parameters<typeof onPopStateInternal>[0]);
  private themeMedia: MediaQueryList | null = null;
  private themeMediaHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private topbarObserver: ResizeObserver | null = null;
  private desktopWindowResizeHandler: (() => void) | null = null;
  private sessionOverflowEscapeHandler = (ev: KeyboardEvent) => {
    if (ev.key !== "Escape") {
      return;
    }
    if (this.nativeDialog) {
      if (this.nativeDialog.kind === "alert") {
        this.handleNativeDialogConfirm();
      } else {
        this.handleNativeDialogCancel();
      }
      return;
    }
    if (this.sessionOverflow) {
      this.sessionOverflow = null;
    }
  };

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    registerNativeDialogInvoker(this);
    document.addEventListener("keydown", this.sessionOverflowEscapeHandler);
    handleConnected(this as unknown as Parameters<typeof handleConnected>[0]);
    void this.initialiseDesktopWindowChrome();
  }

  protected firstUpdated() {
    handleFirstUpdated(this as unknown as Parameters<typeof handleFirstUpdated>[0]);
  }

  disconnectedCallback() {
    if (this.productTourStartTimer != null) {
      window.clearTimeout(this.productTourStartTimer);
      this.productTourStartTimer = null;
    }
    unregisterNativeDialogInvoker(this);
    document.removeEventListener("keydown", this.sessionOverflowEscapeHandler);
    this.teardownDesktopWindowChrome();
    handleDisconnected(this as unknown as Parameters<typeof handleDisconnected>[0]);
    super.disconnectedCallback();
  }

  protected updated(changed: Map<PropertyKey, unknown>) {
    handleUpdated(this as unknown as Parameters<typeof handleUpdated>[0], changed);
  }

  connect() {
    connectGatewayInternal(this as unknown as Parameters<typeof connectGatewayInternal>[0]);
  }

  handleChatScroll(event: Event) {
    handleChatScrollInternal(
      this as unknown as Parameters<typeof handleChatScrollInternal>[0],
      event,
    );
  }

  handleLogsScroll(event: Event) {
    handleLogsScrollInternal(
      this as unknown as Parameters<typeof handleLogsScrollInternal>[0],
      event,
    );
  }

  exportLogs(lines: string[], label: string) {
    exportLogsInternal(lines, label);
  }

  resetToolStream() {
    resetToolStreamInternal(this as unknown as Parameters<typeof resetToolStreamInternal>[0]);
  }

  resetChatScroll() {
    resetChatScrollInternal(this as unknown as Parameters<typeof resetChatScrollInternal>[0]);
  }

  scrollToBottom() {
    resetChatScrollInternal(this as unknown as Parameters<typeof resetChatScrollInternal>[0]);
    scheduleChatScrollInternal(
      this as unknown as Parameters<typeof scheduleChatScrollInternal>[0],
      true,
    );
  }

  async loadAssistantIdentity() {
    await loadAssistantIdentityInternal(this);
  }

  applySettings(next: UiSettings) {
    applySettingsInternal(this as unknown as Parameters<typeof applySettingsInternal>[0], next);
  }

  setTab(next: Tab) {
    setTabInternal(this as unknown as Parameters<typeof setTabInternal>[0], next);
  }

  setTheme(next: ThemeMode, context?: Parameters<typeof setThemeInternal>[2]) {
    setThemeInternal(this as unknown as Parameters<typeof setThemeInternal>[0], next, context);
  }

  async loadOverview() {
    await loadOverviewInternal(this as unknown as Parameters<typeof loadOverviewInternal>[0]);
  }

  async loadCron() {
    await loadCronInternal(this as unknown as Parameters<typeof loadCronInternal>[0]);
  }

  async handleAbortChat() {
    await handleAbortChatInternal(this as unknown as Parameters<typeof handleAbortChatInternal>[0]);
  }

  removeQueuedMessage(id: string) {
    removeQueuedMessageInternal(
      this as unknown as Parameters<typeof removeQueuedMessageInternal>[0],
      id,
    );
  }

  async handleSendChat(
    messageOverride?: string,
    opts?: Parameters<typeof handleSendChatInternal>[2],
  ) {
    await handleSendChatInternal(
      this as unknown as Parameters<typeof handleSendChatInternal>[0],
      messageOverride,
      opts,
    );
  }

  async handleWhatsAppStart(force: boolean) {
    await handleWhatsAppStartInternal(this, force);
  }

  async handleWhatsAppWait() {
    await handleWhatsAppWaitInternal(this);
  }

  async handleWhatsAppLogout() {
    await handleWhatsAppLogoutInternal(this);
  }

  async handleWeWorkQrStart() {
    await handleWeWorkQrStartInternal(this);
  }

  handleWeWorkQrModalClose() {
    handleWeWorkQrModalCloseInternal(this);
  }

  async handleWeixinQrStart() {
    await handleWeixinQrStartInternal(this);
  }

  handleWeixinQrModalClose() {
    handleWeixinQrModalCloseInternal(this);
  }

  async handleChannelConfigSave() {
    await handleChannelConfigSaveInternal(this);
  }

  async handleChannelConfigReload() {
    await handleChannelConfigReloadInternal(this);
  }

  handleNostrProfileEdit(accountId: string, profile: NostrProfile | null) {
    handleNostrProfileEditInternal(this, accountId, profile);
  }

  handleNostrProfileCancel() {
    handleNostrProfileCancelInternal(this);
  }

  handleNostrProfileFieldChange(field: keyof NostrProfile, value: string) {
    handleNostrProfileFieldChangeInternal(this, field, value);
  }

  async handleNostrProfileSave() {
    await handleNostrProfileSaveInternal(this);
  }

  async handleNostrProfileImport() {
    await handleNostrProfileImportInternal(this);
  }

  handleNostrProfileToggleAdvanced() {
    handleNostrProfileToggleAdvancedInternal(this);
  }

  async handleExecApprovalDecision(decision: "allow-once" | "allow-always" | "deny") {
    const active = this.execApprovalQueue[0];
    if (!active || !this.client || this.execApprovalBusy) {
      return;
    }
    this.execApprovalBusy = true;
    this.execApprovalError = null;
    try {
      await this.client.request("exec.approval.resolve", {
        id: active.id,
        decision,
      });
      this.execApprovalQueue = this.execApprovalQueue.filter((entry) => entry.id !== active.id);
    } catch (err) {
      this.execApprovalError = `Exec approval failed: ${String(err)}`;
    } finally {
      this.execApprovalBusy = false;
    }
  }

  dismissApprovalBanner() {
    this.approvalBannerVisible = false;
  }

  maybeStartProductTour() {
    if (this.onboarding || this.productTourActive) {
      return;
    }
    if (!shouldShowProductTour()) {
      return;
    }
    const steps = getProductTourSteps();
    if (steps.length === 0) {
      return;
    }
    this.productTourActive = true;
    this.productTourStepIndex = 0;
    this.setTab(steps[0]!.tab);
  }

  productTourNext() {
    const steps = getProductTourSteps();
    if (!this.productTourActive || steps.length === 0) {
      return;
    }
    if (this.productTourStepIndex >= steps.length - 1) {
      this.finishProductTour();
      return;
    }
    this.productTourStepIndex += 1;
    this.setTab(steps[this.productTourStepIndex]!.tab);
  }

  productTourSkip() {
    this.finishProductTour();
  }

  private finishProductTour() {
    markProductTourCompleted();
    this.productTourActive = false;
    this.productTourStepIndex = 0;
  }

  handleGatewayUrlConfirm() {
    const nextGatewayUrl = this.pendingGatewayUrl;
    if (!nextGatewayUrl) {
      return;
    }
    this.pendingGatewayUrl = null;
    applySettingsInternal(this as unknown as Parameters<typeof applySettingsInternal>[0], {
      ...this.settings,
      gatewayUrl: nextGatewayUrl,
    });
    this.connect();
  }

  handleGatewayUrlCancel() {
    this.pendingGatewayUrl = null;
  }

  // Sidebar handlers for tool output viewing
  handleOpenSidebar(content: string) {
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
      this.sidebarCloseTimer = null;
    }
    this.sidebarContent = content;
    this.sidebarError = null;
    this.sidebarOpen = true;
  }

  handleCloseSidebar() {
    this.sidebarOpen = false;
    // Clear content after transition
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
    }
    this.sidebarCloseTimer = window.setTimeout(() => {
      if (this.sidebarOpen) {
        return;
      }
      this.sidebarContent = null;
      this.sidebarError = null;
      this.sidebarCloseTimer = null;
    }, 200);
  }

  handleSplitRatioChange(ratio: number) {
    const newRatio = Math.max(0.4, Math.min(0.7, ratio));
    this.splitRatio = newRatio;
    this.applySettings({ ...this.settings, splitRatio: newRatio });
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.nativeResolveConfirm = resolve;
      this.nativeDialog = { kind: "confirm", message };
    });
  }

  showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.nativeResolveAlert = resolve;
      this.nativeDialog = { kind: "alert", message };
    });
  }

  showPrompt(message: string, defaultValue = ""): Promise<string | null> {
    return new Promise((resolve) => {
      this.nativePromptInput = defaultValue;
      this.nativeResolvePrompt = resolve;
      this.nativeDialog = { kind: "prompt", message, defaultValue };
    });
  }

  handleNativeDialogConfirm() {
    const d = this.nativeDialog;
    if (!d) {
      return;
    }
    if (d.kind === "alert") {
      this.nativeResolveAlert?.();
    } else if (d.kind === "confirm") {
      this.nativeResolveConfirm?.(true);
    } else {
      this.nativeResolvePrompt?.(this.nativePromptInput);
    }
    this.clearNativeDialogState();
  }

  handleNativeDialogCancel() {
    const d = this.nativeDialog;
    if (!d) {
      return;
    }
    if (d.kind === "confirm") {
      this.nativeResolveConfirm?.(false);
    } else if (d.kind === "prompt") {
      this.nativeResolvePrompt?.(null);
    }
    this.clearNativeDialogState();
  }

  handleNativePromptInput(value: string) {
    this.nativePromptInput = value;
  }

  private _maximiseDebounceTimer: number | null = null;

  async refreshWindowMaximised() {
    if (!this.isWindowsDesktop) {
      this.isWindowMaximised = false;
      return;
    }
    // 防抖：避免 resize 事件频繁触发导致 UI 持续刷新
    if (this._maximiseDebounceTimer !== null) {
      window.clearTimeout(this._maximiseDebounceTimer);
    }
    this._maximiseDebounceTimer = window.setTimeout(async () => {
      this._maximiseDebounceTimer = null;
      try {
        const maximised = await this.getDesktopRuntime()?.WindowIsMaximised?.();
        this.isWindowMaximised = Boolean(maximised);
      } catch {
        this.isWindowMaximised = false;
      }
    }, 120);
  }

  handleWindowMinimise() {
    if (!this.isWindowsDesktop) {
      return;
    }
    this.getDesktopRuntime()?.WindowMinimise?.();
  }

  handleWindowToggleMaximise() {
    if (!this.isWindowsDesktop) {
      return;
    }
    this.getDesktopRuntime()?.WindowToggleMaximise?.();
    window.setTimeout(() => {
      void this.refreshWindowMaximised();
    }, 60);
  }

  handleWindowClose() {
    if (!this.isWindowsDesktop) {
      return;
    }
    this.getDesktopRuntime()?.Quit?.();
  }

  handleTopbarDoubleClick(event: MouseEvent) {
    if (!this.isWindowsDesktop) {
      return;
    }
    const target = event
      .composedPath()
      .find((node): node is Element => node instanceof Element);
    if (target?.closest(".topbar__no-drag")) {
      return;
    }
    this.handleWindowToggleMaximise();
  }

  private clearNativeDialogState() {
    this.nativeDialog = null;
    this.nativePromptInput = "";
    this.nativeResolveConfirm = null;
    this.nativeResolveAlert = null;
    this.nativeResolvePrompt = null;
  }

  private getDesktopRuntime() {
    return window.runtime ?? null;
  }

  private async initialiseDesktopWindowChrome() {
    this.isDesktopShell = isDesktopShell();
    if (!this.isDesktopShell) {
      return;
    }
    try {
      const platform = (await this.getDesktopRuntime()?.Environment?.())?.platform ?? "";
      this.isWindowsDesktop = platform === "windows";
      if (!this.isWindowsDesktop) {
        this.isWindowMaximised = false;
        return;
      }
      await this.refreshWindowMaximised();
      if (!this.desktopWindowResizeHandler) {
        this.desktopWindowResizeHandler = () => {
          void this.refreshWindowMaximised();
        };
        window.addEventListener("resize", this.desktopWindowResizeHandler);
      }
    } catch {
      this.isWindowsDesktop = false;
      this.isWindowMaximised = false;
    }
  }

  private teardownDesktopWindowChrome() {
    if (this.desktopWindowResizeHandler) {
      window.removeEventListener("resize", this.desktopWindowResizeHandler);
      this.desktopWindowResizeHandler = null;
    }
  }

  render() {
    return renderApp(this as unknown as AppViewState);
  }
}
