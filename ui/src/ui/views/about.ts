import { html, nothing } from "lit";
import { icons } from "../icons.ts";
import { UNIX_OPENOCTA_WORKSPACE, WIN_OPENOCTA_APPDATA, WIN_OPENOCTA_WORKSPACE } from "../platform-paths.ts";

export type AboutUninstallMode = "program" | "full";

export type AboutViewProps = {
  basePath: string;
  clearWorkspaceLoading: boolean;
  clearWorkspaceError: string | null;
  onClearWorkspace: () => void | Promise<void>;
  uninstallModalOpen: boolean;
  uninstallMode: AboutUninstallMode;
  uninstallLoading: boolean;
  uninstallError: string | null;
  onOpenUninstallModal: () => void;
  onCloseUninstallModal: () => void;
  onUninstallModeChange: (mode: AboutUninstallMode) => void;
  onConfirmUninstall: () => void | Promise<void>;
};

export function renderAbout(props: AboutViewProps) {
  const imgSrc = props.basePath ? `${props.basePath}/wechat.png` : "/wechat.png";

  return html`
    <div class="card">
      <div class="card-title">邮箱</div>
      <div class="card-sub">OpenOcta官方邮箱</div>
      <a href="mailto:sales@databuff.com" style="display:inline-flex;margin-top:20px;">sales@databuff.com</a>
    </div>

    <div class="card">
      <div class="card-title">微信小助手</div>
      <div class="card-sub">微信扫码添加小助手，加入交流群</div>
      <img style="display:block;margin-top:20px;" src=${imgSrc} width="200" height="200" alt="OpenOcta 微信群二维码" loading="lazy" />
    </div>

    <div class="card">
      <div class="card-title">版权声明</div>
      <p>本仓库遵循 <strong>GPLv3</strong> 开源限制。</p>
      <p>你可以基于 OpenOcta 的源代码进行二次开发，但是需要遵守以下规定：</p>
      <ul class="about-list">
        <li>不能替换和修改 OpenOcta 的 Logo 和版权信息；</li>
        <li>二次开发后的衍生作品必须遵守 GPLv3 的开源义务。</li>
      </ul>
      <p>如需商业授权，请联系：<strong>sales@databuff.com</strong>。</p>
    </div>

    <div class="card">
      <div class="card-title">清理文稿与数据</div>
      <p class="muted">
        删除<strong>默认工作区</strong>目录下的全部文件与文件夹（通常为
        <code>${UNIX_OPENOCTA_WORKSPACE}</code>；Windows 为 <code>${WIN_OPENOCTA_WORKSPACE}</code>）。不会删除配置文件与其它状态目录内容。
      </p>
      ${props.clearWorkspaceError
        ? html`<p class="about-uninstall-api-error" role="alert">${props.clearWorkspaceError}</p>`
        : nothing}
      <button
        type="button"
        class="btn btn--danger-outline"
        ?disabled=${props.clearWorkspaceLoading}
        @click=${props.onClearWorkspace}
      >
        <span class="btn__icon" aria-hidden="true">${icons.folder}</span>
        ${props.clearWorkspaceLoading ? html`<span>正在清理…</span>` : html`<span>清理文稿与数据</span>`}
      </button>
    </div>

    <div class="card">
      <div class="card-title">卸载 OpenOcta</div>
      <p class="muted">
        在桌面应用或本机已连接网关时，可选择仅删除程序或一并清除本地数据目录。操作将安排在数秒后执行；桌面版在确认成功后会自动退出应用，请先保存工作。
      </p>
      <button type="button" class="btn btn--danger-outline" @click=${props.onOpenUninstallModal}>
        <span class="btn__icon" aria-hidden="true">${icons.trash}</span>
        卸载 OpenOcta
      </button>
    </div>

      ${props.uninstallModalOpen
        ? html`
            <div
              class="modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="about-uninstall-title"
              @click=${props.onCloseUninstallModal}
            >
              <div class="modal card about-uninstall-modal" @click=${(e: Event) => e.stopPropagation()}>
                <h3 id="about-uninstall-title" class="modal__title">卸载 OpenOcta</h3>
                <p class="muted small">
                  请确认已配置正确的 <strong>Gateway URL</strong> 与 <strong>Token</strong>（与 Overview 一致）。卸载任务在进程退出后由系统脚本删除文件。
                </p>

                <fieldset class="about-uninstall-fieldset">
                  <legend class="visually-hidden">卸载方式</legend>

                  <div class="about-uninstall-options">
                    <div
                      class="about-uninstall-card ${props.uninstallMode === "program" ? "about-uninstall-card--selected" : ""}"
                    >
                      <label class="about-uninstall-mode-label">
                        <span class="radio"><input
                          type="radio"
                          name="oo-uninstall-mode"
                          value="program"
                          ?checked=${props.uninstallMode === "program"}
                          ?disabled=${props.uninstallLoading}
                          @change=${() => props.onUninstallModeChange("program")}
                        /></span>
                        <span class="about-uninstall-mode-title">仅卸载程序</span>
                      </label>
                      <p>
                        删除已安装的应用（例如 macOS 下的 <code>OpenOcta.app</code>，Windows 下安装目录中的程序文件）。
                      </p>
                      <p class="about-uninstall-note">
                        <strong>不会删除</strong>本地配置与数据目录（默认 <code>~/.openocta</code>，Windows 为
                        <code>${WIN_OPENOCTA_APPDATA}</code> 等）。
                      </p>
                    </div>

                    <div
                      class="about-uninstall-card about-uninstall-card--warn ${props.uninstallMode === "full"
                        ? "about-uninstall-card--selected"
                        : ""}"
                    >
                      <label class="about-uninstall-mode-label">
                        <span class="radio"><input
                          type="radio"
                          name="oo-uninstall-mode"
                          value="full"
                          ?checked=${props.uninstallMode === "full"}
                          ?disabled=${props.uninstallLoading}
                          @change=${() => props.onUninstallModeChange("full")}
                        /></span>
                        <span class="about-uninstall-mode-title">全部卸载</span>
                      </label>
                      <p>删除应用程序<strong>以及</strong>本地状态目录（配置、会话、日志、缓存等）。</p>
                      <p class="about-uninstall-note danger">
                        此操作<strong>不可恢复</strong>，请确认已备份重要数据。
                      </p>
                    </div>
                  </div>
                </fieldset>

                ${props.uninstallError
                  ? html`<p class="about-uninstall-api-error" role="alert">${props.uninstallError}</p>`
                  : nothing}

                <div class="modal__actions">
                  <button
                    type="button"
                    class="btn"
                    ?disabled=${props.uninstallLoading}
                    @click=${props.onCloseUninstallModal}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="btn btn--danger-outline"
                    ?disabled=${props.uninstallLoading}
                    @click=${props.onConfirmUninstall}
                  >
                    ${props.uninstallLoading ? html`<span>正在请求…</span>` : html`<span>确认卸载</span>`}
                  </button>
                </div>
              </div>
            </div>
          `
        : nothing}
  `;
}
