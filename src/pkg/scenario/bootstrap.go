package scenario

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/openocta/openocta/pkg/config"
)

// BootstrapParams configures scenario pack installation.
type BootstrapParams struct {
	PluginID    string
	ZipData     []byte // optional; if empty installDir must already exist
	Env         func(string) string
	Broadcast   ProgressBroadcaster
	JobID       string
	SiteAPIBase string
}

var bootstrapSteps = []struct{ ID, Label string }{
	{"compat", "兼容性检查"},
	{"extract", "解压场景包"},
	{"data_dir", "初始化数据目录"},
	{"remote", "安装远程依赖"},
	{"local_mcps", "配置本地 MCP"},
	{"setup", "运行安装脚本"},
	{"register", "注册场景插件"},
}

// Bootstrap installs a scenario pack asynchronously-friendly (caller runs in goroutine).
func Bootstrap(ctx context.Context, p BootstrapParams) error {
	if p.Env == nil {
		p.Env = os.Getenv
	}
	paths := NewPaths(p.Env)
	store := DefaultJobStore()
	jobID := p.JobID
	if jobID == "" {
		j := store.Create("install", p.PluginID, bootstrapSteps)
		jobID = j.ID
	}
	bcast := p.Broadcast
	base := p.SiteAPIBase
	if base == "" {
		base = SiteAPIBase()
	}

	store.SetStepRunning(jobID, "compat", "", bcast)
	installDir := ""
	dataDir := paths.DataDir(p.PluginID)
	var manifest *Manifest

	// compat + resolve paths from existing install or zip
	if len(p.ZipData) > 0 {
		// peek manifest from zip for version
		tmpDir, err := os.MkdirTemp("", "octa-scenario-*")
		if err != nil {
			store.FailJob(jobID, "compat", err.Error(), bcast)
			return err
		}
		defer os.RemoveAll(tmpDir)
		if err := ExtractPackZip(p.ZipData, tmpDir); err != nil {
			store.FailJob(jobID, "compat", err.Error(), bcast)
			return err
		}
		manifest, err = LoadManifest(tmpDir)
		if err != nil {
			store.FailJob(jobID, "compat", err.Error(), bcast)
			return err
		}
		if p.PluginID != "" && manifest.ID != p.PluginID {
			store.FailJob(jobID, "compat", fmt.Sprintf("plugin id mismatch: %s vs %s", manifest.ID, p.PluginID), bcast)
			return fmt.Errorf("plugin id mismatch")
		}
		p.PluginID = manifest.ID
		installDir = paths.InstallDir(manifest.ID, manifest.Version)
		dataDir = paths.DataDir(manifest.ID)
	} else {
		// find existing install dir
		root := paths.ScenariosRoot()
		entries, _ := os.ReadDir(filepath.Join(root, p.PluginID))
		if len(entries) == 0 {
			store.FailJob(jobID, "compat", "no zip and no installed pack", bcast)
			return fmt.Errorf("no install source")
		}
		installDir = filepath.Join(root, p.PluginID, entries[len(entries)-1].Name())
		var err error
		manifest, err = LoadManifest(installDir)
		if err != nil {
			store.FailJob(jobID, "compat", err.Error(), bcast)
			return err
		}
	}
	if err := manifest.CheckCompat(); err != nil {
		store.FailJob(jobID, "compat", err.Error(), bcast)
		return err
	}
	store.SetStepDone(jobID, "compat", manifest.Version, bcast)

	store.SetStepRunning(jobID, "extract", installDir, bcast)
	if len(p.ZipData) > 0 {
		if err := ExtractPackZip(p.ZipData, installDir); err != nil {
			store.FailJob(jobID, "extract", err.Error(), bcast)
			return err
		}
		manifest, _ = LoadManifest(installDir)
	} else if local := findLocalPackDir(p.PluginID); local != "" {
		if err := copyPackDir(local, installDir); err != nil {
			store.FailJob(jobID, "extract", err.Error(), bcast)
			return err
		}
		manifest, _ = LoadManifest(installDir)
	}
	store.SetStepDone(jobID, "extract", installDir, bcast)

	store.SetStepRunning(jobID, "data_dir", dataDir, bcast)
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		store.FailJob(jobID, "data_dir", err.Error(), bcast)
		return err
	}
	cfgStore := NewPluginConfigStore(p.Env)
	cfg, _, _ := cfgStore.Read(p.PluginID)
	if len(cfg) == 0 && len(manifest.ConfigDefaults) > 0 {
		_, _ = cfgStore.Write(p.PluginID, manifest.ConfigDefaults)
	}
	store.SetStepDone(jobID, "data_dir", dataDir, bcast)

	store.SetStepRunning(jobID, "remote", "", bcast)
	skillsRoot := paths.SkillsDir(dataDir)
	employeesRoot := paths.EmployeesDir(dataDir)
	_ = os.MkdirAll(skillsRoot, 0755)
	_ = os.MkdirAll(employeesRoot, 0755)
	for _, ref := range manifest.Remote.Skills {
		id := ref.RemoteID
		if id == "" {
			continue
		}
		zip, err := fetchZipFromSite(ctx, base, "skill", id)
		if err != nil {
			store.FailJob(jobID, "remote", "skill "+id+": "+err.Error(), bcast)
			return err
		}
		if _, err := InstallSkillZip(zip, id, skillsRoot); err != nil {
			store.FailJob(jobID, "remote", err.Error(), bcast)
			return err
		}
	}
	for _, ref := range manifest.Remote.Employees {
		id := ref.RemoteID
		if id == "" {
			continue
		}
		zip, err := fetchZipFromSite(ctx, base, "employee", id)
		if err != nil {
			store.FailJob(jobID, "remote", "employee "+id+": "+err.Error(), bcast)
			return err
		}
		if _, err := InstallEmployeeZip(zip, employeesRoot, "场景插件", "scenario", p.Env); err != nil {
			store.FailJob(jobID, "remote", err.Error(), bcast)
			return err
		}
	}
	for _, ref := range manifest.Remote.Mcps {
		id := ref.RemoteID
		if id == "" {
			continue
		}
		zip, err := fetchZipFromSite(ctx, base, "mcp", id)
		if err != nil {
			store.FailJob(jobID, "remote", "mcp "+id+": "+err.Error(), bcast)
			return err
		}
		if _, err := InstallMcpToFile(zip, paths.McpPath(dataDir)); err != nil {
			store.FailJob(jobID, "remote", err.Error(), bcast)
			return err
		}
	}
	store.SetStepDone(jobID, "remote", "", bcast)

	store.SetStepRunning(jobID, "local_mcps", "", bcast)
	if len(manifest.LocalMcps) > 0 {
		mcpRoot, _ := ReadMcpJSON(dataDir)
		servers, _ := mcpRoot["servers"].(map[string]interface{})
		if servers == nil {
			servers = map[string]interface{}{}
		}
		for _, lm := range manifest.LocalMcps {
			key := lm.ServerKey
			if key == "" {
				continue
			}
			if _, ok := servers[key]; !ok {
				servers[key] = map[string]interface{}{
					"enabled": true,
					"command": lm.Run.Command,
					"args":    lm.Run.Args,
					"env":     lm.Run.Env,
				}
			}
		}
		out, _ := json.MarshalIndent(map[string]interface{}{"servers": servers}, "", "  ")
		_ = os.WriteFile(paths.McpPath(dataDir), out, 0600)
	}
	store.SetStepDone(jobID, "local_mcps", "", bcast)

	store.SetStepRunning(jobID, "setup", "", bcast)
	setupDir := filepath.Join(installDir, "setup")
	for _, step := range manifest.Setup {
		if step.Script == "" {
			continue
		}
		scriptPath := filepath.Join(setupDir, step.Script)
		if _, err := os.Stat(scriptPath); err != nil {
			continue
		}
		cmd := exec.CommandContext(ctx, "python3", scriptPath)
		cmd.Dir = installDir
		out, err := cmd.CombinedOutput()
		if err != nil {
			store.FailJob(jobID, "setup", string(out)+": "+err.Error(), bcast)
			return err
		}
	}
	store.SetStepDone(jobID, "setup", "", bcast)

	store.SetStepRunning(jobID, "register", "", bcast)
	enabled := true
	rec := &RuntimeRecord{
		PluginID:    manifest.ID,
		Version:     manifest.Version,
		InstallPath: installDir,
		DataPath:    dataDir,
		InstalledAt: time.Now(),
		Enabled:     enabled,
	}
	if err := WriteRuntimeRecord(dataDir, rec); err != nil {
		store.FailJob(jobID, "register", err.Error(), bcast)
		return err
	}
	installedAt := rec.InstalledAt.Format(time.RFC3339)
	entry := config.ScenarioInstalledEntry{
		Version: manifest.Version, InstallPath: installDir, DataPath: dataDir,
		InstalledAt: installedAt, Enabled: &enabled,
	}
	if err := PatchScenariosInstalled(p.Env, func(m map[string]config.ScenarioInstalledEntry) map[string]config.ScenarioInstalledEntry {
		if m == nil {
			m = map[string]config.ScenarioInstalledEntry{}
		}
		m[manifest.ID] = entry
		return m
	}); err != nil {
		store.FailJob(jobID, "register", err.Error(), bcast)
		return err
	}
	// load into runtime registry
	_ = LoadPlugin(ctx, manifest.ID, p.Env, nil)
	store.SetStepDone(jobID, "register", manifest.ID, bcast)
	store.CompleteJob(jobID, bcast)
	return nil
}

