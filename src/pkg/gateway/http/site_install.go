// Package http provides site install handler for remote market plugins.
package http

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/employees"
	"github.com/openocta/openocta/pkg/gateway/handlers"
	"github.com/openocta/openocta/pkg/installmetadata"
	"github.com/openocta/openocta/pkg/paths"
)

const installMaxZipSize = 50 << 20 // 50 MB

// installReq 安装请求体
type installReq struct {
	Kind string `json:"kind"` // employee | skill | mcp
	ID   string `json:"id"`   // 数字员工 id（数字）、技能 folder、MCP id（数字）
	// 可选：从详情接口获取后传入，用于 type/from 标识
	Type     string `json:"type,omitempty"`     // 分类/类型
	Category string `json:"category,omitempty"` // 同 type，兼容
}

// installRes 安装响应
type installRes struct {
	OK   bool   `json:"ok"`
	ID   string `json:"id,omitempty"`   // 安装后的本地 id/folder
	Kind string `json:"kind,omitempty"` // employee | skill | mcp
}

// handleSiteInstall 处理 POST /api/v1/install
func (s *Server) handleSiteInstall(w http.ResponseWriter, r *http.Request) {
	setSiteProxyCORSHeaders(w)
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeSiteInstallError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req installReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeSiteInstallError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}
	req.Kind = strings.TrimSpace(strings.ToLower(req.Kind))
	req.ID = strings.TrimSpace(req.ID)
	if req.ID == "" {
		writeSiteInstallError(w, http.StatusBadRequest, "id is required")
		return
	}
	if req.Kind != "employee" && req.Kind != "skill" && req.Kind != "mcp" {
		writeSiteInstallError(w, http.StatusBadRequest, "kind must be employee, skill, or mcp")
		return
	}

	typeVal := strings.TrimSpace(req.Type)
	if typeVal == "" {
		typeVal = strings.TrimSpace(req.Category)
	}
	if typeVal == "" {
		typeVal = "其它"
	}
	fromVal := "remote"

	env := func(k string) string { return os.Getenv(k) }
	base := s.siteAPIBaseURL()

	// 1. 下载 zip
	zipData, err := fetchZipFromSite(r.Context(), base, req.Kind, req.ID)
	if err != nil {
		writeSiteInstallError(w, http.StatusBadGateway, "下载失败: "+err.Error())
		return
	}

	// 2. 根据 kind 解压并保存
	var result installRes
	switch req.Kind {
	case "employee":
		id, err := installEmployee(zipData, typeVal, fromVal, env)
		if err != nil {
			writeSiteInstallError(w, http.StatusBadRequest, "安装数字员工失败: "+err.Error())
			return
		}
		_ = installmetadata.Append(env, "employee", req.ID, id, typeVal)
		result = installRes{OK: true, ID: id, Kind: "employee"}
	case "skill":
		folder, err := installSkill(zipData, req.ID, typeVal, fromVal, env)
		if err != nil {
			writeSiteInstallError(w, http.StatusBadRequest, "安装技能失败: "+err.Error())
			return
		}
		_ = installmetadata.Append(env, "skill", req.ID, folder, typeVal)
		result = installRes{OK: true, ID: folder, Kind: "skill"}
	case "mcp":
		serverKey, err := installMcp(zipData, typeVal, fromVal, env)
		if err != nil {
			writeSiteInstallError(w, http.StatusBadRequest, "安装 MCP 失败: "+err.Error())
			return
		}
		_ = installmetadata.Append(env, "mcp", req.ID, serverKey, typeVal)
		result = installRes{OK: true, ID: serverKey, Kind: "mcp"}
	default:
		writeSiteInstallError(w, http.StatusBadRequest, "unknown kind: "+req.Kind)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

// extractEmployeeSkillsFromZip 从 skill.zip 容器中解压各技能到 employee_skills/<employeeId>/ 下。
// skill.zip 内可包含多个 xxx.zip，每个 xxx.zip 为单个技能的压缩包，解压到 <skillName>/ 目录。
func extractEmployeeSkillsFromZip(skillZipData []byte, employeeSkillsRoot string) error {
	zr, err := zip.NewReader(bytes.NewReader(skillZipData), int64(len(skillZipData)))
	if err != nil {
		return err
	}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		base := strings.ToLower(filepath.Base(f.Name))
		if !strings.HasSuffix(base, ".zip") {
			continue
		}
		skillName := strings.TrimSuffix(filepath.Base(f.Name), ".zip")
		skillName = strings.TrimSuffix(skillName, ".ZIP")
		if skillName == "" || strings.Contains(skillName, "..") {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			continue
		}
		innerData, err := io.ReadAll(io.LimitReader(rc, 10<<20))
		rc.Close()
		if err != nil || len(innerData) < 4 {
			continue
		}
		if innerData[0] != 0x50 || innerData[1] != 0x4b {
			continue
		}
		targetDir := filepath.Join(employeeSkillsRoot, skillName)
		_ = os.RemoveAll(targetDir)
		if err := os.MkdirAll(targetDir, 0755); err != nil {
			return fmt.Errorf("创建技能目录 %s 失败: %w", skillName, err)
		}
		if err := extractSingleSkillZip(innerData, targetDir); err != nil {
			return fmt.Errorf("解压技能 %s 失败: %w", skillName, err)
		}
	}
	return nil
}

