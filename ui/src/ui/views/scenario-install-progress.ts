import { html, nothing } from "lit";
import type { ScenarioJob } from "../controllers/scenario.ts";

export type ScenarioInstallProgressProps = {
  job: ScenarioJob | null;
  onClose?: () => void;
};

export function renderScenarioInstallProgress(props: ScenarioInstallProgressProps) {
  const job = props.job;
  if (!job) return nothing;
  const pct = Math.round((job.progress ?? 0) * 100);
  return html`
    <div class="emp-job-panel">
      <div class="emp-job-panel__header">
        <span>安装进度</span>
        ${props.onClose
          ? html`<button class="btn small" type="button" @click=${props.onClose}>关闭</button>`
          : nothing}
      </div>
      <div class="emp-job-progress">
        <div class="emp-job-progress__bar" style="width: ${pct}%"></div>
      </div>
      <ul class="emp-job-steps">
        ${(job.steps ?? []).map(
          (st) => html`
            <li class="emp-job-step emp-job-step--${st.status}">${st.label}${st.detail ? ` — ${st.detail}` : ""}</li>
          `,
        )}
      </ul>
      ${job.status === "failed" && job.error
        ? html`<div class="callout danger">${job.error}</div>`
        : nothing}
    </div>
  `;
}
