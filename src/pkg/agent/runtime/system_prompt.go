// Package runtime: system prompt building from ~/.openocta/workspace and ./prompt markdown (deduped by basename).
package runtime

import (
	"os"
	"path/filepath"
	"strings"
)

// PromptFile holds one loaded markdown file (name and content).
type PromptFile struct {
	Name    string
	Content string
}

// loadPromptMarkdownFiles loads .md from workspaceDir first, then from promptDir.
// Deduplication is by basename: first occurrence wins (workspace over prompt).
func loadPromptMarkdownFiles(workspaceDir, promptDir string) ([]PromptFile, error) {
	seen := make(map[string]bool)
	var out []PromptFile

	addDir := func(dir string) error {
		if dir == "" {
			return nil
		}
		entries, err := os.ReadDir(dir)
		if err != nil {
			if os.IsNotExist(err) {
				return nil
			}
			return err
		}
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			name := e.Name()
			if !strings.HasSuffix(strings.ToLower(name), ".md") {
				continue
			}
			base := filepath.Base(name)
			if seen[base] {
				continue
			}
			seen[base] = true
			path := filepath.Join(dir, name)
			content, err := os.ReadFile(path)
			if err != nil {
				continue
			}
			out = append(out, PromptFile{Name: base, Content: strings.TrimSpace(string(content))})
		}
		return nil
	}

	if err := addDir(workspaceDir); err != nil {
		return nil, err
	}
	if err := addDir(promptDir); err != nil {
		return nil, err
	}
	return out, nil
}

// SystemPromptOptions configures BuildSystemPrompt.
type SystemPromptOptions struct {
	// WorkspaceDir is the default prompt dir (e.g. ~/.openocta/workspace).
	WorkspaceDir string
	// ProjectRoot is the project root; prompt dir is ProjectRoot/prompt.
	ProjectRoot string
}

// BuildSystemPrompt builds a system prompt: fixed prefix (identity, tooling, safety, workspace)
// plus loaded markdown from WorkspaceDir and ProjectRoot/prompt, deduped by filename (workspace first).
func BuildSystemPrompt(opts SystemPromptOptions) (string, error) {
	promptDir := ""
	if opts.ProjectRoot != "" {
		promptDir = filepath.Join(opts.ProjectRoot, "prompt")
	}
	files, err := loadPromptMarkdownFiles(opts.WorkspaceDir, promptDir)
	if err != nil {
		return "", err
	}

	var b strings.Builder
	// Fixed prefix per OpenOcta docs (identity + Tooling + Safety + Workspace).
	b.WriteString("你是运行在 OpenOcta 中的个人助手。\n\n")
	b.WriteString("## 工具\n")
	b.WriteString("工具按策略过滤后可用，工具名区分大小写，请严格按所列名称调用。\n\n")
	b.WriteString("## 安全\n")
	b.WriteString("你没有独立目标：不追求自保、复制、获取资源或权力。\n")
	b.WriteString("优先考虑安全与人工监督；服从停止/暂停/审计请求，不得绕过安全措施。\n\n")
	b.WriteString("## 工作区\n")
	if opts.ProjectRoot != "" && opts.ProjectRoot != "." {
		b.WriteString("你的工作目录为：")
		b.WriteString(opts.ProjectRoot)
		b.WriteString("\n")
	}
	b.WriteString("除非另有明确说明，请将此目录视为文件操作的唯一全局工作区。\n\n")

	// Injected markdown (Project Context).
	if len(files) > 0 {
		b.WriteString("# 项目上下文\n\n")
		b.WriteString("已加载以下提示文件：\n\n")
		for _, f := range files {
			b.WriteString("## ")
			b.WriteString(f.Name)
			b.WriteString("\n\n")
			b.WriteString(f.Content)
			b.WriteString("\n\n")
		}
	}

	return strings.TrimSpace(b.String()), nil
}

// EnsureWorkspacePrompts ensures workspaceDir exists and, if it has no .md files,
// copies all .md files from promptSourceDir into workspaceDir (deploy-time sync).
func EnsureWorkspacePrompts(workspaceDir, promptSourceDir string) error {
	if err := os.MkdirAll(workspaceDir, 0750); err != nil {
		return err
	}
	// Check if workspace already has any .md files
	entries, err := os.ReadDir(workspaceDir)
	if err != nil {
		return err
	}
	hasMD := false
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(strings.ToLower(e.Name()), ".md") {
			hasMD = true
			break
		}
	}
	if hasMD {
		return nil
	}
	// Copy .md from promptSourceDir
	srcEntries, err := os.ReadDir(promptSourceDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	for _, e := range srcEntries {
		if e.IsDir() || !strings.HasSuffix(strings.ToLower(e.Name()), ".md") {
			continue
		}
		name := e.Name()
		src := filepath.Join(promptSourceDir, name)
		dst := filepath.Join(workspaceDir, name)
		data, err := os.ReadFile(src)
		if err != nil {
			continue
		}
		if err := os.WriteFile(dst, data, 0640); err != nil {
			return err
		}
	}
	return nil
}