// extractSingleSkillZip 将单个技能 zip 解压到 targetDir，支持 SKILL.md 在子目录中的结构。
func extractSingleSkillZip(zipData []byte, targetDir string) error {
	zr, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return err
	}
	prefix := ""
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		clean := filepath.ToSlash(filepath.Clean(f.Name))
		clean = strings.TrimPrefix(clean, "/") // 部分 zip 含前导斜杠，统一去掉
		if strings.Contains(clean, "..") {
			continue
		}
		if strings.ToLower(filepath.Base(clean)) == "skill.md" {
			// 使用 path.Dir：zip 路径始终为正斜杠，path 包对正斜杠路径更可靠
			dir := path.Dir(clean)
			if dir != "." {
				prefix = dir + "/"
			}
			break
		}
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
		// 跳过：空路径；或 prefix 非空时文件不在 prefix 目录下（rel 未被 trim）
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
	return nil
}

func writeSiteInstallError(w http.ResponseWriter, status int, msg string) {
	setSiteProxyCORSHeaders(w)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "error": msg})
}

// extractUpstreamErrorMessage 从上游响应中提取用户友好的错误信息。
// 优先使用 body 中的 error/message 字段；若无则根据状态码返回友好提示。
func extractUpstreamErrorMessage(statusCode int, body []byte) string {
	if len(body) > 0 {
		var m map[string]interface{}
		if err := json.Unmarshal(body, &m); err == nil {
			if v, ok := m["error"].(string); ok && v != "" {
				return strings.TrimSpace(v)
			}
			if v, ok := m["message"].(string); ok && v != "" {
				return strings.TrimSpace(v)
			}
			if v, ok := m["msg"].(string); ok && v != "" {
				return strings.TrimSpace(v)
			}
			// 纯文本 body 且看起来像错误信息
			s := strings.TrimSpace(string(body))
			if len(s) > 0 && len(s) < 512 {
				return s
			}
		}
	}
	// 根据状态码返回友好提示
	switch statusCode {
	case http.StatusBadRequest:
		return "请求参数错误，请检查后重试"
	case http.StatusUnauthorized:
		return "未授权，请先登录或配置访问凭证"
	case http.StatusForbidden:
		return "无权限访问该资源"
	case http.StatusNotFound:
		return "资源不存在或已被移除"
	case http.StatusInternalServerError:
		return "服务器内部错误，请稍后重试"
	case http.StatusBadGateway, http.StatusServiceUnavailable:
		return "远程服务暂时不可用，请稍后重试"
	case http.StatusGatewayTimeout:
		return "请求超时，请检查网络后重试"
	default:
		return fmt.Sprintf("请求失败 (HTTP %d)，请稍后重试", statusCode)
	}
}

