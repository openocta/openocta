import { html, nothing, type TemplateResult } from "lit";
import { icons } from "../icons.js";
import { t } from "../strings.js";
import type { McpServerEntry } from "./mcp.js";

export type DigitalEmployee = {
  id: string;
  name: string;
  description: string;
  builtin: boolean;
  enabled?: boolean;
  createdAt?: number;
  skillIds?: string[];
  skillNames?: string[];
  mcpServerKeys?: string[];
};

export type DigitalEmployeeViewMode = "list" | "card";

export type DigitalEmployeeProps = {
  loading: boolean;
  employees: DigitalEmployee[];
  error: string | null;
  filter: string;
  viewMode: DigitalEmployeeViewMode;
  onRefresh: () => void;
  onFilterChange: (next: string) => void;
  onViewModeChange: (mode: DigitalEmployeeViewMode) => void;
  onOpenEmployee: (employeeId: string) => void;
  onCopy: (employeeId: string) => void;
  // 创建
  createModalOpen: boolean;
  createName: string;
  createDescription: string;
  createPrompt: string;
  createError: string | null;
  createBusy: boolean;
  advancedOpen: boolean;
  // MCP（创建）
  createMcpMode: "builder" | "raw";
  mcpJson: string;
  onMcpJsonChange: (value: string) => void;
  mcpItems: EmployeeMcpItem[];
  onMcpModeChange: (mode: "builder" | "raw") => void;
  onMcpAddItem: () => void;
  onMcpRemoveItem: (id: string) => void;
  onMcpCollapsedChange: (id: string, collapsed: boolean) => void;
  onMcpKeyChange: (id: string, key: string) => void;
  onMcpEditModeChange: (id: string, mode: "form" | "raw") => void;
  onMcpConnectionTypeChange: (id: string, type: "stdio" | "url" | "service") => void;
  onMcpFormPatch: (id: string, patch: Partial<McpServerEntry>) => void;
  onMcpRawChange: (id: string, json: string) => void;
  skillUploadName: string;
  skillUploadFiles: File[];
  skillUploadError: string | null;
  onCreateOpen: () => void;
  onCreateClose: () => void;
  onCreateNameChange: (value: string) => void;
  onCreateDescriptionChange: (value: string) => void;
  onCreatePromptChange: (value: string) => void;
  onCreateSubmit: () => void;
  onToggleAdvanced: () => void;
  onSkillUploadNameChange: (value: string) => void;
  onSkillUploadFilesChange: (files: File[]) => void;
  // 管理
  onToggleEnabled: (employeeId: string, enabled: boolean) => void;
  onDelete: (employeeId: string) => void;
  onEdit: (employeeId: string) => void;
  // 编辑
  editModalOpen: boolean;
  editId: string;
  editName: string;
  editDescription: string;
  editPrompt: string;
  editMcpJson: string;
  editMcpMode: "builder" | "raw";
  editMcpItems: EmployeeMcpItem[];
  onEditMcpModeChange: (mode: "builder" | "raw") => void;
  onEditMcpAddItem: () => void;
  onEditMcpRemoveItem: (id: string) => void;
  onEditMcpCollapsedChange: (id: string, collapsed: boolean) => void;
  onEditMcpKeyChange: (id: string, key: string) => void;
  onEditMcpEditModeChange: (id: string, mode: "form" | "raw") => void;
  onEditMcpConnectionTypeChange: (id: string, type: "stdio" | "url" | "service") => void;
  onEditMcpFormPatch: (id: string, patch: Partial<McpServerEntry>) => void;
  onEditMcpRawChange: (id: string, json: string) => void;
  editSkillNames: string[];
  editSkillFilesToUpload: File[];
  editSkillsToDelete: string[];
  editError: string | null;
  editBusy: boolean;
  onEditClose: () => void;
  onEditDescriptionChange: (value: string) => void;
  onEditPromptChange: (value: string) => void;
  onEditMcpJsonChange: (value: string) => void;
  onEditSkillFilesChange: (files: File[]) => void;
  onEditSkillDelete: (skillName: string) => void;
  onEditSkillUndoDelete: (skillName: string) => void;
  onEditSubmit: () => void;
};

export type EmployeeMcpItem = {
  id: string;
  key: string;
  editMode: "form" | "raw";
  connectionType: "stdio" | "url" | "service";
  draft: McpServerEntry;
  rawJson: string;
  rawError: string | null;
  collapsed: boolean;
};

/** 数字员工修改弹框的 props，可独立于数字员工页面使用 */
export type DigitalEmployeeEditModalProps = {
  editModalOpen: boolean;
  editId: string;
  editName: string;
  editDescription: string;
  editPrompt: string;
  editMcpJson: string;
  editMcpMode: "builder" | "raw";
  editMcpItems: EmployeeMcpItem[];
  onEditMcpModeChange: (mode: "builder" | "raw") => void;
  onEditMcpAddItem: () => void;
  onEditMcpRemoveItem: (id: string) => void;
  onEditMcpCollapsedChange: (id: string, collapsed: boolean) => void;
  onEditMcpKeyChange: (id: string, key: string) => void;
  onEditMcpEditModeChange: (id: string, mode: "form" | "raw") => void;
  onEditMcpConnectionTypeChange: (id: string, type: "stdio" | "url" | "service") => void;
  onEditMcpFormPatch: (id: string, patch: Partial<McpServerEntry>) => void;
  onEditMcpRawChange: (id: string, json: string) => void;
  editSkillNames: string[];
  editSkillFilesToUpload: File[];
  editSkillsToDelete: string[];
  editError: string | null;
  editBusy: boolean;
  onEditClose: () => void;
  onEditDescriptionChange: (value: string) => void;
  onEditPromptChange: (value: string) => void;
  onEditMcpJsonChange: (value: string) => void;
  onEditSkillFilesChange: (files: File[]) => void;
  onEditSkillDelete: (skillName: string) => void;
  onEditSkillUndoDelete: (skillName: string) => void;
  onEditSubmit: () => void;
};

