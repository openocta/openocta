package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/openocta/openocta/pkg/agent"
	"github.com/openocta/openocta/pkg/agent/knowledge"
	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/paths"
)

var (
	vaultWikiLinkRe = regexp.MustCompile(`\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]`)
	vaultMDLinkRe   = regexp.MustCompile(`\[[^\]]+\]\(([^)]+)\)`)
)

func vaultBlockedDir(name string) bool {
	if name == ".obsidian" || name == ".trash" {
		return true
	}
	return strings.HasPrefix(name, ".")
}

func vaultShouldSkipRel(rel string) bool {
	parts := strings.Split(filepath.ToSlash(rel), "/")
	for _, p := range parts {
		if vaultBlockedDir(p) {
			return true
		}
	}
	return false
}

func sanitizeVaultFolderPath(baseDir, relPath string) (string, error) {
	absBase, err := filepath.Abs(baseDir)
	if err != nil {
		return "", fmt.Errorf("invalid vault dir: %w", err)
	}
	cleanRel := filepath.Clean("/" + relPath)
	cleanRel = strings.TrimPrefix(cleanRel, string(filepath.Separator))
	if cleanRel == "" || cleanRel == "." {
		return "", fmt.Errorf("invalid folder path")
	}
	if vaultShouldSkipRel(cleanRel) {
		return "", fmt.Errorf("path not allowed")
	}
	absTarget := filepath.Join(absBase, cleanRel)
	if !isSubpath(absBase, absTarget) {
		return "", fmt.Errorf("folder path escapes vault directory")
	}
	return absTarget, nil
}

func sanitizeVaultFilePath(baseDir, relPath string) (string, error) {
	absBase, err := filepath.Abs(baseDir)
	if err != nil {
		return "", fmt.Errorf("invalid vault dir: %w", err)
	}
	cleanRel := filepath.Clean("/" + relPath)
	cleanRel = strings.TrimPrefix(cleanRel, string(filepath.Separator))
	if cleanRel == "" || cleanRel == "." {
		return "", fmt.Errorf("invalid file path")
	}
	if vaultShouldSkipRel(cleanRel) {
		return "", fmt.Errorf("path not allowed")
	}
	if !strings.EqualFold(filepath.Ext(cleanRel), ".md") {
		return "", fmt.Errorf("only .md files are allowed")
	}
	absTarget := filepath.Join(absBase, cleanRel)
	if !isSubpath(absBase, absTarget) {
		return "", fmt.Errorf("file path escapes vault directory")
	}
	return absTarget, nil
}

func loadVaultConfig(env func(string) string) (*config.OpenOctaConfig, error) {
	if env == nil {
		env = func(k string) string { return os.Getenv(k) }
	}
	return config.Load(env)
}

func resolveVaultDirFromParams(cfg *config.OpenOctaConfig, params map[string]interface{}, env func(string) string) (string, error) {
	agentID := ""
	if v, ok := params["agentId"].(string); ok {
		agentID = strings.TrimSpace(v)
	}
	if agentID == "" {
		if v, ok := params["agentID"].(string); ok {
			agentID = strings.TrimSpace(v)
		}
	}
	dir := agent.ResolveVaultDir(cfg, agentID, env)
	if strings.TrimSpace(dir) == "" {
		return "", fmt.Errorf("vault directory not configured")
	}
	return dir, nil
}

func vaultTitleFromBody(relPath, body string) string {
	for _, line := range strings.Split(body, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "# ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "# "))
		}
	}
	base := strings.TrimSuffix(filepath.Base(relPath), filepath.Ext(relPath))
	return base
}

