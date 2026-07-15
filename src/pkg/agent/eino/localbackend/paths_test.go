package localbackend_test

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	localbk "github.com/cloudwego/eino-ext/adk/backend/local"
	"github.com/cloudwego/eino/adk/filesystem"

	"github.com/openocta/openocta/pkg/agent/eino/localbackend"
)

func TestResolveWritablePathEmpty(t *testing.T) {
	t.Parallel()
	_, err := localbackend.ResolveWritablePath("", `C:\ws`)
	if err == nil || !strings.Contains(err.Error(), "file_path") {
		t.Fatalf("expected empty path error, got %v", err)
	}
	_, err = localbackend.ResolveWritablePath(".", `C:\ws`)
	if err == nil {
		t.Fatal("expected '.' to be rejected")
	}
}

func TestResolveWritablePathRelative(t *testing.T) {
	t.Parallel()
	ws := t.TempDir()
	got, err := localbackend.ResolveWritablePath("scripts/hi.ps1", ws)
	if err != nil {
		t.Fatalf("ResolveWritablePath: %v", err)
	}
	want := filepath.Join(ws, "scripts", "hi.ps1")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestResolveWritablePathWindowsVolumeRoot(t *testing.T) {
	t.Parallel()
	if runtime.GOOS != "windows" {
		t.Skip("windows-only redirect")
	}
	ws := t.TempDir()
	got, err := localbackend.ResolveWritablePath(`C:\weather.ps1`, ws)
	if err != nil {
		t.Fatalf("ResolveWritablePath: %v", err)
	}
	want := filepath.Join(ws, "weather.ps1")
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestBackendWriteEmptyPathFriendlyError(t *testing.T) {
	t.Parallel()
	ctx := t.Context()
	ws := t.TempDir()
	backend, err := localbackend.NewBackend(ctx, &localbk.Config{}, localbackend.Options{WorkspaceDir: ws})
	if err != nil {
		t.Fatalf("NewBackend: %v", err)
	}
	err = backend.Write(ctx, &filesystem.WriteRequest{FilePath: "", Content: "x"})
	if err == nil || !strings.Contains(err.Error(), "file_path") {
		t.Fatalf("expected friendly file_path error, got %v", err)
	}
}

func TestBackendWriteRelativeIntoWorkspace(t *testing.T) {
	t.Parallel()
	ctx := t.Context()
	ws := t.TempDir()
	backend, err := localbackend.NewBackend(ctx, &localbk.Config{}, localbackend.Options{WorkspaceDir: ws})
	if err != nil {
		t.Fatalf("NewBackend: %v", err)
	}
	err = backend.Write(ctx, &filesystem.WriteRequest{FilePath: "out.txt", Content: "hello"})
	if err != nil {
		t.Fatalf("Write: %v", err)
	}
	data, err := os.ReadFile(filepath.Join(ws, "out.txt"))
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if string(data) != "hello" {
		t.Fatalf("content = %q", data)
	}
}