export function renderDigitalEmployeeEditModal(props: DigitalEmployeeEditModalProps) {
  if (!props.editModalOpen) return nothing;
  return html`
    <div class="modal-overlay" @click=${props.onEditClose}>
      <div class="modal card" @click=${(e: Event) => e.stopPropagation()}>
        <div class="card-title">修改数字员工</div>
        <div class="field" style="margin-top: 12px;">
          <span>名称</span>
          <span class="input"><input type="text" .value=${props.editName} disabled /></span>
          <div class="list-sub muted" style="font-size: 11px; margin-top: 4px;">名称不可修改</div>
        </div>
        <div class="field" style="margin-top: 12px;">
          <span>描述</span>
          <span class="textarea"><textarea
            rows="4"
            .value=${props.editDescription}
            @input=${(e: Event) =>
              props.onEditDescriptionChange(
                (e.target as HTMLTextAreaElement).value,
              )}
          ></textarea></span>
        </div>
        <div class="field" style="margin-top: 12px;">
          <span>Prompt（可选）</span>
          <span class="textarea"><textarea
            rows="4"
            .value=${props.editPrompt}
            @input=${(e: Event) =>
              props.onEditPromptChange(
                (e.target as HTMLTextAreaElement).value,
              )}
            placeholder="为该数字员工编写系统提示/人设说明。"
          ></textarea></span>
        </div>
        <div class="field" style="margin-top: 12px;">
          <span>MCP 配置（可选）</span>
          <div class="row" style="margin-top: 6px; gap: 8px; flex-wrap: wrap;">
            <button
              class="btn ${props.editMcpMode === "builder" ? "primary" : ""}"
              type="button"
              @click=${() => props.onEditMcpModeChange("builder")}
            >
              点选配置
            </button>
            <button
              class="btn ${props.editMcpMode === "raw" ? "primary" : ""}"
              type="button"
              @click=${() => props.onEditMcpModeChange("raw")}
            >
              原生 JSON
            </button>
          </div>
          ${
            props.editMcpMode === "raw"
              ? html`
                  <span class="textarea"><textarea
                    rows="10"
                    style="margin-top: 8px;"
                    .value=${props.editMcpJson}
                    @input=${(e: Event) =>
                      props.onEditMcpJsonChange(
                        (e.target as HTMLTextAreaElement).value,
                      )}
                    placeholder='{
  "mcp-server": {
    "enabled": true,
    "command": "npx",
    "args": [
      "-y",
      "@example/mcp-server-name"
    ],
    "env": {
      "API_KEY": "your-api-key"
    }
  }
}'
                  ></textarea></span>
                  <div class="list-sub muted" style="font-size: 11px; margin-top: 4px;">
                    与主配置 mcp.servers 结构一致，会话时合并（同 key 时员工覆盖）
                  </div>
                `
              : html`
                  <div class="row" style="margin-top: 8px; justify-content: space-between; align-items: center;">
                    <div class="muted" style="font-size: 12px;">
                      可添加多个 MCP；配置完成后可折叠，避免页面过长。
                    </div>
                    <button class="btn btn--sm" type="button" @click=${props.onEditMcpAddItem}>
                      <span class="btn__icon">${icons.plus}</span>添加 MCP
                    </button>
                  </div>
                  <div style="margin-top: 8px; display: grid; gap: 10px;">
                    ${props.editMcpItems.map((item) =>
                      renderEmployeeMcpItem(item, {
                        onRemoveItem: props.onEditMcpRemoveItem,
                        onCollapsedChange: props.onEditMcpCollapsedChange,
                        onKeyChange: props.onEditMcpKeyChange,
                        onEditModeChange: props.onEditMcpEditModeChange,
                        onConnectionTypeChange: props.onEditMcpConnectionTypeChange,
                        onFormPatch: props.onEditMcpFormPatch,
                        onRawChange: props.onEditMcpRawChange,
                      }),
                    )}
                  </div>
                `
          }
        </div>
        <div class="field" style="margin-top: 12px;">
          <span>已有技能</span>
          ${
            props.editSkillNames.length === 0
              ? html`<div class="muted" style="font-size: 12px;">暂无技能</div>`
              : html`
                  <div class="row" style="flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                    ${props.editSkillNames.map(
                      (name) =>
                        html`
                          <span
                            class="chip"
                            style="display: inline-flex; align-items: center; gap: 4px;"
                          >
                            ${name}
                            ${!props.editSkillsToDelete.includes(name)
                              ? html`
                                  <button
                                    type="button"
                                    class="btn btn--sm"
                                    style="padding: 2px 6px; font-size: 11px;"
                                    @click=${() => props.onEditSkillDelete(name)}
                                  >
                                    删除
                                  </button>
                                `
                              : html`
                                  <span class="muted" style="font-size: 11px;"
                                    >已标记删除</span
                                  >
                                  <button
                                    type="button"
                                    class="btn btn--sm"
                                    style="padding: 2px 6px; font-size: 11px;"
                                    @click=${() => props.onEditSkillUndoDelete(name)}
                                  >
                                    撤销
                                  </button>
                                `}
                          </span>
                        `,
                    )}
                  </div>
                `
          }
        </div>
        <div class="field" style="margin-top: 12px;">
          <span>新上传技能文件（可多选）</span>
          <input
            type="file"
            accept=".md,.MD,.zip"
            multiple
            @change=${(e: Event) => {
              const input = e.target as HTMLInputElement;
              const files = input.files ? Array.from(input.files) : [];
              props.onEditSkillFilesChange(files);
            }}
          />
          ${
            props.editSkillFilesToUpload.length > 0
              ? html`
                  <div class="row" style="flex-wrap: wrap; gap: 4px; margin-top: 8px;">
                    ${props.editSkillFilesToUpload.map(
                      (f) =>
                        html`<span class="chip" style="font-size: 12px;"
                          >${f.name}</span
                        >`,
                    )}
                  </div>
                `
              : nothing
          }
        </div>
        ${
          props.editError
            ? html`
                <div class="callout danger" style="margin-top: 12px;">
                  ${props.editError}
                </div>
              `
            : nothing
        }
        <div class="row" style="margin-top: 16px; justify-content: flex-end; gap: 8px;">
          <button class="btn" ?disabled=${props.editBusy} @click=${props.onEditClose}>
            ${t("commonCancel")}
          </button>
          <button
            class="btn primary"
            ?disabled=${props.editBusy}
            @click=${props.onEditSubmit}
          >
            ${props.editBusy ? t("commonLoading") : "保存"}
          </button>
        </div>
      </div>
    </div>
  `;
}

