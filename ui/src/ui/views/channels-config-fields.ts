/**
 * Channel config form field definitions based on src/pkg/channels config_runtime.go files.
 * Each channel type has required and optional fields.
 */

export type ChannelFieldDef = {
  path: string[];
  label: string;
  required: boolean;
  type: "string" | "number" | "boolean" | "string[]";
  placeholder?: string;
  help?: string;
};

export type ChannelFormDef = {
  fields: ChannelFieldDef[];
};

const CHANNEL_FORM_DEFS: Record<string, ChannelFormDef> = {
  feishu: {
    fields: [
      { path: ["credentials", "appId"], label: "App ID", required: true, type: "string", placeholder: "cli_xxx" },
      { path: ["credentials", "appSecret"], label: "App Secret", required: true, type: "string", placeholder: "xxx" },
      { path: ["credentials", "domain"], label: "Domain", required: false, type: "string", placeholder: "open.feishu.cn" },
      { path: ["credentials", "encryptKey"], label: "Encrypt Key", required: false, type: "string" },
      { path: ["credentials", "verificationToken"], label: "Verification Token", required: false, type: "string" },
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-id-1, user-id-2" },
    ],
  },
  dingtalk: {
    fields: [
      { path: ["credentials", "clientId"], label: "Client ID", required: true, type: "string", placeholder: "your-client-id" },
      { path: ["credentials", "clientSecret"], label: "Client Secret", required: true, type: "string", placeholder: "your-client-secret" },
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-id-1, user-id-2" },
    ],
  },
  wework: {
    fields: [
      { path: ["credentials", "corpId"], label: "Corp ID", required: true, type: "string", placeholder: "your-corp-id" },
      { path: ["credentials", "agentId"], label: "Agent ID", required: true, type: "string", placeholder: "your-agent-id" },
      { path: ["credentials", "secret"], label: "Secret", required: true, type: "string", placeholder: "your-secret" },
      { path: ["credentials", "token"], label: "Token", required: true, type: "string", placeholder: "your-token" },
      { path: ["credentials", "encodingAESKey"], label: "Encoding AES Key", required: false, type: "string" },
      { path: ["webhookPort"], label: "Webhook Port", required: false, type: "number", placeholder: "8766" },
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-or-chat-id" },
    ],
  },
  telegram: {
    fields: [
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["accountId"], label: "Account ID", required: false, type: "string", placeholder: "default" },
      { path: ["name"], label: "Name", required: false, type: "string", placeholder: "Telegram" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-id-1" },
    ],
  },
  slack: {
    fields: [
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["accountId"], label: "Account ID", required: false, type: "string", placeholder: "default" },
      { path: ["name"], label: "Name", required: false, type: "string", placeholder: "Slack" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-id-1" },
    ],
  },
  discord: {
    fields: [
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["accountId"], label: "Account ID", required: false, type: "string", placeholder: "default" },
      { path: ["name"], label: "Name", required: false, type: "string", placeholder: "Discord" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-id-1" },
    ],
  },
  whatsapp: {
    fields: [
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["accountId"], label: "Account ID", required: false, type: "string", placeholder: "default" },
      { path: ["name"], label: "Name", required: false, type: "string", placeholder: "WhatsApp" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-id-1" },
    ],
  },
  qq: {
    fields: [
      { path: ["credentials", "appId"], label: "App ID", required: true, type: "string", placeholder: "your-app-id" },
      { path: ["credentials", "appSecret"], label: "App Secret", required: true, type: "string", placeholder: "your-app-secret" },
      { path: ["enabled"], label: "Enabled", required: false, type: "boolean" },
      { path: ["allowedIds"], label: "Allowed IDs", required: false, type: "string[]", placeholder: "user-openid-1" },
    ],
  },
};

export function getChannelFormDef(channelId: string): ChannelFormDef | null {
  const id = channelId.toLowerCase();
  return CHANNEL_FORM_DEFS[id] ?? null;
}

export function getValueAtPath(obj: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
