// Package task provides in-memory A2A task tracking for swarm runs.
package task

import (
	"sync"
	"time"

	"github.com/a2aproject/a2a-go/v2/a2a"
	"github.com/google/uuid"
)

// Record tracks a single task execution.
type Record struct {
	Task        *a2a.Task
	SessionKey  string
	MemberID    string
	WorkspaceID string
	CreatedAt   int64
	UpdatedAt   int64
}

// Store is a thread-safe in-memory task store.
type Store struct {
	mu    sync.RWMutex
	tasks map[a2a.TaskID]*Record
}

// NewStore creates an empty task store.
func NewStore() *Store {
	return &Store{tasks: map[a2a.TaskID]*Record{}}
}

// CreateSubmitted registers a new submitted task.
func (s *Store) CreateSubmitted(sessionKey, memberID, workspaceID, contextID string, userText string) *Record {
	s.mu.Lock()
	defer s.mu.Unlock()
	id := a2a.TaskID(uuid.New().String())
	if contextID == "" {
		contextID = a2a.NewContextID()
	}
	msg := a2a.NewMessage(a2a.MessageRoleUser, a2a.NewTextPart(userText))
	task := &a2a.Task{
		ID:        id,
		ContextID: contextID,
		History:   []*a2a.Message{msg},
		Status: a2a.TaskStatus{
			State: a2a.TaskStateSubmitted,
		},
	}
	now := time.Now().UnixMilli()
	rec := &Record{
		Task:        task,
		SessionKey:  sessionKey,
		MemberID:    memberID,
		WorkspaceID: workspaceID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.tasks[id] = rec
	return rec
}

// Get returns a task record by ID.
func (s *Store) Get(id a2a.TaskID) (*Record, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	rec, ok := s.tasks[id]
	return rec, ok
}

// SetState updates task state and optional message.
func (s *Store) SetState(id a2a.TaskID, state a2a.TaskState, message string) (*Record, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	rec, ok := s.tasks[id]
	if !ok {
		return nil, false
	}
	rec.Task.Status.State = state
	if message != "" {
		rec.Task.Status.Message = a2a.NewMessage(a2a.MessageRoleAgent, a2a.NewTextPart(message))
	}
	rec.UpdatedAt = time.Now().UnixMilli()
	return rec, true
}

// AppendAgentMessage appends an agent message to task history.
func (s *Store) AppendAgentMessage(id a2a.TaskID, text string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	rec, ok := s.tasks[id]
	if !ok || text == "" {
		return
	}
	rec.Task.History = append(rec.Task.History, a2a.NewMessage(a2a.MessageRoleAgent, a2a.NewTextPart(text)))
	rec.UpdatedAt = time.Now().UnixMilli()
}

// ListByWorkspace returns tasks for a workspace.
func (s *Store) ListByWorkspace(workspaceID string) []*Record {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*Record, 0)
	for _, rec := range s.tasks {
		if rec.WorkspaceID == workspaceID {
			out = append(out, rec)
		}
	}
	return out
}
