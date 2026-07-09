import { html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { genericListPage, genericSectionListPage } from "../components/generic-list-page.ts";
import type { McpDetail, McpListItem } from "../controllers/remote-market.ts";
import { resolveLogoUrl } from "../controllers/remote-market.ts";
import { groupByCategoryKey } from "../utils/category-helpers.ts";
import { icons } from "../icons.js";
import { toSanitizedMarkdownHtml } from "../markdown.ts";
import { nativeConfirm } from "../native-dialog-bridge.ts";
import { t } from "../strings.js";
import {
  isMcpAddFormValid,
  renderMcpAddConnectionFields,
  renderFieldLabelWithTooltip,
  MCP_RAW_JSON_TOOLTIP,
  type McpServerEntry,
} from "./mcp.ts";

/** MCP default icon (connection blocks) - same as mcp.ts */
const MCP_ICON_SVG = html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="4" y="4" width="8" height="8" rx="1"/>
    <rect x="12" y="12" width="8" height="8" rx="1"/>
  </svg>
`;

export type ToolLibraryProps = {
  loading: boolean;
  error: string | null;
  query: string;
  category?: string;
  categoryDescendants?: string[];
  gatewayHost?: string;
  token?: string;
  categoryReloadVersion?: number;
  items: McpListItem[];
  selectedId: number | string | null;
  selectedDetail: McpDetail | null;
  onQueryChange: (next: string) => void;
  onCategoryChange?: (next: string) => void;
  onCategoryTreeSelect?: (name: string, descendantNames: string[]) => void;
  onRefresh: () => void;
  addModalOpen?: boolean;
  addName?: string;
  addDraft?: McpServerEntry;
  addConnectionType?: "stdio" | "url" | "service";
  addEditMode?: "form" | "raw";
  addRawJson?: string;
  addRawError?: string | null;
  saving?: boolean;
  onAddServer?: () => void;
  onAddClose?: () => void;
  onAddNameChange?: (name: string) => void;
  onAddFormPatch?: (patch: Partial<McpServerEntry>) => void;
  onAddRawChange?: (json: string) => void;
  onAddConnectionTypeChange?: (type: "stdio" | "url" | "service") => void;
  onAddEditModeChange?: (mode: "form" | "raw") => void;
  onAddSubmit?: () => void;
  onSelect: (id: number | string) => void;
  onDetailClose?: () => void;
  installedRemoteIds?: Set<string>;
  disabledMcpKeys?: Set<string>;
  installingId?: number | null;
  onInstall?: (id: number | string, category?: string) => Promise<void>;
  /** 删除全局 MCP：由宿主调用网关 `mcp.servers.delete`（或离线时 config.patch）。 */
  onDelete?: (serverKey: string) => Promise<void>;
  onToggleEnabled?: (serverKey: string, enabled: boolean) => Promise<void>;
  /** 修改 MCP 配置（serverKey 为 mcp.servers 中的 key） */
  onEdit?: (serverKey: string) => void;
  installedMcpMap?: Map<number | string, string>;
};

function normalizeCategory(raw?: string) {
  const v = (raw ?? "").trim();
  return v ? v : "其它";
}

function normalizeQuery(raw: string) {
  return (raw ?? "").trim().toLowerCase();
}

function statusLabel(status?: string) {
  const v = (status ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v === "open") return "开放";
  if (v === "paid") return "收费";
  if (v === "private") return "私有";
  return status ?? "";
}

function splitCsv(raw?: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** serverKey from API map even when list `id` is number vs string (JSON mismatch). */
function lookupInstalledServerKey(
  map: Map<number | string, string> | undefined,
  id: number | string,
): string | undefined {
  if (!map) return undefined;
  const n = typeof id === "string" ? Number(id) : id;
  return map.get(id) ?? map.get(String(id)) ?? (Number.isFinite(n) ? map.get(n) : undefined);
}

export type ToolLibraryCategoryInfo = {
  orderedCategories: string[];
  counts: Map<string, number>;
};

// TODO: catalog-pages.test.ts 依赖此函数，测试重构后删除
export function computeToolLibraryCategories(
  items: McpListItem[],
  query: string
): ToolLibraryCategoryInfo {
  const q = normalizeQuery(query);
  const filteredByQuery = (items ?? []).filter((it) => {
    if (!q) return true;
    const text = `${it.name ?? ""} ${it.description ?? ""}`.toLowerCase();
    return text.includes(q);
  });
  const counts = new Map<string, number>();
  counts.set("__all__", filteredByQuery.length);
  for (const it of filteredByQuery) {
    const cat = normalizeCategory(it.category);
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const orderedCategories = [
    "__all__",
    ...Array.from(counts.keys())
      .filter((k) => k !== "__all__")
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN")),
  ];
  return { orderedCategories, counts };
}

/** Strip YAML frontmatter (--- ... ---) from the start of markdown. */
function stripFrontmatter(text: string): string {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("---")) return text;
  const afterFirst = trimmed.slice(3);
  const newlineIdx = afterFirst.search(/\r?\n/);
  if (newlineIdx === -1) return text;
  const rest = afterFirst.slice(newlineIdx + (afterFirst[newlineIdx] === "\r" ? 2 : 1));
  const closeMatch = rest.match(/\r?\n\s*---\s*\r?\n?/);
  if (!closeMatch) return text;
  return rest.slice(closeMatch.index! + closeMatch[0].length).trimStart();
}

function renderToolCardActions(
  props: ToolLibraryProps,
  item: McpListItem | McpDetail,
  serverKey: string | undefined,
  enabled: boolean,
  installing: boolean
) {
  if (serverKey) {
    return props.onToggleEnabled
      ? html`
          <div class="market-card-actions">
            <div
              class=${`switch${enabled ? " is-checked" : ""}`}
              @click=${(e: Event) => {
                e.stopPropagation();
                void props.onToggleEnabled!(serverKey, !enabled);
              }}
            >
              <input
                type="checkbox"
                class="switch__input"
                ?checked=${enabled}
                aria-label=${enabled ? "禁用" : "启用"}
              />
              <span class="switch__core"></span>
            </div>
          </div>
        `
      : nothing;
  }
  if (props.onInstall) {
    return html`
      <button
        class="btn small"
        type="button"
        ?disabled=${installing}
        @click=${(e: Event) => {
          e.stopPropagation();
          void props.onInstall!(item.id, item.category);
        }}
      >
        ${installing ? "安装中" : "安装"}
      </button>
    `;
  }
  return html`
    <a
      class="btn small"
      href=${`/api/v1/mcps/${item.id}/download`}
      target="_blank"
      rel="noopener"
      title="下载"
      @click=${(e: Event) => e.stopPropagation()}
    >
      安装
    </a>
  `;
}

function renderToolDetailActions(
  props: ToolLibraryProps,
  item: McpListItem | McpDetail,
  serverKey: string | undefined,
  enabled: boolean,
  installing: boolean
) {
  if (serverKey) {
    return html`
      <div class="market-card-actions">
        ${props.onEdit
          ? html`
              <button
                class="btn primary"
                type="button"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  props.onEdit!(serverKey);
                }}
              >
                编辑
              </button>
            `
          : nothing}
        ${props.onToggleEnabled
          ? html`
              <button
                class="btn"
                type="button"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  void props.onToggleEnabled!(serverKey, !enabled);
                }}
              >
                ${enabled ? "禁用" : "启用"}
              </button>
            `
          : nothing}
        ${props.onDelete
          ? html`
              <button
                class="btn"
                type="button"
                @click=${async (e: Event) => {
                  e.stopPropagation();
                  if (!(await nativeConfirm(t("mcpDeleteConfirm")))) {
                    return;
                  }
                  void props.onDelete!(serverKey);
                }}
              >
                删除
              </button>
            `
          : nothing}
      </div>
    `;
  }
  if (props.onInstall) {
    return html`
      <button
        class="btn primary"
        type="button"
        ?disabled=${installing}
        @click=${(e: Event) => {
          e.stopPropagation();
          void props.onInstall!(item.id, item.category);
        }}
      >
        ${installing ? "安装中" : "安装"}
      </button>
    `;
  }
  return html`
    <a
      class="btn primary"
      href=${`/api/v1/mcps/${item.id}/download`}
      target="_blank"
      rel="noopener"
      title="下载"
      @click=${(e: Event) => e.stopPropagation()}
    >
      安装
    </a>
  `;
}

function renderToolMeta(item: McpListItem | McpDetail, currentCategory?: string) {
  const tags = splitCsv(item.tags);
  const status = statusLabel(item.status);
  // 不再将 category 渲染为 chip，避免与 section 标题或当前分类重复
  const visibleTags = currentCategory && currentCategory !== "__all__"
    ? tags.filter((t) => t !== currentCategory).slice(0, 3)
    : tags.slice(0, 3);
  return html`
    <div class="market-card-meta">
      ${status ? html`<span class="market-card-chip">${status}</span>` : nothing}
      ${visibleTags.map((t) => html`<span class="market-card-chip">${t}</span>`)}
    </div>
  `;
}

function renderToolCard(
  props: ToolLibraryProps,
  it: McpListItem,
  effectiveCategory: string,
  serverKey: string | undefined,
) {
  const active = props.selectedId === it.id;
  const logoUrl = resolveLogoUrl(it.logo_url);
  const disabled = serverKey ? (props.disabledMcpKeys?.has(serverKey) ?? false) : false;
  const enabled = !disabled;
  const installing = props.installingId === it.id;

  return html`
    <div class="emp-card-wrap ${active ? "active" : ""} ${disabled ? "is-disabled" : ""}">
      <div class="emp-card emp-card-btn" @click=${() => props.onSelect(it.id)}>
        <div class="emp-card__icon ${!logoUrl ? "emp-card__icon--default" : ""}">
          ${logoUrl ? html`<img src=${logoUrl} alt="" />` : MCP_ICON_SVG}
        </div>
        <div class="emp-card__actions">
          ${renderToolCardActions(props, it, serverKey, enabled, installing)}
        </div>
        <h3 class="emp-card__title">${it.name}</h3>
        <p class="emp-card__desc">${it.description ?? "暂无描述"}</p>
        ${renderToolMeta(it, effectiveCategory)}
      </div>
    </div>
  `;
}

export function renderToolLibrary(props: ToolLibraryProps) {
  const effectiveCategory = (props.category ?? "").trim() || "__all__";
  const q = normalizeQuery(props.query);

  const filteredByQuery = (props.items ?? []).filter((it) => {
    if (!q) return true;
    const text = `${it.name ?? ""} ${it.description ?? ""}`.toLowerCase();
    return text.includes(q);
  });

  const counts = new Map<string, number>();
  counts.set("__all__", filteredByQuery.length);
  for (const it of filteredByQuery) {
    const cat = normalizeCategory(it.category);
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const orderedCategories = [
    "__all__",
    ...Array.from(counts.keys())
      .filter((k) => k !== "__all__")
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN")),
  ];

  const { filtered: filteredItems, sections: sectionsFixed } = groupByCategoryKey(
    filteredByQuery,
    effectiveCategory,
    props.categoryDescendants ?? [effectiveCategory],
  );
  const showToolbarActions = !props.error || (props.items?.length ?? 0) > 0;

  const toolbarActions = html`
    <div class="emp-toolbar__actions">
      <div class="emp-search">
        <span class="input"><input
          class="emp-search__input"
          type="text"
          placeholder="搜索 MCP 名称或描述..."
          .value=${props.query}
          ?disabled=${props.loading}
          @input=${(e: Event) => props.onQueryChange((e.target as HTMLInputElement).value)}
        /></span>
        <span class="emp-search__icon" aria-hidden="true">${icons.search}</span>
      </div>
      <button class="btn" @click=${props.onRefresh} ?disabled=${props.loading}>刷新</button>
      ${props.onAddServer
        ? html`
            <button class="btn primary" ?disabled=${props.loading} @click=${props.onAddServer}>
              ${t("mcpAddServer")}
            </button>
          `
        : nothing}
    </div>
  `;

  const installedItems = filteredByQuery.filter((it) =>
    props.installedRemoteIds?.has(String(it.id)),
  );
  const showSections = !props.loading && !(filteredItems.length === 0 && installedItems.length === 0);
  const showMainBody = showToolbarActions || installedItems.length > 0 || showSections;

  const showDetailModal = props.selectedDetail !== null;
  // 勿用 ??：onDetailClose() 返回 void/undefined 时仍会误触发 onSelect(-1) → 请求 mcps/-1
  const closeDetail = () =>
    props.onDetailClose ? props.onDetailClose() : props.onSelect(-1);

  return html`
    <main class="emp-page">
      <section class="emp-list-wrap">
        <div class="emp-content">
          <div class="emp-main">
            ${
              props.addModalOpen && props.onAddClose
                ? html`
                    <div class="modal-overlay" @click=${props.onAddClose}>
                      <div class="modal card" style="max-width: 520px;" @click=${(e: Event) => e.stopPropagation()}>
                        <div class="card-title">${t("mcpAddServer")}</div>
                        <div class="field" style="margin-top: 12px;">
                          <span>${t("mcpServerName")} *</span>
                          <span class="input"><input
                            type="text"
                            .value=${props.addName ?? ""}
                            @input=${(e: Event) => props.onAddNameChange?.((e.target as HTMLInputElement).value)}
                            placeholder="prometheus, my-mcp"
                          /></span>
                        </div>
                        <div class="row" style="margin: 12px 0; gap: 8px;">
                          <button
                            class="btn ${(props.addEditMode ?? "form") === "form" ? "primary" : ""}"
                            @click=${() => props.onAddEditModeChange?.("form")}
                          >
                            ${t("mcpFormMode")}
                          </button>
                          <button
                            class="btn ${(props.addEditMode ?? "form") === "raw" ? "primary" : ""}"
                            @click=${() => props.onAddEditModeChange?.("raw")}
                          >
                            ${t("mcpRawMode")}
                          </button>
                        </div>
                        ${
                          (props.addEditMode ?? "form") === "form"
                            ? html`
                                <div class="config-form" id="tool-library-mcp-add-form">
                                  <div class="mcp-connection-tabs" style="display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border, #333); padding-bottom: 4px;">
                                    <button
                                      type="button"
                                      class="btn ${(props.addConnectionType ?? "stdio") === "stdio" ? "primary" : ""}"
                                      style="flex: 1; min-width: 0;"
                                      @click=${() => props.onAddConnectionTypeChange?.("stdio")}
                                    >
                                      ${t("mcpConnectionTypeStdio")}
                                    </button>
                                    <button
                                      type="button"
                                      class="btn ${(props.addConnectionType ?? "stdio") === "url" ? "primary" : ""}"
                                      style="flex: 1; min-width: 0;"
                                      @click=${() => props.onAddConnectionTypeChange?.("url")}
                                    >
                                      ${t("mcpConnectionTypeUrl")}
                                    </button>
                                    <button
                                      type="button"
                                      class="btn ${(props.addConnectionType ?? "stdio") === "service" ? "primary" : ""}"
                                      style="flex: 1; min-width: 0;"
                                      @click=${() => props.onAddConnectionTypeChange?.("service")}
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
                                      (p) => props.onAddFormPatch?.(p),
                                    )}
                                  </div>
                                  <div class="field">
                                    <span>${t("mcpToolPrefix")}</span>
                                    <span class="input"><input
                                      type="text"
                                      .value=${props.addDraft?.toolPrefix ?? ""}
                                      placeholder="Optional"
                                      @input=${(e: Event) =>
                                        props.onAddFormPatch?.({ toolPrefix: (e.target as HTMLInputElement).value })}
                                    /></span>
                                  </div>
                                </div>
                              `
                            : html`
                                <div class="field">
                                  ${renderFieldLabelWithTooltip(t("mcpRawJson"), MCP_RAW_JSON_TOOLTIP)}
                                  <span class="textarea"><textarea
                                    style="min-height: 180px; font-family: var(--mono);"
                                    .value=${props.addRawJson ?? ""}
                                    @input=${(e: Event) =>
                                      props.onAddRawChange?.((e.target as HTMLTextAreaElement).value)}
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
                            ?disabled=${props.saving || !(props.addName ?? "").trim() || !isMcpAddFormValid(props.addDraft, props.addConnectionType ?? "stdio", props.addEditMode ?? "form", props.addRawError ?? null)}
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

            ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}
            ${showMainBody
              ? html`
                  <div class="emp-main__body">
                    ${showToolbarActions ? toolbarActions : nothing}
                    ${(() => {
                      if (installedItems.length === 0) return nothing;
                      return html`
                        <div class="emp-installed-section">
                          <h3 class="emp-section__title">已安装 (${installedItems.length})</h3>
                          ${genericListPage({
                            items: installedItems,
                            keyFn: (it: McpListItem) => `installed-${String(it.id)}`,
                            renderItem: (it: McpListItem) =>
                              renderToolCard(
                                props,
                                it,
                                effectiveCategory,
                                lookupInstalledServerKey(props.installedMcpMap, it.id),
                              ),
                            initialCount: 24,
                            batchSize: 24,
                            containerClass: "emp-grid emp-installed-grid",
                            sentinelLabel: "继续显示已安装工具",
                          })}
                        </div>
                      `;
                    })()}
                    ${showSections
                      ? genericSectionListPage({
                          sections: sectionsFixed
                            .filter((section) => section.items.length > 0)
                            .map((section) => ({
                              key: section.title,
                              title: section.title,
                              items: section.items,
                              sectionClass: "emp-section",
                              gridClass: "emp-grid",
                            })),
                          keyFn: (it: McpListItem) => String(it.id),
                          renderItem: (it: McpListItem) => {
                            const installed = props.installedRemoteIds?.has(String(it.id)) ?? false;
                            const serverKey = lookupInstalledServerKey(props.installedMcpMap, it.id);
                            return renderToolCard(
                              props,
                              it,
                              effectiveCategory,
                              installed ? serverKey : undefined,
                            );
                          },
                          initialCount: 96,
                          batchSize: 96,
                          sectionsClass: "emp-sections",
                          sentinelLabel: "继续显示工具",
                        })
                      : nothing}
                  </div>
                `
              : nothing}

            ${props.loading
              ? html`<div class="emp-loading">加载中...</div>`
              : filteredItems.length === 0 && installedItems.length === 0
                ? html`<div class="emp-empty">暂无匹配的 MCP</div>`
                : nothing}
          </div>
        </div>

        ${showDetailModal && props.selectedDetail
          ? html`
              <div class="modal-overlay" @click=${closeDetail} role="dialog" aria-modal="true">
                <div class="modal card emp-detail-modal emp-detail-modal--large" @click=${(e: Event) => e.stopPropagation()}>
                  <div class="emp-detail-modal__header">
                    <div class="emp-detail-header" style="flex: 1; min-width: 0;">
                      <div class="emp-detail-title-wrap">
                        ${(() => {
                          const logoUrl = resolveLogoUrl(props.selectedDetail.logo_url);
                          return logoUrl
                            ? html`<div class="emp-detail-logo"><img src=${logoUrl} alt="" /></div>`
                            : html`
                                <div class="emp-detail-logo emp-detail-logo--default">
                                  ${MCP_ICON_SVG}
                                </div>
                              `;
                        })()}
                        <h1 id="emp-detail-title" class="emp-detail-title" style="margin: 0;">
                          ${props.selectedDetail.name ?? `#${props.selectedDetail.id}`}
                        </h1>
                        <div class="emp-detail-tags">
                          ${(props.selectedDetail.status ?? "").trim()
                            ? html`<span class="badge ghost">${statusLabel(props.selectedDetail.status)}</span>`
                            : nothing}
                          ${(() => {
                            const detailCategory = normalizeCategory(props.selectedDetail.category);
                            const detailTags = splitCsv(props.selectedDetail.tags);
                            const visibleDetailTags = detailTags.filter((t) => {
                              const nt = normalizeCategory(t);
                              if (nt === detailCategory) return false;
                              if (effectiveCategory && effectiveCategory !== "__all__" && nt === effectiveCategory) return false;
                              return true;
                            });
                            return visibleDetailTags.map((t) => html`<span class="badge ghost">${t}</span>`);
                          })()}
                        </div>
                      </div>
                      <article class="emp-detail-summary">${props.selectedDetail.description ?? ""}</article>
                      <div class="emp-detail-meta-row">
                        ${(() => {
                          const id = props.selectedDetail?.id ?? 0;
                          const installed = props.installedRemoteIds?.has(String(id)) ?? false;
                          const serverKey = lookupInstalledServerKey(props.installedMcpMap, id);
                          const disabled = serverKey ? (props.disabledMcpKeys?.has(serverKey) ?? false) : false;
                          const enabled = !disabled;
                          const installing = props.installingId === id;
                          return renderToolDetailActions(
                            props,
                            props.selectedDetail!,
                            installed ? serverKey : undefined,
                            enabled,
                            installing,
                          );
                        })()}
                      </div>
                    </div>
                    <button
                      class="emp-detail-modal__close"
                      type="button"
                      aria-label="关闭"
                      @click=${closeDetail}
                    >
                      ${icons.x}
                    </button>
                  </div>
                  <div class="emp-detail-modal__body">
                    ${props.selectedDetail.readme
                      ? html`<div class="emp-detail-markdown emp-detail-content">${unsafeHTML(toSanitizedMarkdownHtml(stripFrontmatter(props.selectedDetail.readme)))}</div>`
                      : html`<div class="emp-detail-content-empty">无 README</div>`}
                  </div>
                </div>
              </div>
            `
          : nothing}
      </section>
    </main>
  `;
}
