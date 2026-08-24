//go:build windows

package localbackend

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime/debug"
	"strings"
	"sync"

	"github.com/cloudwego/eino/adk/filesystem"
	"github.com/cloudwego/eino/schema"
)

func windowsShell() string {
	if shell := strings.TrimSpace(os.Getenv("COMSPEC")); shell != "" {
		return shell
	}
	return `C:\Windows\System32\cmd.exe`
}

func newWindowsCmd(ctx context.Context, command string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, windowsShell(), "/c", command)
	applyExecNoWindow(cmd)
	return cmd
}

func (b *Backend) Execute(ctx context.Context, input *filesystem.ExecuteRequest) (*filesystem.ExecuteResponse, error) {
	normalized, err := normalizeExecuteRequest(input)
	if err != nil {
		return nil, err
	}
	if err := b.validateCommand(normalized.Command); err != nil {
		return nil, err
	}

	cmd := newWindowsCmd(ctx, normalized.Command)

	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf

	exitCode := 0
	if err := cmd.Run(); err != nil {
		var exitError *exec.ExitError
		if errors.As(err, &exitError) {
			exitCode = exitError.ExitCode()
			stdoutStr := decodeWindowsConsoleOutput(stdoutBuf.Bytes())
			stderrStr := decodeWindowsConsoleOutput(stderrBuf.Bytes())
			parts := []string{fmt.Sprintf("command exited with non-zero code %d", exitCode)}
			if stdoutStr != "" {
				parts = append(parts, "[stdout]:\n"+stdoutStr)
			}
			if stderrStr != "" {
				parts = append(parts, "[stderr]:\n"+stderrStr)
			}
			return &filesystem.ExecuteResponse{
				Output:   strings.Join(parts, "\n"),
				ExitCode: &exitCode,
			}, nil
		}
		return nil, fmt.Errorf("failed to execute command: %w", err)
	}

	return &filesystem.ExecuteResponse{
		Output:   decodeWindowsConsoleOutput(stdoutBuf.Bytes()),
		ExitCode: &exitCode,
	}, nil
}

func (b *Backend) ExecuteStreaming(ctx context.Context, input *filesystem.ExecuteRequest) (*schema.StreamReader[*filesystem.ExecuteResponse], error) {
	normalized, err := normalizeExecuteRequest(input)
	if err != nil {
		return nil, err
	}
	if err := b.validateCommand(normalized.Command); err != nil {
		return nil, err
	}

	cmd, stdout, stderr, err := initStreamingCmd(ctx, normalized.Command)
	if err != nil {
		return nil, err
	}

	sr, w := schema.Pipe[*filesystem.ExecuteResponse](100)

	if err := cmd.Start(); err != nil {
		_ = stdout.Close()
		_ = stderr.Close()
		go sendErrorAndClose(w, fmt.Errorf("failed to start command: %w", err))
		return sr, nil
	}

	if input.RunInBackendGround {
		runCmdInBackground(ctx, cmd, stdout, stderr, w)
		return sr, nil
	}

	go streamCmdOutput(ctx, cmd, stdout, stderr, w)
	return sr, nil
}

func initStreamingCmd(ctx context.Context, command string) (*exec.Cmd, io.ReadCloser, io.ReadCloser, error) {
	cmd := newWindowsCmd(ctx, command)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		_ = stdout.Close()
		return nil, nil, nil, fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	return cmd, stdout, stderr, nil
}

func runCmdInBackground(ctx context.Context, cmd *exec.Cmd, stdout, stderr io.ReadCloser, w *schema.StreamWriter[*filesystem.ExecuteResponse]) {
	go func() {
		defer func() {
			if pe := recover(); pe != nil {
				_ = cmd.Process.Kill()
			}
			_ = stdout.Close()
			_ = stderr.Close()
		}()

		done := make(chan struct{})
		go func() {
			drainPipesConcurrently(stdout, stderr)
			_ = cmd.Wait()
			close(done)
		}()

		select {
		case <-done:
		case <-ctx.Done():
			_ = cmd.Process.Kill()
		}
	}()

	go func() {
		defer w.Close()
		w.Send(&filesystem.ExecuteResponse{Output: "command started in background\n", ExitCode: new(int)}, nil)
	}()
}

