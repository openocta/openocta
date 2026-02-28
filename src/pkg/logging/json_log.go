// Package logging: JSON log line format compatible with Node tslog (time, _meta, path, logLevelId, logLevelName).
package logging

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"
)

// LogMeta mirrors Node tslog _meta (runtime, hostname, name, date, logLevelId, logLevelName, path).
type LogMeta struct {
	Runtime        string   `json:"runtime"`
	RuntimeVersion string   `json:"runtimeVersion"`
	Hostname       string   `json:"hostname"`
	Name           string   `json:"name"`
	Date           string   `json:"date"`
	LogLevelID     int      `json:"logLevelId"`
	LogLevelName   string   `json:"logLevelName"`
	Path           *LogPath `json:"path,omitempty"`
}

// LogPath mirrors Node tslog path (filePath, fileName, fileLine, filePathWithLine).
type LogPath struct {
	FullFilePath     string `json:"fullFilePath,omitempty"`
	FileName         string `json:"fileName,omitempty"`
	FileNameWithLine string `json:"fileNameWithLine,omitempty"`
	FileColumn       string `json:"fileColumn,omitempty"`
	FileLine         string `json:"fileLine,omitempty"`
	FilePath         string `json:"filePath,omitempty"`
	FilePathWithLine string `json:"filePathWithLine,omitempty"`
	Method           string `json:"method,omitempty"`
}

// jsonLogLine is the JSON object written per line (compatible with Node tslog).
// Keys "0", "1", ... hold message parts; _meta and time are required.
type jsonLogLine map[string]interface{}

func getHostname() string {
	h, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return h
}

func callerPath(skip int) *LogPath {
	_, file, line, ok := runtime.Caller(skip)
	if !ok {
		return nil
	}
	dir, name := filepath.Split(file)
	fullPath := filepath.Join(dir, name)
	fileLine := fmt.Sprintf("%d", line)
	fileNameWithLine := name + ":" + fileLine
	filePathWithLine := fullPath + ":" + fileLine
	return &LogPath{
		FullFilePath:     "file://" + fullPath,
		FileName:         name,
		FileNameWithLine: fileNameWithLine,
		FileLine:         fileLine,
		FilePath:         fullPath,
		FilePathWithLine: filePathWithLine,
		Method:           "log",
	}
}

// JSONLineWriter writes log lines as JSON (one object per line) to w.
type JSONLineWriter struct {
	w    io.Writer
	mu   sync.Mutex
	name string
}

// NewJSONLineWriter creates a writer that formats each Write as a JSON log line with _meta and time.
func NewJSONLineWriter(w io.Writer, name string) *JSONLineWriter {
	if name == "" {
		name = "openocta"
	}
	return &JSONLineWriter{w: w, name: name}
}

// WriteLine writes a single JSON log line (levelName, levelID, message, optional file info).
func (j *JSONLineWriter) WriteLine(levelName string, levelID int, message string, fileSkip int) error {
	now := time.Now().UTC()
	date := now.Format(time.RFC3339Nano)
	meta := &LogMeta{
		Runtime:        "go",
		RuntimeVersion: RuntimeVersion(),
		Hostname:       getHostname(),
		Name:           j.name,
		Date:           date,
		LogLevelID:     levelID,
		LogLevelName:   levelName,
		Path:           callerPath(fileSkip),
	}
	line := jsonLogLine{
		"0":     message,
		"_meta": meta,
		"time":  date,
	}
	b, err := json.Marshal(line)
	if err != nil {
		return err
	}
	j.mu.Lock()
	_, err = j.w.Write(append(b, '\n'))
	j.mu.Unlock()
	return err
}

// FileLogger writes JSON log lines to a file (rolling path openocta-YYYY-MM-DD.log compatible with Node).
type FileLogger struct {
	w  *JSONLineWriter
	f  *os.File
	mu sync.Mutex
}

// NewFileLogger creates a logger that writes JSON lines to path. Creates dir if needed.
func NewFileLogger(path string) (*FileLogger, error) {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, err
	}
	return &FileLogger{w: NewJSONLineWriter(f, "openocta"), f: f}, nil
}

// Close closes the underlying log file.
func (f *FileLogger) Close() error {
	if f.f == nil {
		return nil
	}
	err := f.f.Close()
	f.f = nil
	return err
}

// Info writes an INFO-level JSON log line.
func (f *FileLogger) Info(format string, args ...any) {
	msg := fmt.Sprintf(format, args...)
	_ = f.w.WriteLine("INFO", LevelInfo, msg, 3)
}

// Warn writes a WARN-level JSON log line.
func (f *FileLogger) Warn(format string, args ...any) {
	msg := fmt.Sprintf(format, args...)
	_ = f.w.WriteLine("WARN", LevelWarn, msg, 3)
}

// Error writes an ERROR-level JSON log line.
func (f *FileLogger) Error(format string, args ...any) {
	msg := fmt.Sprintf(format, args...)
	_ = f.w.WriteLine("ERROR", LevelError, msg, 3)
}

// Debug writes a DEBUG-level JSON log line.
func (f *FileLogger) Debug(format string, args ...any) {
	msg := fmt.Sprintf(format, args...)
	_ = f.w.WriteLine("DEBUG", LevelDebug, msg, 3)
}
