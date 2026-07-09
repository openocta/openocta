import { html, nothing, type TemplateResult } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { genericListPage, genericSectionListPage } from "../components/generic-list-page.ts";
import { icons } from "../icons.js";
import { resolveLogoUrl, type SkillDetail, type SkillListItem } from "../controllers/remote-market.ts";
import { itemBelongsToCategory } from "../utils/category-helpers.ts";
import { toSanitizedMarkdownHtml } from "../markdown.ts";
import { nativeConfirm } from "../native-dialog-bridge.ts";
import { t } from "../strings.js";
import { renderSkillCreateModals, type SkillCreateModalsProps } from "./skill-create-modals.ts";

/** Skills default icon (layers) - same as skills.ts */
const SKILL_ICON_SVG = html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
  </svg>
`;

function renderSkillCardIcon(
  gatewayHost: string | undefined,
  logoUrlRaw: string | undefined,
  emoji: string | undefined,
) {
  const logoUrl = resolveLogoUrl(logoUrlRaw, gatewayHost);
  const useDefaultSvg = !logoUrl && !emoji;
  return html`
    <div class="emp-card__icon ${useDefaultSvg ? "emp-card__icon--default" : ""}">
      ${logoUrl
        ? html`<img src=${logoUrl} alt="" loading="lazy" decoding="async" />`
        : emoji
          ? emoji
          : SKILL_ICON_SVG}
    </div>
  `;
}

export type SkillLibraryProps = {
  loading: boolean;
  error: string | null;
  /** 安装成功提示（如 "安装成功：summarize-100（测试与安全）"） */
  installSuccess: string | null;
  /** 与 fetch 一致，用于解析相对 logo 路径（Vite 开发等场景） */
  gatewayHost?: string;
  token?: string;
  categoryReloadVersion?: number;
  query: string;
  items: SkillListItem[];
  selectedFolder: string | null;
  selectedDetail: SkillDetail | null;
  selectedCategory: string;
  selectedCategoryDescendants: string[];
  selectedStatus: string;
  installedKeys?: Set<string>;
  /** 已禁用的 skillKey 集合 */
  disabledKeys?: Set<string>;
  installingFolder?: string | null;
  onQueryChange: (next: string) => void;
  onCategoryChange: (next: string) => void;
  onCategoryTreeSelect?: (name: string, descendantNames: string[]) => void;
  onStatusChange: (next: string) => void;
  onRefresh: () => void;
  onSelect: (folder: string) => void;
  onDetailClose?: () => void;
  skillCreate: SkillCreateModalsProps;
  onAddClick: () => void;
  onInstall?: (folder: string, category?: string) => Promise<void>;
  onDelete?: (folder: string) => Promise<void>;
  onToggleEnabled?: (folder: string, enabled: boolean) => Promise<void>;
  // Skill editor
  skillEditModalOpen?: boolean;
  skillEditSkillKey?: string | null;
  skillEditFiles?: string[];
  skillEditSelectedFile?: string | null;
  skillEditContent?: string;
  skillEditLoading?: boolean;
  skillEditSaving?: boolean;
  skillEditError?: string | null;
  skillEditSyntaxError?: string | null;
  skillEditSuccessMessage?: string | null;
  onSkillEditOpen?: (folder: string) => void;
  onSkillEditClose?: () => void;
  onSkillEditFileSelect?: (path: string) => void;
  onSkillEditContentChange?: (content: string) => void;
  onSkillEditSave?: () => Promise<void>;
};

function normalizeCategory(raw?: string) {
  const v = (raw ?? "").trim();
  return v ? v : "其它";
}

function uniqueCategories(items: SkillListItem[]) {
  const map = new Map<string, number>();
  for (const it of items) {
    const cat = normalizeCategory(it.categoryCn);
    map.set(cat, (map.get(cat) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}

export type SkillLibraryCategoryInfo = {
  orderedCategories: string[];
  counts: Map<string, number>;
};

// TODO: catalog-pages.test.ts 依赖此函数，测试重构后删除
export function computeSkillLibraryCategories(
  items: SkillListItem[],
  query: string,
  status: string
): SkillLibraryCategoryInfo {
  const q = (query ?? "").trim().toLowerCase();
  const activeStatus = (status ?? "").trim() || "__all__";
  const filtered = (items ?? []).filter((it) => {
    if (q) {
      const text = `${it.name ?? ""} ${it.description ?? ""} ${it.folder ?? ""}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    if (activeStatus !== "__all__") {
      if ((it.status ?? "").trim().toLowerCase() !== activeStatus) return false;
    }
    return true;
  });
  const counts = new Map<string, number>();
  counts.set("__all__", filtered.length);
  for (const it of filtered) {
    const cat = normalizeCategory(it.categoryCn);
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

function splitCsv(raw?: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

function statusLabel(status?: string) {
  const v = (status ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v === "open") return "开放";
  if (v === "paid") return "付费";
  if (v === "private") return "私有";
  return status ?? "";
}

function renderSkillCardActions(
  props: SkillLibraryProps,
  folder: string,
  installed: boolean,
  enabled: boolean,
  installing: boolean,
  category?: string
) {
  if (installed) {
    return props.onToggleEnabled
      ? html`
          <div class="market-card-actions">
            <div
              class=${`switch${enabled ? " is-checked" : ""}`}
              @click=${(e: Event) => {
                e.stopPropagation();
                void props.onToggleEnabled!(folder, !enabled);
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
          void props.onInstall!(folder, category);
        }}
      >
        ${installing ? "安装中" : "安装"}
      </button>
    `;
  }
  return html`
    <a
      class="btn small"
      href=${`/api/v1/skills/${encodeURIComponent(folder)}/download`}
      target="_blank"
      rel="noopener"
      title="下载"
      @click=${(e: Event) => e.stopPropagation()}
    >
      安装
    </a>
  `;
}

function renderSkillDetailActions(
  props: SkillLibraryProps,
  folder: string,
  installed: boolean,
  enabled: boolean,
  installing: boolean,
  category?: string
) {
  if (installed) {
    return html`
      <div class="market-card-actions">
        ${props.onSkillEditOpen
          ? html`
              <button
                class="btn primary"
                type="button"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  props.onSkillEditOpen!(folder);
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
                  void props.onToggleEnabled!(folder, !enabled);
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
                  if (!(await nativeConfirm(t("skillsDeleteConfirm")))) {
                    return;
                  }
                  void props.onDelete!(folder);
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
          void props.onInstall!(folder, category);
        }}
      >
        ${installing ? "安装中" : "安装"}
      </button>
    `;
  }
  return html`
    <a
      class="btn primary"
      href=${`/api/v1/skills/${encodeURIComponent(folder)}/download`}
      target="_blank"
      rel="noopener"
      title="下载"
      @click=${(e: Event) => e.stopPropagation()}
    >
      安装
    </a>
  `;
}

function renderSkillMeta(tags: string[], os: string[], status: string, currentCategory?: string) {
  const isInSingleCategoryView = currentCategory && currentCategory !== "__all__";
  const visibleTags = isInSingleCategoryView
    ? tags.filter((t) => t !== currentCategory)
    : tags;
  return html`
    <div class="market-card-meta">
      ${status
        ? html`<span class="market-card-chip">${status}</span>`
        : html`<span class="market-card-chip market-card-chip--muted">未标注</span>`}
      ${visibleTags.slice(0, 3).map((t) => html`<span class="market-card-chip">${t}</span>`)}
      ${os.length > 0 ? html`<span class="market-card-chip">OS: ${os.join("/")}</span>` : nothing}
    </div>
  `;
}

function renderSkillLibraryCard(
  props: SkillLibraryProps,
  it: SkillListItem,
  activeCategory: string,
  installed: boolean,
) {
  const active = props.selectedFolder === it.folder;
  const disabled = props.disabledKeys?.has(it.folder) ?? false;
  const enabled = !disabled;
  const installing = props.installingFolder === it.folder;
  const tags = splitCsv(it.tags);
  const os = splitCsv(it.os);
  const status = statusLabel(it.status);

  return html`
    <div class="emp-card-wrap ${active ? "active" : ""} ${disabled ? "is-disabled" : ""}">
      <div class="emp-card emp-card-btn" @click=${() => props.onSelect(it.folder)}>
        ${renderSkillCardIcon(props.gatewayHost, it.logo_url, it.emoji)}
        <div class="emp-card__actions">
          ${renderSkillCardActions(props, it.folder, installed, enabled, installing, it.categoryCn)}
        </div>
        <h3 class="emp-card__title">${it.name || it.folder}</h3>
        <p class="emp-card__desc">${it.description ?? it.folder ?? "暂无描述"}</p>
        ${renderSkillMeta(tags, os, status, activeCategory)}
      </div>
    </div>
  `;
}

export function renderSkillLibrary(props: SkillLibraryProps) {
  const categoryList = uniqueCategories(props.items);
  const activeCategory = props.selectedCategory || "__all__";
  const activeStatus = props.selectedStatus || "__all__";
  const q = (props.query ?? "").trim().toLowerCase();

  const filtered = props.items.filter((it) => {
    if (q) {
      const text = `${it.name ?? ""} ${it.description ?? ""} ${it.folder ?? ""}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    const okCategory =
      activeCategory === "__all__"
        ? true
        : itemBelongsToCategory(it, props.selectedCategoryDescendants ?? []);
    const okStatus =
      activeStatus === "__all__" ? true : (it.status ?? "").trim().toLowerCase() === activeStatus;
    return okCategory && okStatus;
  });

  const grouped = new Map<string, SkillListItem[]>();
  for (const it of filtered) {
    const cat = normalizeCategory(it.categoryCn);
    const arr = grouped.get(cat) ?? [];
    arr.push(it);
    grouped.set(cat, arr);
  }

  const orderedGroups =
    activeCategory === "__all__"
      ? categoryList
          .map((c) => c.name)
          .filter((name) => grouped.has(name))
          .map((name) => ({ name, items: grouped.get(name) ?? [] }))
      : [{ name: activeCategory, items: filtered }];
  const showToolbarActions = !props.error || props.items.length > 0;

  const toolbarActions = html`
    <div class="emp-toolbar__actions">
      <div class="emp-search">
        <span class="input"><input
          class="emp-search__input"
          type="text"
          placeholder="搜索技能"
          .value=${props.query}
          ?disabled=${props.loading}
          @input=${(e: Event) => props.onQueryChange((e.target as HTMLInputElement).value)}
        /></span>
        <span class="emp-search__icon" aria-hidden="true">${icons.search}</span>
      </div>
      <button class="btn" @click=${props.onRefresh} ?disabled=${props.loading}>刷新</button>
      <button class="btn primary" ?disabled=${props.loading} @click=${props.onAddClick}>${t("skillsAdd")}</button>
    </div>
  `;

  const installedItems = (props.items ?? []).filter((it) => {
    if (!(props.installedKeys?.has(it.folder) ?? false)) return false;
    if (!q) return true;
    const text = `${it.name ?? ""} ${it.description ?? ""} ${it.folder ?? ""}`.toLowerCase();
    return text.includes(q);
  });
  const showSections = !props.loading && !(orderedGroups.length === 0 && installedItems.length === 0);
  const showMainBody = showToolbarActions || installedItems.length > 0 || showSections;

  const showDetailModal = Boolean(props.selectedFolder);
  const closeDetail = () =>
    props.onDetailClose ? props.onDetailClose() : props.onSelect("");

  return html`
    <main class="emp-page">
      <section class="emp-list-wrap">
        <div class="emp-content">
          <div class="emp-main">
            ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}
            ${props.installSuccess ? html`<div class="callout success">${props.installSuccess}</div>` : nothing}
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
                            keyFn: (it: SkillListItem) => it.folder,
                            renderItem: (it: SkillListItem) => renderSkillLibraryCard(props, it, activeCategory, true),
                            initialCount: 24,
                            batchSize: 24,
                            containerClass: "emp-grid emp-installed-grid",
                            sentinelLabel: "继续显示已安装技能",
                          })}
                        </div>
                      `;
                    })()}
                    ${showSections
                      ? genericSectionListPage({
                          sections: orderedGroups
                            .filter((group) => group.items.length > 0)
                            .map((group) => ({
                              key: group.name,
                              title: group.name,
                              items: group.items,
                              sectionClass: "emp-section",
                              gridClass: "emp-grid",
                            })),
                          keyFn: (it: SkillListItem) => it.folder,
                          renderItem: (it: SkillListItem) => {
                            const installed =
                              props.installedKeys && props.installedKeys.size > 0
                                ? props.installedKeys.has(it.folder)
                                : false;
                            return renderSkillLibraryCard(props, it, activeCategory, installed);
                          },
                          initialCount: 96,
                          batchSize: 96,
                          sectionsClass: "emp-sections",
                          sentinelLabel: "继续显示技能",
                        })
                      : nothing}
                  </div>
                `
              : nothing}

            ${renderSkillCreateModals(props.skillCreate)}

            ${props.loading
              ? html`<div class="emp-loading">加载中...</div>`
              : orderedGroups.length === 0 && installedItems.length === 0
                ? html`<div class="emp-empty">暂无匹配的技能</div>`
                : nothing}
          </div>
        </div>

        ${showDetailModal
          ? html`
              <div class="modal-overlay" @click=${closeDetail} role="dialog" aria-modal="true">
                <div class="modal card emp-detail-modal emp-detail-modal--large" @click=${(e: Event) => e.stopPropagation()}>
                  <div class="emp-detail-modal__header">
                    <div class="emp-detail-header" style="flex: 1; min-width: 0;">
                      ${(() => {
                        const sel = props.items.find((i) => i.folder === props.selectedFolder);
                        const logoUrl = resolveLogoUrl(
                          props.selectedDetail?.logo_url ?? sel?.logo_url,
                          props.gatewayHost,
                        );
                        return html`
                          <div class="emp-detail-title-wrap">
                            ${logoUrl
                              ? html`<div class="emp-detail-logo"><img src=${logoUrl} alt="" /></div>`
                              : html`
                                  <div class="emp-detail-logo emp-detail-logo--default">${SKILL_ICON_SVG}</div>
                                `}
                            <h1 id="emp-detail-title" class="emp-detail-title" style="margin: 0;">
                              ${sel?.name || props.selectedFolder}
                            </h1>
                            <div class="emp-detail-tags">
                              ${(() => {
                                if (!sel) return nothing;
                                const cat = normalizeCategory(sel.categoryCn);
                                const hideDetailCategory = activeCategory && activeCategory !== "__all__" && cat === activeCategory;
                                const tags = splitCsv(sel.tags);
                                const visibleTags = tags.filter((t) => {
                                  const nt = normalizeCategory(t);
                                  if (nt === cat) return false;
                                  if (activeCategory && activeCategory !== "__all__" && nt === activeCategory) return false;
                                  return true;
                                });
                                return html`
                                  ${cat && !hideDetailCategory ? html`<span class="badge ghost">${cat}</span>` : nothing}
                                  ${visibleTags.map((t) => html`<span class="badge ghost">${t}</span>`)}
                                `;
                              })()}
                            </div>
                          </div>
                          ${sel?.description
                            ? html`<article class="emp-detail-summary">${sel.description}</article>`
                            : nothing}
                        `;
                      })()}
                      <div class="emp-detail-meta-row">
                        ${(() => {
                          const folder = props.selectedFolder ?? "";
                          const installed = props.installedKeys?.has(folder) ?? false;
                          const disabled = props.disabledKeys?.has(folder) ?? false;
                          const enabled = !disabled;
                          if (installed) {
                            return renderSkillDetailActions(props, folder, true, enabled, false);
                          }
                          if (props.onInstall) {
                            return renderSkillDetailActions(
                              props,
                              folder,
                              false,
                              false,
                              props.installingFolder === folder,
                            );
                          }
                          return renderSkillDetailActions(props, folder, false, false, false);
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
                    ${props.selectedDetail?.content
                      ? html`<div class="emp-detail-markdown emp-detail-content">${unsafeHTML(toSanitizedMarkdownHtml(stripFrontmatter(props.selectedDetail.content)))}</div>`
                      : html`<div class="emp-detail-content-empty">无 README</div>`}
                  </div>
                </div>
              </div>
            `
          : nothing}

        ${props.skillEditModalOpen
          ? renderSkillEditorModal(props)
          : nothing}
      </section>
    </main>
  `;
}

type FileTreeNode = { name: string; path: string | null; children: FileTreeNode[] };

function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  for (const p of paths) {
    const parts = p.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const existing = current.find((n) => n.name === name);
      if (existing) {
        current = existing.children;
      } else {
        const node: FileTreeNode = { name, path: isFile ? p : null, children: [] };
        current.push(node);
        if (!isFile) {
          current = node.children;
        }
      }
    }
  }
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      const aDir = a.path === null;
      const bDir = b.path === null;
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(root);
  return root;
}

