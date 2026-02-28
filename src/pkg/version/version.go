package version

import (
	"os"

	_ "github.com/openocta/openocta/embed" // ensure embedded .env is loaded before Version is set
)

// Version is the OpenOcta version. Can be overridden via OPENOCTA_BUNDLED_VERSION (from embedded .env or env).
var Version = func() string {
	if v := os.Getenv("OPENOCTA_BUNDLED_VERSION"); v != "" {
		return v
	}
	return "0.0.1-dev"
}()
