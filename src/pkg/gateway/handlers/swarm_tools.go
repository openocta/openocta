package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/openocta/openocta/pkg/gateway/swarmsvc"
	"github.com/openocta/openocta/pkg/swarm"
	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
)

// SwarmMemberCreateTool creates a child swarm member.
type SwarmMemberCreateTool struct{}

func (SwarmMemberCreateTool) Name() string { return "swarm_member_create" }

func (SwarmMemberCreateTool) Description() string {
	return "Create exactly one direct child under parentId (use your memberId). Call once per child — do NOT use sessions_spawn for the same child. When the task specifies a number N, stop after N successful calls and check directChildren in the response. Hard caps: 5 direct children per member, 10 tree layers, 55 members per room."
}

func (SwarmMemberCreateTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"workspaceId":  map[string]interface{}{"type": "string"},
			"parentId":     map[string]interface{}{"type": "string"},
			"agentId":      map[string]interface{}{"type": "string"},
			"employeeId":   map[string]interface{}{"type": "string"},
			"subagentType": map[string]interface{}{"type": "string"},
			"label":        map[string]interface{}{"type": "string"},
			"instruction":  map[string]interface{}{"type": "string"},
		},
		Required: []string{"workspaceId", "parentId"},
	}
}

func (SwarmMemberCreateTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	orch := swarmsvc.Orch()
	if orch == nil {
		return &tool.ToolResult{Success: false, Output: "swarm not initialized"}, nil
	}
	wsID, _ := params["workspaceId"].(string)
	parentID, _ := params["parentId"].(string)
	agentID, _ := params["agentId"].(string)
	employeeID, _ := params["employeeId"].(string)
	subagentType, _ := params["subagentType"].(string)
	label, _ := params["label"].(string)
	instruction, _ := params["instruction"].(string)
	parentID = strings.TrimSpace(parentID)
	m, err := orch.SpawnSubagent(strings.TrimSpace(wsID), parentID,
		strings.TrimSpace(agentID), strings.TrimSpace(employeeID),
		strings.TrimSpace(subagentType), strings.TrimSpace(label), strings.TrimSpace(instruction))
	if err != nil {
		return &tool.ToolResult{Success: false, Output: err.Error()}, nil
	}
	directChildren := 0
	if orch.Store != nil {
		directChildren = orch.Store.CountDirectChildren(parentID)
	}
	out, _ := json.Marshal(map[string]interface{}{
		"member":              m,
		"directChildren":      directChildren,
		"directChildrenLimit": swarm.MaxDirectChildrenPerMember,
		"hint":                "Each call creates one child. If the task asks for N children, stop when directChildren reaches N.",
	})
	return &tool.ToolResult{Success: true, Output: string(out)}, nil
}

// SwarmMessageSendTool sends a message to a swarm member.
type SwarmMessageSendTool struct{}

func (SwarmMessageSendTool) Name() string { return "swarm_message_send" }

func (SwarmMessageSendTool) Description() string {
	return "Send a message to a swarm member and start an agent run."
}

func (SwarmMessageSendTool) Schema() *tool.JSONSchema {
	return &tool.JSONSchema{
		Type: "object",
		Properties: map[string]interface{}{
			"workspaceId": map[string]interface{}{"type": "string"},
			"memberId":    map[string]interface{}{"type": "string"},
			"text":        map[string]interface{}{"type": "string"},
		},
		Required: []string{"workspaceId", "memberId", "text"},
	}
}

func (SwarmMessageSendTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	orch := swarmsvc.Orch()
	if orch == nil {
		return &tool.ToolResult{Success: false, Output: "swarm not initialized"}, nil
	}
	wsID, _ := params["workspaceId"].(string)
	memberID, _ := params["memberId"].(string)
	text, _ := params["text"].(string)
	taskID, err := orch.SendMessage(ctx, strings.TrimSpace(wsID), strings.TrimSpace(memberID), text)
	if err != nil {
		return &tool.ToolResult{Success: false, Output: err.Error()}, nil
	}
	return &tool.ToolResult{Success: true, Output: fmt.Sprintf(`{"taskId":%q,"status":"started"}`, taskID)}, nil
}

// SessionsSpawnTool spawns a sub-agent as a swarm member.
type SessionsSpawnTool struct{}

func (SessionsSpawnTool) Name() string { return "sessions_spawn" }

func (SessionsSpawnTool) Description() string {
	return "Spawn a sub-agent as a new swarm member under a parent member."
}

func (SessionsSpawnTool) Schema() *tool.JSONSchema {
	return SwarmMemberCreateTool{}.Schema()
}

func (SessionsSpawnTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	return SwarmMemberCreateTool{}.Execute(ctx, params)
}

// SwarmTools returns swarm tools for a member (spawn tools only when canSpawn is true).
func SwarmTools(canSpawn bool) []tool.Tool {
	out := []tool.Tool{SwarmMessageSendTool{}}
	if canSpawn {
		// Only swarm_member_create — sessions_spawn is an alias and caused duplicate spawns when both were called.
		out = append(out, SwarmMemberCreateTool{})
	}
	return out
}
