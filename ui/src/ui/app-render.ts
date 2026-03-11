import { html, nothing } from "lit";
import type { AppViewState } from "./app-view-state.ts";
import type { UsageState } from "./controllers/usage.ts";
import { parseAgentSessionKey } from "./routing/session-key.js";
import { refreshChatAvatar } from "./app-chat.ts";
import { renderChatControls, renderTab } from "./app-render.helpers.ts";
import { loadAgentFileContent, loadAgentFiles, saveAgentFile } from "./controllers/agent-files.ts";
import { loadAgentIdentities, loadAgentIdentity } from "./controllers/agent-identity.ts";
import { loadAgentSkills } from "./controllers/agent-skills.ts";
import { loadAgents } from "./controllers/agents.ts";
import { loadChannels } from "./controllers/channels.ts";
import { loadChatHistory } from "./controllers/chat.ts";
import {
  applyConfig,
  loadConfig,
  runUpdate,
  saveConfig,
  updateConfigFormValue,
  removeConfigFormValue,
} from "./controllers/config.ts";
import {
  loadCronRuns,
  toggleCronJob,
  runCronJob,
  removeCronJob,
  addCronJob,
} from "./controllers/cron.ts";
import { loadDebug, callDebugMethod } from "./controllers/debug.ts";
import {
  approveDevicePairing,
  loadDevices,
  rejectDevicePairing,
  revokeDeviceToken,
  rotateDeviceToken,
} from "./controllers/devices.ts";
import {
  loadExecApprovals,
  removeExecApprovalsFormValue,
  saveExecApprovals,
  updateExecApprovalsFormValue,
} from "./controllers/exec-approvals.ts";
import { loadLogs } from "./controllers/logs.ts";
import { loadNodes } from "./controllers/nodes.ts";
import { loadPresence } from "./controllers/presence.ts";
import { deleteSession, deleteSessions, loadSessions, patchSession } from "./controllers/sessions.ts";
import {
  deleteSkill,
  loadSkillDoc,
  installSkill,
  loadSkills,
  saveSkillApiKey,
  updateSkillEdit,
  updateSkillEnabled,
  uploadSkill,
} from "./controllers/skills.ts";
import { loadUsage, loadSessionTimeSeries, loadSessionLogs } from "./controllers/usage.ts";
import { icons } from "./icons.ts";
import { normalizeBasePath, getTabGroups, pathForTab, subtitleForTab, titleForTab } from "./navigation.ts";

// Module-scope debounce for usage date changes (avoids type-unsafe hacks on state object)
let usageDateDebounceTimeout: number | null = null;
const debouncedLoadUsage = (state: UsageState) => {
  if (usageDateDebounceTimeout) {
    clearTimeout(usageDateDebounceTimeout);
  }
  usageDateDebounceTimeout = window.setTimeout(() => void loadUsage(state), 400);
};
import { renderAgentSwarm } from "./views/agent-swarm.ts";
import { renderDigitalEmployee } from "./views/digital-employee.ts";
import {
  loadDigitalEmployees,
  createDigitalEmployee,
  updateDigitalEmployeeEnabled,
  deleteDigitalEmployee,
  copyDigitalEmployee,
  getDigitalEmployee,
  updateDigitalEmployee,
} from "./controllers/digital-employees.ts";
import { renderAgents } from "./views/agents.ts";
import { renderChannels } from "./views/channels.ts";
import { renderChat } from "./views/chat.ts";
import { renderConfig } from "./views/config.ts";
import { renderEnvVars } from "./views/env-vars.ts";
import { renderCron } from "./views/cron.ts";
import { renderDebug } from "./views/debug.ts";
import { renderExecApprovalPrompt } from "./views/exec-approval.ts";
import { renderGatewayUrlConfirmation } from "./views/gateway-url-confirmation.ts";
import { renderInstances } from "./views/instances.ts";
import { renderLogs } from "./views/logs.ts";
import { renderNodes } from "./views/nodes.ts";
import { renderOverview } from "./views/overview.ts";
import { renderSessions } from "./views/sessions.ts";
import { renderSkills } from "./views/skills.ts";
import { renderMcp } from "./views/mcp.ts";
import { renderLlmTrace } from "./views/llm-trace.ts";
import { renderSandbox } from "./views/sandbox.ts";
import { renderModels } from "./views/models.ts";
import { renderUsage } from "./views/usage.ts";
import {
  handleMcpAddServer,
  handleMcpAddClose,
  handleMcpAddNameChange,
  handleMcpAddFormPatch,
  handleMcpAddRawChange,
  handleMcpAddConnectionTypeChange,
  handleMcpAddEditModeChange,
  handleMcpAddSubmit,
  handleMcpCancel,
  handleMcpDelete,
  handleMcpFormPatch,
  handleMcpRawChange,
  handleMcpRefresh,
  handleMcpSave,
  handleMcpSelect,
  handleMcpToggle,
  handleMcpViewModeChange,
  handleMcpEditConnectionTypeChange,
} from "./app-mcp.ts";
import {
  handleLlmTraceRefresh,
  handleLlmTraceModeChange,
  handleLlmTraceSearchChange,
  handleLlmTraceToggleEnabled,
  handleLlmTraceView,
} from "./app-llm-trace.ts";
import {
  syncSandboxFromConfig,
  handleSandboxToggleEnabled,
  handleSandboxPatch,
  handleSandboxSave,
  handleValidatorToggleEnabled,
  handleApprovalQueueToggleEnabled,
} from "./app-sandbox.ts";
import { getSandboxFromConfig } from "./controllers/sandbox.ts";
import {
  loadApprovalsList,
  approveApproval,
  denyApproval,
} from "./controllers/approvals.ts";
import {
  handleModelsAddProvider,
  handleModelsAddProviderModalClose,
  handleModelsAddProviderFormChange,
  handleModelsAddProviderSubmit,
  handleModelsAddModel,
  handleModelsAddModelModalClose,
  handleModelsAddModelFormChange,
  handleModelsAddModelSubmit,
  handleModelsRemoveModel,
  handleModelsPatchModelEnv,
  handleModelsCancel,
  handleModelsPatch,
  handleModelsSave,
  handleModelsSelect,
  handleModelsRefresh,
  handleModelsCancelUse,
  handleModelsUseModel,
  handleModelsUseModelClick,
  handleModelsUseModelModalClose,
} from "./app-models.ts";
import { generateUUID } from "./uuid.ts";

const AVATAR_DATA_RE = /^data:/i;
const AVATAR_HTTP_RE = /^https?:\/\//i;

function resolveDefaultModelRef(config: Record<string, unknown> | null | undefined): string | null {
  if (!config?.agents) return null;
  const agents = config.agents as Record<string, unknown>;
  const defaults = agents.defaults as Record<string, unknown> | undefined;
  if (!defaults?.model) return null;
  const model = defaults.model;
  if (typeof model === "string" && model) return model;
  if (model && typeof model === "object" && !Array.isArray(model)) {
    const primary = (model as Record<string, unknown>).primary;
    return typeof primary === "string" && primary ? primary : null;
  }
  return null;
}

function resolveAssistantAvatarUrl(state: AppViewState): string | undefined {
  const list = state.agentsList?.agents ?? [];
  const parsed = parseAgentSessionKey(state.sessionKey);
  const agentId = parsed?.agentId ?? state.agentsList?.defaultId ?? "main";
  const agent = list.find((entry) => entry.id === agentId);
  const identity = agent?.identity;
  const candidate = identity?.avatarUrl ?? identity?.avatar;
  if (!candidate) {
    return undefined;
  }
  if (AVATAR_DATA_RE.test(candidate) || AVATAR_HTTP_RE.test(candidate)) {
    return candidate;
  }
  return identity?.avatarUrl;
}

