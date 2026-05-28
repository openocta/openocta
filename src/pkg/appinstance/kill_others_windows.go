//go:build windows

package appinstance

import (
	"os"
	"os/exec"
	"strconv"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

func parentPIDsToPreserve() []int {
	p := windowsParentProcessID()
	if p <= 0 {
		return nil
	}
	return []int{p}
}

func windowsParentProcessID() int {
	snap, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return -1
	}
	defer windows.CloseHandle(snap)

	self := uint32(os.Getpid())
	var pe windows.ProcessEntry32
	pe.Size = uint32(unsafe.Sizeof(pe))
	if err := windows.Process32First(snap, &pe); err != nil {
		return -1
	}
	for {
		if pe.ProcessID == self {
			return int(pe.ParentProcessID)
		}
		if err := windows.Process32Next(snap, &pe); err != nil {
			break
		}
	}
	return -1
}

func findOtherInstancePIDs(skip map[int]struct{}) []int {
	snap, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return nil
	}
	defer windows.CloseHandle(snap)

	var pe windows.ProcessEntry32
	pe.Size = uint32(unsafe.Sizeof(pe))
	if err := windows.Process32First(snap, &pe); err != nil {
		return nil
	}
	var pids []int
	for {
		pid := int(pe.ProcessID)
		if _, omit := skip[pid]; !omit && isOurProcessBase(windows.UTF16ToString(pe.ExeFile[:])) {
			pids = append(pids, pid)
		}
		if err := windows.Process32Next(snap, &pe); err != nil {
			break
		}
	}
	return pids
}

func terminatePIDs(pids []int) {
	for _, pid := range pids {
		cmd := exec.Command("taskkill", "/F", "/PID", strconv.Itoa(pid))
		// 静默执行，避免 taskkill 黑框闪烁
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow:    true,
			CreationFlags: 0x08000000 | 0x00040000 | 0x00000008,
		}
		_ = cmd.Run()
	}
}
