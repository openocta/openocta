<p align="center">
  <img src="./imgs/readmePIC/QQ20260710-140337.png" alt="OpenOcta IT Ops Agent" width="250" height="320">
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
  <img src="https://img.shields.io/badge/AIOps-IT%20Ops%20Agent-0A7B3E" alt="AIOps IT Ops Agent">
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="Apache-2.0">
</p>

<h1 align="center">OpenOcta 八爪鱼 — IT 运维智能体（AIOps Agent）</h1>

<p align="center">
  <b>项目目标：最强 IT 运维智能体</b><br/>
  <sub>Windows / macOS 端侧安装 · 面向全栈 IT 运维 · 自然语言驱动巡检 / 告警 / 问数</sub>
</p>

<p align="center">
  <a href="https://openocta.com">官网</a> ·
  <a href="https://openocta.com/#download">下载</a> ·
  <a href="https://resource.openocta.com">技能市场</a> ·
  <a href="./docs/architecture.md">架构文档</a> ·
  <a href="README.en.md">English</a>
</p>

**关键词**：`IT Ops Agent` · `AIOps` · `运维智能体` · `告警分析` · `自动巡检` · `智能问数` · `Zabbix` · `Prometheus` · `Kubernetes` · `SRE`

---

## 一句话定位

**OpenOcta（八爪鱼）是安装在 Windows / macOS 上的端侧 IT 运维智能体**：运维人员在本机双击安装、用自然语言下达任务；Agent 连接你的监控、日志、云平台、数据库与脚本工具链，完成**应用 / 服务器 / 网络 / 桌面 / DB / 云**等全场景运维作业——**装在 Windows / Mac，不限于只运维 Windows / Mac**。

> 目标不是「又一个聊天机器人」，而是把 AI 用在真实运维闭环里：**自动巡检 → 告警分析 → 智能问数 → 处置建议 / 执行**。

