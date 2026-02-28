package channels

import "time"

// InboundMessage 表示从 IM 通道进入 Gateway / Agent 的一条消息。
type InboundMessage struct {
	ID        string // 平台侧的消息 ID
	Channel   string // 逻辑通道 ID（由 BaseRuntimeImpl 填充）
	AccountID string // 账号 ID（由 BaseRuntimeImpl 填充）

	SenderID string // 发送者 ID（openId/userId/电话号码等）
	ChatID   string // 会话/群组/频道 ID
	ChatType string // "dm" | "group" | "channel" 等（平台相关）

	Content string                 // 文本内容
	Media   []RuntimeMedia         // 媒体附件
	Time    time.Time              // 消息时间
	Meta    map[string]interface{} // 额外元信息（如原始消息类型、mention 列表等）
}
