import { html, nothing } from "lit";
import type { ScenarioJob } from "../controllers/scenario.ts";

export function renderScenarioStartupBanner(job: ScenarioJob | null) {
  if (!job || job.type !== "startup_load" || job.status === "done") {
    return nothing;
  }
  const pct = Math.round((job.progress ?? 0) * 100);
  return html`
    <div class="callout">
      正在加载场景插件… ${pct}%
      <ul class="emp-job-steps">
        ${(job.steps ?? []).map((st) => html`<li class="emp-job-step emp-job-step--${st.status}">${st.label}</li>`)}
      </ul>
    </div>
  `;
}
