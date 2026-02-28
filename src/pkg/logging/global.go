// Package logging: global logger (console + file, daily rolling).
package logging

import (
	"fmt"
	"os"
	"sync"
	"time"
)

// GlobalOpts configures the global logger (levels, log dir).
type GlobalOpts struct {
	// LogDir is the directory for rolling log files. Empty means ResolvePreferredLogDir().
	LogDir string
	// Level is the minimum level for file output (e.g. LevelInfo). Default LevelInfo.
	Level int
	// ConsoleLevel is the minimum level for console output. Default LevelInfo.
	ConsoleLevel int
}

// globalState holds the initialized global logger state.
type globalState struct {
	mu           sync.Mutex
	logDir       string
	fileLogger   *FileLogger
	fileDate     string // YYYY-MM-DD for rolling
	console      *Logger
	level        int
	consoleLevel int
}

var (
	global   *globalState
	globalMu sync.Mutex
)

// InitGlobal initializes the global logger: console (text) + file (JSON, daily path).
// If logDir is empty, ResolvePreferredLogDir() is used (/tmp/openocta).
func InitGlobal(logDir string, opts GlobalOpts) {
	globalMu.Lock()
	defer globalMu.Unlock()

	if global != nil {
		// Re-init: close previous file logger
		if global.fileLogger != nil {
			_ = global.fileLogger.Close()
		}
	}

	if logDir == "" {
		logDir = ResolvePreferredLogDir()
	}
	level := opts.Level
	if level < LevelFatal || level > LevelTrace {
		level = LevelInfo
	}
	consoleLevel := opts.ConsoleLevel
	if consoleLevel < LevelFatal || consoleLevel > LevelTrace {
		consoleLevel = LevelInfo
	}

	path := DefaultRollingLogPath(logDir)
	fileLogger, err := NewFileLogger(path)
	if err != nil {
		// Fallback: no file logging, console only
		fileLogger = nil
	}
	fileDate := time.Now().UTC().Format("2006-01-02")

	global = &globalState{
		logDir:       logDir,
		fileLogger:   fileLogger,
		fileDate:     fileDate,
		console:      New(os.Stderr, ""),
		level:        level,
		consoleLevel: consoleLevel,
	}
}

// ensureFileForToday closes and reopens the file logger if the date has changed (daily rolling).
func (g *globalState) ensureFileForToday() {
	today := time.Now().UTC().Format("2006-01-02")
	if today == g.fileDate && g.fileLogger != nil {
		return
	}
	if g.fileLogger != nil {
		_ = g.fileLogger.Close()
		g.fileLogger = nil
	}
	path := DefaultRollingLogPath(g.logDir)
	fl, err := NewFileLogger(path)
	if err != nil {
		return
	}
	g.fileLogger = fl
	g.fileDate = today
}

// logWithPrefix writes to console and file (with optional prefix). Caller must hold globalMu if needed; logWithPrefix locks g.mu.
func (g *globalState) logWithPrefix(prefix string, level int, levelName, format string, args ...any) {
	if g == nil {
		return
	}
	g.mu.Lock()
	defer g.mu.Unlock()

	if level > g.consoleLevel && level > g.level {
		return
	}
	msg := fmt.Sprintf(format, args...)
	if prefix != "" {
		msg = prefix + " " + msg
	}

	if level <= g.consoleLevel {
		switch levelName {
		case "ERROR":
			g.console.Error("%s", msg)
		case "WARN":
			g.console.Warn("%s", msg)
		case "INFO":
			g.console.Info("%s", msg)
		case "DEBUG":
			g.console.Debug("%s", msg)
		default:
			g.console.Info("%s", msg)
		}
	}

	if level <= g.level {
		g.ensureFileForToday()
		if g.fileLogger != nil {
			switch levelName {
			case "ERROR":
				g.fileLogger.Error("%s", msg)
			case "WARN":
				g.fileLogger.Warn("%s", msg)
			case "INFO":
				g.fileLogger.Info("%s", msg)
			case "DEBUG":
				g.fileLogger.Debug("%s", msg)
			default:
				g.fileLogger.Info("%s", msg)
			}
		}
	}
}

// Sub returns a logger with a component prefix (e.g. "chat", "ws"). Safe to call before InitGlobal; logs are no-op until init.
func Sub(component string) *GlobalLogger {
	return &GlobalLogger{prefix: component}
}

// GlobalLogger is a component-scoped logger that uses the global state.
type GlobalLogger struct {
	prefix string
}

// Info logs at INFO level.
func (l *GlobalLogger) Info(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix(l.prefix, LevelInfo, "INFO", format, args...)
	}
}

// Warn logs at WARN level.
func (l *GlobalLogger) Warn(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix(l.prefix, LevelWarn, "WARN", format, args...)
	}
}

// Error logs at ERROR level.
func (l *GlobalLogger) Error(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix(l.prefix, LevelError, "ERROR", format, args...)
	}
}

// Debug logs at DEBUG level.
func (l *GlobalLogger) Debug(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix(l.prefix, LevelDebug, "DEBUG", format, args...)
	}
}

// Package-level functions: use global state with no prefix. No-op if InitGlobal not called.

// Info logs at INFO level to console and file.
func Info(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix("", LevelInfo, "INFO", format, args...)
	}
}

// Warn logs at WARN level to console and file.
func Warn(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix("", LevelWarn, "WARN", format, args...)
	}
}

// Error logs at ERROR level to console and file.
func Error(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix("", LevelError, "ERROR", format, args...)
	}
}

// Debug logs at DEBUG level to console and file.
func Debug(format string, args ...any) {
	globalMu.Lock()
	g := global
	globalMu.Unlock()
	if g != nil {
		g.logWithPrefix("", LevelDebug, "DEBUG", format, args...)
	}
}
