# Channels 使用与扩展总览

本页汇总 Channels 相关文档，并给出一个最小示例配置，帮助你快速把 Agent 接入 IM 通道。

## 文档索引

- 架构概览：`src/docs/channels-overview.md`  
  - 解释 ChannelPlugin / RuntimeChannel / OutboundAdapter / ChannelManager 等核心概念。  
  - 展示 IM ↔ Agent 的数据流。

- Feishu 配置：`src/docs/channels-config-feishu.md`  
  - 完整说明 `channels.feishu` 的配置字段与启用步骤。  
  - 当前唯一已接入完整 Runtime（WebSocket 收消息）的通道。

- Telegram 配置（骨架）：`src/docs/channels-config-telegram.md`  
  - 约定 `channels.telegram` 的推荐配置结构，为后续 Runtime 实现做准备。

- 扩展自定义通道：`src/docs/channels-extending.md`  
  - 手把手教你新增 `myim` 子包与 Runtime，实现自定义 IM 通道。

## 最小示例：启用 Feishu 通道

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
      "allowedIds": ["ou_xxx_user1"]
    }
  },
  "hooks": {
    "enabled": true,
    "token": "shared-secret"
  }
}
```

步骤概览：

1. 在飞书后台创建自建应用，获取 `appId/appSecret/encryptKey/verificationToken`。  
2. 在本地编辑 `openocta.json`，按上述示例填入 `channels.feishu` 与 `hooks` 段。
3. 启动 Gateway：`make run` 或 `cd src && go run ./cmd/openocta gateway run`。
4. 在 Control UI 中通过 Channels 页面确认 `feishu` 已加载。  
5. 在飞书中向机器人发送消息，观察 Agent 是否能够收到并回复。  

更多细节和排错建议，请参考各子文档。  

