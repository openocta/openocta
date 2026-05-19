import type { GatewayBrowserClient } from "../gateway.ts";
import type {
  SwarmGraph,
  SwarmHistoryEntry,
  SwarmMember,
  SwarmWorkspace,
} from "../types/swarm-types.ts";

export type SwarmToolEntry = {
  toolCallId: string;
  name: string;
  args?: string;
  output?: string;
  isError?: boolean;
};

export type SwarmState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  swarmLoading: boolean;
  swarmError: string | null;
  swarmWorkspaces: SwarmWorkspace[];
  swarmActiveWorkspaceId: string | null;
  swarmMembers: SwarmMember[];
  swarmSelectedMemberId: string | null;
  swarmGraph: SwarmGraph | null;
  swarmHistory: SwarmHistoryEntry[];
  swarmInput: string;
  swarmSending: boolean;
  swarmStreamText: string;
  swarmReasoningText: string;
  swarmToolEntries: SwarmToolEntry[];
};

export function resetSwarmLivePanels(state: SwarmState) {
  state.swarmStreamText = "";
  state.swarmReasoningText = "";
  state.swarmToolEntries = [];
}

function formatSwarmToolArgs(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export async function loadSwarmWorkspaces(state: SwarmState) {
  if (!state.client || !state.connected) {
    return;
  }
  state.swarmLoading = true;
  state.swarmError = null;
  try {
    const res = await state.client.request<{ workspaces: SwarmWorkspace[] }>("swarm.workspaces.list", {});
    state.swarmWorkspaces = res?.workspaces ?? [];
    if (!state.swarmActiveWorkspaceId && state.swarmWorkspaces.length > 0) {
      state.swarmActiveWorkspaceId = state.swarmWorkspaces[0]?.id ?? null;
    }
  } catch (err) {
    state.swarmError = err instanceof Error ? err.message : String(err);
  } finally {
    state.swarmLoading = false;
  }
}

export async function stopAllSwarmAgents(state: SwarmState) {
  const wsId = state.swarmActiveWorkspaceId;
  if (!state.client || !state.connected || !wsId) {
    return;
  }
  state.swarmLoading = true;
  state.swarmError = null;
  try {
    await state.client.request("swarm.workspaces.abortAll", { workspaceId: wsId });
    state.swarmSending = false;
    resetSwarmLivePanels(state);
    await refreshSwarmWorkspace(state);
  } catch (err) {
    state.swarmError = err instanceof Error ? err.message : String(err);
  } finally {
    state.swarmLoading = false;
  }
}

export async function deleteSwarmWorkspace(state: SwarmState, workspaceId: string) {
  if (!state.client || !state.connected || !workspaceId.trim()) {
    return;
  }
  state.swarmLoading = true;
  state.swarmError = null;
  try {
    await state.client.request("swarm.workspaces.delete", { workspaceId: workspaceId.trim() });
    if (state.swarmActiveWorkspaceId === workspaceId) {
      state.swarmActiveWorkspaceId = null;
      state.swarmMembers = [];
      state.swarmGraph = null;
      state.swarmHistory = [];
      state.swarmSelectedMemberId = null;
    }
    await loadSwarmWorkspaces(state);
    if (state.swarmActiveWorkspaceId) {
      await refreshSwarmWorkspace(state);
    }
  } catch (err) {
    state.swarmError = err instanceof Error ? err.message : String(err);
  } finally {
    state.swarmLoading = false;
  }
}

export async function createSwarmWorkspace(state: SwarmState, label: string, agentId = "main") {
  if (!state.client || !state.connected) {
    return;
  }
  state.swarmLoading = true;
  state.swarmError = null;
  try {
    const res = await state.client.request<{
      workspace: SwarmWorkspace;
      rootMember: SwarmMember;
    }>("swarm.workspaces.create", { label, agentId, rootLabel: "Assistant" });
    if (res?.workspace) {
      state.swarmActiveWorkspaceId = res.workspace.id;
      await loadSwarmWorkspaces(state);
      await refreshSwarmWorkspace(state);
    }
  } catch (err) {
    state.swarmError = err instanceof Error ? err.message : String(err);
  } finally {
    state.swarmLoading = false;
  }
}

/** Load workspaces; create one with root Assistant if none exists. */
export async function ensureSwarmWorkspace(state: SwarmState) {
  await loadSwarmWorkspaces(state);
  if (!state.swarmActiveWorkspaceId) {
    if (state.swarmWorkspaces.length > 0) {
      state.swarmActiveWorkspaceId = state.swarmWorkspaces[0]?.id ?? null;
      await refreshSwarmWorkspace(state);
      return;
    }
    await createSwarmWorkspace(state, "AgentSwarm");
    return;
  }
  await refreshSwarmWorkspace(state);
}

export async function refreshSwarmWorkspace(state: SwarmState) {
  const wsId = state.swarmActiveWorkspaceId;
  if (!state.client || !state.connected || !wsId) {
    return;
  }
  try {
    const [membersRes, graphRes, historyRes] = await Promise.all([
      state.client.request<{ members: SwarmMember[] }>("swarm.members.list", { workspaceId: wsId }),
      state.client.request<SwarmGraph>("swarm.graph.get", { workspaceId: wsId }),
      state.client.request<{ history: SwarmHistoryEntry[] }>("swarm.history.get", {
        workspaceId: wsId,
        limit: 100,
      }),
    ]);
    state.swarmMembers = membersRes?.members ?? [];
    state.swarmGraph = graphRes ?? null;
    state.swarmHistory = historyRes?.history ?? [];
    if (!state.swarmSelectedMemberId && state.swarmMembers.length > 0) {
      const root = state.swarmMembers.find((m) => !(m.parentId ?? "").trim());
      state.swarmSelectedMemberId = root?.id ?? state.swarmMembers[0]?.id ?? null;
    }
  } catch (err) {
    state.swarmError = err instanceof Error ? err.message : String(err);
  }
}

export async function addSwarmMember(
  state: SwarmState,
  opts: { parentId?: string; employeeId?: string; label?: string; agentId?: string },
) {
  const wsId = state.swarmActiveWorkspaceId;
  if (!state.client || !state.connected || !wsId) {
    return;
  }
  try {
    await state.client.request("swarm.members.add", {
      workspaceId: wsId,
      parentId: opts.parentId ?? state.swarmSelectedMemberId ?? "",
      employeeId: opts.employeeId,
      label: opts.label,
      agentId: opts.agentId,
    });
    await refreshSwarmWorkspace(state);
  } catch (err) {
    state.swarmError = err instanceof Error ? err.message : String(err);
  }
}

export async function sendSwarmMessage(state: SwarmState) {
  const wsId = state.swarmActiveWorkspaceId;
  const memberId = state.swarmSelectedMemberId;
  const text = state.swarmInput.trim();
  if (!state.client || !state.connected || !wsId || !memberId || !text) {
    return;
  }
  state.swarmSending = true;
  resetSwarmLivePanels(state);
  try {
    await state.client.request("swarm.message.send", {
      workspaceId: wsId,
      memberId,
      text,
    });
    state.swarmInput = "";
    await refreshSwarmWorkspace(state);
  } catch (err) {
    state.swarmError = err instanceof Error ? err.message : String(err);
  } finally {
    state.swarmSending = false;
  }
}

export function applySwarmMemberUpdated(state: SwarmState, member: SwarmMember) {
  const idx = state.swarmMembers.findIndex((m) => m.id === member.id);
  if (idx >= 0) {
    state.swarmMembers = [
      ...state.swarmMembers.slice(0, idx),
      member,
      ...state.swarmMembers.slice(idx + 1),
    ];
  }
}

export function applySwarmTaskDelta(
  state: SwarmState,
  payload: {
    memberId?: string;
    stream?: string;
    data?: Record<string, unknown>;
  },
) {
  if (payload.memberId && payload.memberId !== state.swarmSelectedMemberId) {
    return;
  }
  const stream = payload.stream ?? "assistant";
  const data = payload.data ?? {};

  if (stream === "assistant") {
    const chunk = typeof data.text === "string" ? data.text : "";
    if (chunk) {
      state.swarmStreamText = `${state.swarmStreamText}${chunk}`;
    }
    return;
  }

  if (stream === "reasoning") {
    const chunk = typeof data.text === "string" ? data.text : "";
    if (chunk) {
      state.swarmReasoningText = `${state.swarmReasoningText}${chunk}`;
    }
    return;
  }

  if (stream === "tool_call") {
    const toolCallId = typeof data.toolCallId === "string" ? data.toolCallId : "";
    if (!toolCallId) {
      return;
    }
    const name =
      typeof data.name === "string" && data.name.trim() ? data.name.trim() : "tool";
    const args = formatSwarmToolArgs(data.arguments);
    const existing = state.swarmToolEntries.find((e) => e.toolCallId === toolCallId);
    if (existing) {
      existing.name = name;
      if (args !== undefined) {
        existing.args = args;
      }
    } else {
      state.swarmToolEntries = [
        ...state.swarmToolEntries,
        { toolCallId, name, args },
      ];
    }
    return;
  }

  if (stream === "tool_result") {
    const toolCallId = typeof data.toolCallId === "string" ? data.toolCallId : "";
    if (!toolCallId) {
      return;
    }
    const toolName =
      typeof data.toolName === "string" && data.toolName.trim()
        ? data.toolName.trim()
        : "tool";
    const content = typeof data.content === "string" ? data.content : "";
    const isError = Boolean(data.isError);
    const existing = state.swarmToolEntries.find((e) => e.toolCallId === toolCallId);
    if (existing) {
      existing.name = toolName;
      existing.output = content;
      existing.isError = isError;
    } else {
      state.swarmToolEntries = [
        ...state.swarmToolEntries,
        { toolCallId, name: toolName, output: content, isError },
      ];
    }
  }
}

export async function applySwarmTaskFinal(state: SwarmState) {
  await refreshSwarmWorkspace(state);
  resetSwarmLivePanels(state);
}
