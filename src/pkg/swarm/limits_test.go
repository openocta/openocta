package swarm

import (
	"fmt"
	"testing"
)

func TestCanMemberSpawnDepth(t *testing.T) {
	store := &Store{
		state: PersistedState{
			Workspaces: map[string]*Workspace{"ws": {ID: "ws"}},
			Members: map[string]*Member{
				"root":  {ID: "root", WorkspaceID: "ws", ParentID: ""},
				"child": {ID: "child", WorkspaceID: "ws", ParentID: "root"},
			},
		},
	}
	ok, reason := CanMemberSpawn(store, "ws", "root")
	if !ok || reason != nil {
		t.Fatalf("root should spawn: ok=%v reason=%v", ok, reason)
	}
	ok, reason = CanMemberSpawn(store, "ws", "child")
	if !ok || reason != nil {
		t.Fatalf("child should spawn nested agents: ok=%v reason=%v", ok, reason)
	}
}

func TestCanMemberSpawnMaxDepth(t *testing.T) {
	members := map[string]*Member{
		"root": {ID: "root", WorkspaceID: "ws", ParentID: ""},
	}
	prev := "root"
	for i := 1; i <= 9; i++ {
		id := fmt.Sprintf("m%d", i)
		members[id] = &Member{ID: id, WorkspaceID: "ws", ParentID: prev}
		prev = id
	}
	store := &Store{
		state: PersistedState{
			Workspaces: map[string]*Workspace{"ws": {ID: "ws"}},
			Members:    members,
		},
	}
	ok, _ := CanMemberSpawn(store, "ws", "m8")
	if !ok {
		t.Fatal("member at depth 8 should still spawn (child would be layer 10)")
	}
	ok, reason := CanMemberSpawn(store, "ws", "m9")
	if ok || reason == nil {
		t.Fatalf("member at depth 9 must not spawn: ok=%v reason=%v", ok, reason)
	}
}
