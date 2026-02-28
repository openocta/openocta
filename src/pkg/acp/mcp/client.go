// Package mcp provides MCP client connection and tool bridging for the agent.
package mcp

import (
	"bytes"
	"context"
	"errors"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

var (
	errConnectionClosed  = errors.New("mcp: connection closed")
	errSSENotImplemented = errors.New("mcp: SSE transport not implemented, use stdio")
)

// Client wraps one MCP server connection (stdio or SSE) and exposes ListTools / CallTool.
type Client struct {
	key     string
	session *mcp.ClientSession
	client  *mcp.Client
	cmd     *exec.Cmd
	mu      sync.Mutex
}

// ConnectStdio starts the given command and connects to the MCP server over stdin/stdout.
func ConnectStdio(ctx context.Context, key string, command string, args []string, env map[string]string) (*Client, error) {
	cmd := exec.CommandContext(ctx, command, args...)
	// 加载系统环境变量
	osEnv := os.Environ()
	envMap := make(map[string]string)
	for _, e := range osEnv {
		parts := strings.SplitN(e, "=", 2)
		if len(parts) == 2 {
			envMap[parts[0]] = parts[1]
		}
	}
	for k, v := range env {
		envMap[k] = v
	}

	cmd.Env = envToSlice(envMap)
	var stderrBuf bytes.Buffer
	cmd.Stderr = &stderrBuf

	// 3. 打印调试信息 (实际使用时可去掉或改为日志)
	log.Printf("Trying to start MCP server: %s %v", command, args)
	log.Printf("Env: %v", cmd.Env)

	transport := &mcp.CommandTransport{Command: cmd}
	client := mcp.NewClient(&mcp.Implementation{Name: "openocta-mcp-client", Version: "0.1.0"}, nil)
	session, err := client.Connect(ctx, transport, nil)
	if err != nil {
		log.Printf("MCP Connection failed. Server stderr output:\n%s", stderrBuf.String())

		return nil, err
	}
	return &Client{key: key, session: session, client: client, cmd: cmd}, nil
}

// ConnectURL connects to an MCP server at the given URL (SSE). Not implemented in this revision; use stdio only.
func ConnectURL(ctx context.Context, key string, url string) (*Client, error) {
	// SSE client would use mcp.SSEClientTransport; leave for later.
	_ = url
	return nil, errSSENotImplemented
}

// ListTools returns tools from the MCP server.
func (c *Client) ListTools(ctx context.Context) ([]*mcp.Tool, error) {
	c.mu.Lock()
	sess := c.session
	c.mu.Unlock()
	if sess == nil {
		return nil, errConnectionClosed
	}
	res, err := sess.ListTools(ctx, &mcp.ListToolsParams{})
	if err != nil {
		return nil, err
	}
	if res == nil || res.Tools == nil {
		return nil, nil
	}
	return res.Tools, nil
}

// CallTool invokes a tool by name with the given arguments.
func (c *Client) CallTool(ctx context.Context, name string, arguments map[string]interface{}) (*mcp.CallToolResult, error) {
	c.mu.Lock()
	sess := c.session
	c.mu.Unlock()
	if sess == nil {
		return nil, errConnectionClosed
	}
	args := make(map[string]any)
	for k, v := range arguments {
		args[k] = v
	}
	return sess.CallTool(ctx, &mcp.CallToolParams{Name: name, Arguments: args})
}

// Key returns the server key (e.g. "prometheus").
func (c *Client) Key() string { return c.key }

// Close closes the session and releases the process.
func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.session == nil {
		return nil
	}
	err := c.session.Close()
	c.session = nil
	return err
}

func envToSlice(env map[string]string) []string {
	if len(env) == 0 {
		return nil
	}
	out := make([]string, 0, len(env))
	for k, v := range env {
		out = append(out, k+"="+v)
	}
	return out
}

// ContentToPlainText extracts plain text from CallToolResult content for tool output.
func ContentToPlainText(content []mcp.Content) string {
	var b strings.Builder
	for _, c := range content {
		if t, ok := c.(*mcp.TextContent); ok {
			b.WriteString(t.Text)
		}
	}
	return b.String()
}
