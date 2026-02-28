# Changelog

All notable changes to the `kube-medic` skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] — 2026-02-16

### Added
- Discord v2 delivery guidance in `SKILL.md` for OpenOcta v2026.2.14+:
  - Compact first response for triage
  - Component-style quick actions
  - Numbered fallback when components are unavailable
- `discord` and `discord-v2` tags in skill metadata

### Changed
- README: added "OpenOcta Discord v2 Ready" compatibility section and bumped version badge to `1.0.1`.

### Fixed
- `kube-medic.sh`: standardized error JSON emission through `jq -n --arg` for safer structured output.

## [1.0.0] — 2026-02-15

### Added
- Initial release of kube-medic skill
- **sweep** command — full cluster health triage (nodes, problem pods, CrashLoopBackOff/ImagePullBackOff detection, warning events, component status)
- **pod** command — pod autopsy with container statuses, current + previous logs, pod events, and image version mismatch detection
- **deploy** command — deployment rollout status, revision history, ReplicaSet tracking, and deployment events
- **resources** command — node CPU/memory usage, pressure conditions, top 20 pods by CPU and memory, pods missing resource limits
- **events** command — recent cluster events with summary statistics and top event reasons, capped at 100 events
- Multi-cluster support via `--context` flag
- Namespace scoping via `--namespace` flag (defaults to all-namespaces where applicable)
- Configurable log tail depth via `--tail` (default: 200 lines)
- Configurable event time window via `--since` (default: 15m)
- Write operation support with allowlist (rollout undo, rollout restart, scale, delete pod, cordon, uncordon)
- Write operations gated behind `--confirm-write` requiring explicit user approval
- SKILL.md with comprehensive SRE triage workflows, correlation guidance, and Markdown output templates
- Auto-detection of pod namespace when `--namespace` not specified
- Structured JSON output envelope for all commands
- RBAC error detection and reporting
- Graceful error handling for missing kubectl, missing jq, and cluster connectivity failures

*Powered by Anvil AI 🏥*
