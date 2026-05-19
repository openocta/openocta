package swarm

import (
	"strings"

	"github.com/google/uuid"
)

// AddMemberOpts configures a new swarm member.
type AddMemberOpts struct {
	WorkspaceID  string
	ParentID     string
	AgentID      string
	EmployeeID   string
	SubagentType string
	Label        string
	SpawnedBy    string
}

// NewMemberFromOpts builds a member with session key and defaults.
func NewMemberFromOpts(ws *Workspace, opts AddMemberOpts) *Member {
	agentID := strings.TrimSpace(opts.AgentID)
	if agentID == "" && ws != nil {
		agentID = ws.AgentID
	}
	if agentID == "" {
		agentID = "main"
	}
	memberID := uuid.New().String()
	label := strings.TrimSpace(opts.Label)
	if label == "" {
		if opts.EmployeeID != "" {
			label = opts.EmployeeID
		} else if opts.SubagentType != "" {
			label = opts.SubagentType
		} else {
			label = memberID[:8]
		}
	}
	spawnedBy := strings.TrimSpace(opts.SpawnedBy)
	if spawnedBy == "" {
		spawnedBy = "user"
	}
	return &Member{
		ID:           memberID,
		WorkspaceID:  opts.WorkspaceID,
		ParentID:     strings.TrimSpace(opts.ParentID),
		SessionKey:   BuildMemberSessionKey(agentID, opts.WorkspaceID, memberID, opts.EmployeeID),
		AgentID:      agentID,
		EmployeeID:   strings.TrimSpace(opts.EmployeeID),
		SubagentType: strings.TrimSpace(opts.SubagentType),
		Label:        label,
		Status:       MemberStatusIdle,
		SpawnedBy:    spawnedBy,
	}
}
