/**
 * Remote A2A agent discovery (Phase 2).
 * Uses fetch against /.well-known/agent.json; full @a2a-js/sdk SendMessage can be added when needed.
 */

export type RemoteAgentCard = {
  name?: string;
  description?: string;
  version?: string;
  url?: string;
  supportedInterfaces?: Array<{ url?: string; protocol?: string }>;
};

export async function fetchRemoteAgentCard(agentBaseUrl: string): Promise<RemoteAgentCard> {
  const base = agentBaseUrl.replace(/\/+$/, "");
  const wellKnown = `${base}/.well-known/agent.json`;
  const res = await fetch(wellKnown, { method: "GET" });
  if (!res.ok) {
    throw new Error(`AgentCard fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as RemoteAgentCard;
}

export function resolveRemoteAgentLabel(card: RemoteAgentCard, fallbackUrl: string): string {
  const name = card.name?.trim();
  if (name) {
    return name;
  }
  try {
    return new URL(fallbackUrl).hostname;
  } catch {
    return fallbackUrl;
  }
}
