//go:build windows

package runtime

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func preferGitBashOnWindows() {
	bash := findGitBashForPath()
	if bash == "" {
		return
	}
	binDir := filepath.Dir(bash)
	pathEnv := os.Getenv("PATH")
	if pathHasDir(pathEnv, binDir) {
		return
	}
	_ = os.Setenv("PATH", binDir+string(os.PathListSeparator)+pathEnv)
}

func findGitBashForPath() string {
	for _, p := range commonGitBashPathsForRuntime() {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	for _, name := range []string{"git.exe", "git"} {
		git, err := exec.LookPath(name)
		if err != nil || strings.TrimSpace(git) == "" {
			continue
		}
		for _, p := range gitBashPathsFromGitForRuntime(git) {
			if st, err := os.Stat(p); err == nil && !st.IsDir() {
				return p
			}
		}
	}
	return ""
}

func commonGitBashPathsForRuntime() []string {
	var out []string
	for _, root := range []string{
		os.Getenv("ProgramFiles"),
		os.Getenv("ProgramFiles(x86)"),
		os.Getenv("LocalAppData"),
	} {
		root = strings.TrimSpace(root)
		if root == "" {
			continue
		}
		out = append(out, filepath.Join(root, "Git", "bin", "bash.exe"))
		out = append(out, filepath.Join(root, "Git", "usr", "bin", "bash.exe"))
	}
	return out
}

func gitBashPathsFromGitForRuntime(gitPath string) []string {
	dir := filepath.Dir(strings.TrimSpace(gitPath))
	root := filepath.Dir(dir)
	return []string{
		filepath.Join(root, "bin", "bash.exe"),
		filepath.Join(root, "usr", "bin", "bash.exe"),
	}
}

func pathHasDir(pathEnv, dir string) bool {
	want := strings.ToLower(filepath.Clean(dir))
	for _, part := range filepath.SplitList(pathEnv) {
		if strings.ToLower(filepath.Clean(part)) == want {
			return true
		}
	}
	return false
}
