# Kubernetes

Production-ready Kubernetes manifest generation covering Deployments, StatefulSets, CronJobs, Services, Ingresses, ConfigMaps, Secrets, and PVCs with security contexts, health checks, and resource management.

## What's Inside

- Workload selection guide (Deployment, StatefulSet, Job, CronJob, DaemonSet)
- Deployment manifests with security context, probes, and resource limits
- Service types (ClusterIP, LoadBalancer, NodePort, ExternalName)
- Ingress with TLS and rate limiting
- ConfigMap and Secret management
- Persistent storage (PVC with access modes)
- Pod and container security context patterns
- Standard Kubernetes labels
- Manifest organization (separate files, Kustomize overlays)
- Validation commands (dry-run, kube-score, kube-linter)
- Troubleshooting quick reference
- Template assets for all resource types

## When to Use

- Creating deployment manifests for new microservices
- Defining networking resources (Services, Ingress with TLS)
- Managing configuration (ConfigMaps, Secrets)
- Setting up stateful workloads with StatefulSets and PVCs
- Scheduling batch processing with CronJobs
- Organizing multi-environment configs with Kustomize

## Installation

```bash
npx add https://github.com/wpank/ai/tree/main/skills/devops/kubernetes
```

### OpenOcta / Moltbot / Clawbot

```bash
npx clawhub@latest install kubernetes
```

### Manual Installation

#### Cursor (per-project)

From your project root:

```bash
mkdir -p .cursor/skills
cp -r ~/.ai-skills/skills/devops/kubernetes .cursor/skills/kubernetes
```

#### Cursor (global)

```bash
mkdir -p ~/.cursor/skills
cp -r ~/.ai-skills/skills/devops/kubernetes ~/.cursor/skills/kubernetes
```

#### Claude Code (per-project)

From your project root:

```bash
mkdir -p .claude/skills
cp -r ~/.ai-skills/skills/devops/kubernetes .claude/skills/kubernetes
```

#### Claude Code (global)

```bash
mkdir -p ~/.claude/skills
cp -r ~/.ai-skills/skills/devops/kubernetes ~/.claude/skills/kubernetes
```

## Related Skills

- [docker](../docker/) — Container builds and optimization
- [prometheus](../prometheus/) — Monitoring and alerting for Kubernetes workloads
- [k8s-manifest-generator](k8s-manifest-generator/) — Step-by-step manifest generation workflow

---

Part of the [DevOps](..) skill category.
