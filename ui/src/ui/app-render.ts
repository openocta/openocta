import { html, nothing } from "lit";
import type { AppViewState } from "./app-view-state.ts";
import type { UsageState } from "./controllers/usage.ts";
import { parseAgentSessionKey } from "./routing/session-key.js";
import { refreshChatAvatar } from "./app-chat.ts";
import { syncUrlWithSessionKey } from "./app-settings.ts";
import { renderChatControls, renderTab } from "./app-render.helpers.ts";
import { loadChannels } from "./controllers/channels.ts";
import { loadChatHistory } from "./controllers/chat.ts";
import { loadDigitalEmployees } from "./controllers/digital-employees.ts";
import { applyConfig, loadConfig, runUpdate, saveConfig, saveConfigPatch, updateConfigFormValue, removeConfigFormValue } from "./controllers/config.ts";
import {
  loadCronRuns,
  toggleCronJob,
  runCronJob,
  removeCronJob,
  addCronJob,
  cronFormFromJob,
  updateCronJob,
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
import {
  createSession,
  deleteSession,
  deleteSessions,
  ensureSessionForKey,
  loadSessions,
  patchSession,
} from "./controllers/sessions.ts";
import {
  deleteSkill,
  disabledFoldersForMarketItems,
  resolveSkillKeyForMarketFolder,
  loadSkillDoc,
  installSkill,
  loadSkills,
  saveSkillApiKey,
  updateSkillEdit,
  updateSkillEnabled,
  uploadSkill,
  listSkillFiles,
  getSkillFile,
  saveSkillFile,
} from "./controllers/skills.ts";
import { loadUsage, loadSessionTimeSeries, loadSessionLogs } from "./controllers/usage.ts";
import { icons } from "./icons.ts";
import { normalizeBasePath, getTabGroups, iconForTab, pathForTab, subtitleForTab, titleForTab } from "./navigation.ts";
import { nativeAlert, nativeConfirm, nativePrompt } from "./native-dialog-bridge.ts";
import { t } from "./strings.js";

/** 从 session key 提取数字员工 ID，如 agent:main:employee:xxx:run:uuid -> xxx */
function extractEmployeeIdFromSessionKey(key: string): string | null {
  const lower = (key ?? "").toLowerCase();
  const empPrefix = "agent:main:employee:";
  const empDash = "agent:main:employee-";
  if (lower.startsWith(empPrefix)) {
    const rest = key.slice(empPrefix.length);
    const colon = rest.indexOf(":");
    return colon >= 0 ? rest.slice(0, colon) : rest;
  }
  if (lower.startsWith(empDash)) {
    return key.slice(empDash.length).split(/[:/-]/)[0] || null;
  }
  return null;
}

function normalizeDigitalEmployeeId(raw: string): string {
  const t = (raw ?? "").trim().toLowerCase();
  return t || "default";
}

/** 与网关 chat.send 一致使用小写 id；优先精确 stable key，否则复用该员工任一已有会话（含旧 :run:uuid），保证一人一线程。 */
function findExistingEmployeeWebchatSessionKey(
  sessions: Array<{ key: string }>,
  idNorm: string,
): string | null {
  const stable = `agent:main:employee:${idNorm}`;
  for (const s of sessions) {
    if ((s.key ?? "").trim().toLowerCase() === stable) {
      return s.key;
    }
  }
  for (const s of sessions) {
    const ek = extractEmployeeIdFromSessionKey(s.key);
    if (ek && ek.toLowerCase() === idNorm) {
      return s.key;
    }
  }
  return null;
}

async function openDigitalEmployeeWebchat(state: AppViewState, employeeIdRaw: string) {
  const idNorm = normalizeDigitalEmployeeId(employeeIdRaw);
  await loadSessions(state, {
    activeMinutes: 10080,
    limit: 5000,
    includeLastMessage: true,
  });
  const sessions = state.sessionsResult?.sessions ?? [];
  const existingKey = findExistingEmployeeWebchatSessionKey(sessions, idNorm);
  const sessionKey = existingKey ?? `agent:main:employee:${idNorm}`;
  const isNewSlot = !existingKey;

  if (isNewSlot) {
    const emp = state.digitalEmployees.find((e) => (e.id ?? "").trim().toLowerCase() === idNorm);
    const label = (emp?.name && String(emp.name).trim()
      ? String(emp.name).trim()
      : `数字员工 · ${idNorm}`);
    await ensureSessionForKey(state, { key: sessionKey, label });
  } else {
    await loadSessions(state, {
      activeMinutes: 10080,
      limit: 5000,
      includeLastMessage: true,
    });
  }

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
  await state.loadAssistantIdentity();
  await loadChatHistory(state);
  await refreshChatAvatar(state);
  state.setTab("message");
  if (isNewSlot) {
    void state.handleSendChat(
      "当前已开启数字员工会话。请以你配置的人设（如有）向用户打招呼，保持你的语气、风格和情绪。用 1～3 句话问候并询问用户想做什么。",
      { refreshSessions: true },
    );
  }
}

/** 侧栏搜索：汇总 key、展示名、副标题及网关返回的标签类字段（label、channel、origin 等） */
function buildSessionSidebarSearchHaystack(
  s: Record<string, unknown>,
  key: string,
  displayName: string,
  subtitle: string,
): string {
  const parts = [key, displayName, subtitle];
  const pushStr = (v: unknown) => {
    if (v == null) return;
    if (typeof v === "string") {
      const t = v.trim();
      if (t) parts.push(t);
      return;
    }
    if (typeof v === "number" || typeof v === "boolean") {
      parts.push(String(v));
    }
  };
  pushStr(s.label);
  pushStr(s.displayName);
  pushStr(s.sessionId);
  pushStr(s.derivedTitle);
  pushStr(s.kind);
  pushStr(s.channel);
  pushStr(s.subject);
  pushStr(s.groupChannel);
  pushStr(s.space);
  pushStr(s.chatType);
  pushStr(s.lastChannel);
  pushStr(s.lastTo);
  pushStr(s.lastMessagePreview);
  const origin = s.origin;
  if (origin && typeof origin === "object" && !Array.isArray(origin)) {
    for (const v of Object.values(origin as Record<string, unknown>)) {
      pushStr(v);
    }
  }
  return parts.join("\u0001").toLowerCase();
}

function sessionSidebarHaystackMatches(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

/** 侧栏会话 ⋯ 菜单预估高度（用于贴底向上展开） */
const SESSION_OVERFLOW_FLYOUT_EST_HEIGHT = 132;
const SESSION_OVERFLOW_GAP = 6;

function positionSessionOverflowFromButtonRect(r: DOMRect): { top: number; right: number } {
  const pad = 8;
  let top = r.bottom + SESSION_OVERFLOW_GAP;
  if (top + SESSION_OVERFLOW_FLYOUT_EST_HEIGHT > window.innerHeight - pad) {
    top = Math.max(pad, r.top - SESSION_OVERFLOW_FLYOUT_EST_HEIGHT - SESSION_OVERFLOW_GAP);
  }
  return { top, right: window.innerWidth - r.right };
}

function renderSessionOverflowFlyout(state: AppViewState, basePath: string) {
  const ov = state.sessionOverflow;
  if (!ov) {
    return nothing;
  }
  const key = ov.key;
  const isMainSession = key === "agent.main.main";
  const close = () => {
    state.sessionOverflow = null;
  };
  const shareUrlForKey = () => {
    const path = pathForTab("message", basePath);
    const u = new URL(path, window.location.origin);
    u.searchParams.set("session", key);
    return u.toString();
  };
  return html`
    <div class="session-overflow-backdrop" @click=${close}></div>
    <div
      class="session-overflow-flyout"
      style="top: ${ov.top}px; right: ${ov.right}px;"
      role="menu"
      aria-label="会话操作"
      @click=${(e: Event) => e.stopPropagation()}
    >
      <button
        type="button"
        role="menuitem"
        class="session-item__overflow-item"
        @click=${() => {
          close();
          state.sessionEditingKey = key;
        }}
      >
        重命名
      </button>
      <button
        type="button"
        role="menuitem"
        class="session-item__overflow-item"
        @click=${async () => {
          close();
          const url = shareUrlForKey();
          try {
            await navigator.clipboard.writeText(url);
            await nativeAlert("会话链接已复制到剪贴板");
          } catch {
            await nativePrompt("无法自动复制，请手动复制链接：", url);
          }
        }}
      >
        分享链接
      </button>
      <button
        type="button"
        role="menuitem"
        class="session-item__overflow-item"
        ?disabled=${isMainSession}
        @click=${async () => {
          close();
          if (isMainSession) return;
          const wasActive = state.sessionKey === key;
          await deleteSession(state, key);
          if (wasActive) {
            const nextKey =
              state.sessionsResult?.sessions?.[0]?.key ?? "agent.main.main";
            state.sessionKey = nextKey;
            state.chatMessage = "";
            state.chatAttachments = [];
            state.chatModelRef = null;
            state.chatStream = null;
            state.chatStreamStartedAt = null;
            state.chatRunId = null;
            state.chatQueue = [];
            state.resetToolStream();
            state.applySettings({
              ...state.settings,
              sessionKey: nextKey,
              lastActiveSessionKey: nextKey,
            });
            await Promise.all([loadChatHistory(state), refreshChatAvatar(state)]);
          }
        }}
      >
        删除
      </button>
    </div>
  `;
}

// Module-scope debounce for usage date changes (avoids type-unsafe hacks on state object)
let usageDateDebounceTimeout: number | null = null;
const debouncedLoadUsage = (state: UsageState) => {
  if (usageDateDebounceTimeout) {
    clearTimeout(usageDateDebounceTimeout);
  }
  usageDateDebounceTimeout = window.setTimeout(() => void loadUsage(state), 400);
};
import { renderDigitalEmployee, renderDigitalEmployeeCreateModal, renderDigitalEmployeeEditModal } from "./views/digital-employee.ts";
import {
  loadDigitalEmployees,
  createDigitalEmployee,
  updateDigitalEmployeeEnabled,
  deleteDigitalEmployee,
  copyDigitalEmployee,
  getDigitalEmployee,
  updateDigitalEmployee,
} from "./controllers/digital-employees.ts";
import { renderChannels } from "./views/channels.ts";
import { renderChat } from "./views/chat.ts";
import { renderConfig } from "./views/config.ts";
import { renderEnvVars } from "./views/env-vars.ts";
import { renderCronConfig, renderCronHistory } from "./views/cron.ts";
import { renderDebug } from "./views/debug.ts";
import { installFromSite } from "./controllers/remote-market.ts";
import { renderEmployeeMarket } from "./views/employee-market.ts";
import "./components/category-tree-sidebar.ts";
import { renderExecApprovalPrompt } from "./views/exec-approval.ts";
import { renderGatewayUrlConfirmation } from "./views/gateway-url-confirmation.ts";
import { renderNativeDialogOverlay } from "./views/native-dialog-overlay.ts";
import { renderLogs } from "./views/logs.ts";
import { renderNodes } from "./views/nodes.ts";
import { renderOverview } from "./views/overview.ts";
import { renderSessions } from "./views/sessions.ts";
import { renderSkillLibrary } from "./views/skill-library.ts";
import { renderToolLibrary } from "./views/tool-library.ts";
import { renderTutorials } from "./views/tutorials.ts";
import { requestDesktopClearWorkspace, requestDesktopUninstall } from "./controllers/desktop-uninstall.ts";
import { openExternalUrl } from "./open-external-url.ts";
import { renderAbout } from "./views/about.ts";
import { renderLlmTrace } from "./views/llm-trace.ts";
import { renderSecurity } from "./views/security.ts";
import { renderModels } from "./views/models.ts";
import { computeModelLibraryCategories, renderModelLibrary } from "./views/model-library.ts";
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
  handleMcpDelete,
  disabledMcpServerKeysFromSnapshot,
  resolveMcpServerEntryForUi,
  handleMcpToggle,
  handleMcpSelect,
  handleMcpFormPatch,
  handleMcpRawChange,
  handleMcpEditConnectionTypeChange,
  handleMcpSave,
  handleMcpCancel,
} from "./app-mcp.ts";
import { renderMcpEditModal } from "./views/mcp.ts";
import { cloneConfigObject } from "./controllers/config/form-utils.ts";
import {
  handleLlmTraceRefresh,
  handleLlmTraceModeChange,
  handleLlmTraceSearchChange,
  handleLlmTraceToggleEnabled,
  handleLlmTraceView,
  handleLlmTraceBack,
  handleLlmTraceDownload,
} from "./app-llm-trace.ts";
import {
  syncSecurityFromConfig,
  handleSecurityPresetApply,
  handleSecurityPatch,
  handleSecuritySave,
} from "./app-security.ts";
import { getSecurityFromConfig } from "./controllers/security.ts";
import {
  loadApprovalsList,
  approveApproval,
  denyApproval,
  whitelistSessionApprovals,
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
  handleModelsPatchModel,
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
  handleModelsDeleteProvider,
} from "./app-models.ts";
import { generateUUID } from "./uuid.ts";
import {
  fetchEduCategories,
  fetchEmployeeDetail,
  fetchEmployees,
  fetchMcpDetail,
  fetchMcps,
  fetchSkillDetail,
  fetchSkills,
} from "./controllers/remote-market.ts";

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
  const isChat = state.tab === "chat" || state.tab === "message";
  const chatFocus = isChat && (state.settings.chatFocusMode || state.onboarding);
  const showThinking = state.onboarding ? false : state.settings.chatShowThinking;
  const assistantAvatarUrl = resolveAssistantAvatarUrl(state);
  const chatAvatarUrl = state.chatAvatarUrl ?? assistantAvatarUrl ?? null;
  const configValue =
    state.configForm ?? (state.configSnapshot?.config as Record<string, unknown> | null);
  // 列表始终使用已保存的数据 (configSnapshot)，避免显示未保存的修改
  const modelProviders =
    (state.configSnapshot?.config as { models?: { providers?: Record<string, import("./views/models.ts").ModelProvider> } } | undefined)?.models?.providers ?? {};
  const modelEnv =
    (state.configForm?.env as { modelEnv?: Record<string, Record<string, string>> })?.modelEnv ?? {};
  // 列表中的默认模型标识也使用 configSnapshot，保持数据源一致
  const defaultModelRef = resolveDefaultModelRef(state.configSnapshot?.config as Record<string, unknown> | null | undefined);
  const basePath = normalizeBasePath(state.basePath ?? "");
  const isScheduledTasks =
    state.tab === "scheduledTasks" || state.tab === "cronHistory" || state.tab === "cron";
  const isMessagePage = state.tab === "message";
  const isCatalogArea =
    state.tab === "employeeMarket" ||
    state.tab === "skillLibrary" ||
    state.tab === "toolLibrary" ||
    state.tab === "modelLibrary" ||
    state.tab === "tutorials";
  const isConfigArea =
    state.tab === "config" ||
    state.tab === "envVars" ||
    state.tab === "debug" ||
    state.tab === "logs" ||
    state.tab === "models" ||
    state.tab === "overview" ||
    state.tab === "channels" ||
    state.tab === "sessions" ||
    state.tab === "usage" ||
    state.tab === "sandbox" ||
    state.tab === "llmTrace" ||
    state.tab === "aboutUs";
  const isCollapsibleNavPage = isMessagePage || isScheduledTasks || isConfigArea;
  const isSideNavCollapsed = isCollapsibleNavPage && state.settings.navCollapsed;
  const renderNavCollapseFooter = html`
    <div class="nav__footer">
      <button
        class="nav__toggle"
        type="button"
        title=${state.settings.navCollapsed ? "展开侧栏" : "收起侧栏"}
        aria-label=${state.settings.navCollapsed ? "展开侧栏" : "收起侧栏"}
        aria-expanded=${String(!state.settings.navCollapsed)}
        @click=${() =>
          state.applySettings({
            ...state.settings,
            navCollapsed: !state.settings.navCollapsed,
          })}
      >
        <span
          class="nav__toggle-icon ${state.settings.navCollapsed
            ? "nav__toggle-icon--expand"
            : "nav__toggle-icon--collapse"}"
          aria-hidden="true"
        >
          ${icons.menu}
        </span>
      </button>
    </div>
  `;
  const shellClasses = [
    "shell",
    isChat ? "shell--chat" : "",
    isCatalogArea ? "shell--catalog" : "",
    state.tab === "tutorials" ? "shell--tutorials" : "",
    chatFocus ? "shell--chat-focus" : "",
    isSideNavCollapsed ? "shell--nav-collapsed" : "",
    state.onboarding ? "shell--onboarding" : "",
    state.isWindowsDesktop ? "shell--windows-desktop" : "",
    state.isWindowMaximised ? "shell--window-maximised" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return html`
    <div class="${shellClasses}">
      <header class="topbar">
        ${
          state.approvalBannerVisible
            ? html`
                <div class="approval-banner" role="status">
                  <span class="approval-banner__icon" aria-hidden="true">${icons.zap}</span>
                  <span class="approval-banner__text">
                    有
                    ${state.approvalBannerPendingCount}
                    条敏感命令待人工审批
                  </span>
                  <button
                    type="button"
                    class="btn btn--sm approval-banner__action"
                    @click=${() => state.setTab("sandbox")}
                  >
                    去处理
                  </button>
                  <button
                    type="button"
                    class="btn btn--icon approval-banner__close"
                    aria-label="关闭提示"
                    title="关闭（仍有新待审批时会再次提示）"
                    @click=${() => state.dismissApprovalBanner()}
                  >
                    ${icons.x}
                  </button>
                </div>
              `
            : nothing
        }
        <div class="topbar__main" @dblclick=${(event: MouseEvent) => state.handleTopbarDoubleClick(event)}>
        <div class="topbar-left">
          <div class="brand">
            <div class="brand-logo">
              <img
                src=${basePath ? `${basePath}/logo_h.png` : "/logo_h.png"}
                alt="OpenOcta"
              />
            </div>
          </div>
          <span class="topbar-version">${state.configSchemaVersion ?? "---"}</span>
        </div>
        <nav class="top-tabs" aria-label="Primary navigation">
          ${[
            { tab: "message", label: "消息" },
            { tab: "scheduledTasks", label: "定时任务" },
            { tab: "employeeMarket", label: "员工市场" },
            { tab: "skillLibrary", label: "技能库" },
            { tab: "toolLibrary", label: "工具库" },
            { tab: "modelLibrary", label: "模型" },
            { tab: "tutorials", label: "教程" },
            { tab: "config", label: "配置" },
          ].map((item) => {
            const tab = (item as any).tab;
            const active =
              tab === "scheduledTasks"
                ? isScheduledTasks
                : tab === "config"
                  ? isConfigArea
                  : Boolean(tab && state.tab === tab && !(item as any).href);
            const iconName = tab ? iconForTab(tab, active) : "globe";
            const iconEl = html`<span class="nav-item__icon" aria-hidden="true">${icons[iconName]}</span>`;
            if ((item as any).href) {
              const extHref = String((item as any).href);
              return html`
                <button
                  type="button"
                  class="top-tab top-tab--link topbar__no-drag"
                  @click=${() =>
                    void openExternalUrl(extHref, {
                      gatewayHost: state.settings.gatewayUrl,
                      gatewayToken: state.settings.token,
                    })}
                >
                  ${iconEl}
                  <span class="top-tab__label">${(item as any).label}</span>
                </button>
              `;
            }
            return html`
              <button
                class="top-tab topbar__no-drag ${active ? "top-tab--active" : ""}"
                @click=${() => state.setTab((tab === "config" ? "overview" : tab)!)}
                type="button"
              >
                ${iconEl}
                <span class="top-tab__label">${(item as any).label}</span>
              </button>
            `;
          })}
        </nav>
        <div class="topbar-status">
          <div class="pill pill--link topbar__no-drag">
            <button
              type="button"
              title="打开 GitHub 仓库"
              class="topbar-link topbar__no-drag"
              @click=${() =>
                void openExternalUrl("https://github.com/openocta/openocta.git", {
                  gatewayHost: state.settings.gatewayUrl,
                  gatewayToken: state.settings.token,
                })}
            >
              <span class="topbar-link__icon" aria-hidden="true">${icons.github}</span>
              <span class="topbar-link__label">GitHub</span>
            </button>
          </div>
        </div>
        ${
          state.isWindowsDesktop
            ? html`
                <div class="window-controls topbar__no-drag" aria-label="窗口控制">
                  <button
                    type="button"
                    class="window-control"
                    aria-label="最小化窗口"
                    title="最小化"
                    @click=${() => state.handleWindowMinimise()}
                  >
                    ${icons.windowMinimise}
                  </button>
                  <button
                    type="button"
                    class="window-control"
                    aria-label=${state.isWindowMaximised ? "还原窗口" : "最大化窗口"}
                    title=${state.isWindowMaximised ? "还原" : "最大化"}
                    @click=${() => state.handleWindowToggleMaximise()}
                  >
                    ${state.isWindowMaximised ? icons.windowRestore : icons.windowMaximise}
                  </button>
                  <button
                    type="button"
                    class="window-control window-control--close"
                    aria-label="关闭窗口"
                    title="关闭"
                    @click=${() => state.handleWindowClose()}
                  >
                    ${icons.windowClose}
                  </button>
                </div>
              `
            : nothing
        }
        </div>
      </header>
      ${state.tab === "tutorials"
        ? nothing
        : html`<aside
            class="nav ${isCatalogArea ? "nav--catalog" : ""} ${isMessagePage ? "nav--massage" : ""} ${isScheduledTasks || isConfigArea ? "nav--grouped" : ""} ${isSideNavCollapsed ? "nav--collapsed" : ""}"
            @scroll=${() => {
              if (state.sessionOverflow) {
                state.sessionOverflow = null;
              }
            }}
          >
        ${
          isMessagePage
            ? html`
                <div class="session-sidebar">
                  <div class="session-search">
                    <span class="input">
                      <input
                        class="session-search__input"
                        type="search"
                        autocomplete="off"
                        spellcheck="false"
                        placeholder="搜索名称、标签或预览…"
                        aria-label="搜索会话"
                        .value=${state.sessionSidebarQuery}
                        @input=${(e: Event) => {
                          state.sessionSidebarQuery = (e.target as HTMLInputElement).value;
                        }}
                      />
                    </span>
                    <span class="session-search__icon" aria-hidden="true">${icons.search}</span>
                  </div>
                  <button
                    class="session-new btn primary"
                    type="button"
                    @click=${async () => {
                      const res = await createSession(state);
                      if (res?.key) {
                        state.sessionKey = res.key;
                        state.chatMessage = "";
                        state.chatAttachments = [];
                        state.chatModelRef = null;
                        state.chatStream = null;
                        state.chatStreamStartedAt = null;
                        state.chatRunId = null;
                        state.chatQueue = [];
                        state.resetToolStream();
                        state.resetChatScroll();
                        state.applySettings({
                          ...state.settings,
                          sessionKey: res.key,
                          lastActiveSessionKey: res.key,
                        });
                        void state.loadAssistantIdentity();
                        await Promise.all([loadChatHistory(state), refreshChatAvatar(state)]);
                        /* 仅展示默认空页面，不自动发送问候；用户输入并发送后再开始会话 */
                      }
                    }}
                  >
                    <span class="session-new__icon" aria-hidden="true">${icons.plus}</span>
                    <span>新消息</span>
                  </button>

                  <div class="session-list">
                    ${
                      (() => {
                        const q = state.sessionSidebarQuery;
                        const rows = (state.sessionsResult?.sessions ?? []).map((s) => {
                          const row = s as Record<string, unknown>;
                          const key = (row.key ?? row.sessionId ?? "") as string;
                          const isCustom = key.toLowerCase().startsWith("custom:");
                          const employeeId = isCustom ? null : extractEmployeeIdFromSessionKey(key);
                          const emp = employeeId
                            ? state.digitalEmployees?.find((e) => e.id === employeeId)
                            : null;
                          const origin = row.origin as Record<string, string> | undefined;
                          const displayName =
                            emp?.name ||
                            (origin &&
                              ((origin.label || origin.from || origin.to) as string)) ||
                            (row.label as string | undefined) ||
                            (row.displayName as string | undefined) ||
                            (row.sessionId as string | undefined) ||
                            key ||
                            "会话";
                          const subtitle =
                            (row.lastMessagePreview as string | undefined)?.trim() || "";
                          const haystack = buildSessionSidebarSearchHaystack(
                            row,
                            key,
                            displayName,
                            subtitle,
                          );
                          const kind = typeof row.kind === "string" ? row.kind : "";
                          const labelDraft = typeof row.label === "string" ? row.label : "";
                          return {
                            key,
                            isCustom,
                            emp,
                            displayName,
                            subtitle,
                            haystack,
                            kind,
                            labelDraft,
                          };
                        });
                        const filtered = q.trim()
                          ? rows.filter((r) => sessionSidebarHaystackMatches(r.haystack, q))
                          : rows;
                        return filtered.map(
                          ({ key, isCustom, emp, displayName, subtitle, kind, labelDraft }) => {
                            const active = key && state.sessionKey === key;
                            const canEdit = isCustom;
                            const isEditing = state.sessionEditingKey === key;
                            const isGlobal = kind === "global";
                            const isMainSession = key === "agent.main.main";
                            const saveEdit = async (newLabel: string) => {
                              if (!key) {
                                state.sessionEditingKey = null;
                                return;
                              }
                              await patchSession(state, key, { label: newLabel.trim() || null });
                              state.sessionEditingKey = null;
                            };
                            return html`
                          <div
                            class="session-item ${active ? "session-item--active" : ""} ${canEdit ? "session-item--editable" : ""}"
                            role="button"
                            tabindex="0"
                            @click=${async (e: Event) => {
                              const target = e.target as HTMLElement;
                              if (
                                target.closest(".session-item__overflow") ||
                                target.closest(".session-item__edit") ||
                                target.closest("input")
                              ) {
                                return;
                              }
                              state.sessionOverflow = null;
                              if (!key) return;
                              state.sessionKey = key;
                              state.chatMessage = "";
                              state.chatAttachments = [];
                              state.chatModelRef = null;
                              state.chatStream = null;
                              state.chatStreamStartedAt = null;
                              state.chatRunId = null;
                              state.chatQueue = [];
                              state.resetToolStream();
                              state.resetChatScroll();
                              state.applySettings({
                                ...state.settings,
                                sessionKey: key,
                                lastActiveSessionKey: key,
                              });
                              syncUrlWithSessionKey(state, key, true);
                              await Promise.all([loadChatHistory(state), refreshChatAvatar(state)]);
                            }}
                            @dblclick=${(e: Event) => {
                              if (!canEdit) return;
                              e.stopPropagation();
                              state.sessionEditingKey = key;
                            }}
                            @keydown=${(e: KeyboardEvent) => {
                              if (e.key === "Enter" && !isEditing) {
                                e.preventDefault();
                                (e.currentTarget as HTMLElement).click();
                              }
                            }}
                          >
                            <span class="session-item__icon" aria-hidden="true">
                              ${emp
                                ? html`<span class="session-item__icon-emp">${(emp as any).name?.slice(0, 1) || "?"}</span>`
                                : html`<span class="session-item__icon-default">${icons.chatBubble}</span>`}
                            </span>
                            <div class="session-item__body">
                              ${isEditing
                                ? html`
                                    <span class="input"><input
                                      class="session-item__input"
                                      type="text"
                                      .value=${labelDraft}
                                      @blur=${(e: Event) => saveEdit((e.target as HTMLInputElement).value)}
                                      @keydown=${(e: KeyboardEvent) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          saveEdit((e.target as HTMLInputElement).value);
                                        }
                                        if (e.key === "Escape") {
                                          state.sessionEditingKey = null;
                                        }
                                      }}
                                      @click=${(e: Event) => e.stopPropagation()}
                                    /></span>
                                  `
                                : html`<span class="session-item__text">${displayName}</span>`}
                              ${!isEditing && subtitle ? html`<span class="session-item__sub muted">${subtitle}</span>` : nothing}
                            </div>
                            ${
                              !isGlobal
                                ? html`
                                    <div class="session-item__overflow">
                                      <button
                                        type="button"
                                        class="btn small session-item__overflow-btn"
                                        aria-label="会话操作"
                                        aria-haspopup="menu"
                                        aria-expanded=${state.sessionOverflow?.key === key ? "true" : "false"}
                                        @click=${(e: Event) => {
                                          e.stopPropagation();
                                          const btn = e.currentTarget as HTMLElement;
                                          const r = btn.getBoundingClientRect();
                                          const pos = positionSessionOverflowFromButtonRect(r);
                                          if (state.sessionOverflow?.key === key) {
                                            state.sessionOverflow = null;
                                          } else {
                                            state.sessionOverflow = { key, ...pos };
                                          }
                                        }}
                                      >
                                        ${icons.moreHorizontal}
                                      </button>
                                    </div>
                                  `
                                : nothing
                            }
                          </div>
                        `;
                          },
                        );
                      })()
                    }
                  </div>
                </div>
                <div class="nav--massage__footer">
                  <button
                    class="session-sidebar__toggle"
                    type="button"
                    title=${state.settings.navCollapsed ? "展开侧栏" : "收起侧栏"}
                    aria-label=${state.settings.navCollapsed ? "展开侧栏" : "收起侧栏"}
                    aria-expanded=${String(!state.settings.navCollapsed)}
                    @click=${() =>
                      state.applySettings({
                        ...state.settings,
                        navCollapsed: !state.settings.navCollapsed,
                      })}
                  >
                    <span
                      class="session-sidebar__toggle-icon ${state.settings.navCollapsed
                        ? "session-sidebar__toggle-icon--expand"
                        : "session-sidebar__toggle-icon--collapse"}"
                      aria-hidden="true"
                    >
                      ${icons.menu}
                    </span>
                  </button>
                </div>
              `
            : isScheduledTasks
              ? html`
                  <div class="nav-group-list">
                    <div class="nav-group">
                      <button class="nav-label nav-label--static" type="button">
                        <span class="nav-label__text">定时任务</span>
                      </button>
                      <div class="nav-group__items">
                        ${renderTab(state, "scheduledTasks")}
                        ${renderTab(state, "cronHistory")}
                      </div>
                    </div>
                  </div>
                  ${renderNavCollapseFooter}
                `
              : isConfigArea
                ? html`
                    <div class="nav-group-list">
                      <div class="nav-group">
                        <button class="nav-label nav-label--static" type="button">
                          <span class="nav-label__text">控制</span>
                        </button>
                        <div class="nav-group__items">
                          ${renderTab(state, "overview")}
                          ${renderTab(state, "channels")}
                          ${renderTab(state, "sessions")}
                          ${renderTab(state, "usage")}
                        </div>
                      </div>
                      <div class="nav-group">
                        <button class="nav-label nav-label--static" type="button">
                          <span class="nav-label__text">Agent</span>
                        </button>
                        <div class="nav-group__items">
                          ${renderTab(state, "sandbox")}
                          ${renderTab(state, "llmTrace")}
                        </div>
                      </div>
                      <div class="nav-group">
                        <button class="nav-label nav-label--static" type="button">
                          <span class="nav-label__text">配置</span>
                        </button>
                        <div class="nav-group__items">
                          ${renderTab(state, "config")}
                          ${renderTab(state, "envVars")}
                          ${renderTab(state, "logs")}
                        </div>
                      </div>
                      <div class="nav-group">
                        <button class="nav-label nav-label--static" type="button">
                          <span class="nav-label__text">资源</span>
                        </button>
                        <div class="nav-group__items">
                          <button
                            type="button"
                            class="nav-item"
                            title="打开在线文档"
                            @click=${() =>
                              void openExternalUrl("https://databuff.yuque.com/org-wiki-databuff-spr8e6/lqn7on", {
                                gatewayHost: state.settings.gatewayUrl,
                                gatewayToken: state.settings.token,
                              })}
                          >
                            <span class="nav-item__icon" aria-hidden="true">${icons.documentation}</span>
                            <span class="nav-item__text">在线文档</span>
                          </button>
                          ${renderTab(state, "aboutUs")}
                        </div>
                      </div>
                    </div>
                    ${renderNavCollapseFooter}
                  `
              : state.tab === "employeeMarket"
                ? html`
                    <div class="nav-group">
                      <div class="nav-group__items">
                        <category-tree-sidebar
                          scope="employee"
                          .items=${state.employeeMarketItems}
                          .selectedCategory=${state.employeeMarketCategory || "__all__"}
                          .keyword=${state.employeeMarketQuery}
                          .gatewayHost=${state.settings?.gatewayUrl?.trim()}
                          .token=${state.settings?.token?.trim()}
                          ?disabled=${state.employeeMarketLoading}
                          @category-select=${(e: CustomEvent) => { state.employeeMarketCategory = e.detail.name; state.employeeMarketCategoryDescendants = e.detail.descendantNames ?? []; }}
                        ></category-tree-sidebar>
                      </div>
                    </div>
                  `
                : state.tab === "skillLibrary"
                  ? html`
                      <div class="nav-group">
                        <div class="nav-group__items">
                          <category-tree-sidebar
                            scope="skill"
                            .items=${state.skillLibraryItems}
                            .selectedCategory=${state.skillLibraryCategory || "__all__"}
                            .keyword=${state.skillLibraryQuery}
                            .gatewayHost=${state.settings?.gatewayUrl?.trim()}
                            .token=${state.settings?.token?.trim()}
                            ?disabled=${state.skillLibraryLoading}
                            @category-select=${(e: CustomEvent) => { state.skillLibraryCategory = e.detail.name; state.skillLibraryCategoryDescendants = e.detail.descendantNames ?? []; }}
                          ></category-tree-sidebar>
                        </div>
                      </div>
                    `
                  : state.tab === "toolLibrary"
                    ? html`
                        <div class="nav-group">
                          <div class="nav-group__items">
                            <category-tree-sidebar
                              scope="tool"
                              .items=${state.toolLibraryItems}
                              .selectedCategory=${state.toolLibraryCategory || "__all__"}
                              .keyword=${state.toolLibraryQuery}
                              .gatewayHost=${state.settings?.gatewayUrl?.trim()}
                              .token=${state.settings?.token?.trim()}
                              ?disabled=${state.toolLibraryLoading}
                              @category-select=${(e: CustomEvent) => { state.toolLibraryCategory = e.detail.name; state.toolLibraryCategoryDescendants = e.detail.descendantNames ?? []; }}
                            ></category-tree-sidebar>
                          </div>
                        </div>
                      `
                    : state.tab === "modelLibrary"
                      ? (() => {
                          const { orderedCategories, counts } = computeModelLibraryCategories(
                            modelProviders,
                            state.modelsProviderSearchQuery,
                          );
                          const effectiveCategory = state.modelLibraryCategory ?? "__all__";
                          return html`
                            <div class="nav-group">
                              <div class="nav-group__items">
                                <div class="emp-categories">
                                  ${orderedCategories.map((catKey) => {
                                    const label =
                                      catKey === "__all__"
                                        ? "全部"
                                        : catKey === "public"
                                          ? "公有模型"
                                          : "本地模型";
                                    const active = effectiveCategory === catKey;
                                    const count = counts.get(catKey) ?? 0;
                                    return html`
                                      <button
                                        class="emp-cat ${active ? "active" : ""}"
                                        type="button"
                                        ?disabled=${state.configLoading}
                                        @click=${() => (state.modelLibraryCategory = catKey)}
                                      >
                                        <span class="emp-cat__name">${label}</span>
                                        <span class="emp-cat__count">${count}</span>
                                      </button>
                                    `;
                                  })}
                                </div>
                              </div>
                            </div>
                          `;
                        })()
                    : state.tab === "tutorials"
                      ? html`<div class="nav-empty"></div>`
                      : html`<div class="nav-empty"></div>`
        }
      </aside>`}
      <main class="content ${isChat ? "content--chat" : ""} ${isCatalogArea ? "content--catalog" : ""} ${state.tab === "tutorials" ? "content--tutorials" : ""} ${state.tab === "llmTrace" && state.llmTraceViewingSessionId != null ? "content--llm-trace-detail" : ""}">
        ${isCatalogArea || isMessagePage
          ? nothing
          : html`
              <section class="content-header">
                <div>
                  <div class="page-title">${titleForTab(state.tab)}</div>
                  ${
                    state.tab === "cron" || state.tab === "scheduledTasks"
                      ? html`<div class="page-summary">网关中所有已调度任务</div>`
                      : state.tab === "cronHistory"
                        ? html`<div class="page-summary">选择任务以查看运行历史</div>`
                      : nothing
                  }
                </div>
                <div class="page-meta">
                  ${
                    state.tab === "cron" || state.tab === "scheduledTasks"
                      ? html`
                          <button class="btn" ?disabled=${state.cronLoading} @click=${() => state.loadCron()}>
                            ${state.cronLoading ? t("commonRefreshing") : t("commonRefresh")}
                          </button>
                          <button class="btn primary" @click=${() => (state.cronAddModalOpen = true)}>
                            新建任务
                          </button>
                        `
                      : nothing
                  }
                  ${state.lastError ? html`<div class="pill danger">${state.lastError}</div>` : nothing}
                  ${isChat ? renderChatControls(state) : nothing}
                </div>
              </section>
            `}

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
                  state.chatAttachments = [];
                  state.chatModelRef = null;
                  state.chatStream = null;
                  state.chatStreamStartedAt = null;
                  state.chatRunId = null;
                  state.chatQueue = [];
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
                digitalEmployees: state.digitalEmployees,
                digitalEmployeesLoading: state.digitalEmployeesLoading,
                whatsappMessage: state.whatsappLoginMessage,
                whatsappQrDataUrl: state.whatsappLoginQrDataUrl,
                whatsappConnected: state.whatsappLoginConnected,
                whatsappBusy: state.whatsappBusy,
                weworkQrModalOpen: state.weworkQrModalOpen,
                weworkQrModalLoading: state.weworkQrModalLoading,
                weworkQrModalPolling: state.weworkQrModalPolling,
                weworkQrModalSuccess: state.weworkQrModalSuccess,
                weworkQrModalError: state.weworkQrModalError,
                weworkQrModalReplaceWarn: state.weworkQrModalReplaceWarn,
                weworkQrModalAuthUrl: state.weworkQrModalAuthUrl,
                weworkQrModalGenPageUrl: state.weworkQrModalGenPageUrl,
                weixinQrModalOpen: state.weixinQrModalOpen,
                weixinQrModalLoading: state.weixinQrModalLoading,
                weixinQrModalPolling: state.weixinQrModalPolling,
                weixinQrModalSuccess: state.weixinQrModalSuccess,
                weixinQrModalError: state.weixinQrModalError,
                weixinQrModalReplaceWarn: state.weixinQrModalReplaceWarn,
                weixinQrModalImageSrc: state.weixinQrModalImageSrc,
                weixinQrModalScanPageUrl: state.weixinQrModalScanPageUrl,
                weixinQrModalScanned: state.weixinQrModalScanned,
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
                  // 进入渠道配置面板时，确保数字员工列表已加载（避免误判“已删除”）。
                  if (channelId && !state.digitalEmployeesLoading && (state.digitalEmployees?.length ?? 0) === 0) {
                    void loadDigitalEmployees(state);
                  }
                },
                onWhatsAppStart: (force) => state.handleWhatsAppStart(force),
                onWhatsAppWait: () => state.handleWhatsAppWait(),
                onWhatsAppLogout: () => state.handleWhatsAppLogout(),
                onWeWorkQrStart: () => state.handleWeWorkQrStart(),
                onWeWorkQrModalClose: () => state.handleWeWorkQrModalClose(),
                onWeixinQrStart: () => state.handleWeixinQrStart(),
                onWeixinQrModalClose: () => state.handleWeixinQrModalClose(),
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
                onRefresh: () => loadSessions(state, { includeLastMessage: true }),
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
          state.tab === "cron" || state.tab === "scheduledTasks"
            ? renderCronConfig({
                basePath: state.basePath,
                loading: state.cronLoading,
                status: state.cronStatus,
                jobs: state.cronJobs,
                error: state.cronError,
                busy: state.cronBusy,
                form: state.cronForm,
                addModalOpen: state.cronAddModalOpen,
                editModalOpen: state.cronEditModalOpen,
                editJobId: state.cronEditJobId,
                digitalEmployees: state.digitalEmployees,
                digitalEmployeesLoading: state.digitalEmployeesLoading,
                channels: state.channelsSnapshot?.channelMeta?.length
                  ? state.channelsSnapshot.channelMeta.map((entry) => entry.id)
                  : (state.channelsSnapshot?.channelOrder ?? []),
                channelLabels: state.channelsSnapshot?.channelLabels ?? {},
                channelMeta: state.channelsSnapshot?.channelMeta ?? [],
                runsJobId: state.cronRunsJobId,
                runs: state.cronRuns,
                onFormChange: (patch) => (state.cronForm = { ...state.cronForm, ...patch }),
                onRefresh: () => state.loadCron(),
                onOpenAddModal: () => (state.cronAddModalOpen = true),
                onCloseAddModal: () => (state.cronAddModalOpen = false),
                onOpenEditModal: (job) => {
                  state.cronForm = cronFormFromJob(job, state.cronForm);
                  state.cronEditJobId = job.id;
                  state.cronEditModalOpen = true;
                  // 进入编辑时，兜底确保数字员工列表已加载（避免误判“已删除”）。
                  if (!state.digitalEmployeesLoading) {
                    void loadDigitalEmployees(state);
                  }
                },
                onCloseEditModal: () => {
                  state.cronEditModalOpen = false;
                  state.cronEditJobId = null;
                },
                onAdd: async () => {
                  await addCronJob(state);
                  if (!state.cronError) {
                    state.cronAddModalOpen = false;
                  }
                },
                onUpdate: async (jobId) => {
                  await updateCronJob(state, jobId);
                  if (!state.cronError) {
                    state.cronEditModalOpen = false;
                    state.cronEditJobId = null;
                  }
                },
                onToggle: (job, enabled) => toggleCronJob(state, job, enabled),
                onRun: (job) => runCronJob(state, job),
                onRemove: (job) => removeCronJob(state, job),
                confirmRemove: state.tab === "scheduledTasks",
                onLoadRuns: (jobId) => loadCronRuns(state, jobId),
                onShowHistory: (jobId) => {
                  state.setTab("cronHistory");
                  void loadCronRuns(state, jobId);
                },
              })
            : nothing
        }

        ${
          state.tab === "cronHistory"
            ? renderCronHistory({
                basePath: state.basePath,
                loading: state.cronLoading,
                status: state.cronStatus,
                jobs: state.cronJobs,
                error: state.cronError,
                busy: state.cronBusy,
                form: state.cronForm,
                digitalEmployees: state.digitalEmployees,
                digitalEmployeesLoading: state.digitalEmployeesLoading,
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
                confirmRemove: true,
                onLoadRuns: (jobId) => loadCronRuns(state, jobId),
                onShowHistory: (jobId) => {
                  state.setTab("cronHistory");
                  void loadCronRuns(state, jobId);
                },
              })
            : nothing
        }

        ${
          state.tab === "employeeMarket"
            ? (() => {
                const onRefresh = async () => {
                  state.employeeMarketLoading = true;
                  state.employeeMarketError = null;
                  try {
                    state.employeeMarketItems = await fetchEmployees(
                      { q: state.employeeMarketQuery },
                      { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                    );
                    // 从 API 响应（含 .install-metadata.json）推导已安装状态，刷新后仍可识别
                    const empItems = state.employeeMarketItems;
                    const empInstalled = new Set<string>();
                    const empMap: Record<string, string> = {};
                    for (const it of empItems) {
                      if (it.installed && it.localId) {
                        const rid = String(it.id);
                        if (typeof it.id !== "string" || !rid.startsWith("local:")) {
                          empInstalled.add(rid);
                          empMap[rid] = it.localId;
                        }
                      }
                    }
                    state.employeeMarketInstalledRemoteIds = empInstalled;
                    state.employeeMarketRemoteToLocal = empMap;
                  } catch (err) {
                    state.employeeMarketError = (err as any)?.message
                      ? String((err as any).message)
                      : String(err);
                  } finally {
                    state.employeeMarketLoading = false;
                  }
                };

                // Auto-load once when entering the page.
                if (!state.employeeMarketLoadedOnce && !state.employeeMarketLoading) {
                  state.employeeMarketLoadedOnce = true;
                  queueMicrotask(() => void onRefresh());
                }

                return renderEmployeeMarket({
                loading: state.employeeMarketLoading,
                error: state.employeeMarketError,
                query: state.employeeMarketQuery,
                category: state.employeeMarketCategory,
                categoryDescendants: state.employeeMarketCategoryDescendants,
                items: state.employeeMarketItems,
                selectedId: state.employeeMarketSelectedId,
                selectedDetail: state.employeeMarketSelectedDetail,
                onQueryChange: (next) => (state.employeeMarketQuery = next),
                onCategoryChange: (next) => (state.employeeMarketCategory = next),
                onRefresh: async () => {
                    await onRefresh();
                },
                onSelect: async (id) => {
                  state.employeeMarketSelectedId = id;
                  state.employeeMarketSelectedDetail = null;
                  state.employeeMarketError = null;
                  try {
                    state.employeeMarketSelectedDetail = await fetchEmployeeDetail(id, {
                      gatewayHost: state.settings?.gatewayUrl?.trim(),
                      token: state.settings?.token?.trim(),
                    });
                  } catch (err) {
                    state.employeeMarketError = (err as any)?.message ? String((err as any).message) : String(err);
                  }
                },
                onDetailClose: () => {
                  state.employeeMarketSelectedId = null;
                  state.employeeMarketSelectedDetail = null;
                },
                onAdd: () => {
                  state.digitalEmployeeCreateModalOpen = true;
                  state.digitalEmployeeAdvancedOpen = false;
                  state.digitalEmployeeCreateMcpMode = "builder";
                  state.digitalEmployeeCreateMcpJson = "";
                  state.digitalEmployeeCreateMcpItems = [];
                  state.digitalEmployeeSkillUploadName = "";
                  state.digitalEmployeeSkillUploadFiles = [];
                  state.digitalEmployeeSkillUploadError = null;
                },
                onInstall: async (id, category) => {
                  const remoteId = String(id);
                  state.employeeMarketInstallingId = remoteId;
                  state.employeeMarketError = null;
                  try {
                    const res = await installFromSite(
                      {
                        kind: "employee",
                        id: remoteId,
                        type: category ?? undefined,
                        category: category ?? undefined,
                      },
                      { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                    );
                    state.employeeMarketInstalledRemoteIds = new Set([
                      ...state.employeeMarketInstalledRemoteIds,
                      remoteId,
                    ]);
                    if (res?.id) {
                      state.employeeMarketRemoteToLocal = {
                        ...state.employeeMarketRemoteToLocal,
                        [remoteId]: res.id,
                      };
                    }
                    await onRefresh();
                  } catch (err) {
                    state.employeeMarketError = (err as Error)?.message ?? String(err);
                  } finally {
                    state.employeeMarketInstallingId = null;
                  }
                },
                onDelete: async (localId) => {
                  state.employeeMarketError = null;
                  state.digitalEmployeesError = null;
                  await deleteDigitalEmployee(state, localId);
                  if (state.digitalEmployeesError) {
                    state.employeeMarketError = state.digitalEmployeesError;
                  } else {
                    const ridsToRemove = Object.entries(state.employeeMarketRemoteToLocal)
                      .filter(([, lid]) => lid === localId)
                      .map(([rid]) => rid);
                    const next = { ...state.employeeMarketRemoteToLocal };
                    for (const rid of ridsToRemove) delete next[rid];
                    state.employeeMarketRemoteToLocal = next;
                    state.employeeMarketInstalledRemoteIds = new Set(
                      [...state.employeeMarketInstalledRemoteIds].filter(
                        (rid) => !ridsToRemove.includes(rid),
                      ),
                    );
                    await onRefresh();
                    state.employeeMarketSelectedId = null;
                    state.employeeMarketSelectedDetail = null;
                  }
                },
                onOpenEmployee: async (employeeId) => {
                  await openDigitalEmployeeWebchat(state, employeeId);
                },
                onEdit: async (localId) => {
                  const emp = state.digitalEmployees.find((e) => e.id === localId);
                  const manifest = await getDigitalEmployee(state, localId);
                  if (!manifest) {
                    state.employeeMarketError = "无法加载员工详情";
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
                        draft: isForm ? (v as any) : { enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } },
                        rawJson: isObj ? JSON.stringify(v, null, 2) : JSON.stringify({ enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } }, null, 2),
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
                installedIds: new Set(
                  state.employeeMarketItems
                    .filter((it) => typeof it.id === "string" && String(it.id).startsWith("local:"))
                    .map((it) => String(it.id)),
                ),
                installedRemoteIds: state.employeeMarketInstalledRemoteIds,
                remoteToLocalMap: state.employeeMarketRemoteToLocal,
                installingId: state.employeeMarketInstallingId,
                });
              })()
            : nothing
        }

        ${state.tab === "employeeMarket" && state.digitalEmployeeCreateModalOpen
          ? (() => {
              const onRefreshEmp = async () => {
                state.employeeMarketLoading = true;
                state.employeeMarketError = null;
                try {
                  state.employeeMarketItems = await fetchEmployees(
                    { q: state.employeeMarketQuery },
                    { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                  );
                } catch (err) {
                  state.employeeMarketError = (err as any)?.message ? String((err as any).message) : String(err);
                } finally {
                  state.employeeMarketLoading = false;
                }
              };
              return renderDigitalEmployeeCreateModal({
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
                skillUploadName: state.digitalEmployeeSkillUploadName,
                skillUploadFiles: state.digitalEmployeeSkillUploadFiles ?? [],
                skillUploadError: state.digitalEmployeeSkillUploadError,
                onMcpJsonChange: (v) => (state.digitalEmployeeCreateMcpJson = v),
                onMcpModeChange: (m) => (state.digitalEmployeeCreateMcpMode = m),
                onMcpAddItem: () => {
                  const next = state.digitalEmployeeCreateMcpItems ?? [];
                  state.digitalEmployeeCreateMcpItems = [
                    ...next,
                    {
                      id: generateUUID(),
                      key: "",
                      editMode: "form",
                      connectionType: "stdio",
                      draft: { enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } },
                      rawJson: JSON.stringify({ enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } }, null, 2),
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
                onCreateNameChange: (v) => (state.digitalEmployeeCreateName = v),
                onCreateDescriptionChange: (v) => (state.digitalEmployeeCreateDescription = v),
                onCreatePromptChange: (v) => (state.digitalEmployeeCreatePrompt = v),
                onToggleAdvanced: () => (state.digitalEmployeeAdvancedOpen = !state.digitalEmployeeAdvancedOpen),
                onSkillUploadNameChange: (v) => (state.digitalEmployeeSkillUploadName = v),
                onSkillUploadFilesChange: (f) => (state.digitalEmployeeSkillUploadFiles = f ?? []),
                onCreateSubmit: async () => {
                  if (state.digitalEmployeeCreateMcpMode === "builder") {
                    const items = state.digitalEmployeeCreateMcpItems ?? [];
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
                    void onRefreshEmp();
                  }
                },
              });
            })()
          : nothing}

        ${
          state.tab === "skillLibrary"
            ? (() => {
                const onRefresh = async () => {
                  state.skillLibraryLoading = true;
                  state.skillLibraryError = null;
                  try {
                    const status =
                      state.skillLibraryStatus && state.skillLibraryStatus !== "__all__"
                        ? state.skillLibraryStatus
                        : undefined;
                    state.skillLibraryItems = await fetchSkills(
                      { q: state.skillLibraryQuery, status },
                      { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                    );
                    await loadSkills(state);
                  } catch (err) {
                    state.skillLibraryError = (err as any)?.message ? String((err as any).message) : String(err);
                  } finally {
                    state.skillLibraryLoading = false;
                  }
                };

                if (!state.skillLibraryLoadedOnce && !state.skillLibraryLoading) {
                  state.skillLibraryLoadedOnce = true;
                  queueMicrotask(() => void onRefresh());
                }

                return renderSkillLibrary({
                loading: state.skillLibraryLoading,
                error: state.skillLibraryError,
                installSuccess: state.skillLibraryInstallSuccess,
                gatewayHost: state.settings?.gatewayUrl?.trim(),
                query: state.skillLibraryQuery,
                selectedCategory: state.skillLibraryCategory,
                selectedCategoryDescendants: state.skillLibraryCategoryDescendants,
                selectedStatus: state.skillLibraryStatus,
                items: state.skillLibraryItems,
                selectedFolder: state.skillLibrarySelectedFolder,
                selectedDetail: state.skillLibrarySelectedDetail,
                installedKeys: new Set([
                  ...(state.skillsReport?.skills ?? []).map((entry) => entry.skillKey),
                  ...(state.skillLibraryItems ?? []).filter((s) => s.installed).map((s) => s.folder),
                ]),
                disabledKeys: disabledFoldersForMarketItems(state.skillsReport, state.skillLibraryItems ?? []),
                installingFolder: state.skillLibraryInstallingFolder,
                onInstall: async (folder, category) => {
                  state.skillLibraryInstallingFolder = folder;
                  state.skillLibraryError = null;
                  state.skillLibraryInstallSuccess = null;
                  try {
                    const res = await installFromSite(
                      { kind: "skill", id: folder, type: category, category },
                      { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                    );
                    await loadSkills(state);
                    await onRefresh();
                    const id = res?.id ?? folder;
                    const cat = (res?.type ?? res?.category ?? category ?? "").trim();
                    state.skillLibraryInstallSuccess = cat ? `安装成功：${id}（${cat}）` : `安装成功：${id}`;
                    setTimeout(() => {
                      state.skillLibraryInstallSuccess = null;
                    }, 5000);
                  } catch (err) {
                    state.skillLibraryError = (err as Error)?.message ?? String(err);
                  } finally {
                    state.skillLibraryInstallingFolder = null;
                  }
                },
                onDelete: async (folder) => {
                  state.skillLibraryError = null;
                  await deleteSkill(state, resolveSkillKeyForMarketFolder(state.skillsReport, folder));
                  if (state.skillsError) {
                    state.skillLibraryError = state.skillsError;
                  } else {
                    await onRefresh();
                    state.skillLibrarySelectedFolder = null;
                    state.skillLibrarySelectedDetail = null;
                  }
                },
                onToggleEnabled: async (folder, enabled) => {
                  state.skillLibraryError = null;
                  await updateSkillEnabled(state, resolveSkillKeyForMarketFolder(state.skillsReport, folder), enabled);
                  if (state.skillsError) {
                    state.skillLibraryError = state.skillsError;
                  } else {
                    await onRefresh();
                  }
                },
                onQueryChange: (next) => (state.skillLibraryQuery = next),
                onCategoryChange: (next) => (state.skillLibraryCategory = next),
                onStatusChange: (next) => (state.skillLibraryStatus = next),
                onRefresh: async () => {
                    await onRefresh();
                },
                onSelect: async (folder) => {
                  state.skillLibrarySelectedFolder = folder || null;
                  state.skillLibrarySelectedDetail = null;
                  state.skillLibraryError = null;
                  if (!folder) return;
                  try {
                    state.skillLibrarySelectedDetail = await fetchSkillDetail(folder, {
                      gatewayHost: state.settings?.gatewayUrl?.trim(),
                      token: state.settings?.token?.trim(),
                    });
                  } catch (err) {
                    state.skillLibraryError = (err as any)?.message ? String((err as any).message) : String(err);
                  }
                },
                onDetailClose: () => {
                  state.skillLibrarySelectedFolder = null;
                  state.skillLibrarySelectedDetail = null;
                },
                addModalOpen: state.skillsAddModalOpen,
                uploadName: state.skillsUploadName,
                uploadFiles: state.skillsUploadFiles,
                uploadError: state.skillsUploadError,
                uploadTemplate: state.skillsUploadTemplate,
                uploadBusy: state.skillsUploadBusy,
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
                onUploadFilesChange: (files) => (state.skillsUploadFiles = files ?? []),
                onUploadSubmit: async () => {
                  const files = state.skillsUploadFiles ?? [];
                  const name = state.skillsUploadName?.trim() ?? "";
                  if (files.length === 0) return;
                  state.skillsUploadBusy = true;
                  state.skillsUploadError = null;
                  state.skillLibraryError = null;
                  const gatewayUrl = state.settings?.gatewayUrl?.trim();
                  if (!gatewayUrl) {
                    state.skillsUploadError = "Gateway URL 未配置";
                    state.skillsUploadBusy = false;
                    return;
                  }
                  const skillState = {
                    gatewayUrl,
                    token: state.settings?.token?.trim(),
                  } as Parameters<typeof uploadSkill>[0];
                  try {
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const skillName =
                        files.length > 1
                          ? file.name.replace(/\.(zip|md)$/i, "").replace(/[^a-zA-Z0-9_-]/g, "-")
                          : name || file.name.replace(/\.(zip|md)$/i, "").replace(/[^a-zA-Z0-9_-]/g, "-");
                      if (!skillName) {
                        state.skillsUploadError = "技能名称不能为空";
                        break;
                      }
                      const res = await uploadSkill(skillState, skillName, file);
                      if (!res.ok) {
                        state.skillsUploadError = res.error ?? "上传失败";
                        state.skillsUploadTemplate = res.template ?? null;
                        break;
                      }
                    }
                    if (!state.skillsUploadError) {
                      state.skillsAddModalOpen = false;
                      state.skillsUploadName = "";
                      state.skillsUploadFiles = [];
                      state.skillsUploadTemplate = null;
                      await loadSkills(state);
                      await onRefresh();
                    }
                  } finally {
                    state.skillsUploadBusy = false;
                  }
                },
                skillEditModalOpen: state.skillLibraryEditModalOpen,
                skillEditSkillKey: state.skillLibraryEditSkillKey,
                skillEditFiles: state.skillLibraryEditFiles,
                skillEditSelectedFile: state.skillLibraryEditSelectedFile,
                skillEditContent: state.skillLibraryEditContent,
                skillEditLoading: state.skillLibraryEditLoading,
                skillEditSaving: state.skillLibraryEditSaving,
                skillEditError: state.skillLibraryEditError,
                skillEditSyntaxError: state.skillLibraryEditSyntaxError,
                skillEditSuccessMessage: state.skillLibraryEditSuccessMessage,
                onSkillEditOpen: async (folder) => {
                  state.skillLibraryEditModalOpen = true;
                  state.skillLibraryEditSkillKey = resolveSkillKeyForMarketFolder(state.skillsReport, folder);
                  state.skillLibraryEditFiles = [];
                  state.skillLibraryEditSelectedFile = null;
                  state.skillLibraryEditContent = "";
                  state.skillLibraryEditOriginalContent = "";
                  state.skillLibraryEditLoading = true;
                  state.skillLibraryEditError = null;
                  state.skillLibraryEditSyntaxError = null;
                  const files = await listSkillFiles(state, folder);
                  const visibleFiles = files.filter((f) => !f.split("/").some((part) => part.startsWith(".")));
                  const defaultFile = visibleFiles.find((f) => f === "SKILL.md") || visibleFiles[0];
                  state.skillLibraryEditFiles = files;
                  state.skillLibraryEditLoading = false;
                  if (defaultFile) {
                    state.skillLibraryEditSelectedFile = defaultFile;
                    state.skillLibraryEditLoading = true;
                    const content = await getSkillFile(state, folder, defaultFile);
                    state.skillLibraryEditContent = content ?? "";
                    state.skillLibraryEditOriginalContent = content ?? "";
                    state.skillLibraryEditLoading = false;
                  }
                },
                onSkillEditClose: () => {
                  state.skillLibraryEditModalOpen = false;
                  state.skillLibraryEditSkillKey = null;
                  state.skillLibraryEditFiles = [];
                  state.skillLibraryEditSelectedFile = null;
                  state.skillLibraryEditContent = "";
                  state.skillLibraryEditOriginalContent = "";
                  state.skillLibraryEditError = null;
                  state.skillLibraryEditSyntaxError = null;
                  state.skillLibraryEditSuccessMessage = null;
                },
                onSkillEditFileSelect: async (path) => {
                  if (state.skillLibraryEditSaving) return;
                  state.skillLibraryEditSelectedFile = path;
                  state.skillLibraryEditLoading = true;
                  state.skillLibraryEditError = null;
                  state.skillLibraryEditSyntaxError = null;
                  const content = await getSkillFile(state, state.skillLibraryEditSkillKey!, path);
                  state.skillLibraryEditContent = content ?? "";
                  state.skillLibraryEditOriginalContent = content ?? "";
                  state.skillLibraryEditLoading = false;
                },
                onSkillEditContentChange: (content) => {
                  state.skillLibraryEditContent = content;
                  state.skillLibraryEditSyntaxError = null;
                },
                onSkillEditSave: async () => {
                  const skillKey = state.skillLibraryEditSkillKey;
                  const filePath = state.skillLibraryEditSelectedFile;
                  if (!skillKey || !filePath) return;
                  // Frontend syntax validation
                  const lowerPath = filePath.toLowerCase();
                  if (lowerPath.endsWith(".json")) {
                    try {
                      JSON.parse(state.skillLibraryEditContent);
                    } catch (e) {
                      state.skillLibraryEditSyntaxError = `JSON 语法错误: ${(e as Error).message}`;
                      return;
                    }
                  }
                  state.skillLibraryEditSaving = true;
                  state.skillLibraryEditError = null;
                  state.skillLibraryEditSyntaxError = null;
                  const ok = await saveSkillFile(state, skillKey, filePath, state.skillLibraryEditContent);
                  state.skillLibraryEditSaving = false;
                  if (ok) {
                    state.skillLibraryEditOriginalContent = state.skillLibraryEditContent;
                    await loadSkills(state);
                    await onRefresh();
                    state.skillLibraryEditSuccessMessage = "保存成功";
                    window.setTimeout(() => {
                      state.skillLibraryEditSuccessMessage = null;
                    }, 2000);
                  }
                },
                });
              })()
            : nothing
        }

        ${
          state.tab === "toolLibrary"
            ? (() => {
                const onRefresh = async () => {
                  state.toolLibraryLoading = true;
                  state.toolLibraryError = null;
                  try {
                    state.toolLibraryItems = await fetchMcps(
                      { q: state.toolLibraryQuery },
                      { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                    );
                    // 从 API 响应（含 .install-metadata.json）推导已安装状态
                    const mcpItems = state.toolLibraryItems;
                    const mcpInstalled = new Set<string>();
                    const mcpMap = new Map<number | string, string>();
                    for (const it of mcpItems) {
                      if (it.installed && it.serverKey) {
                        mcpInstalled.add(String(it.id));
                        mcpMap.set(it.id, it.serverKey);
                        mcpMap.set(String(it.id), it.serverKey);
                      }
                    }
                    state.toolLibraryInstalledRemoteIds = mcpInstalled;
                    state.toolLibraryInstalledMcpMap = mcpMap;
                  } catch (err) {
                    state.toolLibraryError = (err as any)?.message ? String((err as any).message) : String(err);
                  } finally {
                    state.toolLibraryLoading = false;
                  }
                };

                if (!state.toolLibraryLoadedOnce && !state.toolLibraryLoading) {
                  state.toolLibraryLoadedOnce = true;
                  queueMicrotask(() => void onRefresh());
                }

                const disabledMcpKeys = disabledMcpServerKeysFromSnapshot(state.configSnapshot);
                return renderToolLibrary({
                loading: state.toolLibraryLoading,
                error: state.toolLibraryError,
                query: state.toolLibraryQuery,
                  category: state.toolLibraryCategory,
                  categoryDescendants: state.toolLibraryCategoryDescendants,
                  onCategoryChange: (next) => (state.toolLibraryCategory = next),
                items: state.toolLibraryItems,
                addModalOpen: state.mcpAddModalOpen,
                addName: state.mcpAddName,
                addDraft: (state.mcpAddDraft ?? {}) as import("./views/mcp.ts").McpServerEntry,
                addConnectionType: state.mcpAddConnectionType,
                addEditMode: state.mcpAddEditMode,
                addRawJson: state.mcpAddRawJson,
                addRawError: state.mcpAddRawError,
                saving: state.configSaving,
                onAddServer: () => handleMcpAddServer(state),
                onAddClose: () => handleMcpAddClose(state),
                onAddNameChange: (name) => handleMcpAddNameChange(state, name),
                onAddFormPatch: (patch) => handleMcpAddFormPatch(state, patch),
                onAddRawChange: (json) => handleMcpAddRawChange(state, json),
                onAddConnectionTypeChange: (type) => handleMcpAddConnectionTypeChange(state, type),
                onAddEditModeChange: (mode) => handleMcpAddEditModeChange(state, mode),
                onAddSubmit: async () => {
                  await handleMcpAddSubmit(state);
                  await loadConfig(state);
                },
                selectedId: state.toolLibrarySelectedId,
                selectedDetail: state.toolLibrarySelectedDetail,
                installedRemoteIds: state.toolLibraryInstalledRemoteIds,
                disabledMcpKeys,
                installingId: state.toolLibraryInstallingId,
                installedMcpMap: state.toolLibraryInstalledMcpMap,
                onInstall: async (id, category) => {
                  if (typeof id !== "number") return;
                  state.toolLibraryInstallingId = id;
                  state.toolLibraryError = null;
                  try {
                    const res = await installFromSite(
                      { kind: "mcp", id: String(id), type: category, category },
                      { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                    );
                    if (res?.id) {
                      state.toolLibraryInstalledRemoteIds = new Set([...state.toolLibraryInstalledRemoteIds, String(id)]);
                      const nextMap = new Map(state.toolLibraryInstalledMcpMap);
                      nextMap.set(id, res.id);
                      nextMap.set(String(id), res.id);
                      state.toolLibraryInstalledMcpMap = nextMap;
                    }
                    await loadConfig(state);
                    await onRefresh();
                  } catch (err) {
                    state.toolLibraryError = (err as Error)?.message ?? String(err);
                  } finally {
                    state.toolLibraryInstallingId = null;
                  }
                },
                onDelete: async (serverKey) => {
                  state.toolLibraryError = null;
                  await handleMcpDelete(state, serverKey);
                  if (state.lastError) {
                    state.toolLibraryError = state.lastError;
                  }
                  let ridToRemove: number | string | null = null;
                  for (const [rid, sk] of state.toolLibraryInstalledMcpMap) {
                    if (sk === serverKey) {
                      ridToRemove = rid;
                      break;
                    }
                  }
                  if (ridToRemove != null) {
                    state.toolLibraryInstalledRemoteIds = new Set([...state.toolLibraryInstalledRemoteIds].filter((x) => x !== String(ridToRemove)));
                    const next = new Map(state.toolLibraryInstalledMcpMap);
                    next.delete(ridToRemove);
                    state.toolLibraryInstalledMcpMap = next;
                  }
                  await onRefresh();
                  state.toolLibrarySelectedId = null;
                  state.toolLibrarySelectedDetail = null;
                },
                onToggleEnabled: async (serverKey, enabled) => {
                  state.toolLibraryError = null;
                  await handleMcpToggle(state, serverKey, enabled);
                  await onRefresh();
                },
                onEdit: (serverKey) => {
                  void (async () => {
                    // 工具库 Tab 此前未纳入 refreshActiveTab 的 loadConfig：刷新后 configSnapshot 可能仍为空，编辑会误以为无配置。
                    if (state.client && state.connected) {
                      await loadConfig(state);
                    }
                    handleMcpSelect(state, serverKey, { syncFormEntryFromSnapshot: true });
                    state.toolLibraryMcpEditModalOpen = true;
                    state.toolLibraryMcpEditServerKey = state.mcpSelectedKey ?? serverKey;
                  })();
                },
                onQueryChange: (next) => (state.toolLibraryQuery = next),
                onRefresh: async () => {
                    await onRefresh();
                },
                onSelect: async (id) => {
                  state.toolLibrarySelectedId = id;
                  state.toolLibrarySelectedDetail = null;
                  state.toolLibraryError = null;
                  if (typeof id === "number" && id < 0) return;
                  try {
                    state.toolLibrarySelectedDetail = await fetchMcpDetail(id, {
                      gatewayHost: state.settings?.gatewayUrl?.trim(),
                      token: state.settings?.token?.trim(),
                    });
                  } catch (err) {
                    state.toolLibraryError = (err as any)?.message ? String((err as any).message) : String(err);
                  }
                },
                onDetailClose: () => {
                  state.toolLibrarySelectedId = null;
                  state.toolLibrarySelectedDetail = null;
                },
                });
              })()
            : nothing
        }

        ${
          state.tab === "tutorials"
            ? (() => {
                const onRefresh = async () => {
                  state.tutorialsLoading = true;
                  state.tutorialsError = null;
                  try {
                    state.tutorialCategories = await fetchEduCategories({
                      gatewayHost: state.settings?.gatewayUrl?.trim(),
                      token: state.settings?.token?.trim(),
                    });
                    if (!state.tutorialsSelectedCategoryId && state.tutorialCategories.length) {
                      state.tutorialsSelectedCategoryId = state.tutorialCategories[0]?.id ?? null;
                    } else if (state.tutorialsSelectedCategoryId) {
                      const exists = state.tutorialCategories.some((c) => c.id === state.tutorialsSelectedCategoryId);
                      if (!exists) {
                        state.tutorialsSelectedCategoryId = state.tutorialCategories[0]?.id ?? null;
                      }
                    }
                  } catch (err) {
                    state.tutorialsError = (err as any)?.message ? String((err as any).message) : String(err);
                  } finally {
                    state.tutorialsLoading = false;
                  }
                };

                if (!state.tutorialsLoadedOnce && !state.tutorialsLoading) {
                  state.tutorialsLoadedOnce = true;
                  queueMicrotask(() => void onRefresh());
                }

                return renderTutorials({
                loading: state.tutorialsLoading,
                error: state.tutorialsError,
                categories: state.tutorialCategories,
                query: state.tutorialsQuery,
                selectedCategoryId: state.tutorialsSelectedCategoryId,
                playingLink: state.tutorialsPlayingLink,
                onQueryChange: (next) => (state.tutorialsQuery = next),
                onSelectCategory: (id) => (state.tutorialsSelectedCategoryId = id),
                onLessonClick: (link) => {
                  state.tutorialsPlayingLink = link;
                },
                onPlayingClose: () => (state.tutorialsPlayingLink = null),
                onRefresh: async () => {
                    await onRefresh();
                },
                });
              })()
            : nothing
        }

        ${
          state.tab === "aboutUs"
            ? renderAbout({
                basePath,
                clearWorkspaceLoading: state.aboutClearWorkspaceLoading,
                clearWorkspaceError: state.aboutClearWorkspaceError,
                onClearWorkspace: async () => {
                  const ok = await nativeConfirm(
                    "将删除本机默认工作区目录内的全部内容（macOS / Linux 一般为 ~/.openocta/workspace，Windows 一般为 %APPDATA%&#92;openocta&#92;workspace）。\n\n此操作不可恢复，请先备份重要文稿。是否继续？",
                  );
                  if (!ok) return;
                  const gw = state.settings?.gatewayUrl?.trim();
                  if (!gw) {
                    state.aboutClearWorkspaceError = "请先在 Overview 中配置 Gateway URL。";
                    return;
                  }
                  state.aboutClearWorkspaceLoading = true;
                  state.aboutClearWorkspaceError = null;
                  try {
                    const r = await requestDesktopClearWorkspace({
                      gatewayHost: gw,
                      token: state.settings?.token?.trim() ?? "",
                    });
                    if (!r.ok) {
                      state.aboutClearWorkspaceError = [r.message, r.detail].filter(Boolean).join(" — ");
                      return;
                    }
                    await nativeAlert(r.message ?? "已清空默认工作区。");
                  } catch (e) {
                    state.aboutClearWorkspaceError = e instanceof Error ? e.message : String(e);
                  } finally {
                    state.aboutClearWorkspaceLoading = false;
                  }
                },
                uninstallModalOpen: state.aboutUninstallModalOpen,
                uninstallMode: state.aboutUninstallMode,
                uninstallLoading: state.aboutUninstallLoading,
                uninstallError: state.aboutUninstallError,
                onOpenUninstallModal: () => {
                  state.aboutUninstallModalOpen = true;
                  state.aboutUninstallError = null;
                  state.aboutUninstallMode = "program";
                },
                onCloseUninstallModal: () => {
                  state.aboutUninstallModalOpen = false;
                  state.aboutUninstallError = null;
                },
                onUninstallModeChange: (mode) => {
                  state.aboutUninstallMode = mode;
                },
                onConfirmUninstall: async () => {
                  const gw = state.settings?.gatewayUrl?.trim();
                  if (!gw) {
                    state.aboutUninstallError = "请先在 Overview 中配置 Gateway URL。";
                    return;
                  }
                  state.aboutUninstallLoading = true;
                  state.aboutUninstallError = null;
                  try {
                    const token = state.settings?.token?.trim() ?? "";
                    const r = await requestDesktopUninstall({
                      gatewayHost: gw,
                      token,
                      mode: state.aboutUninstallMode,
                    });
                    if (!r.ok) {
                      state.aboutUninstallError = [r.message, r.detail].filter(Boolean).join(" — ");
                      return;
                    }
                    state.aboutUninstallModalOpen = false;
                    await nativeAlert(r.message ?? "已安排卸载，桌面应用将自动退出。");
                    try {
                      window.close();
                    } catch {
                      /* embedded webview may ignore */
                    }
                  } catch (e) {
                    state.aboutUninstallError = e instanceof Error ? e.message : String(e);
                  } finally {
                    state.aboutUninstallLoading = false;
                  }
                },
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
                viewContent: state.llmTraceViewContent,
                viewingSessionId: state.llmTraceViewingSessionId,
                viewLoading: state.llmTraceViewLoading,
                onRefresh: () => handleLlmTraceRefresh(state),
                onModeChange: (mode) => handleLlmTraceModeChange(state, mode),
                onSearchChange: (value) => handleLlmTraceSearchChange(state, value),
                onToggleEnabled: () => handleLlmTraceToggleEnabled(state),
                onView: (sessionId) => handleLlmTraceView(state, sessionId),
                onBack: () => handleLlmTraceBack(state),
                onDownload: (sessionId) => handleLlmTraceDownload(state, sessionId),
              })
            : nothing
        }

        ${
          state.tab === "sandbox"
            ? renderSecurity({
                security:
                  state.securityForm ??
                  getSecurityFromConfig(state) ??
                  {},
                saving: state.configSaving,
                pendingApprovalsCount: state.approvalsResult?.pending?.length ?? 0,
                onPresetApply: (preset) => handleSecurityPresetApply(state, preset),
                onPatch: (path, value) => {
                  if (!state.securityForm) {
                    state.securityForm = syncSecurityFromConfig(state) ?? {};
                  }
                  handleSecurityPatch(state, state.securityForm as Record<string, unknown>, path, value);
                },
                onSave: () =>
                  handleSecuritySave(
                    state,
                    state.securityForm ?? getSecurityFromConfig(state) ?? {},
                  ),
                pathForTab: (tab) => pathForTab(tab, state.basePath),
                approvalsLoading: state.approvalsLoading,
                approvalsResult: state.approvalsResult,
                approvalsError: state.approvalsError,
                onApprovalsRefresh: () => loadApprovalsList(state),
                onApprove: (requestId) => approveApproval(state, requestId, "ui"),
                onDeny: (requestId, reason) => denyApproval(state, requestId, "ui", reason),
                onWhitelistSession: (requestId) =>
                  whitelistSessionApprovals(state, requestId, "ui"),
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
          isChat
            ? renderChat({
                sessionKey: state.sessionKey,
                onSessionKeyChange: (next) => {
                  state.sessionKey = next;
                  state.chatMessage = "";
                  state.chatAttachments = [];
                  state.chatModelRef = null;
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
                  syncUrlWithSessionKey(state, next, true);
                },
                thinkingLevel: state.chatThinkingLevel,
                showThinking,
                modelRef: state.chatModelRef,
                defaultModelRef: resolveDefaultModelRef(configValue),
                modelOptions: (() => {
                  type ModelEntry = { id: string; name?: string };
                  const cfg = configValue as
                    | {
                        agents?: { defaults?: { models?: Record<string, { alias?: string }> } };
                        models?: { providers?: Record<string, { models?: ModelEntry[] }> };
                      }
                    | null;
                  const defaultRef = resolveDefaultModelRef(configValue);
                  const seen = new Set<string>();
                  const opts: Array<{ value: string; label: string }> = [];

                  // 1. agents.defaults.models（优先）
                  const agentModels = cfg?.agents?.defaults?.models;
                  if (agentModels && typeof agentModels === "object") {
                    for (const [id, raw] of Object.entries(agentModels)) {
                      const value = id.trim();
                      if (!value || seen.has(value)) continue;
                      seen.add(value);
                      const alias =
                        raw && typeof raw === "object" && "alias" in raw && typeof raw.alias === "string"
                          ? raw.alias.trim()
                          : "";
                      const label = alias && alias !== value ? `${alias} (${value})` : value;
                      opts.push({ value, label });
                    }
                  }

                  // 2. models.providers 中的模型（补充）
                  const providers = cfg?.models?.providers;
                  if (providers && typeof providers === "object") {
                    for (const [providerKey, prov] of Object.entries(providers)) {
                      const models = prov && typeof prov === "object" ? (prov as { models?: ModelEntry[] }).models : undefined;
                      if (!Array.isArray(models)) continue;
                      for (const m of models) {
                        const modelId = m?.id?.trim();
                        if (!modelId) continue;
                        const value = `${providerKey}/${modelId}`;
                        if (seen.has(value)) continue;
                        seen.add(value);
                        const label = m.name && m.name !== modelId ? `${m.name} (${value})` : value;
                        opts.push({ value, label });
                      }
                    }
                  }

                  // 3. 首项固定为「使用默认配置」：modelRef 为 null 时选中此项
                  opts.unshift({
                    value: "",
                    label: defaultRef ? `默认 (${defaultRef})` : "默认",
                  });

                  return opts;
                })(),
                onModelRefChange: (next) => (state.chatModelRef = next),
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
                confirmQueueRemove: state.tab === "message",
                onNewSession: () => state.handleSendChat("/new", { restoreDraft: true }),
                showNewMessages: state.chatNewMessagesBelow,
                onScrollToBottom: () => state.scrollToBottom(),
                conversationOnly: state.chatConversationOnly,
                onConversationOnlyChange: (next) => {
                  state.chatConversationOnly = next;
                },
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
                      draft: { enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } },
                      rawJson: JSON.stringify({ enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } }, null, 2),
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
                  await openDigitalEmployeeWebchat(state, employeeId);
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
                        draft: isForm ? (v as any) : { enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } },
                        rawJson: isObj ? JSON.stringify(v, null, 2) : JSON.stringify({ enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } }, null, 2),
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
                      draft: { enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } },
                      rawJson: JSON.stringify({ enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } }, null, 2),
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
                  (state.configSnapshot?.config as { env?: { vars?: Record<string, string> } } | undefined)?.env?.vars ??
                  {},
                dirty: state.configFormDirty,
                loading: state.configLoading,
                saving: state.configSaving,
                connected: state.connected,
                onVarsChange: (next) => {
                  updateConfigFormValue(state, ["env", "vars"], next);
                },
                onSave: async () => {
                  const envForm = state.configForm?.env as { vars?: Record<string, string> } | undefined;
                  const raw = envForm?.vars ?? {};
                  const filtered: Record<string, string> = {};
                  for (const [k, v] of Object.entries(raw)) {
                    if (k.trim()) filtered[k.trim()] = v;
                  }
                  // 更新表单中的 env.vars
                  updateConfigFormValue(state, ["env", "vars"], filtered);

                  // 基于当前配置构造 env 对象，保留其它字段（例如 modelEnv、shellEnv 等）
                  const baseEnv =
                    (state.configForm?.env as Record<string, unknown> | undefined) ??
                    ((state.configSnapshot?.config as { env?: Record<string, unknown> } | undefined)?.env ?? {});
                  const nextEnv = { ...baseEnv, vars: filtered };

                  await saveConfigPatch(state, { env: nextEnv });
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
          state.tab === "modelLibrary"
            ? renderModelLibrary({
                providers: modelProviders,
                formProviders: (state.configForm?.models as { providers?: Record<string, import("./views/models.ts").ModelProvider> })?.providers,
                modelEnv,
                defaultModelRef,
                loading: state.configLoading,
                saving: state.configSaving,
                selectedCategory: state.modelLibraryCategory,
                selectedProvider: state.modelLibrarySelectedProvider,
                providerSearchQuery: state.modelsProviderSearchQuery,
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
                onProviderSearchChange: (q) => (state.modelsProviderSearchQuery = q),
                onViewModeChange: (mode) => (state.modelsViewMode = mode),
                onPatch: (key, patch) => handleModelsPatch(state, key, patch),
                onAddModel: (providerKey) => handleModelsAddModel(state, providerKey),
                onAddModelModalClose: () => handleModelsAddModelModalClose(state),
                onAddModelFormChange: (form) => handleModelsAddModelFormChange(state, form),
                onAddModelSubmit: (providerKey) => handleModelsAddModelSubmit(state, providerKey),
                onRemoveModel: (providerKey, modelId) => handleModelsRemoveModel(state, providerKey, modelId),
                onPatchModel: (providerKey, modelId, patch) =>
                  handleModelsPatchModel(state, providerKey, modelId, patch),
                onPatchModelEnv: (providerKey, modelId, envVars) =>
                  handleModelsPatchModelEnv(state, providerKey, modelId, envVars),
                onSave: () => handleModelsSave(state),
                onCancel: () => handleModelsCancel(state),
                onUseModelClick: (provider) => handleModelsUseModelClick(state, provider),
                onUseModelModalClose: () => handleModelsUseModelModalClose(state),
                onUseModel: (provider, modelId) => handleModelsUseModel(state, provider, modelId),
                onCancelUse: (provider) => handleModelsCancelUse(state, provider),
                onDeleteProvider: () => handleModelsDeleteProvider(state),
              })
            : nothing
        }

        ${
          state.tab === "models"
            ? renderModels({
                providers: modelProviders,
                modelEnv,
                defaultModelRef,
                loading: state.configLoading,
                saving: state.configSaving,
                selectedProvider: state.modelsSelectedProvider,
                providerSearchQuery: state.modelsProviderSearchQuery,
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
                onProviderSearchChange: (q) => (state.modelsProviderSearchQuery = q),
                onViewModeChange: (mode) => (state.modelsViewMode = mode),
                onPatch: (key, patch) => handleModelsPatch(state, key, patch),
                onAddModel: (providerKey) => handleModelsAddModel(state, providerKey),
                onAddModelModalClose: () => handleModelsAddModelModalClose(state),
                onAddModelFormChange: (form) => handleModelsAddModelFormChange(state, form),
                onAddModelSubmit: (providerKey) => handleModelsAddModelSubmit(state, providerKey),
                onRemoveModel: (providerKey, modelId) => handleModelsRemoveModel(state, providerKey, modelId),
                onPatchModel: (providerKey, modelId, patch) =>
                  handleModelsPatchModel(state, providerKey, modelId, patch),
                onPatchModelEnv: (providerKey, modelId, envVars) =>
                  handleModelsPatchModelEnv(state, providerKey, modelId, envVars),
                onSave: () => handleModelsSave(state),
                onCancel: () => handleModelsCancel(state),
                onUseModelClick: (provider) => handleModelsUseModelClick(state, provider),
                onUseModelModalClose: () => handleModelsUseModelModalClose(state),
                onUseModel: (provider, modelId) => handleModelsUseModel(state, provider, modelId),
                onCancelUse: (provider) => handleModelsCancelUse(state, provider),
                onDeleteProvider: () => handleModelsDeleteProvider(state),
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
      ${
        state.toolLibraryMcpEditModalOpen && state.toolLibraryMcpEditServerKey
          ? (() => {
              const sk = state.toolLibraryMcpEditServerKey;
              const cfg = state.configForm ?? (state.configSnapshot?.config as Record<string, unknown> | null);
              const snapCfg = state.configSnapshot?.config as Record<string, unknown> | null | undefined;
              const mcp = cfg?.mcp as { servers?: Record<string, import("./views/mcp.ts").McpServerEntry> } | undefined;
              const snapMcp = snapCfg?.mcp as
                | { servers?: Record<string, import("./views/mcp.ts").McpServerEntry> }
                | undefined;
              const rawEntry = (mcp?.servers?.[sk] ?? snapMcp?.servers?.[sk] ?? {}) as import("./views/mcp.ts").McpServerEntry;
              const entry = resolveMcpServerEntryForUi(sk, rawEntry, state.configSnapshot);
              return renderMcpEditModal({
                open: true,
                serverKey: sk,
                entry,
                editMode: state.mcpEditMode,
                editConnectionType: state.mcpEditConnectionType,
                formDirty: state.mcpFormDirty,
                rawJson: state.mcpRawJson,
                rawError: state.mcpRawError,
                saving: state.configSaving,
                onFormPatch: (key: string, patch: Partial<import("./views/mcp.ts").McpServerEntry>) => handleMcpFormPatch(state, key, patch),
                onRawChange: (key: string, json: string) => handleMcpRawChange(state, key, json),
                onEditModeChange: (mode: "form" | "raw") => (state.mcpEditMode = mode),
                onEditConnectionTypeChange: (type: "stdio" | "url" | "service") => handleMcpEditConnectionTypeChange(state, type),
                onSave: () => {
                  handleMcpSave(state);
                  state.toolLibraryMcpEditModalOpen = false;
                  state.toolLibraryMcpEditServerKey = "";
                  void loadConfig(state);
                },
                onCancel: () => {
                  handleMcpCancel(state);
                  state.toolLibraryMcpEditModalOpen = false;
                  state.toolLibraryMcpEditServerKey = "";
                },
              });
            })()
          : nothing
      }
      ${
        state.digitalEmployeeEditModalOpen
          ? renderDigitalEmployeeEditModal({
              editModalOpen: true,
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
                    draft: { enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } },
                    rawJson: JSON.stringify({ enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } }, null, 2),
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
                  void loadDigitalEmployees(state);
                  if (state.tab === "employeeMarket") {
                    state.employeeMarketError = null;
                    void fetchEmployees(
                      { q: state.employeeMarketQuery },
                      { gatewayHost: state.settings?.gatewayUrl?.trim(), token: state.settings?.token?.trim() },
                    ).then(
                      (items) => (state.employeeMarketItems = items),
                    );
                  }
                }
              },
            })
          : nothing
      }
    </div>
    ${renderNativeDialogOverlay({
      model: state.nativeDialog,
      promptValue: state.nativePromptInput,
      onPromptInput: (v) => state.handleNativePromptInput(v),
      onConfirm: () => state.handleNativeDialogConfirm(),
      onCancel: () => state.handleNativeDialogCancel(),
    })}
    ${renderSessionOverflowFlyout(state, basePath)}
  `;
}
