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

<h1 align="center">OpenOcta — AIOps Agent (ITOps AIAgent)</h1>

<p align="center">
  <b>Mission: the strongest ITOps Agent</b><br/>
  <sub>Windows / macOS desktop install · full-stack IT ops · natural-language inspection / alerting / data Q&amp;A</sub>
</p>

<p align="center">
  <a href="https://openocta.com">Website</a> ·
  <a href="https://openocta.com/#download">Download</a> ·
  <a href="https://resource.openocta.com">Skills Marketplace</a> ·
  <a href="./docs/architecture.md">Architecture</a> ·
  <a href="README.cn.md">简体中文</a>
</p>

**Keywords**: `IT Ops Agent` · `AIOps` · `Ops Agent` · `Alert Analysis` · `Auto Inspection` · `Intelligent Data Q&A` · `Zabbix` · `Prometheus` · `Kubernetes` · `SRE`

---

## One-line positioning

**OpenOcta is a desktop IT Ops Agent for Windows / macOS**: ops engineers install it locally with a double-click and assign work in natural language. The Agent connects your monitoring, logs, cloud platforms, databases, and script toolchains to run **application / server / network / desktop / DB / cloud** jobs across the stack — **installed on Windows / Mac, not limited to operating only Windows / Mac**.

> The goal is not “yet another chatbot,” but AI inside a real ops loop: **auto inspection → alert analysis → intelligent data Q&A → remediation advice / execution**.

