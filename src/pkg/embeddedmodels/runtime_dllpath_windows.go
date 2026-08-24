//go:build windows

package embeddedmodels

import (
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/sys/windows"
)

// prepareLlamaLibSearchPath makes sibling DLLs in libDir discoverable when
// LoadLibrary loads ggml.dll / llama.dll by absolute path.
//
// On Windows, syscall.LoadLibrary (used by yzma/ffi) does not automatically
// search the directory of the loaded DLL for its dependencies. macOS dylibs
// typically resolve via @loader_path / @rpath, so the same layout works there.
func prepareLlamaLibSearchPath(libDir string) error {
	abs, err := filepath.Abs(libDir)
	if err != nil {
		abs = libDir
	}

	// Prepend to PATH so nested dependency lookups (and some CUDA/runtime
	// DLLs) also resolve when SetDllDirectory alone is insufficient.
	pathEnv := os.Getenv("PATH")
	lowerPath := strings.ToLower(pathEnv)
	lowerAbs := strings.ToLower(abs)
	already := false
	for _, p := range strings.Split(lowerPath, string(os.PathListSeparator)) {
		if p == lowerAbs {
			already = true
			break
		}
	}
	if !already {
		_ = os.Setenv("PATH", abs+string(os.PathListSeparator)+pathEnv)
	}

	return windows.SetDllDirectory(abs)
}
