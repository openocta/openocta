package scenario

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const siteAPIEnvKey = "OPENOCTA_SITE_API_BASE_URL"

// SiteAPIBase returns the remote market API base URL.
func SiteAPIBase() string {
	if v := strings.TrimSpace(os.Getenv(siteAPIEnvKey)); v != "" {
		return strings.TrimRight(v, "/")
	}
	return "https://openocta.com"
}

func fetchZipFromSite(ctx context.Context, base, kind, id string) ([]byte, error) {
	var path string
	switch kind {
	case "employee":
		path = fmt.Sprintf("%s/api/v1/employees/%s/download", base, id)
	case "skill":
		path = fmt.Sprintf("%s/api/v1/skills/%s/download", base, id)
	case "mcp":
		path = fmt.Sprintf("%s/api/v1/mcps/%s/download", base, id)
	default:
		return nil, fmt.Errorf("unknown kind %q", kind)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec
	}
	client := &http.Client{Timeout: 120 * time.Second, Transport: tr}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return nil, fmt.Errorf("download %s: %s %s", id, resp.Status, strings.TrimSpace(string(b)))
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, 50<<20))
	if err != nil {
		return nil, err
	}
	if len(data) < 2 || data[0] != 0x50 || data[1] != 0x4b {
		return nil, fmt.Errorf("invalid zip for %s", id)
	}
	return data, nil
}
