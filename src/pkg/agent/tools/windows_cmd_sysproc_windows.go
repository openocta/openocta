//go:build windows

package tools

import (
	"os/exec"
	"syscall"
)

func applyExecNoWindow(cmd *exec.Cmd) {
	if cmd == nil {
		return
	}

	// Windows 下彻底静默无窗口执行：
	// CREATE_NO_WINDOW (0x08000000) — 不为子进程创建新的控制台窗口
	// CREATE_UNICODE_ENVIRONMENT (0x00040000) — 使用 Unicode 环境块
	// DETACHED_PROCESS (0x00000008) — 脱离父进程控制台
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}
}