type EmployeeMcpCallbacks = {
  onRemoveItem: (id: string) => void;
  onCollapsedChange: (id: string, collapsed: boolean) => void;
  onKeyChange: (id: string, key: string) => void;
  onEditModeChange: (id: string, mode: "form" | "raw") => void;
  onConnectionTypeChange: (id: string, type: "stdio" | "url" | "service") => void;
  onFormPatch: (id: string, patch: Partial<McpServerEntry>) => void;
  onRawChange: (id: string, json: string) => void;
};

export type DigitalEmployeeCreateModalProps = {
  createModalOpen: boolean;
  createName: string;
  createDescription: string;
  createPrompt: string;
  createError: string | null;
  createBusy: boolean;
  advancedOpen: boolean;
  createMcpMode: "builder" | "raw";
  mcpJson: string;
  mcpItems: EmployeeMcpItem[];
  skillUploadName: string;
  skillUploadFiles: File[];
  skillUploadError: string | null;
  onMcpJsonChange: (value: string) => void;
  onMcpModeChange: (mode: "builder" | "raw") => void;
  onMcpAddItem: () => void;
  onMcpRemoveItem: (id: string) => void;
  onMcpCollapsedChange: (id: string, collapsed: boolean) => void;
  onMcpKeyChange: (id: string, key: string) => void;
  onMcpEditModeChange: (id: string, mode: "form" | "raw") => void;
  onMcpConnectionTypeChange: (id: string, type: "stdio" | "url" | "service") => void;
  onMcpFormPatch: (id: string, patch: Partial<McpServerEntry>) => void;
  onMcpRawChange: (id: string, json: string) => void;
  onCreateClose: () => void;
  onCreateNameChange: (value: string) => void;
  onCreateDescriptionChange: (value: string) => void;
  onCreatePromptChange: (value: string) => void;
  onToggleAdvanced: () => void;
  onSkillUploadNameChange: (value: string) => void;
  onSkillUploadFilesChange: (files: File[]) => void;
  onCreateSubmit: () => void;
};

