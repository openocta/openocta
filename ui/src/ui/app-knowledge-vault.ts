import type { AppViewState } from "./app-view-state.ts";
import { saveConfigPatch } from "./controllers/config.ts";
import {
  createVaultFile,
  createVaultFolder,
  deleteVaultFile,
  deleteVaultFolder,
  fetchVaultFile,
  fetchVaultFiles,
  fetchVaultGraph,
  fetchVaultStatus,
  renameVaultPath,
  saveVaultFile,
  searchVaultIndex,
  syncVaultIndex,
  type VaultSearchHit,
} from "./controllers/vault.ts";
import { nativeAlert, nativeConfirm, nativePrompt } from "./native-dialog-bridge.ts";
import type { VaultEditorMode } from "./components/vault-editor.ts";
import {
  buildFileTree,
  collectExpandedForSearch,
  filterFilesByName,
} from "./views/vault-file-tree.ts";
import { renderVaultShell } from "./views/vault-shell.ts";
import type { KnowledgeVaultViewMode } from "./views/knowledge-vault.ts";
import type { VaultSearchMode } from "./views/vault-search-panel.ts";
import {
  vaultItemBaseName,
  vaultItemParent,
  isVaultFolderDescendant,
  vaultTargetPathTaken,
  VAULT_PATH_EXISTS_MSG,
  formatVaultItemModalError,
} from "./views/vault-item-modal.ts";

const SIDEBAR_WIDTH_KEY = "kv-sidebar-width";
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 520;
const DEFAULT_SIDEBAR = 280;

export function knowledgeVaultIsDirty(host: AppViewState) {
  if (!host.knowledgeVaultSelectedPath) return false;
  return host.knowledgeVaultDraftContent !== host.knowledgeVaultContent;
}

export function loadKnowledgeVaultSidebarWidth(): number {
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const n = raw ? Number(raw) : DEFAULT_SIDEBAR;
    if (Number.isFinite(n) && n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_SIDEBAR;
}

export function saveKnowledgeVaultSidebarWidth(width: number) {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(width)));
  } catch {
    /* ignore */
  }
}

async function confirmDiscardUnsaved(host: AppViewState): Promise<boolean> {
  if (!knowledgeVaultIsDirty(host)) return true;
  return nativeConfirm("当前笔记有未保存的更改，确定放弃吗？");
}

function parentFolderForNew(host: AppViewState) {
  const selected = host.knowledgeVaultSelectedPath;
  if (selected) {
    const slash = selected.lastIndexOf("/");
    return slash >= 0 ? selected.slice(0, slash) : "";
  }
  return host.knowledgeVaultSelectedFolderPath ?? "";
}

function joinVaultPath(parent: string, name: string) {
  const trimmed = name.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!trimmed) return "";
  return parent ? `${parent}/${trimmed}` : trimmed;
}

function expandFolderPath(host: AppViewState, folderPath: string) {
  const parts = folderPath.split("/");
  const next = new Set(host.knowledgeVaultExpandedFolders);
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    next.add(acc);
  }
  host.knowledgeVaultExpandedFolders = [...next];
}

async function loadVault(host: AppViewState) {
  host.knowledgeVaultLoading = true;
  host.knowledgeVaultError = null;
  try {
    const [listRes, statusRes] = await Promise.all([
      fetchVaultFiles(host),
      fetchVaultStatus(host).catch(() => null),
    ]);
    host.knowledgeVaultDir = listRes.vaultDir;
    host.knowledgeVaultFiles = listRes.files;
    host.knowledgeVaultFolders = listRes.folders.map((f) => f.path);
    if (statusRes) {
      host.knowledgeVaultFileCount = statusRes.fileCount ?? listRes.files.length;
      host.knowledgeVaultChunkCount = statusRes.chunkCount ?? host.knowledgeVaultChunkCount;
      host.knowledgeVaultLastSyncedAt = statusRes.lastSyncedAt ?? host.knowledgeVaultLastSyncedAt;
    } else {
      host.knowledgeVaultFileCount = listRes.files.length;
    }
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
  } finally {
    host.knowledgeVaultLoading = false;
  }
}

async function loadGraph(host: AppViewState) {
  host.knowledgeVaultGraphLoading = true;
  try {
    host.knowledgeVaultGraph = await fetchVaultGraph(host);
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
  } finally {
    host.knowledgeVaultGraphLoading = false;
  }
}

