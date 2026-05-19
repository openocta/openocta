// Package executor runs A2A tasks against the OpenOcta agent runtime.
package executor

import (
	"context"
	"errors"
	"sync"

	"github.com/a2aproject/a2a-go/v2/a2a"
	"github.com/openocta/openocta/pkg/a2a/task"
)

// StreamCallback receives incremental task output for UI broadcast.
type StreamCallback func(deltaType string, data map[string]interface{})

// Runner executes an agent turn for a session key.
type Runner interface {
	Run(ctx context.Context, agentID, sessionKey, message string, onDelta StreamCallback) (output string, err error)
}

type activeRun struct {
	cancel      context.CancelFunc
	taskID      a2a.TaskID
	memberID    string
	workspaceID string
	sessionKey  string
}

// RuntimeExecutor bridges task store and agent Runner.
type RuntimeExecutor struct {
	Tasks  *task.Store
	Runner Runner
	active sync.Map // taskID string -> *activeRun
}

// StartTask creates a task record and runs the agent asynchronously.
// onDelta and onDone are invoked from the run goroutine.
func (e *RuntimeExecutor) StartTask(
	ctx context.Context,
	agentID, sessionKey, memberID, workspaceID, message string,
	onDelta StreamCallback,
	onDone func(rec *task.Record, output string, err error),
) (*task.Record, error) {
	if e.Tasks == nil {
		e.Tasks = task.NewStore()
	}
	rec := e.Tasks.CreateSubmitted(sessionKey, memberID, workspaceID, "", message)
	_, _ = e.Tasks.SetState(rec.Task.ID, a2a.TaskStateWorking, "running")

	parent := ctx
	if parent == nil {
		parent = context.Background()
	}
	runCtx, cancel := context.WithCancel(parent)

	ar := &activeRun{
		cancel:      cancel,
		taskID:      rec.Task.ID,
		memberID:    memberID,
		workspaceID: workspaceID,
		sessionKey:  sessionKey,
	}
	e.active.Store(string(rec.Task.ID), ar)

	go func() {
		defer e.active.Delete(string(rec.Task.ID))
		defer cancel()
		output, err := e.Runner.Run(runCtx, agentID, sessionKey, message, onDelta)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				_, _ = e.Tasks.SetState(rec.Task.ID, a2a.TaskStateCanceled, "canceled")
			} else {
				_, _ = e.Tasks.SetState(rec.Task.ID, a2a.TaskStateFailed, err.Error())
			}
			if onDone != nil {
				onDone(rec, output, err)
			}
			return
		}
		if output != "" {
			e.Tasks.AppendAgentMessage(rec.Task.ID, output)
		}
		_, _ = e.Tasks.SetState(rec.Task.ID, a2a.TaskStateCompleted, "")
		if onDone != nil {
			onDone(rec, output, nil)
		}
	}()

	return rec, nil
}

// CancelTask cancels a running task by ID.
func (e *RuntimeExecutor) CancelTask(id a2a.TaskID) bool {
	v, ok := e.active.Load(string(id))
	if !ok {
		return false
	}
	v.(*activeRun).cancel()
	return true
}

// CancelWorkspace cancels all active runs in a workspace.
func (e *RuntimeExecutor) CancelWorkspace(workspaceID string) int {
	n := 0
	e.active.Range(func(_key, value interface{}) bool {
		ar := value.(*activeRun)
		if ar.workspaceID == workspaceID {
			ar.cancel()
			n++
		}
		return true
	})
	return n
}

// GetTask returns the A2A task by ID.
func (e *RuntimeExecutor) GetTask(id a2a.TaskID) (*a2a.Task, bool) {
	if e.Tasks == nil {
		return nil, false
	}
	rec, ok := e.Tasks.Get(id)
	if !ok {
		return nil, false
	}
	return rec.Task, true
}
