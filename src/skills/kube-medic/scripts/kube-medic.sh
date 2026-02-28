#!/usr/bin/env bash
# kube-medic.sh — Kubernetes Cluster Triage & Diagnostics
# Part of the kube-medic skill for OpenOcta / Anvil AI
# All operations are READ-ONLY unless --confirm-write is passed.
#
# Usage: kube-medic.sh <subcommand> [options]
#   sweep                  Full cluster health triage
#   pod <name>             Pod autopsy (describe + logs + events)
#   deploy <name>          Deployment rollout status & history
#   resources              CPU/memory pressure across nodes & pods
#   events [namespace]     Recent cluster events (default: last 15m)
#
# Global flags:
#   --context <ctx>        kubectl context to use
#   --namespace <ns>       Kubernetes namespace (default: --all-namespaces where applicable)
#   --since <duration>     Time window for events (default: 15m)
#   --tail <n>             Log tail lines (default: 200)
#   --confirm-write <cmd>  Execute a write operation (rollback/delete/scale)

set -euo pipefail

###############################################################################
# Constants & Defaults
###############################################################################
VERSION="1.0.1"
BRAND="Powered by Anvil AI 🏥"
DEFAULT_SINCE="15m"
DEFAULT_TAIL=200

###############################################################################
# Global option parsing
###############################################################################
CONTEXT=""
NAMESPACE=""
SINCE="$DEFAULT_SINCE"
TAIL_LINES="$DEFAULT_TAIL"
CONFIRM_WRITE=""
SUBCOMMAND=""
SUBCOMMAND_ARGS=()

usage() {
  cat <<'EOF'
kube-medic — Kubernetes Cluster Triage & Diagnostics

Usage: kube-medic.sh <subcommand> [options]

Subcommands:
  sweep                  Full cluster health triage
  pod <name>             Pod autopsy (describe + logs + events)
  deploy <name>          Deployment rollout status & history
  resources              CPU/memory pressure across nodes & pods
  events [namespace]     Recent cluster events

Global flags:
  --context <ctx>        kubectl context
  --namespace <ns>       Kubernetes namespace
  --since <duration>     Event time window (default: 15m)
  --tail <n>             Log tail lines (default: 200)
  --confirm-write <cmd>  Execute an approved write command
  --version              Print version
  --help                 Show this help

Powered by Anvil AI 🏥
EOF
  exit 0
}

parse_global_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --context)   CONTEXT="$2"; shift 2 ;;
      --namespace) NAMESPACE="$2"; shift 2 ;;
      --since)     SINCE="$2"; shift 2 ;;
      --tail)      TAIL_LINES="$2"; shift 2 ;;
      --confirm-write) CONFIRM_WRITE="$2"; shift 2 ;;
      --version)   echo "kube-medic $VERSION"; exit 0 ;;
      --help|-h)   usage ;;
      -*)          err "Unknown flag: $1"; exit 1 ;;
      *)
        if [[ -z "$SUBCOMMAND" ]]; then
          SUBCOMMAND="$1"; shift
        else
          SUBCOMMAND_ARGS+=("$1"); shift
        fi
        ;;
    esac
  done
}

###############################################################################
# Helpers
###############################################################################

# Colourless JSON envelope for every response
json_envelope() {
  local status="$1" subcommand="$2"
  shift 2
  # remaining args are key:value pairs merged into .data
  local data="$1"
  jq -n \
    --arg status "$status" \
    --arg subcommand "$subcommand" \
    --arg version "$VERSION" \
    --arg brand "$BRAND" \
    --argjson data "$data" \
    '{status: $status, subcommand: $subcommand, version: $version, brand: $brand, data: $data}'
}

err() {
  jq -n --arg m "$1" '{error: $m}' >&2
}

# Build kubectl base command with optional context/namespace
kc() {
  local cmd=(kubectl)
  [[ -n "$CONTEXT" ]] && cmd+=(--context "$CONTEXT")
  [[ -n "$NAMESPACE" ]] && cmd+=(--namespace "$NAMESPACE")
  "${cmd[@]}" "$@"
}

