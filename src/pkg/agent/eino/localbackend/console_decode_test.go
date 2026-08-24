package localbackend

import (
	"testing"

	"golang.org/x/text/encoding/simplifiedchinese"
)

func TestDecodeConsoleOutputBytesUTF8Passthrough(t *testing.T) {
	t.Parallel()
	in := []byte("hello 中文\n")
	got := decodeConsoleOutputBytes(in, 936)
	if got != string(in) {
		t.Fatalf("got %q, want %q", got, in)
	}
}

func TestDecodeConsoleOutputBytesGBK(t *testing.T) {
	t.Parallel()
	// "不是内部或外部命令" in GBK — classic cmd.exe error fragment.
	gbk, err := simplifiedchinese.GBK.NewEncoder().Bytes([]byte("不是内部或外部命令"))
	if err != nil {
		t.Fatalf("encode gbk: %v", err)
	}
	got := decodeConsoleOutputBytes(gbk, 936)
	if got != "不是内部或外部命令" {
		t.Fatalf("got %q, want Chinese text", got)
	}
}

func TestDecodeConsoleOutputBytesSysteminfoLike(t *testing.T) {
	t.Parallel()
	src := "OS 名称: Microsoft Windows 11 专业工作站版"
	gbk, err := simplifiedchinese.GBK.NewEncoder().Bytes([]byte(src))
	if err != nil {
		t.Fatalf("encode gbk: %v", err)
	}
	got := decodeConsoleOutputBytes(gbk, 936)
	if got != src {
		t.Fatalf("got %q, want %q", got, src)
	}
}

func TestDecodeConsoleOutputBytesUTF16LE(t *testing.T) {
	t.Parallel()
	// BOM + "Hi" in UTF-16 LE
	in := []byte{0xFF, 0xFE, 'H', 0x00, 'i', 0x00}
	got := decodeConsoleOutputBytes(in, 936)
	if got != "Hi" {
		t.Fatalf("got %q, want Hi", got)
	}
}

func TestDecodeConsoleOutputBytesUnknownCodePageFallsBack(t *testing.T) {
	t.Parallel()
	raw := []byte{0xFF, 0xFE, 0x01} // invalid utf8, unknown-ish — wait FF FE is UTF16 BOM
	// Use raw invalid utf8 without BOM
	raw = []byte{0x80, 0x81, 0x82}
	got := decodeConsoleOutputBytes(raw, 99999)
	if got != string(raw) {
		t.Fatalf("expected raw fallback, got %q", got)
	}
}
