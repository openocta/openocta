import { html, nothing, type TemplateResult } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { icons } from "../icons.js";
import { nativeConfirm } from "../native-dialog-bridge.ts";
import { t } from "../strings.js";

export type McpServerEntry = {
  enabled?: boolean | null;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  service?: string;
  serviceUrl?: string;
  toolPrefix?: string;
};

export type McpViewMode = "list" | "card";

export type McpProps = {
  servers: Record<string, McpServerEntry>;
  loading: boolean;
  saving: boolean;
  selectedKey: string | null;
  viewMode: McpViewMode;
  addModalOpen: boolean;
  addName: string;
  addDraft: McpServerEntry;
  addConnectionType: "stdio" | "url" | "service";
  addEditMode: "form" | "raw";
  addFormDirty: boolean;
  addRawJson: string;
  addRawError: string | null;
  editMode: "form" | "raw";
  editConnectionType: "stdio" | "url" | "service";
  formDirty: boolean;
  rawJson: string;
  rawError: string | null;
  onRefresh: () => void;
  onViewModeChange: (mode: McpViewMode) => void;
  onAddServer: () => void;
  onAddClose: () => void;
  onAddNameChange: (name: string) => void;
  onAddFormPatch: (patch: Partial<McpServerEntry>) => void;
  onAddRawChange: (json: string) => void;
  onAddConnectionTypeChange: (type: "stdio" | "url" | "service") => void;
  onAddEditModeChange: (mode: "form" | "raw") => void;
  onAddSubmit: () => void;
  onSelect: (key: string | null) => void;
  onToggle: (key: string, enabled: boolean) => void;
  onFormPatch: (key: string, patch: Partial<McpServerEntry>) => void;
  onRawChange: (key: string, json: string) => void;
  onEditModeChange: (mode: "form" | "raw") => void;
  onEditConnectionTypeChange: (type: "stdio" | "url" | "service") => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (key: string) => void;
};

function resolveServerLabel(key: string): string {
  const labels: Record<string, string> = {
    prometheus: "Prometheus",
    elasticsearch: "Elasticsearch",
    filesystem: "Filesystem",
  };
  return labels[key.toLowerCase()] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function getConnectionType(entry: McpServerEntry): string {
  if (entry.command) {
    return "stdio";
  }
  if (entry.url) {
    return "url";
  }
  if (entry.service && entry.serviceUrl) {
    return "service";
  }
  return "—";
}

function formatEnvForEdit(env: Record<string, string> | undefined): string {
  if (!env || typeof env !== "object") return "";
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

function isAddFormValid(props: McpProps): boolean {
  return isMcpAddFormValid(props.addDraft, props.addConnectionType, props.addEditMode, props.addRawError);
}

/** Exported for reuse in tool-library add modal. */
export function isMcpAddFormValid(
  draft: McpServerEntry | Record<string, unknown> | undefined,
  connectionType: "stdio" | "url" | "service",
  editMode: "form" | "raw",
  rawError: string | null,
): boolean {
  if (editMode === "raw") return !rawError;
  const d = draft as McpServerEntry | undefined;
  const t = connectionType ?? "stdio";
  if (t === "stdio") return !!d?.command?.trim();
  if (t === "url") return !!d?.url?.trim();
  if (t === "service") return !!d?.service?.trim() && !!d?.serviceUrl?.trim();
  return false;
}

function parseEnvFromEdit(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key) out[key] = val;
    }
  }
  return out;
}

function showMcpTooltip(e: Event) {
  const target = e.currentTarget as HTMLElement;
  const hint = target.classList.contains("mcp-field-hint")
    ? target
    : (target.closest(".mcp-field-hint") as HTMLElement);
  if (!hint) return;
  const tooltip = hint.querySelector(".mcp-field-hint__tooltip") as HTMLElement;
  if (!tooltip) return;
  const rect = hint.getBoundingClientRect();
  tooltip.style.left = rect.left + "px";
  tooltip.style.top = rect.bottom + 6 + "px";
  tooltip.classList.add("is-visible");
}

