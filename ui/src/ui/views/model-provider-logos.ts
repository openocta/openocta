/**
 * 模型厂商 Logo 解析器
 *
 * 解析优先级：
 * 1. 内置厂商的 logoKey
 * 2. 自定义厂商 baseUrl 的规范化 hostname 别名
 * 3. 自定义厂商 providerKey
 * 4. 自定义厂商 displayName
 * 5. 默认 modelCube
 */

import type { BuiltInProvider } from "./models-builtin.ts";

// LogoKey 类型定义
export type ProviderLogoKey =
  | "anthropic"
  | "openai"
  | "openrouter"
  | "cerebras"
  | "deepseek"
  | "groq"
  | "grok"
  | "mistral"
  | "ollama"
  | "litellm"
  | "kimi"
  | "minimax"
  | "together"
  | "vercel"
  | "vllm"
  | "qianfan"
  | "zhipu"
  | "bailian"
  | "mimo"
  | "huggingface"
  | "qwen"
  | "venice"
  | "synthetic"
  | "opencode"
  | "xunfei";

function providerLogoUrl(filename: string) {
  return `${import.meta.env.BASE_URL}provider/${filename}`;
}

// Logo 图片资源注册表
const LOGO_REGISTRY: Record<ProviderLogoKey, string> = {
  anthropic: providerLogoUrl("anthropic.png"),
  openai: providerLogoUrl("openai.png"),
  openrouter: providerLogoUrl("openrouter.png"),
  cerebras: providerLogoUrl("cerebras.png"),
  deepseek: providerLogoUrl("deepseek.png"),
  groq: providerLogoUrl("groq.png"),
  grok: providerLogoUrl("grok.png"),
  mistral: providerLogoUrl("mistral.png"),
  ollama: providerLogoUrl("ollama.png"),
  litellm: providerLogoUrl("litellm.png"),
  kimi: providerLogoUrl("kimi.png"),
  minimax: providerLogoUrl("minimax.png"),
  together: providerLogoUrl("together.png"),
  vercel: providerLogoUrl("vercel.png"),
  vllm: providerLogoUrl("vllm.png"),
  qianfan: providerLogoUrl("qianfan.png"),
  zhipu: providerLogoUrl("zhipu.png"),
  bailian: providerLogoUrl("bailian.png"),
  mimo: providerLogoUrl("mimo.png"),
  huggingface: providerLogoUrl("huggingface.png"),
  qwen: providerLogoUrl("qwen.png"),
  venice: providerLogoUrl("venice.png"),
  synthetic: providerLogoUrl("synthetic.png"),
  opencode: providerLogoUrl("opencode.png"),
  xunfei: providerLogoUrl("xunfei.png"),
};

// 内置厂商 ID -> LogoKey 映射
export const BUILTIN_LOGO_KEY_MAP: Record<string, ProviderLogoKey> = {
  anthropic: "anthropic",
  openai: "openai",
  openrouter: "openrouter",
  cerebras: "cerebras",
  deepseek: "deepseek",
  groq: "groq",
  xai: "grok",
  mistral: "mistral",
  ollama: "ollama",
  litellm: "litellm",
  moonshot: "kimi",
  "moonshot-cn": "kimi",
  "kimi-coding": "kimi",
  minimax: "minimax",
  together: "together",
  "vercel-ai-gateway": "vercel",
  vllm: "vllm",
  qianfan: "qianfan",
  zai: "zhipu",
  bailian: "bailian",
  xiaomi: "mimo",
  huggingface: "huggingface",
  venice: "venice",
  synthetic: "synthetic",
  opencode: "opencode",
  xunfei: "xunfei",
};

// Hostname 别名 -> LogoKey 映射（用于自定义厂商通过 baseUrl 识别）
const HOSTNAME_ALIAS_MAP: Record<string, ProviderLogoKey> = {
  // OpenAI
  "api.openai.com": "openai",
  "openai.com": "openai",

  // Anthropic
  "api.anthropic.com": "anthropic",
  "anthropic.com": "anthropic",

  // OpenRouter
  "openrouter.ai": "openrouter",

  // Cerebras
  "api.cerebras.ai": "cerebras",
  "cerebras.ai": "cerebras",

  // DeepSeek
  "api.deepseek.com": "deepseek",
  "deepseek.com": "deepseek",

  // Groq
  "api.groq.com": "groq",
  "groq.com": "groq",

  // Grok (xAI)
  "api.x.ai": "grok",
  "x.ai": "grok",

  // Mistral
  "api.mistral.ai": "mistral",
  "mistral.ai": "mistral",

  // LiteLLM
  "litellm": "litellm",

  // Kimi / Moonshot
  "api.moonshot.ai": "kimi",
  "api.moonshot.cn": "kimi",
  "moonshot.ai": "kimi",
  "moonshot.cn": "kimi",

  // MiniMax
  "api.minimax.io": "minimax",
  "minimax.io": "minimax",

  // Together AI
  "api.together.xyz": "together",
  "together.xyz": "together",

  // Vercel AI Gateway
  "api.vercel.ai": "vercel",
  "vercel.com": "vercel",

  // 千帆 (百度)
  "aip.baidubce.com": "qianfan",
  "qianfan.baidubce.com": "qianfan",

  // Z.ai / 智谱
  "api.z.ai": "zhipu",
  "z.ai": "zhipu",

  // 百炼 (阿里云)
  "dashscope.aliyuncs.com": "bailian",

  // 小米 Mimo
  "api.xiaomimimo.com": "mimo",

  // Hugging Face
  "router.huggingface.co": "huggingface",
  "huggingface.co": "huggingface",

  // Venice AI
  "api.venice.ai": "venice",
  "venice.ai": "venice",

  // Synthetic
  "api.synthetic.new": "synthetic",
  "synthetic.new": "synthetic",

  // OpenCode
  "opencode.ai": "opencode",

  // 讯飞星火
  "spark-api-open.xf-yun.com": "xunfei",
  "xf-yun.com": "xunfei",
};

