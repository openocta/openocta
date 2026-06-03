import { html, nothing } from "lit";
import type { ScenarioJob, ScenarioListItem } from "../controllers/scenario.ts";
import { renderScenarioInstallProgress } from "./scenario-install-progress.ts";
import { icons } from "../icons.js";

export type ScenarioMarketProps = {
  loading: boolean;
  error: string | null;
  query: string;
  items: ScenarioListItem[];
  installedIds: Set<string>;
  installingId: string | null;
  installJob: ScenarioJob | null;
  onQueryChange: (q: string) => void;
  onRefresh: () => void;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onCloseJob?: () => void;
};

export function renderScenarioMarket(props: ScenarioMarketProps) {
  const q = (props.query ?? "").trim().toLowerCase();
  const filtered = (props.items ?? []).filter((it) => {
    if (!q) return true;
    const text = `${it.name ?? ""} ${it.description ?? ""} ${it.id}`.toLowerCase();
    return text.includes(q);
  });

  return html`
    <div class="emp-page">
      <div class="emp-list-wrap">
        <div class="emp-toolbar">
          <h2 class="emp-toolbar__title">场景市场</h2>
          <div class="emp-toolbar__actions">
            <div class="emp-search">
              <span class="input"
                ><input
                  class="emp-search__input"
                  type="text"
                  placeholder="搜索"
                  .value=${props.query}
                  @input=${(e: Event) => props.onQueryChange((e.target as HTMLInputElement).value)}
              /></span>
              <span class="emp-search__icon" aria-hidden="true">${icons.search}</span>
            </div>
            <button class="btn" type="button" ?disabled=${props.loading} @click=${props.onRefresh}>刷新</button>
            <a
              class="btn"
              href="https://github.com/openocta/openocta/blob/main/openocta/src/docs/scenario-pack-authoring.md"
              target="_blank"
              rel="noopener"
              >编写指南</a
            >
          </div>
        </div>
        ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}
        ${renderScenarioInstallProgress({ job: props.installJob, onClose: props.onCloseJob })}
        <div class="emp-grid">
          ${filtered.map((item) => {
            const id = item.id;
            const installed = props.installedIds.has(id);
            const installing = props.installingId === id;
            return html`
              <div class="emp-card-wrap">
                <div class="emp-card">
                  <div class="emp-card__title">${item.name ?? id}</div>
                  <div class="emp-card__desc">${item.description ?? ""}</div>
                  <div class="market-card-meta">
                    ${item.version ? html`<span class="market-card-chip">${item.version}</span>` : nothing}
                    ${installed ? html`<span class="market-card-chip market-card-chip--state">已安装</span>` : nothing}
                  </div>
                  <div class="market-card-actions">
                    ${installed
                      ? html`
                          <button class="btn small" type="button" @click=${() => props.onUninstall(id)}>卸载</button>
                        `
                      : html`
                          <button
                            class="btn small primary"
                            type="button"
                            ?disabled=${installing}
                            @click=${() => props.onInstall(id)}
                          >
                            ${installing ? "安装中" : "安装"}
                          </button>
                        `}
                  </div>
                </div>
              </div>
            `;
          })}
        </div>
        ${!props.loading && filtered.length === 0
          ? html`<p class="muted">暂无场景包。可参考编写指南创建示例包。</p>`
          : nothing}
      </div>
    </div>
  `;
}