export function renderDigitalEmployeeCreateModal(props: DigitalEmployeeCreateModalProps) {
  if (!props.createModalOpen) return nothing;
  const employeeIdPreview = deriveEmployeeIdFromName(props.createName?.trim() ?? "");
  return html`
    <div class="modal-overlay" @click=${props.onCreateClose}>
      <div class="modal card" @click=${(e: Event) => e.stopPropagation()}>
        <div class="card-title">新增数字员工</div>
        <div class="field" style="margin-top: 12px;">
          <span>名称</span>
          <span class="input"><input
            type="text"
            .value=${props.createName}
            @input=${(e: Event) => props.onCreateNameChange((e.target as HTMLInputElement).value)}
            placeholder="如 SRE 运维专家"
          /></span>
          <div class="list-sub muted" style="font-size: 11px; margin-top: 4px;">名称唯一</div>
        </div>
        <div class="field" style="margin-top: 12px;">
          <span>描述</span>
          <span class="textarea"><textarea
            rows="4"
            .value=${props.createDescription}
            @input=${(e: Event) =>
              props.onCreateDescriptionChange((e.target as HTMLTextAreaElement).value)}
          ></textarea></span>
        </div>
        <div class="field" style="margin-top: 12px;">
          <span>Prompt（可选）</span>
          <span class="textarea"><textarea
            rows="4"
            .value=${props.createPrompt}
            @input=${(e: Event) =>
              props.onCreatePromptChange((e.target as HTMLTextAreaElement).value)}
            placeholder="为该数字员工编写系统提示/人设说明。"
          ></textarea></span>
        </div>
        <div class="field" style="margin-top: 12px;">
          <button class="btn secondary" type="button" @click=${props.onToggleAdvanced}>
            ${props.advancedOpen ? "收起高级配置" : "展开高级配置"}
          </button>
        </div>
        ${props.advancedOpen
          ? html`
              <div class="card" style="margin-top: 12px;">
                <div class="card-title" style="font-size: 13px; margin-bottom: 8px;">高级配置</div>
                <div class="list-sub muted" style="font-size: 12px; margin-bottom: 8px;">
                  预估 ID：<code>${employeeIdPreview}</code>（基于名称生成，用于专属技能目录
                  ~/.openocta/employee_skills/${employeeIdPreview}/...）
                </div>
                <div class="field" style="margin-top: 8px;">
                  <span>MCP 配置（可选）</span>
                  <div class="row" style="margin-top: 6px; gap: 8px; flex-wrap: wrap;">
                    <button
                      class="btn ${props.createMcpMode === "builder" ? "primary" : ""}"
                      type="button"
                      @click=${() => props.onMcpModeChange("builder")}
                    >
                      点选配置
                    </button>
                    <button
                      class="btn ${props.createMcpMode === "raw" ? "primary" : ""}"
                      type="button"
                      @click=${() => props.onMcpModeChange("raw")}
                    >
                      原生 JSON
                    </button>
                  </div>
                  ${props.createMcpMode === "raw"
                    ? html`
                        <span class="textarea"><textarea
                          rows="10"
                          style="margin-top: 8px;"
                          .value=${props.mcpJson}
                          @input=${(e: Event) =>
                            props.onMcpJsonChange((e.target as HTMLTextAreaElement).value)}
                          placeholder='{
  "mcp-server": {
    "enabled": true,
    "command": "npx",
    "args": [
      "-y",
      "@example/mcp-server-name"
    ],
    "env": {
      "API_KEY": "your-api-key"
    }
  }
}'
                        ></textarea></span>
                        <div class="list-sub muted" style="font-size: 11px; margin-top: 4px;">
                          与主配置 mcp.servers 结构一致，会话时合并（同 key 时员工覆盖）
                        </div>
                      `
                    : html`
                        <div class="row" style="margin-top: 8px; justify-content: space-between; align-items: center;">
                          <div class="muted" style="font-size: 12px;">
                            可添加多个 MCP；配置完成后可折叠，避免页面过长。
                          </div>
                          <button class="btn btn--sm" type="button" @click=${props.onMcpAddItem}>
                            <span class="btn__icon">${icons.plus}</span>添加 MCP
                          </button>
                        </div>
                        <div style="margin-top: 8px; display: grid; gap: 10px;">
                          ${props.mcpItems.map((item) =>
                            renderEmployeeMcpItem(item, {
                              onRemoveItem: props.onMcpRemoveItem,
                              onCollapsedChange: props.onMcpCollapsedChange,
                              onKeyChange: props.onMcpKeyChange,
                              onEditModeChange: props.onMcpEditModeChange,
                              onConnectionTypeChange: props.onMcpConnectionTypeChange,
                              onFormPatch: props.onMcpFormPatch,
                              onRawChange: props.onMcpRawChange,
                            }),
                          )}
                        </div>
                      `}
                </div>
                <div class="field" style="margin-top: 8px;">
                  <span>技能名称（可选）</span>
                  <span class="input"><input
                    type="text"
                    .value=${props.skillUploadName}
                    @input=${(e: Event) =>
                      props.onSkillUploadNameChange((e.target as HTMLInputElement).value)}
                    placeholder="不填则从文件名推导，如 prometheus-1.0.0.zip → prometheus-1.0.0"
                  /></span>
                </div>
                <div class="field" style="margin-top: 8px;">
                  <span>技能文件（SKILL.md 或 zip，可多选，提交时一并上传）</span>
                  <input
                    type="file"
                    accept=".md,.MD,.zip"
                    multiple
                    @change=${(e: Event) => {
                      const input = e.target as HTMLInputElement;
                      const files = input.files ? Array.from(input.files) : [];
                      props.onSkillUploadFilesChange(files);
                    }}
                  />
                </div>
                ${props.skillUploadError
                  ? html`
                      <div class="callout danger" style="margin-top: 8px;">
                        ${props.skillUploadError}
                      </div>
                    `
                  : nothing}
              </div>
            `
          : nothing}
        ${props.createError
          ? html`
              <div class="callout danger" style="margin-top: 12px;">
                ${props.createError}
              </div>
            `
          : nothing}
        <div class="row" style="margin-top: 16px; justify-content: flex-end; gap: 8px;">
          <button class="btn" ?disabled=${props.createBusy} @click=${props.onCreateClose}>
            ${t("commonCancel")}
          </button>
          <button
            class="btn primary"
            ?disabled=${props.createBusy || !props.createName.trim()}
            @click=${props.onCreateSubmit}
          >
            ${props.createBusy ? t("commonLoading") : t("skillsUploadSubmit")}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderDigitalEmployee(props: DigitalEmployeeProps) {
  const list = props.employees ?? [];
  const filter = props.filter.trim().toLowerCase();
  const filtered = filter
    ? list.filter((emp) =>
        [emp.name, emp.id, emp.description].join(" ").toLowerCase().includes(filter),
      )
    : list;
  const rawName = props.createName?.trim() ?? "";
  const employeeIdPreview = deriveEmployeeIdFromName(rawName);
  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">${t("navTitleDigitalEmployee")}</div>
          <div class="card-sub">
            提供不同垂直场景的对话模版，点击任一数字员工即可开启新的会话。
          </div>
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
          <button class="btn primary" ?disabled=${props.loading} @click=${props.onCreateOpen}>
            ${t("skillsAdd")}
          </button>
          <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
            ${props.loading ? t("commonLoading") : t("commonRefresh")}
          </button>
        </div>
      </div>

      ${
        props.error
          ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
          : nothing
      }

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="flex: 1;">
          <span>${t("commonFilter")}</span>
          <span class="input"><input
            .value=${props.filter}
            @input=${(e: Event) => props.onFilterChange((e.target as HTMLInputElement).value)}
            placeholder="搜索名称/ID/描述"
          /></span>
        </label>
        <div class="muted">${filtered.length} 个</div>
      </div>

      ${
        !props.loading && filtered.length === 0
          ? html`<div class="muted" style="margin-top: 16px;">暂无匹配的数字员工。</div>`
          : html`
              ${
                props.viewMode === "list"
                  ? html`
                      <div class="list" style="margin-top: 16px;">
                        ${filtered.map((emp) => renderEmployeeListRow(emp, props))}
                      </div>
                    `
                  : html`
                      <div
                        class="employees-card-grid"
                        style="
                          display: grid;
                          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                          gap: 12px;
                          margin-top: 16px;
                        "
                      >
                        ${filtered.map((emp) => renderEmployeeCard(emp, props))}
                      </div>
                    `
              }
            `
      }

      ${
        props.createModalOpen
          ? html`
              <div class="modal-overlay" @click=${props.onCreateClose}>
                <div class="modal card" @click=${(e: Event) => e.stopPropagation()}>
                  <div class="card-title">新增数字员工</div>
                  <div class="field" style="margin-top: 12px;">
                    <span>名称</span>
                    <span class="input"><input
                      type="text"
                      .value=${props.createName}
                      @input=${(e: Event) =>
                        props.onCreateNameChange((e.target as HTMLInputElement).value)}
                      placeholder="如 SRE 运维专家"
                    /></span>
                    <div class="list-sub muted" style="font-size: 11px; margin-top: 4px;">名称唯一</div>
                  </div>
                  <div class="field" style="margin-top: 12px;">
                    <span>描述</span>
                    <span class="textarea"><textarea
                      rows="4"
                      .value=${props.createDescription}
                      @input=${(e: Event) =>
                        props.onCreateDescriptionChange(
                          (e.target as HTMLTextAreaElement).value,
                        )}
                    ></textarea></span>
                  </div>
                  <div class="field" style="margin-top: 12px;">
                    <span>Prompt（可选）</span>
                    <span class="textarea"><textarea
                      rows="4"
                      .value=${props.createPrompt}
                      @input=${(e: Event) =>
                        props.onCreatePromptChange((e.target as HTMLTextAreaElement).value)}
                      placeholder="为该数字员工编写系统提示/人设说明。"
                    ></textarea></span>
                  </div>
                  <div class="field" style="margin-top: 12px;">
                    <button class="btn secondary" type="button" @click=${props.onToggleAdvanced}>
                      ${props.advancedOpen ? "收起高级配置" : "展开高级配置"}
                    </button>
                  </div>
                  ${
                    props.advancedOpen
                      ? html`
                          <div class="card" style="margin-top: 12px;">
                            <div class="card-title" style="font-size: 13px; margin-bottom: 8px;">
                              高级配置
                            </div>
                            <div class="list-sub muted" style="font-size: 12px; margin-bottom: 8px;">
                              预估 ID：<code>${employeeIdPreview}</code>（基于名称生成，用于专属技能目录
                              ~/.openocta/employee_skills/${employeeIdPreview}/...）
                            </div>
                            <div class="field" style="margin-top: 8px;">
                              <span>MCP 配置（可选）</span>
                              <div class="row" style="margin-top: 6px; gap: 8px; flex-wrap: wrap;">
                                <button
                                  class="btn ${props.createMcpMode === "builder" ? "primary" : ""}"
                                  type="button"
                                  @click=${() => props.onMcpModeChange("builder")}
                                >
                                  点选配置
                                </button>
                                <button
                                  class="btn ${props.createMcpMode === "raw" ? "primary" : ""}"
                                  type="button"
                                  @click=${() => props.onMcpModeChange("raw")}
                                >
                                  原生 JSON
                                </button>
                              </div>
                              ${
                                props.createMcpMode === "raw"
                                  ? html`
                                      <span class="textarea"><textarea
                                        rows="10"
                                        style="margin-top: 8px;"
                                        .value=${props.mcpJson}
                                        @input=${(e: Event) =>
                                          props.onMcpJsonChange(
                                            (e.target as HTMLTextAreaElement).value,
                                          )}
                                        placeholder='{
  "mcp-server": {
    "enabled": true,
    "command": "npx",
    "args": [
      "-y",
      "@example/mcp-server-name"
    ],
    "env": {
      "API_KEY": "your-api-key"
    }
  }
}'
                                      ></textarea></span>
                                      <div class="list-sub muted" style="font-size: 11px; margin-top: 4px;">
                                        与主配置 mcp.servers 结构一致，会话时合并（同 key 时员工覆盖）
                                      </div>
                                    `
                                  : html`
                                      <div class="row" style="margin-top: 8px; justify-content: space-between; align-items: center;">
                                        <div class="muted" style="font-size: 12px;">
                                          可添加多个 MCP；配置完成后可折叠，避免页面过长。
                                        </div>
                                        <button class="btn btn--sm" type="button" @click=${props.onMcpAddItem}>
                                          <span class="btn__icon">${icons.plus}</span>添加 MCP
                                        </button>
                                      </div>
                                      <div style="margin-top: 8px; display: grid; gap: 10px;">
                                        ${props.mcpItems.map((item) =>
                                          renderEmployeeMcpItem(item, {
                                            onRemoveItem: props.onMcpRemoveItem,
                                            onCollapsedChange: props.onMcpCollapsedChange,
                                            onKeyChange: props.onMcpKeyChange,
                                            onEditModeChange: props.onMcpEditModeChange,
                                            onConnectionTypeChange: props.onMcpConnectionTypeChange,
                                            onFormPatch: props.onMcpFormPatch,
                                            onRawChange: props.onMcpRawChange,
                                          }),
                                        )}
                                      </div>
                                    `
                              }
                            </div>
                            <div class="field" style="margin-top: 8px;">
                              <span>技能名称（可选）</span>
                              <span class="input"><input
                                type="text"
                                .value=${props.skillUploadName}
                                @input=${(e: Event) =>
                                  props.onSkillUploadNameChange(
                                    (e.target as HTMLInputElement).value,
                                  )}
                                placeholder="不填则从文件名推导，如 prometheus-1.0.0.zip → prometheus-1.0.0"
                              /></span>
                            </div>
                            <div class="field" style="margin-top: 8px;">
                              <span>技能文件（SKILL.md 或 zip，可多选，提交时一并上传）</span>
                              <input
                                type="file"
                                accept=".md,.MD,.zip"
                                multiple
                                @change=${(e: Event) => {
                                  const input = e.target as HTMLInputElement;
                                  const files = input.files ? Array.from(input.files) : [];
                                  props.onSkillUploadFilesChange(files);
                                }}
                              />
                            </div>
                            ${
                              props.skillUploadError
                                ? html`
                                    <div class="callout danger" style="margin-top: 8px;">
                                      ${props.skillUploadError}
                                    </div>
                                  `
                                : nothing
                            }
                          </div>
                        `
                      : nothing
                  }
                  ${
                    props.createError
                      ? html`
                          <div class="callout danger" style="margin-top: 12px;">
                            ${props.createError}
                          </div>
                        `
                      : nothing
                  }
                  <div class="row" style="margin-top: 16px; justify-content: flex-end; gap: 8px;">
                    <button class="btn" ?disabled=${props.createBusy} @click=${props.onCreateClose}>
                      ${t("commonCancel")}
                    </button>
                    <button
                      class="btn primary"
                      ?disabled=${props.createBusy || !props.createName.trim()}
                      @click=${props.onCreateSubmit}
                    >
                      ${props.createBusy ? t("commonLoading") : t("skillsUploadSubmit")}
                    </button>
                  </div>
                </div>
              </div>
            `
          : nothing
      }

      ${nothing}
    </section>
  `;
}

