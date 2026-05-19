package swarm

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/openocta/openocta/pkg/a2a/executor"
	"github.com/openocta/openocta/pkg/a2a/task"
)

// Orchestrator coordinates swarm workspaces, members, and task execution.
type Orchestrator struct {
	Store               *Store
	Executor            *executor.RuntimeExecutor
	Broadcast           Broadcaster
	MaxPingPongTurns    int
	mu                  sync.Mutex
	pingPongByWorkspace map[string]int
}

// NewOrchestrator creates an orchestrator with the given dependencies.
func NewOrchestrator(store *Store, exec *executor.RuntimeExecutor, broadcast Broadcaster) *Orchestrator {
	return &Orchestrator{
		Store:               store,
		Executor:            exec,
		Broadcast:           broadcast,
		MaxPingPongTurns:    3,
		pingPongByWorkspace: map[string]int{},
	}
}

func (o *Orchestrator) emit(event string, payload interface{}) {
	if o.Broadcast != nil {
		o.Broadcast(event, payload)
	}
}

func (o *Orchestrator) notifyMember(m *Member) {
	if m == nil {
		return
	}
	o.emit(EventMemberUpdated, MemberUpdatedPayload{
		WorkspaceID: m.WorkspaceID,
		Member:      m,
	})
}

// CreateWorkspace creates a workspace and optional root member.
func (o *Orchestrator) CreateWorkspace(label, agentID string, rootLabel string) (*Workspace, *Member, error) {
	if o.Store == nil {
		return nil, nil, fmt.Errorf("swarm store not configured")
	}
	if label == "" {
		label = "Swarm Workspace"
	}
	ws, err := o.Store.CreateWorkspace(label, agentID)
	if err != nil {
		return nil, nil, err
	}
	root, err := o.AddMember(AddMemberOpts{
		WorkspaceID: ws.ID,
		AgentID:     ws.AgentID,
		Label:       rootLabel,
		SpawnedBy:   "user",
	})
	if err != nil {
		return ws, nil, err
	}
	ws.RootKey = root.SessionKey
	return ws, root, nil
}

// AddMember adds a member to a workspace.
func (o *Orchestrator) AddMember(opts AddMemberOpts) (*Member, error) {
	if o.Store == nil {
		return nil, fmt.Errorf("swarm store not configured")
	}
	ws, ok := o.Store.GetWorkspace(opts.WorkspaceID)
	if !ok {
		return nil, fmt.Errorf("workspace not found: %s", opts.WorkspaceID)
	}
	m := NewMemberFromOpts(ws, opts)
	if err := o.Store.AddMember(m); err != nil {
		return nil, err
	}
	o.notifyMember(m)
	return m, nil
}

// SpawnSubagent creates a child member under parentID.
func (o *Orchestrator) SpawnSubagent(workspaceID, parentID, agentID, employeeID, subagentType, label, instruction string) (*Member, error) {
	if o.Store == nil {
		return nil, fmt.Errorf("swarm store not configured")
	}
	ws, ok := o.Store.GetWorkspace(workspaceID)
	if !ok {
		return nil, fmt.Errorf("workspace not found: %s", workspaceID)
	}
	child := NewMemberFromOpts(ws, AddMemberOpts{
		WorkspaceID:  workspaceID,
		ParentID:     parentID,
		AgentID:      agentID,
		EmployeeID:   employeeID,
		SubagentType: subagentType,
		Label:        label,
		SpawnedBy:    parentID,
	})
	if reason, err := o.Store.AddMemberIfSpawnAllowed(child); err != nil {
		return nil, err
	} else if reason != nil {
		return nil, reason
	}
	o.notifyMember(child)
	if strings.TrimSpace(instruction) != "" {
		_, _ = o.SendMessage(context.Background(), workspaceID, child.ID, instruction)
	}
	return child, nil
}