function hideMcpTooltip(e: Event) {
  const target = e.currentTarget as HTMLElement;
  const hint = target.classList.contains("mcp-field-hint")
    ? target
    : (target.closest(".mcp-field-hint") as HTMLElement);
  if (!hint) return;
  const tooltip = hint.querySelector(".mcp-field-hint__tooltip") as HTMLElement;
  if (!tooltip) return;
  window.setTimeout(() => {
    if (!hint.matches(":hover") && !tooltip.matches(":hover")) {
      tooltip.classList.remove("is-visible");
    }
  }, 100);
}

/** 渲染带悬浮提示的字段 label，tooltip 使用 position: fixed 跳出 modal overflow 裁剪 */
export function renderFieldLabelWithTooltip(label: string, tooltipText: string) {
  return html`
    <span style="display: flex; align-items: center; gap: 6px;">
      ${label}
      <span class="mcp-field-hint" @mouseenter=${showMcpTooltip} @mouseleave=${hideMcpTooltip}>
        ${icons.info}
        <span class="mcp-field-hint__tooltip" @mouseenter=${showMcpTooltip} @mouseleave=${hideMcpTooltip}>${tooltipText}</span>
      </span>
    </span>
  `;
}

const MCP_COMMAND_PRESETS = ["npx", "docker", "uv"] as const;

/** 与配置 JSON 对齐：trim；自定义 command（或带空格）不得误显示为 npx。 */
function mcpStdioCommandSelectModel(command: string | undefined): {
  value: string;
  options: readonly string[];
} {
  const trimmed = (command ?? "").trim();
  const presets = MCP_COMMAND_PRESETS as readonly string[];
  if (!trimmed) {
    return { value: "", options: ["", ...presets] };
  }
  if (presets.includes(trimmed)) {
    return { value: trimmed, options: presets };
  }
  return { value: trimmed, options: [trimmed, ...presets.filter((p) => p !== trimmed)] };
}

/**
 * Lit 复用 <select>/<option> 时 .value 与展示经常不同步（仍显示第一项 npx）。
 * 用 keyed 在 model 变化时重建节点，并用 option 的 ?selected 绑定选中项。
 */
function renderMcpStdioCommandSelect(
  sel: string,
  options: readonly string[],
  identityKey: string,
  onPick: (command: string) => void,
) {
  const k = `${identityKey}\0${sel}\0${options.join("\0")}`;
  // keyed 第二参数必须是 TemplateResult；传函数会被当成文本渲染成「乱码」。
  return keyed(
    k,
    html`
      <select @change=${(e: Event) => onPick((e.target as HTMLSelectElement).value)}>
        ${options.map((c) => html`<option value=${c} ?selected=${c === sel}>${c || "请选择命令类型"}</option>`)}
      </select>
    `,
  );
}

/** Exported for reuse in tool-library add modal. */
export function renderMcpAddConnectionFields(
  type: "stdio" | "url" | "service",
  draft: McpServerEntry | undefined,
  onPatch: (p: Partial<McpServerEntry>) => void,
): TemplateResult {
  if (type === "stdio") {
    const { value: sel, options } = mcpStdioCommandSelectModel(draft?.command);
    return html`
      <div class="field">
        <span>${t("mcpCommand")} *</span>
        <span class="select">
          ${renderMcpStdioCommandSelect(sel, options, "mcp-add", (cmd) => onPatch({ command: cmd }))}
        </span>
      </div>
      <div class="field">
        <span>${t("mcpArgs")}</span>
        <span class="input"><input
          type="text"
          .value={(draft?.args ?? []).join(" ")}
          placeholder="-y prometheus-mcp-server"
          @input=${(e: Event) => {
            const val = (e.target as HTMLInputElement).value;
            onPatch({ args: val.trim() ? val.trim().split(/\s+/) : [] });
          }}
        /></span>
      </div>
      <div class="field">
        ${renderFieldLabelWithTooltip(
          t("mcpEnv"),"每行一个环境变量，格式为 KEY=VALUE\n例如：\nAPI_KEY=your-api-key\nDEBUG=true",
        )}
        <span class="textarea"><textarea
          style="min-height: 80px; font-family: var(--mono); font-size: 12px;"
          .value=${formatEnvForEdit(draft?.env)}
          @input=${(e: Event) => {
            const val = (e.target as HTMLTextAreaElement).value;
            onPatch({ env: parseEnvFromEdit(val) });
          }}
        ></textarea></span>
      </div>
    `;
  }
  if (type === "url") {
    return html`
      <div class="field">
        <span>${t("mcpUrl")} *</span>
        <span class="input"><input
          type="text"
          .value=${draft?.url ?? ""}
          placeholder="https://mcp.example.com/sse"
          @input=${(e: Event) => onPatch({ url: (e.target as HTMLInputElement).value })}
        /></span>
      </div>
    `;
  }
  return html`
    <div class="field">
      <span>${t("mcpService")} *</span>
      <span class="input"><input
        type="text"
        .value=${draft?.service ?? ""}
        placeholder="prometheus"
        @input=${(e: Event) => onPatch({ service: (e.target as HTMLInputElement).value })}
      /></span>
    </div>
    <div class="field">
      <span>${t("mcpServiceUrl")} *</span>
      <span class="input"><input
        type="text"
        .value=${draft?.serviceUrl ?? ""}
        placeholder="http://localhost:9090"
        @input=${(e: Event) => onPatch({ serviceUrl: (e.target as HTMLInputElement).value })}
      /></span>
    </div>
  `;
}

