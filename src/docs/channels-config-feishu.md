# Feishu 通道配置说明

本文说明如何在 `openocta.json` 中配置 Feishu（飞书/Lark）通道，并与 Runtime/Adapter 对应起来。

## 配置位置

Feishu 配置位于根配置的 `channels.feishu` 段，例如：

```json5
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_xxx",
      "appSecret": "xxx",
      "encryptKey": "xxx",
      "verificationToken": "xxx",
      "domain": "feishu",
      "allowedIds": ["ou_xxx_user1", "ou_xxx_user2"]
    }
  }
}
```

字段说明：

- `enabled`（boolean，可选，默认 `true`）  
  - 是否启用 Feishu 运行时与出站发送。
- `appId` / `appSecret`（string，必填）  
  - 自建应用的 App ID / App Secret。
- `encryptKey`（string，可选）  
  - 事件订阅加密密钥（如果配置了加密）。  
- `verificationToken`（string，可选）  
  - 事件订阅 Verification Token。
- `domain`（string，可选）  
  - `"feishu"`（默认）或 `"lark"`，用于区分飞书国内版与 Lark 国际版。
- `allowedIds`（string[]，可选）  
  - 允许与机器人交互的用户 open_id 列表。为空表示不限制。

> 当前实现中，`channels.feishu` 也支持简单的多账号格式 `accounts.<id>.appId/appSecret/...`，  
> 但 Runtime 侧暂以 `default` 账号为主，后续可扩展多账号支持。

## 对应代码位置

- Runtime：`pkg/channels/feishu/runtime.go` + `config_runtime.go`  
  - `NewRuntimeFromConfig` 从 `channels.feishu` 读取配置并创建 WebSocket 运行时。  
  - 运行时通过 `hooksAgentSink` 把 IM 消息送入 Agent。  
  - Gateway 的 `send` / `chat.send` 会优先通过 `ChannelManager` 调用 Feishu Runtime 的 `Send/SendStream` 进行出站发送。

## 启用步骤（简要）

1. 在飞书后台创建自建应用，开通 IM 消息权限，获取 `appId/appSecret`。  
2. 配置事件订阅，拿到 `encryptKey` 与 `verificationToken`（如有需要）。  
3. 在 `openocta.json` 中填入上述字段，并设置 `channels.feishu.enabled = true`。
4. 启动 Gateway：`make run` 或 `go run ./cmd/openocta gateway run`。
5. 在 Control UI 中确认 `channels.status` 返回的列表中包含 `feishu`。  
6. 在飞书中向机器人发送消息，检查 Agent 是否能够收到并回复。  

