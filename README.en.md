<p align="center">
  <img src="./imgs/openocta_logo.png" alt="OpenOcta" width="420">
</p>

<p align="center">
  <b>OpenOcta</b> — A Go‑based, enterprise‑oriented observability & operations agent
</p>

> English | [简体中文](README.md)

OpenOcta is built on the [OpenClaw](https://github.com/openocta/openocta) Gateway protocol and Control UI, and is rewritten as a **single Go binary backend with an embedded frontend**, targeting headless enterprise servers for observability, operations, and automation scenarios.

---

## Project overview

- **Positioning**: Acts as an internal “observability & operations brain”, connecting metrics, logs, traces, alerts, configuration, CMDB, tickets, and knowledge bases, and exposing them to an Agent.
- **Form factor**: A single binary that bundles Gateway, Agent, Channels, Cron, and static frontend assets, accessible via CLI, HTTP/WebSocket, and Webhooks.
- **Protocol compatibility**: Compatible with the OpenClaw Gateway WebSocket protocol and official Control UI, making migration or coexistence straightforward.

---

## Community & feedback

- **Discussions & usage sharing**: Join the OpenOcta discussion group to share deployment experience, operations scenarios, and best practices.
- **Issues & feature requests**: You can ask questions in the group, or file Issues / PRs in this Git repository.

<p align="center">
  <img src="./imgs/wechat.png" alt="OpenOcta community QR code" width="220" height="220">
  <br/>
  <sub>Scan to join the OpenOcta discussion group and get updates & support</sub>
</p>

---

## Quick start

### Requirements

- **Go 1.24+** (to build the backend)
- **Node ≥18** (only required for building the frontend; not needed in production)
- Environment variable **`ANTHROPIC_API_KEY`** (required when using the `agent` command)

### Build and start the Gateway

```bash
# Build (recommended)
make build

# Or use the helper script
./build.sh build   # supports: ui | embed | go | build | clean | snapshot | release | docker

# Start the Gateway
make run
# or
./openocta gateway run
```

By default the Gateway listens on `http://127.0.0.1:18900` for both HTTP and WebSocket connections.  
The Control UI is embedded via `go:embed`, so you can open the same URL directly in a browser.

### Frontend dev mode

```bash
# Terminal 1: run the Gateway (requires an initial build)
./openocta gateway run

# Terminal 2: run the frontend dev server (port 5173)
make run-ui
```

Open `http://localhost:5173` in a browser to develop the Control UI with hot reload.

### Using the Agent CLI

```bash
export ANTHROPIC_API_KEY=your-key
./openocta agent -m "Hello, echo test"
```

### Configuration file

On first run, if no config file exists, OpenOcta initializes one from the embedded `openocta.json.example` into:

| Platform       | Default path                        |
|----------------|-------------------------------------|
| Linux / macOS  | `~/.openocta/openocta.json`        |
| Windows        | `%APPDATA%\openocta\openocta.json` |

---

## Documentation

### Language map

- **Chinese docs**
  - Root: `README.md`
  - Backend: `src/README.md`
  - Frontend: `ui/README.md`
- **English docs**
  - Root (this file): `README.en.md` (high‑level overview)

### Main docs

- **Backend overview**: `src/README.md` — modules, status, and backend‑specific docs.
- **Frontend overview**: `ui/README.md` — Control UI features, scripts, and structure.
- **Backend internals** (under `src/docs/`):
  - `configuration.md` — configuration overview: agents, channels, gateway, cron, hooks, memory, etc.
  - `mcp-configuration.md` — how to declare MCP servers, permissions, and timeouts.
  - `trace-and-observability.md` — tracing, token usage collection, and call chains.
  - `webhooks.md` — `/hooks/wake`, `/hooks/agent`, `/hooks/alert` endpoints and use cases.
  - `architecture.md` — layered design with agentsdk-go and extension points.
  - `skills.md`, `tools.md`, `tools-builtin.md`, `tools-openocta.md` — skills & tools system overview.

Upstream references:

- [OpenClaw repository](https://github.com/openclaw/openclaw)
- [docs.openclaw.ai](https://docs.openclaw.ai) — official Gateway & configuration docs

---

## Project layout

```text
OpenOcta/
├── src/                    # Go backend (Gateway, Agent, Channels, Cron, etc.)
│   ├── cmd/openocta/       # CLI entrypoints and subcommands
│   ├── embed/              # Embedded assets (frontend, config-schema, openocta.json.example)
│   │   └── frontend/       # Built frontend artifacts (from build)
│   ├── pkg/                # Core modules
│   └── README.md           # Backend detailed (Chinese) docs
├── ui/                     # Control UI frontend (Lit + Vite, WebSocket control plane)
│   └── README.md           # Frontend detailed (Chinese) docs
├── deploy/                 # Deployment artifacts (Dockerfile, systemd)
└── docs/                   # Extra docs and migration notes
```

---

## License

This repository is licensed under **GPLv3** with additional restrictions.

You may build derivative works based on the OpenOcta source code, but you **must** follow these rules:

- You may not replace or modify the OpenOcta logo or copyright information.
- Derived works must remain compliant with the GPLv3 open‑source obligations.

For commercial licensing, please contact: **chengyun@databuff.com**.

<p align="center">
  <img src="./imgs/openocta_logo.png" alt="OpenOcta" width="420">
</p>

<p align="center">
  <b>OpenOcta</b> — A Go‑based, enterprise‑oriented observability & operations agent
</p>

> 中文说明请见 `README.md`。  
> For the Chinese version, see `README.md`.

OpenOcta is a Go re‑implementation of the [OpenClaw](https://github.com/openocta/openocta) backend and Control UI, shipped as a **single Go binary with an embedded frontend**. It targets headless enterprise servers and focuses on observability, operations, and automation scenarios.

---

## Overview

- **Positioning**: An internal “observability & operations brain” that connects metrics, logs, traces, alerts, configuration, CMDB, tickets, and knowledge bases, and exposes them to an Agent.
- **Form factor**: A single binary that bundles Gateway, Agent, Channels, Cron, and static frontend assets, accessible via CLI, HTTP/WebSocket, and Webhooks.
- **Protocol compatibility**: Compatible with the OpenClaw Gateway WebSocket protocol and official Control UI, making migration or coexistence straightforward.

---

## Quick start

### Requirements

- **Go 1.24+** (to build the backend)
- **Node ≥18** (only required for building the frontend; not needed in production)
- Environment variable **`ANTHROPIC_API_KEY`** (required when using the `agent` command)

### Build and start the Gateway

```bash
# Build (recommended)
make build

# Or use the helper script
./build.sh build   # supports: ui | embed | go | build | clean | snapshot | release | docker

# Start the Gateway
make run
# or
./openocta gateway run
```

By default the Gateway listens on `http://127.0.0.1:18900` for both HTTP and WebSocket connections.  
The Control UI is embedded via `go:embed`, so you can open the same URL directly in a browser.

### Frontend dev mode

```bash
# Terminal 1: run the Gateway (requires an initial build)
./openocta gateway run

# Terminal 2: run the frontend dev server (port 5173)
make run-ui
```

Open `http://localhost:5173` in a browser to develop the Control UI with hot reload.

### Using the Agent CLI

```bash
export ANTHROPIC_API_KEY=your-key
./openocta agent -m "Hello, echo test"
```

### Configuration file

On first run, if no config file exists, OpenOcta initializes one from the embedded `openocta.json.example` into:

| Platform       | Default path                        |
|----------------|-------------------------------------|
| Linux / macOS  | `~/.openocta/openocta.json`        |
| Windows        | `%APPDATA%\openocta\openocta.json` |

---

## Documentation

### Language map

- **Chinese docs**
  - Root: `README.md`
  - Backend: `src/README.md`
  - Frontend: `ui/README.md`
- **English docs**
  - Root (this file): `README.en.md` (high‑level overview)

### Main docs

- **Backend overview**: `src/README.md` — modules, status, and backend‑specific docs.
- **Frontend overview**: `ui/README.md` — Control UI features, scripts, and structure.
- **Backend internals** (under `src/docs/`):
  - `configuration.md` — configuration overview: agents, channels, gateway, cron, hooks, memory, etc.
  - `mcp-configuration.md` — how to declare MCP servers, permissions, and timeouts.
  - `trace-and-observability.md` — tracing, token usage collection, and call chains.
  - `webhooks.md` — `/hooks/wake`, `/hooks/agent`, `/hooks/alert` endpoints and use cases.
  - `architecture.md` — layered design with agentsdk-go and extension points.
  - `skills.md`, `tools.md`, `tools-builtin.md`, `tools-openocta.md` — skills & tools system overview.

Upstream references:

- [OpenClaw repository](https://github.com/openocta/openocta)
- [docs.openclaw.ai](https://docs.openclaw.ai) — official Gateway & configuration docs

---

## Project layout

```text
OpenOcta/
├── src/                    # Go backend (Gateway, Agent, Channels, Cron, etc.)
│   ├── cmd/openocta/       # CLI entrypoints and subcommands
│   ├── embed/              # Embedded assets (frontend, config-schema, openocta.json.example)
│   │   └── frontend/       # Built frontend artifacts (from build)
│   ├── pkg/                # Core modules
│   └── README.md           # Backend detailed (Chinese) docs
├── ui/                     # Control UI frontend (Lit + Vite, WebSocket control plane)
│   └── README.md           # Frontend detailed (Chinese) docs
├── deploy/                 # Deployment artifacts (Dockerfile, systemd)
└── docs/                   # Extra docs and migration notes
```

---

## Community & feedback

- **Discussions & usage sharing**: Join the OpenOcta discussion group to share deployment experience, operations scenarios, and best practices.
- **Issues & feature requests**: You can ask questions in the group, or file Issues / PRs in this Git repository.

<p align="center">
  <img src="./imgs/wechat.png" alt="OpenOcta community QR code" width="220" height="220">
  <br/>
  <sub>Scan to join the OpenOcta discussion group and get updates & support</sub>
</p>

<p align="center">
  <img src="./imgs/openocta_logo.png" alt="OpenOcta" width="420">
</p>

<p align="center">
  <b>OpenOcta</b> — A Go‑based, enterprise‑oriented observability & operations agent
</p>

> 中文说明请见 `README.md`。  
> For the Chinese version, see `README.md`.

OpenOcta combines a Go backend migrated from the original [OpenClaw](https://github.com/openocta/openocta) TypeScript/Node.js backend with a Control UI frontend that is compatible with the OpenClaw Gateway WebSocket protocol.

---

## Community & Feedback

- **Discussions & usage sharing**: Join the OpenOcta discussion group to share deployment experience, operations scenarios, and best practices.
- **Issues & feature requests**: You can ask questions in the group, or file Issues / PRs in this Git repository.

<p align="center">
  <img src="./imgs/wechat.png" alt="OpenOcta community QR code" width="220" height="220">
  <br/>
  <sub>Scan to join the OpenOcta discussion group and get updates & support</sub>
</p>

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
OpenOcta/
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

