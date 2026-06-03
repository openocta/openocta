package scenario

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"gopkg.in/yaml.v3"
)

// Manifest is the openocta-plugin.yaml schema (Scenario Pack).
type Manifest struct {
	APIVersion  string `yaml:"apiVersion"`
	Kind        string `yaml:"kind"`
	ID          string `yaml:"id"`
	Version     string `yaml:"version"`
	DisplayName string `yaml:"displayName"`
	Description string `yaml:"description"`
	Publisher   string `yaml:"publisher"`
	Homepage    string `yaml:"homepage"`

	Compatibility struct {
		OS                 []string `yaml:"os"`
		Arch               []string `yaml:"arch"`
		MinOpenOctaVersion string   `yaml:"minOpenOctaVersion"`
	} `yaml:"compatibility"`

	Requires struct {
		Bins []struct {
			Name     string   `yaml:"name"`
			AnyOf    []string `yaml:"anyOf"`
			Optional bool     `yaml:"optional"`
		} `yaml:"bins"`
	} `yaml:"requires"`

	Remote struct {
		Employees []RemoteRef    `yaml:"employees"`
		Skills    []RemoteRef    `yaml:"skills"`
		Mcps      []RemoteMcpRef `yaml:"mcps"`
	} `yaml:"remote"`

	LocalMcps []LocalMcp `yaml:"localMcps"`

	RuntimeEnv struct {
		Subdir string `yaml:"subdir"`
		Node   string `yaml:"node"`
		Python string `yaml:"python"`
	} `yaml:"runtimeEnv"`

	Setup []SetupStep `yaml:"setup"`

	ConfigDefaults map[string]interface{} `yaml:"configDefaults"`
	ConfigSchema   map[string]interface{} `yaml:"configSchema"`

	Views []View `yaml:"views"`
}

type RemoteRef struct {
	RemoteID  string `yaml:"remoteId"`
	InstallTo string `yaml:"installTo"`
}

type RemoteMcpRef struct {
	RemoteID  string `yaml:"remoteId"`
	ServerKey string `yaml:"serverKey"`
}

type LocalMcp struct {
	ServerKey string `yaml:"serverKey"`
	Install   struct {
		Kind    string `yaml:"kind"`
		Package string `yaml:"package"`
	} `yaml:"install"`
	Run struct {
		Command string            `yaml:"command"`
		Args    []string          `yaml:"args"`
		Env     map[string]string `yaml:"env"`
	} `yaml:"run"`
}

type SetupStep struct {
	ID        string   `yaml:"id"`
	Script    string   `yaml:"script"`
	Platforms []string `yaml:"platforms"`
}

type View struct {
	ID      string `yaml:"id"`
	Label   string `yaml:"label"`
	Path    string `yaml:"path"`
	Type    string `yaml:"type"`
	Default bool   `yaml:"default"`
}

// LoadManifest reads and validates openocta-plugin.yaml from installDir.
func LoadManifest(installDir string) (*Manifest, error) {
	data, err := os.ReadFile(filepath.Join(installDir, manifestFilename))
	if err != nil {
		return nil, fmt.Errorf("read manifest: %w", err)
	}
	var m Manifest
	if err := yaml.Unmarshal(data, &m); err != nil {
		return nil, fmt.Errorf("parse manifest: %w", err)
	}
	if m.APIVersion == "" {
		m.APIVersion = "openocta.dev/v1"
	}
	if m.Kind == "" {
		m.Kind = "ScenarioPack"
	}
	if m.ID == "" {
		return nil, fmt.Errorf("manifest: id is required")
	}
	if m.Version == "" {
		return nil, fmt.Errorf("manifest: version is required")
	}
	return &m, nil
}

// CheckCompat verifies OS/arch against manifest.
func (m *Manifest) CheckCompat() error {
	if m == nil {
		return fmt.Errorf("nil manifest")
	}
	osName := runtime.GOOS
	arch := runtime.GOARCH
	if len(m.Compatibility.OS) > 0 && !containsFold(m.Compatibility.OS, osName) {
		return fmt.Errorf("unsupported os %q", osName)
	}
	if len(m.Compatibility.Arch) > 0 && !containsFold(m.Compatibility.Arch, arch) {
		return fmt.Errorf("unsupported arch %q", arch)
	}
	return nil
}

// DefaultView returns the primary view entry.
func (m *Manifest) DefaultView() *View {
	if m == nil || len(m.Views) == 0 {
		return nil
	}
	for i := range m.Views {
		if m.Views[i].Default {
			return &m.Views[i]
		}
	}
	return &m.Views[0]
}

func containsFold(list []string, v string) bool {
	for _, s := range list {
		if strings.EqualFold(s, v) {
			return true
		}
	}
	return false
}
