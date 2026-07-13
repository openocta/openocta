import { html, nothing, type TemplateResult } from "lit";

export type VaultItemModalState =
  | { mode: "create"; itemType: "file" | "folder"; name: string; parent: string }
  | { mode: "edit"; path: string; isFolder: boolean; name: string; parent: string };

export type VaultItemModalProps = {
  modal: VaultItemModalState | null;
  folders: string[];
  saving: boolean;
  error: string | null;
  onNameChange: (name: string) => void;
  onParentChange: (parent: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function vaultItemParent(path: string, isFolder: boolean): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return isFolder ? parts.slice(0, -1).join("/") : parts.slice(0, -1).join("/");
}

export function vaultItemBaseName(path: string, isFolder: boolean): string {
  const base = path.split("/").pop() ?? path;
  return isFolder ? base : base.replace(/\.md$/i, "");
}

export function isVaultFolderDescendant(ancestor: string, candidate: string): boolean {
  if (!ancestor) return false;
  return candidate === ancestor || candidate.startsWith(`${ancestor}/`);
}

export function buildVaultParentOptions(
  folders: string[],
  opts?: { excludeFolderPath?: string },
): { value: string; label: string }[] {
  const exclude = opts?.excludeFolderPath ?? "";
  const sorted = [...folders]
    .filter((f) => {
      if (!exclude) return true;
      if (f === exclude) return false;
      return !isVaultFolderDescendant(exclude, f);
    })
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  return [{ value: "", label: "根目录" }, ...sorted.map((f) => ({ value: f, label: f }))];
}

export const VAULT_PATH_EXISTS_MSG = "目标路径已存在，请更换名称或父级目录";

export function normalizeVaultRelPath(path: string, isFolder: boolean): string {
  let p = path.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!p) return "";
  if (!isFolder && !p.toLowerCase().endsWith(".md")) {
    p += ".md";
  }
  return p;
}

/** Returns true if target path collides with an existing file or folder (case-insensitive). */
export function vaultTargetPathTaken(
  targetPath: string,
  isFolder: boolean,
  files: { path: string }[],
  folders: string[],
  excludePath?: string,
): boolean {
  const norm = normalizeVaultRelPath(targetPath, isFolder).toLowerCase();
  if (!norm) return false;
  const exclude = excludePath ? normalizeVaultRelPath(excludePath, isFolder).toLowerCase() : "";
  if (exclude && norm === exclude) return false;
  if (isFolder) {
    return folders.some((f) => f.toLowerCase() === norm);
  }
  return files.some((f) => f.path.toLowerCase() === norm);
}

export function formatVaultItemModalError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.toLowerCase().includes("already exists") ? VAULT_PATH_EXISTS_MSG : msg;
}

export function renderVaultItemModal(props: VaultItemModalProps): TemplateResult {
  const modal = props.modal;
  if (!modal) return nothing;

  const isCreate = modal.mode === "create";
  const title = isCreate
    ? modal.itemType === "file"
      ? "新建笔记"
      : "新建文件夹"
    : modal.isFolder
      ? "编辑文件夹"
      : "编辑笔记";

  const parentOptions = buildVaultParentOptions(props.folders, {
    excludeFolderPath: modal.mode === "edit" && modal.isFolder ? modal.path : undefined,
  });

  return html`
    <div class="modal-overlay" @click=${props.onClose}>
      <div class="modal card kv-item-modal" @click=${(e: Event) => e.stopPropagation()}>
        <h2 class="kv-item-modal__title">${title}</h2>
        ${props.error
          ? html`<div class="kv-item-modal__error" role="alert">${props.error}</div>`
          : nothing}
        <label class="field">
          <span class="field__label">${isCreate ? (modal.itemType === "file" ? "笔记名称" : "文件夹名称") : "名称"}</span>
          <input
            class="input"
            type="text"
            placeholder=${isCreate && modal.itemType === "file" ? "无需 .md 后缀" : ""}
            .value=${modal.name}
            @input=${(e: Event) => props.onNameChange((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="field">
          <span class="field__label">父级目录</span>
          <select
            class="input"
            .value=${modal.parent}
            @change=${(e: Event) => props.onParentChange((e.target as HTMLSelectElement).value)}
          >
            ${parentOptions.map(
              (opt) => html`<option value=${opt.value} ?selected=${modal.parent === opt.value}>${opt.label}</option>`,
            )}
          </select>
        </label>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" ?disabled=${props.saving} @click=${props.onClose}>取消</button>
          <button type="button" class="btn btn--primary" ?disabled=${props.saving} @click=${props.onSubmit}>
            ${props.saving ? "保存中…" : isCreate ? "创建" : "保存"}
          </button>
        </div>
      </div>
    </div>
  `;
}
