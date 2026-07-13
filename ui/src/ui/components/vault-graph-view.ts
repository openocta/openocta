import { LitElement, html, nothing, svg } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ref } from "lit/directives/ref.js";
import type { VaultGraph } from "../controllers/vault.ts";
import { layoutVaultGraph, NODE_RADIUS } from "../views/knowledge-vault-graph.ts";

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

@customElement("vault-graph-view")
export class VaultGraphView extends LitElement {
  @property({ attribute: false }) graph: VaultGraph | null = null;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) selectedPath: string | null = null;
  @property({ attribute: false }) onSelectFile?: (path: string) => void;

  @state() private scale = 1;
  @state() private panX = 0;
  @state() private panY = 0;
  @state() private dragging = false;
  @state() private hoveredPath: string | null = null;
  private dragStart = { x: 0, y: 0, panX: 0, panY: 0 };
  private viewportEl: HTMLElement | null = null;

  protected createRenderRoot() {
    return this;
  }

  /** Zoom while keeping the viewport-local focal point fixed on screen. */
  private zoomAt(focalX: number, focalY: number, nextScale: number) {
    const prevScale = this.scale;
    if (prevScale === nextScale) return;
    this.panX = focalX - ((focalX - this.panX) * nextScale) / prevScale;
    this.panY = focalY - ((focalY - this.panY) * nextScale) / prevScale;
    this.scale = nextScale;
  }

  private viewportCenter(): { x: number; y: number } {
    const el = this.viewportEl;
    if (!el) return { x: 0, y: 0 };
    return { x: el.clientWidth / 2, y: el.clientHeight / 2 };
  }

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const viewport = event.currentTarget as HTMLElement;
    const rect = viewport.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const next = Math.min(4, Math.max(0.25, this.scale * delta));
    this.zoomAt(cx, cy, next);
  };

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const target = event.target as Element | null;
    if (target?.closest(".kv-graph__node")) return;
    this.dragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY, panX: this.panX, panY: this.panY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging) return;
    this.panX = this.dragStart.panX + (event.clientX - this.dragStart.x);
    this.panY = this.dragStart.panY + (event.clientY - this.dragStart.y);
  };

  private onPointerUp = (event: PointerEvent) => {
    this.dragging = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  };

  private resetView() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
  }

  private zoomIn() {
    const { x, y } = this.viewportCenter();
    this.zoomAt(x, y, Math.min(4, this.scale * 1.2));
  }

  private zoomOut() {
    const { x, y } = this.viewportCenter();
    this.zoomAt(x, y, Math.max(0.25, this.scale / 1.2));
  }

  private edgeHighlighted(source: string, target: string) {
    const focus = this.selectedPath ?? this.hoveredPath;
    if (!focus) return false;
    return source === focus || target === focus;
  }

  private nodeLabel(title: string, path: string) {
    const text = title || path;
    return this.scale >= 1.5 ? text : truncate(text, 10);
  }

  render() {
    if (this.loading) {
      return html`<div class="kv-graph__empty">加载图谱…</div>`;
    }
    const graph = this.graph;
    if (!graph || graph.nodes.length === 0) {
      return html`<div class="kv-graph__empty">暂无笔记，可在 Vault 目录添加 .md 文件后刷新。</div>`;
    }

    const width = 1200;
    const height = 640;
    const layout = layoutVaultGraph(graph.nodes, graph.edges, width, height, this.selectedPath);
    const byPath = new Map(layout.map((n) => [n.path, n]));
    const isolated = graph.edges.length === 0;
    const showFullLabels = this.scale >= 1.5;

    return html`
      <div class="kv-graph">
        <div class="kv-graph__toolbar">
          <span class="kv-graph__zoom-label">${Math.round(this.scale * 100)}%</span>
          <button type="button" class="btn btn--ghost btn--sm" @click=${() => this.zoomOut()} aria-label="缩小">−</button>
          <button type="button" class="btn btn--ghost btn--sm" @click=${() => this.zoomIn()} aria-label="放大">+</button>
          <button type="button" class="btn btn--ghost btn--sm" @click=${() => this.resetView()}>重置视图</button>
          <span class="kv-graph__hint muted">滚轮以视口中心缩放 · 拖拽平移 · 点击节点打开笔记</span>
        </div>
        <div
          class="kv-graph__viewport ${this.dragging ? "kv-graph__viewport--dragging" : ""}"
          ${ref((el) => {
            this.viewportEl = (el as HTMLElement | undefined) ?? null;
          })}
          @wheel=${this.onWheel}
          @pointerdown=${this.onPointerDown}
          @pointermove=${this.onPointerMove}
          @pointerup=${this.onPointerUp}
          @pointercancel=${this.onPointerUp}
        >
          <div
            class="kv-graph__stage"
            style=${`transform: translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`}
          >
            ${svg`
            <svg
              class="kv-graph__svg"
              viewBox="0 0 ${width} ${height}"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="知识库文档关系图谱"
              xmlns="http://www.w3.org/2000/svg"
            >
              ${graph.edges.map((e) => {
                const a = byPath.get(e.source);
                const b = byPath.get(e.target);
                if (!a || !b) return nothing;
                const hl = this.edgeHighlighted(e.source, e.target);
                return svg`<line
                  class="kv-graph__edge kv-graph__edge--${e.kind} ${hl ? "kv-graph__edge--highlight" : ""}"
                  x1="${a.x}"
                  y1="${a.y}"
                  x2="${b.x}"
                  y2="${b.y}"
                />`;
              })}
              ${layout.map((n) => {
                const selected = n.path === this.selectedPath;
                const hovered = n.path === this.hoveredPath;
                const label = this.nodeLabel(n.title || n.path, n.path);
                return svg`<g
                  class="kv-graph__node ${isolated ? "kv-graph__node--isolated" : ""} ${selected ? "kv-graph__node--selected" : ""} ${hovered ? "kv-graph__node--hover" : ""}"
                  transform="translate(${n.x} ${n.y})"
                  @click=${() => this.onSelectFile?.(n.path)}
                  @mouseenter=${() => {
                    this.hoveredPath = n.path;
                  }}
                  @mouseleave=${() => {
                    if (this.hoveredPath === n.path) this.hoveredPath = null;
                  }}
                >
                  <title>${n.title || n.path}</title>
                  <circle
                    class="kv-graph__node-circle"
                    r="${NODE_RADIUS}"
                    fill="rgba(99, 102, 241, 0.18)"
                    stroke="#6366f1"
                    stroke-width="2"
                  />
                  <text
                    class="kv-graph__node-label ${showFullLabels ? "kv-graph__node-label--full" : ""}"
                    text-anchor="middle"
                    dy="4"
                    fill="currentColor"
                  >
                    ${label}
                  </text>
                </g>`;
              })}
            </svg>
          `}
          </div>
        </div>
        <div class="kv-graph__legend">
          ${graph.edges.length > 0
            ? html`
                <span><i class="kv-graph__dot kv-graph__dot--wiki"></i>双链 [[ ]]</span>
                <span><i class="kv-graph__dot kv-graph__dot--md"></i>Markdown 链接</span>
              `
            : html`<span>无链接时显示孤立笔记节点（Obsidian 图谱风格）</span>`}
          <span>${graph.nodes.length} 篇笔记 · ${graph.edges.length} 条链接</span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vault-graph-view": VaultGraphView;
  }
}