async function loadFile(host: AppViewState, path: string) {
  host.knowledgeVaultContentLoading = true;
  host.knowledgeVaultError = null;
  try {
    const file = await fetchVaultFile(host, path);
    host.knowledgeVaultContent = file.content;
    host.knowledgeVaultDraftContent = file.content;
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
  } finally {
    host.knowledgeVaultContentLoading = false;
  }
}

async function syncIndex(host: AppViewState, message?: string) {
  host.knowledgeVaultSyncing = true;
  host.knowledgeVaultError = null;
  try {
    const res = await syncVaultIndex(host);
    const files = res.fileCount ?? 0;
    const chunks = res.chunkCount ?? 0;
    host.knowledgeVaultFileCount = files;
    host.knowledgeVaultChunkCount = chunks;
    host.knowledgeVaultLastSyncedAt = new Date().toISOString();
    host.knowledgeVaultSaveMessage =
      message ??
      `索引已同步（${files} 篇笔记，${chunks} 个分块）。Agent 将主动调用 memory_search 检索；若当前会话仍搜不到，请再发一条新消息。`;
    window.setTimeout(() => {
      host.knowledgeVaultSaveMessage = null;
    }, 3000);
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
  } finally {
    host.knowledgeVaultSyncing = false;
  }
}

export async function handleKnowledgeVaultSelectFile(host: AppViewState, path: string) {
  const sameFile = path === host.knowledgeVaultSelectedPath;
  if (!sameFile) {
    if (!(await confirmDiscardUnsaved(host))) return;
    host.knowledgeVaultSelectedPath = path;
    host.knowledgeVaultSelectedFolderPath = null;
    host.knowledgeVaultEditorMode = "preview";
    host.knowledgeVaultHighlightLine = null;
    await loadFile(host, path);
  }
}

export async function handleKnowledgeVaultSelectFileFromGraph(host: AppViewState, path: string) {
  await handleKnowledgeVaultSelectFile(host, path);
  host.knowledgeVaultViewMode = "notes";
}

export function handleKnowledgeVaultSidebarResizeStart(host: AppViewState, event: PointerEvent) {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = host.knowledgeVaultSidebarWidth;
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);

  const onMove = (e: PointerEvent) => {
    const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + (e.clientX - startX)));
    host.knowledgeVaultSidebarWidth = next;
  };
  const onUp = (e: PointerEvent) => {
    target.releasePointerCapture(e.pointerId);
    target.removeEventListener("pointermove", onMove);
    target.removeEventListener("pointerup", onUp);
    saveKnowledgeVaultSidebarWidth(host.knowledgeVaultSidebarWidth);
  };
  target.addEventListener("pointermove", onMove);
  target.addEventListener("pointerup", onUp);
}

