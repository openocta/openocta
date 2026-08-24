package localbackend

import (
	"runtime"
	"testing"
)

func TestNormalizeShellCommand(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		in   string
		want string
	}{
		{"trim only", "  echo hi  ", "echo hi"},
		{"windows fold inline", "e={if ($_.\n\t^", ""},
		{"multiple lines unix", "echo a\necho b", "echo a && echo b"},
		{"empty lines skipped", "echo a\n\necho b", "echo a && echo b"},
		{"cr lf", "echo a\r\necho b", "echo a && echo b"},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			got := NormalizeShellCommand(tc.in)
			switch tc.name {
			case "windows fold inline":
				if runtime.GOOS == "windows" {
					want := "e={if ($_. ^"
					if got != want {
						t.Fatalf("NormalizeShellCommand(%q) = %q, want %q", tc.in, got, want)
					}
					return
				}
				want := "e={if ($_. && ^"
				if got != want {
					t.Fatalf("NormalizeShellCommand(%q) = %q, want %q", tc.in, got, want)
				}
				return
			case "multiple lines unix", "empty lines skipped", "cr lf":
				if runtime.GOOS == "windows" {
					if got != "echo a echo b" {
						t.Fatalf("windows join = %q, want %q", got, "echo a echo b")
					}
					return
				}
			}
			if tc.want != "" && got != tc.want {
				t.Fatalf("NormalizeShellCommand(%q) = %q, want %q", tc.in, got, tc.want)
			}
		})
	}
}
