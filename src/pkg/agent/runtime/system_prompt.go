// Package runtime: system prompt building from ~/.openocta/workspace/prompt and ./prompt markdown (deduped by basename).
package runtime

import (
	"os"
	"path/filepath"
	"runtime"
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
	if promptDir != "" {
		if err := addDir(filepath.Join(promptDir, "prompt-zh")); err != nil {
			return nil, err
		}
	}
	if workspaceDir != "" {
		if err := addDir(filepath.Join(workspaceDir, "prompt", "prompt-zh")); err != nil {
			return nil, err
		}
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
	b.WriteString("## Bash / execute 命令执行\n")
	b.WriteString("调用 **execute** 工具时，`command` 参数必须是**单行、可直接执行**的完整命令：\n")
	b.WriteString("- **禁止**在 command 中使用换行符（`\\n`）；多步操作用 `;` 或 `&&` 写在同一行\n")
	b.WriteString("- **禁止**在 command 中嵌入超长脚本（建议 inline 命令 < 800 字符）；过长会导致 tool arguments JSON 被模型截断（finish_reason=length）而无法执行\n")
	b.WriteString("- 长脚本流程：先用 **write_file** 写入 `.ps1`/`.sh`，再 `execute(command=\"powershell -NoProfile -ExecutionPolicy Bypass -File \\\"<绝对路径>\\\"\")`\n")
	b.WriteString("- Windows 进程/桌面类任务优先用 **desktop-control** skill 自带脚本（如 `process-manager.ps1`），不要手写同等的大段 inline PowerShell\n")
	b.WriteString("- 含空格的路径用双引号包裹；避免在 `powershell -Command \"...\"` 里塞整段脚本（`$` 变量易被外层 shell 吃掉且 JSON 极易超长）\n")
	b.WriteString("- 示例：`execute(command=\"npm test && npm run build\")`\n")
	b.WriteString("单次 bash 默认硬超时约 **10 秒**（可由配置上调，但请假设交互场景时间很紧）。\n")
	b.WriteString("生成命令时**避免全量扫描**，优先用带范围、带过滤的快速命令：\n")
	b.WriteString("- 监听端口：用 `lsof -iTCP -sTCP:LISTEN -P -n` 或 `ss -lntp`，**禁止** `lsof -i -P` 这类无过滤全扫描\n")
	b.WriteString("- 查文件：限定目录与深度，如 `find ./src -maxdepth 3 -name '*.go'`，**禁止**从 `/` 或无边界递归\n")
	b.WriteString("- 进程/连接：加过滤（`grep`、`-p`、具体 PID/端口），避免 `ps aux` + 管道全表扫描当首选\n")
	b.WriteString("- 网络信息：分别用 `ifconfig`/`ip addr`、`netstat -rn`/`ip route` 等轻量命令，不要一条命令扫遍全系统\n")
	b.WriteString("若任务确实需要更长时间，应拆成多步、缩小范围，或先向用户说明；不要依赖默认超时撑过长任务。\n\n")
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

	if runtime.GOOS == "windows" {
		b.WriteString("## Windows shell policy\n")
		b.WriteString("Current OS is Windows. execute 的 command 必须是一行完整命令，不要换行；cmd.exe 会在换行处截断后续内容。\n")
		b.WriteString("Native PowerShell 优先 `-File` 脚本而非 `-Command` 内联；进程监控/窗口控制优先 desktop-control skill。\n")
		b.WriteString("write_file / edit_file / read_file 必须使用参数名 **file_path**（不要用 path/file），且指向工作区内的具体文件；禁止空路径、`.`、或写入 `C:\\\\` 盘根（如 `C:\\\\weather.ps1`，通常会 Access denied）。\n")
		b.WriteString("If tool result mentions truncated JSON / finish_reason=length, shorten the command or switch to write_file + -File — never retry with a longer inline script.\n\n")
	}

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

// EnsureWorkspacePrompts ensures workspaceDir exists and copies default prompts.
//
// Default behavior (to avoid mixing generated files into system prompts):
//   - ensure prompt markdown lives under: <workspaceDir>/prompt/
//   - copy from promptSourceDir into <workspaceDir>/prompt/ when that dir has no .md files.
func EnsureWorkspacePrompts(workspaceDir, promptSourceDir string) error {
	promptDir := filepath.Join(workspaceDir, "prompt")
	if err := os.MkdirAll(promptDir, 0750); err != nil {
		return err
	}

	// Check if workspace prompt already has any .md files.
	entries, err := os.ReadDir(promptDir)
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
		dst := filepath.Join(promptDir, name)
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
