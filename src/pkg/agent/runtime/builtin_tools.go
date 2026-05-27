// Package runtime: builtin tools from agentsdk-go v2 (bash, read, write, edit, grep, glob).
package runtime

import (
	"context"

	"github.com/stellarlinkco/agentsdk-go/pkg/tool"
	toolbuiltin "github.com/stellarlinkco/agentsdk-go/pkg/tool/builtin"
)

// BuiltinTools returns built-in tools from agentsdk-go v2, rooted at projectRoot.
// Core builtins: bash, read, write, edit, grep, glob（skill 由 Runtime 单独注册）.
// When sandboxDisabled is true, tools use nil FileSystemPolicy so path validation is skipped.
func BuiltinTools(projectRoot string, sandboxDisabled bool) []tool.Tool {
	if projectRoot == "" {
		projectRoot = "."
	}
	bash := toolbuiltin.NewBashToolWithRoot(projectRoot)
	read := toolbuiltin.NewReadToolWithRoot(projectRoot)
	write := toolbuiltin.NewWriteToolWithRoot(projectRoot)
	edit := toolbuiltin.NewEditToolWithRoot(projectRoot)
	grep := toolbuiltin.NewGrepToolWithRoot(projectRoot)
	glob := toolbuiltin.NewGlobToolWithRoot(projectRoot)
	if sandboxDisabled {
		bash = toolbuiltin.NewBashToolWithSandbox(projectRoot, nil)
		read = toolbuiltin.NewReadToolWithSandbox(projectRoot, nil)
		write = toolbuiltin.NewWriteToolWithSandbox(projectRoot, nil)
		edit = toolbuiltin.NewEditToolWithSandbox(projectRoot, nil)
		grep = toolbuiltin.NewGrepToolWithSandbox(projectRoot, nil)
		grep.SetRespectGitignore(true)
		glob = toolbuiltin.NewGlobToolWithSandbox(projectRoot, nil)
		glob.SetRespectGitignore(true)
	}

	return []tool.Tool{
		bash,
		compatTool{read},
		compatTool{write},
		compatTool{edit},
		grep,
		glob,
	}
}

type compatTool struct {
	tool.Tool
}

func (c compatTool) Schema() *tool.JSONSchema {
	orig := c.Tool.Schema()
	if orig == nil {
		return nil
	}
	props := make(map[string]interface{})
	for k, v := range orig.Properties {
		props[k] = v
	}
	if fp, ok := props["file_path"]; ok {
		props["path"] = fp
	}
	return &tool.JSONSchema{
		Type:       orig.Type,
		Properties: props,
		Required:   orig.Required,
	}
}

func (c compatTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	if params != nil {
		if path, ok := params["path"]; ok && params["file_path"] == nil {
			params["file_path"] = path
		}
	}
	return c.Tool.Execute(ctx, params)
}
