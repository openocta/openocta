package handlers

import (
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/openocta/openocta/pkg/gateway/protocol"
	"github.com/openocta/openocta/pkg/logging"
)

const (
	defaultLimit    = 500
	defaultMaxBytes = 250_000
	maxLimit        = 5000
	maxBytes        = 1_000_000
)

var rollingLogRE = regexp.MustCompile(`^openocta-\d{4}-\d{2}-\d{2}\.log$`)

// LogsTailResult matches TS logs.tail response shape (logs-chat.ts LogsTailResultSchema).
// Lines is the raw line array from the file (string[]), same as TS readLogSlice.
type LogsTailResult struct {
	File      string   `json:"file"`
	Cursor    int64    `json:"cursor"`
	Size      int64    `json:"size"`
	Lines     []string `json:"lines"`
	Truncated bool     `json:"truncated"`
	Reset     bool     `json:"reset"`
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func isRollingLogFile(name string) bool {
	return rollingLogRE.MatchString(filepath.Base(name))
}

// resolveLogFile returns the file path to read. If the configured file exists, returns it.
// If it's a rolling log (openocta-YYYY-MM-DD.log) and doesn't exist, finds the most recent
func resolveLogFile(file string) string {
	if _, err := os.Stat(file); err == nil {
		return file
	}
	if !isRollingLogFile(file) {
		return file
	}
	dir := filepath.Dir(file)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return file
	}
	type entry struct {
		path  string
		mtime int64
	}
	var candidates []entry
	for _, e := range entries {
		if e.IsDir() || !rollingLogRE.MatchString(e.Name()) {
			continue
		}
		fullPath := filepath.Join(dir, e.Name())
		info, err := e.Info()
		if err != nil {
			continue
		}
		candidates = append(candidates, entry{path: fullPath, mtime: info.ModTime().UnixMilli()})
	}
	if len(candidates) == 0 {
		return file
	}
	sort.Slice(candidates, func(i, j int) bool { return candidates[j].mtime < candidates[i].mtime })
	return candidates[0].path
}

// readLogSlice reads a slice of log lines from file, mirroring TS readLogSlice.
// Returns raw lines (string[]) as in TS; no JSON parsing.
func readLogSlice(file string, cursor *int64, limit, maxBytes int) (cursorOut int64, size int64, lines []string, truncated, reset bool) {
	info, err := os.Stat(file)
	if err != nil {
		return 0, 0, nil, false, false
	}
	size = info.Size()
	maxBytes = clamp(maxBytes, 1, maxBytes)
	limit = clamp(limit, 1, maxLimit)

	var start int64
	var cur int64
	if cursor != nil && *cursor >= 0 {
		cur = *cursor
	}

	if cursor != nil {
		if cur > size {
			reset = true
			start = size - int64(maxBytes)
			if start < 0 {
				start = 0
			}
			truncated = start > 0
		} else {
			start = cur
			if size-start > int64(maxBytes) {
				reset = true
				truncated = true
				start = size - int64(maxBytes)
				if start < 0 {
					start = 0
				}
			}
		}
	} else {
		start = size - int64(maxBytes)
		if start < 0 {
			start = 0
		}
		truncated = start > 0
	}

	if size == 0 || size <= start {
		return size, size, nil, truncated, reset
	}

	length := size - start
	if length <= 0 {
		return size, size, nil, truncated, reset
	}
	buf := make([]byte, length)
	f, err := os.Open(file)
	if err != nil {
		return 0, size, nil, truncated, reset
	}
	defer f.Close()
	n, err := f.ReadAt(buf, start)
	if err != nil && n == 0 {
		return 0, size, nil, truncated, reset
	}
	text := string(buf[:n])

	// If start > 0, check byte before for line boundary
	prefix := byte(0)
	if start > 0 {
		pre := make([]byte, 1)
		if nn, _ := f.ReadAt(pre, start-1); nn == 1 {
			prefix = pre[0]
		}
	}

	lines = strings.Split(text, "\n")
	if start > 0 && prefix != '\n' && len(lines) > 0 {
		lines = lines[1:]
	}
	if len(lines) > 0 && lines[len(lines)-1] == "" {
		lines = lines[:len(lines)-1]
	}
	if len(lines) > limit {
		lines = lines[len(lines)-limit:]
	}
	return size, size, lines, truncated, reset
}

