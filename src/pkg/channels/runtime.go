package channels

import (
	"context"
	"time"
)

// RuntimeOutboundMessage 表示由 Agent / Gateway 发送到具体 IM 通道的一条消息。
// 与 pkg/outbound 中的 OutboundContext 类似，但更贴近通道运行时的语义。
type RuntimeOutboundMessage struct {
	Channel   string                 // 逻辑通道 ID，例如 "feishu"、"telegram"
	AccountID string                 // 账号 ID，如 "default"、"bot-1"
	ChatID    string                 // 会话/群组/频道 ID
	ReplyToID string                 // 回复的消息 ID（如果底层平台支持）
	Content   string                 // 文本内容（通常为 Markdown）
	Media     []RuntimeMedia         // 媒体附件（图片、文件等）
	Metadata  map[string]interface{} // 额外元信息（如线程 ID、消息类型等）
}

// MetadataString 是从 Metadata 中读取字符串值的辅助方法。
func (m *RuntimeOutboundMessage) MetadataString(key string) string {
	if m == nil || m.Metadata == nil {
		return ""
	}
	if v, ok := m.Metadata[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

// RuntimeMedia 表示通道运行时关联的一个媒体附件。
type RuntimeMedia struct {
	Type   string                 // "image" | "file" | ...
	URL    string                 // 远程 URL（若存在）
	Base64 string                 // base64 编码数据（可选）
	Extra  map[string]interface{} // 与具体平台相关的额外字段
}

// RuntimeChannel 是所有具体 IM 通道运行时实现需要满足的接口。
// 它抽象了通道的生命周期、收发消息与权限控制。
type RuntimeChannel interface {
	// Name 返回通道逻辑名称，例如 "feishu"、"telegram"。
	Name() string
	// AccountID 返回当前运行时实例对应的账号 ID。
	AccountID() string

	// Start 启动通道运行时（建立长连接 / 注册 Webhook 等）。
	Start(ctx context.Context) error
	// Stop 停止通道运行时，释放资源。
	Stop() error

	// Send 发送一条出站消息到 IM 平台。
	Send(msg *RuntimeOutboundMessage) error
	// SendStream 发送流式消息（可选实现，不支持时可退化为拼接后一次性发送）。
	SendStream(chatID string, stream <-chan *RuntimeStreamChunk) error

	// IsAllowed 检查给定的发送者 ID 是否允许与该通道交互。
	// 主要用于入站消息的白名单控制。
	IsAllowed(senderID string) bool
}

// RuntimeStreamChunk 表示一段流式消息片段（例如模型的增量输出）。
type RuntimeStreamChunk struct {
	Content    string // 当前片段文本
	IsThinking bool   // 是否为“思考过程”内容
	IsFinal    bool   // 是否为最终输出的一部分
	IsComplete bool   // 是否表示整个流结束
	Error      string // 出错信息（可选）
}

// RuntimeStatus 表示通道运行时的状态信息，用于 channels.status 等接口。
type RuntimeStatus struct {
	Running     bool
	LastStartAt *int64
	LastStopAt  *int64
	LastError   string
	Port        *int
	// Extra 存放平台特定字段，如 appId、domain、probe、botOpenId 等。
	Extra map[string]interface{}
}

// RuntimeStatusProvider 是可选接口，RuntimeChannel 实现后可提供运行时状态。
type RuntimeStatusProvider interface {
	RuntimeStatus() RuntimeStatus
}

// BaseRuntimeConfig 通道运行时的通用配置。
type BaseRuntimeConfig struct {
	Enabled    bool     `json:"enabled,omitempty"`
	AccountID  string   `json:"accountId,omitempty"`
	Name       string   `json:"name,omitempty"`
	AllowedIDs []string `json:"allowedIds,omitempty"`
}

// InboundSink 是通道运行时向 Gateway / Agent 侧投递入站消息的统一接口。
type InboundSink interface {
	Deliver(ctx context.Context, msg *InboundMessage) error
}

// RuntimeFactoryFunc 约定所有通道基于配置创建 RuntimeChannel 的工厂函数签名。
// raw 一般来自 config.Channels.GetChannelConfig("<channelId>")。
type RuntimeFactoryFunc func(raw map[string]interface{}, sink InboundSink) (RuntimeChannel, error)

// BaseRuntimeImpl 提供 RuntimeChannel 的通用部分实现，具体通道可组合使用。
type BaseRuntimeImpl struct {
	name      string
	accountID string
	config    BaseRuntimeConfig
	inbound   InboundSink
	running   bool
	stopChan  chan struct{}
	startedAt time.Time
	stoppedAt time.Time
	lastError error
}

// NewBaseRuntimeImpl 创建一个基础运行时实现。
func NewBaseRuntimeImpl(name, accountID string, cfg BaseRuntimeConfig, sink InboundSink) *BaseRuntimeImpl {
	if accountID == "" {
		accountID = "default"
	}
	return &BaseRuntimeImpl{
		name:      name,
		accountID: accountID,
		config:    cfg,
		inbound:   sink,
		stopChan:  make(chan struct{}),
	}
}

// Name 返回通道名称。
func (b *BaseRuntimeImpl) Name() string {
	return b.name
}

// AccountID 返回账号 ID。
func (b *BaseRuntimeImpl) AccountID() string {
	return b.accountID
}

// Start 标记运行时已启动，具体通道可在组合类型中扩展连接逻辑。
func (b *BaseRuntimeImpl) Start(_ context.Context) error {
	if !b.config.Enabled {
		return nil
	}
	b.running = true
	b.startedAt = time.Now()
	return nil
}

// Stop 标记运行时停止。
func (b *BaseRuntimeImpl) Stop() error {
	if !b.running {
		return nil
	}
	close(b.stopChan)
	b.running = false
	b.stoppedAt = time.Now()
	return nil
}

// IsAllowed 根据 AllowedIDs 白名单检查发送者是否允许。
// 若未配置 AllowedIDs，则默认允许所有。
func (b *BaseRuntimeImpl) IsAllowed(senderID string) bool {
	if !b.config.Enabled {
		return false
	}
	if len(b.config.AllowedIDs) == 0 {
		return true
	}
	for _, id := range b.config.AllowedIDs {
		if id == senderID {
			return true
		}
	}
	return false
}

// IsRunning 返回当前运行状态。
func (b *BaseRuntimeImpl) IsRunning() bool {
	return b.running
}

// RuntimeStatus 实现 RuntimeStatusProvider，返回运行时的状态信息。
func (b *BaseRuntimeImpl) RuntimeStatus() RuntimeStatus {
	s := RuntimeStatus{Running: b.running}
	if !b.startedAt.IsZero() {
		ms := b.startedAt.UnixMilli()
		s.LastStartAt = &ms
	}
	if !b.stoppedAt.IsZero() {
		ms := b.stoppedAt.UnixMilli()
		s.LastStopAt = &ms
	}
	if b.lastError != nil {
		s.LastError = b.lastError.Error()
	}
	return s
}

// SetLastError 设置最近一次错误，供具体通道在出错时调用。
func (b *BaseRuntimeImpl) SetLastError(err error) {
	b.lastError = err
}

// WaitForStop 返回一个通道，用于等待停止信号。
func (b *BaseRuntimeImpl) WaitForStop() <-chan struct{} {
	return b.stopChan
}

// PublishInbound 通过 InboundSink 将入站消息交给 Gateway / Agent。
// 若未配置 sink，则静默丢弃（后续可根据需要调整为返回错误）。
func (b *BaseRuntimeImpl) PublishInbound(ctx context.Context, msg *InboundMessage) error {
	if msg == nil {
		return nil
	}
	msg.Channel = b.name
	msg.AccountID = b.accountID
	if b.inbound == nil {
		return nil
	}
	return b.inbound.Deliver(ctx, msg)
}