**Latest [v1.0.6](https://github.com/openocta/openocta/releases/tag/v1.0.6)** (2026-07-15) — Windows / macOS installers · fix empty tool-call argument errors · harden Windows write-file paths · Knowledge Vault UI redesign · single Go binary with embedded Control UI

[All releases →](https://github.com/openocta/openocta/releases) · [⭐ Star the project](https://github.com/openocta/openocta)

---

## Why an Ops Agent, not a general-purpose Agent?

General Agents are strong at “writing docs, editing code, chatting.” Ops needs something that **connects to live tooling, understands alert context, and closes the inspection & troubleshooting loop**.

| Ops pain | How OpenOcta puts AI to work |
|----------|------------------------------|
| Alert storms, hard root-cause | Aggregate alerts + correlate metrics / logs / changes; output root-cause hypotheses and remediation steps |
| Manual inspections, hard to retain results | Define inspection tasks in natural language; run on schedule and summarize risk lists |
| Data scattered across platforms | Intelligent data Q&A: query monitoring, logs, tickets, capacity, and cost in plain language |
| Too many tools, high switching cost | Skills / MCP / digital employees connect Zabbix, Prometheus, K8s, and more |
| Tribal knowledge, hard to reuse | Knowledge Vault retains Runbooks, cases, and personal remediation preferences |
| Night shifts, slow remote response | WeCom / DingTalk / Feishu / WeChat remote task dispatch |

---

## ✨ Key features

### Product form

🖥️ **Desktop install, full-stack ops** — Install on Windows / macOS; work targets cover Linux servers, containers, network devices, databases, cloud resources, and business apps — not just local-machine ops.

⚡️ **Double-click ready (~30 seconds)** — Full Control UI out of the box; no hours of CLI setup; built for frontline ops to get productive fast.

🪶 **Ultra-lightweight** — ~30MB-class installers, low memory footprint; suitable for 24/7 on-call residency.

🔒 **Local-first** — Sessions, memory, and ops context stay on your machine by default; intranet-ready; no Node / Python required in production.

### Ops domain capabilities

🎯 **Core IT ops scenarios out of the box** — Auto inspection, alert analysis, intelligent data Q&A, release verification, slow-query analysis, capacity & cost triage — trigger with one sentence.

🔌 **Common ops toolchain adapters** — Connect popular stacks via Skills / MCP / digital employees (continuously expandable):

| Category | Integrable / extendable examples |
|----------|----------------------------------|
| Monitoring & alerting | **Zabbix**, **Prometheus**, Grafana, Alertmanager, Nightingale |
| Logs & observability | ELK / OpenSearch, Loki, Graylog, cloud logging |
| Containers & orchestration | Kubernetes, Helm, Docker, container-cloud consoles |
| Automation | Ansible, Salt, script libraries, Cron / scheduled jobs |
| Databases | MySQL, PostgreSQL, Redis, MongoDB (slow queries / connections / backup checks) |
| Cloud & middleware | Public-cloud APIs, Nginx, Kafka, RabbitMQ, JVM / middleware health checks |
| Collaboration & tickets | WeCom / DingTalk / Feishu, Webhooks, CMDB / bastion hosts (per environment) |

👷 **Ops digital employees** — One-click install role-based workers such as Zabbix SRE, Prometheus, and MySQL DBA — compose capabilities by scenario instead of assembling prompts from scratch.

📡 **Alert intake & IM command** — Dispatch tasks remotely via WeChat, WeCom, DingTalk, and Feishu; alerts can wake the Agent through Webhooks / channels.

🧠 **Ops memory & evolution** — Four-tier memory + L4 Evolution + Knowledge Vault: Runbooks, preferences, and historical cases stay local and get smarter over time ([docs](./docs/knowledge-vault.md)).

### Engineering foundation

🔧 **Fully self-developed Go runtime** — Native Gateway, Agent, and Channels; single binary with embedded Control UI.

🧩 **Extensible Skills & MCP** — Built-in tools + MCP protocol + [skills marketplace](https://resource.openocta.com); keep adding capabilities for your enterprise stack.

---

## Who is it for?

- **Application / business ops & SRE**: release verification, health checks, alert noise reduction, and root-cause analysis  
- **Infrastructure ops**: hosts, networks, middleware, capacity, and inspection automation  
- **DBAs**: slow queries, connection counts, backup and storage risk analysis  
- **Cloud ops / FinOps**: resource triage, permission checks, cost anomaly analysis  
- **Desktop / endpoint ops**: bulk environment checks, scripts, and remote-command assistance  
- **Teams that want AIOps to actually land**: a desktop Agent you can install, connect, and put to work  

**Not a fit**: scenarios that only want a generic chat window and never plan to connect any ops systems.

---

## vs. OpenClaw & Hermes

OpenOcta is built around **IT ops as the primary domain**: desktop double-click install, full client UI, ops toolchain adapters, and China-local IM channels — putting AI into real inspection, alerting, and data-Q&A work. Versus OpenClaw (Node / self-hosted Gateway) and Hermes (Python / CLI-oriented), OpenOcta ships a **self-developed Go single binary** runtime with built-in **L4 autonomous evolution** and **Knowledge Vault**.

| | OpenOcta | OpenClaw | Hermes |
|---|:---:|:---:|:---:|
| Positioning | **IT Ops Agent / AIOps Agent** | General Gateway Agent | General CLI Agent |
| Install form | Windows / macOS double-click | CLI deploy | CLI deploy |
| Work scope | Full-stack IT ops (not limited to host OS) | General tasks | General tasks |
| Ops toolchain | Skills / MCP / digital employees (Zabbix, Prometheus, etc.) | General extensions | Skill self-generation |
| Runtime | Self-developed Go · single binary | Node.js | Python |
| IM channels | WeChat / WeCom / DingTalk / Feishu | Overseas IM lean | Overseas IM lean |
| Memory evolution | Four-tier memory + L4 Evolution | Workspace Markdown | Skill self-generation |
| Local knowledge base | Knowledge Vault (Runbook-friendly) | — | — |
| Time to start | ~30 seconds | Typically hours | Typically hours |

**Full comparison & selection guide** → [docs/compare-openclaw-hermes.md](./docs/compare-openclaw-hermes.md)

---

## Feature gallery

OpenOcta puts inspection, alerting, data Q&A, skills, and knowledge retention into one desktop client — so the ops loop is installable, connectable, and usable.

#### Agent chat

Assign inspection, alert analysis, data Q&A, and remediation in natural language. The Agent correlates context and calls your ops toolchain.

<p align="left">
  <img alt="OpenOcta Agent chat for natural-language inspection, alert analysis, data Q&A, and remediation" src="./imgs/readmePIC/QQ20260709-211128.png" width="900">
</p>

Learn more: [Scenarios](./docs/scenarios.md) · [Architecture](./docs/architecture.md)

#### Employee marketplace

One-click install role-based digital employees such as Zabbix SRE, Prometheus, and MySQL DBA — compose capabilities by scenario instead of assembling prompts from scratch.

<p align="left">
  <img alt="OpenOcta employee marketplace for one-click ops digital employees" src="./imgs/readmePIC/QQ20260709-211216.png" width="900">
</p>

Learn more: [Digital employees](./docs/digital-employees.md) · [Built-in employees](./docs/builtin-employees.md)

#### Skills library

Enable 766+ Skills across monitoring, DevOps, and databases to connect your live stack, and keep extending via MCP.

<p align="left">
  <img alt="OpenOcta Skills library across monitoring, DevOps, and databases" src="./imgs/readmePIC/QQ20260709-211148.png" width="900">
</p>

Learn more: [Skills](./docs/skills.md) · [MCP configuration](./docs/mcp-configuration.md) · [Skills marketplace](https://resource.openocta.com)

#### Knowledge Vault

Retain Runbooks, standards, and historical cases for semantic retrieval — so the Agent learns your environment and remediation preferences over time.

<p align="left">
  <img alt="OpenOcta Knowledge Vault for Runbooks and historical case retrieval" src="./imgs/readmePIC/QQ20260709-211804.png" width="900">
</p>

Learn more: [Knowledge Vault](./docs/knowledge-vault.md) · [User guide](./docs/knowledge-vault-user-guide.md)

#### Model configuration

Connect public or local models for intranet deployment and data-compliance needs. First launch can finish setup through the guided wizard.

<p align="left">
  <img alt="OpenOcta model configuration for public and local model access" src="./imgs/readmePIC/QQ20260709-211248.png" width="900">
</p>

Learn more: [Model providers](./docs/model-providers.md)

#### Tutorials

Windows / Mac quick start and hands-on ops courses — so frontline teams can go from install to real work in about 30 seconds.

<p align="left">
  <img alt="OpenOcta tutorials for Windows / Mac quick start and hands-on ops" src="./imgs/readmePIC/QQ20260709-211257.png" width="900">
</p>

Learn more: [Website](https://openocta.com) · [Start in 30 seconds](#start-in-30-seconds-windows--macos)

Also includes: [**Tools**](./docs/tools.md), [**scheduled inspection / Cron**](./docs/configuration.md), [**IM channels**](./docs/channels-overview.md), and [**Webhooks**](./docs/webhooks.md). More capabilities on [openocta.com](https://openocta.com).

---

## Typical ops scenarios

### Core jobs (where AI amplifies value most)

**Auto inspection** — Periodically check hosts, services, middleware, and business availability; auto-summarize anomalies.  
*Example: “Inspect the production Web cluster and output availability plus disk / memory risk lists.”*

**Alert analysis** — Aggregate alerts, correlate metrics / logs / changes, and provide root-cause hypotheses plus remediation advice.  
*Example: “Analyze this P1 alert and, with recent release history, give investigation steps.”*

**Intelligent data Q&A** — Query monitoring, logs, tickets, and ops data in natural language; get conclusions in seconds.  
*Example: “Which top 5 APIs had the highest error rates in the past 24 hours?”*

### Coverage domains (desktop-installed, full-stack work)

**Application ops** — Release verification, health checks, log localization, rollback advice.  
*Example: “Verify tonight’s post-release health checks and list anomalous services.”*

**Server ops** — Resources, processes, service status, and bulk inspection.  
*Example: “This Linux host’s CPU is spiking — find Top processes and suggest remediation.”*

**Network ops** — Connectivity, pathing, proxy / DNS / certificate triage.  
*Example: “From the jump host, test connectivity to the DB segment and explain likely bottlenecks.”*

**Desktop ops** — Endpoint environment, software status, and bulk script assistance.  
*Example: “Check whether this machine’s proxy and certificates are healthy, and give fix commands.”*

**DB ops** — Slow queries, connection counts, backup and storage risk.  
*Example: “Check MySQL slow-query Top 10 and suggest optimizations.”*

**Cloud ops** — Cloud resources, permissions, billing, and autoscaling triage.  
*Example: “List cloud resources with abnormal cost growth this week and explain likely causes.”*

More cases: [openocta.com/cases](https://openocta.com/cases) · [scenario docs](./docs/scenarios.md)

---

## Start in 30 seconds (Windows / macOS)

1. **Download** — [GitHub Releases](https://github.com/openocta/openocta/releases/latest) or the [openocta.com download page](https://openocta.com/#download)
2. **Install & open** — Double-click to install the desktop client (~30 seconds)
3. **Connect a model → start ops chat** — Describe tasks in **Messages**; then install Zabbix / Prometheus Skills or digital employees as needed to connect your live toolchain

<p align="left">
  <img src="./imgs/screenshots/demo.gif" width="720" alt="OpenOcta IT Ops Agent demo">
  <br/>
  <sub>Product demo · Messages → Skills → Knowledge Vault → Ops Agent (to be added)</sub>
</p>

---

## First-time setup (~2 minutes)

After install, connect a large language model before chatting. Choose either path:

**Option A — UI setup (recommended)**  
Open the client **Models** tab, or follow the first-run **setup wizard**, enter an API Key, and pick a model.

<p align="left">
  <img src="./imgs/readmePIC/QQ20260709-220423.png" width="780" alt="OpenOcta model setup wizard">
</p>

**Option B — Edit the config file**

| Platform | Config path |
|----------|-------------|
| macOS | `~/.openocta/openocta.json` |
| Windows | `%APPDATA%\openocta\openocta.json` |

Minimal example ([Moonshot](https://platform.moonshot.cn/); for DeepSeek / Qwen / Doubao and more, see [model provider docs](./docs/model-providers.md)):

```json
{
  "env": {
    "vars": {
      "MOONSHOT_API_KEY": "sk-your-key"
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "moonshot-cn/kimi-k2.5" }
    }
  }
}
```

Save, restart the client, and try this in **Messages**:

> Design a daily inspection checklist for Web + MySQL, and explain how to trigger each item in natural language.

After connecting monitoring, try:

> Pull the past hour’s error rate and 5xx from Prometheus / Zabbix, summarize anomalous services, and give an investigation order.

---

## Why choose OpenOcta

| | |
|---|---|
| **Strongest IT Ops Agent (mission)** | Focused on inspection, alert analysis, and intelligent data Q&A; covers application / server / network / desktop / DB / cloud |
| **Desktop install ≠ host-only ops** | Installed on Windows / macOS; work targets are your servers, clusters, cloud, and databases |
| **Ops-toolchain friendly** | Skills / MCP / digital employees connect Zabbix, Prometheus, K8s, DB, and common stacks |
| **AI in the closed loop** | Not empty chat: correlate context, give steps, call tools, and run scheduled on-call jobs |
| **Self-developed Go runtime** | Fully self-developed Gateway / Agent / Channels; single binary; no Node / Python in production |
| **Local-first** | Sessions and memory stay on-device — fit for enterprise ops compliance and intranet |
| **IM remote command** | WeCom / DingTalk / Feishu / WeChat — dispatch alerts and tasks anytime |
| **Evolvable memory** | Knowledge Vault + L4 Evolution — Runbooks and preferences keep accumulating |

> Architecturally inspired by [OpenClaw](https://github.com/openclaw/openclaw)’s Gateway protocol and Control UI experience, fully **self-developed in Go** by the team, and positioned as an **IT Ops Agent (AIOps Agent)**.

---

## Download & install

Visit the **[openocta.com download page](https://openocta.com/#download)**:

| Platform | Package |
|----------|---------|
| Windows | `OpenOcta-amd64-installer.exe` |
| macOS (Apple Silicon) | `OpenOcta-arm64.dmg` |
| macOS (Intel) | `OpenOcta-amd64.dmg` |

| Platform | Default config directory |
|----------|--------------------------|
| macOS | `~/.openocta/openocta.json` |
| Windows | `%APPDATA%\openocta\openocta.json` |

macOS: drag from the `.dmg` into Applications; see [`deploy/dist-README.md`](./deploy/dist-README.md).

**Online resources**

- Website: https://openocta.com  
- Skills / MCP / digital employee marketplace: https://resource.openocta.com  
- Enterprise AMC: https://amc.openocta.com  

---

## FAQ

**Q: What is OpenOcta?**  
A: OpenOcta is an open-source **IT Ops Agent / AIOps Agent**: install on Windows / macOS desktops and use natural language for inspection, alert analysis, intelligent data Q&A, and other ops jobs.

**Q: Does it only operate Windows / Mac?**  
A: **No.** The client installs on Windows / Mac; work targets can be Linux servers, Kubernetes, databases, networks, cloud resources, and other full-stack IT assets.

**Q: How is it different from ChatGPT / general Agents?**  
A: General Agents lean toward chat and office work; OpenOcta targets the ops closed loop — toolchain integration (Zabbix, Prometheus, etc.), digital employees, scheduled inspection, IM on-call, and local knowledge retention.

**Q: Which ops systems can it connect to?**  
A: Extend via Skills, MCP, and digital employees; common ones include Zabbix, Prometheus, Grafana, Kubernetes, MySQL/PostgreSQL, Ansible, ELK/Loki, and cloud APIs — keep adding for your environment.

**Q: Is data uploaded?**  
A: Local-first by default: sessions and memory stay on your machine; model calls depend on the public / local models and network policy you configure; intranet deployment is supported.

**Q: How do individuals and teams use it?**  
A: Individuals install the client directly; teams can standardize capabilities via the skills marketplace; for enterprise scenarios, see [AMC](https://amc.openocta.com).

---

## Developers: run from source

Ops users should prefer the installers above. The following is for secondary development / self-hosting.

### Requirements

- **Go 1.24+** (backend build)
- **Node ≥18** (frontend build only; **not required in production**)
- **`ANTHROPIC_API_KEY`** (when using the `agent` CLI)

### Build & start

```bash
make build
./openocta gateway run
```

Gateway defaults to `http://127.0.0.1:18900`; the frontend is embedded via `go:embed` — open the Control UI directly in a browser.

### Dev mode

```bash
./openocta gateway run    # terminal 1
make run-ui               # terminal 2 → http://localhost:5173
```

### Agent CLI

```bash
export ANTHROPIC_API_KEY=your-key
./openocta agent -m "Hello, echo test"
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](./docs/architecture.md) | Gateway, Agent, MCP, Skills |
| [Configuration](./docs/configuration.md) | agents, channels, gateway, cron, hooks, memory |
| [Channels overview](./docs/channels-overview.md) | IM / messaging channels |
| [MCP configuration](./docs/mcp-configuration.md) | MCP servers and permissions |
| [Skills](./docs/skills.md) | Skills system |
| [Tools](./docs/tools.md) | Built-in tools and extensions |
| [Digital employees](./docs/digital-employees.md) | Ops digital-employee mechanism |
| [Webhooks](./docs/webhooks.md) | `/hooks/wake`, `/hooks/agent` |
| [Comparison](./docs/compare-openclaw-hermes.md) | OpenClaw / Hermes |
| [Backend](./src/README.md) | Go modules |
| [Frontend](./ui/README.md) | Control UI |
| [简体中文 README](./README.cn.md) | 简体中文 |

Upstream references: [OpenClaw](https://github.com/openclaw/openclaw) · [docs.openclaw.ai](https://docs.openclaw.ai)

---

## Project structure

```text
OpenOcta/
├── src/                    # Go backend (Gateway, Agent, Channels, Cron)
├── ui/                     # Control UI (Lit + Vite)
├── deploy/                 # Installers, Docker, systemd
├── docs/                   # Documentation
└── imgs/                   # Logo, screenshots, community QR
    ├── readmePIC/
    └── screenshots/
```

---

## Contributing

If you are building **AIOps / intelligent ops**, join us in making “the strongest IT Ops Agent” a real, usable open-source foundation:

- ⭐ [Star this repo](https://github.com/openocta/openocta/stargazers) and Watch for updates  
- 🐛 [File ops-scenario Issues](https://github.com/openocta/openocta/issues) (alerts, inspection, and toolchain integration are most valuable)  
- 🔧 [Good first issues](https://github.com/openocta/openocta/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)  
- 🤝 Read [CONTRIBUTING.md](./CONTRIBUTING.md) and open a PR  
- 💬 Scan the QR or visit [openocta.com](https://openocta.com)

<p align="center">
  <img src="./imgs/wechat.png" alt="OpenOcta community WeChat QR" width="220" height="220">
  <br/>
  <sub>Scan to join the OpenOcta discussion group · ops scenario co-building and support</sub>
</p>

---

## License

This repository is licensed under **Apache-2.0**.
