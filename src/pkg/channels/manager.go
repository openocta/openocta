package channels

import (
	"context"
	"fmt"
	"sync"
)

// Manager 维护所有通道运行时实例，并负责统一的生命周期管理。
type Manager struct {
	mu       sync.RWMutex
	channels map[string]RuntimeChannel
}

// NewManager 创建一个新的通道运行时管理器。
func NewManager() *Manager {
	return &Manager{
		channels: make(map[string]RuntimeChannel),
	}
}

// Register 使用通道自身的 Name() 作为键注册运行时。
func (m *Manager) Register(ch RuntimeChannel) error {
	if ch == nil {
		return fmt.Errorf("channel is nil")
	}
	return m.RegisterWithName(ch, ch.Name())
}

// RegisterWithName 使用显式名称注册运行时，便于多账号场景（例如 "feishu:account1"）。
func (m *Manager) RegisterWithName(ch RuntimeChannel, name string) error {
	if ch == nil {
		return fmt.Errorf("channel is nil")
	}
	id := NormalizeChannelId(name)
	if id == "" {
		return fmt.Errorf("channel name is empty")
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.channels[id]; ok {
		return fmt.Errorf("channel %s already registered", id)
	}
	m.channels[id] = ch
	return nil
}

// Get 根据名称获取运行时实例。
func (m *Manager) Get(name string) (RuntimeChannel, bool) {
	id := NormalizeChannelId(name)
	if id == "" {
		return nil, false
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	ch, ok := m.channels[id]
	return ch, ok
}

// List 返回所有已注册通道的名称。
func (m *Manager) List() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]string, 0, len(m.channels))
	for k := range m.channels {
		out = append(out, k)
	}
	return out
}

// Start 启动所有已注册通道。
func (m *Manager) Start(ctx context.Context) error {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for name, ch := range m.channels {
		if err := ch.Start(ctx); err != nil {
			// 目前采用“尽力而为”策略：记录错误但继续启动其它通道。
			// 由调用者通过 Status 或日志感知失败情况。
			_ = fmt.Errorf("start channel %s failed: %w", name, err)
		}
	}
	return nil
}

// Stop 停止所有已注册通道。
func (m *Manager) Stop() error {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for name, ch := range m.channels {
		if err := ch.Stop(); err != nil {
			_ = fmt.Errorf("stop channel %s failed: %w", name, err)
		}
	}
	return nil
}

// Status 返回指定通道的简要状态信息。
func (m *Manager) Status(name string) (map[string]interface{}, error) {
	ch, ok := m.Get(name)
	if !ok {
		return nil, fmt.Errorf("channel not found: %s", name)
	}
	return map[string]interface{}{
		"name":      ch.Name(),
		"accountId": ch.AccountID(),
	}, nil
}

// ListRuntimes 返回所有已注册运行时的状态信息，用于 channels.status。
// 返回按 channelId -> accountId 分组的 RuntimeStatus。
func (m *Manager) ListRuntimes() map[string]map[string]RuntimeStatus {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make(map[string]map[string]RuntimeStatus)
	for _, ch := range m.channels {
		if ch == nil {
			continue
		}
		chId := NormalizeChannelId(ch.Name())
		accId := ch.AccountID()
		if accId == "" {
			accId = "default"
		}
		var status RuntimeStatus
		if provider, ok := ch.(RuntimeStatusProvider); ok {
			status = provider.RuntimeStatus()
		} else {
			status = RuntimeStatus{Running: false}
		}
		if out[chId] == nil {
			out[chId] = make(map[string]RuntimeStatus)
		}
		out[chId][accId] = status
	}
	return out
}

// GetRuntime 根据 channelId 和 accountId 获取运行时实例。
// 会尝试匹配 "channelId:accountId" 或当 accountId 为 "default" 时匹配 "channelId"。
func (m *Manager) GetRuntime(channelId, accountId string) (RuntimeChannel, bool) {
	if channelId == "" {
		return nil, false
	}
	if accountId == "" {
		accountId = "default"
	}
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, ch := range m.channels {
		if ch == nil {
			continue
		}
		if NormalizeChannelId(ch.Name()) != NormalizeChannelId(channelId) {
			continue
		}
		acc := ch.AccountID()
		if acc == "" {
			acc = "default"
		}
		if acc == accountId {
			return ch, true
		}
	}
	return nil, false
}

// StopChannel stops and unregisters the runtime for channelId+accountId.
// Tries keys: channelId:accountId, channelId (when accountId is "default").
func (m *Manager) StopChannel(channelId, accountId string) error {
	if channelId == "" {
		return fmt.Errorf("channel id is empty")
	}
	if accountId == "" {
		accountId = "default"
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	var toStop RuntimeChannel
	var key string
	for k, ch := range m.channels {
		if ch == nil {
			continue
		}
		name := ch.Name()
		acc := ch.AccountID()
		if acc == "" {
			acc = "default"
		}
		if NormalizeChannelId(name) == NormalizeChannelId(channelId) && acc == accountId {
			toStop = ch
			key = k
			break
		}
	}
	if toStop == nil {
		return nil
	}
	_ = toStop.Stop()
	delete(m.channels, key)
	return nil
}