function renderEmployeeListRow(emp: DigitalEmployee, props: DigitalEmployeeProps) {
  const title = emp.name || emp.id;
  const desc = emp.description || (emp.builtin ? "内置数字员工" : "自定义数字员工");
  const created =
    typeof emp.createdAt === "number" && emp.createdAt > 0
      ? new Date(emp.createdAt).toLocaleString()
      : emp.builtin
        ? "内置"
        : "";
  const enabled = emp.enabled !== false;
  return html`
    <div class="list-item list-item--row" style="width: 100%; text-align: left;">
      <div class="list-main">
        <div class="list-title">
          ${title}
          ${emp.builtin ? html`<span class="chip" style="margin-left: 8px;">内置</span>` : nothing}
        </div>
        <div class="list-sub">${desc}</div>
        <div class="list-sub muted" style="margin-top: 4px;">
          ${created ? html`<span>创建时间：${created}</span>` : nothing}
          <span style="margin-left: 12px;">状态：${enabled ? "启用" : "禁用"}</span>
          ${renderSkillMcpHint(emp)}
        </div>
      </div>
      <div class="row" style="gap: 8px; align-items: center; justify-content: flex-end;">
        <button class="btn btn--sm primary" @click=${() => props.onOpenEmployee(emp.id)}>会话</button>
        <button class="btn btn--sm" @click=${() => props.onCopy(emp.id)}>复制</button>
        <button class="btn btn--sm" @click=${() => props.onEdit(emp.id)}>
          修改
        </button>
        <button class="btn btn--sm danger" @click=${() => props.onDelete(emp.id)}>
          ${t("skillsDelete")}
        </button>
      </div>
    </div>
  `;
}

