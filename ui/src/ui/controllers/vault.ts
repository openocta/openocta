import type { GatewayBrowserClient } from "../gateway.ts";

export type VaultFileEntry = {
  path: string;
  title: string;
};

export type VaultFolderEntry = {
  path: string;
};

export type VaultGraphNode = {
  id: string;
  path: string;
  title: string;
};

export type VaultGraphEdge = {
  source: string;
  target: string;
  kind: "wiki" | "markdown" | string;
};

export type VaultGraph = {
  vaultDir: string;
  nodes: VaultGraphNode[];
  edges: VaultGraphEdge[];
};

export type VaultState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
};

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export type VaultSearchHit = {
  path: string;
  title: string;
  snippet: string;
  score: number;
  startLine: number;
  endLine: number;
};

export async function fetchVaultStatus(state: VaultState, agentId?: string) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = {};
  if (agentId?.trim()) params.agentId = agentId.trim();
  return state.client.request<{
    vaultDir?: string;
    fileCount?: number;
    chunkCount?: number;
    lastSyncedAt?: string;
    enabled?: boolean;
  }>("vault.status", params);
}

export async function fetchVaultFiles(state: VaultState, agentId?: string) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = {};
  if (agentId?.trim()) params.agentId = agentId.trim();
  const res = await state.client.request<{
    vaultDir?: string;
    files?: VaultFileEntry[];
    folders?: VaultFolderEntry[];
  }>(
    "vault.listFiles",
    params,
  );
  return {
    vaultDir: res.vaultDir ?? "",
    files: Array.isArray(res.files) ? res.files : [],
    folders: Array.isArray(res.folders) ? res.folders : [],
  };
}

export async function fetchVaultFile(state: VaultState, filePath: string, agentId?: string) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = { filePath };
  if (agentId?.trim()) params.agentId = agentId.trim();
  const res = await state.client.request<{ path?: string; title?: string; content?: string }>(
    "vault.getFile",
    params,
  );
  return {
    path: res.path ?? filePath,
    title: res.title ?? filePath,
    content: typeof res.content === "string" ? res.content : "",
  };
}

export async function saveVaultFile(
  state: VaultState,
  filePath: string,
  content: string,
  agentId?: string,
) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = { filePath, content };
  if (agentId?.trim()) params.agentId = agentId.trim();
  await state.client.request("vault.saveFile", params);
}

export async function createVaultFolder(state: VaultState, folderPath: string, agentId?: string) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = { folderPath };
  if (agentId?.trim()) params.agentId = agentId.trim();
  await state.client.request("vault.mkdir", params);
}

export async function createVaultFile(
  state: VaultState,
  filePath: string,
  content?: string,
  agentId?: string,
) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = { filePath };
  if (content != null) params.content = content;
  if (agentId?.trim()) params.agentId = agentId.trim();
  const res = await state.client.request<{ path?: string; title?: string; content?: string }>(
    "vault.createFile",
    params,
  );
  return {
    path: res.path ?? filePath,
    title: res.title ?? filePath,
    content: typeof res.content === "string" ? res.content : content ?? "",
  };
}

export async function syncVaultIndex(state: VaultState, agentId?: string) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = {};
  if (agentId?.trim()) params.agentId = agentId.trim();
  return state.client.request<{ ok?: boolean; fileCount?: number; chunkCount?: number }>(
    "vault.sync",
    params,
  );
}

export async function fetchVaultGraph(state: VaultState, agentId?: string): Promise<VaultGraph> {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string> = {};
  if (agentId?.trim()) params.agentId = agentId.trim();
  const res = await state.client.request<VaultGraph>("vault.graph", params);
  return {
    vaultDir: res.vaultDir ?? "",
    nodes: Array.isArray(res.nodes) ? res.nodes : [],
    edges: Array.isArray(res.edges) ? res.edges : [],
  };
}

export async function deleteVaultFile(state: VaultState, filePath: string, agentId?: string) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string | boolean> = { filePath };
  if (agentId?.trim()) params.agentId = agentId.trim();
  await state.client.request("vault.deleteFile", params);
}

export async function renameVaultPath(
  state: VaultState,
  fromPath: string,
  toPath: string,
  isFolder: boolean,
  agentId?: string,
) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const method = isFolder ? "vault.renameFolder" : "vault.renameFile";
  const params: Record<string, string> = { fromPath, toPath };
  if (agentId?.trim()) params.agentId = agentId.trim();
  await state.client.request(method, params);
}

export async function deleteVaultFolder(
  state: VaultState,
  folderPath: string,
  confirm: boolean,
  agentId?: string,
) {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string | boolean> = { folderPath, confirm };
  if (agentId?.trim()) params.agentId = agentId.trim();
  await state.client.request("vault.deleteFolder", params);
}

export async function searchVaultIndex(
  state: VaultState,
  query: string,
  limit = 20,
  agentId?: string,
): Promise<VaultSearchHit[]> {
  if (!state.client || !state.connected) {
    throw new Error("未连接 Gateway");
  }
  const params: Record<string, string | number> = { query, limit };
  if (agentId?.trim()) params.agentId = agentId.trim();
  const res = await state.client.request<{ results?: VaultSearchHit[] }>("vault.search", params);
  return Array.isArray(res.results) ? res.results : [];
}

export function formatVaultError(err: unknown) {
  return getErrorMessage(err);
}
