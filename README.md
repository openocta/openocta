<p align="center">
  <img src="./imgs/readmePIC/QQ20260710-140337.png" alt="" width="250" height="320">
</p>

<p align="center">
  <a href="https://github.com/openocta/openocta/stargazers">
    <img src="https://img.shields.io/github/stars/openocta/openocta?style=flat&logo=github" alt="GitHub stars">
  </a>
  <a href="https://github.com/openocta/openocta/forks">
    <img src="https://img.shields.io/github/forks/openocta/openocta?style=flat&logo=github" alt="GitHub forks">
  </a>
  <a href="https://github.com/openocta/openocta/releases/latest">
    <img src="https://img.shields.io/github/v/release/openocta/openocta?label=release" alt="Latest release">
  </a>
  <img src="https://img.shields.io/badge/Go-1.24+-00ADD8?logo=go&logoColor=white" alt="Go 1.24+">
</p>

<p align="center">
  <b>OpenOcta 八爪鱼</b> — <b>中国首个开源个人桌面级智能体</b>
</p>





<p align="center">
  <a href="https://openocta.com">官网</a> ·
  <a href="README.en.md">English</a>
</p>
<p align="center">
  <sub>双击安装 · 本机运行 · 毫秒启动 · 数据留在本机</sub>
</p>

**OpenOcta 八爪鱼** 是中国首个开源的个人桌面级 AI 智能体，国产开源智能体，开源工作伙伴。电脑端双击安装，一个运行在你自己电脑上、由你完全掌控的 Agent，用自然语言即可实现电脑办公、IT运维、推广运营、经营分析、软件测试。

