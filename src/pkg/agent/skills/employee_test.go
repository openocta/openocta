package skills

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/openocta/openocta/pkg/employees"
)

func writeSkill(t *testing.T, dir, name, desc string) {
	t.Helper()
	skillDir := filepath.Join(dir, name)
	if err := os.MkdirAll(skillDir, 0o755); err != nil {
		t.Fatal(err)
	}
	body := "---\nname: " + name + "\ndescription: " + desc + "\n---\n\n# " + name + "\n"
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestLoadEmployeeEntriesExclusiveOnlyWhenNoSkillIDs(t *testing.T) {
	tmp := t.TempDir()
	state := filepath.Join(tmp, "state")
	workspace := filepath.Join(tmp, "workspace")
	wsSkills := filepath.Join(workspace, "skills")
	empID := "sales-bot"
	empDir := filepath.Join(state, "employee_skills", empID)

	writeSkill(t, wsSkills, "global-a", "global a")
	writeSkill(t, wsSkills, "global-b", "global b")
	writeSkill(t, empDir, "emp-only", "employee exclusive")

	if err := os.MkdirAll(filepath.Join(state, "employees", empID), 0o755); err != nil {
		t.Fatal(err)
	}
	m := &employees.Manifest{ID: empID, Name: "Sales", Enabled: true}
	if err := employees.SaveManifest(m, func(k string) string {
		if k == "OPENOCTA_STATE_DIR" || k == "OPENCLAW_STATE_DIR" {
			return state
		}
		return ""
	}); err != nil {
		t.Fatal(err)
	}

	env := func(k string) string {
		if k == "OPENOCTA_STATE_DIR" || k == "OPENCLAW_STATE_DIR" {
			return state
		}
		return ""
	}

	got := LoadEmployeeEntries(workspace, nil, empID, env)
	if len(got) != 1 {
		t.Fatalf("expected 1 exclusive skill, got %d (%v)", len(got), names(got))
	}
	if got[0].Name != "emp-only" {
		t.Fatalf("got %q want emp-only", got[0].Name)
	}
}

func TestLoadEmployeeEntriesSkillIDsPlusExclusive(t *testing.T) {
	tmp := t.TempDir()
	state := filepath.Join(tmp, "state")
	workspace := filepath.Join(tmp, "workspace")
	wsSkills := filepath.Join(workspace, "skills")
	empID := "ops-bot"
	empDir := filepath.Join(state, "employee_skills", empID)

	writeSkill(t, wsSkills, "global-a", "global a")
	writeSkill(t, wsSkills, "global-b", "global b")
	writeSkill(t, empDir, "emp-only", "employee exclusive")

	env := func(k string) string {
		if k == "OPENOCTA_STATE_DIR" || k == "OPENCLAW_STATE_DIR" {
			return state
		}
		return ""
	}
	if err := os.MkdirAll(filepath.Join(state, "employees", empID), 0o755); err != nil {
		t.Fatal(err)
	}
	m := &employees.Manifest{
		ID:       empID,
		Name:     "Ops",
		Enabled:  true,
		SkillIDs: []string{"global-a"},
	}
	if err := employees.SaveManifest(m, env); err != nil {
		t.Fatal(err)
	}

	got := LoadEmployeeEntries(workspace, nil, empID, env)
	byName := map[string]bool{}
	for _, e := range got {
		byName[e.Name] = true
	}
	if !byName["global-a"] || !byName["emp-only"] {
		t.Fatalf("expected global-a + emp-only, got %v", names(got))
	}
	if byName["global-b"] {
		t.Fatalf("global-b should be filtered out, got %v", names(got))
	}
}

func names(entries []Entry) []string {
	out := make([]string, 0, len(entries))
	for _, e := range entries {
		out = append(out, e.Name)
	}
	return out
}
