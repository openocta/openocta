import { html, nothing, type TemplateResult } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import type { SwarmState, SwarmToolEntry } from "../controllers/swarm.ts";
import type { SwarmGraphNode, SwarmHistoryEntry, SwarmMember } from "../types/swarm-types.ts";
import { icons } from "../icons.ts";
import { toSanitizedMarkdownHtml } from "../markdown.ts";
import { t } from "../strings.js";

const VIZ_WIDTH = 720;
const VIZ_HEIGHT = 320;
const MID_SPLITTER = 6;

export type AgentSwarmProps = SwarmState & {
  swarmTreeCollapsed: Record<string, boolean>;
  swarmMidSplit: number;
  swarmEventsCollapsed: boolean;
  swarmVizScale: number;
  swarmVizOffsetX: number;
  swarmVizOffsetY: number;
  swarmPanelCollapsed: Record<string, boolean>;
  onSelectWorkspace: (id: string) => void;
  onOpenDeleteWorkspace: (id: string, label: string) => void;
  onStopAll: () => void;
  onSelectMember: (id: string) => void;
  onOpenCreateWorkspace: () => void;
  onStartConversation: () => void;
  onOpenAddMember: () => void;
  createModalOpen: boolean;
  createModalLabel: string;
  onCreateModalClose: () => void;
  onCreateModalLabelChange: (value: string) => void;
  onCreateModalSubmit: () => void;
  deleteModalOpen: boolean;
  deleteModalLabel: string;
  onDeleteModalClose: () => void;
  onDeleteModalSubmit: () => void;
  addMemberModalOpen: boolean;
  addMemberEmployeeId: string;
  addMemberLabel: string;
  onAddMemberModalClose: () => void;
  onAddMemberEmployeeIdChange: (value: string) => void;
  onAddMemberLabelChange: (value: string) => void;
  onAddMemberModalSubmit: () => void;
  onSend: () => void;
  onInputChange: (value: string) => void;
  onTreeToggle: (memberId: string) => void;
  onMidSplitChange: (ratio: number) => void;
  onEventsCollapsedChange: (collapsed: boolean) => void;
  onVizScaleChange: (scale: number) => void;
  onVizOffsetChange: (x: number, y: number) => void;
  onPanelToggle: (panelId: string) => void;
};

type TreeRow = {
  member: SwarmMember;
  depth: number;
  hasChildren: boolean;
  collapsed: boolean;
  guides: boolean[];
  isLast: boolean;
};

type VizLayout = {
  positions: Map<string, { x: number; y: number }>;
  ordered: SwarmMember[];
  edges: Array<{ fromId: string; toId: string }>;
};

type VizEvent = {
  id: string;
  kind: "agent" | "message" | "llm";
  label: string;
  at: number;
};

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function statusClass(status: string): "idle" | "busy" | "failed" {
  if (status === "busy") return "busy";
  if (status === "failed") return "failed";
  return "idle";
}

function memberKind(m: SwarmMember, graphNodes: SwarmGraphNode[]): string {
  const gn = graphNodes.find((n) => n.id === m.id);
  if (gn?.kind) return gn.kind;
  if (!(m.parentId ?? "").trim()) return "assistant";
  return m.subagentType ?? "agent";
}

function buildTreeRows(
  members: SwarmMember[],
  collapsed: Record<string, boolean>,
): TreeRow[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const childrenById = new Map<string, SwarmMember[]>();
  const roots: SwarmMember[] = [];

  const byCreated = (a: SwarmMember, b: SwarmMember) => a.createdAt - b.createdAt;

  for (const m of members) {
    const parentId = (m.parentId ?? "").trim();
    const parent = parentId && parentId !== m.id ? byId.get(parentId) : null;
    if (parent && parent.id !== m.id) {
      const list = childrenById.get(parent.id) ?? [];
      list.push(m);
      childrenById.set(parent.id, list);
    } else {
      roots.push(m);
    }
  }
  for (const list of childrenById.values()) list.sort(byCreated);
  roots.sort(byCreated);

  const rows: TreeRow[] = [];
  const walk = (member: SwarmMember, depth: number, guides: boolean[], isLast: boolean) => {
    const kids = (childrenById.get(member.id) ?? []).filter((c) => c.id !== member.id);
    const hasChildren = kids.length > 0;
    const isCollapsed = Boolean(collapsed[member.id]);
    rows.push({ member, depth, hasChildren, collapsed: isCollapsed, guides, isLast });
    if (hasChildren && !isCollapsed) {
      kids.forEach((child, index) => {
        const childLast = index === kids.length - 1;
        walk(child, depth + 1, [...guides, !childLast], childLast);
      });
    }
  };
  roots.forEach((root, index) => walk(root, 0, [], index === roots.length - 1));
  return rows;
}

