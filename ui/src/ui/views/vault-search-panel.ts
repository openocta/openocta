import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { VaultSearchHit } from "../controllers/vault.ts";
import { icons } from "../icons.js";

export type VaultSearchMode = "filename" | "fulltext";

export type VaultSearchPanelProps = {
  query: string;
  searchMode: VaultSearchMode;
  searchLoading: boolean;
  searchResults: VaultSearchHit[];
  onQueryChange: (q: string) => void;
  onSearchModeChange: (mode: VaultSearchMode) => void;
  onFullTextSearch: () => void;
  onSelectResult: (hit: VaultSearchHit) => void;
};

export function renderVaultSearchPanel(props: VaultSearchPanelProps): TemplateResult {
  const showFulltextResults = props.searchMode === "fulltext" && props.query.trim().length > 0;

  return html`
    <div class="kv-search">
      <div class="kv-search__mode">
        <button
          type="button"
          class="kv-search__mode-btn ${props.searchMode === "filename" ? "kv-search__mode-btn--active" : ""}"
          @click=${() => props.onSearchModeChange("filename")}
        >
          文件名
        </button>
        <button
          type="button"
          class="kv-search__mode-btn ${props.searchMode === "fulltext" ? "kv-search__mode-btn--active" : ""}"
          @click=${() => props.onSearchModeChange("fulltext")}
        >
          全文
        </button>
      </div>
      <div class="kv-search__input-row">
        <span class="kv-search__icon">${icons.search}</span>
        <input
          class="input kv-search__input"
          type="search"
          placeholder=${props.searchMode === "filename" ? "过滤笔记名称…" : "全文检索（Enter 搜索）…"}
          .value=${props.query}
          @input=${(e: Event) => props.onQueryChange((e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && props.searchMode === "fulltext") {
              e.preventDefault();
              props.onFullTextSearch();
            }
          }}
        />
      </div>
      ${showFulltextResults
        ? html`<div class="kv-search__results">
            ${props.searchLoading
              ? html`<div class="kv-search__results-empty">检索中…</div>`
              : props.searchResults.length === 0
                ? html`<div class="kv-search__results-empty">无匹配结果</div>`
                : repeat(
                    props.searchResults,
                    (r) => `${r.path}:${r.startLine}:${r.score}`,
                    (hit) => html`
                      <button
                        type="button"
                        class="kv-search__hit"
                        @click=${() => props.onSelectResult(hit)}
                      >
                        <span class="kv-search__hit-title">${hit.title || hit.path}</span>
                        <span class="kv-search__hit-meta"
                          >${hit.path.replace(/\.md$/i, "")} · L${hit.startLine}${hit.endLine !== hit.startLine ? `–${hit.endLine}` : ""}</span
                        >
                        <span class="kv-search__hit-snippet">${hit.snippet}</span>
                      </button>
                    `,
                  )}
          </div>`
        : nothing}
    </div>
  `;
}