func findLocalPackDir(pluginID string) string {
	candidates := []string{
		filepath.Join("examples", "scenario-packs", pluginID),
		filepath.Join("openocta", "examples", "scenario-packs", pluginID),
	}
	for _, c := range candidates {
		if st, err := os.Stat(c); err == nil && st.IsDir() {
			if _, err := os.Stat(filepath.Join(c, manifestFilename)); err == nil {
				return c
			}
		}
	}
	return ""
}

func copyPackDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		in, err := os.Open(path)
		if err != nil {
			return err
		}
		defer in.Close()
		if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return err
		}
		out, err := os.Create(target)
		if err != nil {
			return err
		}
		_, cpErr := io.Copy(out, in)
		closeErr := out.Close()
		if cpErr != nil {
			return cpErr
		}
		return closeErr
	})
}

// StartBootstrapAsync runs bootstrap in background and returns job id.
func StartBootstrapAsync(ctx context.Context, pluginID string, zip []byte, env func(string) string, broadcast ProgressBroadcaster) string {
	store := DefaultJobStore()
	j := store.Create("install", pluginID, bootstrapSteps)
	go func() {
		_ = Bootstrap(ctx, BootstrapParams{
			PluginID: pluginID, ZipData: zip, Env: env, Broadcast: broadcast, JobID: j.ID,
		})
	}()
	return j.ID
}
