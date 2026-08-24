//go:build !windows

package embeddedmodels

func prepareLlamaLibSearchPath(libDir string) error {
	_ = libDir
	return nil
}
