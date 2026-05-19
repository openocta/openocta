export type SwarmMemberStatus = "idle" | "busy" | "failed";

export type SwarmWorkspace = {
  id: string;
  label: string;
  rootKey?: string;
  agentId: string;
  createdAt: number;
  updatedAt: number;
};

export type SwarmMember = {
  id: string;
  workspaceId: string;
  parentId?: string;
  sessionKey: string;
  agentId: string;
  employeeId?: string;
  subagentType?: string;
  label: string;
  status: SwarmMemberStatus;
  taskId?: string;
  spawnedBy?: string;
  createdAt: number;
  updatedAt: number;
};

export type SwarmHistoryEntry = {
  id: string;
  workspaceId: string;
  memberId: string;
  memberLabel?: string;
  role: string;
  text: string;
  timestamp: number;
  taskId?: string;
};

export type SwarmGraphNode = {
  id: string;
  label: string;
  status: SwarmMemberStatus;
  kind: string;
};

export type SwarmGraphEdge = {
  from: string;
  to: string;
};

export type SwarmGraph = {
  nodes: SwarmGraphNode[];
  edges: SwarmGraphEdge[];
};
