package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"sort"
	"strings"

	"github.com/openocta/openocta/pkg/agent/runtime"
	"github.com/openocta/openocta/pkg/config"
)

// chatRuntimeFingerprint hashes stable runtime configuration so pooled runtimes are
// recreated when tools, workspace, or model routing change.
func chatRuntimeFingerprint(
	projectRoot, agentID, employeeID, modelRef string,
	xunfeiImageMode bool,
	mcpServerKeys, skillKeys []string,
	webToolsEnabled bool,
	systemPromptOverrides string,
) string {
	parts := []string{
		projectRoot,
		agentID,
		employeeID,
		modelRef,
		boolToken(xunfeiImageMode),
		boolToken(webToolsEnabled),
		strings.TrimSpace(systemPromptOverrides),
		"toolschema:minimal",
		// Bumping runtime.SystemPromptVersion forces the runtime pool to
		// rebuild so any new system-prompt rules reach the model — without
		// this, the pool silently reuses a cached runtime with stale rules.
		"prompt:" + runtime.SystemPromptVersion,
	}
	if len(mcpServerKeys) > 0 {
		sort.Strings(mcpServerKeys)
		parts = append(parts, "mcp:"+strings.Join(mcpServerKeys, ","))
	}
	if len(skillKeys) > 0 {
		sort.Strings(skillKeys)
		parts = append(parts, "skills:"+strings.Join(skillKeys, ","))
	}
	sum := sha256.Sum256([]byte(strings.Join(parts, "\x1e")))
	return hex.EncodeToString(sum[:])
}

func boolToken(v bool) string {
	if v {
		return "1"
	}
	return "0"
}

func buildMergedMCPServers(runtimeConfig *config.OpenOctaConfig, mcpServers map[string]config.McpServerEntry) map[string]config.McpServerEntry {
	if len(mcpServers) == 0 {
		return nil
	}
	serversMerged := make(map[string]config.McpServerEntry)
	if runtimeConfig != nil && runtimeConfig.Mcp != nil && len(runtimeConfig.Mcp.Servers) > 0 {
		for k, v := range runtimeConfig.Mcp.Servers {
			if !v.Enabled {
				continue
			}
			serversMerged[k] = v
		}
	}
	for k, v := range mcpServers {
		if !v.Enabled {
			continue
		}
		serversMerged[k] = v
	}
	if len(serversMerged) == 0 {
		return nil
	}
	return serversMerged
}

func mcpServerKeyNames(servers map[string]config.McpServerEntry) []string {
	if len(servers) == 0 {
		return nil
	}
	keys := make([]string, 0, len(servers))
	for k, v := range servers {
		if !v.Enabled {
			continue
		}
		keys = append(keys, k)
	}
	return keys
}
