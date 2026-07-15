package eino

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cloudwego/eino/adk"
	einotool "github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/schema"
)

const (
	toolNameExecute        = "execute"
	maxExecuteCommandRunes = 4096
)

// PrepareToolCallArgumentsJSON normalizes + validates tool arguments before invocation.
// For filesystem tools it remaps common LLM aliases (path/file/filename) onto file_path
// so write_file does not land on filepath.Clean("") == "." ("open .: is a directory").
func PrepareToolCallArgumentsJSON(toolName, raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", fmt.Errorf("工具 %q 的参数为空", toolName)
	}
	if !json.Valid([]byte(raw)) {
		return "", fmt.Errorf("%s", invalidToolArgumentsMessage(toolName, raw))
	}
	name := strings.TrimSpace(toolName)
	if strings.EqualFold(name, toolNameExecute) {
		if err := validateExecuteToolArguments(raw); err != nil {
			return "", err
		}
		return raw, nil
	}
	if isFilesystemPathTool(name) {
		normalized, err := normalizeFilesystemToolArguments(name, raw)
		if err != nil {
			return "", err
		}
		return normalized, nil
	}
	return raw, nil
}

// ValidateToolCallArgumentsJSON checks tool arguments before JSON unmarshaling in Eino tools.
func ValidateToolCallArgumentsJSON(toolName, raw string) error {
	_, err := PrepareToolCallArgumentsJSON(toolName, raw)
	return err
}

func isFilesystemPathTool(toolName string) bool {
	switch strings.ToLower(strings.TrimSpace(toolName)) {
	case "write_file", "edit_file", "read_file":
		return true
	default:
		return false
	}
}

func normalizeFilesystemToolArguments(toolName, raw string) (string, error) {
	var obj map[string]json.RawMessage
	if err := json.Unmarshal([]byte(raw), &obj); err != nil {
		return "", fmt.Errorf("工具 %q 的参数 JSON 无效：%w", toolName, err)
	}
	if _, ok := obj["file_path"]; !ok {
		for _, alt := range []string{"path", "file", "filename", "filepath", "filePath"} {
			if v, ok := obj[alt]; ok {
				obj["file_path"] = v
				delete(obj, alt)
				break
			}
		}
	}
	filePath := ""
	if rawPath, ok := obj["file_path"]; ok {
		_ = json.Unmarshal(rawPath, &filePath)
	}
	filePath = strings.TrimSpace(filePath)
	if filePath == "" || filePath == "." {
		return "", fmt.Errorf(
			"工具 %q 缺少有效 file_path（勿用空路径/当前目录）。请传 JSON 字段 file_path，并指向工作区内具体文件，例如 {\"file_path\":\"C:\\\\Users\\\\...\\\\workspace\\\\script.ps1\",\"content\":\"...\"}",
			toolName,
		)
	}
	out, err := json.Marshal(obj)
	if err != nil {
		return "", err
	}
	return string(out), nil
}

func validateExecuteToolArguments(raw string) error {
	var args struct {
		Command string `json:"command"`
	}
	if err := json.Unmarshal([]byte(raw), &args); err != nil {
		return fmt.Errorf("execute 参数解析失败: %w", err)
	}
	cmd := strings.TrimSpace(args.Command)
	if cmd == "" {
		return fmt.Errorf("execute 的 command 不能为空")
	}
	if len([]rune(cmd)) > maxExecuteCommandRunes {
		return fmt.Errorf(
			"execute 的 command 过长（%d 字符，上限 %d）。请改用 write_file 写入脚本后 powershell -File \"...\" 执行，或使用 skill 脚本",
			len([]rune(cmd)), maxExecuteCommandRunes,
		)
	}
	return nil
}