func fetchZipFromSite(ctx context.Context, baseURL, kind, id string) ([]byte, error) {
	var path string
	switch kind {
	case "employee":
		path = "/api/v1/employees/" + id + "/download"
	case "skill":
		path = "/api/v1/skills/" + id + "/download"
	case "mcp":
		path = "/api/v1/mcps/" + id + "/download"
	default:
		return nil, fmt.Errorf("unknown kind %s", kind)
	}
	u := strings.TrimRight(baseURL, "/") + path
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/zip, application/octet-stream, */*")
	client := newSiteAPIHTTPClient(60 * time.Second)
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(res.Body, 4096))
		msg := extractUpstreamErrorMessage(res.StatusCode, body)
		return nil, fmt.Errorf("%s", msg)
	}
	ct := res.Header.Get("Content-Type")
	if !strings.Contains(ct, "zip") && !strings.Contains(ct, "octet-stream") && ct != "" {
		// 可能是 JSON 错误响应
		body, _ := io.ReadAll(io.LimitReader(res.Body, 4096))
		if len(body) > 0 && (body[0] == '{' || body[0] == '[') {
			return nil, fmt.Errorf("upstream returned non-zip: %s", string(body))
		}
	}
	data, err := io.ReadAll(io.LimitReader(res.Body, installMaxZipSize))
	if err != nil {
		return nil, err
	}
	if len(data) < 4 {
		return nil, fmt.Errorf("invalid zip: too small")
	}
	// 检查 zip 魔数
	if data[0] != 0x50 || data[1] != 0x4b {
		return nil, fmt.Errorf("invalid zip: not a zip file")
	}
	return data, nil
}

// installEmployee 从 zip 安装数字员工
func installEmployee(zipData []byte, typeVal, fromVal string, env func(string) string) (string, error) {
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
		return "", fmt.Errorf("zip 必须包含 config.json")
	}
	if readmeData == nil {
		return "", fmt.Errorf("zip 必须包含 README.md")
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
		return "", fmt.Errorf("config.json 格式错误: %w", err)
	}
	if cfg.ID == "" || cfg.Name == "" || cfg.Description == "" {
		return "", fmt.Errorf("config.json 必须包含 id、name、description")
	}

	enabled := true
	if cfg.Enabled != nil {
		enabled = *cfg.Enabled
	}

	m := &employees.Manifest{
		ID:          cfg.ID,
		Name:        cfg.Name,
		Description: cfg.Description,
		Prompt:      cfg.Prompt,
		Enabled:     enabled,
		Builtin:     false,
		SkillIDs:    cfg.SkillIDs,
		McpServers:  cfg.McpServers,
		Type:        typeVal,
		From:        fromVal,
	}

	root := employees.ResolveEmployeesDir(env)
	dir := filepath.Join(root, m.ID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	// 写入 manifest.json
	if err := employees.SaveManifest(m, env); err != nil {
		return "", err
	}
	// 写入 README.md
	_ = os.WriteFile(filepath.Join(dir, "README.md"), readmeData, 0644)
	// 若有 skill.zip，解压到 ~/.openocta/employee_skills/<employeeId>/<skillName>/
	if len(skillZipData) > 0 {
		stateDir := paths.ResolveStateDir(env)
		employeeSkillsRoot := filepath.Join(stateDir, "employee_skills", m.ID)
		if err := extractEmployeeSkillsFromZip(skillZipData, employeeSkillsRoot); err != nil {
			return "", fmt.Errorf("解压技能包失败: %w", err)
		}
	}
	// 写入其他文件
	for rel, data := range files {
		if rel == "config.json" || rel == "README.md" || rel == "skill.zip" {
			continue
		}
		dest := filepath.Join(dir, filepath.FromSlash(rel))
		_ = os.MkdirAll(filepath.Dir(dest), 0755)
		_ = os.WriteFile(dest, data, 0644)
	}

	return m.ID, nil
}

// installSkill 从 zip 安装技能。
// zipName 为压缩包名/ID（如远程市场的 skill folder），当 SKILL.md 在根目录时用作技能目录名。
func installSkill(zipData []byte, zipName, typeVal, fromVal string, env func(string) string) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return "", err
	}

	// 1. 查找 SKILL.md 所在目录作为 prefix
	//    - SKILL.md 在子目录（如 skill-name/SKILL.md）→ prefix = "skill-name/"
	//    - SKILL.md 在根目录（如 SKILL.md）→ prefix = ""
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
		if strings.ToLower(filepath.Base(clean)) == "skill.md" {
			dir := path.Dir(clean)
			if dir != "." {
				prefix = dir + "/"
			}
			break
		}
	}

	// 2. 推断技能名：有 prefix 用目录名；无 prefix（SKILL.md 在根目录）用 zipName（压缩包名/ID）
	skillName := ""
	if prefix != "" {
		parts := strings.Split(strings.TrimSuffix(prefix, "/"), "/")
		if len(parts) > 0 {
			skillName = parts[len(parts)-1]
		}
	}
	if skillName == "" {
		skillName = strings.TrimSpace(zipName)
		if skillName == "" {
			skillName = "skill" // 无 zipName 时的兜底
		}
		// 去掉 .zip 后缀（若 zipName 含后缀）
		skillName = strings.TrimSuffix(strings.TrimSuffix(skillName, ".zip"), ".ZIP")
	}
	if skillName == "" || strings.Contains(skillName, "..") || strings.Contains(skillName, "/") || strings.Contains(skillName, "\\") {
		return "", fmt.Errorf("无效的技能名: %q", skillName)
	}

	managedDir := handlers.ResolveManagedSkillsDir(env)
	targetDir := filepath.Join(managedDir, skillName)
	_ = os.RemoveAll(targetDir)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", err
	}

	// 3. 解压文件：prefix 非空时只解压 prefix 下的；prefix 为空时解压全部
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
		// 跳过：空路径；或 prefix 非空时文件不在 prefix 目录下
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

	// 写入 .openocta-meta.json 记录 type/from
	meta := map[string]string{"type": typeVal, "from": fromVal}
	metaData, _ := json.MarshalIndent(meta, "", "  ")
	_ = os.WriteFile(filepath.Join(targetDir, ".openocta-meta.json"), metaData, 0644)

	return skillName, nil
}

// mcpSiteConfig 官网 MCP config.json 格式
type mcpSiteConfig map[string]struct {
	Enabled *bool             `json:"enabled"`
	Command string            `json:"command"`
	Args    []string          `json:"args"`
	Env     map[string]string `json:"env"`
}

// installMcp 从 zip 安装 MCP
func installMcp(zipData []byte, typeVal, fromVal string, env func(string) string) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return "", err
	}

	var configData []byte
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		if strings.ToLower(filepath.Base(f.Name)) == "config.json" {
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			configData, _ = io.ReadAll(io.LimitReader(rc, 1<<20))
			rc.Close()
			break
		}
	}
	if configData == nil {
		return "", fmt.Errorf("zip 必须包含 config.json")
	}

	var siteCfg mcpSiteConfig
	if err := json.Unmarshal(configData, &siteCfg); err != nil {
		return "", fmt.Errorf("config.json 格式错误: %w", err)
	}
	if len(siteCfg) == 0 {
		return "", fmt.Errorf("config.json 至少配置一个 MCP 服务器")
	}

	// 取第一个服务器作为主安装目标
	var firstKey string
	for k := range siteCfg {
		firstKey = k
		break
	}
	entry := siteCfg[firstKey]
	if entry.Command == "" || len(entry.Args) == 0 || entry.Env == nil {
		return "", fmt.Errorf("config.json 中 %q 必须包含 command、args、env", firstKey)
	}

	enabled := true
	if entry.Enabled != nil {
		enabled = *entry.Enabled
	}

	// Validate MCP command before writing to config (RCE prevention).
	if err := config.ValidateMcpCommand(entry.Command); err != nil {
		return "", fmt.Errorf("config.json 中 %q 的 command 无效: %w", firstKey, err)
	}

	mcpEntry := config.McpServerEntry{
		Command: entry.Command,
		Args:    entry.Args,
		Env:     entry.Env,
	}
	mcpEntry.Enabled = enabled

	// 合并到 openocta.json
	stateDir := paths.ResolveStateDir(env)
	configPath := paths.ResolveConfigPath(env, stateDir)
	snap, err := handlers.LoadConfigSnapshot(env)
	if err != nil {
		return "", err
	}
	cfgMap := handlers.ConfigSnapshotToMap(snap)
	if cfgMap == nil {
		cfgMap = map[string]interface{}{}
	}
	mcpRaw, _ := cfgMap["mcp"].(map[string]interface{})
	if mcpRaw == nil {
		mcpRaw = map[string]interface{}{}
		cfgMap["mcp"] = mcpRaw
	}
	serversRaw, _ := mcpRaw["servers"].(map[string]interface{})
	if serversRaw == nil {
		serversRaw = map[string]interface{}{}
		mcpRaw["servers"] = serversRaw
	}

	// 若 key 已存在则跳过（不覆盖用户配置），否则添加
	if _, exists := serversRaw[firstKey]; !exists {
		serversRaw[firstKey] = map[string]interface{}{
			"enabled": enabled,
			"command": mcpEntry.Command,
			"args":    mcpEntry.Args,
			"env":     mcpEntry.Env,
		}
	}

	if err := handlers.WriteConfigMap(configPath, cfgMap); err != nil {
		return "", err
	}

	// 安装记录已由 handleSiteInstall 统一写入 .install-metadata.json
	return firstKey, nil
}