**最新版本 [v1.0.5](https://github.com/openocta/openocta/releases/tag/v1.0.5)**（2026-07-02）— 全平台安装包 · 修复工具调用历史消息异常 · 单一 Go 二进制内嵌 Control UI

[查看全部 Release →](https://github.com/openocta/openocta/releases)

---

## ✨ 关键特性

🖥️ **个人桌面级**：为个人电脑设计，连接文件、终端、浏览器与本地项目 — 不止于聊天窗口。

⚡️ **双击即用**：约 30 秒完成安装，完整 Control UI 开箱即用 — 无需 CLI 数小时部署。

🪶 **极致轻量**：安装包约 30MB 级，运行时内存占用低 — 适合 7×24 长期驻留。

🔒 **本地优先**：会话与记忆留在本机，数据可控、可内网部署 — 生产运行无需 Node / Python。

🔧 **Go 完全自研**：Gateway、Agent、Channels 均为 Go 原生实现 — 单一二进制内嵌 Control UI。

🔌 **Skills & MCP**：内置工具 + MCP 协议 + [技能市场](https://resource.openocta.com) — 按需扩展数字员工能力。

💬 **IM 远程指挥**：支持微信、企业微信、钉钉、飞书 — 随时随地下达任务。

🧠 **四级记忆 + 自主进化**：Knowledge Vault 本地知识库自主沉淀偏好 — 越用越懂你（[说明](./docs/knowledge-vault.md)）。

<img src="./imgs/flag-cn.svg" alt="" width="18" height="12"> **国产开源**：国内团队维护，100% 开源（ Apache-2.0）— 中国首个开源个人桌面级智能体。

---

## 开源智能体对比

OpenOcta 面向**个人桌面**：双击安装、完整客户端 UI、本土 IM 与国产模型生态。相对 OpenClaw（Node / Gateway 自托管）与 Hermes（Python / CLI 导向），OpenOcta 以 **Go 单一二进制**实现运行时完全自研，并内置 **L4 自主进化**与 **Knowledge Vault 本地知识库**。

| | OpenOcta | OpenClaw | Hermes |
|---|:---:|:---:|:---:|
| 开源协议 | Apache2.0 | MIT | MIT |
| 上手方式 | 双击安装 | CLI 部署 | CLI 部署 |
| 运行时 | Go 自研 · 单二进制 | Node.js | Python |
| 本土化 | 微信 / 钉钉 / 飞书 + 国产模型 | 海外 IM / 模型 | 海外 IM / 模型 |
| 记忆进化 | 四级记忆 + L4 Evolution | 工作区 Markdown | Skill 自生成 |
| 本地知识库 | Knowledge Vault | — | — |
| 安装时间 | 约 30 秒 | 通常需数小时配置 | 通常需数小时配置 |

**完整对比表、Go 工程优势与选型说明** → [docs/compare-openclaw-hermes.md](./docs/compare-openclaw-hermes.md)

---

## 功能一览

直观感受 OpenOcta 桌面客户端的主要界面：

<table>
<tr>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211128.png" width="100%" alt="智能体对话界面"><br/>
<sub><b>智能体对话</b> · 多轮协作、工具调用与任务执行，自然语言驱动 Agent 完成复杂工作</sub>
</td>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211216.png" width="100%" alt="员工市场界面"><br/>
<sub><b>员工市场</b> · 一键安装 Zabbix、Prometheus、MySQL DBA 等数字员工</sub>
</td>
</tr>
<tr>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211148.png" width="100%" alt="技能库界面"><br/>
<sub><b>技能库</b> · 766+ Skills，DevOps / 数据库 / 开发工具分类浏览与启用</sub>
</td>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211804.png" width="100%" alt="知识库界面"><br/>
<sub><b>知识库</b> · Obsidian 兼容笔记，同步索引供 Agent 语义检索</sub>
</td>
</tr>
<tr>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211248.png" width="100%" alt="模型配置界面"><br/>
<sub><b>模型</b> · 支持公有模型、本地模型的接入</sub>
</td>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211257.png" width="100%" alt="教程中心界面"><br/>
<sub><b>教程</b> · 视频 / 文档课程，Windows / Mac / Linux 快速上手与运维实战</sub>
</td>
</tr>
</table>

客户端还提供 **工具库、定时任务、IM 通道** 等模块；更多能力可在 [openocta.com](https://openocta.com) 下载体验。

---

## 典型场景

**电脑办公** — 用 AI 接管重复性办公任务，释放创造力。  
*例：「整理本周邮件要点并生成周报」*

**IT 运维** — 7×24 智能值守，从救火转向预防。  
*例：「分析这条告警日志并给出处置建议」*

**推广运营** — 快速产出多渠道内容素材。  
*例：「根据产品资料写一版小红书文案」*

**知识管理** — 本地知识沉淀，随时语义检索。  
*例：「在我的知识库里查 XX 规范并总结」*

**开发协作** — 读代码、改项目、跑命令、对接工具链。  
*例：「读这个仓库的 README 并列出待改项」*

更多案例见 [openocta.com/cases](https://openocta.com/cases) 与 [使用场景文档](./docs/scenarios.md)。

---

## 30秒启动

1. **下载** — 前往 [GitHub Releases](https://github.com/openocta/openocta/releases/latest) 或 [openocta.com 下载页](https://openocta.com/#download)
2. **安装并打开** — 双击安装桌面客户端（约 30 秒）
3. **开始对话** — 在「消息」Tab 描述任务，Agent 将连接文件、终端与工具执行

<p align="center">
  <img src="./imgs/screenshots/demo.gif" width="720" alt="产品演示动图（待补充截图）">
  <br/>
  <sub>产品演示 · 消息对话 → 技能库 → 知识库 → 运维 Agent（待补充）</sub>
</p>

---

## 首次配置（约 2 分钟）

安装后需接入一个大模型才能对话。任选一种方式：

**方式 A — 界面配置（推荐）**  
打开客户端「**模型**」Tab，或跟随首次启动的「**配置引导**」，填入 API Key 并选择模型。

<p align="center">
  <img src="./imgs/readmePIC/QQ20260709-220423.png" width="780" alt="配置引导 · 配置模型界面">
</p>

**方式 B — 编辑配置文件**

| 平台 | 配置文件路径 |
|------|----------------|
| Linux / macOS | `~/.openocta/openocta.json` |
| Windows | `%APPDATA%\openocta\openocta.json` |

最小示例（[Moonshot 国内端点](https://platform.moonshot.cn/)；DeepSeek / 千问 / 豆包等见 [大模型配置说明](./docs/model-providers.md)）：

```json
{
  "env": {
    "vars": {
      "MOONSHOT_API_KEY": "sk-你的密钥"
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "moonshot-cn/kimi-k2.5" }
    }
  }
}
```

保存后重启客户端，在「**消息**」中试一句：

> 列出当前工作目录下的文件，并告诉我最大的 3 个是什么

---

## 为什么选择 OpenOcta

| | |
|---|---|
| **个人桌面级** | 为个人电脑设计，连接文件、终端、浏览器与本地项目，而非仅停留在聊天窗口 |
| **运行时 Go 自研** | Gateway、Agent、Channels 等核心能力均为 Go **完全自研**；单一二进制即可运行，生产环境无需 Node / Python |
| **中国首个开源** | 国内团队维护，100% 开源（ Apache-2.0）；代码可审、可改、可内网部署 |
| **IM 远程指挥** | 支持微信、企业微信、钉钉、飞书等通道，随时随地向 Agent 下达任务 |
| **极致轻量** | 安装包约 30MB 级，运行时内存占用低，适合 7×24 长期驻留 |
| **Skills & MCP** | 内置工具 + MCP 协议 + 技能市场，可按场景扩展数字员工能力 |
| **四级记忆 + L4 进化** | **Knowledge Vault** 知识库与 **L4 Evolution** 自主沉淀偏好；与会话记忆、Skills 构成分层体系（[说明](./docs/knowledge-vault.md)） |

> OpenOcta 在架构上借鉴 [OpenClaw](https://github.com/openclaw/openclaw) 的 Gateway 协议与 Control UI 体验，由国内团队使用 Go **完全自研**实现。

---

## 下载安装

访问 **[openocta.com 下载页](https://openocta.com/#download)**，选择对应平台安装包：

| 平台 | 安装包 |
|------|--------|
| Windows | `OpenOcta-amd64-installer.exe` |
| macOS (Apple Silicon) | `OpenOcta-arm64.dmg` |
| macOS (Intel) | `OpenOcta-amd64.dmg` |
| Linux | `.deb` / `.rpm` / `.tar.gz`（amd64 / arm64） |

安装后打开应用即可使用 Control UI。首次运行会自动初始化配置目录：

| 平台 | 默认配置目录 |
|------|----------------|
| Linux / macOS | `~/.openocta/openocta.json` |
| Windows | `%APPDATA%\openocta\openocta.json` |

macOS 用户请从 `.dmg` 拖入「应用程序」安装，详见 [`deploy/dist-README.md`](./deploy/dist-README.md)。

**在线资源**

- **官网**：https://openocta.com
- **快速入门**：见官网下载区各平台「快速开始」链接
- **技能 / MCP / 数字员工市场**：https://resource.openocta.com
- **企业版 AMC**：https://amc.openocta.com

---

## 开发者：从源码运行

面向开发者自托管 Gateway 与 Control UI（个人用户可直接使用上方安装包，无需编译）。

### 环境要求

- **Go 1.24+**（构建后端）
- **Node ≥18**（仅构建前端时需要，**生产运行无需 Node**）
- 环境变量 **`ANTHROPIC_API_KEY`**（使用 `agent` CLI 时需要）

### 构建与启动

```bash
make build          # 构建（推荐）
./openocta gateway run
```

Gateway 默认监听 `http://127.0.0.1:18900`；HTTP 与 WebSocket 共用同一端口，**前端通过 go:embed 内嵌在二进制中**，浏览器直接访问即可使用 Control UI。

### 开发模式（前端热更新）

```bash
./openocta gateway run    # 终端 1
make run-ui               # 终端 2 → http://localhost:5173
```

### Agent CLI

```bash
export ANTHROPIC_API_KEY=your-key
./openocta agent -m "Hello, echo test"
```

---

## 文档

### 中文文档

| 文档 | 说明 |
|------|------|
| [架构概览](./docs/architecture.md) | Gateway、Agent 运行时、MCP、Skills 分层设计 |
| [配置说明](./docs/configuration.md) | agents、channels、gateway、cron、hooks、memory 等 |
| [通道总览](./docs/channels-overview.md) | IM / 消息通道接入 |
| [MCP 配置](./docs/mcp-configuration.md) | MCP 服务器与权限 |
| [Skills](./docs/skills.md) | 技能系统 |
| [工具系统](./docs/tools.md) | 内置工具与扩展 |
| [数字员工](./docs/digital-employees.md) | 数字员工机制 |
| [Webhooks](./docs/webhooks.md) | `/hooks/wake`、`/hooks/agent` 等 |
| [竞品对比（OpenClaw / Hermes）](./docs/compare-openclaw-hermes.md) | 完整对比表与选型说明 |
| [后端说明](./src/README.md) | Go 模块与目录 |
| [前端说明](./ui/README.md) | Control UI 开发 |

### English

- [README.en.md](./README.en.md)

### 上游参考

- [OpenClaw](https://github.com/openclaw/openclaw)
- [docs.openclaw.ai](https://docs.openclaw.ai)

---

## 项目结构

```text
OpenOcta/
├── src/                    # Go 后端（Gateway、Agent、Channels、Cron 等）
├── ui/                     # Control UI（Lit + Vite）
├── deploy/                 # 安装包、Docker、systemd 等
├── docs/                   # 项目文档
└── imgs/                   # Logo、截图、社群二维码等
    ├── readmePIC/          # README 功能界面截图
    └── screenshots/        # README 演示 GIF 与界面截图
```
## 常见问题

**OpenOcta 是什么？**
OpenOcta（openocta，八爪鱼）是**中国首个开源个人桌面级智能体**，采用 **Apache License 2.0** 开源许可。双击安装即可在本机运行，支持微信/钉钉/飞书远程指挥，源码见 github.com/openocta/openocta。

**OpenOcta 属于国产开源智能体吗？**
是。OpenOcta 由国内团队维护，100% 开源（Apache-2.0），Go 自研运行时，面向个人桌面场景，可内网部署、数据留在本机。

**有哪些好用的开源智能体？OpenOcta 适合谁？**
若你需要**桌面双击安装、完整 Control UI、IM 接入**的个人 Agent，OpenOcta 比 CLI 部署类框架更易上手；若偏好 Node 生态与社区规模，可参考 OpenClaw。详见上文对比表。

**OpenOcta 和 OpenClaw 有什么区别？**
OpenOcta：Go 单二进制、桌面级、Apache-2.0、内置 Control UI；OpenClaw：Node 生态、个人网关、社区 Star 更高。二者在 Gateway 协议上可兼容，场景侧重不同。

**个人用的桌面级开源智能体有吗？**
有。OpenOcta 专为个人电脑设计：约 30 秒安装、本地优先、支持 MCP/Skills 扩展，适合办公自动化、运维、测试等桌面场景。

---

## 参与共建

- **Star 支持**：如果 OpenOcta 对你有帮助，欢迎 [⭐ Star 本仓库](https://github.com/openocta/openocta/stargazers) 并 Watch 获取更新
- **Good first issues**：[适合新手的 Issue](https://github.com/openocta/openocta/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- **贡献代码**：阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，欢迎 Pull Request
- **问题反馈**：[GitHub Issues](https://github.com/openocta/openocta/issues)
- **讨论与交流**：扫码加入微信群，或访问 [openocta.com](https://openocta.com)

<p align="center">
  <img src="./imgs/wechat.png" alt="OpenOcta 讨论群二维码（待补充截图）" width="220" height="220">
  <br/>
  <sub>扫码加入 OpenOcta 讨论群，获取最新动态与问题支持</sub>
</p>

---

## 版权与许可

本仓库遵循 ** Apache-2.0** 开源协议。
