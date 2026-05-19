package swarm

import (
	"fmt"
	"strings"
)

// BuildMemberSessionKey returns a session key for a swarm member.
// When employeeID is set: agent:<agentId>:employee:<employeeId>:swarm:<workspaceId>:<memberId>
// Otherwise: agent:<agentId>:swarm:<workspaceId>:<memberId>
func BuildMemberSessionKey(agentID, workspaceID, memberID, employeeID string) string {
	agentID = strings.TrimSpace(agentID)
	workspaceID = strings.TrimSpace(workspaceID)
	memberID = strings.TrimSpace(memberID)
	employeeID = strings.TrimSpace(employeeID)
	if agentID == "" {
		agentID = "main"
	}
	if employeeID != "" {
		return fmt.Sprintf("agent:%s:employee:%s:swarm:%s:%s", agentID, employeeID, workspaceID, memberID)
	}
	return fmt.Sprintf("agent:%s:swarm:%s:%s", agentID, workspaceID, memberID)
}

// ParseMemberSessionKey extracts agentId, workspaceId, memberId from a swarm session key.
func ParseMemberSessionKey(sessionKey string) (agentID, workspaceID, memberID string, ok bool) {
	key := strings.TrimSpace(strings.ToLower(sessionKey))
	parts := strings.Split(key, ":")
	if len(parts) < 5 || parts[0] != "agent" {
		return "", "", "", false
	}
	agentID = parts[1]
	// agent:<id>:swarm:<ws>:<member>
	if parts[2] == "swarm" && len(parts) >= 5 {
		return agentID, parts[3], strings.Join(parts[4:], ":"), true
	}
	// agent:<id>:employee:<emp>:swarm:<ws>:<member>
	if len(parts) >= 7 && parts[2] == "employee" && parts[4] == "swarm" {
		return agentID, parts[5], strings.Join(parts[6:], ":"), true
	}
	return "", "", "", false
}

// IsSwarmSessionKey reports whether key uses the swarm session format.
func IsSwarmSessionKey(sessionKey string) bool {
	_, _, _, ok := ParseMemberSessionKey(sessionKey)
	return ok
}
