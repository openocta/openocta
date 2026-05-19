export type ParsedAgentSessionKey = {
  agentId: string;
  rest: string;
};

/** 与网关 chat.send 一致：TrimSpace + ToLower，避免 WebSocket 事件与 UI 会话 key 大小写不一致时丢弃 final。 */
export function canonicalGatewaySessionKey(sessionKey: string | undefined | null): string {
  return (sessionKey ?? "").trim().toLowerCase();
}

export function gatewaySessionKeysEqual(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  return canonicalGatewaySessionKey(a) === canonicalGatewaySessionKey(b);
}

export function parseAgentSessionKey(
  sessionKey: string | undefined | null,
): ParsedAgentSessionKey | null {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return null;
  }
  const parts = raw.split(":").filter(Boolean);
  if (parts.length < 3) {
    return null;
  }
  if (parts[0] !== "agent") {
    return null;
  }
  const agentId = parts[1]?.trim();
  const rest = parts.slice(2).join(":");
  if (!agentId || !rest) {
    return null;
  }
  return { agentId, rest };
}

/** Swarm member session: agent:<agentId>:swarm:<workspaceId>:<memberId> (optional employee segment). */
export function isSwarmSessionKey(sessionKey: string | undefined | null): boolean {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return false;
  }
  if (/^agent:[^:]+:swarm:[^:]+:[^:]+$/i.test(raw)) {
    return true;
  }
  return /^agent:[^:]+:employee:[^:]+:swarm:[^:]+:[^:]+$/i.test(raw);
}

export function isSubagentSessionKey(sessionKey: string | undefined | null): boolean {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return false;
  }
  if (raw.toLowerCase().startsWith("subagent:")) {
    return true;
  }
  const parsed = parseAgentSessionKey(raw);
  return Boolean((parsed?.rest ?? "").toLowerCase().startsWith("subagent:"));
}

export function isAcpSessionKey(sessionKey: string | undefined | null): boolean {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return false;
  }
  const normalized = raw.toLowerCase();
  if (normalized.startsWith("acp:")) {
    return true;
  }
  const parsed = parseAgentSessionKey(raw);
  return Boolean((parsed?.rest ?? "").toLowerCase().startsWith("acp:"));
}

/** UI 为数字员工新开线程时生成的 key：首条消息写入前可能尚不在 sessions.list 中。 */
export function isEmployeeRunSessionKey(sessionKey: string | undefined | null): boolean {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return false;
  }
  return /^agent:[^:]+:employee:[^:]+:run:.+/i.test(raw);
}

/** 稳定态数字员工 Web 会话 agent:*:employee:*（恰好四段，无 :run:）。sessions.ensure 写入前可能不在 list。 */
export function isStableEmployeeWebchatSessionKey(sessionKey: string | undefined | null): boolean {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return false;
  }
  return /^agent:[^:]+:employee:[^:]+$/i.test(raw);
}

/**
 * Cron 单次运行会话 key。网关 sessions.list 有意不包含此类会话（见 handlers/sessions.go isCronRunSessionKey），
 * 与「会话不存在」无关；用于 UI 协调逻辑时勿误判为已删除。
 *
 * - Current: agent:{agentId}:cron:{jobId}:run:{sessionId}
 * - Legacy: cron:{jobId}:run:{sessionId}
 */
export function isCronRunSessionKey(sessionKey: string | undefined | null): boolean {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return false;
  }
  if (/^cron:[^:]+:run:/i.test(raw)) {
    return true;
  }
  return /^agent:[^:]+:cron:[^:]+:run:.+/i.test(raw);
}

/**
 * 单次运行 session key → 定时任务持久会话 key（消息页 / 侧栏使用的 agent:{agentId}:cron:{jobId}）。
 * 单次运行形如 agent:{agentId}:cron:{jobId}:run:{runSessionId}；若已是持久 key 则原样返回。
 */
export function cronJobSessionKeyFromRunSessionKey(sessionKey: string | undefined | null): string | null {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return null;
  }
  const runMatch = /^agent:([^:]+):cron:([^:]+):run:.+$/i.exec(raw);
  if (runMatch) {
    return `agent:${runMatch[1]}:cron:${runMatch[2]}`;
  }
  if (/^agent:[^:]+:cron:[^:]+$/i.test(raw)) {
    return raw;
  }
  const legacy = /^cron:([^:]+):run:/i.exec(raw);
  if (legacy) {
    return `agent:main:cron:${legacy[1]}`;
  }
  return null;
}

const THREAD_SESSION_MARKERS = [":thread:", ":topic:"];

export function resolveThreadParentSessionKey(
  sessionKey: string | undefined | null,
): string | null {
  const raw = (sessionKey ?? "").trim();
  if (!raw) {
    return null;
  }
  const normalized = raw.toLowerCase();
  let idx = -1;
  for (const marker of THREAD_SESSION_MARKERS) {
    const candidate = normalized.lastIndexOf(marker);
    if (candidate > idx) {
      idx = candidate;
    }
  }
  if (idx <= 0) {
    return null;
  }
  const parent = raw.slice(0, idx).trim();
  return parent ? parent : null;
}
