import { html, nothing } from "lit";
import { ref } from "lit/directives/ref.js";
import { repeat } from "lit/directives/repeat.js";
import type { SessionsListResult } from "../types.ts";
import type { ChatItem, MessageGroup } from "../types/chat-types.ts";
import type { ChatAttachment, ChatQueueItem } from "../ui-types.ts";
import {
  renderMessageGroup,
  renderReadingIndicatorGroup,
  renderStreamingGroup,
} from "../chat/grouped-render.ts";
import { CHAT_HISTORY_LIMIT } from "../controllers/chat.ts";
import { normalizeMessage, normalizeRoleForGrouping } from "../chat/message-normalizer.ts";
import { icons } from "../icons.ts";
import { nativeConfirm } from "../native-dialog-bridge.ts";
import { t } from "../strings.js";
import { renderMarkdownSidebar } from "./markdown-sidebar.ts";
import "../components/resizable-divider.ts";

export type CompactionIndicatorStatus = {
  active: boolean;
  startedAt: number | null;
  completedAt: number | null;
};

export type ChatProps = {
  sessionKey: string;
  onSessionKeyChange: (next: string) => void;
  thinkingLevel: string | null;
  showThinking: boolean;
  modelRef?: string | null;
  defaultModelRef?: string | null;
  modelOptions?: Array<{ value: string; label: string }>;
  onModelRefChange?: (next: string | null) => void;
  loading: boolean;
  sending: boolean;
  canAbort?: boolean;
  compactionStatus?: CompactionIndicatorStatus | null;
  messages: unknown[];
  toolMessages: unknown[];
  stream: string | null;
  streamStartedAt: number | null;
  assistantAvatarUrl?: string | null;
  draft: string;
  queue: ChatQueueItem[];
  connected: boolean;
  canSend: boolean;
  disabledReason: string | null;
  error: string | null;
  sessions: SessionsListResult | null;
  // Focus mode
  focusMode: boolean;
  // Sidebar state
  sidebarOpen?: boolean;
  sidebarContent?: string | null;
  sidebarError?: string | null;
  splitRatio?: number;
  assistantName: string;
  assistantAvatar: string | null;
  // Image attachments
  attachments?: ChatAttachment[];
  onAttachmentsChange?: (attachments: ChatAttachment[]) => void;
  // Scroll control
  showNewMessages?: boolean;
  onScrollToBottom?: () => void;
  /** When true, thread shows only assistant/user (no tool rows). When false, tool calls appear with I/O folded. */
  conversationOnly?: boolean;
  onConversationOnlyChange?: (next: boolean) => void;
  // Event handlers
  onRefresh: () => void;
  onToggleFocusMode: () => void;
  onDraftChange: (next: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  onQueueRemove: (id: string) => void;
  confirmQueueRemove?: boolean;
  onNewSession: () => void;
  onOpenSidebar?: (content: string) => void;
  onCloseSidebar?: () => void;
  onSplitRatioChange?: (ratio: number) => void;
  onChatScroll?: (event: Event) => void;
};

const COMPACTION_TOAST_DURATION_MS = 5000;

function formatDurationShort(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m${secs.toString().padStart(2, "0")}s`;
}

function formatBytes(bytes?: number) {
  if (bytes == null || !Number.isFinite(bytes)) {
    return "-";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

function adjustTextareaHeight(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function renderCompactionIndicator(status: CompactionIndicatorStatus | null | undefined) {
  if (!status) {
    return nothing;
  }

  // Show "compacting..." while active
  if (status.active) {
    return html`
      <div class="callout info compaction-indicator compaction-indicator--active">
        ${icons.loader} Compacting context...
      </div>
    `;
  }

  // Show "compaction complete" briefly after completion
  if (status.completedAt) {
    const elapsed = Date.now() - status.completedAt;
    if (elapsed < COMPACTION_TOAST_DURATION_MS) {
      return html`
        <div class="callout success compaction-indicator compaction-indicator--complete">
          ${icons.check} Context compacted
        </div>
      `;
    }
  }

  return nothing;
}

function generateAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function inferAttachmentKind(mimeType: string): "image" | "file" {
  return mimeType.startsWith("image/") ? "image" : "file";
}

function handleFilePick(e: Event, props: ChatProps) {
  const input = e.target as HTMLInputElement | null;
  const files = input?.files ? Array.from(input.files) : [];
  if (!files.length || !props.onAttachmentsChange) {
    return;
  }
  const current = props.attachments ?? [];

  const loadFile = (file: File): Promise<ChatAttachment> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const dataUrl = reader.result as string;
        resolve({
          id: generateAttachmentId(),
          dataUrl,
          mimeType: file.type || "application/octet-stream",
          filename: file.name,
          sizeBytes: file.size,
          kind: inferAttachmentKind(file.type || ""),
        });
      });
      reader.readAsDataURL(file);
    });

  void Promise.all(files.map(loadFile)).then((newAttachments) => {
    props.onAttachmentsChange?.([...current, ...newAttachments]);
  });

  if (input) {
    input.value = "";
  }
}

function handlePaste(e: ClipboardEvent, props: ChatProps) {
  const items = e.clipboardData?.items;
  if (!items || !props.onAttachmentsChange) {
    return;
  }

  const imageItems: DataTransferItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith("image/")) {
      imageItems.push(item);
    }
  }

  if (imageItems.length === 0) {
    return;
  }

  e.preventDefault();

  for (const item of imageItems) {
    const file = item.getAsFile();
    if (!file) {
      continue;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const dataUrl = reader.result as string;
      const newAttachment: ChatAttachment = {
        id: generateAttachmentId(),
        dataUrl,
        mimeType: file.type,
        filename: file.name,
        sizeBytes: file.size,
        kind: "image",
      };
      const current = props.attachments ?? [];
      props.onAttachmentsChange?.([...current, newAttachment]);
    });
    reader.readAsDataURL(file);
  }
}

function renderAttachmentPreview(props: ChatProps) {
  const attachments = props.attachments ?? [];
  if (attachments.length === 0) {
    return nothing;
  }

  return html`
    <div class="chat-attachments">
      ${attachments.map(
        (att) => html`
          <div class="chat-attachment">
            ${
              (att.kind ?? inferAttachmentKind(att.mimeType)) === "image"
                ? html`
                    <img
                      src=${att.dataUrl}
                      alt=${att.filename || "Attachment preview"}
                      class="chat-attachment__img"
                    />
                  `
                : html`
                    <div class="chat-attachment__file">
                      <div class="mono">${att.filename || "file"}</div>
                      <div class="muted" style="font-size: 12px;">
                        ${att.mimeType}${att.sizeBytes ? ` · ${formatBytes(att.sizeBytes)}` : ""}
                      </div>
                    </div>
                  `
            }
            <button
              class="chat-attachment__remove"
              type="button"
              aria-label="Remove attachment"
              @click=${() => {
                const next = (props.attachments ?? []).filter((a) => a.id !== att.id);
                props.onAttachmentsChange?.(next);
              }}
            >
              ${icons.x}
            </button>
          </div>
        `,
      )}
    </div>
  `;
}

export function renderChat(props: ChatProps) {
  const canCompose = props.connected;
  const isBusy = props.sending || props.stream !== null;
  const canAbort = Boolean(props.canAbort && props.onAbort);
  const activeSession = props.sessions?.sessions?.find((row) => row.key === props.sessionKey);
  const reasoningLevel = activeSession?.reasoningLevel ?? "off";
  const showReasoning = props.showThinking && reasoningLevel !== "off";
  const conversationOnly = false;
  const showToolTrace = true;
  const assistantIdentity = {
    name: props.assistantName,
    avatar: props.assistantAvatar ?? props.assistantAvatarUrl ?? null,
  };

  const hasAttachments = (props.attachments?.length ?? 0) > 0;
  const hasDraftContent = props.draft.trim().length > 0;
  const canSubmit = props.connected && (hasDraftContent || hasAttachments);
  const composePlaceholder = props.connected
    ? hasAttachments
      ? "添加消息（也可继续粘贴图片）…"
      : "输入消息（回车发送，Shift+回车换行，可粘贴图片）"
    : "Connect to the gateway to start chatting…";

  const sidebarOpen = Boolean(props.sidebarOpen && props.onCloseSidebar);
  const isEmptyThread =
    !props.loading &&
    (Array.isArray(props.messages) ? props.messages.length === 0 : true) &&
    !props.stream;

  const quickPrompts = [
    "你能告诉我你有哪些技能吗？",
    "帮我生成一份最近 15 分钟 MySQL 告警分析报告",
    "帮我梳理一个排查思路，并给出优先级",
  ];
  const emptyIntro = isEmptyThread
    ? html`
        <div class="chat-empty__title">您好，有什么可以帮助您？</div>
      `
    : nothing;
  const emptyPrompts = isEmptyThread
    ? html`
        <div class="chat-empty-prompts">
          <div class="chat-empty-prompts__title">选一个试试</div>
          <div class="chat-empty__prompts">
            ${quickPrompts.map(
              (p) => html`
                <button
                  class="btn chat-empty__prompt"
                  type="button"
                  ?disabled=${!props.connected}
                  @click=${() => {
                    props.onDraftChange(p);
                    props.onSend();
                  }}
                >
                  ${icons.chatPrompt} ${p}
                </button>
              `,
            )}
          </div>
        </div>
      `
    : nothing;
  const thread = html`
    <div
      class="chat-thread"
      role="log"
      aria-live="polite"
      @scroll=${props.onChatScroll}
    >
      ${
        props.loading
          ? html`
              <div class="muted">Loading chat…</div>
            `
          : nothing
      }
      ${repeat(
        buildChatItems(props),
        (item) => item.key,
        (item) => {
          if (item.kind === "reading-indicator") {
            return renderReadingIndicatorGroup(assistantIdentity, item.startedAt);
          }

          if (item.kind === "stream") {
            return renderStreamingGroup(
              item.text,
              item.startedAt,
              props.onOpenSidebar,
              assistantIdentity,
            );
          }

          if (item.kind === "group") {
            const opts = {
              onOpenSidebar: props.onOpenSidebar,
              showReasoning,
              assistantName: props.assistantName,
              assistantAvatar: assistantIdentity.avatar,
            } as unknown as { showToolTrace: boolean };
            opts.showToolTrace = showToolTrace;
            return renderMessageGroup(item, opts as never);
          }

          return nothing;
        },
      )}
      ${emptyIntro}
    </div>
  `;
  const visibleQueue = props.queue.filter((item) => item.sessionKey === props.sessionKey);

  return html`
    <section class="chat ${isEmptyThread ? "chat-empty" : ""} ${props.focusMode ? "chat--focus" : ""}">
      ${nothing}

      ${props.disabledReason ? html`<div class="callout">${props.disabledReason}</div>` : nothing}

      ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}

      ${renderCompactionIndicator(props.compactionStatus)}

      ${
        props.focusMode
          ? html`
            <button
              class="chat-focus-exit"
              type="button"
              @click=${props.onToggleFocusMode}
              aria-label="Exit focus mode"
              title="Exit focus mode"
            >
              ${icons.x}
            </button>
          `
          : nothing
      }

      <div
        class="chat-split-container ${sidebarOpen ? "chat-split-container--open" : ""}"
      >
        <div class="chat-main">
          ${thread}
        </div>

        ${
          sidebarOpen
            ? html`
              <div class="chat-sidebar">
                ${renderMarkdownSidebar({
                  content: props.sidebarContent ?? null,
                  error: props.sidebarError ?? null,
                  onClose: props.onCloseSidebar!,
                  onViewRawText: () => {
                    if (!props.sidebarContent || !props.onOpenSidebar) {
                      return;
                    }
                    props.onOpenSidebar(`\`\`\`\n${props.sidebarContent}\n\`\`\``);
                  },
                })}
              </div>
            `
            : nothing
        }
      </div>

      ${
        visibleQueue.length
          ? html`
            <div class="chat-queue" role="status" aria-live="polite">
              <div class="chat-queue__title">Queued (${visibleQueue.length})</div>
              <div class="chat-queue__list">
                ${visibleQueue.map(
                  (item) => html`
                    <div class="chat-queue__item">
                      <div class="chat-queue__text">
                        ${
                          item.text ||
                          (item.attachments?.length ? `Image (${item.attachments.length})` : "")
                        }
                      </div>
                      <button
                        class="btn chat-queue__remove"
                        type="button"
                        aria-label="Remove queued message"
                        @click=${async () => {
                          if (
                            props.confirmQueueRemove &&
                            !(await nativeConfirm(t("chatQueueRemoveConfirm")))
                          ) {
                            return;
                          }
                          props.onQueueRemove(item.id);
                        }}
                      >
                        ${icons.x}
                      </button>
                    </div>
                  `,
                )}
              </div>
            </div>
          `
          : nothing
      }

      ${
        props.showNewMessages
          ? html`
            <button
              class="btn chat-new-messages"
              type="button"
              @click=${props.onScrollToBottom}
            >
              New messages ${icons.arrowDown}
            </button>
          `
          : nothing
      }

      <div class="chat-compose">
        ${renderAttachmentPreview(props)}
        <div class="chat-compose__inner">
          <label class="field chat-compose__field">
            <span>Message</span>
            <span class="textarea"><textarea
            ${ref((el) => el && adjustTextareaHeight(el as HTMLTextAreaElement))}
            .value=${props.draft}
            ?disabled=${!props.connected}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key !== "Enter") {
                return;
              }
              if (e.isComposing || e.keyCode === 229) {
                return;
              }
              if (e.shiftKey) {
                return;
              } // Allow Shift+Enter for line breaks
              if (!props.connected) {
                return;
              }
              e.preventDefault();
              if (canCompose && canSubmit) {
                props.onSend();
              }
            }}
            @input=${(e: Event) => {
              const target = e.target as HTMLTextAreaElement;
              adjustTextareaHeight(target);
              props.onDraftChange(target.value);
            }}
            @paste=${(e: ClipboardEvent) => handlePaste(e, props)}
            placeholder=${composePlaceholder}
          ></textarea></span>
        </label>
          <div class="chat-compose__row">
          <div class="chat-compose__meta">
            <button
              class="btn btn--icon chat-compose__add-file"
              type="button"
              aria-label="添加文件"
              title="添加文件"
              ?disabled=${!props.connected || !props.onAttachmentsChange}
              @click=${() => {
                const input = document.getElementById("chat-file-input") as HTMLInputElement | null;
                input?.click();
              }}
            >
              ${icons.plus}
            </button>
            <input
              id="chat-file-input"
              type="file"
              multiple
              accept="image/*,*/*"
              style="display:none"
              @change=${(e: Event) => handleFilePick(e, props)}
            />
            ${
              props.onModelRefChange
                ? html`
                    <label class="field chat-compose__model-select">
                      <span class="select small"><select
                        aria-label="大模型"
                        .value=${props.modelRef ?? ""}
                        ?disabled=${!props.connected}
                        @change=${(e: Event) => {
                          const value = (e.target as HTMLSelectElement).value.trim();
                          const defaultRef = props.defaultModelRef ?? "";
                          props.onModelRefChange?.(
                            value === "" || value === defaultRef ? null : value,
                          );
                        }}
                      >
                        ${(props.modelOptions ?? [{ value: "", label: "默认" }]).map(
                          (opt) => html`<option value=${opt.value}>${opt.label}</option>`,
                        )}
                      </select></span>
                    </label>
                  `
                : nothing
            }
          </div>
          <div class="chat-compose__actions">
            <button
              class="btn chat-compose__secondary"
              ?disabled=${!props.connected || (!canAbort && props.sending)}
              @click=${canAbort ? props.onAbort : props.onNewSession}
            >
              ${canAbort ? "停止" : "新会话"}
            </button>
            <button
              class="btn chat-compose__send"
              type="button"
              aria-label="发送"
              title="发送 (Enter)"
              ?disabled=${!canSubmit}
              @click=${props.onSend}
            >
              ${isBusy ? icons.loader2 : icons.send}
            </button>
          </div>
          </div>
        </div>
      </div>

      ${emptyPrompts}
    </section>
  `;
}