func listVaultMarkdownFiles(vaultDir string) ([]string, error) {
	var files []string
	absBase, err := filepath.Abs(vaultDir)
	if err != nil {
		return nil, err
	}
	err = filepath.Walk(absBase, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return nil
		}
		if info.IsDir() {
			if vaultBlockedDir(filepath.Base(path)) && path != absBase {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.EqualFold(filepath.Ext(path), ".md") {
			return nil
		}
		rel, err := filepath.Rel(absBase, path)
		if err != nil {
			return nil
		}
		rel = filepath.ToSlash(rel)
		if vaultShouldSkipRel(rel) {
			return nil
		}
		files = append(files, rel)
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Strings(files)
	return files, nil
}

type vaultFileEntry struct {
	Path  string `json:"path"`
	Title string `json:"title"`
}

type vaultFolderEntry struct {
	Path string `json:"path"`
}

func listVaultFolders(vaultDir string) ([]string, error) {
	absBase, err := filepath.Abs(vaultDir)
	if err != nil {
		return nil, err
	}
	var folders []string
	err = filepath.Walk(absBase, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return nil
		}
		if !info.IsDir() {
			return nil
		}
		if path == absBase {
			return nil
		}
		base := filepath.Base(path)
		if vaultBlockedDir(base) {
			return filepath.SkipDir
		}
		rel, err := filepath.Rel(absBase, path)
		if err != nil {
			return nil
		}
		rel = filepath.ToSlash(rel)
		if vaultShouldSkipRel(rel) {
			return filepath.SkipDir
		}
		folders = append(folders, rel)
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Strings(folders)
	return folders, nil
}

func buildVaultFileEntries(vaultDir string, paths []string) ([]vaultFileEntry, error) {
	out := make([]vaultFileEntry, 0, len(paths))
	for _, rel := range paths {
		abs, err := sanitizeVaultFilePath(vaultDir, rel)
		if err != nil {
			continue
		}
		body, err := os.ReadFile(abs)
		title := rel
		if err == nil {
			title = vaultTitleFromBody(rel, string(body))
		}
		out = append(out, vaultFileEntry{Path: rel, Title: title})
	}
	return out, nil
}

type vaultGraphNode struct {
	ID    string `json:"id"`
	Path  string `json:"path"`
	Title string `json:"title"`
}

type vaultGraphEdge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Kind   string `json:"kind"`
}

func vaultLookupKeys(path string) []string {
	slash := filepath.ToSlash(path)
	base := strings.TrimSuffix(filepath.Base(slash), filepath.Ext(slash))
	keys := []string{
		strings.ToLower(slash),
		strings.ToLower(strings.TrimSuffix(slash, filepath.Ext(slash))),
		strings.ToLower(base),
	}
	return keys
}

func buildVaultPathIndex(entries []vaultFileEntry) map[string]string {
	idx := map[string]string{}
	for _, e := range entries {
		for _, k := range vaultLookupKeys(e.Path) {
			if k != "" {
				if _, ok := idx[k]; !ok {
					idx[k] = e.Path
				}
			}
		}
	}
	return idx
}

func resolveVaultLinkTarget(raw string, idx map[string]string) string {
	target := strings.TrimSpace(raw)
	if target == "" {
		return ""
	}
	if strings.Contains(target, "://") {
		return ""
	}
	target = strings.SplitN(target, "#", 2)[0]
	target = strings.TrimSpace(target)
	if target == "" {
		return ""
	}
	target = filepath.ToSlash(target)
	if strings.HasPrefix(target, "./") {
		target = target[2:]
	}
	lower := strings.ToLower(target)
	if path, ok := idx[lower]; ok {
		return path
	}
	if !strings.EqualFold(filepath.Ext(target), ".md") {
		if path, ok := idx[strings.ToLower(target)]; ok {
			return path
		}
		withMD := lower + ".md"
		if path, ok := idx[withMD]; ok {
			return path
		}
	}
	return ""
}

func extractVaultLinks(body string) (wikilinks []string, mdlinks []string) {
	for _, m := range vaultWikiLinkRe.FindAllStringSubmatch(body, -1) {
		if len(m) > 1 {
			wikilinks = append(wikilinks, strings.TrimSpace(m[1]))
		}
	}
	for _, m := range vaultMDLinkRe.FindAllStringSubmatch(body, -1) {
		if len(m) > 1 {
			mdlinks = append(mdlinks, strings.TrimSpace(m[1]))
		}
	}
	return wikilinks, mdlinks
}

// VaultStatusHandler handles "vault.status".
func VaultStatusHandler(opts HandlerOpts) error {
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	agent.EnsureVaultDir(vaultDir)
	files, err := listVaultMarkdownFiles(vaultDir)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	chunkCount, lastSyncedAt := vaultIndexStats(env)
	opts.Respond(true, map[string]interface{}{
		"vaultDir":     vaultDir,
		"fileCount":    len(files),
		"chunkCount":   chunkCount,
		"lastSyncedAt": lastSyncedAt,
		"enabled":      true,
	}, nil, nil)
	return nil
}

// VaultListFilesHandler handles "vault.listFiles".
func VaultListFilesHandler(opts HandlerOpts) error {
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	agent.EnsureVaultDir(vaultDir)
	paths, err := listVaultMarkdownFiles(vaultDir)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	entries, err := buildVaultFileEntries(vaultDir, paths)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	folderPaths, err := listVaultFolders(vaultDir)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	folders := make([]vaultFolderEntry, 0, len(folderPaths))
	for _, p := range folderPaths {
		folders = append(folders, vaultFolderEntry{Path: p})
	}
	opts.Respond(true, map[string]interface{}{
		"vaultDir": vaultDir,
		"files":    entries,
		"folders":  folders,
	}, nil, nil)
	return nil
}

// VaultGetFileHandler handles "vault.getFile".
func VaultGetFileHandler(opts HandlerOpts) error {
	filePath, _ := opts.Params["filePath"].(string)
	filePath = strings.TrimSpace(filePath)
	if filePath == "" {
		if p, ok := opts.Params["path"].(string); ok {
			filePath = strings.TrimSpace(p)
		}
	}
	if filePath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "filePath is required"}, nil)
		return nil
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	abs, err := sanitizeVaultFilePath(vaultDir, filePath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	body, err := os.ReadFile(abs)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	rel := filepath.ToSlash(filePath)
	opts.Respond(true, map[string]interface{}{
		"path":    rel,
		"title":   vaultTitleFromBody(rel, string(body)),
		"content": string(body),
	}, nil, nil)
	return nil
}

