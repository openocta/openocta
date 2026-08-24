package embeddedmodels

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	"github.com/hashicorp/go-getter"
	"github.com/hybridgroup/yzma/pkg/download"
)

// EnsureLibraries installs llama.cpp prebuilt libs into ~/.openocta/yzma-lib if missing.
func EnsureLibraries(env func(string) string) error {
	// Fail early on Windows when MSVC runtime is missing — same requirement as
	// loading ggml.dll, and clearer than a generic LoadLibrary failure later.
	if err := checkWindowsVCRuntime(); err != nil {
		return err
	}
	libDir := ResolveLibDir(env)
	if download.AlreadyInstalled(libDir) {
		return nil
	}
	if err := os.MkdirAll(libDir, 0755); err != nil {
		return err
	}
	processor := "cpu"
	if cudaInstalled, cudaVersion := download.HasCUDA(); cudaInstalled {
		processor = "cuda"
		_ = cudaVersion
	} else if runtime.GOOS == "darwin" {
		processor = "metal"
	}
	if len(resolveGitHubProxies(env)) > 0 {
		return getLlamaLibraries(runtime.GOARCH, runtime.GOOS, processor, "latest", libDir, env)
	}
	return download.Get(runtime.GOARCH, runtime.GOOS, processor, "latest", libDir)
}

// jobProgress tracks async download state.
type jobProgress struct {
	Phase      string `json:"phase"`
	Percent    int    `json:"percent"`
	Message    string `json:"message"`
	BytesDone  int64  `json:"bytesDone,omitempty"`
	BytesTotal int64  `json:"bytesTotal,omitempty"`
}

type downloadJob struct {
	mu       sync.Mutex
	running  bool
	done     bool
	modelID  string
	err      string
	progress jobProgress
	cancel   context.CancelFunc
}

var globalDownloadJob downloadJob

func setDownloadProgress(phase string, percent int, message string, bytesDone, bytesTotal int64) {
	globalDownloadJob.mu.Lock()
	globalDownloadJob.progress = jobProgress{
		Phase:      phase,
		Percent:    percent,
		Message:    message,
		BytesDone:  bytesDone,
		BytesTotal: bytesTotal,
	}
	globalDownloadJob.mu.Unlock()
}

// DownloadStatus returns current download job state.
func DownloadStatus() map[string]interface{} {
	globalDownloadJob.mu.Lock()
	defer globalDownloadJob.mu.Unlock()
	out := map[string]interface{}{
		"ok":          true,
		"downloading": globalDownloadJob.running,
		"done":        globalDownloadJob.done,
		"modelId":     globalDownloadJob.modelID,
	}
	if globalDownloadJob.err != "" {
		out["error"] = globalDownloadJob.err
	}
	if globalDownloadJob.progress.Message != "" || globalDownloadJob.running {
		out["progress"] = globalDownloadJob.progress
	}
	return out
}

// StartDownloadAsync downloads a catalog model into ~/.openocta/embedded-models/{id}/.
func StartDownloadAsync(env func(string) string, modelID string) (started bool, err error) {
	entry, ok := FindCatalogEntry(modelID)
	if !ok {
		return false, fmt.Errorf("未知模型: %s", modelID)
	}
	if IsInstalled(env, modelID) {
		return false, fmt.Errorf("模型已安装")
	}

	globalDownloadJob.mu.Lock()
	if globalDownloadJob.running {
		globalDownloadJob.mu.Unlock()
		return false, nil
	}
	ctx, cancel := context.WithCancel(context.Background())
	globalDownloadJob.running = true
	globalDownloadJob.done = false
	globalDownloadJob.modelID = modelID
	globalDownloadJob.err = ""
	globalDownloadJob.cancel = cancel
	globalDownloadJob.progress = jobProgress{Phase: "queued", Percent: 0, Message: "等待开始…"}
	globalDownloadJob.mu.Unlock()

	go func() {
		dlErr := runDownload(ctx, env, entry)
		globalDownloadJob.mu.Lock()
		globalDownloadJob.running = false
		globalDownloadJob.done = true
		globalDownloadJob.cancel = nil
		if dlErr != nil {
			if errors.Is(dlErr, context.Canceled) {
				globalDownloadJob.err = ""
				globalDownloadJob.progress = jobProgress{Phase: "cancelled", Percent: 0, Message: "下载已取消"}
			} else {
				globalDownloadJob.err = dlErr.Error()
				globalDownloadJob.progress = jobProgress{
					Phase:   "error",
					Percent: globalDownloadJob.progress.Percent,
					Message: dlErr.Error(),
				}
			}
		}
		globalDownloadJob.mu.Unlock()
	}()
	return true, nil
}

