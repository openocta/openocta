# OctopusClaw 前后端一体镜像（单一二进制，前端与配置已嵌入）
# 多阶段：1) 构建 Control UI  2) 构建 Go 二进制（含 embed） 3) 最终镜像

# ------------------------------------------------------------------------------
# Stage 1: 构建 Control UI（前端）
# ------------------------------------------------------------------------------
FROM node:22-alpine AS ui-builder
WORKDIR /app

COPY ui/package.json ui/package-lock.json* ui/pnpm-lock.yaml* ./ui/
RUN cd ui && (command -v pnpm >/dev/null && pnpm install) || (npm install -g pnpm && pnpm install) || npm install

COPY ui/ ./ui/
RUN cd ui && (command -v pnpm >/dev/null && pnpm build) || npm run build

# ------------------------------------------------------------------------------
# Stage 2: 构建 Go 二进制（后端，含嵌入前端与配置）
# ------------------------------------------------------------------------------
FROM golang:1.24-alpine AS go-builder
WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY src/go.mod src/go.sum ./
RUN go mod download

COPY src/ ./
# 从 Stage 1 复制前端构建产物（vite 输出到 ../src/embed/frontend，即 /app/src/embed/frontend）
COPY --from=ui-builder /app/src/embed/frontend ./embed/frontend
COPY src/config-schema.json src/openocta.json.example src/.env ./embed/

ARG VERSION=0.0.1-dev
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags "-s -w -X github.com/openocta/openocta/pkg/version.Version=${VERSION}" \
    -o /openocta ./cmd/openocta

# ------------------------------------------------------------------------------
# Stage 3: 最终运行镜像（单一二进制）
# ------------------------------------------------------------------------------
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata

COPY --from=go-builder /openocta /usr/local/bin/openocta

ENV OPENOCTA_STATE_DIR=/root/.openocta

EXPOSE 18900

ENTRYPOINT ["openocta"]
CMD ["gateway", "run", "--port", "18900"]
