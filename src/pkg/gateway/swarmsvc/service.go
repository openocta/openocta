// Package swarmsvc wires the swarm orchestrator to the gateway.
package swarmsvc

import (
	"os"
	"sync"

	"github.com/openocta/openocta/pkg/a2a/executor"
	"github.com/openocta/openocta/pkg/a2a/task"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/swarm"
)

var (
	mu           sync.RWMutex
	orchestrator *swarm.Orchestrator
	broadcastFn  swarm.Broadcaster
)

// Init creates the global swarm orchestrator.
func Init(runner executor.Runner, broadcast swarm.Broadcaster, cfg *config.OpenOctaConfig, env func(string) string) error {
	if env == nil {
		env = os.Getenv
	}
	store, err := swarm.NewStore(env)
	if err != nil {
		return err
	}
	exec := &executor.RuntimeExecutor{
		Tasks:  task.NewStore(),
		Runner: runner,
	}
	orch := swarm.NewOrchestrator(store, exec, broadcast)
	if cfg != nil && cfg.Session != nil && cfg.Session.AgentToAgent != nil &&
		cfg.Session.AgentToAgent.MaxPingPongTurns != nil {
		orch.MaxPingPongTurns = *cfg.Session.AgentToAgent.MaxPingPongTurns
	}
	mu.Lock()
	orchestrator = orch
	broadcastFn = broadcast
	mu.Unlock()
	return nil
}

// Orch returns the global orchestrator (may be nil before Init).
func Orch() *swarm.Orchestrator {
	mu.RLock()
	defer mu.RUnlock()
	return orchestrator
}
