import { LitElement, html, nothing, unsafeCSS } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";
import { toSanitizedMarkdownHtml } from "../markdown.ts";

export type VaultEditorMode = "edit" | "preview" | "split";

function wrapSelection(textarea: HTMLTextAreaElement, before: string, after: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  textarea.value = next;
  const cursor = start + before.length + selected.length + after.length;
  textarea.setSelectionRange(selected ? cursor : start + before.length, selected ? cursor : start + before.length);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

function lineCount(text: string) {
  if (!text) return 1;
  return text.split("\n").length;
}

@customElement("vault-editor")
export class VaultEditor extends LitElement {
  @property({ type: String }) selectedPath: string | null = null;
  @property({ type: String }) content = "";
  @property({ type: String }) draftContent = "";
  @property({ type: Boolean }) contentLoading = false;
  @property({ type: Boolean }) saving = false;
  @property({ type: Boolean }) isDirty = false;
  @property({ type: String }) editorMode: VaultEditorMode = "preview";
  @property({ type: Number }) highlightLine: number | null = null;

  @property({ attribute: false }) onEditorModeChange?: (mode: VaultEditorMode) => void;
  @property({ attribute: false }) onDraftChange?: (content: string) => void;
  @property({ attribute: false }) onSave?: () => void;
  @property({ attribute: false }) onBreadcrumbNavigate?: (folderPath: string) => void;

  @state() private lineNumbers = "1";

  @query(".kv-editor__textarea") private textareaEl?: HTMLTextAreaElement;

  static styles = unsafeCSS(`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
  `);

  protected createRenderRoot() {
    return this;
  }

  protected updated(changed: Map<string, unknown>) {
    if (changed.has("draftContent") || changed.has("editorMode")) {
      this.lineNumbers = this.buildLineNumbers(this.draftContent);
    }
    if (changed.has("highlightLine") && this.highlightLine != null) {
      queueMicrotask(() => this.scrollToHighlight());
    }
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.onGlobalKeydown);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.onGlobalKeydown);
    super.disconnectedCallback();
  }

  private onGlobalKeydown = (event: KeyboardEvent) => {
    if (!this.selectedPath) return;
    const mod = event.ctrlKey || event.metaKey;
    if (!mod) return;
    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (this.isDirty && !this.saving) this.onSave?.();
      return;
    }
    if (this.editorMode === "preview") return;
    const ta = this.textareaEl;
    if (!ta || document.activeElement !== ta) return;
    if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      wrapSelection(ta, "**", "**");
    } else if (event.key.toLowerCase() === "i") {
      event.preventDefault();
      wrapSelection(ta, "*", "*");
    }
  };

  private buildLineNumbers(text: string) {
    const n = lineCount(text);
    return Array.from({ length: n }, (_, i) => i + 1).join("\n");
  }

  private scrollToHighlight() {
    const line = this.highlightLine;
    if (line == null) return;
    if (this.editorMode === "preview") {
      const el = this.querySelector(`[data-line="${line}"]`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const ta = this.textareaEl;
    if (!ta) return;
    const lines = this.draftContent.split("\n");
    let pos = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      pos += lines[i].length + 1;
    }
    ta.focus();
    ta.setSelectionRange(pos, pos);
    const lineHeight = 21;
    ta.scrollTop = Math.max(0, (line - 3) * lineHeight);
  }

  private renderBreadcrumb(): ReturnType<typeof html> {
    const path = this.selectedPath;
    if (!path) return nothing;
    const parts = path.replace(/\.md$/i, "").split("/");
    const crumbs: ReturnType<typeof html>[] = [];
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (i > 0) {
        crumbs.push(html`<span class="kv-breadcrumb__sep">/</span>`);
      }
      if (isLast) {
        crumbs.push(html`<span class="kv-breadcrumb__current">${part}</span>`);
      } else {
        acc = acc ? `${acc}/${part}` : part;
        const folder = acc;
        crumbs.push(html`
          <button type="button" class="kv-breadcrumb__link" @click=${() => this.onBreadcrumbNavigate?.(folder)}>
            ${part}
          </button>
        `);
      }
    }
    return html`<nav class="kv-breadcrumb" aria-label="笔记路径">${crumbs}</nav>`;
  }

  private renderToolbar() {
    const modes: { id: VaultEditorMode; label: string }[] = [
      { id: "edit", label: "编辑" },
      { id: "preview", label: "预览" },
      { id: "split", label: "分屏" },
    ];
    return html`
      <div class="kv-editor__toolbar">
        <div class="kv-editor__mode">
          ${modes.map(
            (m) => html`
              <button
                type="button"
                class="kv-editor__mode-btn ${this.editorMode === m.id ? "kv-editor__mode-btn--active" : ""}"
                @click=${() => this.onEditorModeChange?.(m.id)}
              >
                ${m.label}
              </button>
            `,
          )}
        </div>
        ${this.editorMode !== "preview"
          ? html`
              <div class="kv-editor__format">
                <button
                  type="button"
                  class="btn btn--ghost btn--sm"
                  title="粗体 (Ctrl+B)"
                  @click=${() => {
                    const ta = this.textareaEl;
                    if (ta) wrapSelection(ta, "**", "**");
                  }}
                >
                  B
                </button>
                <button
                  type="button"
                  class="btn btn--ghost btn--sm"
                  title="斜体 (Ctrl+I)"
                  @click=${() => {
                    const ta = this.textareaEl;
                    if (ta) wrapSelection(ta, "*", "*");
                  }}
                >
                  I
                </button>
              </div>
            `
          : nothing}
        <div class="kv-editor__actions">
          ${this.isDirty
            ? html`<span class="kv-editor__dirty" title="有未保存的更改">●</span>`
            : nothing}
          ${this.editorMode !== "preview"
            ? html`
                <button
                  type="button"
                  class="btn btn--primary btn--sm"
                  ?disabled=${this.saving || !this.isDirty}
                  @click=${() => this.onSave?.()}
                >
                  ${this.saving ? "保存中…" : "保存"}
                </button>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  private renderEditPane() {
    return html`
      <div class="kv-editor__edit-wrap">
        <pre class="kv-editor__gutter" aria-hidden="true">${this.lineNumbers}</pre>
        <textarea
          class="kv-editor__textarea"
          .value=${this.draftContent}
          spellcheck="false"
          @input=${(e: Event) => {
            const v = (e.target as HTMLTextAreaElement).value;
            this.lineNumbers = this.buildLineNumbers(v);
            this.onDraftChange?.(v);
          }}
        ></textarea>
      </div>
    `;
  }

  private renderPreviewPane() {
    const htmlContent = toSanitizedMarkdownHtml(this.editorMode === "split" ? this.draftContent : this.content);
    return html`
      <article class="kv-editor__preview sidebar-markdown">${unsafeHTML(htmlContent)}</article>
    `;
  }

  render() {
    if (!this.selectedPath) {
      return html`
        <div class="kv-main__empty">
          <p class="kv-main__empty-title">选择或创建一篇笔记</p>
          <p>从左侧文件树选择笔记，或使用「新建笔记」创建 Markdown 文档。</p>
          <p class="kv-main__hint">支持 Obsidian 双链 <code>[[笔记]]</code> 与 Markdown 链接。</p>
        </div>
      `;
    }

    if (this.contentLoading) {
      return html`<div class="kv-main__loading">加载中…</div>`;
    }

    return html`
      <div class="kv-doc">
        ${this.renderBreadcrumb()}
        ${this.renderToolbar()}
        ${this.editorMode === "edit"
          ? this.renderEditPane()
          : this.editorMode === "preview"
            ? this.renderPreviewPane()
            : html`<div class="kv-editor__split">${this.renderEditPane()}${this.renderPreviewPane()}</div>`}
        ${this.editorMode !== "preview"
          ? html`<p class="kv-main__hint">
              引用其他笔记请使用 Obsidian 双链 <code>[[笔记名]]</code> 或 Markdown 链接；保存后同步索引供 Agent 检索。
            </p>`
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vault-editor": VaultEditor;
  }
}
