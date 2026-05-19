package swarm

import (
	"fmt"
	"strings"
)

// SwarmPromptOpts configures the swarm system prompt overlay.
type SwarmPromptOpts struct {
	WorkspaceID    string
	MemberID       string
	Depth          int
	DirectChildren int
	CanSpawn       bool
	ProjectRoot    string
}

// BuildSwarmSystemPrompt returns instructions for swarm members (policy + runtime context).
func BuildSwarmSystemPrompt(opts SwarmPromptOpts) string {
	workspaceID := strings.TrimSpace(opts.WorkspaceID)
	memberID := strings.TrimSpace(opts.MemberID)
	if workspaceID == "" || memberID == "" {
		return ""
	}

	var b strings.Builder
	if policy := LoadSwarmPolicyMarkdown(opts.ProjectRoot); policy != "" {
		b.WriteString(policy)
		b.WriteString("\n\n---\n\n")
	}

	b.WriteString("## 当前蜂群上下文\n\n")
	b.WriteString(fmt.Sprintf("- workspaceId: `%s`\n", workspaceID))
	b.WriteString(fmt.Sprintf("- your memberId: `%s`\n", memberID))
	b.WriteString(fmt.Sprintf("- parentId when spawning (if allowed): `%s`\n", memberID))
	b.WriteString(fmt.Sprintf("- tree depth: %d (layer %d of %d max)\n", opts.Depth, opts.Depth+1, MaxTreeDepth))
	b.WriteString(fmt.Sprintf("- your direct sub-agents: %d / %d\n", opts.DirectChildren, MaxDirectChildrenPerMember))

	if opts.CanSpawn {
		b.WriteString(fmt.Sprintf(
			"\nYou **may** call `swarm_member_create` only (one call = one child; never use `sessions_spawn` for the same child).\n",
		))
		b.WriteString(fmt.Sprintf("Hard caps: %d direct children per member, %d tree layers, %d members per room.\n", MaxDirectChildrenPerMember, MaxTreeDepth, MaxMembersPerWorkspace))
		b.WriteString("If the task or message specifies a number **N**, create **exactly N** direct children, then stop — read `directChildren` in each tool response.\n")
	} else {
		b.WriteString(fmt.Sprintf(
			"\nYou **cannot** spawn right now (at depth/layer limit %d, room member cap %d, or direct-child cap %d). Complete work with existing members or yourself.\n",
			MaxTreeDepth, MaxMembersPerWorkspace, MaxDirectChildrenPerMember,
		))
		b.WriteString("Use `swarm_message_send` to coordinate with other members.\n")
	}

	return strings.TrimSpace(b.String())
}
