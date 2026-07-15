package localbackend

import (
	"context"
	"os"
	"path/filepath"
	"strings"

	localbk "github.com/cloudwego/eino-ext/adk/backend/local"
	"github.com/cloudwego/eino/adk/filesystem"
)

// Backend wraps eino-ext local filesystem backend and provides cross-platform
// Shell / StreamingShell execution (Windows uses cmd.exe without a console window).
type Backend struct {
	*localbk.Local
	validateCommand func(string) error
	workspaceDir    string
}

// Options configures NewBackend beyond the upstream local.Config.
type Options struct {
	// WorkspaceDir is the agent workspace used to resolve relative / Windows
	// drive-root write paths. Empty falls back to the process working directory.
	WorkspaceDir string
}

// NewBackend creates a filesystem backend with platform-appropriate shell execution.
func NewBackend(ctx context.Context, cfg *localbk.Config, opts ...Options) (*Backend, error) {
	inner, err := localbk.NewBackend(ctx, cfg)
	if err != nil {
		return nil, err
	}
	validate := func(string) error { return nil }
	if cfg != nil && cfg.ValidateCommand != nil {
		validate = cfg.ValidateCommand
	}
	workspace := ""
	if len(opts) > 0 {
		workspace = strings.TrimSpace(opts[0].WorkspaceDir)
	}
	if workspace != "" {
		if abs, err := filepath.Abs(workspace); err == nil {
			workspace = abs
		}
		_ = os.MkdirAll(workspace, 0o755)
	}
	return &Backend{
		Local:           inner,
		validateCommand: validate,
		workspaceDir:    workspace,
	}, nil
}

// Write resolves the target path for Windows/workspace safety, then delegates.
func (b *Backend) Write(ctx context.Context, req *filesystem.WriteRequest) error {
	if req == nil {
		return nil
	}
	path, err := ResolveWritablePath(req.FilePath, b.workspaceDir)
	if err != nil {
		return err
	}
	cp := *req
	cp.FilePath = path
	return b.Local.Write(ctx, &cp)
}

// Edit resolves the target path the same way as Write.
func (b *Backend) Edit(ctx context.Context, req *filesystem.EditRequest) error {
	if req == nil {
		return nil
	}
	path, err := ResolveWritablePath(req.FilePath, b.workspaceDir)
	if err != nil {
		return err
	}
	cp := *req
	cp.FilePath = path
	return b.Local.Edit(ctx, &cp)
}

// Ensure Backend satisfies filesystem interfaces used by DeepAgent.
var (
	_ filesystem.Backend        = (*Backend)(nil)
	_ filesystem.Shell          = (*Backend)(nil)
	_ filesystem.StreamingShell = (*Backend)(nil)
)
