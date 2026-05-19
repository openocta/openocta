// Package swarm provides local agent swarm orchestration (create + send + spawn).
package swarm

// MemberStatus is the runtime status of a swarm member.
type MemberStatus string

const (
	MemberStatusIdle   MemberStatus = "idle"
	MemberStatusBusy   MemberStatus = "busy"
	MemberStatusFailed MemberStatus = "failed"
)

// Workspace is a swarm workspace containing multiple agent members.
type Workspace struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	RootKey   string `json:"rootKey,omitempty"`
	AgentID   string `json:"agentId"`
	CreatedAt int64  `json:"createdAt"`
	UpdatedAt int64  `json:"updatedAt"`
}

// Member is a single agent instance within a workspace.
type Member struct {
	ID           string       `json:"id"`
	WorkspaceID  string       `json:"workspaceId"`
	ParentID     string       `json:"parentId,omitempty"`
	SessionKey   string       `json:"sessionKey"`
	AgentID      string       `json:"agentId"`
	EmployeeID   string       `json:"employeeId,omitempty"`
	SubagentType string       `json:"subagentType,omitempty"`
	Label        string       `json:"label"`
	Status       MemberStatus `json:"status"`
	TaskID       string       `json:"taskId,omitempty"`
	SpawnedBy    string       `json:"spawnedBy,omitempty"`
	CreatedAt    int64        `json:"createdAt"`
	UpdatedAt    int64        `json:"updatedAt"`
}

// HistoryEntry is a single item in the swarm group timeline.
type HistoryEntry struct {
	ID          string `json:"id"`
	WorkspaceID string `json:"workspaceId"`
	MemberID    string `json:"memberId"`
	MemberLabel string `json:"memberLabel,omitempty"`
	Role        string `json:"role"`
	Text        string `json:"text"`
	Timestamp   int64  `json:"timestamp"`
	TaskID      string `json:"taskId,omitempty"`
}

// GraphNode is a node in the swarm topology graph.
type GraphNode struct {
	ID     string       `json:"id"`
	Label  string       `json:"label"`
	Status MemberStatus `json:"status"`
	Kind   string       `json:"kind"` // human | assistant | member
}

// GraphEdge connects two nodes in the swarm graph.
type GraphEdge struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// Graph is the swarm topology for UI rendering.
type Graph struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}

// PersistedState is the on-disk swarm store format.
type PersistedState struct {
	Workspaces map[string]*Workspace `json:"workspaces"`
	Members    map[string]*Member    `json:"members"`
	History    []HistoryEntry        `json:"history,omitempty"`
}