function computeVizLayout(members: SwarmMember[]): VizLayout {
  const width = VIZ_WIDTH;
  const height = VIZ_HEIGHT;
  const paddingX = 70;
  const paddingY = 60;
  const byId = new Map(members.map((m) => [m.id, m]));
  const childrenById = new Map<string, SwarmMember[]>();
  const parentById = new Map<string, string | null>();
  const roots: SwarmMember[] = [];

  for (const m of members) {
    const parentId = (m.parentId ?? "").trim();
    if (parentId && parentId !== m.id && byId.has(parentId)) {
      const list = childrenById.get(parentId) ?? [];
      list.push(m);
      childrenById.set(parentId, list);
      parentById.set(m.id, parentId);
    } else {
      roots.push(m);
      parentById.set(m.id, null);
    }
  }

  const byCreated = (a: SwarmMember, b: SwarmMember) => a.createdAt - b.createdAt;
  for (const list of childrenById.values()) list.sort(byCreated);
  roots.sort(byCreated);

  const nodeMeta = new Map<string, { xIndex: number; depth: number }>();
  let leafIndex = 0;
  let maxDepth = 0;
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const walk = (member: SwarmMember, depth: number): { min: number; max: number } => {
    if (visited.has(member.id)) {
      const meta = nodeMeta.get(member.id);
      if (meta) return { min: meta.xIndex, max: meta.xIndex };
    }
    if (visiting.has(member.id)) {
      const xIndex = leafIndex++;
      nodeMeta.set(member.id, { xIndex, depth });
      return { min: xIndex, max: xIndex };
    }
    visiting.add(member.id);
    maxDepth = Math.max(maxDepth, depth);
    const children = (childrenById.get(member.id) ?? []).filter((c) => c.id !== member.id);
    let range: { min: number; max: number };
    if (children.length === 0) {
      const xIndex = leafIndex++;
      nodeMeta.set(member.id, { xIndex, depth });
      range = { min: xIndex, max: xIndex };
    } else {
      const ranges = children.map((child) => walk(child, depth + 1));
      const min = ranges[0]?.min ?? leafIndex;
      const max = ranges[ranges.length - 1]?.max ?? min;
      nodeMeta.set(member.id, { xIndex: (min + max) / 2, depth });
      range = { min, max };
    }
    visiting.delete(member.id);
    visited.add(member.id);
    return range;
  };

  roots.forEach((root) => walk(root, 0));
  for (const m of members) {
    if (!nodeMeta.has(m.id)) walk(m, 0);
  }

  const leafCount = Math.max(1, leafIndex);
  const depthCount = Math.max(1, maxDepth + 1);
  const xSpan = Math.max(1, width - paddingX * 2);
  const xStart = (width - xSpan) / 2;
  const ySpan = Math.max(1, height - paddingY * 2);
  const xStep = leafCount === 1 ? 0 : xSpan / (leafCount - 1);
  const yStep = depthCount === 1 ? 0 : ySpan / (depthCount - 1);

  const positions = new Map<string, { x: number; y: number }>();
  for (const m of members) {
    const meta = nodeMeta.get(m.id);
    if (!meta) continue;
    positions.set(m.id, {
      x: xStart + meta.xIndex * xStep,
      y: paddingY + meta.depth * yStep,
    });
  }

  const ordered = [...members].sort((a, b) => {
    const da = nodeMeta.get(a.id)?.depth ?? 0;
    const db = nodeMeta.get(b.id)?.depth ?? 0;
    if (da !== db) return da - db;
    return byCreated(a, b);
  });

  const edges: Array<{ fromId: string; toId: string }> = [];
  for (const [parentId, children] of childrenById.entries()) {
    for (const child of children) {
      edges.push({ fromId: parentId, toId: child.id });
    }
  }

  return { positions, ordered, edges };
}