# Like kc but forces all-namespaces when no explicit namespace set
kc_all() {
  local cmd=(kubectl)
  [[ -n "$CONTEXT" ]] && cmd+=(--context "$CONTEXT")
  if [[ -n "$NAMESPACE" ]]; then
    cmd+=(--namespace "$NAMESPACE")
  else
    cmd+=(--all-namespaces)
  fi
  "${cmd[@]}" "$@"
}

# Gracefully run a kubectl command; capture RBAC / other errors as JSON
safe_kc() {
  local output
  if output=$("$@" 2>&1); then
    echo "$output"
  else
    local rc=$?
    if echo "$output" | grep -qi "forbidden\|unauthorized\|RBAC"; then
      jq -n --arg msg "RBAC permission denied: $output" '{rbac_error: $msg}'
    else
      jq -n --arg msg "$output" --argjson rc "$rc" '{error: $msg, exit_code: $rc}'
    fi
  fi
}

###############################################################################
# Preflight checks
###############################################################################
preflight() {
  if ! command -v kubectl &>/dev/null; then
    err "kubectl not found — install from https://kubernetes.io/docs/tasks/tools/"
    exit 127
  fi
  if ! command -v jq &>/dev/null; then
    err "jq not found — install from https://jqlang.github.io/jq/download/"
    exit 127
  fi
  # Verify cluster connectivity (fast, read-only)
  if ! kubectl ${CONTEXT:+--context "$CONTEXT"} cluster-info --request-timeout=5s &>/dev/null 2>&1; then
    err "Cannot connect to Kubernetes cluster. Check your kubeconfig and context."
    exit 1
  fi
}