function renderFileTree(
  nodes: FileTreeNode[],
  selectedFile: string | null,
  onSelect: (path: string) => void,
  depth = 0,
): TemplateResult {
  return html`
    <div style="display: flex; flex-direction: column;">
      ${nodes.map((node) => {
        const paddingLeft = depth * 10 + 8;
        if (node.path === null) {
          return html`
            <div style="display: flex; flex-direction: column;">
              <div
                style="
                  padding: 3px 8px 3px ${paddingLeft}px;
                  font-size: 13px;
                  line-height: 1.6;
                  cursor: pointer;
                  user-select: none;
                  color: var(--text-main);
                  display: flex;
                  align-items: center;
                  gap: 4px;
                "
                @click=${(e: Event) => {
                  e.stopPropagation();
                  const target = e.currentTarget as HTMLElement;
                  const icon = target.querySelector('span[data-tree-icon]') as HTMLElement | null;
                  const child = target.nextElementSibling as HTMLElement | null;
                  if (child) {
                    const isHidden = child.style.display === 'none';
                    child.style.display = isHidden ? 'block' : 'none';
                    if (icon) icon.textContent = isHidden ? '▾' : '▸';
                  }
                }}
              >
                <span data-tree-icon style="display:inline-block;width:12px;text-align:center;color:var(--text-muted);font-size:11px;">▾</span>
                <span style="font-weight: 500;">${node.name}</span>
              </div>
              <div style="display: block;">
                ${renderFileTree(node.children, selectedFile, onSelect, depth + 1)}
              </div>
            </div>
          `;
        }
        const isSelected = selectedFile === node.path;
        return html`
          <div
            style="
              padding: 3px 8px 3px ${paddingLeft}px;
              margin: 0 4px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 13px;
              line-height: 1.6;
              font-family: var(--mono);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              ${isSelected
                ? "background: var(--primary-light, #e6f2ff); color: var(--primary, #0066cc);"
                : "color: var(--text-main);"}
            "
            @click=${() => onSelect(node.path!)}
            title=${node.path}
          >
            ${node.name}
          </div>
        `;
      })}
    </div>
  `;
}