export function renderKnowledgeVaultPanel(host: AppViewState) {
  if (!host.knowledgeVaultLoadedOnce && !host.knowledgeVaultLoading) {
    host.knowledgeVaultLoadedOnce = true;
    if (host.knowledgeVaultSidebarWidth === 0) {
      host.knowledgeVaultSidebarWidth = loadKnowledgeVaultSidebarWidth();
    }
    queueMicrotask(() => void loadVault(host));
  }
  if (
    host.knowledgeVaultViewMode === "graph" &&
    !host.knowledgeVaultGraphLoading &&
    !host.knowledgeVaultGraph &&
    host.knowledgeVaultLoadedOnce
  ) {
    queueMicrotask(() => void loadGraph(host));
  }

  const filtered = filterFilesByName(host.knowledgeVaultFiles, host.knowledgeVaultQuery);
  const tree = buildFileTree(filtered, host.knowledgeVaultFolders);
  const searchExpanded = new Set<string>();
  if (host.knowledgeVaultQuery.trim() && host.knowledgeVaultSearchMode === "filename") {
    collectExpandedForSearch(tree, host.knowledgeVaultQuery, searchExpanded);
  }

  return renderVaultShell({
    loading: host.knowledgeVaultLoading,
    error: host.knowledgeVaultError,
    saveMessage: host.knowledgeVaultSaveMessage,
    syncing: host.knowledgeVaultSyncing,
    viewMode: host.knowledgeVaultViewMode,
    sidebarWidth: host.knowledgeVaultSidebarWidth || DEFAULT_SIDEBAR,
    vaultDir: host.knowledgeVaultDir,
    fileCount: host.knowledgeVaultFileCount,
    chunkCount: host.knowledgeVaultChunkCount,
    lastSyncedAt: host.knowledgeVaultLastSyncedAt,
    treeNodes: tree,
    graph: host.knowledgeVaultGraph,
    graphLoading: host.knowledgeVaultGraphLoading,
    selectedPath: host.knowledgeVaultSelectedPath,
    content: host.knowledgeVaultContent,
    draftContent: host.knowledgeVaultDraftContent,
    contentLoading: host.knowledgeVaultContentLoading,
    saving: host.knowledgeVaultSaving,
    isDirty: knowledgeVaultIsDirty(host),
    editorMode: host.knowledgeVaultEditorMode,
    highlightLine: host.knowledgeVaultHighlightLine,
    itemModal: host.knowledgeVaultItemModal,
    itemModalSaving: host.knowledgeVaultItemModalSaving,
    itemModalError: host.knowledgeVaultItemModalError,
    folders: host.knowledgeVaultFolders,
    dirSaving: host.knowledgeVaultDirSaving,
    fileTreeProps: {
      selectedPath: host.knowledgeVaultSelectedPath,
      selectedFolderPath: host.knowledgeVaultSelectedFolderPath,
      expandedFolders: host.knowledgeVaultExpandedFolders,
      searchExpanded,
      query: host.knowledgeVaultQuery,
      onToggleFolder: (folderPath) => {
        const set = new Set(host.knowledgeVaultExpandedFolders);
        if (set.has(folderPath)) set.delete(folderPath);
        else set.add(folderPath);
        host.knowledgeVaultExpandedFolders = [...set];
      },
      onSelectFile: (path) => void handleKnowledgeVaultSelectFile(host, path),
      onSelectFolder: (folderPath) => {
        host.knowledgeVaultSelectedFolderPath = folderPath;
      },
      onEditItem: (path, isFolder) => openEditItemModal(host, path, isFolder),
      onDeleteItem: (path, isFolder) => void deleteVaultItem(host, path, isFolder),
    },
    searchPanelProps: {
      query: host.knowledgeVaultQuery,
      searchMode: host.knowledgeVaultSearchMode,
      searchLoading: host.knowledgeVaultSearchLoading,
      searchResults: host.knowledgeVaultSearchResults,
      onQueryChange: (q) => {
        host.knowledgeVaultQuery = q;
        if (host.knowledgeVaultSearchMode === "fulltext" && !q.trim()) {
          host.knowledgeVaultSearchResults = [];
        }
      },
      onSearchModeChange: (mode) => {
        host.knowledgeVaultSearchMode = mode;
        if (mode === "filename") {
          host.knowledgeVaultSearchResults = [];
        }
      },
      onFullTextSearch: () => void runFullTextSearch(host),
      onSelectResult: (hit) => void selectSearchResult(host, hit),
    },
    onRefresh: async () => {
      host.knowledgeVaultGraph = null;
      await loadVault(host);
      if (host.knowledgeVaultViewMode === "graph") await loadGraph(host);
      if (host.knowledgeVaultSelectedPath) await loadFile(host, host.knowledgeVaultSelectedPath);
    },
    onSyncIndex: () => void syncIndex(host),
    onViewModeChange: (mode: KnowledgeVaultViewMode) => {
      host.knowledgeVaultViewMode = mode;
      if (mode === "graph" && !host.knowledgeVaultGraph) void loadGraph(host);
    },
    onConfigureVaultDir: () => void configureVaultDir(host),
    onCreateFile: () => openCreateItemModal(host, "file"),
    onCreateFolder: () => openCreateItemModal(host, "folder"),
    onSidebarResizeStart: (e) => handleKnowledgeVaultSidebarResizeStart(host, e),
    onSelectFile: (path) => void handleKnowledgeVaultSelectFile(host, path),
    onSelectFileFromGraph: (path) => void handleKnowledgeVaultSelectFileFromGraph(host, path),
    onEditorModeChange: (mode: VaultEditorMode) => {
      host.knowledgeVaultEditorMode = mode;
    },
    onDraftChange: (content) => {
      host.knowledgeVaultDraftContent = content;
    },
    onSave: () => void saveCurrentFile(host),
    onBreadcrumbNavigate: (folderPath) => {
      expandFolderPath(host, folderPath);
    },
    onItemModalNameChange: (name) => {
      if (host.knowledgeVaultItemModal) {
        host.knowledgeVaultItemModal = { ...host.knowledgeVaultItemModal, name };
        host.knowledgeVaultItemModalError = null;
      }
    },
    onItemModalParentChange: (parent) => {
      if (host.knowledgeVaultItemModal) {
        host.knowledgeVaultItemModal = { ...host.knowledgeVaultItemModal, parent };
        host.knowledgeVaultItemModalError = null;
      }
    },
    onItemModalSubmit: () => void submitItemModal(host),
    onItemModalClose: () => {
      host.knowledgeVaultItemModal = null;
      host.knowledgeVaultItemModalError = null;
    },
  });
}

