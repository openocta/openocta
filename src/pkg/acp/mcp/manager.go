package mcp

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"sync"

	"github.com/cexll/agentsdk-go/pkg/tool"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/openocta/openocta/pkg/config"
)

// Manager holds MCP server connections and exposes aggregated tools for the agent.
type Manager struct {
	cfg     *config.McpConfig
	clients []*Client
	mu      sync.RWMutex
}

// NewManager creates a manager and connects to all enabled MCP servers from cfg.
// If cfg or cfg.Mcp is nil, returns an empty manager (no tools).
func NewManager(ctx context.Context, cfg *config.OpenOctaConfig) (*Manager, error) {
	m := &Manager{}
	if cfg == nil || cfg.Mcp == nil || len(cfg.Mcp.Servers) == 0 {
		return m, nil
	}
	m.cfg = cfg.Mcp
	for key, entry := range cfg.Mcp.Servers {
		if entry.Enabled != nil && !*entry.Enabled {
			continue
		}
		// Use background so MCP connections outlive the startup request.
		client, err := connectEntry(context.Background(), key, &entry)
		if err != nil {
			return nil, fmt.Errorf("mcp server %q: %w", key, err)
		}
		if client != nil {
			m.clients = append(m.clients, client)
		}
	}
	return m, nil
}

// connectEntry resolves one McpServerEntry to a Client (stdio or URL).
func connectEntry(ctx context.Context, key string, e *config.McpServerEntry) (*Client, error) {
	command := strings.TrimSpace(e.Command)
	url := strings.TrimSpace(e.URL)
	service := strings.TrimSpace(e.Service)
	serviceURL := strings.TrimSpace(e.ServiceURL)

	if command != "" {
		// Direct: run command with args and env (stdio)
		env := flattenEnv(e.Env)
		return ConnectStdio(ctx, key, command, e.Args, env)
	}
	if url != "" {
		return ConnectURL(ctx, key, url)
	}
	if service != "" && serviceURL != "" {
		// Built-in: start local MCP server for this service (stdio)
		cmd, args, env := resolveServiceServer(service, serviceURL)
		if cmd == "" {
			return nil, fmt.Errorf("unknown service %q", service)
		}
		return ConnectStdio(ctx, key, cmd, args, env)
	}
	return nil, nil
}

// resolveServiceServer returns (command, args, env) to run the MCP server for the given service.
// For "prometheus", we run the official prometheus-mcp-server (docker or fallback to host).
func resolveServiceServer(service, backendURL string) (command string, args []string, env map[string]string) {
	switch strings.ToLower(service) {
	case "prometheus":
		// Prefer docker; otherwise assume prometheus-mcp-server is on PATH (e.g. uv run).
		if path, _ := exec.LookPath("docker"); path != "" {
			return "docker", []string{
				"run", "-i", "--rm",
				"-e", "PROMETHEUS_URL=" + backendURL,
				"ghcr.io/pab1it0/prometheus-mcp-server:latest",
			}, nil
		}
		// Fallback: try npx or uv if user has the package
		if path, _ := exec.LookPath("npx"); path != "" {
			return "npx", []string{"-y", "prometheus-mcp-server"}, map[string]string{"PROMETHEUS_URL": backendURL}
		}
		// Last resort: same env, command from PATH (user must install)
		return "prometheus-mcp-server", nil, map[string]string{"PROMETHEUS_URL": backendURL}
	default:
		return "", nil, nil
	}
}

// normalizeLocalhostForDocker rewrites localhost URLs to host.docker.internal for dockerized MCP servers.
// This is primarily required on macOS/Windows where containers cannot reach the host via "localhost".
func normalizeLocalhostForDocker(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return raw
	}
	u, err := url.Parse(raw)
	if err != nil || u == nil {
		return raw
	}
	host := u.Hostname()
	if host == "localhost" || host == "127.0.0.1" || host == "::1" {
		u.Host = strings.Replace(u.Host, host, "host.docker.internal", 1)
		return u.String()
	}
	return raw
}

