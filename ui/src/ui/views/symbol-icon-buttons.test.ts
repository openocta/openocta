import { html, render } from "lit";
import { describe, expect, it, vi } from "vitest";
import { renderAgentSwarm } from "./agent-swarm.ts";
import { renderChannelConfigPanel } from "./channels.config.ts";
import { renderConfig } from "./config.ts";
import { analyzeConfigSchema, renderConfigForm } from "./config-form.ts";
import { renderMcp } from "./mcp.ts";
import { renderModels } from "./models.ts";
import { renderSkills } from "./skills.ts";
import {
  renderDigitalEmployeeCreateModal,
  renderDigitalEmployeeEditModal,
} from "./digital-employee.ts";
import { renderUsage } from "./usage.ts";

describe("symbol icon buttons", () => {
  it("renders config search clear with svg and clears the query", () => {
    const onSearchChange = vi.fn();
    const container = document.createElement("div");
    render(
      renderConfig({
        raw: "{\n}\n",
        originalRaw: "{\n}\n",
        valid: true,
        issues: [],
        loading: false,
        saving: false,
        applying: false,
        updating: false,
        connected: true,
        schema: { type: "object", properties: {} },
        schemaLoading: false,
        uiHints: {},
        formMode: "form",
        formValue: {},
        originalValue: {},
        searchQuery: "gateway",
        activeSection: null,
        activeSubsection: null,
        onRawChange: vi.fn(),
        onFormModeChange: vi.fn(),
        onFormPatch: vi.fn(),
        onSearchChange,
        onSectionChange: vi.fn(),
        onSubsectionChange: vi.fn(),
        onReload: vi.fn(),
        onSave: vi.fn(),
        onApply: vi.fn(),
        onUpdate: vi.fn(),
      }),
      container,
    );

    const clearButton = container.querySelector<HTMLButtonElement>(".config-search__clear");
    expect(clearButton?.querySelector("svg")).not.toBeNull();
    clearButton?.click();
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("renders numeric stepper buttons with svg icons", () => {
    const onPatch = vi.fn();
    const container = document.createElement("div");
    const analysis = analyzeConfigSchema({
      type: "object",
      properties: {
        retries: { type: "number" },
      },
    });
    render(
      renderConfigForm({
        schema: analysis.schema,
        uiHints: {},
        unsupportedPaths: analysis.unsupportedPaths,
        value: { retries: 2 },
        onPatch,
      }),
      container,
    );

    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>(".cfg-number__btn"));
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.querySelector("svg")).not.toBeNull();
    expect(buttons[1]?.querySelector("svg")).not.toBeNull();
    buttons[0]?.click();
    buttons[1]?.click();
    expect(onPatch).toHaveBeenCalledWith(["retries"], 1);
    expect(onPatch).toHaveBeenCalledWith(["retries"], 3);
  });

  it("renders usage filter/session controls with svg icons", () => {
    const onClearDays = vi.fn();
    const onClearSessions = vi.fn();
    const container = document.createElement("div");
    render(
      renderUsage({
        loading: false,
        error: null,
        startDate: "2026-04-01",
        endDate: "2026-04-03",
        sessions: [
          {
            key: "session-1",
            label: "Session 1",
            usage: {
              input: 1,
              output: 2,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 3,
              totalCost: 0,
              inputCost: 0,
              outputCost: 0,
              cacheReadCost: 0,
              cacheWriteCost: 0,
              missingCostEntries: 0,
            },
          },
        ],
        sessionsLimitReached: false,
        totals: {
          input: 1,
          output: 2,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 3,
          totalCost: 0,
          inputCost: 0,
          outputCost: 0,
          cacheReadCost: 0,
          cacheWriteCost: 0,
          missingCostEntries: 0,
        },
        aggregates: {
          messages: { total: 0, user: 0, assistant: 0, toolCalls: 0, toolResults: 0, errors: 0 },
          tools: { totalCalls: 0, uniqueTools: 0, tools: [] },
          byModel: [],
          byProvider: [],
          byAgent: [],
          byChannel: [],
          daily: [],
        },
        costDaily: [],
        selectedSessions: ["session-1"],
        selectedDays: ["2026-04-02"],
        selectedHours: [],
        chartMode: "tokens",
        dailyChartMode: "total",
        timeSeriesMode: "cumulative",
        timeSeriesBreakdownMode: "total",
        timeSeries: { points: [] },
        timeSeriesLoading: false,
        sessionLogs: [],
        sessionLogsLoading: false,
        sessionLogsExpanded: false,
        logFilterRoles: [],
        logFilterTools: [],
        logFilterHasTools: false,
        logFilterQuery: "",
        query: "",
        queryDraft: "provider:openai",
        sessionSort: "recent",
        sessionSortDir: "desc",
        recentSessions: [],
        sessionsTab: "all",
        visibleColumns: ["channel"],
        timeZone: "local",
        contextExpanded: false,
        headerPinned: false,
        onStartDateChange: vi.fn(),
        onEndDateChange: vi.fn(),
        onRefresh: vi.fn(),
        onTimeZoneChange: vi.fn(),
        onToggleContextExpanded: vi.fn(),
        onToggleHeaderPinned: vi.fn(),
        onToggleSessionLogsExpanded: vi.fn(),
        onLogFilterRolesChange: vi.fn(),
        onLogFilterToolsChange: vi.fn(),
        onLogFilterHasToolsChange: vi.fn(),
        onLogFilterQueryChange: vi.fn(),
        onLogFilterClear: vi.fn(),
        onSelectSession: vi.fn(),
        onChartModeChange: vi.fn(),
        onDailyChartModeChange: vi.fn(),
        onTimeSeriesModeChange: vi.fn(),
        onTimeSeriesBreakdownChange: vi.fn(),
        onSelectDay: vi.fn(),
        onSelectHour: vi.fn(),
        onClearDays,
        onClearHours: vi.fn(),
        onClearSessions,
        onClearFilters: vi.fn(),
        onQueryDraftChange: vi.fn(),
        onApplyQuery: vi.fn(),
        onClearQuery: vi.fn(),
        onSessionSortChange: vi.fn(),
        onSessionSortDirChange: vi.fn(),
        onSessionsTabChange: vi.fn(),
        onToggleColumn: vi.fn(),
      }),
      container,
    );

    const filterRemove = container.querySelector<HTMLButtonElement>(".filter-chip-remove");
    const sessionClose = container.querySelector<HTMLButtonElement>(".session-close-btn");
    const queryRemove = container.querySelector<HTMLButtonElement>(".usage-query-chip button");
    expect(filterRemove?.querySelector("svg")).not.toBeNull();
    expect(sessionClose?.querySelector("svg")).not.toBeNull();
    expect(queryRemove?.querySelector("svg")).not.toBeNull();
    filterRemove?.click();
    sessionClose?.click();
    expect(onClearDays).toHaveBeenCalled();
    expect(onClearSessions).toHaveBeenCalled();
  });

  it("renders agent swarm send button", () => {
    const container = document.createElement("div");
    render(
      renderAgentSwarm({
        client: null,
        connected: false,
        swarmLoading: false,
        swarmError: null,
        swarmWorkspaces: [{ id: "ws1", label: "Test", agentId: "main", createdAt: 0, updatedAt: 0 }],
        swarmActiveWorkspaceId: "ws1",
        swarmMembers: [
          {
            id: "m1",
            workspaceId: "ws1",
            sessionKey: "agent:main:swarm:ws1:m1",
            agentId: "main",
            label: "Assistant",
            status: "idle",
            createdAt: 0,
            updatedAt: 0,
          },
        ],
        swarmSelectedMemberId: "m1",
        swarmGraph: null,
        swarmHistory: [],
        swarmInput: "",
        swarmSending: false,
        swarmStreamText: "",
        swarmTreeCollapsed: {},
        swarmMidSplit: 0.52,
        swarmEventsCollapsed: false,
        swarmVizScale: 0.9,
        swarmVizOffsetX: 0,
        swarmVizOffsetY: 0,
        swarmPanelCollapsed: {},
        createModalOpen: false,
        createModalLabel: "蜂群",
        addMemberModalOpen: false,
        addMemberEmployeeId: "",
        addMemberLabel: "子任务",
        onSelectWorkspace: vi.fn(),
        onOpenDeleteWorkspace: vi.fn(),
        onStopAll: vi.fn(),
        onSelectMember: vi.fn(),
        deleteModalOpen: false,
        deleteModalLabel: "",
        onDeleteModalClose: vi.fn(),
        onDeleteModalSubmit: vi.fn(),
        onOpenCreateWorkspace: vi.fn(),
        onStartConversation: vi.fn(),
        onOpenAddMember: vi.fn(),
        onCreateModalClose: vi.fn(),
        onCreateModalLabelChange: vi.fn(),
        onCreateModalSubmit: vi.fn(),
        onAddMemberModalClose: vi.fn(),
        onAddMemberEmployeeIdChange: vi.fn(),
        onAddMemberLabelChange: vi.fn(),
        onAddMemberModalSubmit: vi.fn(),
        onSend: vi.fn(),
        onInputChange: vi.fn(),
        onTreeToggle: vi.fn(),
        onMidSplitChange: vi.fn(),
        onEventsCollapsedChange: vi.fn(),
        onVizScaleChange: vi.fn(),
        onVizOffsetChange: vi.fn(),
        onPanelToggle: vi.fn(),
      }),
      container,
    );

    expect(container.querySelector(".agent-swarm__composer .agent-swarm__btn--primary")).not.toBeNull();
  });

  it("renders non-pure plus buttons with svg icons", () => {
    const container = document.createElement("div");
    render(
      html`
        ${renderDigitalEmployeeCreateModal({
          createModalOpen: true,
          createName: "SRE",
          createDescription: "",
          createPrompt: "",
          createError: null,
          createBusy: false,
          advancedOpen: true,
          createMcpMode: "builder",
          mcpJson: "",
          mcpItems: [],
          skillUploadName: "",
          skillUploadFiles: [],
          skillUploadError: null,
          onMcpJsonChange: vi.fn(),
          onMcpModeChange: vi.fn(),
          onMcpAddItem: vi.fn(),
          onMcpRemoveItem: vi.fn(),
          onMcpCollapsedChange: vi.fn(),
          onMcpKeyChange: vi.fn(),
          onMcpEditModeChange: vi.fn(),
          onMcpConnectionTypeChange: vi.fn(),
          onMcpFormPatch: vi.fn(),
          onMcpRawChange: vi.fn(),
          onCreateClose: vi.fn(),
          onCreateNameChange: vi.fn(),
          onCreateDescriptionChange: vi.fn(),
          onCreatePromptChange: vi.fn(),
          onToggleAdvanced: vi.fn(),
          onSkillUploadNameChange: vi.fn(),
          onSkillUploadFilesChange: vi.fn(),
          onCreateSubmit: vi.fn(),
        })}
        ${renderDigitalEmployeeEditModal({
          editModalOpen: true,
          editId: "sre",
          editName: "SRE",
          editDescription: "",
          editPrompt: "",
          editMcpJson: "",
          editMcpMode: "builder",
          editMcpItems: [],
          editSkillNames: [],
          editSkillFilesToUpload: [],
          editSkillsToDelete: [],
          editError: null,
          editBusy: false,
          onEditClose: vi.fn(),
          onEditDescriptionChange: vi.fn(),
          onEditPromptChange: vi.fn(),
          onEditMcpJsonChange: vi.fn(),
          onEditMcpModeChange: vi.fn(),
          onEditMcpAddItem: vi.fn(),
          onEditMcpRemoveItem: vi.fn(),
          onEditMcpCollapsedChange: vi.fn(),
          onEditMcpKeyChange: vi.fn(),
          onEditMcpEditModeChange: vi.fn(),
          onEditMcpConnectionTypeChange: vi.fn(),
          onEditMcpFormPatch: vi.fn(),
          onEditMcpRawChange: vi.fn(),
          onEditSkillFilesChange: vi.fn(),
          onEditSkillDelete: vi.fn(),
          onEditSkillUndoDelete: vi.fn(),
          onEditSubmit: vi.fn(),
        })}
        ${renderModels({
          providers: {
            custom: {
              displayName: "Custom",
              models: [{ id: "gpt-test", name: "GPT Test" }],
            },
          },
          modelEnv: { "custom/gpt-test": {} },
          defaultModelRef: null,
          loading: false,
          saving: false,
          selectedProvider: "custom",
          providerSearchQuery: "",
          viewMode: "card",
          formDirty: false,
          addProviderModalOpen: false,
          addProviderForm: {
            providerId: "",
            displayName: "",
            baseUrl: "",
            apiKey: "",
            apiKeyPrefix: "",
          },
          addModelModalOpen: false,
          addModelForm: { modelId: "", modelName: "", contextWindow: "", maxTokens: "" },
          useModelModalOpen: false,
          useModelModalProvider: null,
          saveError: null,
          onRefresh: vi.fn(),
          onAddProvider: vi.fn(),
          onAddProviderModalClose: vi.fn(),
          onAddProviderFormChange: vi.fn(),
          onAddProviderSubmit: vi.fn(),
          onSelect: vi.fn(),
          onProviderSearchChange: vi.fn(),
          onViewModeChange: vi.fn(),
          onPatch: vi.fn(),
          onAddModel: vi.fn(),
          onAddModelModalClose: vi.fn(),
          onAddModelFormChange: vi.fn(),
          onAddModelSubmit: vi.fn(),
          onRemoveModel: vi.fn(),
          onPatchModel: vi.fn(),
          onPatchModelEnv: vi.fn(),
          onSave: vi.fn(),
          onCancel: vi.fn(),
          onUseModelClick: vi.fn(),
          onUseModelModalClose: vi.fn(),
          onUseModel: vi.fn(),
          onCancelUse: vi.fn(),
        })}
      `,
      container,
    );

    const employeeButtons = Array.from(container.querySelectorAll("button")).filter((button) =>
      button.textContent?.includes("添加 MCP"),
    );
    const addModelButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Add Model"),
    );
    const addEnvButtons = Array.from(container.querySelectorAll("button")).filter(
      (button) => button.textContent?.trim() === "Add",
    );

    expect(employeeButtons.length).toBeGreaterThanOrEqual(2);
    expect(addModelButton).toBeTruthy();
    expect(addEnvButtons.length).toBeGreaterThanOrEqual(1);

    for (const button of [...employeeButtons, addModelButton!, ...addEnvButtons]) {
      expect(button.querySelector(".btn__icon svg")).not.toBeNull();
      expect(button.textContent?.trim().startsWith("+")).toBe(false);
    }
  });

  it("renders usage counters without + or × symbols", () => {
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = "zh";
    const container = document.createElement("div");
    const sessions = Array.from({ length: 51 }, (_, index) => ({
      key: `session-${index + 1}`,
      label: `Session ${index + 1}`,
      usage: {
        input: 1,
        output: 2,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 3,
        totalCost: 0,
        inputCost: 0,
        outputCost: 0,
        cacheReadCost: 0,
        cacheWriteCost: 0,
        missingCostEntries: 0,
      },
      contextWeight:
        index === 0
          ? {
              systemPrompt: { chars: 100, projectContextChars: 0, nonProjectContextChars: 0 },
              skills: {
                promptChars: 10,
                entries: Array.from({ length: 5 }, (_, skillIndex) => ({
                  name: `skill-${skillIndex + 1}`,
                  blockChars: 100 - skillIndex,
                })),
              },
              tools: {
                listChars: 10,
                schemaChars: 10,
                entries: Array.from({ length: 5 }, (_, toolIndex) => ({
                  name: `tool-${toolIndex + 1}`,
                  summaryChars: 30 - toolIndex,
                  schemaChars: 20,
                })),
              },
              injectedWorkspaceFiles: Array.from({ length: 5 }, (_, fileIndex) => ({
                name: `file-${fileIndex + 1}.md`,
                path: `/tmp/file-${fileIndex + 1}.md`,
                rawChars: 100,
                injectedChars: 80 - fileIndex,
                truncated: false,
              })),
            }
          : null,
    }));

    render(
      renderUsage({
        loading: false,
        error: null,
        startDate: "2026-04-01",
        endDate: "2026-04-03",
        sessions,
        sessionsLimitReached: false,
        totals: {
          input: 1,
          output: 2,
          cacheRead: 0,
          cacheWrite: 0,
          totalTokens: 3,
          totalCost: 0,
          inputCost: 0,
          outputCost: 0,
          cacheReadCost: 0,
          cacheWriteCost: 0,
          missingCostEntries: 0,
        },
        aggregates: {
          messages: { total: 0, user: 0, assistant: 0, toolCalls: 0, toolResults: 0, errors: 0 },
          tools: { totalCalls: 0, uniqueTools: 0, tools: [] },
          byModel: [],
          byProvider: [],
          byAgent: [],
          byChannel: [],
          daily: [],
        },
        costDaily: [],
        selectedSessions: ["session-1"],
        selectedDays: [],
        selectedHours: [],
        chartMode: "tokens",
        dailyChartMode: "total",
        timeSeriesMode: "cumulative",
        timeSeriesBreakdownMode: "total",
        timeSeries: { points: [] },
        timeSeriesLoading: false,
        sessionLogs: [
          {
            timestamp: Date.now(),
            role: "assistant",
            content: "[Tool: read]\n[Tool: read]\n[Tool Result]",
          },
        ],
        sessionLogsLoading: false,
        sessionLogsExpanded: true,
        logFilterRoles: [],
        logFilterTools: [],
        logFilterHasTools: false,
        logFilterQuery: "",
        query: "",
        queryDraft: "",
        sessionSort: "recent",
        sessionSortDir: "desc",
        recentSessions: [],
        sessionsTab: "all",
        visibleColumns: ["channel"],
        timeZone: "local",
        contextExpanded: false,
        headerPinned: false,
        onStartDateChange: vi.fn(),
        onEndDateChange: vi.fn(),
        onRefresh: vi.fn(),
        onTimeZoneChange: vi.fn(),
        onToggleContextExpanded: vi.fn(),
        onToggleHeaderPinned: vi.fn(),
        onToggleSessionLogsExpanded: vi.fn(),
        onLogFilterRolesChange: vi.fn(),
        onLogFilterToolsChange: vi.fn(),
        onLogFilterHasToolsChange: vi.fn(),
        onLogFilterQueryChange: vi.fn(),
        onLogFilterClear: vi.fn(),
        onSelectSession: vi.fn(),
        onChartModeChange: vi.fn(),
        onDailyChartModeChange: vi.fn(),
        onTimeSeriesModeChange: vi.fn(),
        onTimeSeriesBreakdownChange: vi.fn(),
        onSelectDay: vi.fn(),
        onSelectHour: vi.fn(),
        onClearDays: vi.fn(),
        onClearHours: vi.fn(),
        onClearSessions: vi.fn(),
        onClearFilters: vi.fn(),
        onQueryDraftChange: vi.fn(),
        onApplyQuery: vi.fn(),
        onClearQuery: vi.fn(),
        onSessionSortChange: vi.fn(),
        onSessionSortDirChange: vi.fn(),
        onSessionsTabChange: vi.fn(),
        onToggleColumn: vi.fn(),
      }),
      container,
    );

    expect(container.textContent).toContain("还有 1 项");
    expect(container.textContent).toContain("read (2)");
    expect(container.textContent).not.toContain("+1");
    expect(container.textContent).not.toContain("×");
    document.documentElement.lang = previousLang;
  });

  it("renders modal and panel close buttons with svg icons", () => {
    const container = document.createElement("div");
    render(
      html`
        ${renderSkills({
          loading: false,
          report: {
            workspaceDir: "/tmp",
            managedSkillsDir: "/tmp/skills",
            skills: [
              {
                name: "Skill One",
                description: "desc",
                source: "openclaw-managed",
                filePath: "/tmp/skills/skill-1/SKILL.md",
                baseDir: "/tmp/skills/skill-1",
                skillKey: "skill-1",
                always: false,
                enabled: true,
                disabled: false,
                blockedByAllowlist: false,
                eligible: true,
                requirements: { bins: [], env: [], config: [], os: [] },
                missing: { bins: [], env: [], config: [], os: [] },
                configChecks: [],
                install: [],
              },
            ],
          } as any,
          error: null,
          filter: "",
          edits: {},
          busyKey: null,
          messages: {},
          addModalOpen: false,
          uploadName: "",
          uploadFiles: [],
          uploadError: null,
          uploadTemplate: null,
          uploadBusy: false,
          viewMode: "card",
          onFilterChange: vi.fn(),
          onRefresh: vi.fn(),
          onViewModeChange: vi.fn(),
          onAddClick: vi.fn(),
          onAddClose: vi.fn(),
          onUploadNameChange: vi.fn(),
          onUploadFilesChange: vi.fn(),
          onUploadSubmit: vi.fn(),
          onToggle: vi.fn(),
          onEdit: vi.fn(),
          onSaveKey: vi.fn(),
          onInstall: vi.fn(),
          onDelete: vi.fn(),
          selectedSkillKey: "skill-1",
          skillDocContent: null,
          skillDocLoading: false,
          skillDocError: null,
          onSkillDetailClick: vi.fn(),
        })}
        ${renderMcp({
          servers: { test: { command: "node", args: ["server.js"] } },
          loading: false,
          saving: false,
          selectedKey: "test",
          viewMode: "card",
          addModalOpen: false,
          addName: "",
          addDraft: {},
          addConnectionType: "stdio",
          addEditMode: "form",
          addFormDirty: false,
          addRawJson: "",
          addRawError: null,
          editMode: "form",
          editConnectionType: "stdio",
          formDirty: false,
          rawJson: "",
          rawError: null,
          onRefresh: vi.fn(),
          onViewModeChange: vi.fn(),
          onAddServer: vi.fn(),
          onAddClose: vi.fn(),
          onAddNameChange: vi.fn(),
          onAddFormPatch: vi.fn(),
          onAddRawChange: vi.fn(),
          onAddConnectionTypeChange: vi.fn(),
          onAddEditModeChange: vi.fn(),
          onAddSubmit: vi.fn(),
          onSelect: vi.fn(),
          onToggle: vi.fn(),
          onFormPatch: vi.fn(),
          onRawChange: vi.fn(),
          onEditModeChange: vi.fn(),
          onEditConnectionTypeChange: vi.fn(),
          onSave: vi.fn(),
          onCancel: vi.fn(),
          onDelete: vi.fn(),
        })}
        ${renderModels({
          providers: {
            custom: {
              displayName: "Custom",
              models: [{ id: "gpt-test", name: "GPT Test" }],
            },
          },
          modelEnv: { "custom/gpt-test": { API_KEY: "secret" } },
          defaultModelRef: null,
          loading: false,
          saving: false,
          selectedProvider: "custom",
          providerSearchQuery: "",
          viewMode: "card",
          formDirty: false,
          addProviderModalOpen: true,
          addProviderForm: {
            providerId: "",
            displayName: "",
            baseUrl: "",
            apiKey: "",
            apiKeyPrefix: "",
          },
          addModelModalOpen: false,
          addModelForm: { modelId: "", modelName: "", contextWindow: "", maxTokens: "" },
          useModelModalOpen: false,
          useModelModalProvider: null,
          saveError: null,
          onRefresh: vi.fn(),
          onAddProvider: vi.fn(),
          onAddProviderModalClose: vi.fn(),
          onAddProviderFormChange: vi.fn(),
          onAddProviderSubmit: vi.fn(),
          onSelect: vi.fn(),
          onProviderSearchChange: vi.fn(),
          onViewModeChange: vi.fn(),
          onPatch: vi.fn(),
          onAddModel: vi.fn(),
          onAddModelModalClose: vi.fn(),
          onAddModelFormChange: vi.fn(),
          onAddModelSubmit: vi.fn(),
          onRemoveModel: vi.fn(),
          onPatchModel: vi.fn(),
          onPatchModelEnv: vi.fn(),
          onSave: vi.fn(),
          onCancel: vi.fn(),
          onUseModelClick: vi.fn(),
          onUseModelModalClose: vi.fn(),
          onUseModel: vi.fn(),
          onCancelUse: vi.fn(),
        })}
        ${renderChannelConfigPanel({
          connected: true,
          loading: false,
          snapshot: null,
          lastError: null,
          lastSuccessAt: null,
          whatsappMessage: null,
          whatsappQrDataUrl: null,
          whatsappConnected: null,
          whatsappBusy: false,
          weworkQrModalOpen: false,
          weworkQrModalLoading: false,
          weworkQrModalPolling: false,
          weworkQrModalSuccess: false,
          weworkQrModalError: null,
          weworkQrModalReplaceWarn: false,
          weworkQrModalAuthUrl: null,
          weworkQrModalGenPageUrl: null,
          weixinQrModalOpen: false,
          weixinQrModalLoading: false,
          weixinQrModalPolling: false,
          weixinQrModalSuccess: false,
          weixinQrModalError: null,
          weixinQrModalReplaceWarn: false,
          weixinQrModalImageSrc: null,
          weixinQrModalScanPageUrl: null,
          weixinQrModalScanned: false,
          configSchema: null,
          configSchemaLoading: false,
          configForm: {},
          configUiHints: {},
          configSaving: false,
          configFormDirty: false,
          selectedChannelId: "discord",
          nostrProfileFormState: null,
          nostrProfileAccountId: null,
          onRefresh: vi.fn(),
          onChannelSelect: vi.fn(),
          onWhatsAppStart: vi.fn(),
          onWhatsAppWait: vi.fn(),
          onWhatsAppLogout: vi.fn(),
          onWeWorkQrStart: vi.fn(),
          onWeWorkQrModalClose: vi.fn(),
          onWeixinQrStart: vi.fn(),
          onWeixinQrModalClose: vi.fn(),
          onConfigPatch: vi.fn(),
          onConfigSave: vi.fn(),
          onConfigReload: vi.fn(),
          onNostrProfileEdit: vi.fn(),
          onNostrProfileCancel: vi.fn(),
          onNostrProfileFieldChange: vi.fn(),
          onNostrProfileSave: vi.fn(),
          onNostrProfileImport: vi.fn(),
          onNostrProfileToggleAdvanced: vi.fn(),
        })}
      `,
      container,
    );

    const closeButtons = container.querySelectorAll(".btn--icon svg");
    expect(closeButtons.length).toBeGreaterThanOrEqual(5);
  });
});
