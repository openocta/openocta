package paths

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveStateDir(t *testing.T) {
	env := func(key string) string {
		return os.Getenv(key)
	}
	dir := ResolveStateDir(env)
	if dir == "" {
		t.Fatal("expected non-empty state dir")
	}
	// Default should be ~/.openocta or contain .openocta
	if !filepath.IsAbs(dir) {
		t.Errorf("expected absolute path, got %q", dir)
	}
}

func TestResolveStateDirOverride(t *testing.T) {
	tmp := t.TempDir()
	os.Setenv("OPENOCTA_STATE_DIR", tmp)
	defer os.Unsetenv("OPENOCTA_STATE_DIR")
	env := func(key string) string { return os.Getenv(key) }
	dir := ResolveStateDir(env)
	if dir != tmp {
		t.Errorf("expected %q, got %q", tmp, dir)
	}
}

func TestDefaultGatewayPort(t *testing.T) {
	if DefaultGatewayPort() != 18789 {
		t.Errorf("expected 18789, got %d", DefaultGatewayPort())
	}
}