func flattenEnv(m map[string]string) map[string]string {
	if m == nil {
		return nil
	}
	out := make(map[string]string)
	for k, v := range m {
		out[k] = os.Expand(v, func(name string) string { return os.Getenv(name) })
	}
	return out
}

// Tools returns all tools from all connected MCP servers as agentsdk tool.Tool slice.
// Tool names are optionally prefixed per server (McpServerEntry.ToolPrefix).
func (m *Manager) Tools(ctx context.Context) ([]tool.Tool, error) {
	m.mu.RLock()
	clients := make([]*Client, len(m.clients))
	copy(clients, m.clients)
	m.mu.RUnlock()

	var out []tool.Tool
	for _, c := range clients {
		list, err := c.ListTools(ctx)
		if err != nil {
			return nil, fmt.Errorf("mcp list tools %s: %w", c.Key(), err)
		}
		prefix := getToolPrefixForClient(c.Key(), m.cfg)
		for _, t := range list {
			bt := newBridgeTool(c, t, prefix)
			out = append(out, bt)
		}
	}
	return out, nil
}

// getToolPrefixForClient returns the optional tool prefix for a server (from config). For now empty.
func getToolPrefixForClient(key string, cfg *config.McpConfig) string {
	if cfg == nil || cfg.Servers == nil {
		return ""
	}
	if e, ok := cfg.Servers[key]; ok && e.ToolPrefix != "" {
		return strings.TrimSpace(e.ToolPrefix) + "_"
	}
	return ""
}

// Close closes all MCP client connections.
func (m *Manager) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	var firstErr error
	for _, c := range m.clients {
		if err := c.Close(); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	m.clients = nil
	return firstErr
}

// bridgeTool implements agentsdk tool.Tool by forwarding to MCP CallTool.
type bridgeTool struct {
	client  *Client
	mcpTool *mcp.Tool
	prefix  string
}

func newBridgeTool(client *Client, t *mcp.Tool, prefix string) *bridgeTool {
	return &bridgeTool{client: client, mcpTool: t, prefix: prefix}
}

func (b *bridgeTool) Name() string {
	return b.prefix + b.mcpTool.Name
}

func (b *bridgeTool) Description() string {
	return b.mcpTool.Description
}

func (b *bridgeTool) Schema() *tool.JSONSchema {
	schema := b.mcpTool.InputSchema
	if schema == nil {
		return &tool.JSONSchema{Type: "object", Properties: map[string]interface{}{}}
	}
	// MCP inputSchema is map[string]any (JSON Schema); reuse for agentsdk.
	if m, ok := schema.(map[string]interface{}); ok {
		return &tool.JSONSchema{
			Type:       getString(m, "type", "object"),
			Properties: getMap(m, "properties"),
			Required:   getStringSlice(m, "required"),
		}
	}
	return &tool.JSONSchema{Type: "object", Properties: map[string]interface{}{}}
}

func (b *bridgeTool) Execute(ctx context.Context, params map[string]interface{}) (*tool.ToolResult, error) {
	// Call MCP with the tool's original name (without our prefix).
	res, err := b.client.CallTool(ctx, b.mcpTool.Name, params)
	if err != nil {
		return &tool.ToolResult{Success: false, Output: err.Error()}, nil
	}
	text := ContentToPlainText(res.Content)
	if res.IsError {
		return &tool.ToolResult{Success: false, Output: text}, nil
	}
	return &tool.ToolResult{Success: true, Output: text}, nil
}

func getString(m map[string]interface{}, key, def string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return def
}

func getMap(m map[string]interface{}, key string) map[string]interface{} {
	if v, ok := m[key].(map[string]interface{}); ok {
		return v
	}
	return map[string]interface{}{}
}

func getStringSlice(m map[string]interface{}, key string) []string {
	if v, ok := m[key].([]interface{}); ok {
		var s []string
		for _, x := range v {
			if str, ok := x.(string); ok {
				s = append(s, str)
			}
		}
		return s
	}
	return make([]string, 0)
}

var _ tool.Tool = (*bridgeTool)(nil)