// CancelDownload cancels an in-flight download.
func CancelDownload() bool {
	globalDownloadJob.mu.Lock()
	defer globalDownloadJob.mu.Unlock()
	if !globalDownloadJob.running || globalDownloadJob.cancel == nil {
		return false
	}
	globalDownloadJob.cancel()
	return true
}

func cleanupCancelledDownload(env func(string) string, modelID string) {
	if modelID == "" {
		return
	}
	_ = os.RemoveAll(ModelDir(env, modelID))
	_ = removeInstalled(env, modelID)
}

func runDownload(ctx context.Context, env func(string) string, entry CatalogEntry) (err error) {
	setDownloadProgress("prepare", 2, "准备下载目录…", 0, 0)
	resolved, err := ensureDownloadFiles(entry, env)
	if err != nil {
		return err
	}
	entry = resolved
	modelID := entry.ID
	dir := ModelDir(env, modelID)
	defer func() {
		if errors.Is(err, context.Canceled) {
			cleanupCancelledDownload(env, modelID)
		}
	}()
	if err = os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	setDownloadProgress("libs", 5, "检查推理引擎库…", 0, 0)
	if err := EnsureLibraries(env); err != nil {
		return fmt.Errorf("安装推理引擎失败: %w", err)
	}

	totalFiles := len(entry.Files)
	var totalBytes int64
	for _, f := range entry.Files {
		totalBytes += f.Size
	}
	var priorBytes int64
	var saved []string
	for i, f := range entry.Files {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		dest := filepath.Join(dir, f.Name)
		basePct := 10 + (i * 80 / totalFiles)
		spanPct := 80 / totalFiles
		if spanPct < 1 {
			spanPct = 1
		}
		fileName := f.Name
		setDownloadProgress("download", basePct, fmt.Sprintf("正在下载 %s…", fileName), priorBytes, totalBytes)

		tracker := newPercentTracker(basePct, spanPct, f.Size, func(pct int, fileDone, fileTotal int64) {
			done := priorBytes + fileDone
			total := totalBytes
			if total <= 0 {
				done = fileDone
				total = fileTotal
			}
			setDownloadProgress("download", pct, fmt.Sprintf("正在下载 %s…", fileName), done, total)
		})
		urls := DownloadURLs(f.URL, env)
		if len(urls) == 0 {
			return fmt.Errorf("下载 %s 失败: 无可用下载地址", f.Name)
		}
		if err := downloadModelFile(ctx, urls[0], dest, tracker); err != nil {
			_ = os.Remove(dest)
			return fmt.Errorf("下载 %s 失败: %w", f.Name, err)
		}
		if err := normalizeDownloadDest(dest); err != nil {
			return fmt.Errorf("整理 %s 失败: %w", f.Name, err)
		}
		saved = append(saved, f.Name)
		if f.Size > 0 {
			priorBytes += f.Size
		} else if info, statErr := os.Stat(dest); statErr == nil {
			priorBytes += info.Size()
		}
	}

	setDownloadProgress("finalize", 95, "写入安装记录…", priorBytes, totalBytes)
	if err := upsertInstalled(env, entry.ID, saved); err != nil {
		return err
	}
	setDownloadProgress("done", 100, "下载完成", totalBytes, totalBytes)
	return nil
}