async function saveCurrentFile(host: AppViewState) {
  const path = host.knowledgeVaultSelectedPath;
  if (!path) return;
  host.knowledgeVaultSaving = true;
  host.knowledgeVaultSaveMessage = null;
  try {
    await saveVaultFile(host, path, host.knowledgeVaultDraftContent);
    host.knowledgeVaultContent = host.knowledgeVaultDraftContent;
    host.knowledgeVaultGraph = null;
    host.knowledgeVaultSaveMessage = "已保存";
    await loadVault(host);
    void syncIndex(host, "已保存并同步索引");
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
  } finally {
    host.knowledgeVaultSaving = false;
  }
}

async function configureVaultDir(host: AppViewState) {
  const current = host.knowledgeVaultDir.trim();
  const next = await nativePrompt(
    "知识库 Vault 目录（绝对路径，留空则恢复为 workspace/vault 默认路径）",
    current,
  );
  if (next == null) return;
  const trimmed = next.trim();
  host.knowledgeVaultDirSaving = true;
  host.knowledgeVaultError = null;
  try {
    const patch: Record<string, unknown> = {
      agents: {
        defaults: {
          knowledge: {
            enabled: true,
            ...(trimmed ? { vaultDir: trimmed } : { vaultDir: null }),
          },
        },
      },
    };
    await saveConfigPatch(host, patch);
    host.knowledgeVaultLoadedOnce = false;
    host.knowledgeVaultGraph = null;
    host.knowledgeVaultSelectedPath = null;
    host.knowledgeVaultContent = "";
    host.knowledgeVaultDraftContent = "";
    await loadVault(host);
    await syncIndex(host, trimmed ? "目录已更新并同步索引" : "已恢复默认目录并同步索引");
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
  } finally {
    host.knowledgeVaultDirSaving = false;
  }
}

async function runFullTextSearch(host: AppViewState) {
  const q = host.knowledgeVaultQuery.trim();
  if (!q) {
    host.knowledgeVaultSearchResults = [];
    return;
  }
  host.knowledgeVaultSearchLoading = true;
  host.knowledgeVaultError = null;
  try {
    host.knowledgeVaultSearchResults = await searchVaultIndex(host, q, 20);
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
    host.knowledgeVaultSearchResults = [];
  } finally {
    host.knowledgeVaultSearchLoading = false;
  }
}

async function selectSearchResult(host: AppViewState, hit: VaultSearchHit) {
  if (!(await confirmDiscardUnsaved(host))) return;
  host.knowledgeVaultViewMode = "notes";
  host.knowledgeVaultSelectedPath = hit.path;
  host.knowledgeVaultSelectedFolderPath = null;
  host.knowledgeVaultEditorMode = "preview";
  host.knowledgeVaultHighlightLine = hit.startLine;
  await loadFile(host, hit.path);
}

function openCreateItemModal(host: AppViewState, itemType: "file" | "folder") {
  host.knowledgeVaultItemModalError = null;
  host.knowledgeVaultItemModal = {
    mode: "create",
    itemType,
    name: itemType === "file" ? "未命名笔记" : "",
    parent: parentFolderForNew(host),
  };
}

function openEditItemModal(host: AppViewState, path: string, isFolder: boolean) {
  host.knowledgeVaultItemModalError = null;
  host.knowledgeVaultItemModal = {
    mode: "edit",
    path,
    isFolder,
    name: vaultItemBaseName(path, isFolder),
    parent: vaultItemParent(path, isFolder),
  };
}