// ProviderKey / DisplayName 别名 -> LogoKey 映射（用于自定义厂商通过名称识别）
const NAME_ALIAS_MAP: Record<string, ProviderLogoKey> = {
  // 英文名称
  openai: "openai",
  anthropic: "anthropic",
  openrouter: "openrouter",
  cerebras: "cerebras",
  deepseek: "deepseek",
  groq: "groq",
  grok: "grok",
  xai: "grok",
  mistral: "mistral",
  ollama: "ollama",
  litellm: "litellm",
  moonshot: "kimi",
  moonshotcn: "kimi",
  kimi: "kimi",
  kimicoding: "kimi",
  minimax: "minimax",
  minimaxai: "minimax",
  together: "together",
  togetherai: "together",
  vercel: "vercel",
  vercelaigateway: "vercel",
  v0: "vercel",
  vllm: "vllm",
  huggingface: "huggingface",
  zai: "zhipu",
  zhipu: "zhipu",
  venice: "venice",
  veniceai: "venice",
  synthetic: "synthetic",
  opencode: "opencode",
  qianfan: "qianfan",
  bailian: "bailian",
  aliyun: "bailian",
  xiaomi: "mimo",
  xiaomimimo: "mimo",
  xunfei: "xunfei",
  spark: "xunfei",
  qwen: "qwen",

  // 中文名称
  千帆: "qianfan",
  百度: "qianfan",
  智谱: "zhipu",
  百炼: "bailian",
  阿里云: "bailian",
  阿里: "bailian",
  通义: "qwen",
  小米: "mimo",
  mimo: "mimo",
  讯飞: "xunfei",
  星火: "xunfei",
};

/**
 * 规范化字符串用于名称匹配
 * - 小写
 * - 去除空格、连字符、下划线和常见分隔符
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s\-_./()（）]/g, "");
}

/**
 * 规范化 hostname
 * - 小写
 * - 去除 www. 前缀
 */
function normalizeHostname(hostname: string): string {
  let h = hostname.toLowerCase().trim();
  // 去除 www. 前缀
  if (h.startsWith("www.")) {
    h = h.slice(4);
  }
  return h;
}

/**
 * 检查是否为 IP 地址
 */
function isIpAddress(hostname: string): boolean {
  // IPv4
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(hostname)) {
    return true;
  }
  // IPv6（简化检测）
  if (hostname.startsWith("[") || hostname.includes(":")) {
    return true;
  }
  return false;
}

/**
 * 解析 URL 并返回规范化 hostname
 * 返回 null 表示无效 URL 或本地地址
 */
function parseHostname(baseUrl: string): string | null {
  if (!baseUrl || baseUrl === "(官方)") {
    return null;
  }

  try {
    const url = new URL(baseUrl);
    const hostname = normalizeHostname(url.hostname);

    // IP 地址、localhost 返回 null（不通过 URL 识别）
    if (isIpAddress(hostname) || hostname === "localhost") {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

function resolveLogoKeyByName(raw: string | undefined): ProviderLogoKey | null {
  if (!raw) {
    return null;
  }
  const normalized = normalizeName(raw);
  if (!normalized) {
    return null;
  }
  const exact = NAME_ALIAS_MAP[normalized];
  if (exact) {
    return exact;
  }
  for (const [alias, logoKey] of Object.entries(NAME_ALIAS_MAP)) {
    if (alias.length >= 2 && normalized.includes(alias)) {
      return logoKey;
    }
  }
  return null;
}

/**
 * 解析模型厂商 Logo
 *
 * @param providerKey - 厂商 ID（如 "openai", "custom-provider"）
 * @param displayName - 显示名称（如 "OpenAI", "自定义厂商"）
 * @param baseUrl - 基础 URL（如 "https://api.openai.com/v1"）
 * @param builtin - 内置厂商配置（如果有）
 * @returns Logo URL 或 null（使用默认图标）
 */
export function resolveModelProviderLogo(
  providerKey: string,
  displayName?: string,
  baseUrl?: string,
  builtin?: BuiltInProvider,
): string | null {
  // 1. 内置厂商优先使用 logoKey
  if (builtin) {
    const logoKey = BUILTIN_LOGO_KEY_MAP[builtin.id];
    if (logoKey && LOGO_REGISTRY[logoKey]) {
      return LOGO_REGISTRY[logoKey];
    }
  }

  // 2. 自定义厂商通过 baseUrl 的 hostname 识别
  const hostname = parseHostname(baseUrl || "");
  if (hostname) {
    const logoKey = HOSTNAME_ALIAS_MAP[hostname];
    if (logoKey && LOGO_REGISTRY[logoKey]) {
      return LOGO_REGISTRY[logoKey];
    }
  }

  // 3. 通过 providerKey 识别
  const providerKeyLogo = resolveLogoKeyByName(providerKey);
  if (providerKeyLogo && LOGO_REGISTRY[providerKeyLogo]) {
    return LOGO_REGISTRY[providerKeyLogo];
  }

  // 4. 通过 displayName 识别
  const displayNameLogo = resolveLogoKeyByName(displayName);
  if (displayNameLogo && LOGO_REGISTRY[displayNameLogo]) {
    return LOGO_REGISTRY[displayNameLogo];
  }

  // 5. 未匹配，返回 null 使用默认图标
  return null;
}
