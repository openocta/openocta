//go:build windows

package http

import (
	"os/exec"
	"syscall"
)

func detachUninstallCmd(cmd *exec.Cmd) {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	// 彻底静默：隐藏窗口 + 脱离控制台 + Unicode 环境
	cmd.SysProcAttr.HideWindow = true
	cmd.SysProcAttr.CreationFlags = 0x08000000 | 0x00040000 | 0x00000008
}
