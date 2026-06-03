package scenario

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/employees"
	"github.com/openocta/openocta/pkg/paths"
)

// InstallSkillZip installs a skill zip into skillsRoot (e.g. scenario-data/<id>/skills).
func InstallSkillZip(zipData []byte, zipName, skillsRoot string) (string, error) {
	if skillsRoot == "" {
		env := func(string) string { return "" }
		skillsRoot = managedSkillsDir(env)
	}
	zr, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return "", err
	}
	prefix := ""
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		clean := filepath.ToSlash(filepath.Clean(f.Name))
		clean = strings.TrimPrefix(clean, "/")
		if strings.Contains(clean, "..") {
			continue
		}
		if strings.EqualFold(filepath.Base(clean), "skill.md") {
			dir := path.Dir(clean)
			if dir != "." {
				prefix = dir + "/"
			}
			break
		}
	}
	skillName := ""
	if prefix != "" {
		parts := strings.Split(strings.TrimSuffix(prefix, "/"), "/")
		if len(parts) > 0 {
			skillName = parts[len(parts)-1]
		}
	}
	if skillName == "" {
		skillName = strings.TrimSpace(zipName)
		skillName = strings.TrimSuffix(strings.TrimSuffix(skillName, ".zip"), ".ZIP")
	}
	if skillName == "" {
		skillName = "skill"
	}
	targetDir := filepath.Join(skillsRoot, skillName)
	_ = os.RemoveAll(targetDir)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", err
	}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		clean := filepath.ToSlash(filepath.Clean(f.Name))
		clean = strings.TrimPrefix(clean, "/")
		if strings.Contains(clean, "..") {
			continue
		}
		rel := clean
		if prefix != "" && strings.HasPrefix(clean, prefix) {
			rel = strings.TrimPrefix(clean, prefix)
		}
		if rel == "" || (prefix != "" && rel == clean) {
			continue
		}
		dest := filepath.Join(targetDir, filepath.FromSlash(rel))
		_ = os.MkdirAll(filepath.Dir(dest), 0755)
		rc, err := f.Open()
		if err != nil {
			continue
		}
		data, _ := io.ReadAll(io.LimitReader(rc, 1<<20))
		rc.Close()
		_ = os.WriteFile(dest, data, 0644)
	}
	return skillName, nil
}

// InstallEmployeeZip installs an employee zip into employeesRoot.
func InstallEmployeeZip(zipData []byte, employeesRoot, typeVal, fromVal string, env func(string) string) (string, error) {
	if employeesRoot == "" {
		employeesRoot = employees.ResolveEmployeesDir(env)
	}
	zr, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return "", err
	}
	var configData []byte
	var readmeData []byte
	var skillZipData []byte
	files := make(map[string][]byte)
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		clean := filepath.ToSlash(filepath.Clean(f.Name))
		if strings.Contains(clean, "..") {
			continue
		}
		base := strings.ToLower(filepath.Base(clean))
		rc, err := f.Open()
		if err != nil {
			continue
		}
		data, _ := io.ReadAll(io.LimitReader(rc, 1<<20))
		rc.Close()
		switch base {
		case "config.json":
			configData = data
		case "readme.md":
			readmeData = data
		case "skill.zip":
			skillZipData = data
		default:
			files[clean] = data
		}
	}
	if configData == nil {
		return "", fmt.Errorf("zip must contain config.json")
	}
	var cfg struct {
		ID          string                           `json:"id"`
		Name        string                           `json:"name"`
		Description string                           `json:"description"`
		Prompt      string                           `json:"prompt"`
		Enabled     *bool                            `json:"enabled"`
		SkillIDs    []string                         `json:"skillIds"`
		McpServers  map[string]config.McpServerEntry `json:"mcpServers"`
	}
	if err := json.Unmarshal(configData, &cfg); err != nil {
		return "", err
	}
	if cfg.ID == "" || cfg.Name == "" {
		return "", fmt.Errorf("config.json must contain id and name")
	}
	enabled := true
	if cfg.Enabled != nil {
		enabled = *cfg.Enabled
	}
	m := &employees.Manifest{
		ID: cfg.ID, Name: cfg.Name, Description: cfg.Description,
		Prompt: cfg.Prompt, Enabled: enabled, SkillIDs: cfg.SkillIDs,
		McpServers: cfg.McpServers, Type: typeVal, From: fromVal,
	}
	dir := filepath.Join(employeesRoot, m.ID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	manifestPath := filepath.Join(dir, "manifest.json")
	mb, _ := json.MarshalIndent(m, "", "  ")
	if err := os.WriteFile(manifestPath, mb, 0644); err != nil {
		return "", err
	}
	if len(readmeData) > 0 {
		_ = os.WriteFile(filepath.Join(dir, "README.md"), readmeData, 0644)
	}
	if len(skillZipData) > 0 && employeesRoot != employees.ResolveEmployeesDir(env) {
		empSkills := filepath.Join(dir, "skills")
		_ = extractEmployeeSkillsFromZip(skillZipData, empSkills)
	}
	for rel, data := range files {
		dest := filepath.Join(dir, filepath.FromSlash(rel))
		_ = os.MkdirAll(filepath.Dir(dest), 0755)
		_ = os.WriteFile(dest, data, 0644)
	}
	return m.ID, nil
}

