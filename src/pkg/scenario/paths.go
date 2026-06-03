package scenario

import (
	"path/filepath"

	"github.com/openocta/openocta/pkg/paths"
)

const (
	scenariosSubdir    = "scenarios"
	scenarioDataSubdir = "scenario-data"
	manifestFilename   = "openocta-plugin.yaml"
	configFilename     = "config.json"
	runtimeFilename    = "runtime.json"
	mcpFilename        = "mcp.json"
)

// Paths resolves scenario install/data directory layout under state dir.
type Paths struct {
	StateDir string
}

// NewPaths returns path helpers for the given env resolver.
func NewPaths(env func(string) string) *Paths {
	if env == nil {
		env = func(string) string { return "" }
	}
	return &Paths{StateDir: paths.ResolveStateDir(env)}
}

func (p *Paths) ScenariosRoot() string {
	return filepath.Join(p.StateDir, scenariosSubdir)
}

func (p *Paths) ScenarioDataRoot() string {
	return filepath.Join(p.StateDir, scenarioDataSubdir)
}

func (p *Paths) InstallDir(pluginID, version string) string {
	return filepath.Join(p.ScenariosRoot(), pluginID, version)
}

func (p *Paths) DataDir(pluginID string) string {
	return filepath.Join(p.ScenarioDataRoot(), pluginID)
}

func (p *Paths) ManifestPath(installDir string) string {
	return filepath.Join(installDir, manifestFilename)
}

func (p *Paths) ConfigPath(dataDir string) string {
	return filepath.Join(dataDir, configFilename)
}

func (p *Paths) RuntimePath(dataDir string) string {
	return filepath.Join(dataDir, runtimeFilename)
}

func (p *Paths) McpPath(dataDir string) string {
	return filepath.Join(dataDir, mcpFilename)
}

func (p *Paths) SkillsDir(dataDir string) string {
	return filepath.Join(dataDir, "skills")
}

func (p *Paths) EmployeesDir(dataDir string) string {
	return filepath.Join(dataDir, "employees")
}

func (p *Paths) RuntimeEnvDir(dataDir string, subdir string) string {
	if subdir == "" {
		subdir = "runtime-env"
	}
	return filepath.Join(dataDir, subdir)
}
