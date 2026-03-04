# 扩展自定义 Channel 指南

本指南说明如何在 OpenOcta 中新增一个自定义 IM 通道（例如 `myim`），并与现有架构对齐。

## 步骤一：准备 Plugin 元数据

在 `src/pkg/channels/myim/plugin.go` 中新增：

```go
package myim

import "github.com/openocta/openocta/pkg/channels"

const channelID = "myim"

var Plugin = &channels.BasePlugin{
	Id: channelID,
	MetaData: channels.ChannelMeta{
		ID:             channelID,
		Label:          "MyIM",
		SelectionLabel: "MyIM (自定义)",
		DocsPath:       "/channels/myim",
		DocsLabel:      "myim",
		Blurb:          "自定义 IM 通道示例。",
		SystemImage:    "message-square",
		Order:          80,
	},
}
```

并在 `pkg/channels/builtin/register.go` 中注册：

```go
import "github.com/openocta/openocta/pkg/channels/myim"

func Register(r *channels.Registry) {
  // ...
  r.Register(myim.Plugin)
}
```

这样 Control UI 就能在通道列表中看到 `myim`。

## 步骤二：实现 RuntimeChannel

在 `src/pkg/channels/myim/runtime.go` 中：

```go
package myim

import (
  "context"
  "github.com/openocta/openocta/pkg/channels"
)

type Runtime struct {
  *channels.BaseRuntimeImpl
}

func NewRuntime(cfg channels.BaseRuntimeConfig, sink channels.InboundSink) *Runtime {
  base := channels.NewBaseRuntimeImpl("myim", cfg.AccountID, cfg, sink)
  return &Runtime{BaseRuntimeImpl: base}
}

func (r *Runtime) Start(ctx context.Context) error {
  if err := r.BaseRuntimeImpl.Start(ctx); err != nil {
    return err
  }
  // TODO: 在此建立与 IM 平台的连接（长轮询 / WebSocket / Webhook 绑定等）。
  return nil
}

func (r *Runtime) Stop() error {
  // TODO: 清理连接 / 关闭客户端。
  return r.BaseRuntimeImpl.Stop()
}

func (r *Runtime) Send(msg *channels.RuntimeOutboundMessage) error {
  // TODO: 调用 IM 平台的发送 API。
  _ = msg
  return nil
}

func (r *Runtime) SendStream(chatID string, stream <-chan *channels.RuntimeStreamChunk) error {
  // 简单实现：收集全部内容后调用 Send。
  _ = chatID
  _ = stream
  return nil
}
```

在收到平台回调或长连接消息时，构造 `InboundMessage` 并调用：

```go
_ = r.PublishInbound(ctx, &channels.InboundMessage{
  ID:       platformMsgID,
  SenderID: senderID,
  ChatID:   chatID,
  ChatType: "dm", // 或 "group" 等
  Content:  text,
  Time:     receivedAt,
})
```

`BaseRuntimeImpl` 会通过 `InboundSink`（当前为 `hooksAgentSink`）把消息转成一次 Agent 运行。

## 步骤三：从配置初始化 Runtime

推荐在 `gateway/http.Server` 中按配置初始化自定义通道 Runtime，方式类似 Feishu：

```go
inboundSink := &hooksAgentSink{ctx: ctx}

if raw := cfg.Channels.GetChannelConfig("myim"); raw != nil {
  baseCfg := channels.BaseRuntimeConfig{
    Enabled:    true, // 或从 raw 中读取
    AccountID:  "default",
    Name:       "MyIM",
    AllowedIDs: nil,
  }
  rt := myim.NewRuntime(baseCfg, inboundSink)
  _ = chRuntimeMgr.Register(rt)
}
```

## 步骤四：配置文件示例

在 `openocta.json` 中新增：

```json5
{
  "channels": {
    "myim": {
      "enabled": true,
      "allowedIds": ["user-1", "user-2"]
      // 其余字段由你自定义，如 apiKey、endpoint 等
    }
  }
}
```

## 注意事项

- **线程安全**：若 Runtime 内部持有客户端或连接，请注意并发访问与关闭的安全性。  
- **上下文取消**：`Start(ctx)` 中的后台 goroutine 应监听 `ctx.Done()`，及时退出。  
- **错误处理**：入站/出站错误应在本地日志中可见，但不应 panic；推荐“尽力而为、记录错误”。  
- **敏感信息**：避免在日志中打印 token、密钥等敏感字段。  

