## OpenOcta 安装与快速访问指南

本文件位于打包产物的 `dist/README.md`，用于快速了解不同操作系统下如何安装、启动和访问 OpenOcta。

详细配置说明请参考归档中 `docs/` 目录下的文档，尤其是：

- `docs/configuration.md`：完整配置说明
- `docs/channels*.md`：各渠道配置
- `docs/tools*.md`：工具与集成

---

## 一、发行产物说明

在 `dist/` 目录中，你通常会看到：

- `openocta_<version>_<os>_<arch>.tar.gz`：Linux / macOS 压缩包
- `openocta_<version>_<os>_<arch>.zip`：Windows 压缩包
- `openocta_<version>_<os>_<arch>.deb`：Debian / Ubuntu 安装包
- `openocta_<version>_<os>_<arch>.rpm`：RHEL / CentOS / Fedora 安装包
- `openocta-docs_<version>.tar.gz`：仅包含文档的压缩包（`docs/`）

每个平台压缩包中都包含：

- `openocta` 或 `openocta.exe` 可执行文件
- `docs/` 目录：与 `src/docs` 同步的说明文档

---

## 二、Linux 安装与启动

### 1. 使用 .deb / .rpm 安装（推荐生产环境）

1. 安装包：
   - Debian / Ubuntu：
     - `sudo dpkg -i openocta_<version>_linux_amd64.deb`
   - RHEL / CentOS / Fedora：
     - `sudo rpm -ivh openocta_<version>_linux_amd64.rpm`
2. 安装后，systemd 服务会注册为 `openocta`，服务文件大致如下：
   - `/lib/systemd/system/openocta.service`
3. 启动并设置开机自启：
   - `sudo systemctl daemon-reload`
   - `sudo systemctl enable openocta`
   - `sudo systemctl start openocta`
4. 默认监听端口见配置文档（通常为 `gateway.port`，例如 18900）：
   - 在浏览器中访问 `http://<服务器IP>:<端口>` 即可。

### 2. 使用 tar.gz 手动运行（开发 / 测试）

1. 解压：
   - `tar -xzf openocta_<version>_linux_amd64.tar.gz`
2. 进入目录并运行：
   - `cd openocta_<version>_linux_amd64`
   - `chmod +x ./openocta`
   - `./openocta gateway run`
3. 终端会输出实际监听地址和端口，在浏览器中打开该地址即可快速访问。

---

## 三、macOS 安装与启动

1. 解压：
   - `tar -xzf openocta_<version>_darwin_amd64.tar.gz` 或 `openocta_<version>_darwin_arm64.tar.gz`
2. 进入目录并运行：
   - `cd openocta_<version>_darwin_<arch>`
   - `chmod +x ./openocta`
   - `./openocta gateway run`
3. 如果遇到「来自未验证开发者」提示，可在「系统设置 → 隐私与安全性」中允许该二进制运行。
4. 启动成功后，终端会输出访问地址，在浏览器中打开即可。

如需持久化运行，可自行编写 LaunchAgent/LaunchDaemon，ExecStart 命令与 `openocta.service` 类似：

- `openocta gateway run --port 18900`

---

## 四、Windows 安装与启动

1. 解压：
   - 使用资源管理器或 PowerShell：
     - `Expand-Archive .\openocta_<version>_windows_amd64.zip`
2. 启动：
   - 在解压目录中双击 `openocta.exe`，或在 PowerShell 中运行：
     - `.\openocta.exe gateway run`
3. 命令行窗口会打印启动日志和访问地址，在浏览器中打开该地址即可。

如需后台运行，可：

- 使用 NSSM / 服务管理工具将 `openocta.exe gateway run` 注册为 Windows 服务；
- 或在计划任务中以登录时自动启动的方式运行。

---

## 五、首次配置与快速上手

1. 默认配置文件路径：
   - `~/.openocta/openocta.json`
2. 建议：
   - 参考 `docs/configuration.md` 中的「快速开始」部分，复制示例 JSON 到 `~/.openocta/openocta.json`
   - 配置至少一个 `agent` 和一个 `channel`（例如 WhatsApp / Telegram / Slack 等）
3. 重启或重新运行 `openocta gateway run` 后生效。

更多细节请阅读归档中的 `docs/` 文档或访问在线文档站点。

