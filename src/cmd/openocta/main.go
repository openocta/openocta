package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/cmd/openocta/commands"
	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/paths"
)

func main() {
	// Load .env from current working directory so config and rest of process see these vars
	if err := config.LoadEnvFromCurrentDir(); err != nil {
		fmt.Fprintf(os.Stderr, "openocta: warning: load .env: %v\n", err)
	}
	if err := config.EnsureDefaultConfig(config.DefaultEnv); err != nil {
		fmt.Fprintf(os.Stderr, "openocta: init config: %v\n", err)
		os.Exit(1)
	}
	// Deploy: if ~/.openocta/workspace has no .md files, copy from cwd/prompt
	stateDir := paths.ResolveStateDir(config.DefaultEnv)
	profile := strings.TrimSpace(config.DefaultEnv("OPENOCTA_PROFILE"))
	workspaceDir := filepath.Join(stateDir, "workspace")
	if profile != "" && strings.ToLower(profile) != "default" {
		workspaceDir = filepath.Join(stateDir, "workspace-"+profile)
	}
	cwd, _ := os.Getwd()
	promptSourceDir := filepath.Join(cwd, "prompt")
	if err := runtime.EnsureWorkspacePrompts(workspaceDir, promptSourceDir); err != nil {
		fmt.Fprintf(os.Stderr, "openocta: warning: ensure workspace prompts: %v\n", err)
	}
	commands.Execute()
}
