# Telegram 通道配置说明（骨架阶段）

当前仓库中 `pkg/channels/telegram/runtime.go` 提供了 Telegram 通道的 **Runtime 骨架实现**，尚未接入具体的 Telegram Bot API。  
本文件先约定推荐的配置结构，以便后续实现可以直接对齐。

## 建议的配置结构

```json5
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
      "allowedIds": ["123456789"]
    }
  }
}
```

字段约定：

- `enabled`（boolean，可选，默认 `true`）  
  - 是否启用 Telegram 运行时。
- `botToken`（string，预留）  
  - Telegram Bot API Token。当前 Runtime 尚未使用，后续接入 SDK 时会读取此字段。
- `allowedIds`（string[]，可选）  
  - 允许与机器人交互的 Telegram 用户 ID 列表。为空表示不限制。

## 对应代码位置

- Plugin：`pkg/channels/telegram/plugin.go`  
  - 控制 UI 展示与渠道元数据。
- Runtime 骨架：`pkg/channels/telegram/runtime.go`  
  - 实现了 `RuntimeChannel` 的最小版本（Start/Stop 委托给 BaseRuntimeImpl，Send/SendStream 为占位）。  
  - 未来接入 Telegram SDK 时，会在此文件中补充长连接 / Webhook 收消息与发送逻辑。

> 在实现完整 Runtime 之前，`channels.telegram` 的配置不会实际建立与 Telegram 的连接，  
> 但保持配置结构稳定，便于后续无缝升级。

