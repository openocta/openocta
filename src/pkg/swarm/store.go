package swarm

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/openocta/openocta/pkg/paths"
)

// Store persists workspaces and members.
type Store struct {
	mu      sync.RWMutex
	path    string
	state   PersistedState
	maxHist int
}

// NewStore loads or creates a swarm store at the default state path.
func NewStore(env func(string) string) (*Store, error) {
	if env == nil {
		env = os.Getenv
	}
	dir := filepath.Join(paths.ResolveStateDir(env), "swarm")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}
	s := &Store{
		path:    filepath.Join(dir, "workspaces.json"),
		maxHist: 500,
		state: PersistedState{
			Workspaces: map[string]*Workspace{},
			Members:    map[string]*Member{},
		},
	}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) load() error {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	var st PersistedState
	if err := json.Unmarshal(data, &st); err != nil {
		return err
	}
	if st.Workspaces == nil {
		st.Workspaces = map[string]*Workspace{}
	}
	if st.Members == nil {
		st.Members = map[string]*Member{}
	}
	s.state = st
	return nil
}

func (s *Store) save() error {
	data, err := json.MarshalIndent(s.state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, data, 0644)
}

// ListWorkspaces returns all workspaces sorted by updatedAt desc.
func (s *Store) ListWorkspaces() []*Workspace {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*Workspace, 0, len(s.state.Workspaces))
	for _, w := range s.state.Workspaces {
		out = append(out, w)
	}
	return out
}

// GetWorkspace returns a workspace by ID.
func (s *Store) GetWorkspace(id string) (*Workspace, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	w, ok := s.state.Workspaces[id]
	return w, ok
}

