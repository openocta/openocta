const KEY = "openclaw.control.settings.v1";

/** Default gateway token when user does not fill in. Must match backend DefaultGatewayToken. */
export const DEFAULT_GATEWAY_TOKEN = "edc146993b5ae0b1544c3137cc888f94436cf11e1952cff6";

import { parseGatewayHost } from "./gateway-url.ts";
import type { ThemeMode } from "./theme.ts";

export type UiSettings = {
  gatewayUrl: string;
  token: string;
  sessionKey: string;
  lastActiveSessionKey: string;
  theme: ThemeMode;
  chatFocusMode: boolean;
  chatShowThinking: boolean;
  splitRatio: number; // Sidebar split ratio (0.4 to 0.7, default 0.6)
  navCollapsed: boolean; // Collapsible sidebar state
  navGroupsCollapsed: Record<string, boolean>; // Which nav groups are collapsed
};

export function loadSettings(): UiSettings {
  const defaultHost = (() => {
    // When running the Control UI via Vite (default port 5173),
    // default to the local gateway server (127.0.0.1:18900).
    // In production (served by the gateway), use same-origin (host:port).
    const isViteDev = typeof location !== "undefined" && location.port === "5173";
    if (isViteDev) {
      return "127.0.0.1:18900";
    }
    return typeof location !== "undefined" ? location.host : "127.0.0.1:18900";
  })();

  const defaults: UiSettings = {
    gatewayUrl: defaultHost,
    token: DEFAULT_GATEWAY_TOKEN,
    sessionKey: "main",
    lastActiveSessionKey: "main",
    theme: "light",
    chatFocusMode: false,
    chatShowThinking: false,
    splitRatio: 0.6,
    navCollapsed: false,
    navGroupsCollapsed: {},
  };

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<UiSettings>;
    return {
      gatewayUrl:
        typeof parsed.gatewayUrl === "string" && parsed.gatewayUrl.trim()
          ? parseGatewayHost(parsed.gatewayUrl.trim())
          : defaults.gatewayUrl,
      token:
        typeof parsed.token === "string" && parsed.token.trim()
          ? parsed.token.trim()
          : defaults.token,
      sessionKey:
        typeof parsed.sessionKey === "string" && parsed.sessionKey.trim()
          ? parsed.sessionKey.trim()
          : defaults.sessionKey,
      lastActiveSessionKey:
        typeof parsed.lastActiveSessionKey === "string" && parsed.lastActiveSessionKey.trim()
          ? parsed.lastActiveSessionKey.trim()
          : (typeof parsed.sessionKey === "string" && parsed.sessionKey.trim()) ||
            defaults.lastActiveSessionKey,
      theme:
        parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system"
          ? parsed.theme
          : defaults.theme,
      chatFocusMode:
        typeof parsed.chatFocusMode === "boolean" ? parsed.chatFocusMode : defaults.chatFocusMode,
      chatShowThinking:
        typeof parsed.chatShowThinking === "boolean"
          ? parsed.chatShowThinking
          : defaults.chatShowThinking,
      splitRatio:
        typeof parsed.splitRatio === "number" &&
        parsed.splitRatio >= 0.4 &&
        parsed.splitRatio <= 0.7
          ? parsed.splitRatio
          : defaults.splitRatio,
      navCollapsed:
        typeof parsed.navCollapsed === "boolean" ? parsed.navCollapsed : defaults.navCollapsed,
      navGroupsCollapsed:
        typeof parsed.navGroupsCollapsed === "object" && parsed.navGroupsCollapsed !== null
          ? parsed.navGroupsCollapsed
          : defaults.navGroupsCollapsed,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(next: UiSettings) {
  localStorage.setItem(KEY, JSON.stringify(next));
}
