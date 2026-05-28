//go:build windows

package mcp

import (
	"os/exec"
	"syscall"
)

// Windows 下 MCP 子进程静默执行标志：
// CREATE_NO_WINDOW (0x08000000) — 不为子进程创建新的控制台窗口
// CREATE_UNICODE_ENVIRONMENT (0x00040000) — 使用 Unicode 环境块
// DETACHED_PROCESS (0x00000008) — 脱离父进程控制台，彻底避免黑框
const creationFlagsNoWindow = 0x08000000 | 0x00040000 | 0x00000008

func configureMCPCommand(cmd *exec.Cmd) {
	if cmd == nil {
		return
	}
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: creationFlagsNoWindow,
	}
}