function renderEmployeeCard(emp: DigitalEmployee, props: DigitalEmployeeProps) {
  const title = emp.name || emp.id;
  const desc = emp.description || (emp.builtin ? "内置数字员工" : "自定义数字员工");
  const created =
    typeof emp.createdAt === "number" && emp.createdAt > 0
      ? new Date(emp.createdAt).toLocaleString()
      : emp.builtin
        ? "内置"
        : "";
  const enabled = emp.enabled !== false;
  return html`
    <div class="skills-server-card" style="cursor: pointer;" @click=${() => props.onOpenEmployee(emp.id)}>
      <div class="skills-server-card__header">
        <div class="skills-server-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="skills-server-card__title-row" style="min-width: 0;">
          <span class="skills-server-card__name">${title}</span>
          ${emp.builtin ? html`<span class="chip" style="font-size: 11px;">内置</span>` : nothing}
          <span class="chip ${enabled ? "chip-ok" : "chip-warn"}" style="font-size: 11px;">
            ${enabled ? "启用" : "禁用"}
          </span>
        </div>
      </div>
      <div class="skills-server-card__sub muted" style="font-size: 12px;">
        <div>${desc}</div>
        ${created ? html`<div style="margin-top: 6px;">创建时间：${created}</div>` : nothing}
        ${renderSkillMcpHint(emp)}
      </div>
      <div class="skills-server-card__footer" @click=${(e: Event) => e.stopPropagation()}>
        <button class="btn btn--sm primary" @click=${() => props.onOpenEmployee(emp.id)}>会话</button>
        <button class="btn btn--sm" @click=${() => props.onCopy(emp.id)}>复制</button>
        <button class="btn btn--sm" @click=${() => props.onEdit(emp.id)}>
          修改
        </button>
        <button class="btn btn--sm danger" @click=${() => props.onDelete(emp.id)}>
          ${t("skillsDelete")}
        </button>
      </div>
    </div>
  `;
}

