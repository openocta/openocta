import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { icons } from "../icons.js";

export type VaultTreeNode = {
  name: string;
  filePath: string | null;
  folderPath: string | null;
  children: VaultTreeNode[];
};

export type VaultFileTreeProps = {
  nodes: VaultTreeNode[];
  selectedPath: string | null;
  selectedFolderPath: string | null;
  expandedFolders: string[];
  searchExpanded: Set<string>;
  query: string;
  onToggleFolder: (folderPath: string) => void;
  onSelectFile: (path: string) => void;
  onSelectFolder: (folderPath: string) => void;
  onEditItem: (path: string, isFolder: boolean) => void;
  onDeleteItem: (path: string, isFolder: boolean) => void;
};

export function buildFileTree(
  files: { path: string; title?: string }[],
  folders: string[],
): VaultTreeNode[] {
  const root: VaultTreeNode[] = [];
  const ensureFolder = (list: VaultTreeNode[], name: string, folderPath: string): VaultTreeNode => {
    let node = list.find((n) => n.folderPath === folderPath);
    if (!node) {
      node = { name, filePath: null, folderPath, children: [] };
      list.push(node);
    }
    return node;
  };
  for (const folderPath of folders) {
    const parts = folderPath.split("/");
    let list = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      acc = acc ? `${acc}/${part}` : part;
      const folder = ensureFolder(list, part, acc);
      list = folder.children;
    }
  }
  for (const file of files) {
    const parts = file.path.split("/");
    let list = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      if (isFile) {
        list.push({ name: part, filePath: file.path, folderPath: null, children: [] });
      } else {
        acc = acc ? `${acc}/${part}` : part;
        const folder = ensureFolder(list, part, acc);
        list = folder.children;
      }
    }
  }
  const sortNodes = (nodes: VaultTreeNode[]) => {
    nodes.sort((a, b) => {
      const aFolder = a.filePath === null ? 0 : 1;
      const bFolder = b.filePath === null ? 0 : 1;
      if (aFolder !== bFolder) return aFolder - bFolder;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });
    for (const n of nodes) {
      if (n.children.length) sortNodes(n.children);
    }
  };
  sortNodes(root);
  return root;
}

export function collectExpandedForSearch(nodes: VaultTreeNode[], query: string, expanded: Set<string>) {
  const q = query.trim().toLowerCase();
  if (!q) return;
  for (const node of nodes) {
    if (node.filePath) {
      const match =
        node.filePath.toLowerCase().includes(q) || node.name.toLowerCase().includes(q);
      if (match && node.filePath.includes("/")) {
        const parts = node.filePath.split("/");
        let acc = "";
        for (let i = 0; i < parts.length - 1; i++) {
          acc = acc ? `${acc}/${parts[i]}` : parts[i];
          expanded.add(acc);
        }
      }
    }
    if (node.children.length) {
      collectExpandedForSearch(node.children, query, expanded);
    }
  }
}

export function filterFilesByName<T extends { path: string; title?: string }>(files: T[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return files;
  return files.filter(
    (f) => f.path.toLowerCase().includes(q) || (f.title ?? "").toLowerCase().includes(q),
  );
}

function isFolderExpanded(folderPath: string, props: VaultFileTreeProps) {
  if (props.searchExpanded.has(folderPath)) return true;
  return props.expandedFolders.includes(folderPath);
}

function renderRowActions(
  path: string,
  isFolder: boolean,
  props: VaultFileTreeProps,
): TemplateResult {
  return html`
    <div class="kv-tree__row-actions">
      <button
        type="button"
        class="kv-tree__action"
        title="编辑"
        aria-label="编辑"
        @click=${(e: Event) => {
          e.stopPropagation();
          props.onEditItem(path, isFolder);
        }}
      >
        ${icons.edit}
      </button>
      <button
        type="button"
        class="kv-tree__action kv-tree__action--danger"
        title="删除"
        aria-label="删除"
        @click=${(e: Event) => {
          e.stopPropagation();
          props.onDeleteItem(path, isFolder);
        }}
      >
        ${icons.trash}
      </button>
    </div>
  `;
}

export function renderVaultFileTree(
  nodes: VaultTreeNode[],
  props: VaultFileTreeProps,
  depth = 0,
): TemplateResult {
  return html`
    ${repeat(
      nodes,
      (n) => `${depth}:${n.filePath ?? n.folderPath ?? n.name}`,
      (node) => {
        const isFolder = node.filePath === null && node.folderPath !== null;
        const path = isFolder ? node.folderPath! : node.filePath!;
        const fileSelected = !isFolder && node.filePath === props.selectedPath;
        const folderSelected = isFolder && node.folderPath === props.selectedFolderPath;
        const rowSelected = fileSelected || folderSelected;
        const expanded =
          isFolder && node.folderPath ? isFolderExpanded(node.folderPath, props) : false;

        return html`
          <div class="kv-tree__item">
            <div class="kv-tree__row-wrap ${rowSelected ? "kv-tree__row-wrap--selected" : ""}">
              ${isFolder
                ? html`<button
                    type="button"
                    class="kv-tree__folder"
                    style=${`padding-left:${depth * 14 + 8}px`}
                    @click=${() => {
                      props.onSelectFolder(node.folderPath!);
                      props.onToggleFolder(node.folderPath!);
                    }}
                  >
                    <span
                      class="kv-tree__chevron ${expanded ? "kv-tree__chevron--open" : ""}"
                      aria-hidden="true"
                      >${icons.chevronRight}</span
                    >
                    <span class="kv-tree__icon">${icons.folder}</span>
                    <span class="kv-tree__label">${node.name}</span>
                  </button>`
                : html`<button
                    type="button"
                    class="kv-tree__file ${fileSelected ? "kv-tree__file--active" : ""}"
                    style=${`padding-left:${depth * 14 + 28}px`}
                    @click=${() => props.onSelectFile(node.filePath!)}
                  >
                    <span class="kv-tree__icon">${icons.fileText}</span>
                    <span class="kv-tree__label">${node.name.replace(/\.md$/i, "")}</span>
                  </button>`}
              ${renderRowActions(path, isFolder, props)}
            </div>
            ${isFolder && expanded ? renderVaultFileTree(node.children, props, depth + 1) : nothing}
          </div>
        `;
      },
    )}
  `;
}
