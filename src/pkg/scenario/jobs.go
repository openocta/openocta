package scenario

import (
	"sync"
	"time"

	"github.com/google/uuid"
)

// JobStepStatus is running | done | failed | pending.
type JobStepStatus string

const (
	StepPending JobStepStatus = "pending"
	StepRunning JobStepStatus = "running"
	StepDone    JobStepStatus = "done"
	StepFailed  JobStepStatus = "failed"
)

// JobStep is one bootstrap/install step.
type JobStep struct {
	ID      string        `json:"id"`
	Label   string        `json:"label"`
	Status  JobStepStatus `json:"status"`
	Detail  string        `json:"detail,omitempty"`
	Started time.Time     `json:"started,omitempty"`
	Ended   time.Time     `json:"ended,omitempty"`
}

// Job tracks scenario install or startup_load progress.
type Job struct {
	ID        string    `json:"jobId"`
	Type      string    `json:"type"` // install | startup_load
	PluginID  string    `json:"pluginId,omitempty"`
	Progress  float64   `json:"progress"`
	Status    string    `json:"status"` // running | done | failed
	Error     string    `json:"error,omitempty"`
	Steps     []JobStep `json:"steps"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ProgressBroadcaster sends scenario.job.progress events.
type ProgressBroadcaster func(job *Job)

// JobStore holds in-memory install jobs.
type JobStore struct {
	mu   sync.RWMutex
	jobs map[string]*Job
}

var defaultJobStore = &JobStore{jobs: make(map[string]*Job)}

// DefaultJobStore returns the process-wide job store.
func DefaultJobStore() *JobStore {
	return defaultJobStore
}

func (s *JobStore) Create(jobType, pluginID string, stepIDs []struct{ ID, Label string }) *Job {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	steps := make([]JobStep, len(stepIDs))
	for i, st := range stepIDs {
		steps[i] = JobStep{ID: st.ID, Label: st.Label, Status: StepPending}
	}
	j := &Job{
		ID:        uuid.New().String(),
		Type:      jobType,
		PluginID:  pluginID,
		Status:    "running",
		Steps:     steps,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.jobs[j.ID] = j
	return j
}

func (s *JobStore) Get(jobID string) (*Job, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	j, ok := s.jobs[jobID]
	if !ok {
		return nil, false
	}
	cp := *j
	cp.Steps = append([]JobStep(nil), j.Steps...)
	return &cp, ok
}

func (s *JobStore) update(jobID string, fn func(*Job)) *Job {
	s.mu.Lock()
	defer s.mu.Unlock()
	j, ok := s.jobs[jobID]
	if !ok {
		return nil
	}
	fn(j)
	j.UpdatedAt = time.Now()
	cp := *j
	cp.Steps = append([]JobStep(nil), j.Steps...)
	return &cp
}

// SetStepRunning marks a step running and broadcasts.
func (s *JobStore) SetStepRunning(jobID, stepID, detail string, broadcast ProgressBroadcaster) {
	j := s.update(jobID, func(j *Job) {
		for i := range j.Steps {
			if j.Steps[i].ID == stepID {
				j.Steps[i].Status = StepRunning
				j.Steps[i].Detail = detail
				j.Steps[i].Started = time.Now()
				break
			}
		}
		j.Progress = s.progressFor(j)
	})
	if j != nil && broadcast != nil {
		broadcast(j)
	}
}

// SetStepDone marks step done.
func (s *JobStore) SetStepDone(jobID, stepID, detail string, broadcast ProgressBroadcaster) {
	j := s.update(jobID, func(j *Job) {
		for i := range j.Steps {
			if j.Steps[i].ID == stepID {
				j.Steps[i].Status = StepDone
				j.Steps[i].Detail = detail
				j.Steps[i].Ended = time.Now()
				break
			}
		}
		j.Progress = s.progressFor(j)
	})
	if j != nil && broadcast != nil {
		broadcast(j)
	}
}

// FailJob marks job failed.
func (s *JobStore) FailJob(jobID, stepID, errMsg string, broadcast ProgressBroadcaster) {
	j := s.update(jobID, func(j *Job) {
		j.Status = "failed"
		j.Error = errMsg
		for i := range j.Steps {
			if stepID == "" || j.Steps[i].ID == stepID {
				if j.Steps[i].Status == StepRunning || j.Steps[i].Status == StepPending {
					j.Steps[i].Status = StepFailed
					j.Steps[i].Detail = errMsg
					j.Steps[i].Ended = time.Now()
				}
			}
		}
		j.Progress = s.progressFor(j)
	})
	if j != nil && broadcast != nil {
		broadcast(j)
	}
}

// CompleteJob marks job done.
func (s *JobStore) CompleteJob(jobID string, broadcast ProgressBroadcaster) {
	j := s.update(jobID, func(j *Job) {
		j.Status = "done"
		j.Progress = 1
		for i := range j.Steps {
			if j.Steps[i].Status == StepPending {
				j.Steps[i].Status = StepDone
			}
		}
	})
	if j != nil && broadcast != nil {
		broadcast(j)
	}
}

func (s *JobStore) progressFor(j *Job) float64 {
	if j == nil || len(j.Steps) == 0 {
		return 0
	}
	done := 0
	for _, st := range j.Steps {
		if st.Status == StepDone {
			done++
		}
	}
	return float64(done) / float64(len(j.Steps))
}

// FindActiveStartupJob returns a running startup_load job if any.
func (s *JobStore) FindActiveStartupJob() *Job {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, j := range s.jobs {
		if j.Type == "startup_load" && j.Status == "running" {
			cp := *j
			return &cp
		}
	}
	return nil
}
