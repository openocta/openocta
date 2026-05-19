package swarm

import (
	_ "embed"
	"os"
	"path/filepath"
	"strings"
)

//go:embed assets/SWARM.md
var embeddedSwarmPolicy string

// LoadSwarmPolicyMarkdown returns SWARM.md content: project prompt dir first, then embedded default.
func LoadSwarmPolicyMarkdown(projectRoot string) string {
	if body := readSwarmPolicyFromDisk(projectRoot); body != "" {
		return body
	}
	return strings.TrimSpace(embeddedSwarmPolicy)
}

func readSwarmPolicyFromDisk(projectRoot string) string {
	root := strings.TrimSpace(projectRoot)
	if root == "" || root == "." {
		return ""
	}
	candidates := []string{
		filepath.Join(root, "prompt", "prompt-zh", "SWARM.md"),
		filepath.Join(root, "prompt", "SWARM.md"),
	}
	for _, p := range candidates {
		data, err := os.ReadFile(p)
		if err == nil {
			if s := strings.TrimSpace(string(data)); s != "" {
				return s
			}
		}
	}
	return ""
}