###############################################################################
# Subcommand: sweep — Full cluster health triage
###############################################################################
cmd_sweep() {
  # 1. Node status & conditions
  local nodes_json
  nodes_json=$(safe_kc kc get nodes -o json | jq '{
    total: (.items | length),
    ready: [.items[] | select(.status.conditions[] | select(.type=="Ready" and .status=="True"))] | length,
    not_ready: [.items[] | select(.status.conditions[] | select(.type=="Ready" and .status!="True"))] | length,
    conditions_summary: [.items[] | {
      name: .metadata.name,
      conditions: [.status.conditions[] | select(.status != "False" and .type != "Ready") | {type: .type, status: .status, message: .message}]
    } | select(.conditions | length > 0)],
    nodes: [.items[] | {
      name: .metadata.name,
      status: (if (.status.conditions[] | select(.type=="Ready")).status == "True" then "Ready" else "NotReady" end),
      kubelet_version: .status.nodeInfo.kubeletVersion,
      os_image: .status.nodeInfo.osImage,
      capacity_cpu: .status.capacity.cpu,
      capacity_memory: .status.capacity.memory
    }]
  }')

  # 2. Problem pods (non-Running, non-Succeeded)
  local problem_pods
  problem_pods=$(safe_kc kc_all get pods -o json | jq '{
    total_pods: (.items | length),
    problem_pods: [.items[] | select(.status.phase != "Running" and .status.phase != "Succeeded") | {
      name: .metadata.name,
      namespace: .metadata.namespace,
      phase: .status.phase,
      reason: (.status.reason // ""),
      container_statuses: [(.status.containerStatuses // [])[] | {
        name: .name,
        ready: .ready,
        restart_count: .restartCount,
        state: (if .state.waiting then {waiting: {reason: .state.waiting.reason, message: (.state.waiting.message // "")}}
                elif .state.terminated then {terminated: {reason: .state.terminated.reason, exit_code: .state.terminated.exitCode}}
                else {running: true} end)
      }]
    }],
    crashloop_pods: [.items[] | select((.status.containerStatuses // [])[] | .state.waiting.reason == "CrashLoopBackOff") | {
      name: .metadata.name,
      namespace: .metadata.namespace,
      restart_count: ((.status.containerStatuses // [])[0].restartCount // 0)
    }],
    image_pull_errors: [.items[] | select((.status.containerStatuses // [])[] | .state.waiting.reason == "ImagePullBackOff" or .state.waiting.reason == "ErrImagePull") | {
      name: .metadata.name,
      namespace: .metadata.namespace,
      image: ((.spec.containers // [])[0].image // "unknown")
    }]
  }')

  # 3. Recent events (warnings)
  local recent_events
  recent_events=$(safe_kc kc_all get events --sort-by='.lastTimestamp' -o json 2>/dev/null | jq --arg since "$SINCE" '{
    warning_events: [.items[] | select(.type == "Warning") | {
      namespace: .metadata.namespace,
      name: .involvedObject.name,
      kind: .involvedObject.kind,
      reason: .reason,
      message: .message,
      count: .count,
      last_timestamp: .lastTimestamp
    }] | sort_by(.last_timestamp) | reverse | .[0:50]
  }') || recent_events='{"warning_events": [], "note": "events query failed or RBAC restricted"}'

  # 4. Component statuses (may be deprecated in newer clusters)
  local component_status
  component_status=$(safe_kc kc get componentstatuses -o json 2>/dev/null | jq '{
    components: [.items[] | {
      name: .metadata.name,
      healthy: ([.conditions[] | select(.type=="Healthy" and .status=="True")] | length > 0),
      message: ((.conditions[] | select(.type=="Healthy")).message // "")
    }]
  }') || component_status='{"components": [], "note": "componentstatuses not available (deprecated in k8s 1.19+)"}'

  # Assemble
  local data
  data=$(jq -n \
    --argjson nodes "$nodes_json" \
    --argjson pods "$problem_pods" \
    --argjson events "$recent_events" \
    --argjson components "$component_status" \
    '{nodes: $nodes, pods: $pods, events: $events, components: $components}')

  json_envelope "ok" "sweep" "$data"
}

###############################################################################
# Subcommand: pod — Pod autopsy
###############################################################################
cmd_pod() {
  local pod_name="${SUBCOMMAND_ARGS[0]:-}"
  if [[ -z "$pod_name" ]]; then
    err "Usage: kube-medic.sh pod <pod-name> [--namespace <ns>]"
    exit 1
  fi

  # Auto-detect namespace if not specified
  local ns_flag=""
  if [[ -z "$NAMESPACE" ]]; then
    local detected_ns
    detected_ns=$(kubectl ${CONTEXT:+--context "$CONTEXT"} get pods --all-namespaces -o json 2>/dev/null \
      | jq -r --arg name "$pod_name" '.items[] | select(.metadata.name == $name) | .metadata.namespace' | head -1)
    if [[ -n "$detected_ns" ]]; then
      NAMESPACE="$detected_ns"
    else
      err "Pod '$pod_name' not found in any namespace. Specify --namespace."
      exit 1
    fi
  fi

  # 1. Pod describe (as JSON)
  local pod_json
  pod_json=$(safe_kc kc get pod "$pod_name" -o json | jq '{
    name: .metadata.name,
    namespace: .metadata.namespace,
    phase: .status.phase,
    node: (.spec.nodeName // "unscheduled"),
    start_time: .status.startTime,
    labels: .metadata.labels,
    owner: ((.metadata.ownerReferences // [])[0] | {kind: .kind, name: .name} // null),
    containers: [.spec.containers[] | {
      name: .name,
      image: .image,
      resources: .resources,
      ports: [(.ports // [])[] | {containerPort: .containerPort, protocol: .protocol}]
    }],
    container_statuses: [(.status.containerStatuses // [])[] | {
      name: .name,
      ready: .ready,
      restart_count: .restartCount,
      image: .image,
      image_id: .imageID,
      state: .state,
      last_state: .lastState
    }],
    init_container_statuses: [(.status.initContainerStatuses // [])[] | {
      name: .name,
      ready: .ready,
      state: .state
    }],
    conditions: [(.status.conditions // [])[] | {type: .type, status: .status, reason: (.reason // ""), message: (.message // "")}],
    tolerations: (.spec.tolerations // []),
    node_selector: (.spec.nodeSelector // {}),
    qos_class: (.status.qosClass // "unknown")
  }')

  # 2. Image version mismatch detection
  local image_mismatch
  image_mismatch=$(safe_kc kc get pod "$pod_name" -o json | jq '{
    mismatches: [
      . as $pod |
      ($pod.spec.containers // [])[] as $spec |
      ($pod.status.containerStatuses // [])[] |
      select(.name == $spec.name) |
      select(.image != $spec.image) |
      {container: .name, spec_image: $spec.image, running_image: .image}
    ]
  }')

  # 3. Current logs (tail)
  local current_logs
  current_logs=$(safe_kc kc logs "$pod_name" --tail="$TAIL_LINES" --all-containers=true 2>&1) || current_logs="(no logs available)"
  current_logs=$(jq -n --arg logs "$current_logs" '$logs')

  # 4. Previous container logs (for crash investigation)
  local previous_logs
  previous_logs=$(safe_kc kc logs "$pod_name" --previous --tail="$TAIL_LINES" --all-containers=true 2>&1) || previous_logs="(no previous logs)"
  previous_logs=$(jq -n --arg logs "$previous_logs" '$logs')

  # 5. Events for this pod
  local pod_events
  pod_events=$(safe_kc kc get events --field-selector="involvedObject.name=$pod_name" --sort-by='.lastTimestamp' -o json 2>/dev/null | jq '{
    events: [.items[] | {
      type: .type,
      reason: .reason,
      message: .message,
      count: .count,
      first_timestamp: .firstTimestamp,
      last_timestamp: .lastTimestamp,
      source: (.source.component // "")
    }]
  }') || pod_events='{"events": []}'

  # Assemble
  local data
  data=$(jq -n \
    --argjson pod "$pod_json" \
    --argjson image_mismatch "$image_mismatch" \
    --argjson current_logs "$current_logs" \
    --argjson previous_logs "$previous_logs" \
    --argjson events "$pod_events" \
    '{pod: $pod, image_mismatch: $image_mismatch, current_logs: $current_logs, previous_logs: $previous_logs, events: $events}')

  json_envelope "ok" "pod" "$data"
}

###############################################################################
# Subcommand: deploy — Deployment status & rollout history
###############################################################################
cmd_deploy() {
  local deploy_name="${SUBCOMMAND_ARGS[0]:-}"
  if [[ -z "$deploy_name" ]]; then
    err "Usage: kube-medic.sh deploy <deployment-name> [--namespace <ns>]"
    exit 1
  fi

  # Default to "default" namespace for deployment queries if none given
  if [[ -z "$NAMESPACE" ]]; then
    NAMESPACE="default"
  fi

  # 1. Deployment details
  local deploy_json
  deploy_json=$(safe_kc kc get deployment "$deploy_name" -o json | jq '{
    name: .metadata.name,
    namespace: .metadata.namespace,
    replicas: {desired: .spec.replicas, ready: (.status.readyReplicas // 0), available: (.status.availableReplicas // 0), unavailable: (.status.unavailableReplicas // 0), updated: (.status.updatedReplicas // 0)},
    strategy: .spec.strategy,
    selector: .spec.selector,
    template_labels: .spec.template.metadata.labels,
    containers: [.spec.template.spec.containers[] | {name: .name, image: .image, resources: .resources}],
    conditions: [(.status.conditions // [])[] | {type: .type, status: .status, reason: (.reason // ""), message: (.message // ""), last_update: .lastUpdateTime}],
    generation: .metadata.generation,
    observed_generation: (.status.observedGeneration // 0),
    creation_timestamp: .metadata.creationTimestamp
  }')

  # 2. Rollout status (text — captures stuck rollouts)
  local rollout_status
  rollout_status=$(safe_kc kc rollout status "deployment/$deploy_name" --timeout=5s 2>&1) || true
  rollout_status=$(jq -n --arg s "$rollout_status" '$s')

  # 3. Rollout history
  local rollout_history
  rollout_history=$(safe_kc kc rollout history "deployment/$deploy_name" -o json 2>/dev/null) || rollout_history='{}'
  # If -o json not supported, fall back to text
  if ! echo "$rollout_history" | jq . &>/dev/null 2>&1; then
    local history_text
    history_text=$(safe_kc kc rollout history "deployment/$deploy_name" 2>/dev/null) || history_text="(unavailable)"
    rollout_history=$(jq -n --arg h "$history_text" '{text: $h}')
  fi

  # 4. ReplicaSets for this deployment
  local replicasets
  replicasets=$(safe_kc kc get replicasets -l "$(safe_kc kc get deployment "$deploy_name" -o jsonpath='{range .spec.selector.matchLabels}{@}{end}' 2>/dev/null | head -c0 && \
    safe_kc kc get deployment "$deploy_name" -o json | jq -r '[.spec.selector.matchLabels | to_entries[] | "\(.key)=\(.value)"] | join(",")')" -o json 2>/dev/null | jq '{
    replicasets: [.items[] | {
      name: .metadata.name,
      desired: (.spec.replicas // 0),
      ready: (.status.readyReplicas // 0),
      available: (.status.availableReplicas // 0),
      revision: (.metadata.annotations["deployment.kubernetes.io/revision"] // ""),
      containers: [.spec.template.spec.containers[] | {name: .name, image: .image}],
      creation_timestamp: .metadata.creationTimestamp
    }] | sort_by(.revision) | reverse
  }') || replicasets='{"replicasets": []}'

  # 5. Events for the deployment
  local deploy_events
  deploy_events=$(safe_kc kc get events --field-selector="involvedObject.name=$deploy_name,involvedObject.kind=Deployment" --sort-by='.lastTimestamp' -o json 2>/dev/null | jq '{
    events: [.items[] | {
      type: .type,
      reason: .reason,
      message: .message,
      count: .count,
      last_timestamp: .lastTimestamp
    }]
  }') || deploy_events='{"events": []}'

  local data
  data=$(jq -n \
    --argjson deploy "$deploy_json" \
    --argjson rollout_status "$rollout_status" \
    --argjson rollout_history "$rollout_history" \
    --argjson replicasets "$replicasets" \
    --argjson events "$deploy_events" \
    '{deployment: $deploy, rollout_status: $rollout_status, rollout_history: $rollout_history, replicasets: $replicasets, events: $events}')

  json_envelope "ok" "deploy" "$data"
}

###############################################################################
# Subcommand: resources — CPU/memory pressure
###############################################################################
cmd_resources() {
  # 1. Node resource usage
  local node_top
  node_top=$(safe_kc kc top nodes --no-headers 2>/dev/null) || node_top=""
  local node_resources="[]"
  if [[ -n "$node_top" ]]; then
    local node_arr="[]"
    while read -r n_name n_cpu n_cpu_pct n_mem n_mem_pct _; do
      [[ -z "$n_name" ]] && continue
      node_arr=$(jq -n --argjson arr "$node_arr" \
        --arg name "$n_name" --arg cpu_cores "$n_cpu" --arg cpu_pct "$n_cpu_pct" \
        --arg memory "$n_mem" --arg memory_pct "$n_mem_pct" \
        '$arr + [{name: $name, cpu_cores: $cpu_cores, cpu_pct: $cpu_pct, memory: $memory, memory_pct: $memory_pct}]')
    done <<< "$node_top"
    node_resources="$node_arr"
  fi

  # 2. Node conditions (MemoryPressure, DiskPressure, PIDPressure)
  local node_conditions
  node_conditions=$(safe_kc kc get nodes -o json | jq '[.items[] | {
    name: .metadata.name,
    pressure_conditions: [.status.conditions[] | select(
      (.type == "MemoryPressure" or .type == "DiskPressure" or .type == "PIDPressure") and .status == "True"
    ) | {type: .type, message: .message}]
  } | select(.pressure_conditions | length > 0)]')

  # 3. Top pods by CPU
  local pod_top_cpu
  pod_top_cpu=$(safe_kc kc_all top pods --sort-by=cpu --no-headers 2>/dev/null | head -20) || pod_top_cpu=""
  local top_pods_cpu="[]"
  if [[ -n "$pod_top_cpu" ]]; then
    local cpu_arr="[]"
    while read -r f1 f2 f3 f4 _; do
      [[ -z "$f1" ]] && continue
      if [[ -n "$f4" ]]; then
        # 4+ fields: namespace name cpu memory
        cpu_arr=$(jq -n --argjson arr "$cpu_arr" \
          --arg ns "$f1" --arg name "$f2" --arg cpu "$f3" --arg memory "$f4" \
          '$arr + [{namespace: $ns, name: $name, cpu: $cpu, memory: $memory}]')
      else
        # 3 fields: name cpu memory (no namespace column)
        cpu_arr=$(jq -n --argjson arr "$cpu_arr" \
          --arg ns "default" --arg name "$f1" --arg cpu "$f2" --arg memory "$f3" \
          '$arr + [{namespace: $ns, name: $name, cpu: $cpu, memory: $memory}]')
      fi
    done <<< "$pod_top_cpu"
    top_pods_cpu="$cpu_arr"
  fi

  # 4. Top pods by memory
  local pod_top_mem
  pod_top_mem=$(safe_kc kc_all top pods --sort-by=memory --no-headers 2>/dev/null | head -20) || pod_top_mem=""
  local top_pods_memory="[]"
  if [[ -n "$pod_top_mem" ]]; then
    local mem_arr="[]"
    while read -r f1 f2 f3 f4 _; do
      [[ -z "$f1" ]] && continue
      if [[ -n "$f4" ]]; then
        mem_arr=$(jq -n --argjson arr "$mem_arr" \
          --arg ns "$f1" --arg name "$f2" --arg cpu "$f3" --arg memory "$f4" \
          '$arr + [{namespace: $ns, name: $name, cpu: $cpu, memory: $memory}]')
      else
        mem_arr=$(jq -n --argjson arr "$mem_arr" \
          --arg ns "default" --arg name "$f1" --arg cpu "$f2" --arg memory "$f3" \
          '$arr + [{namespace: $ns, name: $name, cpu: $cpu, memory: $memory}]')
      fi
    done <<< "$pod_top_mem"
    top_pods_memory="$mem_arr"
  fi

  # 5. Pods near limits (requests vs limits analysis)
  local limit_analysis
  limit_analysis=$(safe_kc kc_all get pods -o json | jq '[.items[] | select(.status.phase == "Running") | {
    name: .metadata.name,
    namespace: .metadata.namespace,
    containers: [.spec.containers[] | {
      name: .name,
      requests: (.resources.requests // {}),
      limits: (.resources.limits // {}),
      no_limits: ((.resources.limits // {}) == {}),
      no_requests: ((.resources.requests // {}) == {})
    }]
  } | select(.containers | any(.no_limits or .no_requests))] | .[0:30]')

  local data
  data=$(jq -n \
    --argjson node_resources "$node_resources" \
    --argjson node_conditions "$node_conditions" \
    --argjson top_cpu "$top_pods_cpu" \
    --argjson top_memory "$top_pods_memory" \
    --argjson missing_limits "$limit_analysis" \
    '{node_usage: $node_resources, node_pressure: $node_conditions, top_pods_by_cpu: $top_cpu, top_pods_by_memory: $top_memory, pods_missing_limits: $missing_limits}')

  json_envelope "ok" "resources" "$data"
}

###############################################################################
# Subcommand: events — Recent cluster events
###############################################################################
cmd_events() {
  # Optional namespace from subcommand args
  local ns="${SUBCOMMAND_ARGS[0]:-}"
  if [[ -n "$ns" && -z "$NAMESPACE" ]]; then
    NAMESPACE="$ns"
  fi

  local events_json
  events_json=$(safe_kc kc_all get events --sort-by='.lastTimestamp' -o json 2>/dev/null | jq --arg since "$SINCE" '{
    all_events: [.items[] | {
      namespace: .metadata.namespace,
      type: .type,
      reason: .reason,
      object_kind: .involvedObject.kind,
      object_name: .involvedObject.name,
      message: .message,
      count: .count,
      first_timestamp: .firstTimestamp,
      last_timestamp: .lastTimestamp,
      source: (.source.component // "")
    }] | sort_by(.last_timestamp) | reverse,
    summary: {
      total: ([.items[]] | length),
      warnings: ([.items[] | select(.type == "Warning")] | length),
      normals: ([.items[] | select(.type == "Normal")] | length),
      top_reasons: ([.items[] | .reason] | group_by(.) | map({reason: .[0], count: length}) | sort_by(.count) | reverse | .[0:10])
    }
  }') || events_json='{"all_events": [], "summary": {"total": 0, "warnings": 0, "normals": 0, "top_reasons": []}}'

  # Trim to last 100 events to manage output size
  events_json=$(echo "$events_json" | jq '.all_events = (.all_events | .[0:100])')

  json_envelope "ok" "events" "$events_json"
}

###############################################################################
# Subcommand: confirm-write — Execute a pre-approved write command
###############################################################################
cmd_confirm_write() {
  if [[ -z "$CONFIRM_WRITE" ]]; then
    err "No write command specified. Use --confirm-write '<command>'"
    exit 1
  fi

  # Reject any shell metacharacters — prevents injection entirely
  local _meta_re='[;|&$`(]'
  if [[ "$CONFIRM_WRITE" =~ $_meta_re ]]; then
    err "Shell metacharacters not allowed in commands."
    exit 1
  fi

  # Parse into array — no eval needed
  local cmd_parts
  read -ra cmd_parts <<< "$CONFIRM_WRITE"

  # Validate first word is kubectl
  if [[ "${cmd_parts[0]}" != "kubectl" ]]; then
    err "Only kubectl commands are allowed."
    exit 1
  fi

  # Validate the verb+resource combination against allowlist
  local verb="${cmd_parts[1]:-}"
  local resource="${cmd_parts[2]:-}"
  local allowed=false

  case "${verb} ${resource}" in
    "rollout undo"|"rollout restart") allowed=true ;;
    "scale "*)    allowed=true ;;
    "delete pod") allowed=true ;;
    "cordon "*)   allowed=true ;;
    "uncordon "*) allowed=true ;;
  esac

  if [[ "$allowed" != "true" ]]; then
    err "Write command not in allowlist. Permitted: rollout undo, rollout restart, scale, delete pod, cordon, uncordon"
    exit 1
  fi

  local output
  output=$("${cmd_parts[@]}" 2>&1) || true
  local data
  data=$(jq -n --arg cmd "$CONFIRM_WRITE" --arg output "$output" '{command_executed: $cmd, output: $output}')
  json_envelope "ok" "write" "$data"
}

###############################################################################
# Main dispatch
###############################################################################
main() {
  parse_global_args "$@"

  # Handle --confirm-write as a standalone operation
  if [[ -n "$CONFIRM_WRITE" ]]; then
    preflight
    cmd_confirm_write
    exit 0
  fi

  if [[ -z "$SUBCOMMAND" ]]; then
    usage
  fi

  preflight

  case "$SUBCOMMAND" in
    sweep)     cmd_sweep ;;
    pod)       cmd_pod ;;
    deploy)    cmd_deploy ;;
    resources) cmd_resources ;;
    events)    cmd_events ;;
    *)
      err "Unknown subcommand: $SUBCOMMAND. Run with --help for usage."
      exit 1
      ;;
  esac
}

main "$@"