// CreateWorkspace inserts a new workspace.
func (s *Store) CreateWorkspace(label, agentID string) (*Workspace, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UnixMilli()
	id := uuid.New().String()
	if agentID == "" {
		agentID = "main"
	}
	w := &Workspace{
		ID:        id,
		Label:     label,
		AgentID:   agentID,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.state.Workspaces[id] = w
	if err := s.save(); err != nil {
		return nil, err
	}
	return w, nil
}

// MemberDepth returns 0 for root (no parent), 1 for direct child, etc.
func (s *Store) MemberDepth(memberID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.memberDepthLocked(memberID)
}

func (s *Store) memberDepthLocked(memberID string) int {
	depth := 0
	visited := map[string]bool{}
	for {
		if visited[memberID] {
			break
		}
		visited[memberID] = true
		m, ok := s.state.Members[memberID]
		if !ok {
			break
		}
		pid := strings.TrimSpace(m.ParentID)
		if pid == "" {
			break
		}
		depth++
		memberID = pid
	}
	return depth
}

// CountDirectChildren counts members whose parentId equals parentID.
func (s *Store) CountDirectChildren(parentID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.countDirectChildrenLocked(parentID)
}

func (s *Store) countDirectChildrenLocked(parentID string) int {
	n := 0
	for _, m := range s.state.Members {
		if m.ParentID == parentID {
			n++
		}
	}
	return n
}

// CountWorkspaceMembers counts all members in a workspace.
func (s *Store) CountWorkspaceMembers(workspaceID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.countWorkspaceMembersLocked(workspaceID)
}

func (s *Store) countWorkspaceMembersLocked(workspaceID string) int {
	n := 0
	for _, m := range s.state.Members {
		if m.WorkspaceID == workspaceID {
			n++
		}
	}
	return n
}

// spawnRejectReason checks spawn quotas under read lock.
func (s *Store) spawnRejectReason(workspaceID, parentID string) *SpawnRejectReason {
	parentID = strings.TrimSpace(parentID)
	workspaceID = strings.TrimSpace(workspaceID)
	if workspaceID == "" || parentID == "" {
		return &SpawnRejectReason{Code: "invalid_args", Message: "workspaceId and parentId required"}
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	parent, ok := s.state.Members[parentID]
	if !ok || parent.WorkspaceID != workspaceID {
		return &SpawnRejectReason{Code: "parent_not_found", Message: "parent member not found"}
	}
	depth := s.memberDepthLocked(parentID)
	if depth > MaxSpawnDepth {
		return &SpawnRejectReason{
			Code: "depth_exceeded",
			Message: fmt.Sprintf(
				"tree depth limit reached (your depth=%d, max %d layers; cannot add another child)",
				depth+1, MaxTreeDepth,
			),
		}
	}
	if s.countDirectChildrenLocked(parentID) >= MaxDirectChildrenPerMember {
		return &SpawnRejectReason{
			Code:    "children_limit",
			Message: fmt.Sprintf("parent already has the maximum number of direct sub-agents (%d)", MaxDirectChildrenPerMember),
		}
	}
	if s.countWorkspaceMembersLocked(workspaceID) >= MaxMembersPerWorkspace {
		return &SpawnRejectReason{
			Code:    "workspace_member_limit",
			Message: fmt.Sprintf("workspace member limit reached (%d)", MaxMembersPerWorkspace),
		}
	}
	return nil
}

// AddMemberIfSpawnAllowed checks quotas and inserts the member atomically (avoids parallel over-spawn).
func (s *Store) AddMemberIfSpawnAllowed(m *Member) (*SpawnRejectReason, error) {
	if m == nil {
		return &SpawnRejectReason{Code: "invalid_args", Message: "member required"}, nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	workspaceID := strings.TrimSpace(m.WorkspaceID)
	parentID := strings.TrimSpace(m.ParentID)
	if workspaceID == "" || parentID == "" {
		return &SpawnRejectReason{Code: "invalid_args", Message: "workspaceId and parentId required"}, nil
	}
	parent, ok := s.state.Members[parentID]
	if !ok || parent.WorkspaceID != workspaceID {
		return &SpawnRejectReason{Code: "parent_not_found", Message: "parent member not found"}, nil
	}
	depth := s.memberDepthLocked(parentID)
	if depth > MaxSpawnDepth {
		return &SpawnRejectReason{
			Code: "depth_exceeded",
			Message: fmt.Sprintf(
				"tree depth limit reached (your depth=%d, max %d layers; cannot add another child)",
				depth+1, MaxTreeDepth,
			),
		}, nil
	}
	if s.countDirectChildrenLocked(parentID) >= MaxDirectChildrenPerMember {
		return &SpawnRejectReason{
			Code:    "children_limit",
			Message: fmt.Sprintf("parent already has the maximum number of direct sub-agents (%d)", MaxDirectChildrenPerMember),
		}, nil
	}
	if s.countWorkspaceMembersLocked(workspaceID) >= MaxMembersPerWorkspace {
		return &SpawnRejectReason{
			Code:    "workspace_member_limit",
			Message: fmt.Sprintf("workspace member limit reached (%d)", MaxMembersPerWorkspace),
		}, nil
	}
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	now := time.Now().UnixMilli()
	if m.CreatedAt == 0 {
		m.CreatedAt = now
	}
	m.UpdatedAt = now
	s.state.Members[m.ID] = m
	if w, ok := s.state.Workspaces[m.WorkspaceID]; ok {
		w.UpdatedAt = now
	}
	if err := s.save(); err != nil {
		return nil, err
	}
	return nil, nil
}

// DeleteWorkspace removes a workspace, its members, and related history.
func (s *Store) DeleteWorkspace(workspaceID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.state.Workspaces[workspaceID]; !ok {
		return fmt.Errorf("workspace not found: %s", workspaceID)
	}
	delete(s.state.Workspaces, workspaceID)
	for id, m := range s.state.Members {
		if m.WorkspaceID == workspaceID {
			delete(s.state.Members, id)
		}
	}
	if len(s.state.History) > 0 {
		filtered := make([]HistoryEntry, 0, len(s.state.History))
		for _, h := range s.state.History {
			if h.WorkspaceID != workspaceID {
				filtered = append(filtered, h)
			}
		}
		s.state.History = filtered
	}
	return s.save()
}

// ListMembers returns members for a workspace.
func (s *Store) ListMembers(workspaceID string) []*Member {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*Member, 0)
	for _, m := range s.state.Members {
		if m.WorkspaceID == workspaceID {
			out = append(out, m)
		}
	}
	return out
}

// GetMember returns a member by ID.
func (s *Store) GetMember(id string) (*Member, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	m, ok := s.state.Members[id]
	return m, ok
}

// AddMember inserts a member record.
func (s *Store) AddMember(m *Member) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	now := time.Now().UnixMilli()
	if m.CreatedAt == 0 {
		m.CreatedAt = now
	}
	m.UpdatedAt = now
	s.state.Members[m.ID] = m
	if w, ok := s.state.Workspaces[m.WorkspaceID]; ok {
		w.UpdatedAt = now
	}
	if err := s.save(); err != nil {
		return err
	}
	return nil
}

// UpdateMemberStatus updates status and optional task ID.
func (s *Store) UpdateMemberStatus(id string, status MemberStatus, taskID string) (*Member, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	m, ok := s.state.Members[id]
	if !ok {
		return nil, false
	}
	m.Status = status
	if taskID != "" {
		m.TaskID = taskID
	} else if status == MemberStatusIdle {
		m.TaskID = ""
	}
	m.UpdatedAt = time.Now().UnixMilli()
	_ = s.save()
	return m, true
}

// RemoveMember deletes a member and optionally descendants.
func (s *Store) RemoveMember(id string, cascade bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	toDelete := map[string]bool{id: true}
	if cascade {
		changed := true
		for changed {
			changed = false
			for mid, m := range s.state.Members {
				if toDelete[mid] {
					continue
				}
				if toDelete[m.ParentID] {
					toDelete[mid] = true
					changed = true
				}
			}
		}
	}
	for mid := range toDelete {
		delete(s.state.Members, mid)
	}
	return s.save()
}

// AppendHistory adds a timeline entry.
func (s *Store) AppendHistory(entry HistoryEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if entry.ID == "" {
		entry.ID = uuid.New().String()
	}
	if entry.Timestamp == 0 {
		entry.Timestamp = time.Now().UnixMilli()
	}
	s.state.History = append(s.state.History, entry)
	if s.maxHist > 0 && len(s.state.History) > s.maxHist {
		s.state.History = s.state.History[len(s.state.History)-s.maxHist:]
	}
	_ = s.save()
}

// ListHistory returns history for a workspace (newest last).
func (s *Store) ListHistory(workspaceID string, limit int) []HistoryEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]HistoryEntry, 0)
	for _, h := range s.state.History {
		if h.WorkspaceID == workspaceID {
			out = append(out, h)
		}
	}
	if limit > 0 && len(out) > limit {
		out = out[len(out)-limit:]
	}
	return out
}
