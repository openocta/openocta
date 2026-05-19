package handlers

import (
	"context"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/gateway/swarmsvc"
	"github.com/openocta/openocta/pkg/swarm"
)

// IsAgentToAgentEnabled returns whether tools.agentToAgent.enabled is true.
func IsAgentToAgentEnabled(cfg *config.OpenOctaConfig) bool {
	if cfg == nil || cfg.Tools == nil || cfg.Tools.AgentToAgent == nil || cfg.Tools.AgentToAgent.Enabled == nil {
		return false
	}
	return *cfg.Tools.AgentToAgent.Enabled
}

func swarmOrch(opts HandlerOpts) *swarm.Orchestrator {
	_ = opts
	return swarmsvc.Orch()
}

// SwarmWorkspacesListHandler handles swarm.workspaces.list.
func SwarmWorkspacesListHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"workspaces": orch.ListWorkspaces()}, nil, nil)
	return nil
}

// SwarmWorkspacesCreateHandler handles swarm.workspaces.create.
func SwarmWorkspacesCreateHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	label, _ := opts.Params["label"].(string)
	agentID, _ := opts.Params["agentId"].(string)
	rootLabel, _ := opts.Params["rootLabel"].(string)
	ws, root, err := orch.CreateWorkspace(label, agentID, rootLabel)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"workspace": ws, "rootMember": root}, nil, nil)
	return nil
}

// SwarmWorkspacesAbortAllHandler handles swarm.workspaces.abortAll.
func SwarmWorkspacesAbortAllHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	wsID, _ := opts.Params["workspaceId"].(string)
	wsID = strings.TrimSpace(wsID)
	if wsID == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "workspaceId required"}, nil)
		return nil
	}
	stopped, err := orch.StopAll(wsID)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true, "stopped": stopped}, nil, nil)
	return nil
}

// SwarmWorkspacesDeleteHandler handles swarm.workspaces.delete.
func SwarmWorkspacesDeleteHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	wsID, _ := opts.Params["workspaceId"].(string)
	wsID = strings.TrimSpace(wsID)
	if wsID == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "workspaceId required"}, nil)
		return nil
	}
	ws, _ := orch.Store.GetWorkspace(wsID)
	members := orch.ListMembers(wsID)
	sessionKeys := make([]string, 0, len(members)+1)
	if ws != nil && strings.TrimSpace(ws.RootKey) != "" {
		sessionKeys = append(sessionKeys, ws.RootKey)
	}
	for _, m := range members {
		if m != nil && strings.TrimSpace(m.SessionKey) != "" {
			sessionKeys = append(sessionKeys, m.SessionKey)
		}
	}
	_, _ = orch.StopAll(wsID)
	if err := DeleteSessionsForSwarmWorkspace(wsID, sessionKeys, opts.Context); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: "delete swarm sessions: " + err.Error()}, nil)
		return nil
	}
	if err := orch.DeleteWorkspace(wsID); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// SwarmMembersListHandler handles swarm.members.list.
func SwarmMembersListHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	wsID, _ := opts.Params["workspaceId"].(string)
	wsID = strings.TrimSpace(wsID)
	if wsID == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "workspaceId required"}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"members": orch.ListMembers(wsID)}, nil, nil)
	return nil
}

// SwarmMembersAddHandler handles swarm.members.add.
func SwarmMembersAddHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	wsID, _ := opts.Params["workspaceId"].(string)
	parentID, _ := opts.Params["parentId"].(string)
	agentID, _ := opts.Params["agentId"].(string)
	employeeID, _ := opts.Params["employeeId"].(string)
	subagentType, _ := opts.Params["subagentType"].(string)
	label, _ := opts.Params["label"].(string)
	m, err := orch.AddMember(swarm.AddMemberOpts{
		WorkspaceID:  strings.TrimSpace(wsID),
		ParentID:     strings.TrimSpace(parentID),
		AgentID:      strings.TrimSpace(agentID),
		EmployeeID:   strings.TrimSpace(employeeID),
		SubagentType: strings.TrimSpace(subagentType),
		Label:        strings.TrimSpace(label),
		SpawnedBy:    "user",
	})
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	ensureSwarmSessionEntry(opts.Context, m.SessionKey, m.EmployeeID, m.SpawnedBy)
	opts.Respond(true, map[string]interface{}{"member": m}, nil, nil)
	return nil
}

// SwarmMembersRemoveHandler handles swarm.members.remove.
func SwarmMembersRemoveHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	memberID, _ := opts.Params["memberId"].(string)
	cascade, _ := opts.Params["cascade"].(bool)
	if err := orch.RemoveMember(strings.TrimSpace(memberID), cascade); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// SwarmMessageSendHandler handles swarm.message.send.
func SwarmMessageSendHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	wsID, _ := opts.Params["workspaceId"].(string)
	memberID, _ := opts.Params["memberId"].(string)
	text, _ := opts.Params["text"].(string)
	taskID, err := orch.SendMessage(context.Background(), strings.TrimSpace(wsID), strings.TrimSpace(memberID), text)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"taskId": taskID, "status": "started"}, nil, nil)
	return nil
}

// SwarmGraphGetHandler handles swarm.graph.get.
func SwarmGraphGetHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	wsID, _ := opts.Params["workspaceId"].(string)
	g := orch.GetGraph(strings.TrimSpace(wsID))
	opts.Respond(true, g, nil, nil)
	return nil
}

// SwarmHistoryGetHandler handles swarm.history.get.
func SwarmHistoryGetHandler(opts HandlerOpts) error {
	orch := swarmOrch(opts)
	if orch == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeServiceUnavailable, Message: "swarm not initialized"}, nil)
		return nil
	}
	wsID, _ := opts.Params["workspaceId"].(string)
	limit := 100
	if v, ok := opts.Params["limit"].(float64); ok && v > 0 {
		limit = int(v)
	}
	history := orch.GetHistory(strings.TrimSpace(wsID), limit)
	opts.Respond(true, map[string]interface{}{"history": history}, nil, nil)
	return nil
}
