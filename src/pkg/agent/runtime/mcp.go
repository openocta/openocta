// Package runtime: build MCPServers list from OpenOcta config for api.Options.
package runtime

import (
	"strings"

	"github.com/openocta/openocta/pkg/config"
)

// BuildMCPServersFromConfig converts config.Mcp.Servers to a list of MCP server spec strings
// for api.Options.MCPServers. Each entry becomes either:
// - stdio://command arg1 arg2 ... when Command (and optionally Args) is set
// - url when URL is set (SSE/HTTP)
// - stdio spec for known Service+ServiceURL (e.g. prometheus -> npx -y prometheus-mcp-server)
// Disabled servers are skipped.
func BuildMCPServersFromConfig(cfg *config.OpenOctaConfig) []string {
	if cfg == nil || cfg.Mcp == nil || len(cfg.Mcp.Servers) == 0 {
		return nil
	}
	var specs []string
	seen := make(map[string]struct{})
	for name, entry := range cfg.Mcp.Servers {
		if entry.Enabled != nil && !*entry.Enabled {
			continue
		}
		spec := mcpEntryToSpec(name, &entry)
		spec = strings.TrimSpace(spec)
		if spec == "" {
			continue
		}
		if _, ok := seen[spec]; ok {
			continue
		}
		seen[spec] = struct{}{}
		specs = append(specs, spec)
	}
	return specs
}

func mcpEntryToSpec(name string, e *config.McpServerEntry) string {
	// 1) Command (stdio)
	if strings.TrimSpace(e.Command) != "" {
		cmd := strings.TrimSpace(e.Command)
		args := strings.TrimSpace(strings.Join(e.Args, " "))
		if args != "" {
			return "stdio://" + cmd + " " + args
		}
		return "stdio://" + cmd
	}
	// 2) URL (SSE/HTTP)
	if strings.TrimSpace(e.URL) != "" {
		return strings.TrimSpace(e.URL)
	}
	// 3) Service + ServiceURL -> known stdio spec
	if strings.TrimSpace(e.Service) != "" && strings.TrimSpace(e.ServiceURL) != "" {
		return serviceToStdioSpec(strings.ToLower(strings.TrimSpace(e.Service)), strings.TrimSpace(e.ServiceURL))
	}
	return ""
}

func serviceToStdioSpec(service, backendURL string) string {
	switch service {
	case "prometheus":
		return "stdio://npx -y prometheus-mcp-server"
	default:
		return ""
	}
}
