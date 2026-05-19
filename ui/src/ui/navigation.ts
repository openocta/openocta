import type { IconName } from "./icons.js";
import { t } from "./strings.js";

export function getTabGroups() {
  return [
    // legacy sidebar groups (kept for compatibility; the new shell renders its own top tabs)
    { label: t("tabGroupChat"), tabs: ["chat", "digitalEmployee"] as const },
    { label: t("tabGroupControl"), tabs: ["overview", "cron", "cronHistory"] as const },
    { label: t("tabGroupAgent"), tabs: ["skills", "mcp"] as const },
    { label: t("tabGroupSettings"), tabs: ["config", "envVars", "logs"] as const },
  ];
}

export type Tab =
  // new top-level product tabs
  | "message"
  | "scheduledTasks"
  | "cronHistory"
  | "employeeMarket"
  | "skillLibrary"
  | "toolLibrary"
  | "modelLibrary"
  | "tutorials"
  | "documentation"
  | "aboutUs"
  | "community"
  | "agents"
  | "overview"
  | "channels"
  | "instances"
  | "sessions"
  | "usage"
  | "cron"
  | "skills"
  | "mcp"
  | "nodes"
  | "chat"
  | "digitalEmployee"
  | "agentSwarm"
  | "config"
  | "envVars"
  | "models"
  | "debug"
  | "logs"
  | "llmTrace"
  | "sandbox";

const TAB_PATHS: Record<Tab, string> = {
  message: "/message",
  scheduledTasks: "/scheduled-tasks",
  cronHistory: "/cron-history",
  employeeMarket: "/employee-market",
  skillLibrary: "/skill-library",
  toolLibrary: "/tool-library",
  modelLibrary: "/model-library",
  tutorials: "/tutorials",
  documentation: "/documentation",
  aboutUs: "/about-us",
  community: "/community",
  agents: "/agents",
  overview: "/overview",
  channels: "/channels",
  instances: "/instances",
  sessions: "/sessions",
  usage: "/usage",
  cron: "/cron",
  skills: "/skills",
  mcp: "/mcp",
  nodes: "/nodes",
  chat: "/chat",
  digitalEmployee: "/digital-employee",
  agentSwarm: "/agent-swarm",
  config: "/config",
  envVars: "/env-vars",
  models: "/models",
  debug: "/debug",
  logs: "/logs",
  llmTrace: "/llm-trace",
  sandbox: "/sandbox",
};

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as Tab]));

const ACTIVE_TOP_TAB_ICONS: Partial<Record<Tab, IconName>> = {
  message: "messageSquareActive",
  scheduledTasks: "alarmClockActive",
  employeeMarket: "usersActive",
  skillLibrary: "zapActive",
  toolLibrary: "wrenchActive",
  modelLibrary: "modelCubeActive",
  tutorials: "bookActive",
  community: "globeActive",
  config: "settingsActive",
};

export function normalizeBasePath(basePath: string): string {
  if (!basePath) {
    return "";
  }
  let base = basePath.trim();
  if (!base.startsWith("/")) {
    base = `/${base}`;
  }
  if (base === "/") {
    return "";
  }
  if (base.endsWith("/")) {
    base = base.slice(0, -1);
  }
  return base;
}

export function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }
  let normalized = path.trim();
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const path = TAB_PATHS[tab];
  return base ? `${base}${path}` : path;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let path = pathname || "/";
  if (base) {
    if (path === base) {
      path = "/";
    } else if (path.startsWith(`${base}/`)) {
      path = path.slice(base.length);
    }
  }
  let normalized = normalizePath(path).toLowerCase();
  if (normalized.endsWith("/index.html")) {
    normalized = "/";
  }
  if (normalized === "/") {
    return "message";
  }
  return PATH_TO_TAB.get(normalized) ?? null;
}

export function inferBasePathFromPathname(pathname: string): string {
  let normalized = normalizePath(pathname);
  if (normalized.endsWith("/index.html")) {
    normalized = normalizePath(normalized.slice(0, -"/index.html".length));
  }
  if (normalized === "/") {
    return "";
  }
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "";
  }
  for (let i = 0; i < segments.length; i++) {
    const candidate = `/${segments.slice(i).join("/")}`.toLowerCase();
    if (PATH_TO_TAB.has(candidate)) {
      const prefix = segments.slice(0, i);
      return prefix.length ? `/${prefix.join("/")}` : "";
    }
  }
  return `/${segments.join("/")}`;
}

export function iconForTab(tab: Tab, active = false): IconName {
  if (active) {
    const activeIcon = ACTIVE_TOP_TAB_ICONS[tab];
    if (activeIcon) {
      return activeIcon;
    }
  }

  switch (tab) {
    case "message":
      return "messageSquare";
    case "scheduledTasks":
      return "alarmClock";
    case "cronHistory":
      return "historyClock";
    case "employeeMarket":
      return "users";
    case "skillLibrary":
      return "zap";
    case "toolLibrary":
      return "wrench";
    case "modelLibrary":
      return "modelCube";
    case "tutorials":
      return "book";
    case "documentation":
      return "documentation";
    case "aboutUs":
      return "info";
    case "community":
      return "globe";
    case "agents":
      return "folder";
    case "chat":
      return "messageSquare";
    case "digitalEmployee":
      return "users";
    case "agentSwarm":
      return "brain";
    case "overview":
      return "overviewGrid";
    case "channels":
      return "link";
    case "instances":
      return "radio";
    case "sessions":
      return "scrollText";
    case "usage":
      return "usageBars";
    case "cron":
      return "loader";
    case "skills":
      return "zap";
    case "mcp":
      return "folder";
    case "llmTrace":
      return "traceBars";
    case "sandbox":
      return "sandbox";
    case "nodes":
      return "monitor";
    case "config":
      return "settings";
    case "envVars":
      return "envVars";
    case "models":
      return "modelCube";
    case "debug":
      return "bug";
    case "logs":
      return "scrollText";
    default:
      return "folder";
  }
}