async function submitItemModal(host: AppViewState) {
  const modal = host.knowledgeVaultItemModal;
  if (!modal) return;
  const name = modal.name.trim();
  if (!name) {
    host.knowledgeVaultItemModalError = modal.mode === "create" ? "请输入名称" : "名称不能为空";
    return;
  }
  host.knowledgeVaultItemModalSaving = true;
  host.knowledgeVaultItemModalError = null;
  try {
    if (modal.mode === "create") {
      const targetPath = joinVaultPath(modal.parent, name);
      if (!targetPath) {
        host.knowledgeVaultItemModalError = "请输入有效的名称";
        return;
      }
      const createIsFolder = modal.itemType === "folder";
      if (
        vaultTargetPathTaken(
          targetPath,
          createIsFolder,
          host.knowledgeVaultFiles,
          host.knowledgeVaultFolders,
        )
      ) {
        host.knowledgeVaultItemModalError = VAULT_PATH_EXISTS_MSG;
        return;
      }
      if (modal.itemType === "folder") {
        await createVaultFolder(host, targetPath);
        expandFolderPath(host, targetPath);
        if (modal.parent) expandFolderPath(host, modal.parent);
        await loadVault(host);
        host.knowledgeVaultSaveMessage = "已创建文件夹";
      } else {
        const file = await createVaultFile(host, targetPath);
        host.knowledgeVaultGraph = null;
        await loadVault(host);
        host.knowledgeVaultSelectedPath = file.path;
        host.knowledgeVaultSelectedFolderPath = null;
        host.knowledgeVaultContent = file.content;
        host.knowledgeVaultDraftContent = file.content;
        host.knowledgeVaultEditorMode = "edit";
        host.knowledgeVaultViewMode = "notes";
        void syncIndex(host, "已创建笔记并同步索引");
      }
    } else {
      let toPath = joinVaultPath(modal.parent, name);
      if (!modal.isFolder && !toPath.toLowerCase().endsWith(".md")) {
        toPath += ".md";
      }
      if (modal.isFolder && (modal.parent === modal.path || isVaultFolderDescendant(modal.path, modal.parent))) {
        host.knowledgeVaultItemModalError = "不能将文件夹移动到自身或其子目录下";
        return;
      }
      if (toPath === modal.path) {
        host.knowledgeVaultItemModal = null;
        return;
      }
      if (
        vaultTargetPathTaken(
          toPath,
          modal.isFolder,
          host.knowledgeVaultFiles,
          host.knowledgeVaultFolders,
          modal.path,
        )
      ) {
        host.knowledgeVaultItemModalError = VAULT_PATH_EXISTS_MSG;
        return;
      }
      await renameVaultPath(host, modal.path, toPath, modal.isFolder);
      if (host.knowledgeVaultSelectedPath === modal.path) {
        host.knowledgeVaultSelectedPath = modal.isFolder ? null : toPath;
        if (!modal.isFolder) await loadFile(host, toPath);
      }
      if (host.knowledgeVaultSelectedFolderPath === modal.path) {
        host.knowledgeVaultSelectedFolderPath = modal.isFolder ? toPath : host.knowledgeVaultSelectedFolderPath;
      }
      host.knowledgeVaultGraph = null;
      await loadVault(host);
      host.knowledgeVaultSaveMessage = modal.isFolder ? "已更新文件夹" : "已更新笔记";
    }
    host.knowledgeVaultItemModal = null;
    host.knowledgeVaultItemModalError = null;
    window.setTimeout(() => {
      host.knowledgeVaultSaveMessage = null;
    }, 2000);
  } catch (err) {
    host.knowledgeVaultItemModalError = formatVaultItemModalError(err);
  } finally {
    host.knowledgeVaultItemModalSaving = false;
  }
}

async function deleteVaultItem(host: AppViewState, path: string, isFolder: boolean) {
  const label = isFolder ? `文件夹「${path}」` : `笔记「${path.replace(/\.md$/i, "")}」`;
  const ok = await nativeConfirm(`确定删除${label}？${isFolder ? "（非空文件夹需二次确认）" : ""}`);
  if (!ok) return;
  host.knowledgeVaultError = null;
  try {
    if (isFolder) {
      try {
        await deleteVaultFolder(host, path, false);
      } catch {
        const force = await nativeConfirm(`文件夹「${path}」非空，确定强制删除全部内容？`);
        if (!force) return;
        await deleteVaultFolder(host, path, true);
      }
      if (host.knowledgeVaultSelectedFolderPath === path) {
        host.knowledgeVaultSelectedFolderPath = null;
      }
    } else {
      await deleteVaultFile(host, path);
      if (host.knowledgeVaultSelectedPath === path) {
        host.knowledgeVaultSelectedPath = null;
        host.knowledgeVaultContent = "";
        host.knowledgeVaultDraftContent = "";
      }
    }
    host.knowledgeVaultGraph = null;
    await loadVault(host);
    host.knowledgeVaultSaveMessage = "已删除";
    window.setTimeout(() => {
      host.knowledgeVaultSaveMessage = null;
    }, 2000);
  } catch (err) {
    host.knowledgeVaultError = (err as Error)?.message ?? String(err);
  }
}

export function knowledgeVaultBeforeUnloadHandler(host: AppViewState) {
  if (host.tab !== "knowledgeVault") return;
  if (knowledgeVaultIsDirty(host)) {
    // Standard pattern; modern browsers show generic message.
    return "您有未保存的笔记更改";
  }
  return undefined;
}
