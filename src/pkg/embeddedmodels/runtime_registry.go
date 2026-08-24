package embeddedmodels

import (
	"fmt"
	"net"
	"sync"

	"github.com/hybridgroup/yzma/pkg/llama"
)

var (
	activeRuntimeMu sync.Mutex
	activeRuntimes  = map[string]*runtimeInstance{}

	llamaLibMu   sync.Mutex
	llamaLibRefs int
)

type runtimeSnapshot struct {
	ModelID  string
	Kind     ModelKind
	Port     int
	Endpoint string
}

func acquireLlamaLib(libDir string) error {
	llamaLibMu.Lock()
	defer llamaLibMu.Unlock()
	if llamaLibRefs == 0 {
		if err := checkWindowsVCRuntime(); err != nil {
			return err
		}
		// Windows: sibling DLLs next to ggml.dll are not on LoadLibrary's default
		// search path; register libDir first or Load fails with "module not found".
		if err := prepareLlamaLibSearchPath(libDir); err != nil {
			return fmt.Errorf("设置推理库搜索路径失败: %w", err)
		}
		if err := llama.Load(libDir); err != nil {
			return fmt.Errorf("%w（若已安装 VC++ 运行库仍失败，请确认 yzma-lib 完整，或向社区反馈）", err)
		}
		llama.LogSet(llama.LogSilent())
		llama.Init()
	}
	llamaLibRefs++
	return nil
}

func releaseLlamaLib() {
	llamaLibMu.Lock()
	defer llamaLibMu.Unlock()
	if llamaLibRefs <= 0 {
		return
	}
	llamaLibRefs--
	if llamaLibRefs == 0 {
		llama.Close()
	}
}

func getRuntime(modelID string) (*runtimeInstance, bool) {
	activeRuntimeMu.Lock()
	defer activeRuntimeMu.Unlock()
	inst, ok := activeRuntimes[modelID]
	return inst, ok
}

func registerRuntime(inst *runtimeInstance) {
	activeRuntimeMu.Lock()
	activeRuntimes[inst.modelID] = inst
	activeRuntimeMu.Unlock()
}

func unregisterRuntime(modelID string) {
	activeRuntimeMu.Lock()
	delete(activeRuntimes, modelID)
	activeRuntimeMu.Unlock()
}

func listRuntimeSnapshots() []runtimeSnapshot {
	activeRuntimeMu.Lock()
	defer activeRuntimeMu.Unlock()
	out := make([]runtimeSnapshot, 0, len(activeRuntimes))
	for _, inst := range activeRuntimes {
		inst.mu.Lock()
		if inst.server == nil {
			inst.mu.Unlock()
			continue
		}
		out = append(out, runtimeSnapshot{
			ModelID:  inst.modelID,
			Kind:     inst.kind,
			Port:     inst.port,
			Endpoint: fmt.Sprintf("http://127.0.0.1:%d/v1", inst.port),
		})
		inst.mu.Unlock()
	}
	return out
}

func usedRuntimePorts() map[int]struct{} {
	ports := map[int]struct{}{}
	for _, snap := range listRuntimeSnapshots() {
		if snap.Port > 0 {
			ports[snap.Port] = struct{}{}
		}
	}
	return ports
}

func listenPortExcluding(preferred, base int, exclude map[int]struct{}) (int, net.Listener, error) {
	try := make([]int, 0, 32)
	if preferred > 0 {
		try = append(try, preferred)
	}
	for i := 0; i < 32; i++ {
		try = append(try, base+i)
	}
	seen := map[int]struct{}{}
	for _, port := range try {
		if _, ok := seen[port]; ok {
			continue
		}
		if exclude != nil {
			if _, blocked := exclude[port]; blocked {
				continue
			}
		}
		seen[port] = struct{}{}
		ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", port))
		if err == nil {
			return port, ln, nil
		}
	}
	return 0, nil, fmt.Errorf("无法分配本地端口")
}
