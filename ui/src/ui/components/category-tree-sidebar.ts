import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fetchCategories, type CategoryTreeNode } from "../controllers/remote-market.ts";
import {
  collectDescendantNames,
  getNodeCount,
  flattenTree,
  type CategorizableItem,
} from "../utils/category-helpers.ts";

@customElement("category-tree-sidebar")
export class CategoryTreeSidebar extends LitElement {
  @property({ type: String }) scope: "skill" | "employee" | "tool" = "skill";
  @property({ type: String }) selectedCategory = "__all__";
  @property({ type: Array }) items: CategorizableItem[] = [];
  @property({ type: String }) keyword = "";
  @property({ type: String }) gatewayHost = "";
  @property({ type: String }) token = "";
  @property({ type: Boolean }) disabled = false;
  @property({ type: Number }) reloadVersion = 0;

  @state() private categoryTree: CategoryTreeNode[] = [];
  @state() private expandedIds = new Set<string | number>();
  @state() private loading = false;
  @state() private error = "";
  private _lastReloadVersion = 0;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .tree-row {
      display: flex;
      align-items: center;
      min-height: 36px;
      padding: 0 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--text-regular);
      font-size: 14px;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
    }
    .tree-row:hover:not(:disabled) {
      color: var(--accent);
    }
    .tree-row.active {
      background: var(--bg-content);
      color: var(--accent);
      font-weight: 500;
    }
    .tree-row:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .tree-caret {
      width: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      margin-right: 4px;
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    .tree-caret.clickable {
      cursor: pointer;
    }
    .tree-caret.clickable:hover {
      color: var(--accent);
    }
    .tree-label {
      flex: 1;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tree-count {
      height: 20px;
      padding: 0 8px;
      border-radius: 999px;
      background: var(--bg-content);
      color: var(--text-secondary);
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 20px;
      flex-shrink: 0;
      margin-left: 4px;
    }
    .tree-row.active .tree-count {
      background: var(--accent);
      color: #ffffff;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadCategories();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("reloadVersion") && this.reloadVersion > 0) {
      // 去重：相同 reloadVersion 不重复加载，避免数据未变时持续刷新
      if (this.reloadVersion !== this._lastReloadVersion) {
        this._lastReloadVersion = this.reloadVersion;
        this.loadCategories();
      }
    }
  }

  private async loadCategories() {
    this.loading = true;
    this.error = "";
    try {
      // openocta 工具库对应官网 MCP 广场，scope 需映射为 mcp
      const apiScope = this.scope === "tool" ? "mcp" : this.scope;
      const tree = await fetchCategories(apiScope, {
        gatewayHost: this.gatewayHost,
        token: this.token,
      });
      // 手动注入 "本地" 节点，用于归类本地技能
      const localNode: CategoryTreeNode = { id: "local", name: "本地", children: [] };
      this.categoryTree = [localNode, ...tree];
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
      this.categoryTree = [];
    } finally {
      this.loading = false;
    }
  }

  private emitCategorySelect(node: CategoryTreeNode) {
    this.dispatchEvent(
      new CustomEvent("category-select", {
        detail: { name: node.name, descendantNames: collectDescendantNames(node) },
        bubbles: true,
        composed: true,
      })
    );
  }

  private toggleExpand(node: CategoryTreeNode, e: Event) {
    e.stopPropagation();
    const next = new Set(this.expandedIds);
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
    }
    this.expandedIds = next;
  }

  render() {
    if (this.loading) {
      return html`<div class="tree-row" style="padding-left:12px;">加载中...</div>`;
    }
    if (this.error) {
      return html`<div class="tree-row" style="padding-left:12px;color:var(--danger);">${this.error}</div>`;
    }

    // 一次性预计算 keyword 过滤后的 items，避免每个节点重复过滤
    const q = (this.keyword ?? "").trim().toLowerCase();
    const filteredItems = q
      ? this.items.filter((it) => {
          const text = `${it.name ?? ""} ${it.description ?? ""}`.toLowerCase();
          return text.includes(q);
        })
      : this.items;

    const allCount = filteredItems.length;
    const flat = flattenTree(this.categoryTree, this.expandedIds);

    // 预计算每个可见节点的 count
    const countMap = new Map<string | number, number>();
    for (const { node } of flat) {
      countMap.set(node.id, getNodeCount(node, filteredItems));
    }

    return html`
      <button
        class="tree-row ${this.selectedCategory === "__all__" ? "active" : ""}"
        type="button"
        ?disabled=${this.disabled}
        @click=${() => this.emitCategorySelect({ id: "__all__", name: "__all__", children: [] })}
      >
        <span class="tree-label">全部</span>
        <span class="tree-count">${allCount}</span>
      </button>
      ${flat.map(({ node, level }) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = this.expandedIds.has(node.id);
        const isActive = this.selectedCategory === node.name;
        const count = countMap.get(node.id) ?? 0;
        const paddingLeft = 12 + level * 16;

        return html`
          <button
            class="tree-row ${isActive ? "active" : ""}"
            type="button"
            ?disabled=${this.disabled}
            style="padding-left:${paddingLeft}px"
            @click=${() => this.emitCategorySelect(node)}
          >
            <span
              class="tree-caret ${hasChildren ? "clickable" : ""}"
              @click=${hasChildren ? (e: Event) => this.toggleExpand(node, e) : undefined}
            >
              ${hasChildren ? (isExpanded ? "▼" : "▶") : ""}
            </span>
            <span class="tree-label">${node.name}</span>
            <span class="tree-count">${count}</span>
          </button>
        `;
      })}
    `;
  }
}
