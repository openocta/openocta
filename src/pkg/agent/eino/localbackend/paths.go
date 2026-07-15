package localbackend

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// ResolveWritablePath maps model-supplied write paths onto a safe absolute path.
// Empty / "." become errors (Go's filepath.Clean("") == "." → "open .: is a directory").
// Relative paths join workspace. On Windows, bare volume-root files (e.g. C:\foo.ps1)
// are redirected into workspace because writing the drive root is usually Access denied.
func ResolveWritablePath(raw, workspace string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "." || raw == `.\` || raw == "./" {
		return "", fmt.Errorf(
			"file_path 不能为空（当前解析为工作目录 '.'）。请使用参数名 file_path（不要用 path/file），并写到工作区内，例如 \"%s\"",
			exampleWorkspaceFile(workspace, "script.ps1"),
		)
	}

	path := filepath.Clean(raw)
	if path == "." {
		return "", fmt.Errorf(
			"file_path 无效：%q。请提供具体文件路径，例如 \"%s\"",
			raw, exampleWorkspaceFile(workspace, "script.ps1"),
		)
	}

	ws := strings.TrimSpace(workspace)
	if ws == "" {
		ws, _ = os.Getwd()
	}
	if ws != "" {
		if abs, err := filepath.Abs(ws); err == nil {
			ws = abs
		}
	}

	if !filepath.IsAbs(path) {
		if ws == "" {
			return "", fmt.Errorf("file_path %q 是相对路径，但工作区未配置", raw)
		}
		path = filepath.Join(ws, path)
	}

	if runtime.GOOS == "windows" && ws != "" {
		if redirected, ok := redirectWindowsVolumeRootFile(path, ws); ok {
			path = redirected
		}
	}

	if info, err := os.Stat(path); err == nil && info.IsDir() {
		return "", fmt.Errorf("file_path %q 是目录，不能作为写入目标；请带上文件名", path)
	}

	return path, nil
}

func redirectWindowsVolumeRootFile(path, workspace string) (string, bool) {
	vol := filepath.VolumeName(path)
	if vol == "" {
		return "", false
	}
	rest := strings.TrimPrefix(path, vol)
	rest = strings.TrimPrefix(rest, `\`)
	rest = strings.TrimPrefix(rest, `/`)
	if rest == "" || strings.ContainsAny(rest, `/\`) {
		return "", false
	}
	// C:\weather.ps1 → <workspace>\weather.ps1
	return filepath.Join(workspace, rest), true
}

func exampleWorkspaceFile(workspace, name string) string {
	ws := strings.TrimSpace(workspace)
	if ws == "" {
		return name
	}
	return filepath.Join(ws, name)
}