func extractEmployeeSkillsFromZip(skillZip []byte, root string) error {
	zr, err := zip.NewReader(bytes.NewReader(skillZip), int64(len(skillZip)))
	if err != nil {
		return err
	}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		clean := filepath.ToSlash(filepath.Clean(f.Name))
		if strings.Contains(clean, "..") {
			continue
		}
		dest := filepath.Join(root, filepath.FromSlash(clean))
		_ = os.MkdirAll(filepath.Dir(dest), 0755)
		rc, err := f.Open()
		if err != nil {
			continue
		}
		data, _ := io.ReadAll(io.LimitReader(rc, 1<<20))
		rc.Close()
		_ = os.WriteFile(dest, data, 0644)
	}
	return nil
}

// InstallMcpToFile merges MCP server definitions into dataPath/mcp.json (does not touch main config).
func InstallMcpToFile(zipData []byte, mcpPath string) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return "", err
	}
	var configData []byte
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		if strings.EqualFold(filepath.Base(f.Name), "config.json") {
			rc, _ := f.Open()
			configData, _ = io.ReadAll(io.LimitReader(rc, 1<<20))
			rc.Close()
			break
		}
	}
	if configData == nil {
		return "", fmt.Errorf("zip must contain config.json")
	}
	var siteCfg map[string]map[string]interface{}
	if err := json.Unmarshal(configData, &siteCfg); err != nil {
		return "", err
	}
	var firstKey string
	for k := range siteCfg {
		firstKey = k
		break
	}
	if firstKey == "" {
		return "", fmt.Errorf("empty mcp config")
	}
	existing := map[string]interface{}{}
	if data, err := os.ReadFile(mcpPath); err == nil {
		var root map[string]interface{}
		if json.Unmarshal(data, &root) == nil {
			if srv, ok := root["servers"].(map[string]interface{}); ok {
				existing = srv
			}
		}
	}
	if existing == nil {
		existing = map[string]interface{}{}
	}
	if _, ok := existing[firstKey]; !ok {
		existing[firstKey] = siteCfg[firstKey]
	}
	root := map[string]interface{}{"servers": existing}
	if err := os.MkdirAll(filepath.Dir(mcpPath), 0755); err != nil {
		return "", err
	}
	out, _ := json.MarshalIndent(root, "", "  ")
	if err := os.WriteFile(mcpPath, out, 0600); err != nil {
		return "", err
	}
	return firstKey, nil
}

// ExtractPackZip extracts a scenario pack zip into installDir.
func ExtractPackZip(zipData []byte, installDir string) error {
	zr, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return err
	}
	_ = os.RemoveAll(installDir)
	if err := os.MkdirAll(installDir, 0755); err != nil {
		return err
	}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		clean := filepath.ToSlash(filepath.Clean(f.Name))
		if strings.Contains(clean, "..") {
			continue
		}
		dest := filepath.Join(installDir, filepath.FromSlash(clean))
		_ = os.MkdirAll(filepath.Dir(dest), 0755)
		rc, err := f.Open()
		if err != nil {
			continue
		}
		data, _ := io.ReadAll(io.LimitReader(rc, 50<<20))
		rc.Close()
		if err := os.WriteFile(dest, data, 0644); err != nil {
			return err
		}
	}
	return nil
}

// ResolveStateDirForEnv is a thin wrapper for bootstrap.
func ResolveStateDirForEnv(env func(string) string) string {
	return paths.ResolveStateDir(env)
}
