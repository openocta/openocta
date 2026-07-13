import { html, nothing, type TemplateResult } from "lit";
import type { VaultGraph } from "../controllers/vault.ts";
import "../components/vault-graph-view.ts";
import "../components/vault-editor.ts";
import { renderVaultFileTree, type VaultTreeNode } from "./vault-file-tree.ts";
import type { VaultFileTreeProps } from "./vault-file-tree.ts";
import { renderVaultSearchPanel, type VaultSearchPanelProps } from "./vault-search-panel.ts";
import type { VaultEditorMode } from "../components/vault-editor.ts";
import { renderVaultItemModal, type VaultItemModalState } from "./vault-item-modal.ts";

export type VaultShellProps = {
  loading: boolean;
  error: string | null;
  saveMessage: string | null;
  syncing: boolean;
  viewMode: "notes" | "graph";
  sidebarWidth: number;
  vaultDir: string;
  fileCount: number;
  chunkCount: number;
  lastSyncedAt: string | null;
  treeNodes: VaultTreeNode[];
  fileTreeProps: Omit<VaultFileTreeProps, "nodes">;
  searchPanelProps: VaultSearchPanelProps;
  graph: VaultGraph | null;
  graphLoading: boolean;
  selectedPath: string | null;
  content: string;
  draftContent: string;
  contentLoading: boolean;
  saving: boolean;
  isDirty: boolean;
  editorMode: VaultEditorMode;
  highlightLine: number | null;
  itemModal: VaultItemModalState | null;
  itemModalSaving: boolean;
  itemModalError: string | null;
  folders: string[];
  dirSaving: boolean;
  onRefresh: () => void;
  onSyncIndex: () => void;
  onViewModeChange: (mode: "notes" | "graph") => void;
  onConfigureVaultDir: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onSidebarResizeStart: (event: PointerEvent) => void;
  onSelectFile: (path: string) => void;
  onSelectFileFromGraph: (path: string) => void;
  onEditorModeChange: (mode: VaultEditorMode) => void;
  onDraftChange: (content: string) => void;
  onSave: () => void;
  onBreadcrumbNavigate: (folderPath: string) => void;
  onItemModalNameChange: (name: string) => void;
  onItemModalParentChange: (parent: string) => void;
  onItemModalSubmit: () => void;
  onItemModalClose: () => void;
};

function formatSyncedAt(iso: string | null) {
  if (!iso) return "未同步";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

export function renderVaultShell(props: VaultShellProps): TemplateResult {
  const treeProps: VaultFileTreeProps = { ...props.fileTreeProps, nodes: props.treeNodes };

  return html`
    <div class="kv-page ${props.viewMode === "graph" ? "kv-page--graph" : ""}">
      <header class="kv-header">
        <div class="kv-header__left">
          <h1 class="kv-header__title">知识库</h1>
        </div>
        <div class="kv-header__actions">
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            ?disabled=${props.dirSaving}
            @click=${props.onConfigureVaultDir}
          >
            ${props.dirSaving ? "保存中…" : "配置目录"}
          </button>
          <div class="kv-segment">
            <button
              type="button"
              class="kv-segment__btn ${props.viewMode === "notes" ? "kv-segment__btn--active" : ""}"
              @click=${() => props.onViewModeChange("notes")}
            >
              文档
            </button>
            <button
              type="button"
              class="kv-segment__btn ${props.viewMode === "graph" ? "kv-segment__btn--active" : ""}"
              @click=${() => props.onViewModeChange("graph")}
            >
              图谱
            </button>
          </div>
          <button type="button" class="btn btn--secondary btn--sm" ?disabled=${props.loading} @click=${props.onRefresh}>
            刷新
          </button>
          <button
            type="button"
            class="btn btn--secondary btn--sm"
            ?disabled=${props.syncing || props.loading}
            @click=${props.onSyncIndex}
          >
            ${props.syncing ? "同步中…" : "同步索引"}
          </button>
        </div>
      </header>

      ${props.error && !props.itemModal
        ? html`<div class="kv-alert kv-alert--error">${props.error}</div>`
        : nothing}
      ${props.saveMessage ? html`<div class="kv-alert kv-alert--ok">${props.saveMessage}</div>` : nothing}
      ${props.syncing
        ? html`
            <div class="kv-sync-progress" role="status" aria-live="polite">
              <div class="kv-sync-progress__track">
                <div class="kv-sync-progress__bar"></div>
              </div>
              <span class="kv-sync-progress__label">正在同步索引，请稍候…</span>
            </div>
          `
        : nothing}

      ${props.loading
        ? html`<div class="kv-loading">加载知识库…</div>`
        : props.viewMode === "graph"
          ? html`
              <vault-graph-view
                .graph=${props.graph}
                .loading=${props.graphLoading}
                .selectedPath=${props.selectedPath}
                .onSelectFile=${props.onSelectFileFromGraph}
              ></vault-graph-view>
            `
          : html`
              <div class="kv-layout" style=${`--kv-sidebar-width: ${props.sidebarWidth}px`}>
                <aside class="kv-sidebar" style=${`width: ${props.sidebarWidth}px`}>
                  <div class="kv-sidebar__toolbar">
                    <button type="button" class="btn btn--secondary btn--sm" @click=${props.onCreateFile}>
                      新建笔记
                    </button>
                    <button type="button" class="btn btn--secondary btn--sm" @click=${props.onCreateFolder}>
                      新建文件夹
                    </button>
                  </div>
                  ${renderVaultSearchPanel(props.searchPanelProps)}
                  <div class="kv-tree">
                    ${props.treeNodes.length
                      ? renderVaultFileTree(props.treeNodes, treeProps)
                      : html`<div class="kv-tree__empty">暂无笔记<br /><span class="muted">点击「新建笔记」开始</span></div>`}
                  </div>
                </aside>
                <div
                  class="kv-sidebar-resize"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="调整侧栏宽度"
                  @pointerdown=${props.onSidebarResizeStart}
                ></div>
                <section class="kv-main">
                  <vault-editor
                    .selectedPath=${props.selectedPath}
                    .content=${props.content}
                    .draftContent=${props.draftContent}
                    .contentLoading=${props.contentLoading}
                    .saving=${props.saving}
                    .isDirty=${props.isDirty}
                    .editorMode=${props.editorMode}
                    .highlightLine=${props.highlightLine}
                    .onEditorModeChange=${props.onEditorModeChange}
                    .onDraftChange=${props.onDraftChange}
                    .onSave=${props.onSave}
                    .onBreadcrumbNavigate=${props.onBreadcrumbNavigate}
                  ></vault-editor>
                </section>
              </div>
            `}

      <footer class="kv-statusbar">
        <span class="kv-statusbar__item kv-statusbar__path" title=${props.vaultDir || ""}
          >${props.vaultDir || "—"}</span
        >
        <span class="kv-statusbar__item">${props.fileCount} 篇笔记</span>
        <span class="kv-statusbar__item">${props.chunkCount} 个索引块</span>
        <span class="kv-statusbar__item">上次同步 ${formatSyncedAt(props.lastSyncedAt)}</span>
      </footer>

      ${renderVaultItemModal({
        modal: props.itemModal,
        folders: props.folders,
        saving: props.itemModalSaving,
        error: props.itemModalError,
        onNameChange: props.onItemModalNameChange,
        onParentChange: props.onItemModalParentChange,
        onSubmit: props.onItemModalSubmit,
        onClose: props.onItemModalClose,
      })}
    </div>
  `;
}
