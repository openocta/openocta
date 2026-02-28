 # Octopus

> 中文说明请见 `README.md`。  
> For the Chinese version, see `README.md`.

## Overview

Octopus is a unified project that combines:

- **Go backend**, migrated from the original TypeScript/Node.js backend of [OpenClaw](https://github.com/openocta/openocta)
- **Control UI frontend**, compatible with the OpenClaw Gateway WebSocket protocol

The goal is to provide an **enterprise‑friendly, observable, operations‑oriented** agent backend, while remaining compatible with the upstream Gateway protocol and Control UI behaviors.

## Why migrate from OpenClaw

### Why the original OpenClaw is not ideal for enterprise environments

- **Tech stack & operations cost**:  
  The Node.js/TypeScript runtime has more dependencies and a heavier process model. On headless enterprise servers, a single Go binary is easier to deploy, audit, and package (e.g. as a container image).
- **Extension & integration model**:  
  The original design focuses on “personal assistant” scenarios (desktop + multi‑channel like Slack, Feishu, etc.). Enterprises usually need deep integration with internal systems, monitoring, ticketing, and APIs, with clearer backend extension points and standard interfaces.
- **Security & compliance**:  
  Enterprise deployments typically require no desktop, minimal exposed surface, and centralized control. Migrating to a Go‑only backend makes it easier to enforce permissions, auditing, and restricted deployment forms.

### Why Go + agentsdk-go

- **Single runtime**:  
  Go produces a single static binary with no extra Node runtime. It suits headless Linux / container deployments, starts fast, and has predictable memory usage.
- **Aligned with Anthropic SDK**:  
  The Agent uses [agentsdk-go](https://github.com/cexll/agentsdk-go), which is aligned with Anthropic’s API and model evolution, reducing custom protocol maintenance.
- **Protocol compatibility**:  
  The project keeps compatibility with the OpenClaw Gateway WebSocket protocol and Control UI, making migrations or coexistence with upstream deployments straightforward.

## Focus areas and business scenarios

The project focuses on **operations & observability**, and on **multi‑source data integration**:

- **Ops / Observability**: metrics, logs, traces, alerts, and change events, enabling the Agent to understand system state and assist with incident analysis and decision‑making (e.g. integrating Prometheus, Grafana, log platforms, ticketing systems).
- **Multi‑source data integration**: bring together monitoring, logs, configuration, CMDB, tickets, and knowledge bases into a single Agent “brain” for root cause analysis, impact assessment, and compliance checks.

## Scope and deployment targets

- **Not focused on desktop automation**:  
  macOS/Windows UI automation and local app control are out of scope.
- **CLI and API first**:  
  Main interaction surfaces are the **CLI** (e.g. `openclaw agent -m "..."`) and **HTTP/WebSocket APIs** (Gateway endpoints, future REST/Webhook), suitable for scripts, pipelines, and other services.
- **Deployment target**:  
  Headless enterprise servers (Linux servers, containers, K8s pods, bastion hosts, internal APIs), running Gateway and Agent in headless mode.

## Extensibility (Skill, Tools, MCP, Channels, Webhooks)

Octopus inherits and extends the OpenClaw model:

- **Skill**: Markdown‑based domain knowledge and instructions, loaded per workspace/config.
- **Tools**: Functions callable by the Agent (built‑in bash/file/webfetch, plus custom tools).
- **MCP**: Model Context Protocol, exposing external services (Prometheus, Grafana, DBs, etc.) as tools.
- **Channel**: Messaging channels (DingTalk, Feishu, WebSocket, etc.) that bring Agent capabilities into IM, alerting, and ticketing systems.
- **Webhooks**: `/hooks/wake`, `/hooks/agent`, `/hooks/alert` endpoints for external systems (alerts, CI/CD, callbacks) to push events into sessions.

By combining these, monitoring, logs, configuration, CMDB, tickets, and knowledge bases can all feed into one Agent, forming a **central brain** for root cause analysis, impact evaluation, and automated responses.

## Project layout

```text
OctopusClaw/
├── src/                    # Go backend (Gateway, Agent, Channels, Cron, etc.)
│   ├── cmd/openclaw/       # CLI entrypoints and subcommands
│   ├── pkg/                # Core modules
│   └── README.md           # Backend detailed (Chinese) docs
├── ui/                     # Control UI frontend (Lit + Vite, WebSocket control plane)
│   └── README.md           # Frontend detailed (Chinese) docs
├── dist/control-ui/        # Built frontend, can be served by Gateway
└── docs/                   # Additional docs and migration plan
```

## Language and documentation map

- **Chinese docs**
  - Root: `README.md`
  - Backend: `src/README.md`
  - Frontend: `ui/README.md`
- **English docs**
  - Root (this file): `README.en.md` (high‑level overview)

For backend and frontend internal details, refer to the Chinese READMEs above; English expansions can be added later as needed.

