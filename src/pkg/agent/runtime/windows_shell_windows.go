//go:build windows

package runtime

import (
	"os"
	"strings"
)

func preferGitBashOnWindows() {
	// PowerShell 已在系统 PATH 中，无需额外设置
	// 此函数保留用于兼容性，实际逻辑为空
}

func pathHasDir(pathEnv, dir string) bool {
	want := strings.ToLower(dir)
	for _, part := range strings.Split(pathEnv, string(os.PathListSeparator)) {
		if strings.ToLower(part) == want {
			return true
		}
	}
	return false
}
