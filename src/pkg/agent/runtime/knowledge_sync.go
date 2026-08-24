package runtime

import (
	"context"
	"fmt"
	"os"

	"github.com/openocta/openocta/pkg/agent/knowledge"
	"github.com/openocta/openocta/pkg/config"
)

// InitKnowledgeEngine preloads the shared Bleve index at process startup.
func InitKnowledgeEngine(ctx context.Context, cfg *config.OpenOctaConfig) error {
	if ctx == nil {
		ctx = context.Background()
	}
	opts := resolveKnowledgeOptions(cfg, os.Getenv, "")
	if opts == nil {
		return nil
	}
	var emb, err = knowledge.NewEmbedderFromEnv()
	if err != nil {
		return fmt.Errorf("knowledge preload embedder: %w", err)
	}
	if err := knowledge.PreloadEngine(opts.IndexDir, emb); err != nil {
		return fmt.Errorf("knowledge preload index: %w", err)
	}
	return nil
}

// RebuildKnowledgeIndex rescans the vault and rebuilds the shared Bleve index on disk.
func RebuildKnowledgeIndex(ctx context.Context, cfg *config.OpenOctaConfig, agentID string) (fileCount, chunkCount int, err error) {
	if ctx == nil {
		ctx = context.Background()
	}
	opts := resolveKnowledgeOptions(cfg, os.Getenv, agentID)
	if opts == nil {
		return 0, 0, fmt.Errorf("knowledge options unavailable")
	}
	docs, err := knowledge.SyncVault(opts.VaultDir)
	if err != nil {
		return 0, 0, fmt.Errorf("sync vault: %w", err)
	}
	emb, err := knowledge.NewEmbedderFromEnv()
	if err != nil {
		return 0, 0, fmt.Errorf("embedder: %w", err)
	}
	if err := knowledge.RebuildShared(ctx, opts.IndexDir, emb, docs); err != nil {
		return 0, 0, fmt.Errorf("rebuild index: %w", err)
	}
	paths := map[string]struct{}{}
	for _, d := range docs {
		if p := d.Meta["path"]; p != "" {
			paths[p] = struct{}{}
		}
	}
	return len(paths), len(docs), nil
}
