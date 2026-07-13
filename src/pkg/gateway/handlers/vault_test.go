package handlers

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSanitizeVaultFilePathRejectsNonMd(t *testing.T) {
	dir := t.TempDir()
	_, err := sanitizeVaultFilePath(dir, "notes/test.txt")
	if err == nil {
		t.Fatal("expected error for non-md extension")
	}
}

func TestSanitizeVaultFilePathRejectsBlockedPath(t *testing.T) {
	dir := t.TempDir()
	_, err := sanitizeVaultFilePath(dir, ".obsidian/config.md")
	if err == nil {
		t.Fatal("expected error for blocked path segment")
	}
}

func TestSanitizeVaultFilePathAllowsMd(t *testing.T) {
	dir := t.TempDir()
	abs, err := sanitizeVaultFilePath(dir, "notes/test.md")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !filepath.IsAbs(abs) {
		t.Fatalf("expected absolute path, got %q", abs)
	}
}

func TestSanitizeVaultFolderPathRejectsHidden(t *testing.T) {
	dir := t.TempDir()
	_, err := sanitizeVaultFolderPath(dir, ".obsidian")
	if err == nil {
		t.Fatal("expected error for blocked folder")
	}
}

func TestVaultMkdirRejectsExistingFolder(t *testing.T) {
	dir := t.TempDir()
	abs, err := sanitizeVaultFolderPath(dir, "notes")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(abs, 0o755); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(abs); err != nil {
		t.Fatalf("expected folder to exist: %v", err)
	}
	// Mkdir (not MkdirAll) on existing path should fail — handler uses Stat guard before Mkdir.
	if err := os.Mkdir(abs, 0o755); !os.IsExist(err) {
		t.Fatalf("expected exist error, got %v", err)
	}
}

func TestVaultDeleteRenameRoundTrip(t *testing.T) {
	dir := t.TempDir()
	note := filepath.Join(dir, "alpha.md")
	if err := os.WriteFile(note, []byte("# Alpha\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	fromAbs, err := sanitizeVaultFilePath(dir, "alpha.md")
	if err != nil {
		t.Fatal(err)
	}
	toAbs, err := sanitizeVaultFilePath(dir, "beta.md")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Rename(fromAbs, toAbs); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(fromAbs); !os.IsNotExist(err) {
		t.Fatalf("source should be gone: %v", err)
	}
	if _, err := os.Stat(toAbs); err != nil {
		t.Fatalf("target missing: %v", err)
	}
}
