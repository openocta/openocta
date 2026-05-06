import type { AppViewState } from "./app-view-state.ts";
import { loadConfig } from "./controllers/config.ts";
import { saveConfigPatch } from "./controllers/config.ts";
import { cloneConfigObject } from "./controllers/config/form-utils.ts";
import type { ConfigSnapshot } from "./types.ts";
import type { McpServerEntry } from "./views/mcp.ts";

/**
 * Go 序列化 `mcp.servers.*` 时 `enabled: false` 会因 omitempty 被省略，仅靠 `config.config`
 * 无法区分「禁用」与「字段缺失」。快照中的 `parsed` 来自磁盘原始 JSON，保留 `enabled: false`。
 */
export function disabledMcpServerKeysFromSnapshot(
  snapshot: Pick<ConfigSnapshot, "parsed" | "config"> | null | undefined,
): Set<string> {
  const out = new Set<string>();
  const parsedRoot = snapshot?.parsed;
  if (parsedRoot && typeof parsedRoot === "object" && !Array.isArray(parsedRoot)) {
    const mcp = (parsedRoot as Record<string, unknown>).mcp as Record<string, unknown> | undefined;
    const servers = mcp?.servers as Record<string, unknown> | undefined;
    if (servers && typeof servers === "object") {
      for (const [k, v] of Object.entries(servers)) {
        if (!v || typeof v !== "object" || Array.isArray(v)) continue;
        if ((v as Record<string, unknown>).enabled === false) out.add(k);
      }
    }
  }
  const cfgServers = (snapshot?.config as { mcp?: { servers?: Record<string, { enabled?: boolean }> } } | undefined)?.mcp
    ?.servers;
  if (cfgServers && typeof cfgServers === "object") {
    for (const [k, v] of Object.entries(cfgServers)) {
      if (v?.enabled === false) out.add(k);
    }
  }
  return out;
}

/** 编辑弹框等 UI：当原始 JSON 含显式 `enabled` 时优先采用（修复 omitempty 导致的禁用状态丢失）。 */
export function resolveMcpServerEntryForUi(
  serverKey: string,
  entry: McpServerEntry,
  snapshot: Pick<ConfigSnapshot, "parsed"> | null | undefined,
): McpServerEntry {
  const parsedRoot = snapshot?.parsed;
  if (parsedRoot && typeof parsedRoot === "object" && !Array.isArray(parsedRoot)) {
    const mcp = (parsedRoot as Record<string, unknown>).mcp as Record<string, unknown> | undefined;
    const servers = mcp?.servers as Record<string, unknown> | undefined;
    const raw = servers?.[serverKey] as Record<string, unknown> | undefined;
    if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.prototype.hasOwnProperty.call(raw, "enabled")) {
      return { ...entry, enabled: raw.enabled !== false };
    }
  }
  return entry;
}

export function handleMcpRefresh(host: AppViewState) {
  loadConfig(host);
}

export function handleMcpViewModeChange(host: AppViewState, mode: "list" | "card") {
  host.mcpViewMode = mode;
}

export function handleMcpAddServer(host: AppViewState) {
  host.mcpAddModalOpen = true;
  host.mcpAddName = "";
  host.mcpAddDraft = { enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } };
  host.mcpAddConnectionType = "stdio";
  host.mcpAddEditMode = "form";
  host.mcpAddRawJson = JSON.stringify({ enabled: true, command: "npx", args: ["-y", "@example/mcp-server-name"], env: { API_KEY: "your-api-key" } }, null, 2);
  host.mcpAddRawError = null;
}

export function handleMcpAddClose(host: AppViewState) {
  host.mcpAddModalOpen = false;
  host.mcpAddName = "";
  host.mcpAddRawError = null;
}

export function handleMcpAddNameChange(host: AppViewState, name: string) {
  host.mcpAddName = name;
}

export function handleMcpAddFormPatch(host: AppViewState, patch: Partial<McpServerEntry>) {
  host.mcpAddDraft = { ...host.mcpAddDraft, ...patch };
}

