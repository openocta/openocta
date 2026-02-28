package memory

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/session"
)

// SyncSessionFiles scans the session transcripts dir for the agent and upserts into files/chunks/FTS.
func SyncSessionFiles(db *sql.DB, agentID string, model string, ftsEnabled bool, needsFullReindex bool, env func(string) string) error {
	sessionsDir := session.ResolveAgentSessionsDir(agentID, env)
	entries, err := os.ReadDir(sessionsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	var activePaths []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if !strings.HasSuffix(e.Name(), ".jsonl") {
			continue
		}
		sessionID := strings.TrimSuffix(e.Name(), ".jsonl")
		pathKey := "sessions/" + agentID + "/" + sessionID + ".jsonl"
		activePaths = append(activePaths, pathKey)

		absPath := filepath.Join(sessionsDir, e.Name())
		content, err := os.ReadFile(absPath)
		if err != nil {
			continue
		}
		text := string(content)
		hash := hashText(text)
		info, err := os.Stat(absPath)
		if err != nil {
			continue
		}
		mtime := info.ModTime().Unix()
		size := info.Size()

		var existingHash string
		_ = db.QueryRow(`SELECT hash FROM files WHERE path = ? AND source = ?`, pathKey, "sessions").Scan(&existingHash)
		if !needsFullReindex && existingHash == hash {
			continue
		}

		tx, err := db.Begin()
		if err != nil {
			return err
		}
		_, _ = tx.Exec(`INSERT OR REPLACE INTO files (path, source, hash, mtime, size) VALUES (?, ?, ?, ?, ?)`,
			pathKey, "sessions", hash, mtime, size)
		_, _ = tx.Exec(`DELETE FROM chunks WHERE path = ? AND source = ?`, pathKey, "sessions")
		if ftsEnabled {
			_, _ = tx.Exec(`DELETE FROM `+FTSTable+` WHERE path = ? AND source = ? AND model = ?`, pathKey, "sessions", model)
		}

		chunks := chunkText(text)
		for i, c := range chunks {
			id := fmt.Sprintf("%s:%s:%d", pathKey, hash, i)
			_, err = tx.Exec(`INSERT INTO chunks (id, path, source, start_line, end_line, hash, model, text, embedding, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				id, pathKey, "sessions", c.startLine, c.endLine, c.hash, model, c.text, nil, mtime)
			if err != nil {
				_ = tx.Rollback()
				return err
			}
			if ftsEnabled {
				_, err = tx.Exec(`INSERT INTO `+FTSTable+` (text, id, path, source, model, start_line, end_line) VALUES (?, ?, ?, ?, ?, ?, ?)`,
					c.text, id, pathKey, "sessions", model, c.startLine, c.endLine)
				if err != nil {
					_ = tx.Rollback()
					return err
				}
			}
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	activeSet := make(map[string]bool)
	for _, p := range activePaths {
		activeSet[p] = true
	}
	rows, _ := db.Query(`SELECT path FROM files WHERE source = ?`, "sessions")
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var p string
			if rows.Scan(&p) == nil && !activeSet[p] {
				_, _ = db.Exec(`DELETE FROM files WHERE path = ? AND source = ?`, p, "sessions")
				_, _ = db.Exec(`DELETE FROM chunks WHERE path = ? AND source = ?`, p, "sessions")
				if ftsEnabled {
					_, _ = db.Exec(`DELETE FROM `+FTSTable+` WHERE path = ? AND source = ? AND model = ?`, p, "sessions", model)
				}
			}
		}
	}
	return nil
}
