# OpenOcta 构建
# 构建顺序：前端 -> 复制 embed 资源 -> 后端

.PHONY: ui embed go build clean release snapshot docker run run-ui

# 构建前端（输出到 src/embed/frontend）
ui:
	cd ui && npm install && npm run build

# 复制 config-schema、openocta.json.example、.env 到 embed 目录
embed: ui
	cp src/config-schema.json src/openocta.json.example src/.env src/embed/

# 构建 Go 二进制（需先执行 embed）
go: embed
	cd src && go build -ldflags "-s -w" -o ../openocta ./cmd/openocta

# 完整构建（默认）
build: go

# 清理
clean:
	rm -rf dist src/embed/frontend src/embed/config-schema.json src/embed/openocta.json.example openocta openocta.exe

# GoReleaser 快照构建（不发布）
snapshot:
	goreleaser release --snapshot --clean --skip=publish

# GoReleaser 正式发布
release:
	goreleaser release --clean

# 本地 Docker 构建（使用 deploy/Dockerfile 多阶段构建）
docker:
	docker build -f deploy/Dockerfile -t openocta:local .

# 开发：构建并启动 Gateway（端口 18900）
run: build
	./openocta gateway run

# 开发：仅启动前端开发服务器（端口 5173，需另行启动 Gateway）
run-ui:
	cd ui && npm run dev