export function handleMcpAddConnectionTypeChange(host: AppViewState, type: "stdio" | "url" | "service") {
  host.mcpAddConnectionType = type;
}

export function handleMcpAddRawChange(host: AppViewState, json: string) {
  host.mcpAddRawJson = json;
  try {
    const parsed = JSON.parse(json) as McpServerEntry;
    host.mcpAddDraft = parsed;
    host.mcpAddRawError = null;
  } catch {
    host.mcpAddRawError = "Invalid JSON";
  }
}

export function handleMcpAddEditModeChange(host: AppViewState, mode: "form" | "raw") {
  host.mcpAddEditMode = mode;
  if (mode === "raw") {
    host.mcpAddRawJson = JSON.stringify(host.mcpAddDraft, null, 2);
  }
}

export async function handleMcpAddSubmit(host: AppViewState) {
  const name = host.mcpAddName?.trim();
  if (!name) {
    return;
  }
  const key = name.toLowerCase().replace(/\s+/g, "-");
  if (host.mcpAddEditMode === "raw") {
    try {
      host.mcpAddDraft = JSON.parse(host.mcpAddRawJson) as McpServerEntry;
    } catch {
      host.mcpAddRawError = "Invalid JSON";
      return;
    }
  } else {
    const type = host.mcpAddConnectionType;
    const d = host.mcpAddDraft as McpServerEntry;
    if (type === "stdio" && !d.command?.trim()) return;
    if (type === "url" && !d.url?.trim()) return;
    if (type === "service" && (!d.service?.trim() || !d.serviceUrl?.trim())) return;
  }
  if (!host.configForm && host.configSnapshot?.config) {
    host.configForm = cloneConfigObject(host.configSnapshot.config as Record<string, unknown>);
  }
  const base = cloneConfigObject(host.configForm ?? host.configSnapshot?.config ?? {});
  if (!base.mcp) {
    base.mcp = { servers: {} };
  }
  const mcp = base.mcp as { servers?: Record<string, McpServerEntry> };
  if (!mcp.servers) {
    mcp.servers = {};
  }
  const draftEnabled = (host.mcpAddDraft as { enabled?: unknown }).enabled;
  const enabled = typeof draftEnabled === "boolean" ? draftEnabled : true;
  mcp.servers[key] = { ...(host.mcpAddDraft as McpServerEntry), enabled };
  host.configForm = base;
  host.configFormDirty = true;
  await saveConfigPatch(host, { mcp: base.mcp });
  host.mcpAddModalOpen = false;
  host.mcpAddName = "";
}

function inferConnectionType(entry: McpServerEntry | undefined): "stdio" | "url" | "service" {
  if (!entry) return "stdio";
  if (entry.command) return "stdio";
  if (entry.url) return "url";
  if (entry.service && entry.serviceUrl) return "service";
  return "stdio";
}

/** 是否为「有意义的」MCP 连接配置（与磁盘上条目对齐时用）。 */
function mcpEntryLooksConfigured(e: McpServerEntry | undefined): boolean {
  if (!e || typeof e !== "object") return false;
  return !!(
    (typeof e.command === "string" && e.command.trim() !== "") ||
    (typeof e.url === "string" && e.url.trim() !== "") ||
    (typeof e.service === "string" &&
      e.service.trim() !== "" &&
      typeof e.serviceUrl === "string" &&
      e.serviceUrl.trim() !== "")
  );
}

/**
 * 工具库卡片上的 serverKey 来自 .install-metadata 的 localId，可能与 openocta.json 里 mcp.servers 的真实键不一致；
 * 不解析则编辑弹窗用错 key，表单与 raw JSON 会一直像「空配置」。
 */