function buildVizEvents(history: SwarmHistoryEntry[]): VizEvent[] {
  return history.slice(-24).map((h) => ({
    id: h.id,
    kind: h.role === "user" ? "message" : h.role === "assistant" ? "llm" : "agent",
    label: `${h.memberLabel ?? h.memberId.slice(0, 8)}: ${h.text.slice(0, 48)}${h.text.length > 48 ? "…" : ""}`,
    at: h.timestamp,
  }));
}

function startMidResize(e: PointerEvent, props: AgentSwarmProps) {
  e.preventDefault();
  const stack = (e.currentTarget as HTMLElement).closest(".agent-swarm__mid-stack");
  if (!stack) return;
  const rect = stack.getBoundingClientRect();
  const onMove = (ev: PointerEvent) => {
    const y = ev.clientY - rect.top;
    const ratio = Math.min(0.82, Math.max(0.18, y / rect.height));
    props.onMidSplitChange(ratio);
  };
  const onUp = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
  };
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

function renderTreeGuides(guides: boolean[], isLast: boolean) {
  return html`
    <span class="agent-swarm__tree-prefix">
      ${guides.map(
        (hasLine) =>
          html`<span class=${hasLine ? "agent-swarm__tree-line" : "agent-swarm__tree-blank"}></span>`,
      )}
      <span class="agent-swarm__tree-elbow ${isLast ? "last" : ""}"></span>
    </span>
  `;
}

let vizPanStart: { x: number; y: number; ox: number; oy: number } | null = null;

function renderTreeRow(row: TreeRow, props: AgentSwarmProps) {
  const { member, depth, hasChildren, collapsed, guides, isLast } = row;
  const active = member.id === props.swarmSelectedMemberId;
  const pad = depth * 14;
  return html`
    <div
      class="agent-swarm__row ${active ? "active" : ""}"
      role="button"
      tabindex="0"
      style="padding-left: ${12 + pad}px"
      @click=${() => props.onSelectMember(member.id)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          props.onSelectMember(member.id);
        }
      }}
    >
      ${depth > 0 ? renderTreeGuides(guides, isLast) : nothing}
      ${hasChildren
        ? html`
            <button
              type="button"
              class="agent-swarm__tree-caret"
              @click=${(e: Event) => {
                e.stopPropagation();
                props.onTreeToggle(member.id);
              }}
            >
              ${collapsed ? "▸" : "▾"}
            </button>
          `
        : html`<span class="agent-swarm__tree-caret-placeholder"></span>`}
      <span class="agent-swarm__row-label">${member.label}</span>
      <span class="agent-swarm__row-status agent-swarm__row-status--${member.status}"
        >${member.status.toUpperCase()}</span
      >
    </div>
  `;
}

function renderSwarmMessageContent(entry: SwarmHistoryEntry) {
  const text = entry.text ?? "";
  if (entry.role === "assistant" && text.trim()) {
    return html`<div class="agent-swarm__bubble-body chat-text">${unsafeHTML(toSanitizedMarkdownHtml(text))}</div>`;
  }
  return html`<div class="agent-swarm__bubble-body">${text}</div>`;
}

function renderChatBubbles(
  history: SwarmHistoryEntry[],
  streamText?: string,
  streamLabel?: string,
) {
  const bubbles = history.map((h) => {
    const isMe = h.role === "user";
    return html`
      <div
        class="agent-swarm__bubble-row"
        style="justify-content: ${isMe ? "flex-end" : "flex-start"}"
      >
        <div class="agent-swarm__bubble ${isMe ? "me" : "other"}">
          <div class="agent-swarm__bubble-meta">
            ${formatTime(h.timestamp)} · ${h.memberLabel ?? h.memberId.slice(0, 8)}
          </div>
          ${renderSwarmMessageContent(h)}
        </div>
      </div>
    `;
  });
  const streaming = (streamText ?? "").trim();
  if (streaming) {
    bubbles.push(html`
      <div class="agent-swarm__bubble-row" style="justify-content: flex-start">
        <div class="agent-swarm__bubble other streaming">
          <div class="agent-swarm__bubble-meta">
            ${formatTime(Date.now())} · ${streamLabel ?? "Assistant"} · 输出中
          </div>
          <div class="agent-swarm__bubble-body chat-text">
            ${unsafeHTML(toSanitizedMarkdownHtml(streaming))}
          </div>
        </div>
      </div>
    `);
  }
  if (bubbles.length === 0) {
    return html`<div class="agent-swarm__chat-empty muted">暂无消息，在下方描述任务开始协作</div>`;
  }
  return bubbles;
}