// VaultSaveFileHandler handles "vault.saveFile".
func VaultSaveFileHandler(opts HandlerOpts) error {
	filePath, _ := opts.Params["filePath"].(string)
	filePath = strings.TrimSpace(filePath)
	content, _ := opts.Params["content"].(string)
	if filePath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "filePath is required"}, nil)
		return nil
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	abs, err := sanitizeVaultFilePath(vaultDir, filePath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	if err := os.WriteFile(abs, []byte(content), 0o644); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true, "path": filepath.ToSlash(filePath)}, nil, nil)
	return nil
}

// VaultMkdirHandler handles "vault.mkdir".
func VaultMkdirHandler(opts HandlerOpts) error {
	folderPath, _ := opts.Params["folderPath"].(string)
	folderPath = strings.TrimSpace(folderPath)
	if folderPath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "folderPath is required"}, nil)
		return nil
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	agent.EnsureVaultDir(vaultDir)
	abs, err := sanitizeVaultFolderPath(vaultDir, folderPath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	if _, err := os.Stat(abs); err == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "folder already exists"}, nil)
		return nil
	} else if !os.IsNotExist(err) {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	if err := os.Mkdir(abs, 0o755); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true, "folderPath": filepath.ToSlash(folderPath)}, nil, nil)
	return nil
}

// VaultCreateFileHandler handles "vault.createFile".
func VaultCreateFileHandler(opts HandlerOpts) error {
	filePath, _ := opts.Params["filePath"].(string)
	filePath = strings.TrimSpace(filePath)
	content, _ := opts.Params["content"].(string)
	if filePath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "filePath is required"}, nil)
		return nil
	}
	if !strings.EqualFold(filepath.Ext(filePath), ".md") {
		filePath += ".md"
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	agent.EnsureVaultDir(vaultDir)
	abs, err := sanitizeVaultFilePath(vaultDir, filePath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	if _, err := os.Stat(abs); err == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "file already exists"}, nil)
		return nil
	} else if !os.IsNotExist(err) {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	if strings.TrimSpace(content) == "" {
		title := strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))
		content = "# " + title + "\n\n"
	}
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	if err := os.WriteFile(abs, []byte(content), 0o644); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	rel := filepath.ToSlash(filePath)
	opts.Respond(true, map[string]interface{}{
		"ok":      true,
		"path":    rel,
		"title":   vaultTitleFromBody(rel, content),
		"content": content,
	}, nil, nil)
	return nil
}

// VaultSyncHandler handles "vault.sync" — rebuilds the knowledge index and evicts pooled runtimes.
func VaultSyncHandler(opts HandlerOpts) error {
	if !knowledgeEnabledForVault(opts) {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "knowledge is disabled"}, nil)
		return nil
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	agentID := ""
	if v, ok := opts.Params["agentId"].(string); ok {
		agentID = strings.TrimSpace(v)
	}
	runtime.EvictAllSessionRuntimes()
	fileCount, chunkCount, err := runtime.RebuildKnowledgeIndex(context.Background(), cfg, agentID)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{
		"ok":         true,
		"fileCount":  fileCount,
		"chunkCount": chunkCount,
	}, nil, nil)
	return nil
}

func knowledgeEnabledForVault(opts HandlerOpts) bool {
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil || cfg == nil {
		return true
	}
	if cfg.Agents == nil || cfg.Agents.Defaults == nil || cfg.Agents.Defaults.Knowledge == nil {
		return true
	}
	if cfg.Agents.Defaults.Knowledge.Enabled == nil {
		return true
	}
	return *cfg.Agents.Defaults.Knowledge.Enabled
}