function renderEditConnectionTypeFields(
  type: "stdio" | "url" | "service",
  selected: McpServerEntry,
  selectedKey: string,
  onFormPatch: (key: string, p: Partial<McpServerEntry>) => void,
): TemplateResult {
  if (type === "stdio") {
    const { value: sel, options } = mcpStdioCommandSelectModel(selected.command);
    return html`
      <div class="field">
        <span>${t("mcpCommand")} *</span>
        <span class="select">
          ${renderMcpStdioCommandSelect(sel, options, `mcp-edit:${selectedKey}`, (cmd) =>
            onFormPatch(selectedKey, { command: cmd }),
          )}
        </span>
      </div>
      <div class="field">
        <span>${t("mcpArgs")}</span>
        <span class="input"><input
          type="text"
          .value=${(selected.args ?? []).join(" ")}
          placeholder="-y prometheus-mcp-server"
          @input=${(e: Event) => {
            const val = (e.target as HTMLInputElement).value;
            onFormPatch(selectedKey, { args: val.trim() ? val.trim().split(/\s+/) : [] });
          }}
        /></span>
      </div>
      <div class="field">
        ${renderFieldLabelWithTooltip(
          t("mcpEnv"),"每行一个环境变量，格式为 KEY=VALUE\n例如：\nAPI_KEY=your-api-key\nDEBUG=true",
        )}
        <span class="textarea"><textarea
          style="min-height: 80px; font-family: var(--mono); font-size: 12px;"
          .value=${formatEnvForEdit(selected.env)}
          @input=${(e: Event) => {
            const val = (e.target as HTMLTextAreaElement).value;
            onFormPatch(selectedKey, { env: parseEnvFromEdit(val) });
          }}
        ></textarea></span>
      </div>
    `;
  }
  if (type === "url") {
    return html`
      <div class="field">
        <span>${t("mcpUrl")} *</span>
        <span class="input"><input
          type="text"
          .value=${selected.url ?? ""}
          placeholder="https://mcp.example.com/sse"
          @input=${(e: Event) =>
            onFormPatch(selectedKey, { url: (e.target as HTMLInputElement).value })}
        /></span>
      </div>
    `;
  }
  return html`
    <div class="field">
      <span>${t("mcpService")} *</span>
      <span class="input"><input
        type="text"
        .value=${selected.service ?? ""}
        placeholder="prometheus"
        @input=${(e: Event) =>
          onFormPatch(selectedKey, { service: (e.target as HTMLInputElement).value })}
      /></span>
    </div>
    <div class="field">
      <span>${t("mcpServiceUrl")} *</span>
      <span class="input"><input
        type="text"
        .value=${selected.serviceUrl ?? ""}
        placeholder="http://localhost:9090"
        @input=${(e: Event) =>
          onFormPatch(selectedKey, { serviceUrl: (e.target as HTMLInputElement).value })}
      /></span>
    </div>
  `;
}

