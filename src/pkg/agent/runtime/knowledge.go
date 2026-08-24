package runtime

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/agent"
	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/paths"
)

func resolveKnowledgeOptions(cfg *config.OpenOctaConfig, env func(string) string, agentID string) *KnowledgeOptions {
	if env == nil {
		env = os.Getenv
	}

	stateDir := paths.ResolveStateDir(env)
	vaultDir := agent.ResolveVaultDir(cfg, agentID, env)
	indexDir := filepath.Join(stateDir, "knowledge-index")

	agent.EnsureVaultDir(vaultDir)

	return &KnowledgeOptions{
		Enabled:  true,
		VaultDir: vaultDir,
		IndexDir: indexDir,
	}
}

// BuildSystemPromptKnowledgeSection returns agent instructions for vault retrieval.
func BuildSystemPromptKnowledgeSection(cfg *config.OpenOctaConfig, agentID string, env func(string) string) string {
	if env == nil {
		env = os.Getenv
	}
	vaultDir := agent.ResolveVaultDir(cfg, agentID, env)
	return strings.TrimSpace(`## 知识库（Vault）

你的 Obsidian 兼容知识库目录：` + vaultDir + `

**检索规则（必须遵守）**：
- 当用户询问可能记录在知识库中的内容（文档、Runbook、架构、流程、项目约定、历史决策、配置说明等）时，**必须先调用 memory_search** 检索 Vault，再基于检索结果回答。
- 不要仅凭对话上下文、猜测或训练数据回答知识库相关问题。
- 若 memory_search 无命中，明确说明知识库中未找到相关内容，并建议用户补充笔记或在知识库页点击「同步索引」。

工具：memory_search（Vault 笔记）；session_search（当前会话历史）。`)
}
