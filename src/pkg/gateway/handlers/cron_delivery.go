package handlers

import (
	"bytes"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/openocta/openocta/pkg/cron"
)

var (
	cronDeliveryDedupMu   sync.Mutex
	cronDeliveryDedupLast = map[string]time.Time{}
)

func inferAnnounceChatType(channel, to string) string {
	channel = strings.TrimSpace(strings.ToLower(channel))
	to = strings.TrimSpace(strings.ToLower(to))
	if channel == "wework" && strings.HasPrefix(to, "wrk") {
		return "group"
	}
	return ""
}

func normalizeCronDeliverySessionKey(sessionKey, jobID string) string {
	raw := strings.TrimSpace(sessionKey)
	runSuffix := ":run:"
	if idx := strings.Index(strings.ToLower(raw), runSuffix); idx >= 0 {
		return raw[:idx]
	}
	if jobID != "" {
		return "agent:main:cron:" + jobID
	}
	return raw
}

func shouldDeliverCronResult(sessionKey, jobID, summary, status string) bool {
	baseKey := normalizeCronDeliverySessionKey(sessionKey, jobID)
	sum := sha1.Sum([]byte(strings.TrimSpace(summary)))
	dedupKey := fmt.Sprintf("%s|%s|%x", baseKey, strings.TrimSpace(status), sum)
	now := time.Now()

	cronDeliveryDedupMu.Lock()
	defer cronDeliveryDedupMu.Unlock()

	for k, t := range cronDeliveryDedupLast {
		if now.Sub(t) > 30*time.Second {
			delete(cronDeliveryDedupLast, k)
		}
	}
	if last, ok := cronDeliveryDedupLast[dedupKey]; ok && now.Sub(last) < 10*time.Second {
		return false
	}
	cronDeliveryDedupLast[dedupKey] = now
	return true
}

// BuildCronChatSendParams assembles chat.send params from a cron job and resolved session info.
func BuildCronChatSendParams(job cron.CronJob, sessionKey, sessionId, message string) ChatSendParams {
	p := ChatSendParams{
		SessionKey:     sessionKey,
		Message:        message,
		SessionID:      sessionId,
		IdempotencyKey: "cron:" + job.ID,
	}
	// Cron 的 announce/webhook 投递统一在 DeliverCronResultIfNeeded 中执行，
	// 避免 chat.send 内的普通回复链路与完成后的 cron 投递重复发送。
	if job.RunConfig != nil {
		rc := job.RunConfig
		if rc.ModelRef != "" {
			p.ModelRef = rc.ModelRef
		}
		hasResources := len(rc.SkillKeys) > 0 || len(rc.McpServers) > 0
		if hasResources {
			p.Resources = map[string]interface{}{
				"configured": true,
				"skillKeys":  rc.SkillKeys,
				"mcpServers": rc.McpServers,
				"webSearch":  false,
			}
		}
	}
	return p
}

// cronJobIDFromSessionKey extracts job ID from cron session keys.
// Supports agent:<agentId>:cron:<jobId> and agent:<agentId>:cron:<jobId>:run:<sessionId>.
func cronJobIDFromSessionKey(sessionKey string) string {
	rawKey := strings.TrimSpace(sessionKey)
	parts := strings.Split(rawKey, ":")
	if len(parts) >= 6 && strings.EqualFold(parts[0], "agent") && strings.EqualFold(parts[2], "cron") && strings.EqualFold(parts[4], "run") {
		return parts[3]
	}
	lowerParts := strings.Split(strings.ToLower(rawKey), ":")
	if len(lowerParts) >= 4 && lowerParts[0] == "agent" && lowerParts[2] == "cron" {
		rawParts := strings.Split(rawKey, ":")
		if len(rawParts) >= 4 {
			return rawParts[3]
		}
	}
	return ""
}

// DeliverCronResultIfNeeded runs after a cron session completes (chat.send for agent:main:cron:<jobId>).
// If the job has delivery mode "announce" or "webhook", it sends the summary to the configured channel or webhook.
func DeliverCronResultIfNeeded(ctx *Context, sessionKey, summary, status string) {
	if ctx == nil || strings.TrimSpace(summary) == "" {
		return
	}
	jobID := cronJobIDFromSessionKey(sessionKey)
	if jobID == "" {
		return
	}
	if !shouldDeliverCronResult(sessionKey, jobID, summary, status) {
		return
	}
	// Get job: use List and find by ID (CronService may not expose GetJob in interface).
	list, err := ctx.CronService.List(true)
	if err != nil {
		return
	}
	var job *cron.CronJob
	for i := range list {
		if list[i].ID == jobID {
			job = &list[i]
			break
		}
	}
	if job == nil || job.Delivery == nil {
		return
	}
	d := job.Delivery
	mode := strings.TrimSpace(strings.ToLower(d.Mode))
	if mode != "announce" && mode != "webhook" {
		return
	}
	if mode == "announce" {
		channel := strings.TrimSpace(strings.ToLower(d.Channel))
		if channel == "" {
			channel = "last"
		}
		to := strings.TrimSpace(d.To)
		if to == "" {
			return
		}
		if ctx.InvokeMethod == nil {
			return
		}
		header := "定时任务: " + job.Name
		if len(header) > 50 {
			header = header[:47] + "......"
		}
		params := map[string]interface{}{
			"channel": channel,
			"to":      to,
			"message": summary,
			"header":  header,
		}
		if chatType := inferAnnounceChatType(channel, to); chatType != "" {
			params["chatType"] = chatType
		}
		_, _, _ = ctx.InvokeMethod("send", params)
		return
	}
	// webhook
	url := strings.TrimSpace(d.To)
	if url == "" {
		return
	}
	if !strings.HasPrefix(strings.ToLower(url), "http://") && !strings.HasPrefix(strings.ToLower(url), "https://") {
		return
	}
	body := map[string]interface{}{
		"jobId":      jobID,
		"sessionKey": sessionKey,
		"summary":    summary,
		"status":     status,
	}
	data, err := json.Marshal(body)
	if err != nil {
		return
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	_ = resp.Body.Close()
}
