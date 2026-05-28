import { html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import type { AssistantIdentity } from "../assistant-identity.ts";
import type { MessageGroup, ToolCard } from "../types/chat-types.ts";
import { icons } from "../icons.ts";
import { toSanitizedMarkdownHtml } from "../markdown.ts";
import { renderCopyAsMarkdownButton } from "./copy-as-markdown.ts";
import {
  extractTextCached,
  extractThinkingCached,
  formatReasoningMarkdown,
} from "./message-extract.ts";
import { isToolResultMessage, normalizeRoleForGrouping } from "./message-normalizer.ts";
import { extractToolCards } from "./tool-cards.ts";
import { resolveToolDisplay } from "../tool-display.ts";
import "../components/thinking-timer.ts";


type ImageBlock = {
  url: string;
  alt?: string;
};

function extractDurationMs(message: unknown): number | null {
  const m = message as Record<string, unknown>;
  const candidates = [
    m.durationMs,
    m.elapsedMs,
    m.latencyMs,
    m.thinkingMs,
    (m.metrics as Record<string, unknown> | undefined)?.durationMs,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c) && c > 0) {
      return c;
    }
    if (typeof c === "string") {
      const n = Number(c);
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
  }
  return null;
}

function extractFirstTokenMs(message: unknown): number | null {
  const m = message as Record<string, unknown>;
  const c = m.firstTokenMs ?? m.first_token_ms;
  if (typeof c === "number" && Number.isFinite(c) && c >= 0) return c;
  if (typeof c === "string") {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function extractToolDurationMs(message: unknown): number | null {
  const m = message as Record<string, unknown>;
  const c = m.toolDurationMs ?? m.tool_duration_ms;
  if (typeof c === "number" && Number.isFinite(c) && c >= 0) return c;
  if (typeof c === "string") {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function extractOutputDurationMs(message: unknown): number | null {
  const m = message as Record<string, unknown>;
  const c = m.outputDurationMs ?? m.output_duration_ms;
  if (typeof c === "number" && Number.isFinite(c) && c >= 0) return c;
  if (typeof c === "string") {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function formatDurationShort(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m${secs.toString().padStart(2, "0")}s`;
}

function groupElapsedMs(group: MessageGroup): number | null {
  const timestamps = group.messages
    .map((item) => {
      const m = item.message as Record<string, unknown>;
      return typeof m.timestamp === "number" ? m.timestamp : null;
    })
    .filter((value): value is number => value !== null);
  if (timestamps.length < 2) {
    return null;
  }
  const elapsed = Math.max(...timestamps) - Math.min(...timestamps);
  return elapsed > 0 ? elapsed : null;
}

function extractImages(message: unknown): ImageBlock[] {
  const m = message as Record<string, unknown>;
  const content = m.content;
  const images: ImageBlock[] = [];

  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block !== "object" || block === null) {
        continue;
      }
      const b = block as Record<string, unknown>;

      if (b.type === "image") {
        // Handle source object format (from sendChatMessage)
        const source = b.source as Record<string, unknown> | undefined;
        if (source?.type === "base64" && typeof source.data === "string") {
          const data = source.data;
          const mediaType = (source.media_type as string) || "image/png";
          // If data is already a data URL, use it directly
          const url = data.startsWith("data:") ? data : `data:${mediaType};base64,${data}`;
          images.push({ url });
        } else if (typeof b.url === "string") {
          images.push({ url: b.url });
        }
      } else if (b.type === "image_url") {
        // OpenAI format
        const imageUrl = b.image_url as Record<string, unknown> | undefined;
        if (typeof imageUrl?.url === "string") {
          images.push({ url: imageUrl.url });
        }
      }
    }
  }

  return images;
}

export function renderReadingIndicatorGroup(assistant?: AssistantIdentity, startedAt?: number) {
  return html`
    <div class="chat-group assistant">
      ${renderAvatar("assistant", assistant)}
      <div class="chat-group-messages">
        <div class="chat-bubble chat-reading-indicator" aria-hidden="true" style="display: flex; align-items: center; gap: 8px;">
          <span class="chat-reading-indicator__dots">
            <span></span><span></span><span></span>
          </span>
          ${startedAt ? html`<thinking-timer .start=${startedAt}></thinking-timer>` : nothing}
        </div>
      </div>
    </div>
  `;
}

export function renderStreamingGroup(
  text: string,
  startedAt: number,
  onOpenSidebar?: (content: string) => void,
  assistant?: AssistantIdentity,
) {
  const timestamp = new Date(startedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const name = assistant?.name ?? "Assistant";

  return html`
    <div class="chat-group assistant">
      ${renderAvatar("assistant", assistant)}
      <div class="chat-group-messages">
        ${renderGroupedMessage(
          {
            role: "assistant",
            content: [{ type: "text", text }],
            timestamp: startedAt,
          },
          { isStreaming: true, showReasoning: false, showToolTrace: true },
          onOpenSidebar,
        )}
        <div class="chat-group-footer">
          <span class="chat-sender-name">${name}</span>
          <span class="chat-group-timestamp">${timestamp}</span>
          <span class="chat-group-duration muted" style="margin-left: 8px;"><thinking-timer .start=${startedAt}></thinking-timer></span>
        </div>
      </div>
    </div>
  `;
}

export function renderMessageGroup(
  group: MessageGroup,
  opts: {
    onOpenSidebar?: (content: string) => void;
    showReasoning: boolean;
    showToolTrace: boolean;
    assistantName?: string;
    assistantAvatar?: string | null;
  },
) {
  const normalizedRole = normalizeRoleForGrouping(group.role);
  const assistantName = opts.assistantName ?? "Assistant";
  const who =
    normalizedRole === "user"
      ? "You"
      : normalizedRole === "assistant"
        ? assistantName
        : normalizedRole === "tool"
          ? "Tool"
          : normalizedRole;
  const roleClass =
    normalizedRole === "user" ? "user" : normalizedRole === "assistant" ? "assistant" : "other";
  const timestamp = new Date(group.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const metrics = normalizedRole === "assistant" 
    ? extractGroupMetrics(group) 
    : { thinkingMs: null, elapsedMs: null, firstTokenMs: null, toolDurationMs: null, outputDurationMs: null };
  const durationLabel = metrics.elapsedMs ? formatDurationShort(metrics.elapsedMs) : "";
  const thinkingLabel = metrics.thinkingMs ? formatDurationShort(metrics.thinkingMs) : "";
  
  let detailedLabel = "";
  // Only show duration stats when streaming is complete (all tool results returned)
  if (metrics.elapsedMs && !group.isStreaming) {
    let mainLabel = `总耗时 ${durationLabel}`;
    const detailParts: string[] = [];

    // Calculate firstTokenToOutputMs (首token到结果输出)
    if (metrics.firstTokenMs !== null) {
      const firstTokenToOutputVal = metrics.elapsedMs - (metrics.toolDurationMs ?? 0) - metrics.firstTokenMs;
      if (firstTokenToOutputVal > 0) {
        detailParts.push(`首token到结果输出 ${formatDurationShort(firstTokenToOutputVal)}`);
      }
    }

    if (metrics.toolDurationMs !== null && metrics.toolDurationMs > 0) {
      detailParts.push(`tool工具 ${formatDurationShort(metrics.toolDurationMs)}`);
    }

    if (metrics.outputDurationMs !== null && metrics.outputDurationMs > 0) {
      detailParts.push(`输出 ${formatDurationShort(metrics.outputDurationMs)}`);
    }

    if (detailParts.length > 0) {
      detailedLabel = `${mainLabel} (${detailParts.join(" · ")})`;
    } else {
      detailedLabel = mainLabel;
    }
  }

  const footerMsLabel = group.isStreaming
    ? html`<thinking-timer .start=${group.timestamp}></thinking-timer>`
    : [
        thinkingLabel ? `思考 ${thinkingLabel}` : "",
        detailedLabel
      ].filter(Boolean).join(" · ");

  return html`
    <div class="chat-group ${roleClass}">
      ${renderAvatar(group.role, {
        name: assistantName,
        avatar: opts.assistantAvatar ?? null,
      })}
      <div class="chat-group-messages">
        ${
          normalizedRole === "assistant"
            ? renderAssistantTurnMessages(group, opts)
            : group.messages.map((item, index) =>
                renderGroupedMessage(
                  item.message,
                  {
                    isStreaming: group.isStreaming && index === group.messages.length - 1,
                    showReasoning: opts.showReasoning,
                    showToolTrace: opts.showToolTrace,
                  },
                  opts.onOpenSidebar,
                ),
              )
        }
        <div class="chat-group-footer">
          <span class="chat-sender-name">${who}</span>
          <span class="chat-group-timestamp">${timestamp}</span>
          ${footerMsLabel
            ? html`<span class="chat-group-duration muted">${footerMsLabel}</span>`
            : nothing}
        </div>
      </div>
    </div>
  `;
}

function renderAvatar(role: string, assistant?: Pick<AssistantIdentity, "name" | "avatar">) {
  const normalized = normalizeRoleForGrouping(role);
  const assistantName = assistant?.name?.trim() || "Assistant";
  const assistantAvatar = assistant?.avatar?.trim() || "";
  const initial =
    normalized === "user"
      ? "U"
      : normalized === "assistant"
        ? assistantName.charAt(0).toUpperCase() || "A"
        : normalized === "tool"
          ? "⚙"
          : "?";
  const className =
    normalized === "user"
      ? "user"
      : normalized === "assistant"
        ? "assistant"
        : normalized === "tool"
          ? "tool"
          : "other";

  if (assistantAvatar && normalized === "assistant") {
    if (isAvatarUrl(assistantAvatar)) {
      return html`<img
        class="chat-avatar ${className}"
        src="${assistantAvatar}"
        alt="${assistantName}"
      />`;
    }
    return html`<div class="chat-avatar ${className}">${assistantAvatar}</div>`;
  }

  return html`<div class="chat-avatar ${className}">${initial}</div>`;
}

function isAvatarUrl(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) || /^data:image\//i.test(value) || value.startsWith("/") // Relative paths from avatar endpoint
  );
}

function renderMessageImages(images: ImageBlock[]) {
  if (images.length === 0) {
    return nothing;
  }

  return html`
    <div class="chat-message-images">
      ${images.map(
        (img) => html`
          <img
            src=${img.url}
            alt=${img.alt ?? "Attached image"}
            class="chat-message-image"
            @click=${() => window.open(img.url, "_blank")}
          />
        `,
      )}
    </div>
  `;
}

/** Plain tool output only (no ### headings). Names appear on cards above; avoids a lone "Tool Output" title in the fold panel. */
function aggregateToolResultMarkdown(cards: ToolCard[]): string | null {
  const parts: string[] = [];
  for (const c of cards) {
    if (c.kind !== "result" || !c.text?.trim()) {
      continue;
    }
    parts.push(c.text.trim());
  }
  return parts.length > 0 ? parts.join("\n\n---\n\n") : null;
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Plain text under ### tool headings (for deduping with extractText). */
function stripAggregatedToolHeadings(aggregated: string): string {
  return aggregated
    .split(/\n\n---\n\n/)
    .map((part) => part.replace(/^###[^\n]+\n+/, "").trim())
    .join("\n\n")
    .trim();
}

function combinedResultPlaintext(cards: ToolCard[]): string {
  return cards
    .filter((c) => c.kind === "result" && c.text?.trim())
    .map((c) => c.text!.trim())
    .join("\n\n");
}

/**
 * Prefer a single body: extractText often duplicates toolresult card text; avoid showing both.
 */
function mergeToolExpandableBody(markdown: string | null, cards: ToolCard[]): string | null {
  const md = (markdown ?? "").trim();
  const aggregated = aggregateToolResultMarkdown(cards)?.trim() ?? "";
  if (!md && !aggregated) {
    return null;
  }
  if (!aggregated) {
    return md || null;
  }
  if (!md) {
    return aggregated;
  }
  const combined = combinedResultPlaintext(cards);
  const strippedAgg = stripAggregatedToolHeadings(aggregated);
  const dupWithCards =
    combined &&
    (md === combined ||
      collapseWhitespace(md) === collapseWhitespace(combined) ||
      combined.includes(md) ||
      md.includes(combined));
  const dupWithAggShape =
    md === strippedAgg || collapseWhitespace(md) === collapseWhitespace(strippedAgg);
  if (dupWithCards || dupWithAggShape) {
    return aggregated;
  }
  return `${md}\n\n---\n\n${aggregated}`;
}

function toggleToolResultBody(e: Event) {
  const btn = e.currentTarget as HTMLButtonElement;
  if (btn.disabled) {
    return;
  }
  e.stopPropagation();
  const open = btn.getAttribute("aria-expanded") === "true";
  const next = !open;
  btn.setAttribute("aria-expanded", String(next));
  const block = btn.closest(".chat-tool-result-block");
  const body = block?.querySelector(".chat-tool-result-body") as HTMLElement | null;
  if (body) {
    body.hidden = !next;
  }
  block?.classList.toggle("chat-tool-result-block--open", next);
}


function toolCommandText(card: ToolCard): string {
  const args = card.args;
  if (args && typeof args === "object") {
    const rec = args as Record<string, unknown>;
    for (const key of ["command", "cmd", "script", "query", "path"]) {
      const value = rec[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }
  if (typeof args === "string" && args.trim()) {
    return args.trim();
  }
  if (card.text?.trim()) {
    return card.text.trim().split(/\r?\n/, 1)[0] ?? "";
  }
  return card.name;
}

function extractToolOutputText(doc: string): string {
  const trimmed = doc.trim();
  if (!trimmed.startsWith("{")) {
    return doc;
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof parsed.output === "string" && parsed.output.trim()) {
      return parsed.output;
    }
    const nested = parsed.data as Record<string, unknown> | undefined;
    if (typeof nested?.output === "string" && nested.output.trim()) {
      return nested.output;
    }
  } catch {
    return doc;
  }
  return doc;
}

function formatToolRunLabel(cards: ToolCard[]): string {
  const count = cards.filter((c) => c.kind === "call").length || cards.length;
  return count <= 1 ? "已运行命令" : `已运行 ${count} 条命令`;
}

function renderInlineToolCall(card: ToolCard) {
  const command = toolCommandText(card);
  const label = command ? `已运行 ${command}` : "已运行命令";
  return html`
    <div class="chat-tool-run chat-tool-run--call">
      <div class="chat-tool-run__summary">
        <span class="chat-tool-run__icon">${icons.wrench}</span>
        <span class="chat-tool-run__title">${label}</span>
        <span class="chat-tool-run__status">${icons.check}</span>
      </div>
    </div>
  `;
}

type ToolRunEntry = {
  command: string;
  tool: string;
  output: string;
  success: boolean;
  durationMs?: number;
};

function isToolResultLikeMessage(message: unknown): boolean {
  const m = message as Record<string, unknown>;
  const role = typeof m.role === "string" ? m.role.toLowerCase() : "";
  return (
    isToolResultMessage(message) ||
    role === "toolresult" ||
    role === "tool_result" ||
    typeof m.toolCallId === "string" ||
    typeof m.tool_call_id === "string"
  );
}

function inferToolSuccess(output: string): boolean {
  const normalized = output.toLowerCase();
  return !/(^|\n)\s*(error|failed|failure):|exit code:\s*[1-9]|exception|traceback/.test(
    normalized,
  );
}

interface ToolGroup {
  tool: string;
  title: string;
  icon: string;
  runs: ToolRunEntry[];
}

type Segment =
  | { type: "text"; message: unknown; isStreaming: boolean }
  | { type: "tools"; runs: ToolRunEntry[] };

function segmentAssistantTurn(
  messages: Array<{ message: unknown; key: string }>,
  groupIsStreaming: boolean
): Segment[] {
  const segments: Segment[] = [];
  let currentToolSegment: { type: "tools"; runs: ToolRunEntry[] } | null = null;
  let currentRun: ToolRunEntry | null = null;

  for (let idx = 0; idx < messages.length; idx++) {
    const item = messages[idx];
    const message = item.message;
    const isLast = idx === messages.length - 1;
    const isStreaming = groupIsStreaming && isLast;

    const cards = extractToolCards(message);
    const text = extractTextCached(message)?.trim() ?? "";
    const thinking = extractThinkingCached(message)?.trim() ?? "";
    const isToolResult = isToolResultLikeMessage(message);
    const callCards = cards.filter((card) => card.kind === "call");

    if ((text || thinking) && !isToolResult) {
      segments.push({ type: "text", message, isStreaming });
      currentToolSegment = null;
      currentRun = null;
    }

    if (callCards.length > 0) {
      if (!currentToolSegment) {
        currentToolSegment = { type: "tools", runs: [] };
        segments.push(currentToolSegment);
      }
      for (const card of callCards) {
        currentRun = {
          command: toolCommandText(card),
          tool: card.name || "tool",
          output: "",
          success: true,
        };
        currentToolSegment.runs.push(currentRun);
      }
    }

    if (isToolResult) {
      const output = text ? extractToolOutputText(text) : "";
      const durationMs = extractDurationMs(message) ?? undefined;
      if (!currentToolSegment) {
        currentToolSegment = { type: "tools", runs: [] };
        segments.push(currentToolSegment);
      }
      const unmatchedRun = currentToolSegment.runs.find((r) => r.output === "");
      if (unmatchedRun) {
        unmatchedRun.output = output;
        unmatchedRun.success = inferToolSuccess(output);
        if (durationMs !== undefined) {
          unmatchedRun.durationMs = durationMs;
        }
        currentRun = unmatchedRun;
      } else {
        const newRun = {
          command: "command",
          tool: cards[0]?.name || "tool",
          output,
          success: inferToolSuccess(output),
          durationMs,
        };
        currentToolSegment.runs.push(newRun);
        currentRun = newRun;
      }
    }
  }

  return segments;
}

function extractGroupMetrics(group: MessageGroup) {
  let totalThinkingMs = 0;
  let totalElapsedMs = 0;
  let totalFirstTokenMs = 0;
  let totalToolDurationMs = 0;
  let totalOutputDurationMs = 0;
  let hasDetailedMetrics = false;

  for (const item of group.messages) {
    const isTool = isToolResultLikeMessage(item.message);
    const m = item.message as Record<string, unknown>;

    const thinking = m.thinkingMs ?? (m.metrics as Record<string, unknown> | undefined)?.thinkingMs;
    if (typeof thinking === "number") {
      totalThinkingMs = Math.max(totalThinkingMs, thinking);
    }

    if (!isTool) {
      const duration = extractDurationMs(item.message);
      if (duration) {
        totalElapsedMs = Math.max(totalElapsedMs, duration);
      }
      const ft = extractFirstTokenMs(item.message);
      if (ft !== null) {
        totalFirstTokenMs = Math.max(totalFirstTokenMs, ft);
        hasDetailedMetrics = true;
      }
      const td = extractToolDurationMs(item.message);
      if (td !== null) {
        totalToolDurationMs = Math.max(totalToolDurationMs, td);
        hasDetailedMetrics = true;
      }
      const od = extractOutputDurationMs(item.message);
      if (od !== null) {
        totalOutputDurationMs = Math.max(totalOutputDurationMs, od);
        hasDetailedMetrics = true;
      }
    }
  }

  if (totalElapsedMs === 0) {
    const elapsed = groupElapsedMs(group);
    if (elapsed) {
      totalElapsedMs = elapsed;
    }
  }

  return {
    thinkingMs: totalThinkingMs > 0 ? totalThinkingMs : null,
    elapsedMs: totalElapsedMs > 0 ? totalElapsedMs : null,
    firstTokenMs: hasDetailedMetrics ? totalFirstTokenMs : null,
    toolDurationMs: hasDetailedMetrics ? totalToolDurationMs : null,
    outputDurationMs: hasDetailedMetrics ? totalOutputDurationMs : null,
  };
}

function renderToolSegment(
  runs: ToolRunEntry[],
  isStreaming: boolean,
  metrics: { thinkingMs: number | null; elapsedMs: number | null; [key: string]: any }
) {
  const groupsMap = new Map<string, ToolGroup>();
  for (const run of runs) {
    const display = resolveToolDisplay({ name: run.tool });
    let group = groupsMap.get(run.tool);
    if (!group) {
      group = {
        tool: run.tool,
        title: display.title || display.label || run.tool,
        icon: display.icon || "puzzle",
        runs: [],
      };
      groupsMap.set(run.tool, group);
    }
    group.runs.push(run);
  }
  const toolGroups = Array.from(groupsMap.values());

  return html`
    <div class="chat-tool-segment">
      ${toolGroups.map((tg) => {
        const total = tg.runs.length;
        const successCount = tg.runs.filter((r) => r.success).length;
        const failedCount = total - successCount;

        const groupDuration = tg.runs.reduce((sum, r) => sum + (r.durationMs || 0), 0);
        const groupDurationLabel = groupDuration > 0 ? formatDurationShort(groupDuration) : "";
        const thinkingLabel = metrics.thinkingMs ? formatDurationShort(metrics.thinkingMs) : "";

        let statsLabel = "";
        if (isStreaming) {
          statsLabel = "正在运行...";
        } else {
          const base = failedCount > 0 
            ? `运行 ${total} 次 · 成功 ${successCount} 失败 ${failedCount}`
            : `运行 ${total} 次 · 全部成功`;
          const parts = [base];
          if (groupDurationLabel) {
            parts.push(`耗时 ${groupDurationLabel}`);
          }
          if (thinkingLabel) {
            parts.push(`思考 ${thinkingLabel}`);
          }
          statsLabel = parts.join(" · ");
        }

        const chevronIcon = isStreaming ? icons.loader : icons.chevronRight;
        const chevronClass = isStreaming
          ? "chat-tool-group-summary__chevron running"
          : "chat-tool-group-summary__chevron";

        return html`
          <details class="chat-tool-group-details" ?open=${isStreaming}>
            <summary class="chat-tool-group-summary">
              <span class="chat-tool-group-summary__icon">${icons[tg.icon as keyof typeof icons] || icons.wrench}</span>
              <span class="chat-tool-group-summary__title">${tg.title}</span>
              <span class="chat-tool-group-summary__stats">${statsLabel}</span>
              <span class="${chevronClass}">${chevronIcon}</span>
            </summary>
            <div class="chat-tool-group-runs">
              ${tg.runs.map((run, runIdx) => {
                if (isStreaming && runIdx < tg.runs.length - 1) {
                  return nothing;
                }
                return html`
                  <details class="chat-turn-command" ?open=${!run.success}>
                    <summary class="chat-turn-command__summary">
                      <span class="chat-turn-command__prompt">$</span>
                      <span class="chat-turn-command__text">
                        ${run.command || run.tool}
                        ${run.durationMs ? html`<span class="chat-turn-command__duration muted"> (${formatDurationShort(run.durationMs)})</span>` : nothing}
                      </span>
                      <span class="chat-turn-command__status-dot ${run.success ? "success" : "failed"}"></span>
                    </summary>
                    <pre class="chat-tool-run__output">${run.output || "(no output)"}</pre>
                  </details>
                `;
              })}
            </div>
          </details>
        `;
      })}
    </div>
  `;
}

function renderAssistantTurnMessages(
  group: MessageGroup,
  opts: {
    onOpenSidebar?: (content: string) => void;
    showReasoning: boolean;
    showToolTrace: boolean;
  },
) {
  const segments = segmentAssistantTurn(group.messages, !!group.isStreaming);
  if (segments.length === 0) {
    return nothing;
  }

  const metrics = extractGroupMetrics(group);

  // Find the last segment that is a text segment and contains actual text (the final assistant response)
  let finalResponseIdx = -1;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.type === "text") {
      const text = extractTextCached(seg.message)?.trim() ?? "";
      if (text) {
        finalResponseIdx = i;
        break;
      }
    }
  }

  let processSegments: Segment[] = [];
  let finalResponseSegment: Segment | null = null;

  if (finalResponseIdx !== -1) {
    processSegments = segments.filter((_, idx) => idx !== finalResponseIdx);
    finalResponseSegment = segments[finalResponseIdx];
  } else {
    processSegments = segments;
  }

  const elapsedLabel = metrics.elapsedMs ? formatDurationShort(metrics.elapsedMs) : "";

  return html`
    ${processSegments.length > 0
      ? html`
          <details class="chat-process-details" ?open=${!!group.isStreaming}>
            <summary class="chat-process-summary">
              <span class="chat-process-summary__icon">${icons.wrench}</span>
              <span class="chat-process-summary__title">思考及工具运行过程</span>
              ${elapsedLabel && !group.isStreaming ? html`<span class="chat-process-summary__duration">总耗时 ${elapsedLabel}</span>` : nothing}
              <span class="chat-process-summary__chevron">${icons.chevronRight}</span>
            </summary>
            <div class="chat-process-content">
              ${processSegments.map((seg) => {
                if (seg.type === "text") {
                  return renderGroupedMessage(
                    seg.message,
                    {
                      isStreaming: seg.isStreaming,
                      showReasoning: opts.showReasoning,
                      showToolTrace: false,
                    },
                    opts.onOpenSidebar,
                  );
                } else {
                  return renderToolSegment(seg.runs, !!group.isStreaming, metrics);
                }
              })}
            </div>
          </details>
        `
      : nothing}

    ${finalResponseSegment
      ? renderGroupedMessage(
          finalResponseSegment.message,
          {
            isStreaming: finalResponseSegment.isStreaming,
            showReasoning: false, // Reasoning has been rendered inside processSegments
            showToolTrace: false,
          },
          opts.onOpenSidebar,
        )
      : nothing}
  `;
}


function renderCollapsedToolResult(
  toolCards: ToolCard[],
  images: ImageBlock[],
  markdown: string | null,
  reasoningMarkdown: string | null,
  opts: { isStreaming: boolean; showReasoning: boolean },
  _onOpenSidebar?: (content: string) => void,
) {
  const bodyDoc = mergeToolExpandableBody(markdown, toolCards);
  const primaryCommand =
    toolCards
      .filter((card) => card.kind === "call")
      .map(toolCommandText)
      .find(Boolean) ?? "";
  const runLabel = toolCards.length ? formatToolRunLabel(toolCards) : "已运行命令";
  const outputText = bodyDoc?.trim() ? extractToolOutputText(bodyDoc) : "";

  return html`
    <div class="chat-tool-result-block">
      <details class="chat-tool-run">
        <summary class="chat-tool-run__summary">
          <span class="chat-tool-run__icon">${icons.wrench}</span>
          <span class="chat-tool-run__title">${runLabel}</span>
          <span class="chat-tool-run__chevron">${icons.chevronRight}</span>
        </summary>
        ${
          primaryCommand
            ? html`<div class="chat-tool-run__command muted">已运行 ${primaryCommand}</div>`
            : nothing
        }
        ${
          opts.showReasoning && reasoningMarkdown
            ? html`
                <details class="chat-thinking" open>
                  <summary class="chat-thinking__summary">Reasoning</summary>
                  <div class="chat-thinking__content">
                    ${unsafeHTML(toSanitizedMarkdownHtml(reasoningMarkdown))}
                  </div>
                </details>
              `
            : nothing
        }
        ${renderMessageImages(images)}
        ${
          outputText
            ? html`
                <div class="chat-tool-run__panel">
                  <div class="chat-tool-run__panel-title">Shell</div>
                  <pre class="chat-tool-run__output">${outputText}</pre>
                </div>
              `
            : nothing
        }
      </details>
    </div>
  `;
}

function renderGroupedMessage(
  message: unknown,
  opts: { isStreaming: boolean; showReasoning: boolean; showToolTrace: boolean },
  onOpenSidebar?: (content: string) => void,
) {
  const m = message as Record<string, unknown>;
  const role = typeof m.role === "string" ? m.role : "unknown";
  const isToolResult =
    isToolResultMessage(message) ||
    role.toLowerCase() === "toolresult" ||
    role.toLowerCase() === "tool_result" ||
    typeof m.toolCallId === "string" ||
    typeof m.tool_call_id === "string";

  if (!opts.showToolTrace && isToolResult) {
    return nothing;
  }

  const toolCards = opts.showToolTrace ? extractToolCards(message) : [];
  const hasToolCards = toolCards.length > 0;
  const images = extractImages(message);
  const hasImages = images.length > 0;

  const extractedText = extractTextCached(message);
  const extractedThinking =
    opts.showReasoning && role === "assistant" ? extractThinkingCached(message) : null;
  const markdownBase = extractedText?.trim() ? extractedText : null;
  const reasoningMarkdown = extractedThinking ? formatReasoningMarkdown(extractedThinking) : null;
  const durationMs = role === "assistant" ? extractDurationMs(message) : null;
  const durationLabel = durationMs ? formatDurationShort(durationMs) : "";
  const markdown = markdownBase;
  const canCopyMarkdown = role === "assistant" && Boolean(markdown?.trim());

  const bubbleClasses = [
    "chat-bubble",
    canCopyMarkdown ? "has-copy" : "",
    opts.isStreaming ? "streaming" : "",
    "fade-in",
  ]
    .filter(Boolean)
    .join(" ");

  if (isToolResult) {
    return renderCollapsedToolResult(
      toolCards,
      images,
      markdown,
      reasoningMarkdown,
      opts,
      onOpenSidebar,
    );
  }

  if (!markdown && !hasToolCards && !hasImages) {
    return nothing;
  }

  return html`
    <div class="${bubbleClasses}">
      ${canCopyMarkdown ? renderCopyAsMarkdownButton(markdown!) : nothing}
      ${renderMessageImages(images)}
      ${
        reasoningMarkdown
          ? html`
              <details class="chat-thinking">
                <summary class="chat-thinking__summary">
                  思考过程${durationLabel ? html`<span class="muted"> · ${durationLabel}</span>` : nothing}
                </summary>
                <div class="chat-thinking__content">
                  ${unsafeHTML(toSanitizedMarkdownHtml(reasoningMarkdown))}
                </div>
              </details>
            `
          : nothing
      }
      ${
        markdown
          ? html`<div class="chat-text">${unsafeHTML(toSanitizedMarkdownHtml(markdown))}</div>`
          : nothing
      }
      ${opts.showToolTrace
        ? toolCards.filter((card) => card.kind === "call").map(renderInlineToolCall)
        : nothing}
    </div>
  `;
}
