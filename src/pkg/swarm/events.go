package swarm

// Event names broadcast over the gateway WebSocket.
const (
	EventMemberUpdated = "swarm.member.updated"
	EventTaskDelta     = "swarm.task.delta"
	EventTaskFinal     = "swarm.task.final"
)

// MemberUpdatedPayload is sent when a member's status or metadata changes.
type MemberUpdatedPayload struct {
	WorkspaceID string  `json:"workspaceId"`
	Member      *Member `json:"member"`
}

// TaskDeltaPayload carries incremental output during a swarm task run.
type TaskDeltaPayload struct {
	WorkspaceID string                 `json:"workspaceId"`
	MemberID    string                 `json:"memberId"`
	TaskID      string                 `json:"taskId"`
	SessionKey  string                 `json:"sessionKey"`
	Stream      string                 `json:"stream"`
	Data        map[string]interface{} `json:"data,omitempty"`
}

// TaskFinalPayload is sent when a swarm task completes.
type TaskFinalPayload struct {
	WorkspaceID string `json:"workspaceId"`
	MemberID    string `json:"memberId"`
	TaskID      string `json:"taskId"`
	SessionKey  string `json:"sessionKey"`
	Output      string `json:"output,omitempty"`
	Error       string `json:"error,omitempty"`
}

// Broadcaster sends swarm events to connected clients.
type Broadcaster func(event string, payload interface{})