function groupMessages(items: ChatItem[], hasActiveRun = false, hasStream = false): Array<ChatItem | MessageGroup> {
  const result: Array<ChatItem | MessageGroup> = [];
  let currentGroup: MessageGroup | null = null;

  for (const item of items) {
    if (item.kind !== "message") {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push(item);
      continue;
    }

    const normalized = normalizeMessage(item.message);
    const normalizedRole = normalizeRoleForGrouping(normalized.role);
    const role = normalizedRole === "tool" ? "assistant" : normalizedRole;
    const timestamp = normalized.timestamp || Date.now();

    if (!currentGroup || currentGroup.role !== role) {
      if (currentGroup) {
        result.push(currentGroup);
      }
      currentGroup = {
        kind: "group",
        key: `group:${role}:${item.key}`,
        role,
        messages: [{ message: item.message, key: item.key }],
        timestamp,
        isStreaming: false,
      };
    } else {
      currentGroup.messages.push({ message: item.message, key: item.key });
    }
  }

  if (currentGroup) {
    result.push(currentGroup);
  }

  // Mark the last assistant group as streaming when a run is active
  // or when stream content is still being rendered.
  // Only the most recent assistant group should be marked streaming;
  // historical groups remain collapsed so earlier unfinished turns
  // don't forcibly expand their process details on new user messages.
  if (hasActiveRun || hasStream) {
    let foundLastAssistant = false;
    for (let i = result.length - 1; i >= 0; i--) {
      const g = result[i];
      if (g && typeof g === "object" && "role" in g && g.role === "assistant") {
        if (!foundLastAssistant) {
          g.isStreaming = true;
          foundLastAssistant = true;
        }
        break;
      }
    }
  }

  return result;
}

