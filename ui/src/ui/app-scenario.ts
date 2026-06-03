import type { OpenClawApp } from "./app.ts";
import { loadConfig, saveConfigPatch } from "./controllers/config.ts";
import {
  fetchScenarioJob,
  fetchScenarioState,
  getInstalledScenarioId,
  installScenario,
  installScenarioZip,
  shouldShowScenarioSetup,
} from "./controllers/scenario.ts";

export async function markScenarioSetupPromptShown(app: OpenClawApp) {
  await saveConfigPatch(app, { scenarios: { setupPromptShown: true } });
}

export async function refreshScenarioWorkspace(app: OpenClawApp) {
  const gw = app.settings?.gatewayUrl?.trim();
  const tok = app.settings?.token?.trim();
  const state = await fetchScenarioState(gw, tok);
  app.scenarioInstalled = state.installed;
  app.scenarioInstalledId = getInstalledScenarioId(
    app.configSnapshot?.config as Record<string, unknown> | undefined,
    state.installed,
  );
}

export async function loadScenarioSetupCatalog(app: OpenClawApp) {
  app.scenarioSetupLoading = true;
  app.scenarioSetupError = null;
  try {
    const state = await fetchScenarioState(
      app.settings?.gatewayUrl?.trim(),
      app.settings?.token?.trim(),
    );
    app.scenarioSetupItems = state.catalogItems;
    if (!app.scenarioSetupSelectedId && state.catalogItems.length > 0) {
      app.scenarioSetupSelectedId = state.catalogItems[0].id;
    }
  } finally {
    app.scenarioSetupLoading = false;
  }
}

export async function maybeOpenScenarioSetupModal(app: OpenClawApp) {
  if (app.onboarding || app.scenarioSetupPromptChecked) return;
  app.scenarioSetupPromptChecked = true;
  if (!app.connected) return;
  await loadConfig(app);
  if (!shouldShowScenarioSetup(app.configSnapshot?.config as Record<string, unknown>)) {
    return;
  }
  app.scenarioSetupModalOpen = true;
  void loadScenarioSetupCatalog(app);
}

export async function runScenarioInstall(
  app: OpenClawApp,
  pluginId: string,
  zipFile?: File,
) {
  const gw = app.settings?.gatewayUrl?.trim();
  const tok = app.settings?.token?.trim();
  app.scenarioInstallJob = null;
  const { jobId } = zipFile
    ? await installScenarioZip(pluginId, zipFile, gw, tok)
    : await installScenario(pluginId, gw, tok);
  app.scenarioInstallJob = await fetchScenarioJob(jobId, gw, tok);
}

export async function skipScenarioSetup(app: OpenClawApp) {
  app.scenarioSetupModalOpen = false;
  await markScenarioSetupPromptShown(app);
}

export async function confirmScenarioSetup(app: OpenClawApp) {
  const id = app.scenarioSetupSelectedId?.trim();
  if (!id) return;
  app.scenarioSetupInstalling = true;
  app.scenarioSetupError = null;
  try {
    await runScenarioInstall(app, id);
  } catch (err) {
    app.scenarioSetupError = (err as Error)?.message ?? String(err);
  } finally {
    app.scenarioSetupInstalling = false;
  }
}

export function handleScenarioInstallJobUpdate(app: OpenClawApp, job: import("./controllers/scenario.ts").ScenarioJob) {
  app.scenarioInstallJob = job;
  if (job.status === "done") {
    void (async () => {
      await loadConfig(app);
      await refreshScenarioWorkspace(app);
      if (app.scenarioSetupModalOpen) {
        app.scenarioSetupModalOpen = false;
        void markScenarioSetupPromptShown(app);
      }
    })();
  }
  if (job.status === "failed" && app.scenarioSetupModalOpen) {
    app.scenarioSetupError = job.error ?? "安装失败";
    app.scenarioInstallJob = null;
  }
}