function renderSkillEditorModal(props: SkillLibraryProps) {
  const skillKey = props.skillEditSkillKey ?? "";
  const files = props.skillEditFiles ?? [];
  const selectedFile = props.skillEditSelectedFile;
  const content = props.skillEditContent ?? "";
  const loading = props.skillEditLoading ?? false;
  const saving = props.skillEditSaving ?? false;
  const error = props.skillEditError;
  const syntaxError = props.skillEditSyntaxError;
  const canSave = selectedFile && !loading && !saving;

  const visibleFiles = files.filter((f) => {
    if (f.split('/').some((part) => part.startsWith('.'))) return false;
    if (f === '_meta.json' || f.endsWith('/_meta.json')) return false;
    return true;
  });
  const fileTree = buildFileTree(visibleFiles);

  return html`
    <div class="modal-overlay" @click=${props.onSkillEditClose} role="dialog" aria-modal="true">
      <div
        class="modal card"
        style="
          position: relative;
          width: min(1200px, 96vw);
          height: min(840px, 92vh);
          max-width: 96vw;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        "
        @click=${(e: Event) => e.stopPropagation()}
      >
        <div
          class="row"
          style="
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border, #e5e5e5);
            flex-shrink: 0;
          "
        >
          <div class="card-title" style="margin: 0;">编辑技能：${skillKey}</div>
          <button class="btn btn--icon" type="button" aria-label="关闭" @click=${props.onSkillEditClose}>
            ${icons.x}
          </button>
        </div>

        ${props.skillEditSuccessMessage
          ? html`
              <div
                style="
                  position: absolute;
                  top: 12px;
                  right: 56px;
                  padding: 8px 16px;
                  border-radius: 6px;
                  background: #dcfce7;
                  color: #166534;
                  font-size: 13px;
                  font-weight: 500;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                  z-index: 10;
                  pointer-events: none;
                "
              >
                ${props.skillEditSuccessMessage}
              </div>
            `
          : nothing}

        <div class="row" style="flex: 1; min-height: 0; overflow: hidden; align-items: stretch;">
          <!-- File tree -->
          <div
            style="
              width: 250px;
              flex-shrink: 0;
              border-right: 1px solid var(--border, #e5e5e5);
              overflow: auto;
              padding: 0;
              background: var(--bg-subtle, #fafafa);
            "
          >
            ${loading && visibleFiles.length === 0
              ? html`<div class="muted" style="padding: 8px;">加载中...</div>`
              : renderFileTree(fileTree, selectedFile ?? null, (path) => props.onSkillEditFileSelect?.(path))}
          </div>

          <!-- Editor -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden;">
            ${loading
              ? html`<div class="muted" style="padding: 24px;">加载中...</div>`
              : html`
                  <textarea
                    style="
                      flex: 1;
                      min-height: 0;
                      width: 100%;
                      resize: none;
                      border: none;
                      outline: none;
                      padding: 12px;
                      font-family: var(--mono);
                      font-size: 13px;
                      line-height: 1.6;
                      background: transparent;
                      color: var(--text-main);
                    "
                    .value=${content}
                    ?disabled=${!selectedFile || saving}
                    @input=${(e: Event) =>
                      props.onSkillEditContentChange?.((e.target as HTMLTextAreaElement).value)}
                  ></textarea>
                `}
          </div>
        </div>

        <div
          class="row"
          style="
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            border-top: 1px solid var(--border, #e5e5e5);
            flex-shrink: 0;
            gap: 12px;
          "
        >
          <div style="flex: 1; min-width: 0;">
            ${syntaxError
              ? html`<div class="callout danger" style="padding: 8px 12px; font-size: 13px;">${syntaxError}</div>`
              : error
                ? html`<div class="callout danger" style="padding: 8px 12px; font-size: 13px;">${error}</div>`
                : nothing}
          </div>
          <div class="row" style="gap: 8px; flex-shrink: 0;">
            <button class="btn" ?disabled=${saving} @click=${props.onSkillEditClose}>取消</button>
            <button
              class="btn primary"
              ?disabled=${!canSave}
              @click=${async () => {
                if (props.onSkillEditSave) {
                  await props.onSkillEditSave();
                }
              }}
            >
              ${saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
