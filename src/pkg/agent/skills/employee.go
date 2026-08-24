package skills

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/openocta/openocta/pkg/config"
	"github.com/openocta/openocta/pkg/employees"
	"github.com/openocta/openocta/pkg/paths"
)

// LoadEmployeeEntries loads skills for a digital-employee session.
//
// Sources (later overrides earlier on name conflict):
//  1. ~/.openocta/employees/<id>/skills (legacy)
//  2. ~/.openocta/employee_skills/<id> (uploaded / site-install exclusive skills)
//  3. When manifest.skillIds is non-empty: matching skills from the workspace pool
//     (workspace / managed / bundled). Employee-exclusive skills are always kept
//     even if not listed in skillIds.
//
// When skillIds is empty, the workspace pool is NOT loaded — only exclusive dirs.
func LoadEmployeeEntries(workspaceDir string, cfg *config.OpenOctaConfig, employeeID string, env func(string) string) []Entry {
	employeeID = strings.TrimSpace(employeeID)
	if employeeID == "" {
		return nil
	}
	if env == nil {
		env = os.Getenv
	}

	stateDir := paths.ResolveStateDir(env)
	var entries []Entry

	legacyDir := filepath.Join(stateDir, "employees", employeeID, "skills")
	if legacy, err := LoadEntriesFromDir(legacyDir, "openocta-employee-legacy"); err == nil {
		entries = MergeEntries(entries, legacy)
	}

	empDir := filepath.Join(stateDir, "employee_skills", employeeID)
	if emp, err := LoadEntriesFromDir(empDir, "openocta-employee"); err == nil {
		entries = MergeEntries(entries, emp)
	}

	var skillIDs []string
	if m, err := employees.LoadManifest(employeeID, env); err == nil && m != nil {
		skillIDs = m.SkillIDs
	}
	if len(skillIDs) == 0 {
		return entries
	}

	ws, err := LoadWorkspaceEntries(workspaceDir, &LoadOptions{
		Config:           cfg,
		ManagedSkillsDir: filepath.Join(stateDir, "skills"),
	})
	if err != nil || len(ws) == 0 {
		return entries
	}
	fromPool := FilterEntriesByNames(ws, skillIDs)
	// Exclusive employee skills win on conflict and stay even if absent from skillIds.
	return MergeEntries(fromPool, entries)
}

// MergeEntries merges skill entries by lowercased name; later entries override earlier.
func MergeEntries(a, b []Entry) []Entry {
	byKey := map[string]Entry{}
	order := make([]string, 0, len(a)+len(b))
	add := func(e Entry) {
		k := strings.ToLower(strings.TrimSpace(e.Name))
		if k == "" {
			k = strings.ToLower(skillMergeKey(e))
		}
		if k == "" {
			return
		}
		if _, exists := byKey[k]; !exists {
			order = append(order, k)
		}
		byKey[k] = e
	}
	for _, e := range a {
		add(e)
	}
	for _, e := range b {
		add(e)
	}
	out := make([]Entry, 0, len(order))
	for _, k := range order {
		out = append(out, byKey[k])
	}
	return out
}

// FilterEntriesByNames keeps entries whose name, skill key, or base dir basename
// matches any allowed token (case-insensitive). Empty allowed → nil.
func FilterEntriesByNames(entries []Entry, allowed []string) []Entry {
	if len(allowed) == 0 {
		return nil
	}
	allowSet := map[string]struct{}{}
	for _, k := range allowed {
		k = strings.ToLower(strings.TrimSpace(k))
		if k != "" {
			allowSet[k] = struct{}{}
		}
	}
	var out []Entry
	for _, e := range entries {
		candidates := []string{
			strings.ToLower(strings.TrimSpace(e.Name)),
			strings.ToLower(strings.TrimSpace(ResolveSkillKey(e))),
		}
		if e.BaseDir != "" {
			candidates = append(candidates, strings.ToLower(filepath.Base(e.BaseDir)))
		}
		for _, c := range candidates {
			if c == "" {
				continue
			}
			if _, ok := allowSet[c]; ok {
				out = append(out, e)
				break
			}
		}
	}
	return out
}

// EmployeeSkillsDir returns ~/.openocta/employee_skills/<employeeID>.
func EmployeeSkillsDir(employeeID string, env func(string) string) string {
	employeeID = strings.TrimSpace(employeeID)
	if employeeID == "" {
		return ""
	}
	if env == nil {
		env = os.Getenv
	}
	return filepath.Join(paths.ResolveStateDir(env), "employee_skills", employeeID)
}
