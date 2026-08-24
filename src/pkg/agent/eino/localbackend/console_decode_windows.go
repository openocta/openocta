//go:build windows

package localbackend

import "golang.org/x/sys/windows"

func decodeWindowsConsoleOutput(b []byte) string {
	return decodeConsoleOutputBytes(b, windows.GetACP())
}

func decodeWindowsConsoleOutputString(s string) string {
	return decodeWindowsConsoleOutput([]byte(s))
}
