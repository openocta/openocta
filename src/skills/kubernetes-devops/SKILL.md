---
model: fast
description: |
  WHAT: Kubernetes manifest generation - Deployments, StatefulSets, CronJobs, Services, Ingresses, 
  ConfigMaps, Secrets, and PVCs with production-grade security and health checks.
  
  WHEN: User needs to create K8s manifests, deploy containers, configure Services/Ingress, 
  manage ConfigMaps/Secrets, set up persistent storage, or organize multi-environment configs.
  
  KEYWORDS: kubernetes, k8s, manifest, deployment, statefulset, cronjob, service, ingress, 
  configmap, secret, pvc, pod, container, yaml, kustomize, helm, namespace, probe, security context
version: 1.0.0
---

# Kubernetes

Production-ready Kubernetes manifest generation covering Deployments, StatefulSets,
CronJobs, Services, Ingresses, ConfigMaps, Secrets, and PVCs with security contexts,
health checks, and resource management.


## Installation

### OpenOcta / Moltbot / Clawbot

```bash
npx clawhub@latest install kubernetes
```


## When to Use

| Scenario | Example |
|----------|---------|
| Create deployment manifests | New microservice needing Deployment + Service |
| Define networking resources | ClusterIP, LoadBalancer, Ingress with TLS |
| Manage configuration | ConfigMaps for app config, Secrets for credentials |
| Stateful workloads | Databases with StatefulSets + PVCs |
| Scheduled jobs | CronJobs for batch processing |
| Multi-environment setup | Kustomize overlays for dev/staging/prod |

## Workload Selection

| Workload Type | Resource | When to Use |
|---------------|----------|-------------|
| Stateless app | Deployment | Web servers, APIs, microservices |
| Stateful app | StatefulSet | Databases, message queues, caches |
| One-off task | Job | Migrations, data imports |
| Scheduled task | CronJob | Backups, reports, cleanup |
| Per-node agent | DaemonSet | Log collectors, monitoring agents |

## Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/component: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: my-app
  template:
    metadata:
      labels:
        app.kubernetes.io/name: my-app
        app.kubernetes.io/version: "1.0.0"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: my-app
          image: registry.example.com/my-app:1.0.0
          ports:
            - containerPort: 8080
              name: http
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: my-app-config
                  key: LOG_LEVEL
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: my-app-secret
                  key: DATABASE_PASSWORD
```

## Services

### ClusterIP (Internal)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: production
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: my-app
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
```

### LoadBalancer (External)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-lb
  namespace: production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  type: LoadBalancer
  selector:
    app.kubernetes.io/name: my-app
  ports:
    - name: http
      port: 80
      targetPort: 8080
```

### Service Type Quick Reference

| Type | Scope | Use Case |
|------|-------|----------|
| ClusterIP | Cluster-internal | Inter-service communication |
| NodePort | External via node IP | Dev/testing, on-prem |
| LoadBalancer | External via cloud LB | Production external access |
| ExternalName | DNS alias | Mapping to external services |

## Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
    - hosts: [app.example.com]
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

## ConfigMap & Secret

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
  namespace: production
data:
  LOG_LEVEL: info
  APP_MODE: production
  DATABASE_HOST: db.internal.svc.cluster.local
  app.properties: |
    server.port=8080
    server.host=0.0.0.0
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-app-secret
  namespace: production
type: Opaque
stringData:
  DATABASE_PASSWORD: "changeme"
  API_KEY: "secret-api-key"
```

> **Important:** Never commit plaintext Secrets to Git. Use Sealed Secrets,
> External Secrets Operator, or Vault for production.

## Persistent Storage

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-app-data
  namespace: production
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: gp3
  resources:
    requests:
      storage: 10Gi
```

Mount in a container:

```yaml
containers:
  - name: app
    volumeMounts:
      - name: data
        mountPath: /var/lib/app
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: my-app-data
```

| Access Mode | Abbreviation | Use Case |
|-------------|-------------|----------|
| ReadWriteOnce | RWO | Single-pod databases |
| ReadOnlyMany | ROX | Shared config/static assets |
| ReadWriteMany | RWX | Multi-pod shared storage |

## Security Context

### Pod-Level

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
```