// VaultGraphHandler handles "vault.graph".
func VaultGraphHandler(opts HandlerOpts) error {
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	paths, err := listVaultMarkdownFiles(vaultDir)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	entries, err := buildVaultFileEntries(vaultDir, paths)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	idx := buildVaultPathIndex(entries)
	nodes := make([]vaultGraphNode, 0, len(entries))
	for _, e := range entries {
		nodes = append(nodes, vaultGraphNode{ID: e.Path, Path: e.Path, Title: e.Title})
	}
	edgeSet := map[string]vaultGraphEdge{}
	for _, e := range entries {
		abs, err := sanitizeVaultFilePath(vaultDir, e.Path)
		if err != nil {
			continue
		}
		body, err := os.ReadFile(abs)
		if err != nil {
			continue
		}
		wiki, md := extractVaultLinks(string(body))
		for _, raw := range wiki {
			target := resolveVaultLinkTarget(raw, idx)
			if target == "" || target == e.Path {
				continue
			}
			key := e.Path + "->" + target + ":wiki"
			edgeSet[key] = vaultGraphEdge{Source: e.Path, Target: target, Kind: "wiki"}
		}
		for _, raw := range md {
			if !strings.HasSuffix(strings.ToLower(raw), ".md") && !strings.Contains(raw, "/") {
				// allow wikilink-style md targets without extension
			}
			target := resolveVaultLinkTarget(raw, idx)
			if target == "" || target == e.Path {
				continue
			}
			key := e.Path + "->" + target + ":md"
			edgeSet[key] = vaultGraphEdge{Source: e.Path, Target: target, Kind: "markdown"}
		}
	}
	edges := make([]vaultGraphEdge, 0, len(edgeSet))
	for _, edge := range edgeSet {
		edges = append(edges, edge)
	}
	sort.Slice(edges, func(i, j int) bool {
		if edges[i].Source != edges[j].Source {
			return edges[i].Source < edges[j].Source
		}
		return edges[i].Target < edges[j].Target
	})
	opts.Respond(true, map[string]interface{}{
		"vaultDir": vaultDir,
		"nodes":    nodes,
		"edges":    edges,
	}, nil, nil)
	return nil
}