function buildChatItems(props: ChatProps): Array<ChatItem | MessageGroup> {
  const items: ChatItem[] = [];
  const history = Array.isArray(props.messages) ? props.messages : [];
  const tools = Array.isArray(props.toolMessages) ? props.toolMessages : [];
  const conversationOnly = false;
  const historyStart = Math.max(0, history.length - CHAT_HISTORY_LIMIT);
  if (historyStart > 0) {
    items.push({
      kind: "message",
      key: "chat:history:notice",
      message: {
        role: "system",
        content: `Showing last ${CHAT_HISTORY_LIMIT} messages (${historyStart} hidden).`,
        timestamp: Date.now(),
      },
    });
  }
  for (let i = historyStart; i < history.length; i++) {
    const msg = history[i];
    const normalized = normalizeMessage(msg);

    if (conversationOnly && normalized.role === "toolResult") {
      continue;
    }

    items.push({
      kind: "message",
      key: messageKey(msg, i),
      message: msg,
    });
  }
  if (!conversationOnly) {
    for (let i = 0; i < tools.length; i++) {
      items.push({
        kind: "message",
        key: messageKey(tools[i], i + history.length),
        message: tools[i],
      });
    }
  }

  if (props.stream !== null) {
    const key = `stream:${props.sessionKey}:${props.streamStartedAt ?? "live"}`;
    if (props.stream.trim().length > 0) {
      items.push({
        kind: "stream",
        key,
        text: props.stream,
        startedAt: props.streamStartedAt ?? Date.now(),
      });
    } else {
      items.push({
        kind: "reading-indicator",
        key,
        startedAt: props.streamStartedAt ?? Date.now(),
      });
    }
  }

  return groupMessages(items, Boolean(props.canAbort), props.stream !== null);
}

function messageKey(message: unknown, index: number): string {
  const m = message as Record<string, unknown>;
  const toolCallId = typeof m.toolCallId === "string" ? m.toolCallId : "";
  if (toolCallId) {
    return `tool:${toolCallId}`;
  }
  const id = typeof m.id === "string" ? m.id : "";
  if (id) {
    return `msg:${id}`;
  }
  const messageId = typeof m.messageId === "string" ? m.messageId : "";
  if (messageId) {
    return `msg:${messageId}`;
  }
  const timestamp = typeof m.timestamp === "number" ? m.timestamp : null;
  const role = typeof m.role === "string" ? m.role : "unknown";
  if (timestamp != null) {
    return `msg:${role}:${timestamp}:${index}`;
  }
  return `msg:${role}:${index}`;
}
