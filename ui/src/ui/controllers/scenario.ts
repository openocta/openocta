import { gatewayHttpBase } from "../gateway-url.ts";

function getBaseUrl(gatewayHost?: string): string {
  if (typeof window === "undefined") return "";
  if (gatewayHost?.trim()) return gatewayHttpBase(gatewayHost);
  return "";
}

type ApiOpts = { gatewayHost?: string; token?: string; silent?: boolean };

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: ApiOpts,
): Promise<T> {
  const gatewayHost = opts?.gatewayHost;
  const token = opts?.token;
  const base = getBaseUrl(gatewayHost);
  const url = base ? `${base}${path.startsWith("/") ? "" : "/"}${path}` : path;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token?.trim()) headers["Authorization"] = `Bearer ${token.trim()}`;
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (err) {
    if (opts?.silent) {
      throw new Error("__silent_network__");
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg === "Failed to fetch" ? "网络请求失败" : msg);
  }
  if (!res.ok) {
    if (opts?.silent) {
      throw new Error("__silent_http__");
    }
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export type ScenarioListItem = {
  id: string;
  name?: string;
  description?: string;
  version?: string;
  publisher?: string;
};

export type ScenarioJob = {
  jobId: string;
  type: string;
  pluginId?: string;
  progress: number;
  status: string;
  error?: string;
  steps: Array<{
    id: string;
    label: string;
    status: string;
    detail?: string;
  }>;
};

export type ScenariosListResponse = {
  installed?: Record<string, unknown>;
  catalog?: { items?: ScenarioListItem[] };
};

export type ScenarioState = {
  installed: Record<string, unknown>;
  catalogItems: ScenarioListItem[];
};

function normalizeCatalog(raw: ScenariosListResponse["catalog"]): ScenarioListItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ScenarioListItem[];
  return raw.items ?? [];
}

/** 拉取已安装与官网目录；网络/网关失败时返回空列表，不抛错。 */
export async function fetchScenarioState(
  gatewayHost?: string,
  token?: string,
): Promise<ScenarioState> {
  try {
    const res = await api<ScenariosListResponse>("GET", "/api/v1/scenarios", undefined, {
      gatewayHost,
      token,
      silent: true,
    });
    return {
      installed: res.installed ?? {},
      catalogItems: normalizeCatalog(res.catalog),
    };
  } catch {
    return { installed: {}, catalogItems: [] };
  }
}

export async function installScenario(id: string, gatewayHost?: string, token?: string) {
  return api<{ ok: boolean; jobId: string }>(
    "POST",
    `/api/v1/scenarios/${encodeURIComponent(id)}/install`,
    {},
    { gatewayHost, token },
  );
}

export async function installScenarioZip(
  pluginId: string,
  file: File,
  gatewayHost?: string,
  token?: string,
) {
  const fd = new FormData();
  fd.append("file", file);
  const base = getBaseUrl(gatewayHost);
  const url = `${base}/api/v1/scenarios/${encodeURIComponent(pluginId)}/install`;
  const headers: Record<string, string> = {};
  if (token?.trim()) headers["Authorization"] = `Bearer ${token.trim()}`;
  const res = await fetch(url, { method: "POST", headers, body: fd });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as { ok: boolean; jobId: string };
}

export async function fetchScenarioJob(jobId: string, gatewayHost?: string, token?: string) {
  return api<ScenarioJob>(
    "GET",
    `/api/v1/scenarios/install/jobs/${encodeURIComponent(jobId)}`,
    undefined,
    { gatewayHost, token },
  );
}

export function scenarioViewUrl(pluginId: string, gatewayHost?: string): string {
  const base = getBaseUrl(gatewayHost);
  const path = `/api/v1/scenarios/${encodeURIComponent(pluginId)}/view/`;
  return base ? `${base}${path}` : path;
}

export function getInstalledScenarioId(
  config: Record<string, unknown> | null | undefined,
  installed?: Record<string, unknown>,
): string {
  const sc = config?.scenarios as Record<string, unknown> | undefined;
  const active = sc?.activeId;
  if (typeof active === "string" && active.trim()) {
    return active.trim();
  }
  const fromConfig = sc?.installed as Record<string, unknown> | undefined;
  const keys = Object.keys(installed ?? fromConfig ?? {});
  return keys.length === 1 ? keys[0] : keys[0] ?? "";
}

export function shouldShowScenarioSetup(
  config: Record<string, unknown> | null | undefined,
): boolean {
  const sc = config?.scenarios as Record<string, unknown> | undefined;
  if (sc?.setupPromptShown === true) return false;
  const installed = sc?.installed as Record<string, unknown> | undefined;
  if (installed && Object.keys(installed).length > 0) return false;
  return true;
}

export function inferPluginIdFromZipName(filename: string): string {
  const base = filename.replace(/\.zip$/i, "").trim();
  return base || "scenario-pack";
}