export function titleForTab(tab: Tab) {
  switch (tab) {
    case "message":
      return "消息";
    case "scheduledTasks":
      return "定时任务";
    case "cronHistory":
      return "运行历史";
    case "employeeMarket":
      return "员工市场";
    case "skillLibrary":
      return "技能库";
    case "toolLibrary":
      return "工具库";
    case "modelLibrary":
      return "模型库";
    case "tutorials":
      return "教程";
    case "documentation":
      return "在线文档";
    case "aboutUs":
      return "关于我们";
    case "community":
      return "社区";
    case "agents":
      return t("navTitleAgents");
    case "overview":
      return t("navTitleOverview");
    case "channels":
      return t("navTitleChannels");
    case "instances":
      return t("navTitleInstances");
    case "sessions":
      return t("navTitleSessions");
    case "usage":
      return t("navTitleUsage");
    case "cron":
      return t("navTitleCron");
    case "skills":
      return t("navTitleSkills");
    case "mcp":
      return t("navTitleMcp");
    case "llmTrace":
      return t("navTitleLlmTrace");
    case "sandbox":
      return t("navTitleSandbox");
    case "nodes":
      return t("navTitleNodes");
    case "chat":
      return t("navTitleChat");
    case "digitalEmployee":
      return t("navTitleDigitalEmployee");
    case "agentSwarm":
      return t("navTitleAgentSwarm");
    case "config":
      return t("navTitleConfig");
    case "envVars":
      return t("navTitleEnvVars");
    case "models":
      return t("navTitleModels");
    case "debug":
      return t("navTitleDebug");
    case "logs":
      return t("navTitleLogs");
    default:
      return t("navTitleControl");
  }
}

/** Bump when product-tour copy or steps change; completion is tracked per version. */
export const PRODUCT_TOUR_VERSION = "v0.2.7";

const PRODUCT_TOUR_STORAGE_KEY = "openocta.product-tour.completed.v1";

export type ProductTourStep = {
  tab: Tab;
  title: string;
  body: string;
};

/** First-run walkthrough steps (top bar order matches app-render top tabs). */
export function getProductTourSteps(): ProductTourStep[] {
  return [
    {
      tab: "modelLibrary",
      title: "配置模型",
      body: "在「模型」页添加模型厂商与可用模型，连接后即可为对话与 Agent 提供推理能力。",
    },
    {
      tab: "message",
      title: "开始对话",
      body: "回到「消息」即可新建或选择会话，与助手聊天、执行任务，并查看历史记录。",
    },
    {
      tab: "skillLibrary",
      title: "探索技能库",
      body: "在「技能库」浏览、安装社区技能，为 Agent 扩展文档处理、自动化等能力。",
    },
    {
      tab: "toolLibrary",
      title: "接入 MCP 工具",
      body: "在「工具库」发现 MCP 服务与工具，一键接入数据库、浏览器、企业系统等外部能力。",
    },
    {
      tab: "employeeMarket",
      title: "数字员工",
      body: "在「员工市场」挑选或启用数字员工模板，快速落地客服、运营、研发等角色化助手。",
    },
    {
      tab: "scheduledTasks",
      title: "定时任务",
      body: "在「定时任务」配置巡检、周报、提醒等周期执行，让 Agent 按计划自动运行。",
    },
  ];
}

export function shouldShowProductTour(version: string = PRODUCT_TOUR_VERSION): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }
  try {
    const raw = localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY);
    if (!raw) {
      return true;
    }
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version !== version;
  } catch {
    return true;
  }
}

export function markProductTourCompleted(version: string = PRODUCT_TOUR_VERSION): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(
    PRODUCT_TOUR_STORAGE_KEY,
    JSON.stringify({ version, completedAt: Date.now() }),
  );
}

export function subtitleForTab(tab: Tab) {
  switch (tab) {
    case "message":
      return "";
    case "scheduledTasks":
      return "";
    case "cronHistory":
      return "";
    case "employeeMarket":
      return "";
    case "skillLibrary":
      return "";
    case "toolLibrary":
      return "";
    case "modelLibrary":
      return "";
    case "tutorials":
      return "";
    case "documentation":
      return "";
    case "aboutUs":
      return "";
    case "community":
      return "";
    case "agents":
      return t("subtitleAgents");
    case "overview":
      return t("subtitleOverview");
    case "channels":
      return t("subtitleChannels");
    case "instances":
      return t("subtitleInstances");
    case "sessions":
      return t("subtitleSessions");
    case "usage":
      return t("subtitleUsage");
    case "cron":
      return t("subtitleCron");
    case "skills":
      return t("subtitleSkills");
    case "mcp":
      return t("subtitleMcp");
    case "llmTrace":
      return t("subtitleLlmTrace");
    case "sandbox":
      return t("subtitleSandbox");
    case "nodes":
      return t("subtitleNodes");
    case "chat":
      return t("subtitleChat");
    case "digitalEmployee":
      return t("subtitleDigitalEmployee");
    case "agentSwarm":
      return t("subtitleAgentSwarm");
    case "config":
      return t("subtitleConfig");
    case "envVars":
      return t("subtitleEnvVars");
    case "models":
      return t("subtitleModels");
    case "debug":
      return t("subtitleDebug");
    case "logs":
      return t("subtitleLogs");
    default:
      return "";
  }
}
