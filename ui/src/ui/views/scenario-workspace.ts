import { html, nothing } from "lit";
import { scenarioViewUrl } from "../controllers/scenario.ts";
import { renderScenarioInstallProgress } from "./scenario-install-progress.ts";

export type ScenarioWorkspaceProps = {
  installedId: string;
  installedLabel?: string;
  gatewayHost?: string;
  installJob: import("../controllers/scenario.ts").ScenarioJob | null;
  importing: boolean;
  onImportZip: (file: File) => void;
  onCloseJob?: () => void;
};

export function renderScenarioWorkspace(props: ScenarioWorkspaceProps) {
  const pluginId = props.installedId?.trim() ?? "";
  const hasView = pluginId.length > 0;
  const iframeSrc = hasView ? scenarioViewUrl(pluginId, props.gatewayHost) : "";

  return html`
    <div class="emp-page scenario-workspace-page">
      <div class="emp-list-wrap">
        <div class="emp-toolbar">
          <h2 class="emp-toolbar__title">场景工作区</h2>
          <div class="emp-toolbar__actions">
            <label class="btn ${props.importing ? "disabled" : ""}">
              导入场景包 (.zip)
              <input
                type="file"
                accept=".zip,application/zip"
                hidden
                ?disabled=${props.importing}
                @change=${(e: Event) => {
                  const input = e.target as HTMLInputElement;
                  const file = input.files?.[0];
                  if (file) props.onImportZip(file);
                  input.value = "";
                }}
              />
            </label>
          </div>
        </div>
        ${renderScenarioInstallProgress({ job: props.installJob, onClose: props.onCloseJob })}
        ${hasView
          ? html`
              <div class="emp-workspace-frame">
                <iframe title="scenario-view" src=${iframeSrc}></iframe>
              </div>
            `
          : html`
              <div class="callout scenario-workspace-empty">暂无场景视图</div>
            `}
      </div>
    </div>
  `;
}