export function renderApp(state: AppViewState) {
  const presenceCount = state.presenceEntries.length;
  const sessionsCount = state.sessionsResult?.count ?? null;
  const cronNext = state.cronStatus?.nextWakeAtMs ?? null;
  const chatDisabledReason = state.connected ? null : "Disconnected from gateway.";
  const isChat = state.tab === "chat";
  const chatFocus = isChat && (state.settings.chatFocusMode || state.onboarding);
  const showThinking = state.onboarding ? false : state.settings.chatShowThinking;
  const assistantAvatarUrl = resolveAssistantAvatarUrl(state);
  const chatAvatarUrl = state.chatAvatarUrl ?? assistantAvatarUrl ?? null;
  const configValue =
    state.configForm ?? (state.configSnapshot?.config as Record<string, unknown> | null);
  const basePath = normalizeBasePath(state.basePath ?? "");
  const resolvedAgentId =
    state.agentsSelectedId ??
    state.agentsList?.defaultId ??
    state.agentsList?.agents?.[0]?.id ??
    null;

  return html`
    <div class="shell ${isChat ? "shell--chat" : ""} ${chatFocus ? "shell--chat-focus" : ""} ${state.settings.navCollapsed ? "shell--nav-collapsed" : ""} ${state.onboarding ? "shell--onboarding" : ""}">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="nav-collapse-toggle"
            @click=${() =>
              state.applySettings({
                ...state.settings,
                navCollapsed: !state.settings.navCollapsed,
              })}
            title="${state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
            aria-label="${state.settings.navCollapsed ? "Expand sidebar" : "Collapse sidebar"}"
          >
            <span class="nav-collapse-toggle__icon">${icons.menu}</span>
          </button>
          <div class="brand">
            <div class="brand-logo">
              <img
                src=${basePath ? `${basePath}/favicon.svg` : "/favicon.svg"}
                alt="OpenOcta"
                style="width: 128px; height: 32px;"
              />
            </div>
          </div>
        </div>
        <div class="topbar-status">
          <div class="pill">
            <span>Version</span>
            <span class="mono">${typeof __APP_VERSION__ === "string" && __APP_VERSION__ ? __APP_VERSION__ : "---"}</span>
          </div>
          <div class="pill">
            <a
              href="https://github.com/openocta/openocta.git"
              target="_blank"
              rel="noreferrer"
              title="GitHub 仓库（新窗口打开）"
              class="topbar-link"
            >
              <span class="topbar-link__icon" aria-hidden="true">${icons.github}</span>
              <span>GitHub</span>
            </a>
          </div>
          <div class="pill">
            <a
              href="https://www.openocta.com/"
              target="_blank"
              rel="noreferrer"
              title="OpenOcta 官网（新窗口打开）"
              class="topbar-link"
            >
              <img
                src=${basePath ? `${basePath}/favicon.ico` : "/favicon.ico"}
                alt=""
                class="topbar-link__img"
                width="16"
                height="16"
              />
              <span>官网</span>
            </a>
          </div>
          <div class="pill">
            <span class="statusDot ${state.connected ? "ok" : ""}"></span>
            <span>Health</span>
            <span class="mono">${state.connected ? "OK" : "Offline"}</span>
          </div>
        </div>
      </header>
      <aside class="nav ${state.settings.navCollapsed ? "nav--collapsed" : ""}">
        ${getTabGroups().map((group) => {
          const isGroupCollapsed = state.settings.navGroupsCollapsed[group.label] ?? false;
          const hasActiveTab = group.tabs.some((tab) => tab === state.tab);
          return html`
            <div class="nav-group ${isGroupCollapsed && !hasActiveTab ? "nav-group--collapsed" : ""}">
              <button
                class="nav-label"
                @click=${() => {
                  const next = { ...state.settings.navGroupsCollapsed };
                  next[group.label] = !isGroupCollapsed;
                  state.applySettings({
                    ...state.settings,
                    navGroupsCollapsed: next,
                  });
                }}
                aria-expanded=${!isGroupCollapsed}
              >
                <span class="nav-label__text">${group.label}</span>
                <span class="nav-label__chevron">${isGroupCollapsed ? "+" : "−"}</span>
              </button>
              <div class="nav-group__items">
                ${group.tabs.map((tab) => renderTab(state, tab))}
              </div>
            </div>
          `;
        })}
        <div class="nav-group nav-group--links">
          <div class="nav-label nav-label--static">
            <span class="nav-label__text">Resources</span>
          </div>
          <div class="nav-group__items">
            <a
              class="nav-item nav-item--external"
              href="https://databuff.yuque.com/org-wiki-databuff-spr8e6/lqn7on/nd9nghq03n2nymz0"
              target="_blank"
              rel="noreferrer"
              title="Docs (opens in new tab)"
            >
              <span class="nav-item__icon" aria-hidden="true">${icons.book}</span>
              <span class="nav-item__text">Docs</span>
            </a>
          </div>
        </div>
      </aside>
      <main class="content ${isChat ? "content--chat" : ""}">
        <section class="content-header">
          <div>
            ${state.tab === "usage" ? nothing : html`<div class="page-title">${titleForTab(state.tab)}</div>`}
          </div>
          <div class="page-meta">
            ${state.lastError ? html`<div class="pill danger">${state.lastError}</div>` : nothing}
            ${isChat ? renderChatControls(state) : nothing}
          </div>
        </section>

        ${
          state.tab === "overview"
            ? renderOverview({
                connected: state.connected,
                hello: state.hello,
                settings: state.settings,
                password: state.password,
                lastError: state.lastError,
                presenceCount,
                sessionsCount,
                cronEnabled: state.cronStatus?.enabled ?? null,
                cronNext,
                lastChannelsRefresh: state.channelsLastSuccess,
                onSettingsChange: (next) => state.applySettings(next),
                onPasswordChange: (next) => (state.password = next),
                onSessionKeyChange: (next) => {
                  state.sessionKey = next;
                  state.chatMessage = "";
                  state.resetToolStream();
                  state.applySettings({
                    ...state.settings,
                    sessionKey: next,
                    lastActiveSessionKey: next,
                  });
                  void state.loadAssistantIdentity();
                },
                onConnect: () => state.connect(),
                onRefresh: () => state.loadOverview(),
              })
            : nothing
        }

        ${
          state.tab === "channels"
            ? renderChannels({
                connected: state.connected,
                loading: state.channelsLoading,
                snapshot: state.channelsSnapshot,
                lastError: state.channelsError,
                lastSuccessAt: state.channelsLastSuccess,
                whatsappMessage: state.whatsappLoginMessage,
                whatsappQrDataUrl: state.whatsappLoginQrDataUrl,
                whatsappConnected: state.whatsappLoginConnected,
                whatsappBusy: state.whatsappBusy,
                configSchema: state.configSchema,
                configSchemaLoading: state.configSchemaLoading,
                configForm: state.configForm,
                configUiHints: state.configUiHints,
                configSaving: state.configSaving,
                configFormDirty: state.configFormDirty,
                selectedChannelId: state.channelsSelectedChannelId,
                nostrProfileFormState: state.nostrProfileFormState,
                nostrProfileAccountId: state.nostrProfileAccountId,
                onRefresh: (probe) => loadChannels(state, probe),
                onChannelSelect: (channelId) => {
                  state.channelsSelectedChannelId = channelId;
                },
                onWhatsAppStart: (force) => state.handleWhatsAppStart(force),
                onWhatsAppWait: () => state.handleWhatsAppWait(),
                onWhatsAppLogout: () => state.handleWhatsAppLogout(),
                onConfigPatch: (path, value) => updateConfigFormValue(state, path, value),
                onConfigSave: () => state.handleChannelConfigSave(),
                onConfigReload: () => state.handleChannelConfigReload(),
                onNostrProfileEdit: (accountId, profile) =>
                  state.handleNostrProfileEdit(accountId, profile),
                onNostrProfileCancel: () => state.handleNostrProfileCancel(),
                onNostrProfileFieldChange: (field, value) =>
                  state.handleNostrProfileFieldChange(field, value),
                onNostrProfileSave: () => state.handleNostrProfileSave(),
                onNostrProfileImport: () => state.handleNostrProfileImport(),
                onNostrProfileToggleAdvanced: () => state.handleNostrProfileToggleAdvanced(),
              })
            : nothing
        }

        ${
          state.tab === "instances"
            ? renderInstances({
                loading: state.presenceLoading,
                entries: state.presenceEntries,
                lastError: state.presenceError,
                statusMessage: state.presenceStatus,
                onRefresh: () => loadPresence(state),
              })
            : nothing
        }

        ${
          state.tab === "sessions"
            ? renderSessions({
                loading: state.sessionsLoading,
                result: state.sessionsResult,
                error: state.sessionsError,
                activeMinutes: state.sessionsFilterActive,
                limit: state.sessionsFilterLimit,
                includeGlobal: state.sessionsIncludeGlobal,
                includeUnknown: state.sessionsIncludeUnknown,
                basePath: state.basePath,
                bulkMode: state.sessionsBulkMode,
                selectedKeys: state.sessionsSelectedKeys,
                onFiltersChange: (next) => {
                  state.sessionsFilterActive = next.activeMinutes;
                  state.sessionsFilterLimit = next.limit;
                  state.sessionsIncludeGlobal = next.includeGlobal;
                  state.sessionsIncludeUnknown = next.includeUnknown;
                },
                onRefresh: () => loadSessions(state),
                onPatch: (key, patch) => patchSession(state, key, patch),
                onDelete: (key) => deleteSession(state, key),
                onBulkModeToggle: () => {
                  const next = !state.sessionsBulkMode;
                  state.sessionsBulkMode = next;
                  if (!next) {
                    state.sessionsSelectedKeys = [];
                  }
                },
                onSelectionChange: (key, selected) => {
                  if (!key || key === "agent.main.main") {
                    return;
                  }
                  if (selected) {
                    if (!state.sessionsSelectedKeys.includes(key)) {
                      state.sessionsSelectedKeys = [...state.sessionsSelectedKeys, key];
                    }
                  } else {
                    state.sessionsSelectedKeys = state.sessionsSelectedKeys.filter(
                      (entry: string) => entry !== key,
                    );
                  }
                },
                onSelectAll: (keys) => {
                  const safeKeys = keys.filter((key) => key && key !== "agent.main.main");
                  state.sessionsSelectedKeys = Array.from(new Set(safeKeys));
                },
                onClearSelection: () => {
                  state.sessionsSelectedKeys = [];
                },
                onBulkDelete: async (keys) => {
                  const safeKeys = keys.filter((key) => key && key !== "agent.main.main");
                  if (safeKeys.length === 0) {
                    return;
                  }
                  await deleteSessions(state, safeKeys);
                  state.sessionsSelectedKeys = [];
                  state.sessionsBulkMode = false;
                },
              })
            : nothing
        }

        ${
          state.tab === "usage"
            ? renderUsage({
                loading: state.usageLoading,
                error: state.usageError,
                startDate: state.usageStartDate,
                endDate: state.usageEndDate,
                sessions: state.usageResult?.sessions ?? [],
                sessionsLimitReached: (state.usageResult?.sessions?.length ?? 0) >= 1000,
                totals: state.usageResult?.totals ?? null,
                aggregates: state.usageResult?.aggregates ?? null,
                costDaily: state.usageCostSummary?.daily ?? [],
                selectedSessions: state.usageSelectedSessions,
                selectedDays: state.usageSelectedDays,
                selectedHours: state.usageSelectedHours,
                chartMode: state.usageChartMode,
                dailyChartMode: state.usageDailyChartMode,
                timeSeriesMode: state.usageTimeSeriesMode,
                timeSeriesBreakdownMode: state.usageTimeSeriesBreakdownMode,
                timeSeries: state.usageTimeSeries,
                timeSeriesLoading: state.usageTimeSeriesLoading,
                sessionLogs: state.usageSessionLogs,
                sessionLogsLoading: state.usageSessionLogsLoading,
                sessionLogsExpanded: state.usageSessionLogsExpanded,
                logFilterRoles: state.usageLogFilterRoles,
                logFilterTools: state.usageLogFilterTools,
                logFilterHasTools: state.usageLogFilterHasTools,
                logFilterQuery: state.usageLogFilterQuery,
                query: state.usageQuery,
                queryDraft: state.usageQueryDraft,
                sessionSort: state.usageSessionSort,
                sessionSortDir: state.usageSessionSortDir,
                recentSessions: state.usageRecentSessions,
                sessionsTab: state.usageSessionsTab,
                visibleColumns:
                  state.usageVisibleColumns as import("./views/usage.ts").UsageColumnId[],
                timeZone: state.usageTimeZone,
                contextExpanded: state.usageContextExpanded,
                headerPinned: state.usageHeaderPinned,
                onStartDateChange: (date) => {
                  state.usageStartDate = date;
                  state.usageSelectedDays = [];
                  state.usageSelectedHours = [];
                  state.usageSelectedSessions = [];
                  debouncedLoadUsage(state);
                },
                onEndDateChange: (date) => {
                  state.usageEndDate = date;
                  state.usageSelectedDays = [];
                  state.usageSelectedHours = [];
                  state.usageSelectedSessions = [];
                  debouncedLoadUsage(state);
                },
                onRefresh: () => loadUsage(state),
                onTimeZoneChange: (zone) => {
                  state.usageTimeZone = zone;
                },
                onToggleContextExpanded: () => {
                  state.usageContextExpanded = !state.usageContextExpanded;
                },
                onToggleSessionLogsExpanded: () => {
                  state.usageSessionLogsExpanded = !state.usageSessionLogsExpanded;
                },
                onLogFilterRolesChange: (next) => {
                  state.usageLogFilterRoles = next;
                },
                onLogFilterToolsChange: (next) => {
                  state.usageLogFilterTools = next;
                },
                onLogFilterHasToolsChange: (next) => {
                  state.usageLogFilterHasTools = next;
                },
                onLogFilterQueryChange: (next) => {
                  state.usageLogFilterQuery = next;
                },
                onLogFilterClear: () => {
                  state.usageLogFilterRoles = [];
                  state.usageLogFilterTools = [];
                  state.usageLogFilterHasTools = false;
                  state.usageLogFilterQuery = "";
                },
                onToggleHeaderPinned: () => {
                  state.usageHeaderPinned = !state.usageHeaderPinned;
                },
                onSelectHour: (hour, shiftKey) => {
                  if (shiftKey && state.usageSelectedHours.length > 0) {
                    const allHours = Array.from({ length: 24 }, (_, i) => i);
                    const lastSelected =
                      state.usageSelectedHours[state.usageSelectedHours.length - 1];
                    const lastIdx = allHours.indexOf(lastSelected);
                    const thisIdx = allHours.indexOf(hour);
                    if (lastIdx !== -1 && thisIdx !== -1) {
                      const [start, end] =
                        lastIdx < thisIdx ? [lastIdx, thisIdx] : [thisIdx, lastIdx];
                      const range = allHours.slice(start, end + 1);
                      state.usageSelectedHours = [
                        ...new Set([...state.usageSelectedHours, ...range]),
                      ];
                    }
                  } else {
                    if (state.usageSelectedHours.includes(hour)) {
                      state.usageSelectedHours = state.usageSelectedHours.filter((h) => h !== hour);
                    } else {
                      state.usageSelectedHours = [...state.usageSelectedHours, hour];
                    }
                  }
                },
                onQueryDraftChange: (query) => {
                  state.usageQueryDraft = query;
                  if (state.usageQueryDebounceTimer) {
                    window.clearTimeout(state.usageQueryDebounceTimer);
                  }
                  state.usageQueryDebounceTimer = window.setTimeout(() => {
                    state.usageQuery = state.usageQueryDraft;
                    state.usageQueryDebounceTimer = null;
                  }, 250);
                },
                onApplyQuery: () => {
                  if (state.usageQueryDebounceTimer) {
                    window.clearTimeout(state.usageQueryDebounceTimer);
                    state.usageQueryDebounceTimer = null;
                  }
                  state.usageQuery = state.usageQueryDraft;
                },
                onClearQuery: () => {
                  if (state.usageQueryDebounceTimer) {
                    window.clearTimeout(state.usageQueryDebounceTimer);
                    state.usageQueryDebounceTimer = null;
                  }
                  state.usageQueryDraft = "";
                  state.usageQuery = "";
                },
                onSessionSortChange: (sort) => {
                  state.usageSessionSort = sort;
                },
                onSessionSortDirChange: (dir) => {
                  state.usageSessionSortDir = dir;
                },
                onSessionsTabChange: (tab) => {
                  state.usageSessionsTab = tab;
                },
                onToggleColumn: (column) => {
                  if (state.usageVisibleColumns.includes(column)) {
                    state.usageVisibleColumns = state.usageVisibleColumns.filter(
                      (entry) => entry !== column,
                    );
                  } else {
                    state.usageVisibleColumns = [...state.usageVisibleColumns, column];
                  }
                },
                onSelectSession: (key, shiftKey) => {
                  state.usageTimeSeries = null;
                  state.usageSessionLogs = null;
                  state.usageRecentSessions = [
                    key,
                    ...state.usageRecentSessions.filter((entry) => entry !== key),
                  ].slice(0, 8);

                  if (shiftKey && state.usageSelectedSessions.length > 0) {
                    // Shift-click: select range from last selected to this session
                    // Sort sessions same way as displayed (by tokens or cost descending)
                    const isTokenMode = state.usageChartMode === "tokens";
                    const sortedSessions = [...(state.usageResult?.sessions ?? [])].toSorted(
                      (a, b) => {
                        const valA = isTokenMode
                          ? (a.usage?.totalTokens ?? 0)
                          : (a.usage?.totalCost ?? 0);
                        const valB = isTokenMode
                          ? (b.usage?.totalTokens ?? 0)
                          : (b.usage?.totalCost ?? 0);
                        return valB - valA;
                      },
                    );
                    const allKeys = sortedSessions.map((s) => s.key);
                    const lastSelected =
                      state.usageSelectedSessions[state.usageSelectedSessions.length - 1];
                    const lastIdx = allKeys.indexOf(lastSelected);
                    const thisIdx = allKeys.indexOf(key);
                    if (lastIdx !== -1 && thisIdx !== -1) {
                      const [start, end] =
                        lastIdx < thisIdx ? [lastIdx, thisIdx] : [thisIdx, lastIdx];
                      const range = allKeys.slice(start, end + 1);
                      const newSelection = [...new Set([...state.usageSelectedSessions, ...range])];
                      state.usageSelectedSessions = newSelection;
                    }
                  } else {
                    // Regular click: focus a single session (so details always open).
                    // Click the focused session again to clear selection.
                    if (
                      state.usageSelectedSessions.length === 1 &&
                      state.usageSelectedSessions[0] === key
                    ) {
                      state.usageSelectedSessions = [];
                    } else {
                      state.usageSelectedSessions = [key];
                    }
                  }

                  // Load timeseries/logs only if exactly one session selected
                  if (state.usageSelectedSessions.length === 1) {
                    void loadSessionTimeSeries(state, state.usageSelectedSessions[0]);
                    void loadSessionLogs(state, state.usageSelectedSessions[0]);
                  }
                },
                onSelectDay: (day, shiftKey) => {
                  if (shiftKey && state.usageSelectedDays.length > 0) {
                    // Shift-click: select range from last selected to this day
                    const allDays = (state.usageCostSummary?.daily ?? []).map((d) => d.date);
                    const lastSelected =
                      state.usageSelectedDays[state.usageSelectedDays.length - 1];
                    const lastIdx = allDays.indexOf(lastSelected);
                    const thisIdx = allDays.indexOf(day);
                    if (lastIdx !== -1 && thisIdx !== -1) {
                      const [start, end] =
                        lastIdx < thisIdx ? [lastIdx, thisIdx] : [thisIdx, lastIdx];
                      const range = allDays.slice(start, end + 1);
                      // Merge with existing selection
                      const newSelection = [...new Set([...state.usageSelectedDays, ...range])];
                      state.usageSelectedDays = newSelection;
                    }
                  } else {
                    // Regular click: toggle single day
                    if (state.usageSelectedDays.includes(day)) {
                      state.usageSelectedDays = state.usageSelectedDays.filter((d) => d !== day);
                    } else {
                      state.usageSelectedDays = [day];
                    }
                  }
                },
                onChartModeChange: (mode) => {
                  state.usageChartMode = mode;
                },
                onDailyChartModeChange: (mode) => {
                  state.usageDailyChartMode = mode;
                },
                onTimeSeriesModeChange: (mode) => {
                  state.usageTimeSeriesMode = mode;
                },
                onTimeSeriesBreakdownChange: (mode) => {
                  state.usageTimeSeriesBreakdownMode = mode;
                },
                onClearDays: () => {
                  state.usageSelectedDays = [];
                },
                onClearHours: () => {
                  state.usageSelectedHours = [];
                },
                onClearSessions: () => {
                  state.usageSelectedSessions = [];
                  state.usageTimeSeries = null;
                  state.usageSessionLogs = null;
                },
                onClearFilters: () => {
                  state.usageSelectedDays = [];
                  state.usageSelectedHours = [];
                  state.usageSelectedSessions = [];
                  state.usageTimeSeries = null;
                  state.usageSessionLogs = null;
                },
              })
            : nothing
        }

        ${
          state.tab === "cron"
            ? renderCron({
                basePath: state.basePath,
                loading: state.cronLoading,
                status: state.cronStatus,
                jobs: state.cronJobs,
                error: state.cronError,
                busy: state.cronBusy,
                form: state.cronForm,
                channels: state.channelsSnapshot?.channelMeta?.length
                  ? state.channelsSnapshot.channelMeta.map((entry) => entry.id)
                  : (state.channelsSnapshot?.channelOrder ?? []),
                channelLabels: state.channelsSnapshot?.channelLabels ?? {},
                channelMeta: state.channelsSnapshot?.channelMeta ?? [],
                runsJobId: state.cronRunsJobId,
                runs: state.cronRuns,
                onFormChange: (patch) => (state.cronForm = { ...state.cronForm, ...patch }),
                onRefresh: () => state.loadCron(),
                onAdd: () => addCronJob(state),
                onToggle: (job, enabled) => toggleCronJob(state, job, enabled),
                onRun: (job) => runCronJob(state, job),
                onRemove: (job) => removeCronJob(state, job),
                onLoadRuns: (jobId) => loadCronRuns(state, jobId),
              })
            : nothing
        }

        ${
          state.tab === "agents"
            ? renderAgents({
                loading: state.agentsLoading,
                error: state.agentsError,
                agentsList: state.agentsList,
                selectedAgentId: resolvedAgentId,
                activePanel: state.agentsPanel,
                configForm: configValue,
                configLoading: state.configLoading,
                configSaving: state.configSaving,
                configDirty: state.configFormDirty,
                channelsLoading: state.channelsLoading,
                channelsError: state.channelsError,
                channelsSnapshot: state.channelsSnapshot,
                channelsLastSuccess: state.channelsLastSuccess,
                cronLoading: state.cronLoading,
                cronStatus: state.cronStatus,
                cronJobs: state.cronJobs,
                cronError: state.cronError,
                agentFilesLoading: state.agentFilesLoading,
                agentFilesError: state.agentFilesError,
                agentFilesList: state.agentFilesList,
                agentFileActive: state.agentFileActive,
                agentFileContents: state.agentFileContents,
                agentFileDrafts: state.agentFileDrafts,
                agentFileSaving: state.agentFileSaving,
                agentIdentityLoading: state.agentIdentityLoading,
                agentIdentityError: state.agentIdentityError,
                agentIdentityById: state.agentIdentityById,
                agentSkillsLoading: state.agentSkillsLoading,
                agentSkillsReport: state.agentSkillsReport,
                agentSkillsError: state.agentSkillsError,
                agentSkillsAgentId: state.agentSkillsAgentId,
                skillsFilter: state.skillsFilter,
                onRefresh: async () => {
                  await loadAgents(state);
                  const agentIds = state.agentsList?.agents?.map((entry) => entry.id) ?? [];
                  if (agentIds.length > 0) {
                    void loadAgentIdentities(state, agentIds);
                  }
                },
                onSelectAgent: (agentId) => {
                  if (state.agentsSelectedId === agentId) {
                    return;
                  }
                  state.agentsSelectedId = agentId;
                  state.agentFilesList = null;
                  state.agentFilesError = null;
                  state.agentFilesLoading = false;
                  state.agentFileActive = null;
                  state.agentFileContents = {};
                  state.agentFileDrafts = {};
                  state.agentSkillsReport = null;
                  state.agentSkillsError = null;
                  state.agentSkillsAgentId = null;
                  void loadAgentIdentity(state, agentId);
                  if (state.agentsPanel === "files") {
                    void loadAgentFiles(state, agentId);
                  }
                  if (state.agentsPanel === "skills") {
                    void loadAgentSkills(state, agentId);
                  }
                },
                onSelectPanel: (panel) => {
                  state.agentsPanel = panel;
                  if (panel === "files" && resolvedAgentId) {
                    if (state.agentFilesList?.agentId !== resolvedAgentId) {
                      state.agentFilesList = null;
                      state.agentFilesError = null;
                      state.agentFileActive = null;
                      state.agentFileContents = {};
                      state.agentFileDrafts = {};
                      void loadAgentFiles(state, resolvedAgentId);
                    }
                  }
                  if (panel === "skills") {
                    if (resolvedAgentId) {
                      void loadAgentSkills(state, resolvedAgentId);
                    }
                  }
                  if (panel === "channels") {
                    void loadChannels(state, false);
                  }
                  if (panel === "cron") {
                    void state.loadCron();
                  }
                },
                onLoadFiles: (agentId) => loadAgentFiles(state, agentId),
                onSelectFile: (name) => {
                  state.agentFileActive = name;
                  if (!resolvedAgentId) {
                    return;
                  }
                  void loadAgentFileContent(state, resolvedAgentId, name);
                },
                onFileDraftChange: (name, content) => {
                  state.agentFileDrafts = { ...state.agentFileDrafts, [name]: content };
                },
                onFileReset: (name) => {
                  const base = state.agentFileContents[name] ?? "";
                  state.agentFileDrafts = { ...state.agentFileDrafts, [name]: base };
                },
                onFileSave: (name) => {
                  if (!resolvedAgentId) {
                    return;
                  }
                  const content =
                    state.agentFileDrafts[name] ?? state.agentFileContents[name] ?? "";
                  void saveAgentFile(state, resolvedAgentId, name, content);
                },
                onToolsProfileChange: (agentId, profile, clearAllow) => {
                  if (!configValue) {
                    return;
                  }
                  const list = (configValue as { agents?: { list?: unknown[] } }).agents?.list;
                  if (!Array.isArray(list)) {
                    return;
                  }
                  const index = list.findIndex(
                    (entry) =>
                      entry &&
                      typeof entry === "object" &&
                      "id" in entry &&
                      (entry as { id?: string }).id === agentId,
                  );
                  if (index < 0) {
                    return;
                  }
                  const basePath = ["agents", "list", index, "tools"];
                  if (profile) {
                    updateConfigFormValue(state, [...basePath, "profile"], profile);
                  } else {
                    removeConfigFormValue(state, [...basePath, "profile"]);
                  }
                  if (clearAllow) {
                    removeConfigFormValue(state, [...basePath, "allow"]);
                  }
                },
                onToolsOverridesChange: (agentId, alsoAllow, deny) => {
                  if (!configValue) {
                    return;
                  }
                  const list = (configValue as { agents?: { list?: unknown[] } }).agents?.list;
                  if (!Array.isArray(list)) {
                    return;
                  }
                  const index = list.findIndex(
                    (entry) =>
                      entry &&
                      typeof entry === "object" &&
                      "id" in entry &&
                      (entry as { id?: string }).id === agentId,
                  );
                  if (index < 0) {
                    return;
                  }
                  const basePath = ["agents", "list", index, "tools"];
                  if (alsoAllow.length > 0) {
                    updateConfigFormValue(state, [...basePath, "alsoAllow"], alsoAllow);
                  } else {
                    removeConfigFormValue(state, [...basePath, "alsoAllow"]);
                  }
                  if (deny.length > 0) {
                    updateConfigFormValue(state, [...basePath, "deny"], deny);
                  } else {
                    removeConfigFormValue(state, [...basePath, "deny"]);
                  }
                },
                onConfigReload: () => loadConfig(state),
                onConfigSave: () => saveConfig(state),
                onChannelsRefresh: () => loadChannels(state, false),
                onCronRefresh: () => state.loadCron(),
                onSkillsFilterChange: (next) => (state.skillsFilter = next),
                onSkillsRefresh: () => {
                  if (resolvedAgentId) {
                    void loadAgentSkills(state, resolvedAgentId);
                  }
                },
                onAgentSkillToggle: (agentId, skillName, enabled) => {
                  if (!configValue) {
                    return;
                  }
                  const list = (configValue as { agents?: { list?: unknown[] } }).agents?.list;
                  if (!Array.isArray(list)) {
                    return;
                  }
                  const index = list.findIndex(
                    (entry) =>
                      entry &&
                      typeof entry === "object" &&
                      "id" in entry &&
                      (entry as { id?: string }).id === agentId,
                  );
                  if (index < 0) {
                    return;
                  }
                  const entry = list[index] as { skills?: unknown };
                  const normalizedSkill = skillName.trim();
                  if (!normalizedSkill) {
                    return;
                  }
                  const allSkills =
                    state.agentSkillsReport?.skills?.map((skill) => skill.name).filter(Boolean) ??
                    [];
                  const existing = Array.isArray(entry.skills)
                    ? entry.skills.map((name) => String(name).trim()).filter(Boolean)
                    : undefined;
                  const base = existing ?? allSkills;
                  const next = new Set(base);
                  if (enabled) {
                    next.add(normalizedSkill);
                  } else {
                    next.delete(normalizedSkill);
                  }
                  updateConfigFormValue(state, ["agents", "list", index, "skills"], [...next]);
                },
                onAgentSkillsClear: (agentId) => {
                  if (!configValue) {
                    return;
                  }
                  const list = (configValue as { agents?: { list?: unknown[] } }).agents?.list;
                  if (!Array.isArray(list)) {
                    return;
                  }
                  const index = list.findIndex(
                    (entry) =>
                      entry &&
                      typeof entry === "object" &&
                      "id" in entry &&
                      (entry as { id?: string }).id === agentId,
                  );
                  if (index < 0) {
                    return;
                  }
                  removeConfigFormValue(state, ["agents", "list", index, "skills"]);
                },
                onAgentSkillsDisableAll: (agentId) => {
                  if (!configValue) {
                    return;
                  }
                  const list = (configValue as { agents?: { list?: unknown[] } }).agents?.list;
                  if (!Array.isArray(list)) {
                    return;
                  }
                  const index = list.findIndex(
                    (entry) =>
                      entry &&
                      typeof entry === "object" &&
                      "id" in entry &&
                      (entry as { id?: string }).id === agentId,
                  );
                  if (index < 0) {
                    return;
                  }
                  updateConfigFormValue(state, ["agents", "list", index, "skills"], []);
                },
                onModelChange: (agentId, modelId) => {
                  if (!configValue) {
                    return;
                  }
                  const list = (configValue as { agents?: { list?: unknown[] } }).agents?.list;
                  if (!Array.isArray(list)) {
                    return;
                  }
                  const index = list.findIndex(
                    (entry) =>
                      entry &&
                      typeof entry === "object" &&
                      "id" in entry &&
                      (entry as { id?: string }).id === agentId,
                  );
                  if (index < 0) {
                    return;
                  }
                  const basePath = ["agents", "list", index, "model"];
                  if (!modelId) {
                    removeConfigFormValue(state, basePath);
                    return;
                  }
                  const entry = list[index] as { model?: unknown };
                  const existing = entry?.model;
                  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
                    const fallbacks = (existing as { fallbacks?: unknown }).fallbacks;
                    const next = {
                      primary: modelId,
                      ...(Array.isArray(fallbacks) ? { fallbacks } : {}),
                    };
                    updateConfigFormValue(state, basePath, next);
                  } else {
                    updateConfigFormValue(state, basePath, modelId);
                  }
                },
                onModelFallbacksChange: (agentId, fallbacks) => {
                  if (!configValue) {
                    return;
                  }
                  const list = (configValue as { agents?: { list?: unknown[] } }).agents?.list;
                  if (!Array.isArray(list)) {
                    return;
                  }
                  const index = list.findIndex(
                    (entry) =>
                      entry &&
                      typeof entry === "object" &&
                      "id" in entry &&
                      (entry as { id?: string }).id === agentId,
                  );
                  if (index < 0) {
                    return;
                  }
                  const basePath = ["agents", "list", index, "model"];
                  const entry = list[index] as { model?: unknown };
                  const normalized = fallbacks.map((name) => name.trim()).filter(Boolean);
                  const existing = entry.model;
                  const resolvePrimary = () => {
                    if (typeof existing === "string") {
                      return existing.trim() || null;
                    }
                    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
                      const primary = (existing as { primary?: unknown }).primary;
                      if (typeof primary === "string") {
                        const trimmed = primary.trim();
                        return trimmed || null;
                      }
                    }
                    return null;
                  };
                  const primary = resolvePrimary();
                  if (normalized.length === 0) {
                    if (primary) {
                      updateConfigFormValue(state, basePath, primary);
                    } else {
                      removeConfigFormValue(state, basePath);
                    }
                    return;
                  }
                  const next = primary
                    ? { primary, fallbacks: normalized }
                    : { fallbacks: normalized };
                  updateConfigFormValue(state, basePath, next);
                },
              })
            : nothing
        }

        ${
          state.tab === "skills"
            ? renderSkills({
                loading: state.skillsLoading,
                report: state.skillsReport,
                error: state.skillsError,
                filter: state.skillsFilter,
                edits: state.skillEdits,
                messages: state.skillMessages,
                busyKey: state.skillsBusyKey,
                viewMode: state.skillsViewMode,
                onViewModeChange: (mode) => (state.skillsViewMode = mode),
                addModalOpen: state.skillsAddModalOpen,
                uploadName: state.skillsUploadName,
                uploadFiles: state.skillsUploadFiles ?? [],
                uploadError: state.skillsUploadError,
                uploadTemplate: state.skillsUploadTemplate,
                uploadBusy: state.skillsUploadBusy,
                onFilterChange: (next) => (state.skillsFilter = next),
                onRefresh: () => loadSkills(state, { clearMessages: true }),
                onAddClick: () => {
                  state.skillsAddModalOpen = true;
                  state.skillsUploadName = "";
                  state.skillsUploadFiles = [];
                  state.skillsUploadError = null;
                  state.skillsUploadTemplate = null;
                },
                onAddClose: () => {
                  state.skillsAddModalOpen = false;
                  state.skillsUploadName = "";
                  state.skillsUploadFiles = [];
                  state.skillsUploadError = null;
                  state.skillsUploadTemplate = null;
                },
                onUploadNameChange: (next) => (state.skillsUploadName = next),
                onUploadFilesChange: (files) => {
                  state.skillsUploadFiles = files ?? [];
                  // 选择单个文件时，如果没填名称则自动根据文件名填充，仍允许用户覆盖。
                  if ((files?.length ?? 0) === 1) {
                    const f = files[0];
                    const current = state.skillsUploadName?.trim() ?? "";
                    if (!current) {
                      const derived = f?.name?.replace(/\.(zip|md)$/i, "").trim();
                      state.skillsUploadName = derived ?? "";
                    }
                  } else if ((files?.length ?? 0) > 1) {
                    state.skillsUploadName = "";
                  }
                },
                onUploadSubmit: async () => {
                  const files = state.skillsUploadFiles ?? [];
                  if (files.length === 0) return;
                  if (files.length === 1 && !state.skillsUploadName.trim()) return;
                  state.skillsUploadBusy = true;
                  state.skillsUploadError = null;
                  state.skillsUploadTemplate = null;
                  const deriveName = (fileName: string) =>
                    fileName
                      .trim()
                      .replace(/\.tar\.gz$/i, "")
                      .replace(/\.tgz$/i, "")
                      .replace(/\.zip$/i, "")
                      .replace(/\.md$/i, "")
                      .trim();
                  let result: { ok: boolean; error?: string; template?: string } = { ok: true };
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const name =
                      files.length === 1
                        ? state.skillsUploadName.trim()
                        : deriveName(file.name) || "";
                    if (!name) {
                      state.skillsUploadError = `无法从文件名提取技能名称：${file.name}`;
                      result = { ok: false, error: state.skillsUploadError };
                      break;
                    }
                    result = await uploadSkill(
                      { ...state, gatewayUrl: state.settings.gatewayUrl },
                      name,
                      file,
                    );
                    if (!result.ok) {
                      state.skillsUploadError =
                        (files.length > 1 ? `上传 ${file.name} 失败：` : "") +
                        (result.error ?? "Upload failed");
                      state.skillsUploadTemplate = result.template ?? null;
                      break;
                    }
                  }
                  state.skillsUploadBusy = false;
                  if (result.ok) {
                    state.skillsAddModalOpen = false;
                    state.skillsUploadName = "";
                    state.skillsUploadFiles = [];
                    loadSkills(state, { clearMessages: true });
                  }
                },
                onToggle: (key, enabled) => updateSkillEnabled(state, key, enabled),
                onEdit: (key, value) => updateSkillEdit(state, key, value),
                onSaveKey: (key) => saveSkillApiKey(state, key),
                onInstall: (skillKey, name, installId) =>
                  installSkill(state, skillKey, name, installId),
                onDelete: (skillKey) => deleteSkill(state, skillKey),
                selectedSkillKey: state.skillsSelectedSkillKey,
                skillDocContent: state.skillsSkillDocContent,
                skillDocLoading: state.skillsSkillDocLoading,
                skillDocError: state.skillsSkillDocError,
                onSkillDetailClick: (key) => {
                  state.skillsSelectedSkillKey = key;
                  if (key) {
                    loadSkillDoc(state, key);
                  } else {
                    state.skillsSkillDocContent = null;
                    state.skillsSkillDocError = null;
                  }
                },
              })
            : nothing
        }

        ${
          state.tab === "mcp"
            ? renderMcp({
                servers:
                  (state.configForm?.mcp as { servers?: Record<string, import("./views/mcp.ts").McpServerEntry> })
                    ?.servers ?? {},
                loading: state.configLoading,
                saving: state.configSaving,
                selectedKey: state.mcpSelectedKey,
                viewMode: state.mcpViewMode,
                addModalOpen: state.mcpAddModalOpen,
                addName: state.mcpAddName,
                addDraft: (state.mcpAddDraft ?? {}) as import("./views/mcp.ts").McpServerEntry,
                addConnectionType: state.mcpAddConnectionType,
                addEditMode: state.mcpAddEditMode,
                addFormDirty: true,
                addRawJson: state.mcpAddRawJson,
                addRawError: state.mcpAddRawError,
                editMode: state.mcpEditMode,
                editConnectionType: state.mcpEditConnectionType,
                formDirty: state.mcpFormDirty,
                rawJson: state.mcpRawJson,
                rawError: state.mcpRawError,
                onRefresh: () => handleMcpRefresh(state),
                onViewModeChange: (mode) => handleMcpViewModeChange(state, mode),
                onAddServer: () => handleMcpAddServer(state),
                onAddClose: () => handleMcpAddClose(state),
                onAddNameChange: (name) => handleMcpAddNameChange(state, name),
                onAddFormPatch: (patch) => handleMcpAddFormPatch(state, patch),
                onAddRawChange: (json) => handleMcpAddRawChange(state, json),
                onAddConnectionTypeChange: (type) => handleMcpAddConnectionTypeChange(state, type),
                onAddEditModeChange: (mode) => handleMcpAddEditModeChange(state, mode),
                onAddSubmit: () => handleMcpAddSubmit(state),
                onSelect: (key) => handleMcpSelect(state, key),
                onToggle: (key, enabled) => handleMcpToggle(state, key, enabled),
                onFormPatch: (key, patch) => handleMcpFormPatch(state, key, patch),
                onRawChange: (key, json) => handleMcpRawChange(state, key, json),
                onEditModeChange: (mode) => (state.mcpEditMode = mode),
                onEditConnectionTypeChange: (type) => handleMcpEditConnectionTypeChange(state, type),
                onSave: () => handleMcpSave(state),
                onCancel: () => handleMcpCancel(state),
                onDelete: (key) => handleMcpDelete(state, key),
              })
            : nothing
        }

        ${
          state.tab === "llmTrace"
            ? renderLlmTrace({
                loading: state.llmTraceLoading,
                result: state.llmTraceResult,
                error: state.llmTraceError,
                mode: state.llmTraceMode,
                search: state.llmTraceSearch,
                enabled: state.llmTraceEnabled,
                saving: state.llmTraceSaving,
                onRefresh: () => handleLlmTraceRefresh(state),
                onModeChange: (mode) => handleLlmTraceModeChange(state, mode),
                onSearchChange: (value) => handleLlmTraceSearchChange(state, value),
                onToggleEnabled: () => handleLlmTraceToggleEnabled(state),
                onView: (sessionId) => handleLlmTraceView(state, sessionId),
              })
            : nothing
        }

        ${
          state.tab === "sandbox"
            ? renderSandbox({
                sandbox:
                  state.sandboxForm ??
                  getSandboxFromConfig(state) ??
                  {},
                saving: state.configSaving,
                onToggleEnabled: () => handleSandboxToggleEnabled(state),
                onToggleValidatorEnabled: () => handleValidatorToggleEnabled(state),
                onToggleApprovalEnabled: () => handleApprovalQueueToggleEnabled(state),
                onPatch: (path, value) => {
                  if (!state.sandboxForm) {
                    state.sandboxForm = syncSandboxFromConfig(state) ?? {};
                  }
                  handleSandboxPatch(state, state.sandboxForm as Record<string, unknown>, path, value);
                },
                onSave: () =>
                  handleSandboxSave(
                    state,
                    state.sandboxForm ?? getSandboxFromConfig(state) ?? {},
                  ),
                approvalsLoading: state.approvalsLoading,
                approvalsResult: state.approvalsResult,
                approvalsError: state.approvalsError,
                onApprovalsRefresh: () => loadApprovalsList(state),
                onApprove: (requestId) =>
                  approveApproval(state, requestId, "ui"),
                onDeny: (requestId, reason) =>
                  denyApproval(state, requestId, "ui", reason),
                pathForTab: (tab) => pathForTab(tab, state.basePath),
              })
            : nothing
        }

        ${
          state.tab === "nodes"
            ? renderNodes({
                loading: state.nodesLoading,
                nodes: state.nodes,
                devicesLoading: state.devicesLoading,
                devicesError: state.devicesError,
                devicesList: state.devicesList,
                configForm:
                  state.configForm ??
                  (state.configSnapshot?.config as Record<string, unknown> | null),
                configLoading: state.configLoading,
                configSaving: state.configSaving,
                configDirty: state.configFormDirty,
                configFormMode: state.configFormMode,
                execApprovalsLoading: state.execApprovalsLoading,
                execApprovalsSaving: state.execApprovalsSaving,
                execApprovalsDirty: state.execApprovalsDirty,
                execApprovalsSnapshot: state.execApprovalsSnapshot,
                execApprovalsForm: state.execApprovalsForm,
                execApprovalsSelectedAgent: state.execApprovalsSelectedAgent,
                execApprovalsTarget: state.execApprovalsTarget,
                execApprovalsTargetNodeId: state.execApprovalsTargetNodeId,
                onRefresh: () => loadNodes(state),
                onDevicesRefresh: () => loadDevices(state),
                onDeviceApprove: (requestId) => approveDevicePairing(state, requestId),
                onDeviceReject: (requestId) => rejectDevicePairing(state, requestId),
                onDeviceRotate: (deviceId, role, scopes) =>
                  rotateDeviceToken(state, { deviceId, role, scopes }),
                onDeviceRevoke: (deviceId, role) => revokeDeviceToken(state, { deviceId, role }),
                onLoadConfig: () => loadConfig(state),
                onLoadExecApprovals: () => {
                  const target =
                    state.execApprovalsTarget === "node" && state.execApprovalsTargetNodeId
                      ? { kind: "node" as const, nodeId: state.execApprovalsTargetNodeId }
                      : { kind: "gateway" as const };
                  return loadExecApprovals(state, target);
                },
                onBindDefault: (nodeId) => {
                  if (nodeId) {
                    updateConfigFormValue(state, ["tools", "exec", "node"], nodeId);
                  } else {
                    removeConfigFormValue(state, ["tools", "exec", "node"]);
                  }
                },
                onBindAgent: (agentIndex, nodeId) => {
                  const basePath = ["agents", "list", agentIndex, "tools", "exec", "node"];
                  if (nodeId) {
                    updateConfigFormValue(state, basePath, nodeId);
                  } else {
                    removeConfigFormValue(state, basePath);
                  }
                },
                onSaveBindings: () => saveConfig(state),
                onExecApprovalsTargetChange: (kind, nodeId) => {
                  state.execApprovalsTarget = kind;
                  state.execApprovalsTargetNodeId = nodeId;
                  state.execApprovalsSnapshot = null;
                  state.execApprovalsForm = null;
                  state.execApprovalsDirty = false;
                  state.execApprovalsSelectedAgent = null;
                },
                onExecApprovalsSelectAgent: (agentId) => {
                  state.execApprovalsSelectedAgent = agentId;
                },
                onExecApprovalsPatch: (path, value) =>
                  updateExecApprovalsFormValue(state, path, value),
                onExecApprovalsRemove: (path) => removeExecApprovalsFormValue(state, path),
                onSaveExecApprovals: () => {
                  const target =
                    state.execApprovalsTarget === "node" && state.execApprovalsTargetNodeId
                      ? { kind: "node" as const, nodeId: state.execApprovalsTargetNodeId }
                      : { kind: "gateway" as const };
                  return saveExecApprovals(state, target);
                },
              })
            : nothing
        }

        ${
          state.tab === "chat"
            ? renderChat({
                sessionKey: state.sessionKey,
                onSessionKeyChange: (next) => {
                  state.sessionKey = next;
                  state.chatMessage = "";
                  state.chatAttachments = [];
                  state.chatStream = null;
                  state.chatStreamStartedAt = null;
                  state.chatRunId = null;
                  state.chatQueue = [];
                  state.resetToolStream();
                  state.resetChatScroll();
                  state.applySettings({
                    ...state.settings,
                    sessionKey: next,
                    lastActiveSessionKey: next,
                  });
                  void state.loadAssistantIdentity();
                  void loadChatHistory(state);
                  void refreshChatAvatar(state);
                },
                thinkingLevel: state.chatThinkingLevel,
                showThinking,
                loading: state.chatLoading,
                sending: state.chatSending,
                compactionStatus: state.compactionStatus,
                assistantAvatarUrl: chatAvatarUrl,
                messages: state.chatMessages,
                toolMessages: state.chatToolMessages,
                stream: state.chatStream,
                streamStartedAt: state.chatStreamStartedAt,
                draft: state.chatMessage,
                queue: state.chatQueue,
                connected: state.connected,
                canSend: state.connected,
                disabledReason: chatDisabledReason,
                error: state.lastError,
                sessions: state.sessionsResult,
                focusMode: chatFocus,
                onRefresh: () => {
                  state.resetToolStream();
                  return Promise.all([loadChatHistory(state), refreshChatAvatar(state)]);
                },
                onToggleFocusMode: () => {
                  if (state.onboarding) {
                    return;
                  }
                  state.applySettings({
                    ...state.settings,
                    chatFocusMode: !state.settings.chatFocusMode,
                  });
                },
                onChatScroll: (event) => state.handleChatScroll(event),
                onDraftChange: (next) => (state.chatMessage = next),
                attachments: state.chatAttachments,
                onAttachmentsChange: (next) => (state.chatAttachments = next),
                onSend: () => state.handleSendChat(),
                canAbort: Boolean(state.chatRunId),
                onAbort: () => void state.handleAbortChat(),
                onQueueRemove: (id) => state.removeQueuedMessage(id),
                onNewSession: () => state.handleSendChat("/new", { restoreDraft: true }),
                showNewMessages: state.chatNewMessagesBelow,
                onScrollToBottom: () => state.scrollToBottom(),
                // Sidebar props for tool output viewing
                sidebarOpen: state.sidebarOpen,
                sidebarContent: state.sidebarContent,
                sidebarError: state.sidebarError,
                splitRatio: state.splitRatio,
                onOpenSidebar: (content: string) => state.handleOpenSidebar(content),
                onCloseSidebar: () => state.handleCloseSidebar(),
                onSplitRatioChange: (ratio: number) => state.handleSplitRatioChange(ratio),
                assistantName: state.assistantName,
                assistantAvatar: state.assistantAvatar,
              })
            : nothing
        }

        ${
          state.tab === "digitalEmployee"
            ? renderDigitalEmployee({
                loading: state.digitalEmployeesLoading,
                employees: state.digitalEmployees,
                error: state.digitalEmployeesError,
                filter: state.digitalEmployeesFilter,
                viewMode: state.digitalEmployeesViewMode,
                onRefresh: () => loadDigitalEmployees(state),
                createModalOpen: state.digitalEmployeeCreateModalOpen,
                createName: state.digitalEmployeeCreateName,
                createDescription: state.digitalEmployeeCreateDescription,
                createPrompt: state.digitalEmployeeCreatePrompt,
                createError: state.digitalEmployeeCreateError,
                createBusy: state.digitalEmployeeCreateBusy,
                advancedOpen: state.digitalEmployeeAdvancedOpen,
                createMcpMode: state.digitalEmployeeCreateMcpMode,
                mcpJson: state.digitalEmployeeCreateMcpJson,
                mcpItems: state.digitalEmployeeCreateMcpItems ?? [],
                onFilterChange: (next) => {
                  state.digitalEmployeesFilter = next;
                },
                onViewModeChange: (mode) => {
                  state.digitalEmployeesViewMode = mode;
                },
                onCopy: async (employeeId) => {
                  await copyDigitalEmployee(state, employeeId);
                },
                onMcpJsonChange: (value) => {
                  state.digitalEmployeeCreateMcpJson = value;
                },
                onMcpModeChange: (mode) => {
                  state.digitalEmployeeCreateMcpMode = mode;
                },
                onMcpAddItem: () => {
                  const next = state.digitalEmployeeCreateMcpItems ?? [];
                  state.digitalEmployeeCreateMcpItems = [
                    ...next,
                    {
                      id: generateUUID(),
                      key: "",
                      editMode: "form",
                      connectionType: "stdio",
                      draft: { command: "npx", args: [], env: {} },
                      rawJson: "{}",
                      rawError: null,
                      collapsed: false,
                    },
                  ];
                },
                onMcpRemoveItem: (id) => {
                  state.digitalEmployeeCreateMcpItems = (state.digitalEmployeeCreateMcpItems ?? []).filter(
                    (it) => it.id !== id,
                  );
                },
                onMcpCollapsedChange: (id, collapsed) => {
                  state.digitalEmployeeCreateMcpItems = (state.digitalEmployeeCreateMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, collapsed } : it,
                  );
                },
                onMcpKeyChange: (id, key) => {
                  state.digitalEmployeeCreateMcpItems = (state.digitalEmployeeCreateMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, key } : it,
                  );
                },
                onMcpEditModeChange: (id, mode) => {
                  state.digitalEmployeeCreateMcpItems = (state.digitalEmployeeCreateMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, editMode: mode } : it,
                  );
                },
                onMcpConnectionTypeChange: (id, type) => {
                  state.digitalEmployeeCreateMcpItems = (state.digitalEmployeeCreateMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, connectionType: type } : it,
                  );
                },
                onMcpFormPatch: (id, patch) => {
                  state.digitalEmployeeCreateMcpItems = (state.digitalEmployeeCreateMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, draft: { ...(it.draft ?? {}), ...(patch ?? {}) } } : it,
                  );
                },
                onMcpRawChange: (id, json) => {
                  state.digitalEmployeeCreateMcpItems = (state.digitalEmployeeCreateMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, rawJson: json, rawError: null } : it,
                  );
                },
                skillUploadName: state.digitalEmployeeSkillUploadName,
                skillUploadFiles: state.digitalEmployeeSkillUploadFiles ?? [],
                skillUploadError: state.digitalEmployeeSkillUploadError,
                onCreateOpen: () => {
                  state.digitalEmployeeCreateModalOpen = true;
                  state.digitalEmployeeAdvancedOpen = false;
                  state.digitalEmployeeCreateMcpMode = "builder";
                  state.digitalEmployeeCreateMcpJson = "";
                  state.digitalEmployeeCreateMcpItems = [];
                  state.digitalEmployeeSkillUploadName = "";
                  state.digitalEmployeeSkillUploadFiles = [];
                  state.digitalEmployeeSkillUploadError = null;
                },
                onCreateClose: () => {
                  if (state.digitalEmployeeCreateBusy) return;
                  state.digitalEmployeeCreateModalOpen = false;
                  state.digitalEmployeeCreateError = null;
                  state.digitalEmployeeAdvancedOpen = false;
                  state.digitalEmployeeCreateMcpMode = "builder";
                  state.digitalEmployeeCreateMcpJson = "";
                  state.digitalEmployeeCreateMcpItems = [];
                  state.digitalEmployeeSkillUploadName = "";
                  state.digitalEmployeeSkillUploadFiles = [];
                  state.digitalEmployeeSkillUploadError = null;
                },
                onCreateNameChange: (value) => {
                  state.digitalEmployeeCreateName = value;
                },
                onCreateDescriptionChange: (value) => {
                  state.digitalEmployeeCreateDescription = value;
                },
                onCreatePromptChange: (value) => {
                  state.digitalEmployeeCreatePrompt = value;
                },
                onCreateSubmit: async () => {
                  // 将点选配置的 MCP 条目汇总为 JSON（与原 mcp.servers 结构一致）。
                  if (state.digitalEmployeeCreateMcpMode === "builder") {
                    const items = state.digitalEmployeeCreateMcpItems ?? [];
                    const servers: Record<string, unknown> = {};
                    const seen = new Set<string>();
                    let firstError: string | null = null;
                    const nextItems = items.map((it) => ({ ...it, rawError: null as string | null }));
                    for (let i = 0; i < nextItems.length; i++) {
                      const it = nextItems[i];
                      const key = it.key?.trim() ?? "";
                      if (!key) {
                        continue;
                      }
                      if (seen.has(key)) {
                        firstError ??= `MCP key 重复：${key}`;
                        continue;
                      }
                      seen.add(key);
                      if (it.editMode === "raw") {
                        const raw = it.rawJson?.trim() ?? "";
                        if (!raw) continue;
                        try {
                          const parsed = JSON.parse(raw) as unknown;
                          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                            it.rawError = "JSON 必须是对象";
                            firstError ??= `MCP ${key} 的 JSON 无效`;
                            continue;
                          }
                          servers[key] = parsed;
                        } catch {
                          it.rawError = "JSON 格式无效";
                          firstError ??= `MCP ${key} 的 JSON 无效`;
                          continue;
                        }
                      } else {
                        const entry = it.draft ?? {};
                        // 轻量校验：必须满足其连接类型的必要字段
                        if (it.connectionType === "stdio" && !(entry as { command?: string }).command?.trim()) {
                          firstError ??= `MCP ${key} 缺少 command`;
                          continue;
                        }
                        if (it.connectionType === "url" && !(entry as { url?: string }).url?.trim()) {
                          firstError ??= `MCP ${key} 缺少 url`;
                          continue;
                        }
                        if (
                          it.connectionType === "service" &&
                          (!(entry as { service?: string }).service?.trim() ||
                            !(entry as { serviceUrl?: string }).serviceUrl?.trim())
                        ) {
                          firstError ??= `MCP ${key} 缺少 service/serviceUrl`;
                          continue;
                        }
                        servers[key] = entry;
                      }
                    }
                    state.digitalEmployeeCreateMcpItems = nextItems;
                    state.digitalEmployeeCreateMcpJson =
                      Object.keys(servers).length > 0 ? JSON.stringify(servers, null, 2) : "";
                    if (firstError) {
                      state.digitalEmployeeCreateError = firstError;
                      return;
                    }
                  }
                  await createDigitalEmployee(state);
                  if (!state.digitalEmployeeCreateError) {
                    state.digitalEmployeeCreateModalOpen = false;
                    state.digitalEmployeeAdvancedOpen = false;
                  }
                },
                onToggleAdvanced: () => {
                  state.digitalEmployeeAdvancedOpen = !state.digitalEmployeeAdvancedOpen;
                },
                onSkillUploadNameChange: (next) => {
                  state.digitalEmployeeSkillUploadName = next;
                },
                onSkillUploadFilesChange: (files) => {
                  state.digitalEmployeeSkillUploadFiles = files ?? [];
                },
                onOpenEmployee: async (employeeId) => {
                  const idPart = employeeId.trim() || "default";
                  await loadSessions(state, { activeMinutes: 10080, limit: 200 });
                  const sessions = state.sessionsResult?.sessions ?? [];
                  const employeePatterns = [
                    `agent:main:employee:${idPart}:`,
                    `agent:main:employee-${idPart}`,
                    `employee:${idPart}:`,
                    `employee-${idPart}`,
                  ];
                  const existing = sessions.find((s) =>
                    employeePatterns.some((p) => s.key.includes(p) || s.key === p),
                  );
                  const sessionKey = existing
                    ? existing.key
                    : `agent:main:employee:${idPart}:run:${generateUUID()}`;
                  state.sessionKey = sessionKey;
                  state.chatMessage = "";
                  state.chatAttachments = [];
                  state.chatStream = null;
                  state.chatStreamStartedAt = null;
                  state.chatRunId = null;
                  state.chatQueue = [];
                  state.resetToolStream();
                  state.resetChatScroll();
                  state.applySettings({
                    ...state.settings,
                    sessionKey,
                    lastActiveSessionKey: sessionKey,
                  });
                  void state.loadAssistantIdentity();
                  void loadChatHistory(state);
                  void refreshChatAvatar(state);
                  state.setTab("chat");
                  if (!existing) {
                    state.handleSendChat(
                      "当前已开启数字员工会话。请以你配置的人设（如有）向用户打招呼，保持你的语气、风格和情绪。用 1～3 句话问候并询问用户想做什么。",
                    );
                  }
                },
                onToggleEnabled: (employeeId, enabled) =>
                  updateDigitalEmployeeEnabled(state, employeeId, enabled),
                onDelete: (employeeId) => deleteDigitalEmployee(state, employeeId),
                onEdit: async (employeeId) => {
                  const emp = state.digitalEmployees.find((e) => e.id === employeeId);
                  const manifest = await getDigitalEmployee(state, employeeId);
                  if (!manifest) {
                    state.digitalEmployeesError = "无法加载员工详情";
                    return;
                  }
                  const buildEditMcpItems = (servers: Record<string, unknown> | undefined) => {
                    const items: import("./views/digital-employee.js").EmployeeMcpItem[] = [];
                    if (!servers || typeof servers !== "object") return items;
                    for (const [key, value] of Object.entries(servers)) {
                      const k = String(key ?? "").trim();
                      if (!k) continue;
                      const v = value as Record<string, unknown>;
                      const isObj = v && typeof v === "object" && !Array.isArray(v);
                      const connectionType: "stdio" | "url" | "service" =
                        isObj && typeof v.url === "string" && v.url.trim()
                          ? "url"
                          : isObj && typeof v.service === "string" && v.service.trim()
                            ? "service"
                            : "stdio";
                      const isForm =
                        isObj &&
                        ((connectionType === "stdio" && typeof v.command === "string" && v.command.trim()) ||
                          (connectionType === "url" && typeof v.url === "string" && v.url.trim()) ||
                          (connectionType === "service" &&
                            typeof v.service === "string" &&
                            v.service.trim() &&
                            typeof v.serviceUrl === "string" &&
                            v.serviceUrl.trim()));
                      items.push({
                        id: generateUUID(),
                        key: k,
                        editMode: isForm ? "form" : "raw",
                        connectionType,
                        draft: isForm ? (v as any) : { command: "npx", args: [], env: {} },
                        rawJson: isObj ? JSON.stringify(v, null, 2) : "{}",
                        rawError: null,
                        collapsed: true,
                      });
                    }
                    return items;
                  };
                  state.digitalEmployeeEditModalOpen = true;
                  state.digitalEmployeeEditId = manifest.id;
                  state.digitalEmployeeEditName = manifest.name || manifest.id;
                  state.digitalEmployeeEditDescription = manifest.description ?? "";
                  state.digitalEmployeeEditPrompt = manifest.prompt ?? "";
                  state.digitalEmployeeEditMcpJson =
                    manifest.mcpServers && Object.keys(manifest.mcpServers).length > 0
                      ? JSON.stringify(manifest.mcpServers, null, 2)
                      : "";
                  state.digitalEmployeeEditMcpMode = "builder";
                  state.digitalEmployeeEditMcpItems = buildEditMcpItems(manifest.mcpServers);
                  state.digitalEmployeeEditSkillNames =
                    (emp?.skillNames ?? emp?.skillIds ?? manifest.skillIds ?? []) as string[];
                  state.digitalEmployeeEditSkillFilesToUpload = [];
                  state.digitalEmployeeEditSkillsToDelete = [];
                  state.digitalEmployeeEditEnabled = manifest.enabled !== false;
                  state.digitalEmployeeEditError = null;
                },
                editModalOpen: state.digitalEmployeeEditModalOpen,
                editId: state.digitalEmployeeEditId,
                editName: state.digitalEmployeeEditName,
                editDescription: state.digitalEmployeeEditDescription,
                editPrompt: state.digitalEmployeeEditPrompt,
                editMcpJson: state.digitalEmployeeEditMcpJson,
                editMcpMode: state.digitalEmployeeEditMcpMode,
                editMcpItems: state.digitalEmployeeEditMcpItems ?? [],
                onEditMcpModeChange: (mode) => {
                  state.digitalEmployeeEditMcpMode = mode;
                },
                onEditMcpAddItem: () => {
                  const next = state.digitalEmployeeEditMcpItems ?? [];
                  state.digitalEmployeeEditMcpItems = [
                    ...next,
                    {
                      id: generateUUID(),
                      key: "",
                      editMode: "form",
                      connectionType: "stdio",
                      draft: { command: "npx", args: [], env: {} },
                      rawJson: "{}",
                      rawError: null,
                      collapsed: false,
                    },
                  ];
                },
                onEditMcpRemoveItem: (id) => {
                  state.digitalEmployeeEditMcpItems = (state.digitalEmployeeEditMcpItems ?? []).filter((it) => it.id !== id);
                },
                onEditMcpCollapsedChange: (id, collapsed) => {
                  state.digitalEmployeeEditMcpItems = (state.digitalEmployeeEditMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, collapsed } : it,
                  );
                },
                onEditMcpKeyChange: (id, key) => {
                  state.digitalEmployeeEditMcpItems = (state.digitalEmployeeEditMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, key } : it,
                  );
                },
                onEditMcpEditModeChange: (id, mode) => {
                  state.digitalEmployeeEditMcpItems = (state.digitalEmployeeEditMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, editMode: mode } : it,
                  );
                },
                onEditMcpConnectionTypeChange: (id, type) => {
                  state.digitalEmployeeEditMcpItems = (state.digitalEmployeeEditMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, connectionType: type } : it,
                  );
                },
                onEditMcpFormPatch: (id, patch) => {
                  state.digitalEmployeeEditMcpItems = (state.digitalEmployeeEditMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, draft: { ...(it.draft ?? {}), ...(patch ?? {}) } } : it,
                  );
                },
                onEditMcpRawChange: (id, json) => {
                  state.digitalEmployeeEditMcpItems = (state.digitalEmployeeEditMcpItems ?? []).map((it) =>
                    it.id === id ? { ...it, rawJson: json, rawError: null } : it,
                  );
                },
                editSkillNames: state.digitalEmployeeEditSkillNames ?? [],
                editSkillFilesToUpload: state.digitalEmployeeEditSkillFilesToUpload ?? [],
                editSkillsToDelete: state.digitalEmployeeEditSkillsToDelete ?? [],
                editError: state.digitalEmployeeEditError,
                editBusy: state.digitalEmployeeEditBusy,
                onEditClose: () => {
                  if (state.digitalEmployeeEditBusy) return;
                  state.digitalEmployeeEditModalOpen = false;
                  state.digitalEmployeeEditError = null;
                  state.digitalEmployeeEditMcpMode = "raw";
                  state.digitalEmployeeEditMcpItems = [];
                },
                onEditDescriptionChange: (v) => {
                  state.digitalEmployeeEditDescription = v;
                },
                onEditPromptChange: (v) => {
                  state.digitalEmployeeEditPrompt = v;
                },
                onEditMcpJsonChange: (v) => {
                  state.digitalEmployeeEditMcpJson = v;
                },
                onEditSkillFilesChange: (files) => {
                  state.digitalEmployeeEditSkillFilesToUpload = files ?? [];
                },
                onEditSkillDelete: (name) => {
                  const list = state.digitalEmployeeEditSkillsToDelete ?? [];
                  if (!list.includes(name)) {
                    state.digitalEmployeeEditSkillsToDelete = [...list, name];
                  }
                },
                onEditSkillUndoDelete: (name) => {
                  state.digitalEmployeeEditSkillsToDelete = (
                    state.digitalEmployeeEditSkillsToDelete ?? []
                  ).filter((n) => n !== name);
                },
                onEditSubmit: async () => {
                  // 将点选配置的 MCP 条目汇总为 JSON（与原 mcp.servers 结构一致）。
                  if (state.digitalEmployeeEditMcpMode === "builder") {
                    const items = state.digitalEmployeeEditMcpItems ?? [];
                    const servers: Record<string, unknown> = {};
                    const seen = new Set<string>();
                    let firstError: string | null = null;
                    const nextItems = items.map((it) => ({ ...it, rawError: null as string | null }));
                    for (let i = 0; i < nextItems.length; i++) {
                      const it = nextItems[i];
                      const key = it.key?.trim() ?? "";
                      if (!key) continue;
                      if (seen.has(key)) {
                        firstError ??= `MCP key 重复：${key}`;
                        continue;
                      }
                      seen.add(key);
                      if (it.editMode === "raw") {
                        const raw = it.rawJson?.trim() ?? "";
                        if (!raw) continue;
                        try {
                          const parsed = JSON.parse(raw) as unknown;
                          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                            it.rawError = "JSON 必须是对象";
                            firstError ??= `MCP ${key} 的 JSON 无效`;
                            continue;
                          }
                          servers[key] = parsed;
                        } catch {
                          it.rawError = "JSON 格式无效";
                          firstError ??= `MCP ${key} 的 JSON 无效`;
                          continue;
                        }
                      } else {
                        const entry = it.draft ?? {};
                        if (it.connectionType === "stdio" && !(entry as { command?: string }).command?.trim()) {
                          firstError ??= `MCP ${key} 缺少 command`;
                          continue;
                        }
                        if (it.connectionType === "url" && !(entry as { url?: string }).url?.trim()) {
                          firstError ??= `MCP ${key} 缺少 url`;
                          continue;
                        }
                        if (
                          it.connectionType === "service" &&
                          (!(entry as { service?: string }).service?.trim() ||
                            !(entry as { serviceUrl?: string }).serviceUrl?.trim())
                        ) {
                          firstError ??= `MCP ${key} 缺少 service/serviceUrl`;
                          continue;
                        }
                        servers[key] = entry;
                      }
                    }
                    state.digitalEmployeeEditMcpItems = nextItems;
                    state.digitalEmployeeEditMcpJson = Object.keys(servers).length > 0 ? JSON.stringify(servers, null, 2) : "";
                    if (firstError) {
                      state.digitalEmployeeEditError = firstError;
                      return;
                    }
                  }
                  await updateDigitalEmployee(state);
                  if (!state.digitalEmployeeEditError) {
                    state.digitalEmployeeEditModalOpen = false;
                  }
                },
              })
            : nothing
        }

        ${
          state.tab === "envVars"
            ? renderEnvVars({
                vars:
                  (state.configForm?.env as { vars?: Record<string, string> } | undefined)?.vars ??
                  (state.configSnapshot?.config as { env?: { vars?: Record<string, string> } } | undefined)
                    ?.env?.vars ??
                  {},
                modelEnv:
                  (state.configForm?.env as { modelEnv?: Record<string, Record<string, string>> } | undefined)
                    ?.modelEnv ??
                  (state.configSnapshot?.config as { env?: { modelEnv?: Record<string, Record<string, string>> } } | undefined)
                    ?.env?.modelEnv ??
                  {},
                shellEnv:
                  (state.configForm?.env as { shellEnv?: { enabled?: boolean; timeoutMs?: number } } | undefined)
                    ?.shellEnv ??
                  (state.configSnapshot?.config as { env?: { shellEnv?: { enabled?: boolean; timeoutMs?: number } } } | undefined)
                    ?.env?.shellEnv ??
                  null,
                dirty: state.configFormDirty,
                loading: state.configLoading,
                saving: state.configSaving,
                connected: state.connected,
                onVarsChange: (next) => {
                  updateConfigFormValue(state, ["env", "vars"], next);
                },
                onModelEnvChange: (next) => {
                  updateConfigFormValue(state, ["env", "modelEnv"], next);
                },
                onShellEnvChange: (next) => {
                  updateConfigFormValue(state, ["env", "shellEnv"], next);
                },
                onSave: async () => {
                  const envForm = state.configForm?.env as {
                    vars?: Record<string, string>;
                    modelEnv?: Record<string, Record<string, string>>;
                    shellEnv?: { enabled?: boolean; timeoutMs?: number };
                  } | undefined;
                  const raw = envForm?.vars ?? {};
                  const filtered: Record<string, string> = {};
                  for (const [k, v] of Object.entries(raw)) {
                    if (k.trim()) filtered[k.trim()] = v;
                  }
                  updateConfigFormValue(state, ["env", "vars"], filtered);
                  const rawModelEnv = envForm?.modelEnv ?? {};
                  const filteredModelEnv: Record<string, Record<string, string>> = {};
                  for (const [modelRef, ev] of Object.entries(rawModelEnv)) {
                    if (!ev || typeof ev !== "object") continue;
                    const f: Record<string, string> = {};
                    for (const [k, v] of Object.entries(ev)) {
                      if (k.trim() && k !== "__new__") f[k.trim()] = v;
                    }
                    if (Object.keys(f).length > 0) filteredModelEnv[modelRef] = f;
                  }
                  updateConfigFormValue(state, ["env", "modelEnv"], filteredModelEnv);
                  await saveConfig(state);
                },
                onReload: () => loadConfig(state),
              })
            : nothing
        }

        ${
          state.tab === "config"
            ? renderConfig({
                raw: state.configRaw,
                originalRaw: state.configRawOriginal,
                valid: state.configValid,
                issues: state.configIssues,
                loading: state.configLoading,
                saving: state.configSaving,
                applying: state.configApplying,
                updating: state.updateRunning,
                connected: state.connected,
                schema: state.configSchema,
                schemaLoading: state.configSchemaLoading,
                uiHints: state.configUiHints,
                formMode: state.configFormMode,
                formValue: state.configForm,
                originalValue: state.configFormOriginal,
                searchQuery: state.configSearchQuery,
                activeSection: state.configActiveSection,
                activeSubsection: state.configActiveSubsection,
                onRawChange: (next) => {
                  state.configRaw = next;
                },
                onFormModeChange: (mode) => (state.configFormMode = mode),
                onFormPatch: (path, value) => updateConfigFormValue(state, path, value),
                onSearchChange: (query) => (state.configSearchQuery = query),
                onSectionChange: (section) => {
                  state.configActiveSection = section;
                  state.configActiveSubsection = null;
                },
                onSubsectionChange: (section) => (state.configActiveSubsection = section),
                onReload: () => loadConfig(state),
                onSave: () => saveConfig(state),
                onApply: () => applyConfig(state),
                onUpdate: () => runUpdate(state),
              })
            : nothing
        }

        ${
          state.tab === "models"
            ? renderModels({
                providers:
                  (state.configForm?.models as { providers?: Record<string, import("./views/models.ts").ModelProvider> })
                    ?.providers ?? {},
                modelEnv:
                  (state.configForm?.env as { modelEnv?: Record<string, Record<string, string>> })?.modelEnv ?? {},
                defaultModelRef: resolveDefaultModelRef(state.configForm),
                loading: state.configLoading,
                saving: state.configSaving,
                selectedProvider: state.modelsSelectedProvider,
                viewMode: state.modelsViewMode,
                formDirty: state.modelsFormDirty,
                addProviderModalOpen: state.modelsAddProviderModalOpen,
                addProviderForm: state.modelsAddProviderForm,
                addModelModalOpen: state.modelsAddModelModalOpen,
                addModelForm: state.modelsAddModelForm,
                useModelModalOpen: state.modelsUseModelModalOpen,
                useModelModalProvider: state.modelsUseModelModalProvider,
                saveError: state.modelsSaveError,
                onRefresh: () => handleModelsRefresh(state),
                onAddProvider: () => handleModelsAddProvider(state),
                onAddProviderModalClose: () => handleModelsAddProviderModalClose(state),
                onAddProviderFormChange: (form) => handleModelsAddProviderFormChange(state, form),
                onAddProviderSubmit: () => handleModelsAddProviderSubmit(state),
                onSelect: (key) => handleModelsSelect(state, key),
                onViewModeChange: (mode) => (state.modelsViewMode = mode),
                onPatch: (key, patch) => handleModelsPatch(state, key, patch),
                onAddModel: (providerKey) => handleModelsAddModel(state, providerKey),
                onAddModelModalClose: () => handleModelsAddModelModalClose(state),
                onAddModelFormChange: (form) => handleModelsAddModelFormChange(state, form),
                onAddModelSubmit: (providerKey) => handleModelsAddModelSubmit(state, providerKey),
                onRemoveModel: (providerKey, modelId) => handleModelsRemoveModel(state, providerKey, modelId),
                onPatchModelEnv: (providerKey, modelId, envVars) =>
                  handleModelsPatchModelEnv(state, providerKey, modelId, envVars),
                onSave: () => handleModelsSave(state),
                onCancel: () => handleModelsCancel(state),
                onUseModelClick: (provider) => handleModelsUseModelClick(state, provider),
                onUseModelModalClose: () => handleModelsUseModelModalClose(state),
                onUseModel: (provider, modelId) => handleModelsUseModel(state, provider, modelId),
                onCancelUse: (provider) => handleModelsCancelUse(state, provider),
              })
            : nothing
        }

        ${
          state.tab === "debug"
            ? renderDebug({
                loading: state.debugLoading,
                status: state.debugStatus,
                health: state.debugHealth,
                models: state.debugModels,
                heartbeat: state.debugHeartbeat,
                eventLog: state.eventLog,
                callMethod: state.debugCallMethod,
                callParams: state.debugCallParams,
                callResult: state.debugCallResult,
                callError: state.debugCallError,
                onCallMethodChange: (next) => (state.debugCallMethod = next),
                onCallParamsChange: (next) => (state.debugCallParams = next),
                onRefresh: () => loadDebug(state),
                onCall: () => callDebugMethod(state),
              })
            : nothing
        }

        ${
          state.tab === "logs"
            ? renderLogs({
                loading: state.logsLoading,
                error: state.logsError,
                file: state.logsFile,
                entries: state.logsEntries,
                filterText: state.logsFilterText,
                levelFilters: state.logsLevelFilters,
                autoFollow: state.logsAutoFollow,
                truncated: state.logsTruncated,
                onFilterTextChange: (next) => (state.logsFilterText = next),
                onLevelToggle: (level, enabled) => {
                  state.logsLevelFilters = { ...state.logsLevelFilters, [level]: enabled };
                },
                onToggleAutoFollow: (next) => (state.logsAutoFollow = next),
                onRefresh: () => loadLogs(state, { reset: true }),
                onExport: (lines, label) => state.exportLogs(lines, label),
                onScroll: (event) => state.handleLogsScroll(event),
              })
            : nothing
        }
      </main>
      ${renderExecApprovalPrompt(state)}
      ${renderGatewayUrlConfirmation(state)}
    </div>
  `;
}