function resolveMcpServerKeyAndEntry(
  requestedKey: string,
  formServers: Record<string, McpServerEntry>,
  snapServers: Record<string, McpServerEntry>,
): { key: string; entry: McpServerEntry | undefined } {
  const get = (k: string) => formServers[k] ?? snapServers[k];

  if (mcpEntryLooksConfigured(get(requestedKey))) {
    return { key: requestedKey, entry: get(requestedKey) };
  }

  const lower = requestedKey.toLowerCase();
  for (const k of new Set([...Object.keys(formServers), ...Object.keys(snapServers)])) {
    if (k.toLowerCase() === lower && mcpEntryLooksConfigured(get(k))) {
      return { key: k, entry: get(k) };
    }
  }

  const snapKeys = Object.keys(snapServers);
  if (snapKeys.length === 1 && mcpEntryLooksConfigured(snapServers[snapKeys[0]])) {
    const k = snapKeys[0];
    return { key: k, entry: snapServers[k] };
  }

  const q = requestedKey.toLowerCase();
  const hits = snapKeys.filter(
    (k) => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()),
  );
  if (hits.length === 1 && mcpEntryLooksConfigured(snapServers[hits[0]])) {
    const k = hits[0];
    return { key: k, entry: snapServers[k] };
  }

  return { key: requestedKey, entry: get(requestedKey) };
}

/** 工具库「编辑」前会先 loadConfig：若 configFormDirty 为 true，快照已更新但 configForm 不会整体替换，内存里可能仍是安装时的默认 command（如 npx）。 */
export type HandleMcpSelectOptions = {
  syncFormEntryFromSnapshot?: boolean;
};

export function handleMcpSelect(host: AppViewState, key: string | null, opts?: HandleMcpSelectOptions) {
  host.mcpRawError = null;
  if (!key) {
    host.mcpSelectedKey = null;
    return;
  }

  if (!host.configForm && host.configSnapshot?.config) {
    host.configForm = cloneConfigObject(host.configSnapshot.config as Record<string, unknown>);
  }

  const snapServers =
    (host.configSnapshot?.config as { mcp?: { servers?: Record<string, McpServerEntry> } } | undefined)?.mcp
      ?.servers ?? {};

  const formServers = (host.configForm?.mcp as { servers?: Record<string, McpServerEntry> })?.servers ?? {};
  const { key: resolvedKey, entry: resolvedEntry } = resolveMcpServerKeyAndEntry(key, formServers, snapServers);
  host.mcpSelectedKey = resolvedKey;

  if (host.configForm && snapServers[resolvedKey] !== undefined) {
    const base = host.configForm as { mcp?: { servers?: Record<string, McpServerEntry> } };
    if (!base.mcp) {
      base.mcp = { servers: {} };
    }
    if (!base.mcp.servers) {
      base.mcp.servers = {};
    }
    const snapEntry = snapServers[resolvedKey] as McpServerEntry;
    const existing = base.mcp.servers[resolvedKey];
    if (opts?.syncFormEntryFromSnapshot) {
      base.mcp.servers[resolvedKey] = cloneConfigObject(snapEntry);
    } else if (existing === undefined) {
      base.mcp.servers[resolvedKey] = cloneConfigObject(snapEntry);
    } else if (!mcpEntryLooksConfigured(existing) && mcpEntryLooksConfigured(snapEntry)) {
      // 例如仅用「禁用」写过 enabled，表单里只有 { enabled: false }，快照里仍有完整 command/args —— 必须以快照补全，否则表单会误显示默认 npx。
      base.mcp.servers[resolvedKey] = {
        ...cloneConfigObject(snapEntry),
        ...existing,
      };
    }
  }

  const entry =
    (host.configForm?.mcp as { servers?: Record<string, McpServerEntry> })?.servers?.[resolvedKey] ??
    snapServers[resolvedKey] ??
    resolvedEntry;

  host.mcpRawJson = entry ? JSON.stringify(entry, null, 2) : "{}";
  host.mcpEditConnectionType = inferConnectionType(entry);
}

export function handleMcpEditConnectionTypeChange(host: AppViewState, type: "stdio" | "url" | "service") {
  host.mcpEditConnectionType = type;
}

