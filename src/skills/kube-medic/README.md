# 🏥 kube-medic

**Kubernetes Cluster Triage & Diagnostics for OpenOcta**

Your cluster is on fire at 3am. Instead of juggling `kubectl` commands, just ask:

> *"What's wrong with my cluster?"*

The agent runs a full sweep, correlates nodes + pods + events + resources, and tells you the diagnosis — not just symptoms.

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Read-only](https://img.shields.io/badge/default-read--only-brightgreen)

---

## What It Does

**kube-medic** gives your AI agent direct access to Kubernetes cluster diagnostics through `kubectl`. Instead of copy-pasting between terminals, just describe the problem:

- *"Is my cluster healthy?"*
- *"Why is the payments pod crashing?"*
- *"Is the rollout stuck?"*
- *"Which pods are eating all the memory?"*
- *"What changed in the last 15 minutes?"*

The agent runs the right subcommand, parses structured JSON output, cross-references nodes/pods/events/resources, and delivers a diagnosis with recommended actions.

## Install

```bash
clawhub install kube-medic
```

Requires `kubectl` configured with cluster access and `jq`:

```bash
# Verify prerequisites
kubectl cluster-info
jq --version
```

That's it. No API keys. No extra config. Uses your existing kubeconfig.

## Example Interaction

```
You: Something is wrong with production. Pods keep restarting.

Agent: Let me run a full cluster sweep.
       [runs: kube_medic(subcommand="sweep", context="production")]

       🏥 Cluster Triage Report

       **Nodes:** 3/3 Ready ✅
       **Problem Pods:** 4 found

       | Pod | Namespace | Status | Restarts |
       |-----|-----------|--------|----------|
       | payments-api-7f8d4-x2k9p | prod | CrashLoopBackOff | 47 |
       | payments-api-7f8d4-m3n1q | prod | CrashLoopBackOff | 43 |
       | payments-worker-5c9a2-j8k3 | prod | OOMKilled | 12 |
       | cache-redis-0 | prod | Pending | 0 |

       ⚠️ 23 warning events in the last 15 minutes — mostly OOMKilled
       and BackOff events for the payments pods.

       Let me dig into the payments-api pod to find the root cause.
       [runs: kube_medic(subcommand="pod", target="payments-api-7f8d4-x2k9p")]

       ## 🏥 Pod Autopsy: payments-api-7f8d4-x2k9p

       **Diagnosis:** The container is being OOMKilled with a 256Mi memory
       limit. Logs show the JVM heap is configured at 512m, exceeding the
       container limit. The pod crashes immediately after startup.

       **Root Cause:** Memory limit (256Mi) < JVM heap size (512m)

       **Recommended Actions:**
       1. Increase memory limit to at least 768Mi:
          `kubectl set resources deployment/payments-api -c payments-api --limits=memory=768Mi -n prod`
       2. Or reduce JVM heap: `-Xmx200m`

       Shall I check the deployment rollout history to see when this changed?
```

## Commands

| Command | Description |
|---------|-------------|
| `sweep` | Full cluster health triage — nodes, problem pods, events, components |
| `pod <name>` | Pod autopsy — describe, logs, previous logs, events, image mismatch detection |
| `deploy <name>` | Deployment status — rollout state, history, ReplicaSets, events |
| `resources` | CPU/memory pressure — node usage, top pods, missing limits |
| `events [namespace]` | Recent cluster events — warnings, summaries, top reasons |

## Features

- **🏥 Full Cluster Sweep:** One command gives you nodes, problem pods, CrashLoopBackOff/ImagePullBackOff detection, warning events, and component health.
- **🔬 Pod Autopsy:** Deep dive into a failing pod with logs, previous container logs, events, and image version mismatch detection.
- **🚀 Deployment Analysis:** Rollout status, revision history, ReplicaSet tracking — see exactly which deployment broke things.
- **📊 Resource Pressure:** Node CPU/memory usage, top consumers, pods missing resource limits.
- **📋 Event Timeline:** Recent events sorted and summarized with top reasons.
- **🔀 Multi-Cluster:** Specify `--context` to switch between clusters seamlessly.
- **🔒 Read-Only by Default:** All diagnostic commands are read-only. Write operations (rollback, scale, delete pod) require explicit user confirmation.
- **🛡️ Write Allowlist:** Only safe write commands are permitted: `rollout undo`, `rollout restart`, `scale`, `delete pod`, `cordon`, `uncordon`. No `kubectl exec`. Ever.
- **📦 Structured JSON Output:** All responses are structured JSON that the LLM can parse and present as clean Markdown tables and timelines.

## OpenOcta Discord v2 Ready

Compatible with OpenOcta Discord channel behavior documented for v2026.2.14+:
- Compact first triage response (top issues first), with details on demand
- Component-style quick actions when available (`Run Full Sweep`, `Pod Autopsy`, `Show Recent Warning Events`)
- Numbered-list fallback when components are unavailable

## Requirements

- `kubectl` — configured with cluster access
- `jq` — JSON processing
- Cluster connectivity (kubeconfig, VPN, etc.)
- Optional: `metrics-server` addon for `resources` subcommand (CPU/memory usage)

## Security

- All diagnostics are **read-only** — zero cluster modifications unless you explicitly approve
- Write operations require user confirmation and are restricted to an allowlist
- `kubectl exec` is **never executed** — not even with confirmation
- Kubeconfig paths and credentials are never included in output
- See [SECURITY.md](SECURITY.md) for full details

## License

MIT — use it however you want.

---

Built by **[Anvil AI](https://anvil-ai.io)**.