function renderSkillMcpHint(emp: DigitalEmployee) {
  const skills = emp.skillNames ?? emp.skillIds ?? [];
  const mcp = emp.mcpServerKeys ?? [];
  if (skills.length === 0 && mcp.length === 0) return html``;
  const maxShow = 3;
  const skillStr =
    skills.length <= maxShow
      ? skills.join(", ")
      : `${skills.slice(0, maxShow).join(", ")}....`;
  const mcpStr =
    mcp.length <= maxShow ? mcp.join(", ") : `${mcp.slice(0, maxShow).join(", ")}....`;
  const fullSkill = skills.join(", ");
  const fullMcp = mcp.join(", ");
  const title =
    fullSkill && fullMcp
      ? `技能：${fullSkill}\nMCP：${fullMcp}`
      : fullSkill
        ? `技能：${fullSkill}`
        : `MCP：${fullMcp}`;
  const parts: string[] = [];
  if (skillStr) parts.push(`技能：${skillStr}`);
  if (mcpStr) parts.push(`MCP：${mcpStr}`);
  return html`<span
    style="margin-left: 12px; cursor: help; text-decoration: underline dotted;"
    title=${title}
  >
    ${parts.join(" | ")}
  </span>`;
}

function deriveEmployeeIdFromName(name: string): string {
  const s = name.trim().toLowerCase();
  if (!s) {
    return "employee";
  }
  let out = "";
  for (const ch of s) {
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9")) {
      out += ch;
      continue;
    }
    if (ch === "-" || ch === "_" || ch === " ") {
      out += "-";
    }
  }
  out = out.replace(/-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
  if (!out) {
    out = "employee";
  }
  if (out.length > 64) {
    out = out.slice(0, 64);
  }
  return out;
}