**最新版本 [v1.0.6](https://github.com/openocta/openocta/releases/tag/v1.0.6)**（2026-07-15）— Windows / macOS 安装包 · 修复工具调用参数为空报错 · 加固 Windows 写文件路径 · 知识库前端改版 · 单一 Go 二进制内嵌 Control UI

[查看全部 Release →](https://github.com/openocta/openocta/releases) · [⭐ Star 支持项目](https://github.com/openocta/openocta)

---

## 为什么是运维智能体，而不是通用 Agent？

通用 Agent 擅长「写文档、改代码、聊两句」；运维要的是：**连得上现网工具、读得懂告警上下文、跑得了巡检与排障闭环**。

| 运维痛点 | OpenOcta 怎么发挥 AI 优势 |
|----------|---------------------------|
| 告警风暴、根因难定位 | 聚合告警 + 关联指标 / 日志 / 变更，输出根因假设与处置步骤 |
| 巡检靠人肉、结果难沉淀 | 自然语言定义巡检任务，定时执行并汇总风险清单 |
| 数据散落在多个平台 | 智能问数：用中文查监控、日志、工单、容量与费用 |
| 工具多、切换成本高 | Skills / MCP / 数字员工对接 Zabbix、Prometheus、K8s 等栈 |
| 经验在人脑、难复用 | Knowledge Vault 沉淀 Runbook、案例与个人处置偏好 |
| 夜间值守、远程响应慢 | 企微 / 钉钉 / 飞书 / 微信远程下达任务 |

---

## ✨ 关键特性

### 产品形态

🖥️ **端侧安装，全栈运维** — 装在 Windows / macOS；作业对象覆盖 Linux 服务器、容器、网络设备、数据库、云资源与业务应用，而非只做本机运维。

⚡️ **双击即用（约 30 秒）** — 完整 Control UI 开箱即用，无需 CLI 数小时部署；适合一线运维快速上手。

🪶 **极致轻量** — 安装包约 30MB 级，内存占用低，适合 7×24 值守驻留。

🔒 **本地优先** — 会话、记忆与运维上下文默认留在本机，可内网部署；生产运行无需 Node / Python。

### 运维垂域能力

🎯 **IT 运维主场景开箱** — 自动巡检、告警分析、智能问数、发布核对、慢查询分析、容量与费用排查等作业，一句话触发。

🔌 **通用运维工具适配接入** — 通过 Skills / MCP / 数字员工对接常见运维栈（可持续扩展）：

| 类别 | 可对接 / 扩展示例 |
|------|-------------------|
| 监控告警 | **Zabbix**、**Prometheus**、Grafana、Alertmanager、Nightingale、夜莺 |
| 日志可观测 | ELK / OpenSearch、Loki、Graylog、云日志 |
| 容器与编排 | Kubernetes、Helm、Docker、容器云控制台 |
| 自动化 | Ansible、Salt、脚本库、Cron / 定时任务 |
| 数据库 | MySQL、PostgreSQL、Redis、MongoDB（慢查询 / 连接 / 备份巡检） |
| 云与中间件 | 公有云 API、Nginx、Kafka、RabbitMQ、JVM / 中间件健康检查 |
| 协作与工单 | 企微 / 钉钉 / 飞书、Webhook、CMDB / 堡垒机（按环境扩展） |

👷 **运维数字员工** — 一键安装 Zabbix SRE、Prometheus、MySQL DBA 等角色化员工，按场景组合能力，而不是从零拼 Prompt。

📡 **告警进线与 IM 指挥** — 微信、企业微信、钉钉、飞书远程下达任务；告警可走 Webhook / 通道唤醒 Agent。

🧠 **运维记忆与进化** — 四级记忆 + L4 Evolution + Knowledge Vault：Runbook、偏好与历史案例本地沉淀，越用越懂你的环境（[说明](./docs/knowledge-vault.md)）。

### 工程底座

🔧 **Go 完全自研运行时** — Gateway、Agent、Channels 原生实现；单一二进制内嵌 Control UI。

🧩 **Skills & MCP 可扩展** — 内置工具 + MCP 协议 + [技能市场](https://resource.openocta.com)，按企业栈持续加装。

---

## 适合谁用？

- **应用 / 业务运维、SRE**：发布核对、健康检查、告警降噪与根因分析  
- **基础设施运维**：主机、网络、中间件、容量与巡检自动化  
- **DBA**：慢查询、连接数、备份与空间风险分析  
- **云运维 / FinOps**：资源排查、权限核对、费用异常分析  
- **桌面 / 终端运维**：批量环境检查、脚本与远程指令协助  
- **想把 AIOps 真正落地的团队**：需要「能装上、连得上、干得了活」的端侧 Agent  

**不适合**：只想要一个通用聊天窗口、不打算对接任何运维系统的场景。

---

## 与 OpenClaw、Hermes 对比

OpenOcta 以 **IT 运维垂域** 为主线：端侧双击安装、完整客户端 UI、运维工具链适配、本土 IM 通道；把 AI 能力落到巡检、告警、问数等真实作业。相对 OpenClaw（Node / Gateway 自托管）与 Hermes（Python / CLI 导向），OpenOcta 以 **Go 单一二进制**自研运行时，并内置 **L4 自主进化**与 **Knowledge Vault**。

| | OpenOcta | OpenClaw | Hermes |
|---|:---:|:---:|:---:|
| 产品定位 | **IT 运维智能体 / AIOps Agent** | 通用 Gateway Agent | 通用 CLI Agent |
| 安装形态 | Windows / macOS 双击安装 | CLI 部署 | CLI 部署 |
| 作业范围 | 全栈 IT 运维（不限本机 OS） | 通用任务 | 通用任务 |
| 运维工具适配 | Skills / MCP / 数字员工（Zabbix、Prometheus 等） | 通用扩展 | Skill 自生成 |
| 运行时 | Go 自研 · 单二进制 | Node.js | Python |
| IM 通道 | 微信 / 企微 / 钉钉 / 飞书 | 偏海外 IM | 偏海外 IM |
| 记忆进化 | 四级记忆 + L4 Evolution | 工作区 Markdown | Skill 自生成 |
| 本地知识库 | Knowledge Vault（Runbook 友好） | — | — |
| 上手时间 | 约 30 秒 | 通常需数小时 | 通常需数小时 |

**完整对比表与选型说明** → [docs/compare-openclaw-hermes.md](./docs/compare-openclaw-hermes.md)

---

## 功能一览

直观感受 OpenOcta 运维智能体客户端：

<table>
<tr>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211128.png" width="100%" alt="OpenOcta IT Ops Agent chat"><br/>
<sub><b>智能体对话</b> · 自然语言驱动巡检、告警分析、问数与处置</sub>
</td>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211216.png" width="100%" alt="OpenOcta digital employee marketplace"><br/>
<sub><b>员工市场</b> · 一键安装 Zabbix、Prometheus、MySQL DBA 等运维数字员工</sub>
</td>
</tr>
<tr>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211148.png" width="100%" alt="OpenOcta skills library for DevOps"><br/>
<sub><b>技能库</b> · 766+ Skills，监控告警 / DevOps / 数据库分类启用</sub>
</td>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211804.png" width="100%" alt="OpenOcta Knowledge Vault for Runbooks"><br/>
<sub><b>知识库</b> · 沉淀 Runbook、规范与历史案例，供 Agent 语义检索</sub>
</td>
</tr>
<tr>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211248.png" width="100%" alt="OpenOcta model configuration"><br/>
<sub><b>模型</b> · 公有模型 / 本地模型接入，适配内网与数据合规</sub>
</td>
<td width="50%" align="center" valign="top">
<img src="./imgs/readmePIC/QQ20260709-211257.png" width="100%" alt="OpenOcta ops tutorials"><br/>
<sub><b>教程</b> · Windows / Mac 快速上手与运维实战课程</sub>
</td>
</tr>
</table>

另有 **工具库、定时任务（巡检）、IM 通道、Webhook** 等模块；更多能力见 [openocta.com](https://openocta.com)。

---

## 典型运维场景

### 核心作业（AI 最能放大价值）

**自动巡检** — 定时检查主机、服务、中间件与业务可用性，异常自动汇总。  
*例：「巡检生产 Web 集群，输出可用性与磁盘 / 内存风险清单」*

**告警分析** — 聚合告警，关联指标 / 日志 / 变更，给出根因假设与处置建议。  
*例：「分析这条 P1 告警，结合最近发布记录给出排查步骤」*

**智能问数** — 自然语言查询监控、日志、工单与运维数据，秒出结论。  
*例：「过去 24 小时错误率最高的前 5 个接口是哪些」*

### 覆盖领域（装在端侧，干的是全栈活）

**应用运维** — 发布核对、健康检查、日志定位、回滚建议。  
*例：「核对今晚发布后的健康检查结果，异常服务列出来」*

**服务器运维** — 资源、进程、服务状态与批量巡检。  
*例：「这台 Linux 机器 CPU 飙高，定位 Top 进程并给出处置建议」*

**网络运维** — 连通性、路径、代理 / DNS / 证书相关排查。  
*例：「从跳板机测一下到 DB 网段的连通性，并说明可能卡点」*

**桌面运维** — 终端环境、软件状态、脚本批量协助。  
*例：「检查本机代理与证书是否正常，并给出修复命令」*

**DB 运维** — 慢查询、连接数、备份与空间风险。  
*例：「检查 MySQL 慢查询 Top10，并给出优化建议」*

**云运维** — 云资源、权限、账单与弹性扩缩相关排查。  
*例：「列出近一周费用异常上涨的云资源并说明可能原因」*

更多案例：[openocta.com/cases](https://openocta.com/cases) · [使用场景文档](./docs/scenarios.md)

---

## 30 秒启动（Windows / macOS）

1. **下载** — [GitHub Releases](https://github.com/openocta/openocta/releases/latest) 或 [openocta.com 下载页](https://openocta.com/#download)
2. **安装并打开** — 双击安装桌面客户端（约 30 秒）
3. **接入模型 → 开始运维对话** — 在「消息」中描述任务；再按需安装 Zabbix / Prometheus 等 Skills 或数字员工，对接你的现网工具

<p align="center">
  <img src="./imgs/screenshots/demo.gif" width="720" alt="OpenOcta IT Ops Agent demo">
  <br/>
  <sub>产品演示 · 消息对话 → 技能库 → 知识库 → 运维 Agent（待补充）</sub>
</p>

---

## 首次配置（约 2 分钟）

安装后需接入一个大模型才能对话。任选一种方式：

**方式 A — 界面配置（推荐）**  
打开客户端「**模型**」Tab，或跟随首次启动的「**配置引导**」，填入 API Key 并选择模型。

<p align="center">
  <img src="./imgs/readmePIC/QQ20260709-220423.png" width="780" alt="OpenOcta model setup wizard">
</p>

**方式 B — 编辑配置文件**

| 平台 | 配置文件路径 |
|------|----------------|
| macOS | `~/.openocta/openocta.json` |
| Windows | `%APPDATA%\openocta\openocta.json` |

最小示例（[Moonshot](https://platform.moonshot.cn/)；DeepSeek / 千问 / 豆包等见 [大模型配置说明](./docs/model-providers.md)）：

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

> 帮我设计一套针对 Web + MySQL 的日常巡检清单，并说明每项怎么用自然语言触发

接入监控后可继续试：

> 从 Prometheus / Zabbix 拉取过去 1 小时的错误率与 5xx，汇总异常服务并给出排查顺序

---

## 为什么选择 OpenOcta

| | |
|---|---|
| **最强 IT 运维智能体（目标）** | 聚焦巡检、告警分析、智能问数；覆盖应用 / 服务器 / 网络 / 桌面 / DB / 云 |
| **端侧安装 ≠ 只运维本机** | 装在 Windows / macOS；作业对象是你的服务器、集群、云与数据库 |
| **运维工具链友好** | Skills / MCP / 数字员工对接 Zabbix、Prometheus、K8s、DB 等常见栈 |
| **AI 用在闭环上** | 不是空聊：能关联上下文、给步骤、接工具、可定时值守 |
| **Go 自研运行时** | Gateway / Agent / Channels 完全自研；单二进制，生产无需 Node / Python |
| **本地优先** | 会话与记忆留本机，适合企业运维数据合规与内网 |
| **IM 远程指挥** | 企微 / 钉钉 / 飞书 / 微信，告警与任务随时下达 |
| **记忆可进化** | Knowledge Vault + L4 Evolution，Runbook 与偏好持续沉淀 |

> 架构上借鉴 [OpenClaw](https://github.com/openclaw/openclaw) 的 Gateway 协议与 Control UI 体验，由团队使用 Go **完全自研**，产品定位为 **IT 运维智能体（AIOps Agent）**。

---

## 下载安装

访问 **[openocta.com 下载页](https://openocta.com/#download)**：

| 平台 | 安装包 |
|------|--------|
| Windows | `OpenOcta-amd64-installer.exe` |
| macOS (Apple Silicon) | `OpenOcta-arm64.dmg` |
| macOS (Intel) | `OpenOcta-amd64.dmg` |

| 平台 | 默认配置目录 |
|------|----------------|
| macOS | `~/.openocta/openocta.json` |
| Windows | `%APPDATA%\openocta\openocta.json` |

macOS：从 `.dmg` 拖入「应用程序」，详见 [`deploy/dist-README.md`](./deploy/dist-README.md)。

**在线资源**

- 官网：https://openocta.com  
- 技能 / MCP / 数字员工市场：https://resource.openocta.com  
- 企业版 AMC：https://amc.openocta.com  

---

## FAQ（便于检索与引用）

**Q: OpenOcta 是什么？**  
A: OpenOcta（八爪鱼）是开源的 **IT 运维智能体 / AIOps Agent**：在 Windows / macOS 端侧安装，用自然语言完成巡检、告警分析、智能问数等运维作业。

**Q: 是不是只能运维 Windows / Mac？**  
A: **不是。** 客户端装在 Windows / Mac；运维对象可以是 Linux 服务器、Kubernetes、数据库、网络与云资源等全栈 IT 资产。

**Q: 和 ChatGPT / 通用 Agent 有什么区别？**  
A: 通用 Agent 偏对话与办公；OpenOcta 面向运维闭环，强调对接 Zabbix、Prometheus 等工具链、数字员工、定时巡检、IM 值守与本地知识沉淀。

**Q: 能对接哪些运维系统？**  
A: 通过 Skills、MCP 与数字员工扩展；常见包括 Zabbix、Prometheus、Grafana、Kubernetes、MySQL/PostgreSQL、Ansible、ELK/Loki 及云 API 等，可按企业环境继续加装。

**Q: 数据会不会上传？**  
A: 默认本地优先：会话与记忆留在本机；模型调用取决于你配置的公有 / 本地模型与网络策略，支持内网部署。

**Q: 个人运维和团队怎么用？**  
A: 个人直接装客户端即可；团队可通过技能市场统一能力，企业场景可关注 [AMC](https://amc.openocta.com)。

---

## 开发者：从源码运行

运维同学优先用上方安装包。以下面向二次开发 / 自托管。

### 环境要求

- **Go 1.24+**（构建后端）
- **Node ≥18**（仅构建前端；**生产运行无需 Node**）
- **`ANTHROPIC_API_KEY`**（使用 `agent` CLI 时）

### 构建与启动

```bash
make build
./openocta gateway run
```

Gateway 默认 `http://127.0.0.1:18900`；前端经 `go:embed` 内嵌，浏览器直接访问 Control UI。

### 开发模式

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

| 文档 | 说明 |
|------|------|
| [架构概览](./docs/architecture.md) | Gateway、Agent、MCP、Skills |
| [配置说明](./docs/configuration.md) | agents、channels、gateway、cron、hooks、memory |
| [通道总览](./docs/channels-overview.md) | IM / 消息通道 |
| [MCP 配置](./docs/mcp-configuration.md) | MCP 服务器与权限 |
| [Skills](./docs/skills.md) | 技能系统 |
| [工具系统](./docs/tools.md) | 内置工具与扩展 |
| [数字员工](./docs/digital-employees.md) | 运维数字员工机制 |
| [Webhooks](./docs/webhooks.md) | `/hooks/wake`、`/hooks/agent` |
| [竞品对比](./docs/compare-openclaw-hermes.md) | OpenClaw / Hermes |
| [后端说明](./src/README.md) | Go 模块 |
| [前端说明](./ui/README.md) | Control UI |
| [English README](./README.en.md) | English |

上游参考：[OpenClaw](https://github.com/openclaw/openclaw) · [docs.openclaw.ai](https://docs.openclaw.ai)

---

## 项目结构

```text
OpenOcta/
├── src/                    # Go 后端（Gateway、Agent、Channels、Cron）
├── ui/                     # Control UI（Lit + Vite）
├── deploy/                 # 安装包、Docker、systemd
├── docs/                   # 文档
└── imgs/                   # Logo、截图、社群二维码
    ├── readmePIC/
    └── screenshots/
```

---

## 参与共建

如果你也在做 **AIOps / 运维智能化**，欢迎一起把「最强 IT 运维智能体」做成真实可用的开源底座：

- ⭐ [Star 本仓库](https://github.com/openocta/openocta/stargazers) 并 Watch 更新  
- 🐛 [反馈运维场景 Issue](https://github.com/openocta/openocta/issues)（告警、巡检、工具对接最有价值）  
- 🔧 [Good first issues](https://github.com/openocta/openocta/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)  
- 🤝 阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 提交 PR  
- 💬 扫码进群或访问 [openocta.com](https://openocta.com)

<p align="center">
  <img src="./imgs/wechat.png" alt="OpenOcta community WeChat QR" width="220" height="220">
  <br/>
  <sub>扫码加入 OpenOcta 讨论群 · 运维场景共建与问题支持</sub>
</p>

---

## 版权与许可

本仓库遵循 **Apache-2.0** 开源协议。