export async function handleMcpToggle(host: AppViewState, key: string, enabled: boolean) {
  const base = cloneConfigObject(host.configForm ?? host.configSnapshot?.config ?? {});
  if (!base.mcp) {
    base.mcp = { servers: {} };
  }
  const mcp = base.mcp as { servers?: Record<string, McpServerEntry> };
  if (!mcp.servers) {
    mcp.servers = {};
  }
  if (!mcp.servers[key]) {
    mcp.servers[key] = {};
  }
  mcp.servers[key] = { ...mcp.servers[key], enabled };
  host.configForm = base;
  host.configFormDirty = true;
  await saveConfigPatch(host, { mcp: base.mcp });
}

export function handleMcpFormPatch(host: AppViewState, key: string, patch: Partial<McpServerEntry>) {
  const base = cloneConfigObject(host.configForm ?? host.configSnapshot?.config ?? {});
  if (!base.mcp) {
    base.mcp = { servers: {} };
  }
  const mcp = base.mcp as { servers?: Record<string, McpServerEntry> };
  if (!mcp.servers) {
    mcp.servers = {};
  }
  const current = mcp.servers[key] ?? {};
  mcp.servers[key] = { ...current, ...patch };
  host.configForm = base;
  host.configFormDirty = true;
  host.mcpFormDirty = true;
}

export function handleMcpRawChange(host: AppViewState, key: string, json: string) {
  host.mcpRawJson = json;
  try {
    const parsed = JSON.parse(json) as McpServerEntry;
    const base = cloneConfigObject(host.configForm ?? host.configSnapshot?.config ?? {});
    if (!base.mcp) {
      base.mcp = { servers: {} };
    }
    const mcp = base.mcp as { servers?: Record<string, McpServerEntry> };
    if (!mcp.servers) {
      mcp.servers = {};
    }
    mcp.servers[key] = parsed;
    host.configForm = base;
    host.configFormDirty = true;
    host.mcpRawError = null;
  } catch {
    host.mcpRawError = "Invalid JSON";
  }
}

export function handleMcpSave(host: AppViewState) {
  if (!host.mcpSelectedKey) {
    return;
  }
  if (host.mcpEditMode === "raw") {
    try {
      JSON.parse(host.mcpRawJson);
    } catch {
      host.mcpRawError = "Invalid JSON";
      return;
    }
  }
  const patch = { mcp: { servers: host.configForm?.mcp ? (host.configForm.mcp as { servers?: Record<string, McpServerEntry> }).servers : {} } };
  saveConfigPatch(host, patch);
  host.mcpFormDirty = false;
  host.mcpSelectedKey = null;
}

export function handleMcpCancel(host: AppViewState) {
  host.mcpSelectedKey = null;
  host.mcpRawError = null;
  if (host.mcpFormDirty) {
    loadConfig(host);
  }
}

export async function handleMcpDelete(host: AppViewState, key: string) {
  const trimmed = (key ?? "").trim();
  if (!trimmed) {
    return;
  }

  if (host.client && host.connected) {
    let baseHash = host.configSnapshot?.hash;
    if (!baseHash) {
      await loadConfig(host);
      baseHash = host.configSnapshot?.hash;
    }
    if (!baseHash) {
      host.lastError = "Config hash missing; reload and retry.";
      return;
    }
    host.configSaving = true;
    host.lastError = null;
    try {
      await host.client.request("mcp.servers.delete", { serverKey: trimmed, baseHash });
      host.configFormDirty = false;
      await loadConfig(host);
    } catch (err) {
      host.lastError = String(err);
    } finally {
      host.configSaving = false;
    }
  } else {
    const base = host.configForm ?? host.configSnapshot?.config;
    const mcp = base?.mcp as { servers?: Record<string, McpServerEntry> } | undefined;
    if (mcp?.servers && trimmed in mcp.servers) {
      await saveConfigPatch(host, { mcp: { servers: { [trimmed]: null } } });
    }
  }

  if (host.mcpSelectedKey === trimmed || host.mcpSelectedKey === key) {
    host.mcpSelectedKey = null;
  }
}