function renderEmployeeMcpItem(item: EmployeeMcpItem, cb: EmployeeMcpCallbacks): TemplateResult {
  const title = item.key?.trim() ? item.key.trim() : "未命名 MCP";
  const typeLabel = item.editMode === "raw" ? "JSON" : item.connectionType;
  const hasError = Boolean(item.rawError);
  const collapsed = Boolean(item.collapsed);
  return html`
    <details
      class="card"
      style="padding: 10px;"
      ?open=${!collapsed}
      @toggle=${(e: Event) => {
        const el = e.target as HTMLDetailsElement;
        cb.onCollapsedChange(item.id, !el.open);
      }}
    >
      <summary class="row" style="cursor: pointer; list-style: none; align-items: center; gap: 8px;">
        <button
          class="btn btn--sm"
          type="button"
          title=${collapsed ? "展开" : "折叠"}
          @click=${(e: Event) => {
            // 明确的折叠/展开按钮：仅切换状态，不走 summary 默认行为
            e.preventDefault();
            e.stopPropagation();
            cb.onCollapsedChange(item.id, !collapsed);
          }}
        >
          ${collapsed ? "▸ 展开" : "▾ 折叠"}
        </button>
        <span style="font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${title}
        </span>
        <span class="chip" style="font-size: 11px;">${typeLabel}</span>
        ${hasError ? html`<span class="chip chip-warn" style="font-size: 11px;">有错误</span>` : nothing}
        <button
          class="btn btn--sm"
          type="button"
          style="margin-left: 6px;"
          @click=${(e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            cb.onRemoveItem(item.id);
          }}
        >
          删除
        </button>
      </summary>

      <div style="margin-top: 10px;">
        <div class="field">
          <span>Key（唯一）*</span>
          <span class="input"><input
            type="text"
            .value=${item.key}
            placeholder="如 prometheus, filesystem"
            @input=${(e: Event) => cb.onKeyChange(item.id, (e.target as HTMLInputElement).value)}
          /></span>
        </div>

        <div class="row" style="margin-top: 10px; gap: 8px;">
          <button
            class="btn ${item.editMode === "form" ? "primary" : ""}"
            type="button"
            @click=${() => cb.onEditModeChange(item.id, "form")}
          >
            点选配置
          </button>
          <button
            class="btn ${item.editMode === "raw" ? "primary" : ""}"
            type="button"
            @click=${() => cb.onEditModeChange(item.id, "raw")}
          >
            原生 JSON
          </button>
        </div>

        ${
          item.editMode === "raw"
            ? html`
                <div class="field" style="margin-top: 10px;">
                  <span>JSON</span>
                  <span class="textarea"><textarea
                    rows="10"
                    style="font-family: var(--mono); font-size: 12px;"
                    .value=${item.rawJson}
                    @input=${(e: Event) =>
                      cb.onRawChange(item.id, (e.target as HTMLTextAreaElement).value)}
                  ></textarea></span>
                  ${
                    item.rawError
                      ? html`<div class="callout danger" style="margin-top: 8px;">${item.rawError}</div>`
                      : nothing
                  }
                </div>
              `
            : html`
                <div
                  class="row"
                  style="
                    display: flex;
                    gap: 4px;
                    margin-top: 12px;
                    border-bottom: 1px solid var(--border, #333);
                    padding-bottom: 4px;
                  "
                >
                  <button
                    class="btn ${item.connectionType === "stdio" ? "primary" : ""}"
                    type="button"
                    style="flex: 1; min-width: 0;"
                    @click=${() => cb.onConnectionTypeChange(item.id, "stdio")}
                  >
                    stdio
                  </button>
                  <button
                    class="btn ${item.connectionType === "url" ? "primary" : ""}"
                    type="button"
                    style="flex: 1; min-width: 0;"
                    @click=${() => cb.onConnectionTypeChange(item.id, "url")}
                  >
                    url
                  </button>
                  <button
                    class="btn ${item.connectionType === "service" ? "primary" : ""}"
                    type="button"
                    style="flex: 1; min-width: 0;"
                    @click=${() => cb.onConnectionTypeChange(item.id, "service")}
                  >
                    service
                  </button>
                </div>
                <div style="margin-top: 10px;">
                  ${renderEmployeeMcpFormFields(item, (p) => cb.onFormPatch(item.id, p))}
                </div>
              `
        }
      </div>
    </details>
  `;
}

function formatEnvForEdit(env: Record<string, string> | undefined): string {
  if (!env || typeof env !== "object") return "";
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
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

function renderEmployeeMcpFormFields(
  item: EmployeeMcpItem,
  onPatch: (p: Partial<McpServerEntry>) => void,
): TemplateResult {
  const MCP_COMMAND_OPTIONS = ["npx", "docker", "uv"] as const;
  if (item.connectionType === "stdio") {
    // 优先从表单草稿中读取 command；如果为空且当前是 JSON 模式，则尝试从 rawJson 中解析一次。
    let cmd = (item.draft?.command ?? "").trim();
    if (!cmd && item.editMode === "raw" && item.rawJson?.trim()) {
      try {
        const parsed = JSON.parse(item.rawJson) as { command?: string } | null;
        if (parsed && typeof parsed.command === "string" && parsed.command.trim()) {
          cmd = parsed.command.trim();
        }
      } catch {
        // 若 JSON 无法解析，则忽略，保持默认值逻辑
      }
    }
    cmd = cmd || "npx";
    const baseOptions = MCP_COMMAND_OPTIONS as readonly string[];
    const options = baseOptions.includes(cmd) ? baseOptions : ([cmd, ...baseOptions] as readonly string[]);
    return html`
      <div class="field">
        <span>command *</span>
        <span class="select"><select
          @change=${(e: Event) => onPatch({ command: (e.target as HTMLSelectElement).value })}
        >
          ${options.map((c) => html`
            <option 
              value=${c} 
              ?selected=${c === cmd} 
            >
              ${c}
            </option>
          `)}
        </select></span>
      </div>
      <div class="field" style="margin-top: 8px;">
        <span>args</span>
        <span class="input"><input
          type="text"
          .value=${(item.draft?.args ?? []).join(" ")}
          placeholder="-y prometheus-mcp-server"
          @input=${(e: Event) => {
            const val = (e.target as HTMLInputElement).value;
            onPatch({ args: val.trim() ? val.trim().split(/\s+/) : [] });
          }}
        /></span>
      </div>
      <div class="field" style="margin-top: 8px;">
        <span>env</span>
        <span class="textarea"><textarea
          style="min-height: 80px; font-family: var(--mono); font-size: 12px;"
          placeholder="KEY=value"
          .value=${formatEnvForEdit(item.draft?.env)}
          @input=${(e: Event) => {
            const val = (e.target as HTMLTextAreaElement).value;
            onPatch({ env: parseEnvFromEdit(val) });
          }}
        ></textarea></span>
      </div>
    `;
  }
  if (item.connectionType === "url") {
    return html`
      <div class="field">
        <span>url *</span>
        <span class="input"><input
          type="text"
          .value=${item.draft?.url ?? ""}
          placeholder="https://mcp.example.com/sse"
          @input=${(e: Event) => onPatch({ url: (e.target as HTMLInputElement).value })}
        /></span>
      </div>
    `;
  }
  return html`
    <div class="field">
      <span>service *</span>
      <span class="input"><input
        type="text"
        .value=${item.draft?.service ?? ""}
        placeholder="prometheus"
        @input=${(e: Event) => onPatch({ service: (e.target as HTMLInputElement).value })}
      /></span>
    </div>
    <div class="field" style="margin-top: 8px;">
      <span>serviceUrl *</span>
      <span class="input"><input
        type="text"
        .value=${item.draft?.serviceUrl ?? ""}
        placeholder="http://localhost:9090"
        @input=${(e: Event) => onPatch({ serviceUrl: (e.target as HTMLInputElement).value })}
      /></span>
    </div>
  `;
}