### Container-Level

```yaml
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: [ALL]
```

### Security Checklist

| Check | Status |
|-------|--------|
| `runAsNonRoot: true` | Required |
| `allowPrivilegeEscalation: false` | Required |
| `readOnlyRootFilesystem: true` | Recommended |
| `capabilities.drop: [ALL]` | Required |
| `seccompProfile: RuntimeDefault` | Recommended |
| Specific image tags (never `:latest`) | Required |
| Resource requests and limits set | Required |

## Standard Labels

```yaml
metadata:
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/instance: my-app-prod
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/component: backend
    app.kubernetes.io/part-of: my-system
    app.kubernetes.io/managed-by: kubectl
```

## Manifest Organization

### Option 1 — Separate Files

```
manifests/
├── configmap.yaml
├── secret.yaml
├── deployment.yaml
├── service.yaml
└── pvc.yaml
```

### Option 2 — Kustomize

```
base/
├── kustomization.yaml
├── deployment.yaml
├── service.yaml
└── configmap.yaml
overlays/
├── dev/
│   └── kustomization.yaml
└── prod/
    ├── kustomization.yaml
    └── resource-patch.yaml
```

## Validation

```bash
# Client-side dry run
kubectl apply -f manifest.yaml --dry-run=client

# Server-side validation
kubectl apply -f manifest.yaml --dry-run=server

# Lint with kube-score
kube-score score manifest.yaml

# Lint with kube-linter
kube-linter lint manifest.yaml
```

## Troubleshooting Quick Reference

| Problem | Diagnosis | Fix |
|---------|-----------|-----|
| Pod stuck `Pending` | `kubectl describe pod` — check events | Fix resource requests, node capacity, PVC binding |
| `ImagePullBackOff` | Wrong image name/tag or missing pull secret | Verify image exists, add `imagePullSecrets` |
| `CrashLoopBackOff` | App crashes on start | Check logs: `kubectl logs <pod> --previous` |
| Service not reachable | Selector mismatch | Verify `kubectl get endpoints <svc>` is non-empty |
| ConfigMap not loading | Name mismatch or wrong namespace | Check names match and namespace is correct |
| Readiness probe failing | Wrong path or port | Verify health endpoint works inside container |
| OOMKilled | Memory limit too low | Increase `resources.limits.memory` |

## NEVER Do

| Anti-Pattern | Why | Do Instead |
|-------------|-----|------------|
| Use `:latest` image tag | Non-reproducible deployments | Pin exact version: `image:1.2.3` |
| Skip resource limits | Pods can starve the node | Always set `requests` and `limits` |
| Run as root | Container escape = full host access | Set `runAsNonRoot: true` + `USER` |
| Commit plaintext Secrets | Credentials in Git history forever | Use Sealed Secrets / External Secrets / Vault |
| Skip health checks | K8s can't detect unhealthy pods | Always configure liveness + readiness probes |
| Omit labels | Cannot filter, select, or organize | Use standard `app.kubernetes.io/*` labels |
| Single replica for production | Zero availability during updates | Use `replicas: 3` minimum for HA |
| Hardcode config in containers | Requires rebuild for config changes | Use ConfigMaps and Secrets |

## Assets & References

### Assets (Templates)

| Template | Description |
|----------|-------------|
| [assets/deployment-template.yaml](assets/deployment-template.yaml) | Production Deployment with security + probes |
| [assets/service-template.yaml](assets/service-template.yaml) | ClusterIP, LoadBalancer, NodePort examples |
| [assets/configmap-template.yaml](assets/configmap-template.yaml) | ConfigMap with data types |
| [assets/statefulset-template.yaml](assets/statefulset-template.yaml) | StatefulSet with headless Service + PVC |
| [assets/cronjob-template.yaml](assets/cronjob-template.yaml) | CronJob with concurrency + history |
| [assets/ingress-template.yaml](assets/ingress-template.yaml) | Ingress with TLS, rate limiting, CORS |

### References

| Reference | Description |
|-----------|-------------|
| [references/deployment-spec.md](references/deployment-spec.md) | Detailed Deployment specification |
| [references/service-spec.md](references/service-spec.md) | Service types and networking details |