func drainPipesConcurrently(stdout, stderr io.Reader) {
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		_, _ = io.Copy(io.Discard, stdout)
	}()
	go func() {
		defer wg.Done()
		_, _ = io.Copy(io.Discard, stderr)
	}()
	wg.Wait()
}

func streamCmdOutput(ctx context.Context, cmd *exec.Cmd, stdout, stderr io.ReadCloser, w *schema.StreamWriter[*filesystem.ExecuteResponse]) {
	defer func() {
		if pe := recover(); pe != nil {
			w.Send(nil, newPanicErr(pe, debug.Stack()))
			return
		}
		w.Close()
	}()

	stderrData, stderrErr := readStderrAsync(stderr)

	hasOutput, err := streamStdout(ctx, cmd, stdout, w)
	if err != nil {
		w.Send(nil, err)
		return
	}

	if stdError := <-stderrErr; stdError != nil {
		w.Send(nil, stdError)
		return
	}

	handleCmdCompletion(cmd, stderrData, hasOutput, w)
}

func readStderrAsync(stderr io.Reader) (*[]byte, <-chan error) {
	stderrData := new([]byte)
	stderrErr := make(chan error, 1)

	go func() {
		defer func() {
			if pe := recover(); pe != nil {
				stderrErr <- newPanicErr(pe, debug.Stack())
				return
			}
			close(stderrErr)
		}()
		var err error
		*stderrData, err = io.ReadAll(stderr)
		if err != nil {
			stderrErr <- fmt.Errorf("failed to read stderr: %w", err)
		}
	}()

	return stderrData, stderrErr
}

func streamStdout(ctx context.Context, cmd *exec.Cmd, stdout io.Reader, w *schema.StreamWriter[*filesystem.ExecuteResponse]) (bool, error) {
	reader := bufio.NewReader(stdout)
	hasOutput := false

	for {
		line, err := reader.ReadString('\n')
		if line != "" {
			hasOutput = true
			decoded := decodeWindowsConsoleOutputString(line)
			select {
			case <-ctx.Done():
				_ = cmd.Process.Kill()
				return hasOutput, ctx.Err()
			default:
				w.Send(&filesystem.ExecuteResponse{Output: decoded}, nil)
			}
		}
		if err != nil {
			if err != io.EOF {
				return hasOutput, fmt.Errorf("error reading stdout: %w", err)
			}
			break
		}
	}

	return hasOutput, nil
}

func handleCmdCompletion(cmd *exec.Cmd, stderrData *[]byte, hasOutput bool, w *schema.StreamWriter[*filesystem.ExecuteResponse]) {
	if err := cmd.Wait(); err != nil {
		var exitError *exec.ExitError
		if errors.As(err, &exitError) {
			exitCode := exitError.ExitCode()
			parts := []string{fmt.Sprintf("command exited with non-zero code %d", exitCode)}
			if stderrStr := decodeWindowsConsoleOutput(*stderrData); stderrStr != "" {
				parts = append(parts, "[stderr]:\n"+stderrStr)
			}
			w.Send(&filesystem.ExecuteResponse{
				Output:   strings.Join(parts, "\n"),
				ExitCode: &exitCode,
			}, nil)
			return
		}

		w.Send(nil, fmt.Errorf("command failed: %w", err))
		return
	}

	if !hasOutput {
		w.Send(&filesystem.ExecuteResponse{ExitCode: new(int)}, nil)
	}
}

func sendErrorAndClose(w *schema.StreamWriter[*filesystem.ExecuteResponse], err error) {
	defer w.Close()
	w.Send(nil, err)
}

type panicErr struct {
	info  any
	stack []byte
}

func (p *panicErr) Error() string {
	return fmt.Sprintf("panic error: %v, \nstack: %s", p.info, string(p.stack))
}

func newPanicErr(info any, stack []byte) error {
	return &panicErr{
		info:  info,
		stack: stack,
	}
}
