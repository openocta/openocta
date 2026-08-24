//go:build windows

package embeddedmodels

import (
	"fmt"
	"strings"
	"sync"

	"golang.org/x/sys/windows"
)

// Official Microsoft Visual C++ 2015–2022 Redistributable (x64).
const vcRedistX64URL = "https://aka.ms/vs/17/release/vc_redist.x64.exe"

// ggml/llama Windows builds link against the MSVC runtime. Dependencies.exe
// may also list many api-ms-win-* API sets as "missing"; those are normally
// resolved by the OS loader and are not actionable. The reliable check is
// whether LoadLibrary can find the VC++ redistributable DLLs.
var vcRuntimeDLLs = []string{
	"VCRUNTIME140.dll",
	"MSVCP140.dll",
}

var (
	vcRuntimeOnce sync.Once
	vcRuntimeErr  error
)

// checkWindowsVCRuntime reports a clear install hint when the MSVC runtime
// required by ggml.dll is not present on the machine.
func checkWindowsVCRuntime() error {
	vcRuntimeOnce.Do(func() {
		var missing []string
		for _, name := range vcRuntimeDLLs {
			h, err := windows.LoadLibrary(name)
			if err != nil {
				missing = append(missing, name)
				continue
			}
			_ = windows.FreeLibrary(h)
		}
		if len(missing) == 0 {
			return
		}
		vcRuntimeErr = fmt.Errorf(
			"缺少 Visual C++ 运行库（%s）。请安装 Microsoft Visual C++ Redistributable 2015-2022 (x64) 后重试：%s",
			strings.Join(missing, ", "),
			vcRedistX64URL,
		)
	})
	return vcRuntimeErr
}
