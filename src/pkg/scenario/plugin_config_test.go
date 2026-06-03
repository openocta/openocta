package scenario

import (
	"os"
	"path/filepath"
	"testing"
)

func TestPluginConfigPatchAndPath(t *testing.T) {
	dir := t.TempDir()
	env := func(k string) string {
		if k == "OPENOCTA_STATE_DIR" {
			return dir
		}
		return ""
	}
	store := NewPluginConfigStore(env)
	hash, err := store.Write("test-plugin", map[string]interface{}{
		"database": map[string]interface{}{"host": "localhost"},
	})
	if err != nil || hash == "" {
		t.Fatalf("write: %v hash=%s", err, hash)
	}
	merged, h2, err := store.Patch("test-plugin", map[string]interface{}{
		"database": map[string]interface{}{"port": 3306},
	})
	if err != nil {
		t.Fatal(err)
	}
	if merged["database"].(map[string]interface{})["host"] != "localhost" {
		t.Fatalf("expected host preserved: %v", merged)
	}
	_, h3, err := store.SetPathValue("test-plugin", "greeting", "hi")
	if err != nil || h3 == "" || h2 == h3 {
		t.Fatalf("set path: err=%v h2=%s h3=%s", err, h2, h3)
	}
	cfgPath := filepath.Join(dir, "scenario-data", "test-plugin", "config.json")
	if _, err := os.Stat(cfgPath); err != nil {
		t.Fatal(err)
	}
}

func TestMergePatchDeletesNil(t *testing.T) {
	base := map[string]interface{}{"a": 1, "b": map[string]interface{}{"c": 2}}
	out := MergePatch(base, map[string]interface{}{"b": nil})
	if _, ok := out["b"]; ok {
		t.Fatal("expected b deleted")
	}
}
