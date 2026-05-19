package swarm

// Spawn limits (enforced in tools + orchestrator).
const (
	// MaxTreeDepth is the maximum number of layers in the member tree (root = layer 1).
	MaxTreeDepth = 10
	// MaxSpawnDepth is the maximum parent depth index that may still call spawn (child would be at depth+1).
	MaxSpawnDepth              = MaxTreeDepth - 2
	MaxDirectChildrenPerMember = 5
	MaxMembersPerWorkspace     = 55
)

// SpawnRejectReason describes why spawn was denied.
type SpawnRejectReason struct {
	Code    string
	Message string
}

func (r SpawnRejectReason) Error() string {
	if r.Message != "" {
		return r.Message
	}
	return r.Code
}

// CanMemberSpawn returns whether parentID may create another child in workspaceID.
func CanMemberSpawn(store *Store, workspaceID, parentID string) (ok bool, reason *SpawnRejectReason) {
	if store == nil {
		return false, &SpawnRejectReason{Code: "no_store", Message: "swarm store not available"}
	}
	reason = store.spawnRejectReason(workspaceID, parentID)
	return reason == nil, reason
}