func vaultIndexStats(env func(string) string) (chunkCount int, lastSyncedAt string) {
	if env == nil {
		env = func(k string) string { return os.Getenv(k) }
	}
	stateDir := paths.ResolveStateDir(env)
	corpusPath := filepath.Join(stateDir, "knowledge-index", "corpus.json")
	if info, err := os.Stat(corpusPath); err == nil {
		lastSyncedAt = info.ModTime().UTC().Format(time.RFC3339)
	}
	data, err := os.ReadFile(corpusPath)
	if err != nil {
		return 0, lastSyncedAt
	}
	var payload struct {
		Docs []struct {
			Kind string `json:"kind"`
		} `json:"docs"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		return 0, lastSyncedAt
	}
	for _, d := range payload.Docs {
		if d.Kind == knowledge.KindDocument {
			chunkCount++
		}
	}
	return chunkCount, lastSyncedAt
}

func vaultKnowledgeIndexDir(env func(string) string) string {
	if env == nil {
		env = func(k string) string { return os.Getenv(k) }
	}
	return filepath.Join(paths.ResolveStateDir(env), "knowledge-index")
}

// VaultDeleteFileHandler handles "vault.deleteFile".
func VaultDeleteFileHandler(opts HandlerOpts) error {
	filePath, _ := opts.Params["filePath"].(string)
	filePath = strings.TrimSpace(filePath)
	if filePath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "filePath is required"}, nil)
		return nil
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	abs, err := sanitizeVaultFilePath(vaultDir, filePath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	if err := os.Remove(abs); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

// VaultRenameFileHandler handles "vault.renameFile".
func VaultRenameFileHandler(opts HandlerOpts) error {
	fromPath, _ := opts.Params["fromPath"].(string)
	toPath, _ := opts.Params["toPath"].(string)
	fromPath = strings.TrimSpace(fromPath)
	toPath = strings.TrimSpace(toPath)
	if fromPath == "" || toPath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "fromPath and toPath are required"}, nil)
		return nil
	}
	if !strings.EqualFold(filepath.Ext(toPath), ".md") {
		toPath += ".md"
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	fromAbs, err := sanitizeVaultFilePath(vaultDir, fromPath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	toAbs, err := sanitizeVaultFilePath(vaultDir, toPath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	if _, err := os.Stat(fromAbs); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "source file not found"}, nil)
		return nil
	}
	if _, err := os.Stat(toAbs); err == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "target file already exists"}, nil)
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(toAbs), 0o755); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	if err := os.Rename(fromAbs, toAbs); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true, "path": filepath.ToSlash(toPath)}, nil, nil)
	return nil
}

// VaultRenameFolderHandler handles "vault.renameFolder".
func VaultRenameFolderHandler(opts HandlerOpts) error {
	fromPath, _ := opts.Params["fromPath"].(string)
	toPath, _ := opts.Params["toPath"].(string)
	fromPath = strings.TrimSpace(fromPath)
	toPath = strings.TrimSpace(toPath)
	if fromPath == "" || toPath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "fromPath and toPath are required"}, nil)
		return nil
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	fromAbs, err := sanitizeVaultFolderPath(vaultDir, fromPath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	toAbs, err := sanitizeVaultFolderPath(vaultDir, toPath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	if _, err := os.Stat(fromAbs); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "source folder not found"}, nil)
		return nil
	}
	if _, err := os.Stat(toAbs); err == nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "target folder already exists"}, nil)
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(toAbs), 0o755); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	if err := os.Rename(fromAbs, toAbs); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true, "folderPath": filepath.ToSlash(toPath)}, nil, nil)
	return nil
}

// VaultDeleteFolderHandler handles "vault.deleteFolder".
func VaultDeleteFolderHandler(opts HandlerOpts) error {
	folderPath, _ := opts.Params["folderPath"].(string)
	folderPath = strings.TrimSpace(folderPath)
	if folderPath == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "folderPath is required"}, nil)
		return nil
	}
	confirm := false
	if v, ok := opts.Params["confirm"].(bool); ok {
		confirm = v
	}
	env := func(k string) string { return os.Getenv(k) }
	cfg, err := loadVaultConfig(env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	vaultDir, err := resolveVaultDirFromParams(cfg, opts.Params, env)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	abs, err := sanitizeVaultFolderPath(vaultDir, folderPath)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: err.Error()}, nil)
		return nil
	}
	entries, err := os.ReadDir(abs)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	if len(entries) > 0 && !confirm {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "folder is not empty"}, nil)
		return nil
	}
	if err := os.RemoveAll(abs); err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	opts.Respond(true, map[string]interface{}{"ok": true}, nil, nil)
	return nil
}

type vaultSearchResult struct {
	Path      string  `json:"path"`
	Title     string  `json:"title"`
	Snippet   string  `json:"snippet"`
	Score     float64 `json:"score"`
	StartLine int     `json:"startLine"`
	EndLine   int     `json:"endLine"`
}

// VaultSearchHandler handles "vault.search".
func VaultSearchHandler(opts HandlerOpts) error {
	if !knowledgeEnabledForVault(opts) {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "knowledge is disabled"}, nil)
		return nil
	}
	query, _ := opts.Params["query"].(string)
	query = strings.TrimSpace(query)
	if query == "" {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInvalidRequest, Message: "query is required"}, nil)
		return nil
	}
	limit := 20
	switch v := opts.Params["limit"].(type) {
	case float64:
		if v > 0 {
			limit = int(v)
		}
	case int:
		if v > 0 {
			limit = v
		}
	case string:
		if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil && n > 0 {
			limit = n
		}
	}
	env := func(k string) string { return os.Getenv(k) }
	indexDir := vaultKnowledgeIndexDir(env)
	eng, release, err := knowledge.AcquireEngine(indexDir, nil)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	defer release()
	kinds := map[string]struct{}{knowledge.KindDocument: {}}
	hits, err := eng.SearchIndex(context.Background(), query, kinds, limit)
	if err != nil {
		opts.Respond(false, nil, &protocol.ErrorShape{Code: protocol.ErrCodeInternal, Message: err.Error()}, nil)
		return nil
	}
	results := make([]vaultSearchResult, 0, len(hits))
	for _, h := range hits {
		path := h.Meta["path"]
		startLine := 1
		endLine := 1
		if s := h.Meta["start_line"]; s != "" {
			if n, err := strconv.Atoi(s); err == nil {
				startLine = n
			}
		}
		if s := h.Meta["end_line"]; s != "" {
			if n, err := strconv.Atoi(s); err == nil {
				endLine = n
			}
		}
		title := h.Title
		if title == "" {
			title = path
		}
		results = append(results, vaultSearchResult{
			Path:      path,
			Title:     title,
			Snippet:   h.Snippet,
			Score:     h.Score,
			StartLine: startLine,
			EndLine:   endLine,
		})
	}
	opts.Respond(true, map[string]interface{}{"results": results}, nil, nil)
	return nil
}
