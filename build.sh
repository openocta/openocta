#!/bin/bash
# OpenOcta 构建脚本
# 用法: ./build.sh [ui|embed|go|build|clean|snapshot|release|docker|wails|wails-dmg|wails-dmg-signed|wails-nsis]
# 默认: build（完整构建）

set -e
cd "$(dirname "$0")"

do_ui() {
  echo "==> 构建前端..."
  cd ui && npm install && npm run build && cd ..
}

do_embed() {
  echo "==> 从 git tag 设置版本..."
  ./scripts/set-version.sh
  do_ui
  echo "==> 复制 embed 资源..."
  for f in src/config-schema.json src/openocta.json.example src/.env; do
    if [ -f "$f" ]; then
      cp "$f" src/embed/
    fi
  done
}

do_go() {
  do_embed
  echo "==> 构建 Go 二进制..."
  cd src && go build -ldflags "-s -w" -o ../openocta ./cmd/openocta && cd ..
  echo "==> 完成: ./openocta"
}

do_build() {
  do_go
}

do_clean() {
  echo "==> 清理..."
  # 与 Makefile clean 对齐：embed 产物、Go 二进制、Wails 输出；根目录 build/ 为历史遗留副本，一并删除
  rm -rf \
    dist \
    build \
    src/embed/frontend \
    src/embed/config-schema.json \
    src/embed/openocta.json.example \
    src/build/bin \
    openocta \
    openocta.exe \
    openocta-launcher \
    openocta-launcher.exe
  echo "==> 清理完成"
}

do_snapshot() {
  echo "==> GoReleaser 快照构建..."
  goreleaser release --snapshot --clean --skip=publish
  do_after
}

do_release() {
  echo "==> GoReleaser 正式发布..."
  goreleaser release --clean
  do_after
}

do_docker() {
  echo "==> Docker 构建..."
  docker build -f deploy/Dockerfile -t openocta:local .
}

do_after() {
  cp deploy/dist-README.md dist/
  echo "==> 构建完成"
}