// parseLogsTailParams extracts cursor, limit, maxBytes from params.
func parseLogsTailParams(params map[string]interface{}) (cursor *int64, limit, maxBytes int) {
	limit = defaultLimit
	maxBytes = defaultMaxBytes

	if v, ok := params["limit"]; ok {
		switch x := v.(type) {
		case float64:
			if x >= 1 {
				limit = int(x)
			}
		case int:
			if x >= 1 {
				limit = x
			}
		}
	}
	limit = clamp(limit, 1, maxLimit)

	if v, ok := params["maxBytes"]; ok {
		switch x := v.(type) {
		case float64:
			if x >= 1 {
				maxBytes = int(x)
			}
		case int:
			if x >= 1 {
				maxBytes = x
			}
		}
	}
	maxBytes = clamp(maxBytes, 1, maxBytes)

	if v, ok := params["cursor"]; ok {
		switch x := v.(type) {
		case float64:
			if x >= 0 {
				c := int64(x)
				cursor = &c
			}
		case int:
			if x >= 0 {
				c := int64(x)
				cursor = &c
			}
		case int64:
			if x >= 0 {
				cursor = &x
			}
		case string:
			if n, err := strconv.ParseInt(x, 10, 64); err == nil && n >= 0 {
				cursor = &n
			}
		}
	}
	return cursor, limit, maxBytes
}

// validateLogsTailParams checks params are within expected types (no strict schema).
func validateLogsTailParams(params map[string]interface{}) bool {
	if params == nil {
		return true
	}
	for k, v := range params {
		switch k {
		case "cursor":
			if v != nil {
				switch v.(type) {
				case float64, int, int64, string:
					// ok
				default:
					return false
				}
			}
		case "limit", "maxBytes":
			if v != nil {
				switch v.(type) {
				case float64, int:
					// ok
				default:
					return false
				}
			}
		default:
			// additionalProperties: false in TS schema - reject unknown keys
			return false
		}
	}
	return true
}

// LogsTailHandler handles "logs.tail".
func LogsTailHandler(opts HandlerOpts) error {
	if !validateLogsTailParams(opts.Params) {
		opts.Respond(false, nil, &protocol.ErrorShape{
			Code:    protocol.ErrCodeInvalidRequest,
			Message: "invalid logs.tail params",
		}, nil)
		return nil
	}

	env := func(k string) string { return os.Getenv(k) }
	// Default: rolling path openocta-YYYY-MM-DD.log in preferred log dir (same as Node)
	settings := logging.GetResolvedLoggerSettings(env, "")
	configuredFile := settings.File

	// Override with config.logging.file if set
	if opts.Context != nil && opts.Context.LoadConfigSnapshot != nil {
		snap, err := opts.Context.LoadConfigSnapshot()
		if err == nil && snap != nil && snap.Config != nil && snap.Config.Logging != nil && snap.Config.Logging.File != "" {
			configuredFile = strings.TrimSpace(snap.Config.Logging.File)
		}
	}

	file := resolveLogFile(configuredFile)
	cursor, limit, maxBytes := parseLogsTailParams(opts.Params)

	cursorOut, size, lines, truncated, reset := readLogSlice(file, cursor, limit, maxBytes)

	opts.Respond(true, &LogsTailResult{
		File:      file,
		Cursor:    cursorOut,
		Size:      size,
		Lines:     lines,
		Truncated: truncated,
		Reset:     reset,
	}, nil, nil)
	return nil
}
