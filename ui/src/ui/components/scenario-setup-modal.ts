import { html, nothing } from "lit";
import type { ScenarioJob, ScenarioListItem } from "../controllers/scenario.ts";
import { renderScenarioInstallProgress } from "../views/scenario-install-progress.ts";

export type ScenarioSetupModalProps = {
  open: boolean;
  loading: boolean;
  items: ScenarioListItem[];
  selectedId: string;
  installing: boolean;
  installJob: ScenarioJob | null;
  error: string | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
};

export function renderScenarioSetupModal(props: ScenarioSetupModalProps) {
  if (!props.open) return nothing;

  const canConfirm =
    props.selectedId.trim() &&
    !props.installing &&
    (!props.installJob || props.installJob.status === "failed");

  return html`
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="scenario-setup-title">
      <div class="modal scenario-setup-modal">
        <h2 id="scenario-setup-title" class="modal__title">选择场景包</h2>
        <p class="muted">
          首次使用请从 OpenOcta 官网选择一个场景包进行初始化安装。安装完成后将自动加载场景工作区视图。
        </p>
        ${props.error ? html`<div class="callout danger">${props.error}</div>` : nothing}
        ${renderScenarioInstallProgress({ job: props.installJob })}
        ${props.loading
          ? html`<p class="muted">正在获取场景列表…</p>`
          : props.items.length === 0
            ? html`<p class="muted">暂无可选场景包，请稍后重试或在工作区导入 ZIP。</p>`
            : html`
                <div class="scenario-setup-list" role="radiogroup" aria-label="场景包">
                  ${props.items.map(
                    (item) => html`
                      <label class="scenario-setup-option">
                        <input
                          type="radio"
                          name="scenario-pack"
                          .value=${item.id}
                          ?checked=${props.selectedId === item.id}
                          ?disabled=${props.installing || !!props.installJob}
                          @change=${() => props.onSelect(item.id)}
                        />
                        <span class="scenario-setup-option__body">
                          <span class="scenario-setup-option__title">${item.name ?? item.id}</span>
                          ${item.description
                            ? html`<span class="scenario-setup-option__desc">${item.description}</span>`
                            : nothing}
                        </span>
                      </label>
                    `,
                  )}
                </div>
              `}
        <div class="modal__actions">
          <button class="btn" type="button" ?disabled=${props.installing} @click=${props.onSkip}>
            稍后
          </button>
          <button
            class="btn primary"
            type="button"
            ?disabled=${!canConfirm}
            @click=${props.onConfirm}
          >
            ${props.installing ? "安装中…" : "安装并启用"}
          </button>
        </div>
      </div>
    </div>
  `;
}
