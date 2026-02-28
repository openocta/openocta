package cron

import (
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Service manages cron jobs.
type Service struct {
	storePath string
	mu        sync.RWMutex
	store     *StoreFile
	deps      *Deps
	done      chan struct{}
}

// SetDeps sets execution dependencies (call after creation from gateway).
func (s *Service) SetDeps(deps *Deps) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.deps = deps
}

// NewService creates a new cron service.
func NewService(storePath string) (*Service, error) {
	if storePath == "" {
		storePath = filepath.Join(".openocta", "cron", "jobs.json")
	}
	// 确保存储路径所在目录存在，不存在则创建
	dir := filepath.Dir(storePath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, err
		}
	}
	store, err := LoadStore(storePath)
	if err != nil {
		return nil, err
	}
	return &Service{
		storePath: storePath,
		store:     store,
	}, nil
}

// List returns all jobs, optionally including disabled.
func (s *Service) List(includeDisabled bool) ([]CronJob, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []CronJob
	for _, j := range s.store.Jobs {
		if j.Enabled || includeDisabled {
			out = append(out, j)
		}
	}
	return out, nil
}

// JobCreate is the input for adding a job.
type JobCreate struct {
	Name          string
	Schedule      CronSchedule
	Payload       CronPayload
	SessionTarget string
	WakeMode      string
	Enabled       bool
}

// Add adds a new job.
func (s *Service) Add(input JobCreate) (CronJob, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UnixMilli()
	j := CronJob{
		ID:            uuid.New().String(),
		Name:          input.Name,
		Enabled:       input.Enabled,
		CreatedAtMs:   now,
		UpdatedAtMs:   now,
		Schedule:      input.Schedule,
		SessionTarget: input.SessionTarget,
		WakeMode:      input.WakeMode,
		Payload:       input.Payload,
	}
	if j.SessionTarget == "" {
		j.SessionTarget = "main"
	}
	if j.WakeMode == "" {
		j.WakeMode = "next-heartbeat"
	}
	s.store.Jobs = append(s.store.Jobs, j)
	return j, SaveStore(s.storePath, s.store)
}

// JobPatch is a partial update for a job.
type JobPatch struct {
	Enabled  *bool
	Name     string
	Schedule *CronSchedule
}

// Update updates a job by ID.
func (s *Service) Update(id string, patch JobPatch) (CronJob, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.store.Jobs {
		if s.store.Jobs[i].ID == id {
			if patch.Enabled != nil {
				s.store.Jobs[i].Enabled = *patch.Enabled
			}
			if patch.Name != "" {
				s.store.Jobs[i].Name = patch.Name
			}
			if patch.Schedule != nil {
				s.store.Jobs[i].Schedule = *patch.Schedule
			}
			s.store.Jobs[i].UpdatedAtMs = time.Now().UnixMilli()
			j := s.store.Jobs[i]
			return j, SaveStore(s.storePath, s.store)
		}
	}
	return CronJob{}, nil // not found
}

// Remove removes a job by ID.
func (s *Service) Remove(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, j := range s.store.Jobs {
		if j.ID == id {
			s.store.Jobs = append(s.store.Jobs[:i], s.store.Jobs[i+1:]...)
			return SaveStore(s.storePath, s.store)
		}
	}
	return nil
}

// Run runs a job by ID. mode is "due" or "force".
func (s *Service) Run(id string, mode string) error {
	s.mu.Lock()
	var job *CronJob
	for i := range s.store.Jobs {
		if s.store.Jobs[i].ID == id {
			job = &s.store.Jobs[i]
			break
		}
	}
	if job == nil {
		s.mu.Unlock()
		return nil
	}
	deps := s.deps
	s.mu.Unlock()

	now := time.Now().UnixMilli()
	if job.SessionTarget == "main" {
		if job.Payload.Kind != "systemEvent" {
			return nil
		}
		text := job.Payload.Text
		if deps != nil && deps.EnqueueSystemEvent != nil {
			deps.EnqueueSystemEvent(text)
		}
		if job.WakeMode == "now" && deps != nil && deps.RequestHeartbeatNow != nil {
			deps.RequestHeartbeatNow("cron:" + id)
		}
	} else if job.SessionTarget == "isolated" && job.Payload.Kind == "agentTurn" {
		message := job.Payload.Message
		if deps != nil && deps.RunIsolatedAgentJob != nil {
			deps.RunIsolatedAgentJob(*job, message)
		}
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.store.Jobs {
		if s.store.Jobs[i].ID == id {
			s.store.Jobs[i].State.LastRunAtMs = &now
			s.store.Jobs[i].State.LastStatus = "ok"
			s.store.Jobs[i].State.RunningAtMs = nil
			next := ComputeNextRunAtMs(s.store.Jobs[i].Schedule, now)
			s.store.Jobs[i].State.NextRunAtMs = &next
			_ = SaveStore(s.storePath, s.store)
			break
		}
	}
	return nil
}

// RecomputeNextRuns updates NextRunAtMs for all jobs and persists.
func (s *Service) RecomputeNextRuns() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UnixMilli()
	for i := range s.store.Jobs {
		next := ComputeNextRunAtMs(s.store.Jobs[i].Schedule, now)
		s.store.Jobs[i].State.NextRunAtMs = &next
	}
	return SaveStore(s.storePath, s.store)
}

// NextWakeAtMs returns the soonest next run time in ms, or 0.
func (s *Service) NextWakeAtMs() int64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var min int64
	for _, j := range s.store.Jobs {
		if !j.Enabled || j.State.NextRunAtMs == nil {
			continue
		}
		n := *j.State.NextRunAtMs
		if n > 0 && (min == 0 || n < min) {
			min = n
		}
	}
	return min
}

// dueJobIDs returns job IDs that are due (NextRunAtMs <= nowMs). Caller holds no lock.
func (s *Service) dueJobIDs(nowMs int64) []string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var ids []string
	for _, j := range s.store.Jobs {
		if !j.Enabled || j.State.NextRunAtMs == nil {
			continue
		}
		if *j.State.NextRunAtMs <= nowMs {
			ids = append(ids, j.ID)
		}
	}
	return ids
}

const maxTimerSleepMs = 60000

// Start starts the timer loop (recompute next runs, then sleep/wake and execute due jobs).
// Call Stop() to stop the loop.
func (s *Service) Start() {
	s.mu.Lock()
	if s.done != nil {
		s.mu.Unlock()
		return
	}
	s.done = make(chan struct{})
	s.mu.Unlock()
	_ = s.RecomputeNextRuns()
	go func() {
		for {
			nextMs := s.NextWakeAtMs()
			nowMs := time.Now().UnixMilli()
			sleepMs := int64(maxTimerSleepMs)
			if nextMs > 0 && nextMs > nowMs {
				d := nextMs - nowMs
				if d < sleepMs {
					sleepMs = d
				}
			}
			select {
			case <-time.After(time.Duration(sleepMs) * time.Millisecond):
				// fall through and run due jobs
			case <-s.done:
				return
			}
			nowMs = time.Now().UnixMilli()
			for _, id := range s.dueJobIDs(nowMs) {
				_ = s.Run(id, "due")
			}
			_ = s.RecomputeNextRuns()
		}
	}()
}

// Stop stops the timer loop.
func (s *Service) Stop() {
	s.mu.Lock()
	done := s.done
	s.done = nil
	s.mu.Unlock()
	if done != nil {
		close(done)
	}
}
