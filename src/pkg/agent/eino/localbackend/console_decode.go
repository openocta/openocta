package localbackend

import (
	"unicode/utf16"
	"unicode/utf8"

	"golang.org/x/text/encoding"
	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/encoding/japanese"
	"golang.org/x/text/encoding/korean"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/encoding/traditionalchinese"
	"golang.org/x/text/transform"
)

// decodeConsoleOutputBytes converts console/pipe bytes to a UTF-8 string.
// Valid UTF-8 (including ASCII) is returned as-is. Otherwise the bytes are
// decoded with the given Windows ANSI code page (e.g. 936 GBK on zh-CN).
func decodeConsoleOutputBytes(b []byte, ansiCodePage uint32) string {
	if len(b) == 0 {
		return ""
	}
	if decoded, ok := decodeUTF16ConsoleOutput(b); ok {
		return decoded
	}
	if utf8.Valid(b) {
		return string(b)
	}
	if enc := encodingForCodePage(ansiCodePage); enc != nil {
		if out, err := enc.NewDecoder().Bytes(b); err == nil {
			return string(out)
		}
		// Ignore trailing incomplete sequences from streaming reads.
		if out, _, err := transform.Bytes(enc.NewDecoder(), b); err == nil && len(out) > 0 {
			return string(out)
		}
	}
	return string(b)
}

func decodeUTF16ConsoleOutput(b []byte) (string, bool) {
	if len(b) < 2 {
		return "", false
	}
	var order int // 1 = LE, 2 = BE
	switch {
	case b[0] == 0xFF && b[1] == 0xFE:
		order = 1
		b = b[2:]
	case b[0] == 0xFE && b[1] == 0xFF:
		order = 2
		b = b[2:]
	default:
		return "", false
	}
	if len(b)%2 != 0 {
		b = b[:len(b)-1]
	}
	u16 := make([]uint16, 0, len(b)/2)
	for i := 0; i+1 < len(b); i += 2 {
		if order == 1 {
			u16 = append(u16, uint16(b[i])|uint16(b[i+1])<<8)
		} else {
			u16 = append(u16, uint16(b[i])<<8|uint16(b[i+1]))
		}
	}
	return string(utf16.Decode(u16)), true
}

func encodingForCodePage(cp uint32) encoding.Encoding {
	switch cp {
	case 936:
		return simplifiedchinese.GBK
	case 54936:
		return simplifiedchinese.GB18030
	case 950:
		return traditionalchinese.Big5
	case 932:
		return japanese.ShiftJIS
	case 949:
		return korean.EUCKR
	case 1250:
		return charmap.Windows1250
	case 1251:
		return charmap.Windows1251
	case 1252:
		return charmap.Windows1252
	case 1253:
		return charmap.Windows1253
	case 1254:
		return charmap.Windows1254
	case 1255:
		return charmap.Windows1255
	case 1256:
		return charmap.Windows1256
	case 1257:
		return charmap.Windows1257
	case 1258:
		return charmap.Windows1258
	case 874:
		return charmap.Windows874
	case 20866:
		return charmap.KOI8R
	case 21866:
		return charmap.KOI8U
	case 28591:
		return charmap.ISO8859_1
	default:
		return nil
	}
}