/** MCP 编辑弹框的 props，可独立于 MCP 页面使用（如工具库） */
export type McpEditModalProps = {
  open: boolean;
  serverKey: string;
  entry: McpServerEntry;
  editMode: "form" | "raw";
  editConnectionType: "stdio" | "url" | "service";
  formDirty: boolean;
  rawJson: string;
  rawError: string | null;
  saving: boolean;
  onFormPatch: (key: string, patch: Partial<McpServerEntry>) => void;
  onRawChange: (key: string, json: string) => void;
  onEditModeChange: (mode: "form" | "raw") => void;
  onEditConnectionTypeChange: (type: "stdio" | "url" | "service") => void;
  onSave: () => void;
  onCancel: () => void;
};

function resolveServerLabelForModal(key: string): string {
  return resolveServerLabel(key);
}

export function renderMcpEditModal(props: McpEditModalProps) {
  if (!props.open) return nothing;
  const { serverKey, entry } = props;
  return html`
    <div class="modal-overlay" @click=${props.onCancel}>
      <div class="modal card" style="max-width: 560px;" @click=${(e: Event) => e.stopPropagation()}>
        <div class="card-title">${resolveServerLabelForModal(serverKey)} ${t("configSettingsTitle")}</div>
        <div class="row" style="margin-bottom: 12px; gap: 8px;">
          <button
            class="btn ${props.editMode === "form" ? "primary" : ""}"
            @click=${() => props.onEditModeChange("form")}
          >
            ${t("mcpFormMode")}
          </button>
          <button
            class="btn ${props.editMode === "raw" ? "primary" : ""}"
            @click=${() => {
              props.onEditModeChange("raw");
              props.onRawChange(serverKey, JSON.stringify(entry, null, 2));
            }}
          >
            ${t("mcpRawMode")}
          </button>
        </div>
        ${
          props.editMode === "form"
            ? html`
                <div class="config-form">
                  <div class="field">
                    <div class="row" style="align-items: center; gap: 8px; flex-wrap: nowrap;">
                      <span>${t("mcpEnabledField")}</span>
                      <span class="checkbox"><input
                        type="checkbox"
                        ?checked=${entry.enabled !== false}
                        @change=${(e: Event) =>
                          props.onFormPatch(serverKey, {
                            enabled: (e.target as HTMLInputElement).checked,
                          })}
                      /></span>
                    </div>
                  </div>
                  <div class="mcp-connection-tabs" style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border, #333); padding-bottom: 4px;">
                    <button
                      type="button"
                      class="btn ${(props.editConnectionType ?? "stdio") === "stdio" ? "primary" : ""}"
                      style="flex: 1; min-width: 0;"
                      @click=${() => props.onEditConnectionTypeChange("stdio")}
                    >
                      ${t("mcpConnectionTypeStdio")}
                    </button>
                    <button
                      type="button"
                      class="btn ${(props.editConnectionType ?? "stdio") === "url" ? "primary" : ""}"
                      style="flex: 1; min-width: 0;"
                      @click=${() => props.onEditConnectionTypeChange("url")}
                    >
                      ${t("mcpConnectionTypeUrl")}
                    </button>
                    <button
                      type="button"
                      class="btn ${(props.editConnectionType ?? "stdio") === "service" ? "primary" : ""}"
                      style="flex: 1; min-width: 0;"
                      @click=${() => props.onEditConnectionTypeChange("service")}
                    >
                      ${t("mcpConnectionTypeService")}
                    </button>
                  </div>
                  <div class="mcp-connection-fields" style="margin-bottom: 12px;">
                    ${renderEditConnectionTypeFields(
                      props.editConnectionType === "stdio" || props.editConnectionType === "url" || props.editConnectionType === "service"
                        ? props.editConnectionType
                        : "stdio",
                      entry,
                      serverKey,
                      props.onFormPatch,
                    )}
                  </div>
                  <div class="field">
                    <span>${t("mcpToolPrefix")}</span>
                    <span class="input"><input
                      type="text"
                      .value=${entry.toolPrefix ?? ""}
                      placeholder="Optional"
                      @input=${(e: Event) =>
                        props.onFormPatch(serverKey, {
                          toolPrefix: (e.target as HTMLInputElement).value,
                        })}
                    /></span>
                  </div>
                </div>
              `
            : html`
                <div class="field">
                  ${renderFieldLabelWithTooltip(
                    t("mcpRawJson"),
                    'JSON 格式示例：\n{\n  "command": "npx",\n  "args": ["-y", "prometheus-mcp-server"],\n  "env": { "API_KEY": "xxx" }\n}\n或 URL 形式：\n{\n  "url": "https://mcp.example.com/sse"\n}',
                  )}
                  <span class="textarea"><textarea
                    style="min-height: 200px; font-family: var(--mono);"
                    .value=${props.rawJson}
                    @input=${(e: Event) =>
                      props.onRawChange(serverKey, (e.target as HTMLTextAreaElement).value)}
                  ></textarea></span>
                  ${
                    props.rawError
                      ? html`<div class="callout danger" style="margin-top: 8px;">${props.rawError}</div>`
                      : nothing
                  }
                </div>
              `
        }
        <div class="row" style="margin-top: 16px; gap: 8px;">
          <button
            class="btn primary"
            ?disabled=${props.saving || (!props.formDirty && props.editMode === "form")}
            @click=${props.onSave}
          >
            ${props.saving ? t("commonSaving") : t("commonSave")}
          </button>
          <button class="btn" ?disabled=${props.saving} @click=${props.onCancel}>
            ${t("commonCancel")}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderMcp(props: McpProps) {
  const entries = Object.entries(props.servers ?? {});
  const selected = props.selectedKey ? props.servers[props.selectedKey] : null;

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">${t("navTitleMcp")}</div>
          <div class="card-sub">${t("subtitleMcp")}</div>
        </div>
        <div class="row" style="gap: 8px; align-items: center;">
          <div class="row" style="gap: 4px;" title=${t("mcpViewList")}>
            <button
              type="button"
              class="btn ${props.viewMode === "list" ? "primary" : ""}"
              style="padding: 6px 10px;"
              @click=${() => props.onViewModeChange("list")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              class="btn ${props.viewMode === "card" ? "primary" : ""}"
              style="padding: 6px 10px;"
              @click=${() => props.onViewModeChange("card")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
          <button class="btn primary" ?disabled=${props.loading} @click=${props.onAddServer}>
            ${t("mcpAddServer")}
          </button>
          <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
            ${props.loading ? t("commonLoading") : t("commonRefresh")}
          </button>
        </div>
      </div>

      ${
        props.addModalOpen
          ? html`
              <div class="modal-overlay" @click=${props.onAddClose}>
                <div class="modal card" style="max-width: 520px;" @click=${(e: Event) => e.stopPropagation()}>
                  <div class="card-title">${t("mcpAddServer")}</div>
                  <div class="field" style="margin-top: 12px;">
                    <span>${t("mcpServerName")} *</span>
                    <span class="input"><input
                      type="text"
                      .value=${props.addName}
                      @input=${(e: Event) => props.onAddNameChange((e.target as HTMLInputElement).value)}
                      placeholder="prometheus, my-mcp"
                    /></span>
                  </div>
                  <div class="row" style="margin: 12px 0; gap: 8px;">
                    <button
                      class="btn ${props.addEditMode === "form" ? "primary" : ""}"
                      @click=${() => props.onAddEditModeChange("form")}
                    >
                      ${t("mcpFormMode")}
                    </button>
                    <button
                      class="btn ${props.addEditMode === "raw" ? "primary" : ""}"
                      @click=${() => props.onAddEditModeChange("raw")}
                    >
                      ${t("mcpRawMode")}
                    </button>
                  </div>
                  ${
                    props.addEditMode === "form"
                      ? html`
                          <div class="config-form" id="mcp-add-form">
                            <div class="mcp-connection-tabs" style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border, #333); padding-bottom: 4px;">
                              <button
                                type="button"
                                class="btn ${(props.addConnectionType ?? "stdio") === "stdio" ? "primary" : ""}"
                                style="flex: 1; min-width: 0;"
                                @click=${() => props.onAddConnectionTypeChange("stdio")}
                              >
                                ${t("mcpConnectionTypeStdio")}
                              </button>
                              <button
                                type="button"
                                class="btn ${(props.addConnectionType ?? "stdio") === "url" ? "primary" : ""}"
                                style="flex: 1; min-width: 0;"
                                @click=${() => props.onAddConnectionTypeChange("url")}
                              >
                                ${t("mcpConnectionTypeUrl")}
                              </button>
                              <button
                                type="button"
                                class="btn ${(props.addConnectionType ?? "stdio") === "service" ? "primary" : ""}"
                                style="flex: 1; min-width: 0;"
                                @click=${() => props.onAddConnectionTypeChange("service")}
                              >
                                ${t("mcpConnectionTypeService")}
                              </button>
                            </div>
                            <div class="mcp-connection-fields" style="margin-bottom: 12px;">
                              ${renderMcpAddConnectionFields(
                                props.addConnectionType === "stdio" || props.addConnectionType === "url" || props.addConnectionType === "service"
                                  ? props.addConnectionType
                                  : "stdio",
                                props.addDraft,
                                (p) => props.onAddFormPatch(p),
                              )}
                            </div>
                            <div class="field">
                              <span>${t("mcpToolPrefix")}</span>
                              <span class="input"><input
                                type="text"
                                .value=${props.addDraft?.toolPrefix ?? ""}
                                placeholder="Optional"
                                @input=${(e: Event) =>
                                  props.onAddFormPatch({ toolPrefix: (e.target as HTMLInputElement).value })}
                              /></span>
                            </div>
                          </div>
                        `
                      : html`
                          <div class="field">
                            ${renderFieldLabelWithTooltip(
                              t("mcpRawJson"),
                              'JSON 格式示例：\n{\n  "command": "npx",\n  "args": ["-y", "prometheus-mcp-server"],\n  "env": { "API_KEY": "xxx" }\n}\n或 URL 形式：\n{\n  "url": "https://mcp.example.com/sse"\n}',
                            )}
                            <span class="textarea"><textarea
                              style="min-height: 180px; font-family: var(--mono);"
                              .value=${props.addRawJson}
                              @input=${(e: Event) =>
                                props.onAddRawChange((e.target as HTMLTextAreaElement).value)}
                            ></textarea></span>
                            ${
                              props.addRawError
                                ? html`<div class="callout danger" style="margin-top: 8px;">${props.addRawError}</div>`
                                : nothing
                            }
                          </div>
                        `
                  }
                  <div class="row" style="margin-top: 16px; gap: 8px; justify-content: flex-end;">
                    <button class="btn" @click=${props.onAddClose}>${t("commonCancel")}</button>
                    <button
                      class="btn primary"
                      ?disabled=${props.saving || !props.addName.trim() || !isAddFormValid(props)}
                      @click=${props.onAddSubmit}
                    >
                      ${props.saving ? t("commonSaving") : t("mcpAddServer")}
                    </button>
                  </div>
                </div>
              </div>
            `
          : nothing
      }

      <div class="mcp-server-list" style="margin-top: 16px;">
        ${
          entries.length === 0
            ? html`
                <div class="muted" style="margin-top: 12px;">
                  ${t("mcpNoServers")}
                </div>
              `
            : props.viewMode === "list"
              ? html`
                  <div class="mcp-table table" style="margin-top: 0;">
                    <div class="mcp-table-head table-head">
                      <div>${t("mcpTableName")}</div>
                      <div>${t("mcpTableType")}</div>
                      <div>${t("mcpTableStatus")}</div>
                      <div>${t("mcpTableActions")}</div>
                    </div>
                    ${entries.map(
                      ([key, entry]) => html`
                        <div
                          class="mcp-table-row table-row ${props.selectedKey === key ? "list-item-selected" : ""}"
                          style="cursor: pointer;"
                          @click=${() => props.onSelect(props.selectedKey === key ? null : key)}
                        >
                          <div class="mcp-table-cell" style="font-weight: 500;">
                            ${resolveServerLabel(key)}
                          </div>
                          <div class="mcp-table-cell muted" style="font-size: 13px;">
                            ${getConnectionType(entry)}
                          </div>
                          <div class="mcp-table-cell">
                            <span class="chip ${entry.enabled !== false ? "chip-ok" : ""}" style="font-size: 12px;">
                              ${entry.enabled !== false ? t("mcpEnabled") : t("mcpDisabled")}
                            </span>
                          </div>
                          <div class="mcp-table-cell row" style="gap: 6px; justify-content: flex-start;" @click=${(e: Event) => e.stopPropagation()}>
                            <button
                              class="btn btn--sm ${entry.enabled !== false ? "btn-ok" : ""}"
                              ?disabled=${props.saving}
                              @click=${(e: Event) => {
                                e.stopPropagation();
                                props.onToggle(key, entry.enabled === false);
                              }}
                            >
                              ${entry.enabled !== false ? t("mcpEnabled") : t("mcpDisabled")}
                            </button>
                            <button
                              class="btn btn--sm"
                              ?disabled=${props.saving}
                              @click=${(e: Event) => {
                                e.stopPropagation();
                                props.onSelect(props.selectedKey === key ? null : key);
                              }}
                            >
                              ${t("channelsConfigure")}
                            </button>
                            <button
                              class="btn btn--sm"
                              style="color: var(--danger-color, #d14343);"
                              ?disabled=${props.saving}
                              @click=${async (e: Event) => {
                                e.stopPropagation();
                                if (await nativeConfirm(t("mcpDeleteConfirm"))) {
                                  props.onDelete(key);
                                }
                              }}
                            >
                              ${t("commonDelete")}
                            </button>
                          </div>
                        </div>
                      `,
                    )}
                  </div>
                `
              : html`
                  <div class="mcp-card-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
                    ${entries.map(
                      ([key, entry]) => html`
                        <div
                          class="mcp-server-card ${props.selectedKey === key ? "list-item-selected" : ""}"
                          style="cursor: pointer;"
                          @click=${() => props.onSelect(props.selectedKey === key ? null : key)}
                        >
                          <div class="mcp-server-card__header">
                            <div class="mcp-server-card__icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="4" y="4" width="8" height="8" rx="1"/>
                                <rect x="12" y="12" width="8" height="8" rx="1"/>
                              </svg>
                            </div>
                            <div class="mcp-server-card__title-row" style="min-width: 0;">
                              <span class="mcp-server-card__name">${resolveServerLabel(key)}</span>
                              <span class="chip" style="font-size: 11px;">${getConnectionType(entry)}</span>
                            </div>
                          </div>
                          <div class="mcp-server-card__footer" @click=${(e: Event) => e.stopPropagation()}>
                            <button
                              class="btn btn--sm ${entry.enabled !== false ? "btn-ok" : ""}"
                              ?disabled=${props.saving}
                              @click=${(e: Event) => {
                                e.stopPropagation();
                                props.onToggle(key, entry.enabled === false);
                              }}
                            >
                              ${entry.enabled !== false ? t("mcpEnabled") : t("mcpDisabled")}
                            </button>
                            <button
                              class="btn btn--sm"
                              ?disabled=${props.saving}
                              @click=${(e: Event) => {
                                e.stopPropagation();
                                props.onSelect(props.selectedKey === key ? null : key);
                              }}
                            >
                              ${t("channelsConfigure")}
                            </button>
                            <button
                              class="btn btn--sm"
                              style="color: var(--danger-color, #d14343); padding: 4px 8px;"
                              ?disabled=${props.saving}
                              @click=${async (e: Event) => {
                                e.stopPropagation();
                                if (await nativeConfirm(t("mcpDeleteConfirm"))) {
                                  props.onDelete(key);
                                }
                              }}
                              title=${t("commonDelete")}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      `,
                    )}
                  </div>
                `
        }
      </div>
    </section>

    ${
      props.selectedKey && selected
        ? html`
            <div class="channel-panel-overlay" @click=${(e: Event) => {
              if ((e.target as HTMLElement).classList.contains("channel-panel-overlay")) {
                props.onCancel();
              }
            }}>
              <div class="channel-panel card" @click=${(e: Event) => e.stopPropagation()}>
                <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                  <div class="card-title">${resolveServerLabel(props.selectedKey)} ${t("configSettingsTitle")}</div>
                  <button class="btn btn--icon" type="button" aria-label="关闭" @click=${props.onCancel}>
                    ${icons.x}
                  </button>
                </div>
                <div class="channel-panel-content">
                  <div class="row" style="margin-bottom: 12px; gap: 8px;">
                    <button
                      class="btn ${props.editMode === "form" ? "primary" : ""}"
                      @click=${() => props.onEditModeChange("form")}
                    >
                      ${t("mcpFormMode")}
                    </button>
                    <button
                      class="btn ${props.editMode === "raw" ? "primary" : ""}"
                      @click=${() => {
                        props.onEditModeChange("raw");
                        props.onRawChange(props.selectedKey!, JSON.stringify(selected, null, 2));
                      }}
                    >
                      ${t("mcpRawMode")}
                    </button>
                  </div>

                  ${
                    props.editMode === "form"
                      ? html`
                          <div class="config-form">
                            <div class="field">
                              <div class="row" style="align-items: center; gap: 8px; flex-wrap: nowrap;">
                                <span>${t("mcpEnabledField")}</span>
                                <span class="checkbox"><input
                                  type="checkbox"
                                  ?checked=${selected.enabled !== false}
                                  @change=${(e: Event) =>
                                    props.onFormPatch(props.selectedKey!, {
                                      enabled: (e.target as HTMLInputElement).checked,
                                    })}
                                /></span>
                              </div>
                            </div>
                            <div class="mcp-connection-tabs" style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border, #333); padding-bottom: 4px;">
                              <button
                                type="button"
                                class="btn ${(props.editConnectionType ?? "stdio") === "stdio" ? "primary" : ""}"
                                style="flex: 1; min-width: 0;"
                                @click=${() => props.onEditConnectionTypeChange("stdio")}
                              >
                                ${t("mcpConnectionTypeStdio")}
                              </button>
                              <button
                                type="button"
                                class="btn ${(props.editConnectionType ?? "stdio") === "url" ? "primary" : ""}"
                                style="flex: 1; min-width: 0;"
                                @click=${() => props.onEditConnectionTypeChange("url")}
                              >
                                ${t("mcpConnectionTypeUrl")}
                              </button>
                              <button
                                type="button"
                                class="btn ${(props.editConnectionType ?? "stdio") === "service" ? "primary" : ""}"
                                style="flex: 1; min-width: 0;"
                                @click=${() => props.onEditConnectionTypeChange("service")}
                              >
                                ${t("mcpConnectionTypeService")}
                              </button>
                            </div>
                            <div class="mcp-connection-fields" style="margin-bottom: 12px;">
                              ${renderEditConnectionTypeFields(
                                props.editConnectionType === "stdio" || props.editConnectionType === "url" || props.editConnectionType === "service"
                                  ? props.editConnectionType
                                  : "stdio",
                                selected,
                                props.selectedKey!,
                                props.onFormPatch,
                              )}
                            </div>
                            <div class="field">
                              <span>${t("mcpToolPrefix")}</span>
                              <span class="input"><input
                                type="text"
                                .value=${selected.toolPrefix ?? ""}
                                placeholder="Optional"
                                @input=${(e: Event) =>
                                  props.onFormPatch(props.selectedKey!, {
                                    toolPrefix: (e.target as HTMLInputElement).value,
                                  })}
                              /></span>
                            </div>
                          </div>
                        `
                      : html`
                          <div class="field">
                            <span style="display: flex; align-items: center; gap: 6px;">
                              ${t("mcpRawJson")}
                              <span class="mcp-field-hint">
                                ${icons.info}
                                <span class="mcp-field-hint__tooltip">JSON 格式示例：
{
  "command": "npx",
  "args": ["-y", "prometheus-mcp-server"],
  "env": { "API_KEY": "xxx" }
}
或 URL 形式：
{
  "url": "https://mcp.example.com/sse"
}</span>
                              </span>
                            </span>
                            <span class="textarea"><textarea
                              style="min-height: 200px; font-family: var(--mono);"
                              .value=${props.rawJson}
                              @input=${(e: Event) =>
                                props.onRawChange(props.selectedKey!, (e.target as HTMLTextAreaElement).value)}
                            ></textarea></span>
                            ${
                              props.rawError
                                ? html`<div class="callout danger" style="margin-top: 8px;">${props.rawError}</div>`
                                : nothing
                            }
                          </div>
                        `
                  }

                  <div class="row" style="margin-top: 16px; gap: 8px;">
                    <button
                      class="btn primary"
                      ?disabled=${props.saving || (!props.formDirty && props.editMode === "form")}
                      @click=${props.onSave}
                    >
                      ${props.saving ? t("commonSaving") : t("commonSave")}
                    </button>
                    <button class="btn btn--icon" type="button" aria-label="关闭" ?disabled=${props.saving} @click=${props.onCancel}>
                      ${icons.x}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `
        : nothing
    }
  `;
}
