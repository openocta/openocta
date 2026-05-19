package swarm

import "testing"

func TestBuildSwarmSystemPrompt(t *testing.T) {
	p := BuildSwarmSystemPrompt(SwarmPromptOpts{
		WorkspaceID:    "ws-1",
		MemberID:       "mem-root",
		Depth:          0,
		DirectChildren: 1,
		CanSpawn:       true,
	})
	if p == "" {
		t.Fatal("expected non-empty prompt")
	}
	if !contains(p, "ws-1") || !contains(p, "mem-root") {
		t.Fatalf("prompt missing context: %s", p)
	}
	if !contains(p, "swarm_member_create") {
		t.Fatal("prompt should mention swarm_member_create for coordinator")
	}
	if !contains(p, "SWARM.md") && !contains(p, "蜂群协调规则") {
		t.Fatal("prompt should include swarm policy")
	}
}

func TestBuildSwarmSystemPromptAtLimit(t *testing.T) {
	p := BuildSwarmSystemPrompt(SwarmPromptOpts{
		WorkspaceID: "ws-1",
		MemberID:    "child-1",
		Depth:       9,
		CanSpawn:    false,
	})
	if contains(p, "You **may** call") {
		t.Fatal("member at depth limit should not be told it may spawn")
	}
	if !contains(p, "cannot") {
		t.Fatal("prompt should explain spawn is blocked at limit")
	}
}

func TestBuildSwarmSystemPromptNestedSpawner(t *testing.T) {
	p := BuildSwarmSystemPrompt(SwarmPromptOpts{
		WorkspaceID: "ws-1",
		MemberID:    "child-1",
		Depth:       2,
		CanSpawn:    true,
	})
	if !contains(p, "You **may** call") {
		t.Fatal("nested member should be allowed to spawn when under limits")
	}
}

func TestBuildSwarmSystemPromptEmpty(t *testing.T) {
	if BuildSwarmSystemPrompt(SwarmPromptOpts{WorkspaceID: "", MemberID: "x"}) != "" {
		t.Fatal("expected empty for missing workspace")
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || indexOf(s, sub) >= 0)
}

func indexOf(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