function renderWorkspaceList(props: AgentSwarmProps) {
  const sorted = [...props.swarmWorkspaces].sort((a, b) => b.updatedAt - a.updatedAt);
  if (sorted.length === 0) {
    return html`<div class="agent-swarm__muted" style="padding:12px 16px">暂无房间</div>`;
  }
  return sorted.map((w) => {
    const active = w.id === props.swarmActiveWorkspaceId;
    return html`
      <div class="agent-swarm__ws-row-wrap ${active ? "active" : ""}">
        <button
          type="button"
          class="agent-swarm__ws-row ${active ? "active" : ""}"
          @click=${() => props.onSelectWorkspace(w.id)}
        >
          <span class="agent-swarm__ws-row-label">${w.label}</span>
          <span class="agent-swarm__mono agent-swarm__ws-row-id">${w.id.slice(0, 8)}…</span>
        </button>
        <button
          type="button"
          class="agent-swarm__ws-delete"
          title="删除房间"
          aria-label="删除房间"
          ?disabled=${props.swarmLoading}
          @click=${(e: Event) => {
            e.stopPropagation();
            props.onOpenDeleteWorkspace(w.id, w.label);
          }}
        >
          ${icons.trash}
        </button>
      </div>
    `;
  });
}

function renderCreateWorkspaceModal(props: AgentSwarmProps) {
  return html`
    <div class="modal-overlay" @click=${props.onCreateModalClose}>
      <div class="modal card agent-swarm__modal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="agent-swarm__modal-header">
          <h2 class="agent-swarm__modal-title">新建房间</h2>
          <button type="button" class="agent-swarm__modal-close" aria-label="关闭" @click=${props.onCreateModalClose}>
            ${icons.x}
          </button>
        </div>
        <label class="agent-swarm__modal-field">
          <span class="agent-swarm__modal-label">名称</span>
          <input
            class="agent-swarm__modal-input"
            type="text"
            placeholder="例如：产品需求分析"
            .value=${props.createModalLabel}
            @input=${(e: Event) => props.onCreateModalLabelChange((e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                props.onCreateModalSubmit();
              }
            }}
          />
        </label>
        <div class="modal__actions">
          <button type="button" class="btn" @click=${props.onCreateModalClose}>取消</button>
          <button
            type="button"
            class="btn primary"
            ?disabled=${!props.createModalLabel.trim() || props.swarmLoading}
            @click=${props.onCreateModalSubmit}
          >
            ${props.swarmLoading ? "创建中…" : "创建"}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderDeleteWorkspaceModal(props: AgentSwarmProps) {
  return html`
    <div class="modal-overlay" @click=${props.onDeleteModalClose}>
      <div class="modal card agent-swarm__modal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="agent-swarm__modal-header">
          <h2 class="agent-swarm__modal-title">删除房间</h2>
          <button type="button" class="agent-swarm__modal-close" aria-label="关闭" @click=${props.onDeleteModalClose}>
            ${icons.x}
          </button>
        </div>
        <p class="agent-swarm__modal-hint">
          确定删除房间「<strong>${props.deleteModalLabel}</strong>」？将同时删除其全部成员、蜂群历史及关联的聊天会话（含 transcript），且无法恢复。
        </p>
        <div class="modal__actions">
          <button type="button" class="btn" @click=${props.onDeleteModalClose}>取消</button>
          <button
            type="button"
            class="btn danger"
            ?disabled=${props.swarmLoading}
            @click=${props.onDeleteModalSubmit}
          >
            ${props.swarmLoading ? "删除中…" : "删除"}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderAddMemberModal(props: AgentSwarmProps) {
  return html`
    <div class="modal-overlay" @click=${props.onAddMemberModalClose}>
      <div class="modal card agent-swarm__modal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="agent-swarm__modal-header">
          <h2 class="agent-swarm__modal-title">添加成员（可选）</h2>
          <button type="button" class="agent-swarm__modal-close" aria-label="关闭" @click=${props.onAddMemberModalClose}>
            ${icons.x}
          </button>
        </div>
        <p class="agent-swarm__modal-hint muted">留空数字员工 ID 将创建通用子 Agent；也可在对话中由 Assistant 自动拆分。</p>
        <label class="agent-swarm__modal-field">
          <span class="agent-swarm__modal-label">数字员工 ID（可选）</span>
          <input
            class="agent-swarm__modal-input"
            type="text"
            placeholder="留空则创建通用子 Agent"
            .value=${props.addMemberEmployeeId}
            @input=${(e: Event) => props.onAddMemberEmployeeIdChange((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="agent-swarm__modal-field">
          <span class="agent-swarm__modal-label">子 Agent 名称（可选）</span>
          <input
            class="agent-swarm__modal-input"
            type="text"
            placeholder="子任务"
            .value=${props.addMemberLabel}
            @input=${(e: Event) => props.onAddMemberLabelChange((e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") {
                e.preventDefault();
                props.onAddMemberModalSubmit();
              }
            }}
          />
        </label>
        <div class="modal__actions">
          <button type="button" class="btn" @click=${props.onAddMemberModalClose}>取消</button>
          <button type="button" class="btn primary" ?disabled=${props.swarmLoading} @click=${props.onAddMemberModalSubmit}>
            添加
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSwarmToolEntries(entries: SwarmToolEntry[]) {
  return html`${entries.map(
    (entry) => html`
      <div class="agent-swarm__tool-entry">
        <div class="agent-swarm__tool-name mono">${entry.name}</div>
        ${entry.args
          ? html`<pre class="agent-swarm__tool-block">${entry.args}</pre>`
          : nothing}
        ${entry.output !== undefined
          ? html`<pre class="agent-swarm__tool-block ${entry.isError ? "is-error" : ""}">${entry.output || "（无输出）"}</pre>`
          : html`<span class="muted">执行中…</span>`}
      </div>
    `,
  )}`;
}

function renderRightPanel(
  id: string,
  title: string,
  collapsed: boolean,
  body: TemplateResult | typeof nothing,
  props: AgentSwarmProps,
) {
  return html`
    <section class="agent-swarm__agent-panel ${collapsed ? "collapsed" : ""}">
      <button type="button" class="agent-swarm__agent-panel-header" @click=${() => props.onPanelToggle(id)}>
        <span class="agent-swarm__agent-panel-caret">${collapsed ? "▸" : "▾"}</span>
        <span>${title}</span>
      </button>
      ${collapsed ? nothing : html`<div class="agent-swarm__agent-panel-body">${body}</div>`}
    </section>
  `;
}

export function renderAgentSwarm(props: AgentSwarmProps) {
  const ws = props.swarmWorkspaces.find((w) => w.id === props.swarmActiveWorkspaceId);
  const selected = props.swarmMembers.find((m) => m.id === props.swarmSelectedMemberId);
  const rootMembers = props.swarmMembers.filter((m) => !(m.parentId ?? "").trim());
  const graphNodes = props.swarmGraph?.nodes ?? [];
  const treeRows = buildTreeRows(props.swarmMembers, props.swarmTreeCollapsed);
  const vizLayout = computeVizLayout(props.swarmMembers);
  const vizEvents = buildVizEvents(props.swarmHistory);
  const memberHistory = props.swarmSelectedMemberId
    ? props.swarmHistory.filter((h) => h.memberId === props.swarmSelectedMemberId)
    : props.swarmHistory;

  const canSend =
    props.connected &&
    Boolean(props.swarmActiveWorkspaceId) &&
    Boolean(props.swarmSelectedMemberId) &&
    !props.swarmSending;

  const hasRunningAgents =
    props.swarmSending || props.swarmMembers.some((m) => m.status === "busy");

  const midChatPct = Math.round(props.swarmMidSplit * 1000) / 10;

  if (!props.swarmActiveWorkspaceId && !props.swarmLoading) {
    return html`
      <div class="agent-swarm agent-swarm--empty-shell">
        <div class="agent-swarm__empty">
          <div class="agent-swarm__empty-title">开始蜂群协作</div>
          <p class="agent-swarm__empty-hint">
            无需预先添加数字员工。创建房间后直接与 Assistant 对话，它会根据任务自动拆分子 Agent。
          </p>
          ${props.swarmError ? html`<div class="agent-swarm__toast">${props.swarmError}</div>` : nothing}
          <button type="button" class="agent-swarm__btn agent-swarm__btn--primary" ?disabled=${!props.connected} @click=${props.onStartConversation}>
            开始对话
          </button>
        </div>
      </div>
    `;
  }

  return html`
    <div class="agent-swarm">
      <div class="agent-swarm__shell">
        <aside class="agent-swarm__panel agent-swarm__panel--left">
          <header class="agent-swarm__header">
            <div>
              <div class="agent-swarm__header-title">房间</div>
              <div class="agent-swarm__mono muted">${ws?.id ?? "—"}</div>
            </div>
            <button type="button" class="agent-swarm__btn agent-swarm__btn--sm" title="新建房间" @click=${props.onOpenCreateWorkspace}>+</button>
          </header>
          <div class="agent-swarm__ws-section">
            <div class="agent-swarm__section-label">房间</div>
            <div class="agent-swarm__ws-list">${renderWorkspaceList(props)}</div>
          </div>
          <div class="agent-swarm__section-label agent-swarm__section-label--members">成员 · ${ws?.label ?? ""}</div>
          ${props.swarmError ? html`<div class="agent-swarm__toast">${props.swarmError}</div>` : nothing}
          ${props.swarmLoading ? html`<div class="agent-swarm__muted" style="padding:12px">加载中…</div>` : nothing}
          <div class="agent-swarm__list agent-swarm__list--members">
            ${treeRows.length === 0
              ? html`<div class="agent-swarm__muted" style="padding:16px">暂无成员</div>`
              : treeRows.map((row) => renderTreeRow(row, props))}
          </div>
          <div class="agent-swarm__sidebar-footer">
            <button type="button" class="agent-swarm__btn agent-swarm__btn--sm" @click=${props.onOpenAddMember}>
              添加成员（可选）
            </button>
          </div>
        </aside>

        <main class="agent-swarm__panel agent-swarm__panel--mid">
          <header class="agent-swarm__header">
            <div class="agent-swarm__header-title">${ws?.label ?? "蜂群对话"}</div>
            <div class="agent-swarm__header-actions">
              ${props.swarmSending ? html`<span class="agent-swarm__status-hint muted">发送中…</span>` : nothing}
              ${hasRunningAgents
                ? html`
                    <button
                      type="button"
                      class="agent-swarm__btn agent-swarm__btn--sm agent-swarm__btn--danger"
                      ?disabled=${!props.connected || props.swarmLoading}
                      @click=${props.onStopAll}
                    >
                      全部停止
                    </button>
                  `
                : nothing}
            </div>
          </header>

          <div
            class="agent-swarm__mid-stack"
            style="grid-template-rows: minmax(120px, ${midChatPct}%) ${MID_SPLITTER}px minmax(160px, 1fr)"
          >
            <div class="agent-swarm__chat">
              ${renderChatBubbles(
                props.swarmHistory,
                props.swarmStreamText,
                selected?.label ?? props.swarmMembers.find((m) => m.id === props.swarmSelectedMemberId)?.label,
              )}
            </div>

            <div
              class="agent-swarm__mid-resizer"
              @pointerdown=${(e: PointerEvent) => startMidResize(e, props)}
            ></div>

            <div class="agent-swarm__viz-shell">
              <div
                class="agent-swarm__viz-canvas"
                @mousedown=${(e: MouseEvent) => {
                  if (e.button !== 0) return;
                  vizPanStart = {
                    x: e.clientX,
                    y: e.clientY,
                    ox: props.swarmVizOffsetX,
                    oy: props.swarmVizOffsetY,
                  };
                }}
                @mousemove=${(e: MouseEvent) => {
                  if (!vizPanStart) return;
                  props.onVizOffsetChange(
                    vizPanStart.ox + e.clientX - vizPanStart.x,
                    vizPanStart.oy + e.clientY - vizPanStart.y,
                  );
                }}
                @mouseup=${() => {
                  vizPanStart = null;
                }}
                @mouseleave=${() => {
                  vizPanStart = null;
                }}
              >
                <div class="agent-swarm__viz-toolbar mono">
                  <span>缩放 ${Math.round(props.swarmVizScale * 100)}%</span>
                  <button
                    type="button"
                    class="agent-swarm__btn agent-swarm__btn--xs"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      props.onVizScaleChange(Math.min(props.swarmVizScale + 0.1, 2));
                    }}
                  >+</button>
                  <button
                    type="button"
                    class="agent-swarm__btn agent-swarm__btn--xs"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      props.onVizScaleChange(Math.max(props.swarmVizScale - 0.1, 0.5));
                    }}
                  >−</button>
                  <button
                    type="button"
                    class="agent-swarm__btn agent-swarm__btn--xs"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      props.onVizScaleChange(0.9);
                      props.onVizOffsetChange(0, 0);
                    }}
                  >Reset</button>
                </div>

                <div
                  class="agent-swarm__viz-stage"
                  style="transform: translate(${props.swarmVizOffsetX}px, ${props.swarmVizOffsetY}px) scale(${props.swarmVizScale})"
                >
                  <svg
                    class="agent-swarm__viz-svg"
                    width=${VIZ_WIDTH}
                    height=${VIZ_HEIGHT}
                    viewBox="0 0 ${VIZ_WIDTH} ${VIZ_HEIGHT}"
                  >
                    <g>
                      ${vizLayout.edges.map((edge) => {
                        const from = vizLayout.positions.get(edge.fromId);
                        const to = vizLayout.positions.get(edge.toId);
                        if (!from || !to) return nothing;
                        const midY = (from.y + to.y) / 2;
                        const path = `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
                        return html`<path class="agent-swarm__viz-edge" d=${path} />`;
                      })}
                    </g>
                  </svg>

                  ${vizLayout.ordered.map((m) => {
                    const pos = vizLayout.positions.get(m.id);
                    if (!pos) return nothing;
                    const kind = memberKind(m, graphNodes);
                    const isActive = m.id === props.swarmSelectedMemberId;
                    const st = statusClass(m.status);
                    return html`
                      <button
                        type="button"
                        class="agent-swarm__viz-node ${isActive ? "active" : ""}"
                        style="left: ${pos.x}px; top: ${pos.y}px"
                        title=${m.label}
                        @click=${() => props.onSelectMember(m.id)}
                      >
                        ${isActive
                          ? html`
                              <span class="agent-swarm__viz-reticle">
                                <span class="agent-swarm__viz-reticle-pulse"></span>
                              </span>
                            `
                          : nothing}
                        <span class="agent-swarm__viz-node-ring agent-swarm__viz-node-ring--${st}">
                          <span class="agent-swarm__viz-node-icon">${kind === "assistant" ? "◎" : "◉"}</span>
                        </span>
                        <span class="agent-swarm__viz-node-label">${m.label}</span>
                        <span class="agent-swarm__viz-node-status agent-swarm__viz-node-status--${st}"
                          >${m.status}</span
                        >
                      </button>
                    `;
                  })}
                </div>
              </div>

              <aside class="agent-swarm__viz-events ${props.swarmEventsCollapsed ? "collapsed" : ""}">
                ${props.swarmEventsCollapsed
                  ? nothing
                  : html`
                      <div class="agent-swarm__viz-events-head">
                        <span>事件流</span>
                        <span class="mono muted">${vizEvents.length}</span>
                        <button
                          type="button"
                          class="agent-swarm__viz-events-toggle"
                          @click=${() => props.onEventsCollapsedChange(true)}
                        >
                          ${icons.chevronRight}
                        </button>
                      </div>
                      ${vizEvents.length === 0
                        ? html`<div class="muted">暂无事件</div>`
                        : vizEvents
                            .slice()
                            .reverse()
                            .slice(0, 8)
                            .map(
                              (evt) => html`
                                <div class="agent-swarm__viz-event">
                                  <div class="agent-swarm__viz-event-label">
                                    <span class="agent-swarm__viz-event-dot agent-swarm__viz-event-dot--${evt.kind}"></span>
                                    ${evt.label}
                                  </div>
                                  <div class="mono muted">${formatTime(evt.at)}</div>
                                </div>
                              `,
                            )}
                    `}
              </aside>
              ${props.swarmEventsCollapsed
                ? html`
                    <button
                      type="button"
                      class="agent-swarm__viz-events-toggle agent-swarm__viz-events-toggle--float"
                      @click=${() => props.onEventsCollapsedChange(false)}
                    >
                      ${icons.chevronRight}
                    </button>
                  `
                : nothing}
            </div>
          </div>

          <footer class="agent-swarm__composer">
            <textarea
              class="agent-swarm__textarea"
              placeholder=${rootMembers[0]
                ? `向 ${rootMembers[0].label} 描述任务（Ctrl/Enter 发送，将自动拆分子 Agent）…`
                : "描述你的任务…"}
              .value=${props.swarmInput}
              ?disabled=${!canSend}
              @input=${(e: Event) => props.onInputChange((e.target as HTMLTextAreaElement).value)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  props.onSend();
                }
              }}
            ></textarea>
            <button
              type="button"
              class="agent-swarm__btn agent-swarm__btn--primary"
              ?disabled=${!canSend || !props.swarmInput.trim()}
              @click=${props.onSend}
            >
              发送
            </button>
          </footer>
        </main>

        <aside class="agent-swarm__panel agent-swarm__panel--right">
          <header class="agent-swarm__header">
            <div>
              <div class="agent-swarm__header-title">${selected?.label ?? "成员详情"}</div>
              <div class="agent-swarm__mono muted">${selected?.id?.slice(0, 12) ?? "—"}</div>
            </div>
          </header>
          <div class="agent-swarm__agent-sidebar-body">
            ${selected
              ? html`
                  <div class="agent-swarm__mono muted">
                    ${selected.status.toUpperCase()}
                    ${selected.taskId ? html` · task ${selected.taskId.slice(0, 8)}` : nothing}
                    ${selected.sessionKey ? html`<br />${selected.sessionKey}` : nothing}
                  </div>
                `
              : html`<div class="muted">选择左侧成员或拓扑节点查看详情</div>`}

            <div class="agent-swarm__agent-panels">
              ${renderRightPanel(
                "history",
                "消息历史",
                Boolean(props.swarmPanelCollapsed.history),
                memberHistory.length === 0
                  ? html`<span class="muted">暂无记录</span>`
                  : html`${memberHistory.map(
                      (h) => html`
                        <div class="agent-swarm__history-item">
                          <span class="mono muted">${formatTime(h.timestamp)} · ${h.role}</span>
                          ${h.role === "assistant" && (h.text ?? "").trim()
                            ? html`<div class="chat-text agent-swarm__panel-md">${unsafeHTML(toSanitizedMarkdownHtml(h.text))}</div>`
                            : html`<span>${h.text}</span>`}
                        </div>
                      `,
                    )}`,
                props,
              )}
              ${props.swarmStreamText.trim()
                ? renderRightPanel(
                    "content",
                    "流式内容",
                    Boolean(props.swarmPanelCollapsed.content),
                    html`<div class="chat-text agent-swarm__panel-md">${unsafeHTML(toSanitizedMarkdownHtml(props.swarmStreamText))}</div>`,
                    props,
                  )
                : nothing}
              ${props.swarmReasoningText.trim()
                ? renderRightPanel(
                    "reasoning",
                    "推理",
                    Boolean(props.swarmPanelCollapsed.reasoning),
                    html`<pre class="agent-swarm__tool-block">${props.swarmReasoningText}</pre>`,
                    props,
                  )
                : nothing}
              ${props.swarmToolEntries.length > 0
                ? renderRightPanel(
                    "tools",
                    "工具",
                    Boolean(props.swarmPanelCollapsed.tools),
                    renderSwarmToolEntries(props.swarmToolEntries),
                    props,
                  )
                : nothing}
            </div>
          </div>
        </aside>
      </div>
      ${props.createModalOpen ? renderCreateWorkspaceModal(props) : nothing}
      ${props.deleteModalOpen ? renderDeleteWorkspaceModal(props) : nothing}
      ${props.addMemberModalOpen ? renderAddMemberModal(props) : nothing}
    </div>
  `;
}