do_wails() {
  echo "==> Wails 桌面应用构建（当前平台）..."
  make wails
  if [[ -d src/build/bin ]]; then
    mkdir -p dist
    cp -R src/build/bin/* dist/ 2>/dev/null || true
    echo "==> 产物已复制到 dist/"
  fi
}

do_wails_dmg() {
  echo "==> Wails macOS DMG 打包..."
  make wails-dmg
}

do_wails_dmg_signed() {
  echo "==> Wails macOS DMG（gon 签名/公证）打包..."
  make wails-dmg-signed
}

# 解析存有 makensis.exe 的目录（Unix 风格路径，如 /c/Program Files (x86)/NSIS）；找不到返回 1。
# 不重写当前 shell 的 PATH，避免破坏 Git Bash 下后续 make/npm 所需的冒号 PATH。
resolve_nsis_parent() {
  local nsis_parent="" d
  if command -v makensis >/dev/null 2>&1; then
    nsis_parent="$(dirname "$(command -v makensis)")"
  fi
  if [[ -z "$nsis_parent" ]] || [[ ! -f "$nsis_parent/makensis.exe" ]]; then
    nsis_parent=""
    for d in \
      "/c/Program Files (x86)/NSIS" \
      "/c/Program Files/NSIS" \
      "/c/Program Files (x86)/NSIS/Bin" \
      "/c/NSIS" \
      "/c/ProgramData/chocolatey/lib/nsis/tools/NSIS" \
      "/c/ProgramData/chocolatey/lib/nsis/tools/nsis"
    do
      if [[ -f "$d/makensis.exe" ]]; then
        nsis_parent="$d"
        break
      fi
    done
  fi
  if [[ -z "$nsis_parent" ]]; then
    return 1
  fi
  printf '%s' "$nsis_parent"
  return 0
}

# Wails 为 Windows 原生进程，LookPath 只认分号分隔的 Win32 PATH；仅对 wails 子进程注入转换后的 PATH。
run_wails_build_nsis() {
  local nsis_root="$1"
  local _u
  _u="$(uname -s 2>/dev/null || true)"
  if command -v cygpath >/dev/null 2>&1; then
    case "$_u" in
      *MINGW*|*MSYS*|*CYGWIN*)
        local wroot wpath
        wroot="$(cygpath -w "$nsis_root")"
        wpath="$(cygpath -p -w "$PATH" 2>/dev/null || true)"
        if [[ -n "$wpath" ]]; then
          (cd src && env PATH="${wroot};${wpath}" wails build -platform windows/amd64 -nsis -skipbindings)
        else
          (cd src && env PATH="${wroot}" wails build -platform windows/amd64 -nsis -skipbindings)
        fi
        return $?
        ;;
    esac
  fi
  (cd src && env PATH="${nsis_root}:$PATH" wails build -platform windows/amd64 -nsis -skipbindings)
}

do_wails_nsis() {
  echo "==> Wails Windows 安装器构建（需在 Windows 上执行）..."
  local _u
  _u="$(uname -s 2>/dev/null || true)"
  if [[ "$_u" != *MINGW* ]] && [[ "$_u" != *MSYS* ]] && [[ "$_u" != *CYGWIN* ]]; then
    case "$_u" in
      Linux|Darwin)
        echo "ERROR: wails-nsis 应在 Windows（Git Bash / MSYS2）下执行；Wails 无法在本机构建 Windows 桌面包。"
        exit 1
        ;;
    esac
  fi
  local nsis_root
  nsis_root="$(resolve_nsis_parent)" || {
    echo "ERROR: 未找到 NSIS 的 makensis.exe。Wails 会跳过安装包，仅生成 OpenOcta.exe。"
    echo "       请安装 NSIS: https://nsis.sourceforge.io/Download"
    echo "       并确认存在: \"C:\\Program Files (x86)\\NSIS\\makensis.exe\"（或对应安装路径）。"
    exit 1
  }
  echo "==> NSIS 目录: $nsis_root（仅为 Wails 子进程设置 Win32 PATH）"
  make embed
  make prepare-wails-icons
  run_wails_build_nsis "$nsis_root" || exit 1
  shopt -s nullglob
  local -a installers
  installers=(src/build/bin/*-installer.exe)
  shopt -u nullglob
  if [[ ${#installers[@]} -eq 0 ]]; then
    echo "ERROR: 未生成 src/build/bin/*-installer.exe。"
    echo "       请查看 Wails 日志中 NSIS / makensis 相关报错。"
    exit 1
  fi
  mkdir -p dist
  cp src/build/bin/*.exe dist/ 2>/dev/null || true
  echo "==> 安装器: ${installers[0]}"
  echo "==> 已复制 .exe 到 dist/"
}

case "${1:-build}" in
  ui)     do_ui ;;
  embed)  do_embed ;;
  go)     do_go ;;
  build)  do_build ;;
  clean)  do_clean ;;
  snapshot) do_snapshot ;;
  release) do_release ;;
  docker) do_docker ;;
  wails) do_wails ;;
  wails-dmg) do_wails_dmg ;;
  wails-dmg-signed) do_wails_dmg_signed ;;
  wails-nsis) do_wails_nsis ;;
  *)
    echo "用法: $0 [ui|embed|go|build|clean|snapshot|release|docker|wails|wails-dmg|wails-dmg-signed|wails-nsis]"
    echo "  ui       - 仅构建前端"
    echo "  embed    - 构建前端并复制 embed 资源"
    echo "  go       - 完整构建（前端+embed+Go）"
    echo "  build    - 同 go（默认）"
    echo "  clean    - 清理构建产物"
    echo "  snapshot   - GoReleaser 快照（Linux rpm/deb）"
    echo "  release    - GoReleaser 正式发布"
    echo "  docker     - Docker 镜像构建"
    echo "  wails      - Wails 桌面应用（macOS .app / Windows .exe）"
    echo "  wails-dmg  - macOS .dmg（不签名/不公证）"
    echo "  wails-dmg-signed - macOS .dmg（gon 签名/公证；需 AC_USERNAME/AC_PASSWORD/AC_TEAM_ID）"
    echo "  wails-nsis - Wails Windows 安装器（需在 Windows 上执行）"
    exit 1
    ;;
esac