// SendMessage runs an agent turn for the given member.
func (o *Orchestrator) SendMessage(ctx context.Context, workspaceID, memberID, text string) (taskID string, err error) {
	if o.Store == nil || o.Executor == nil {
		return "", fmt.Errorf("swarm orchestrator not fully configured")
	}
	m, ok := o.Store.GetMember(memberID)
	if !ok || m.WorkspaceID != workspaceID {
		return "", fmt.Errorf("member not found")
	}
	text = strings.TrimSpace(text)
	if text == "" {
		return "", fmt.Errorf("message is empty")
	}

	o.Store.AppendHistory(HistoryEntry{
		WorkspaceID: workspaceID,
		MemberID:    memberID,
		MemberLabel: m.Label,
		Role:        "user",
		Text:        text,
	})

	agentID := m.AgentID
	if agentID == "" {
		agentID = "main"
	}

	busy, _ := o.Store.UpdateMemberStatus(memberID, MemberStatusBusy, "")
	o.notifyMember(busy)

	var activeTaskID string
	rec, err := o.Executor.StartTask(
		ctx,
		agentID,
		m.SessionKey,
		memberID,
		workspaceID,
		text,
		func(deltaType string, data map[string]interface{}) {
			o.emit(EventTaskDelta, TaskDeltaPayload{
				WorkspaceID: workspaceID,
				MemberID:    memberID,
				TaskID:      activeTaskID,
				SessionKey:  m.SessionKey,
				Stream:      deltaType,
				Data:        data,
			})
		},
		func(doneRec *task.Record, output string, runErr error) {
			if runErr != nil && errors.Is(runErr, context.Canceled) {
				idle, _ := o.Store.UpdateMemberStatus(memberID, MemberStatusIdle, "")
				o.notifyMember(idle)
			} else if runErr != nil {
				fail, _ := o.Store.UpdateMemberStatus(memberID, MemberStatusFailed, "")
				o.notifyMember(fail)
			} else {
				idle, _ := o.Store.UpdateMemberStatus(memberID, MemberStatusIdle, "")
				o.notifyMember(idle)
			}
			if output != "" && (runErr == nil || !errors.Is(runErr, context.Canceled)) {
				o.Store.AppendHistory(HistoryEntry{
					WorkspaceID: workspaceID,
					MemberID:    memberID,
					MemberLabel: m.Label,
					Role:        "assistant",
					Text:        output,
					TaskID:      string(doneRec.Task.ID),
				})
			}
			errStr := ""
			if runErr != nil {
				errStr = runErr.Error()
			}
			o.emit(EventTaskFinal, TaskFinalPayload{
				WorkspaceID: workspaceID,
				MemberID:    memberID,
				TaskID:      string(doneRec.Task.ID),
				SessionKey:  m.SessionKey,
				Output:      output,
				Error:       errStr,
			})
		},
	)
	if err != nil {
		fail, _ := o.Store.UpdateMemberStatus(memberID, MemberStatusFailed, "")
		o.notifyMember(fail)
		return "", err
	}
	activeTaskID = string(rec.Task.ID)
	updated, _ := o.Store.UpdateMemberStatus(memberID, MemberStatusBusy, activeTaskID)
	o.notifyMember(updated)
	return activeTaskID, nil
}

// GetGraph returns the topology graph for a workspace.
func (o *Orchestrator) GetGraph(workspaceID string) Graph {
	members := o.Store.ListMembers(workspaceID)
	return BuildGraph(workspaceID, members, true)
}

// GetHistory returns aggregated timeline entries.
func (o *Orchestrator) GetHistory(workspaceID string, limit int) []HistoryEntry {
	return o.Store.ListHistory(workspaceID, limit)
}

// RemoveMember removes a member from the workspace.
func (o *Orchestrator) RemoveMember(memberID string, cascade bool) error {
	return o.Store.RemoveMember(memberID, cascade)
}

// StopAll cancels active runs and clears busy status for all members in a workspace.
func (o *Orchestrator) StopAll(workspaceID string) (int, error) {
	if o.Store == nil {
		return 0, fmt.Errorf("swarm store not configured")
	}
	workspaceID = strings.TrimSpace(workspaceID)
	if workspaceID == "" {
		return 0, fmt.Errorf("workspaceId required")
	}
	stopped := 0
	if o.Executor != nil {
		stopped += o.Executor.CancelWorkspace(workspaceID)
	}
	for _, m := range o.Store.ListMembers(workspaceID) {
		if m.Status != MemberStatusBusy {
			continue
		}
		idle, _ := o.Store.UpdateMemberStatus(m.ID, MemberStatusIdle, "")
		o.notifyMember(idle)
		stopped++
	}
	return stopped, nil
}

// DeleteWorkspace removes a workspace and all its members/history.
func (o *Orchestrator) DeleteWorkspace(workspaceID string) error {
	if o.Store == nil {
		return fmt.Errorf("swarm store not configured")
	}
	workspaceID = strings.TrimSpace(workspaceID)
	if workspaceID == "" {
		return fmt.Errorf("workspaceId required")
	}
	return o.Store.DeleteWorkspace(workspaceID)
}

// ListWorkspaces returns all workspaces.
func (o *Orchestrator) ListWorkspaces() []*Workspace {
	return o.Store.ListWorkspaces()
}

// ListMembers returns members for a workspace.
func (o *Orchestrator) ListMembers(workspaceID string) []*Member {
	return o.Store.ListMembers(workspaceID)
}

// GetMember returns a single member.
func (o *Orchestrator) GetMember(memberID string) (*Member, bool) {
	return o.Store.GetMember(memberID)
}
