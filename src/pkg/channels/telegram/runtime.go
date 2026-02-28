package telegram

import (
	"context"

	"github.com/openocta/openocta/pkg/channels"
)

// Runtime 是 Telegram 的最小运行时骨架，用于后续扩展。
type Runtime struct {
	*channels.BaseRuntimeImpl
}

// NewRuntime 创建一个 Telegram Runtime 实例。
func NewRuntime(cfg channels.BaseRuntimeConfig, sink channels.InboundSink) *Runtime {
	base := channels.NewBaseRuntimeImpl("telegram", cfg.AccountID, cfg, sink)
	return &Runtime{BaseRuntimeImpl: base}
}

func (r *Runtime) Start(ctx context.Context) error {
	return r.BaseRuntimeImpl.Start(ctx)
}

func (r *Runtime) Stop() error {
	return r.BaseRuntimeImpl.Stop()
}

func (r *Runtime) Send(msg *channels.RuntimeOutboundMessage) error {
	// 后续可接入 Telegram Bot API；当前为占位实现。
	_ = msg
	return nil
}

func (r *Runtime) SendStream(chatID string, stream <-chan *channels.RuntimeStreamChunk) error {
	_ = chatID
	_ = stream
	return nil
}
