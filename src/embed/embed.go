// Package embed provides embedded frontend and config assets for the single-binary distribution.
// Build order: 1) cd ui && npm run build 2) cp src/config-schema.json src/openocta.json.example src/.env src/embed/ 3) go build
package embed

import (
	"bufio"
	"embed"
	"io/fs"
	"os"
	"strings"
)

// Assets embeds frontend, config-schema, openocta.json.example and .env (copied by build script).
//
//go:embed frontend config-schema.json openocta.json.example .env
var assets embed.FS

func init() {
	// Load embedded .env at startup so OPENOCTA_BUNDLED_VERSION etc. are set before version.Version is read.
	loadEnvFromEmbedded()
}

func loadEnvFromEmbedded() {
	data, err := fs.ReadFile(assets, ".env")
	if err != nil {
		return
	}
	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		idx := strings.Index(line, "=")
		if idx <= 0 {
			continue
		}
		key := strings.TrimSpace(line[:idx])
		if key == "" {
			continue
		}
		val := strings.TrimSpace(line[idx+1:])
		if len(val) >= 2 && (val[0] == '"' && val[len(val)-1] == '"' || val[0] == '\'' && val[len(val)-1] == '\'') {
			val = val[1 : len(val)-1]
		}
		if os.Getenv(key) == "" {
			_ = os.Setenv(key, val)
		}
	}
}

// FrontendFS returns the frontend filesystem for serving the Control UI.
func FrontendFS() (fs.FS, error) {
	return fs.Sub(assets, "frontend")
}

// ConfigSchemaJSON returns the embedded config schema, or error if not found.
func ConfigSchemaJSON() ([]byte, error) {
	return fs.ReadFile(assets, "config-schema.json")
}

// ConfigExampleJSON returns the embedded openocta.json.example for initializing new configs.
func ConfigExampleJSON() ([]byte, error) {
	return fs.ReadFile(assets, "openocta.json.example")
}
