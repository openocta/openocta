package daemon

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// BuildLaunchAgentPlist generates an XML plist for the Gateway LaunchAgent.
func BuildLaunchAgentPlist(opts struct {
	Label            string
	Comment          string
	ProgramArguments []string
	WorkingDirectory string
	StdoutPath       string
	StderrPath       string
	Environment      map[string]string
}) string {
	label := opts.Label
	if label == "" {
		label = GatewayLaunchAgentLabel
	}
	comment := opts.Comment
	if comment == "" {
		comment = "OpenOcta Gateway"
	}

	argsXML := ""
	for _, a := range opts.ProgramArguments {
		argsXML += "\n      <string>" + plistEscape(a) + "</string>"
	}

	envXML := ""
	if len(opts.Environment) > 0 {
		envXML = "\n    <key>EnvironmentVariables</key>\n    <dict>"
		for k, v := range opts.Environment {
			if v == "" {
				continue
			}
			envXML += "\n      <key>" + plistEscape(k) + "</key>"
			envXML += "\n      <string>" + plistEscape(v) + "</string>"
		}
		envXML += "\n    </dict>"
	}

	workingDirXML := ""
	if opts.WorkingDirectory != "" {
		workingDirXML = "\n    <key>WorkingDirectory</key>\n    <string>" + plistEscape(opts.WorkingDirectory) + "</string>"
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>` + plistEscape(label) + `</string>
    <key>ProgramArguments</key>
    <array>` + argsXML + `
    </array>
    <key>StandardOutPath</key>
    <string>` + plistEscape(opts.StdoutPath) + `</string>
    <key>StandardErrorPath</key>
    <string>` + plistEscape(opts.StderrPath) + `</string>
    <key>KeepAlive</key>
    <true/>` + workingDirXML + envXML + `
</dict>
</plist>
`
}

func plistEscape(s string) string {
	return strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		"\"", "&quot;",
		"'", "&apos;",
	).Replace(s)
}

// WritePlist writes the plist to the LaunchAgents directory.
func WritePlist(path, content string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("mkdir: %w", err)
	}
	return os.WriteFile(path, []byte(content), 0644)
}

// PlistExists returns true if the plist file exists.
func PlistExists(label string) bool {
	path := ResolvePlistPath(label)
	_, err := os.Stat(path)
	return err == nil
}