func invalidToolArgumentsMessage(toolName, raw string) string {
	var probe map[string]json.RawMessage
	err := json.Unmarshal([]byte(raw), &probe)
	errText := ""
	if err != nil {
		errText = err.Error()
	}
	if isLikelyTruncatedToolArguments(raw, errText) {
		return truncatedToolArgumentsMessage(toolName, len(raw), errText)
	}
	if errText != "" {
		return fmt.Sprintf("工具 %q 的参数 JSON 无效（%s）。请修正 JSON 后重试。", toolName, errText)
	}
	return fmt.Sprintf("工具 %q 的参数 JSON 无效。请修正 JSON 后重试。", toolName)
}

func isLikelyTruncatedToolArguments(raw, errText string) bool {
	lower := strings.ToLower(errText)
	if strings.Contains(lower, "unexpected end") ||
		strings.Contains(lower, "eof") ||
		strings.Contains(lower, "unterminated") {
		return true
	}
	raw = strings.TrimSpace(raw)
	if !strings.HasPrefix(raw, "{") {
		return false
	}
	if strings.HasSuffix(raw, `\`) || strings.HasSuffix(raw, `\\`) {
		return true
	}
	open, close := 0, 0
	inString := false
	escaped := false
	for _, r := range raw {
		if inString {
			if escaped {
				escaped = false
				continue
			}
			switch r {
			case '\\':
				escaped = true
			case '"':
				inString = false
			}
			continue
		}
		switch r {
		case '"':
			inString = true
		case '{':
			open++
		case '}':
			close++
		}
	}
	return inString || open > close
}

func truncatedToolArgumentsMessage(toolName string, argLen int, errText string) string {
	var b strings.Builder
	fmt.Fprintf(&b, "工具 %q 的参数 JSON 不完整（约 %d 字符处截断", toolName, argLen)
	if errText != "" {
		fmt.Fprintf(&b, "：%s", errText)
	}
	b.WriteString("）。通常因模型输出达到 max_tokens 上限（finish_reason=length），arguments 未生成完毕。\n\n")
	b.WriteString("请勿用更长的 inline 命令重试。请改用：\n")
	b.WriteString("1. 拆成多个更短的 execute 步骤\n")
	b.WriteString("2. write_file 写入 .ps1/.sh 脚本，再 execute：`powershell -NoProfile -ExecutionPolicy Bypass -File \"<path>\"`\n")
	b.WriteString("3. Windows 进程/桌面任务优先使用 desktop-control skill 的 process-manager.ps1 等现成脚本\n")
	b.WriteString("4. 避免在 powershell -Command \"...\" 中塞入大段脚本；单行 command 建议 < 800 字符\n")
	b.WriteString("5. 如仍频繁截断，请提高模型的 max_output_tokens / max_completion_tokens")
	return b.String()
}

type toolArgumentsGuardMiddleware struct {
	*adk.BaseChatModelAgentMiddleware
}

func newToolArgumentsGuardMiddleware() adk.ChatModelAgentMiddleware {
	return &toolArgumentsGuardMiddleware{
		BaseChatModelAgentMiddleware: &adk.BaseChatModelAgentMiddleware{},
	}
}

func (m *toolArgumentsGuardMiddleware) WrapInvokableToolCall(
	_ context.Context,
	endpoint adk.InvokableToolCallEndpoint,
	tCtx *adk.ToolContext,
) (adk.InvokableToolCallEndpoint, error) {
	return func(ctx context.Context, args string, opts ...einotool.Option) (string, error) {
		normalized, err := PrepareToolCallArgumentsJSON(tCtx.Name, args)
		if err != nil {
			return err.Error(), nil
		}
		return endpoint(ctx, normalized, opts...)
	}, nil
}

func (m *toolArgumentsGuardMiddleware) WrapStreamableToolCall(
	_ context.Context,
	endpoint adk.StreamableToolCallEndpoint,
	tCtx *adk.ToolContext,
) (adk.StreamableToolCallEndpoint, error) {
	return func(ctx context.Context, args string, opts ...einotool.Option) (*schema.StreamReader[string], error) {
		normalized, err := PrepareToolCallArgumentsJSON(tCtx.Name, args)
		if err != nil {
			return singleChunkStream(err.Error()), nil
		}
		return endpoint(ctx, normalized, opts...)
	}, nil
}
