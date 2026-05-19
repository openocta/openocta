// Package card builds A2A AgentCard values from OpenOcta agent/employee metadata.
package card

import (
	"fmt"
	"strings"

	"github.com/a2aproject/a2a-go/v2/a2a"
)

// BuildOpts configures AgentCard construction.
type BuildOpts struct {
	Name        string
	Description string
	URL         string
	Skills      []string
	Version     string
	AgentID     string
	EmployeeID  string
}

// Build returns an AgentCard for local swarm members.
func Build(opts BuildOpts) *a2a.AgentCard {
	name := strings.TrimSpace(opts.Name)
	if name == "" {
		if opts.EmployeeID != "" {
			name = opts.EmployeeID
		} else if opts.AgentID != "" {
			name = opts.AgentID
		} else {
			name = "openocta-agent"
		}
	}
	desc := strings.TrimSpace(opts.Description)
	if desc == "" {
		desc = fmt.Sprintf("OpenOcta agent %s", name)
	}
	url := strings.TrimSpace(opts.URL)
	if url == "" {
		url = "http://127.0.0.1:18900"
	}
	version := strings.TrimSpace(opts.Version)
	if version == "" {
		version = "0.1.0"
	}

	skills := make([]a2a.AgentSkill, 0, len(opts.Skills))
	for _, s := range opts.Skills {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		skills = append(skills, a2a.AgentSkill{
			ID:          s,
			Name:        s,
			Description: s,
		})
	}

	return &a2a.AgentCard{
		Name:        name,
		Description: desc,
		Version:     version,
		Skills:      skills,
		SupportedInterfaces: []*a2a.AgentInterface{
			a2a.NewAgentInterface(url, a2a.TransportProtocolJSONRPC),
		},
		DefaultInputModes:  []string{"text/plain"},
		DefaultOutputModes: []string{"text/plain"},
		Capabilities: a2a.AgentCapabilities{
			Streaming: true,
		},
	}
}