// DeleteModel stops the model (if running) and removes files.
func DeleteModel(env func(string) string, modelID string) error {
	if _, running := getRuntime(modelID); running {
		if err := StopModel(env, modelID); err != nil {
			return err
		}
	}
	dir := ModelDir(env, modelID)
	_ = os.RemoveAll(dir)
	return removeInstalled(env, modelID)
}

type percentTracker struct {
	basePct       int
	spanPct       int
	expectedSize  int64
	startOffset   int64
	absoluteTotal int64
	onUpdate      func(pct int, bytesDone, bytesTotal int64)
	lastPct       int
	lastBytes     int64
}

func newPercentTracker(basePct, spanPct int, expectedSize int64, onUpdate func(pct int, bytesDone, bytesTotal int64)) getter.ProgressTracker {
	return &percentTracker{basePct: basePct, spanPct: spanPct, expectedSize: expectedSize, onUpdate: onUpdate}
}

func (t *percentTracker) TrackProgress(src string, currentSize, totalSize int64, stream io.ReadCloser) io.ReadCloser {
	t.startOffset = currentSize
	t.absoluteTotal = totalSize
	if t.absoluteTotal <= t.startOffset {
		if t.expectedSize > 0 {
			t.absoluteTotal = t.startOffset + t.expectedSize
		} else {
			t.absoluteTotal = 0
		}
	}
	t.lastPct = 0
	t.lastBytes = 0
	return &trackedReader{t: t, r: stream}
}

type trackedReader struct {
	t         *percentTracker
	r         io.ReadCloser
	bytesRead int64
}

func (tr *trackedReader) Read(p []byte) (int, error) {
	n, err := tr.r.Read(p)
	if n <= 0 {
		return n, err
	}
	tr.bytesRead += int64(n)
	tr.reportProgress()
	return n, err
}

func (tr *trackedReader) reportProgress() {
	if tr.t.onUpdate == nil {
		return
	}
	bytesDone := tr.t.startOffset + tr.bytesRead
	bytesTotal := tr.t.absoluteTotal
	if bytesTotal <= tr.t.startOffset && tr.t.expectedSize > 0 {
		bytesTotal = tr.t.startOffset + tr.t.expectedSize
	}
	downloadSpan := bytesTotal - tr.t.startOffset
	if downloadSpan > 0 {
		frac := float64(tr.bytesRead) / float64(downloadSpan)
		pct := tr.t.basePct + int(frac*float64(tr.t.spanPct))
		cap := tr.t.basePct + tr.t.spanPct
		if pct > cap {
			pct = cap
		}
		if pct < tr.t.lastPct {
			pct = tr.t.lastPct
		}
		if pct >= tr.t.lastPct+1 || (tr.bytesRead-tr.t.lastBytes) >= 256*1024 {
			tr.t.lastPct = pct
			tr.t.lastBytes = tr.bytesRead
			tr.t.onUpdate(pct, bytesDone, bytesTotal)
		}
		return
	}
	if tr.bytesRead-tr.t.lastBytes >= 256*1024 {
		tr.t.lastBytes = tr.bytesRead
		tr.t.onUpdate(tr.t.basePct, bytesDone, 0)
	}
}

func (tr *trackedReader) Close() error {
	return tr.r.Close()
}

// downloadModelFile downloads a single file directly into dest (not a nested directory).
func downloadModelFile(ctx context.Context, src, dest string, tracker getter.ProgressTracker) error {
	if err := os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		return err
	}
	client := &getter.Client{
		Ctx:              ctx,
		Src:              src,
		Dst:              dest,
		Mode:             getter.ClientModeFile,
		ProgressListener: tracker,
	}
	return client.Get()
}
