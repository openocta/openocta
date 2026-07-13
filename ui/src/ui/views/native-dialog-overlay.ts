import { html, nothing } from "lit";
import { t } from "../strings.js";

export type NativeDialogModel =
  | null
  | { kind: "confirm"; message: string }
  | { kind: "alert"; message: string }
  | { kind: "prompt"; message: string; defaultValue: string };

export function renderNativeDialogOverlay(params: {
  model: NativeDialogModel;
  promptValue: string;
  onPromptInput: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { model, promptValue, onPromptInput, onConfirm, onCancel } = params;
  if (!model) {
    return nothing;
  }
  const isPrompt = model.kind === "prompt";
  return html`
    <div
      class="channel-panel-overlay channel-panel-overlay--centered"
      style="z-index: 10000;"
      role="dialog"
      aria-modal="true"
      aria-labelledby="native-dialog-title"
      @click=${(e: Event) => {
        const el = e.target as HTMLElement;
        if (el.classList.contains("channel-panel-overlay")) {
          if (model.kind === "alert") {
            onConfirm();
          } else {
            onCancel();
          }
        }
      }}
    >
      <div class="card channel-panel" style="max-width: 420px; width: 92%;" @click=${(e: Event) => e.stopPropagation()}>
        <div class="card-title" id="native-dialog-title" style="margin-bottom: 12px; white-space: pre-line;">${model.message}</div>
        ${
          isPrompt
            ? html`
                <div class="field" style="margin-bottom: 14px;">
                  <span class="input" style="display: block;">
                    <input
                      type="text"
                      data-native-dialog-input
                      .value=${promptValue}
                      @input=${(e: Event) => onPromptInput((e.target as HTMLInputElement).value)}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onConfirm();
                        }
                      }}
                    />
                  </span>
                </div>
              `
            : nothing
        }
        <div class="row" style="justify-content: flex-end; gap: 8px; flex-wrap: wrap;">
          ${
            model.kind === "alert"
              ? html`
                  <button type="button" class="btn primary" @click=${onConfirm}>${t("nativeDialogOK")}</button>
                `
              : html`
                  <button type="button" class="btn" @click=${onCancel}>${t("commonCancel")}</button>
                  <button type="button" class="btn primary" @click=${onConfirm}>${t("nativeDialogOK")}</button>
                `
          }
        </div>
      </div>
    </div>
  `;
}
