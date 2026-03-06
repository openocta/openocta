import { html, nothing } from "lit";
import { t } from "../strings.js";
import { BUILTIN_PROVIDERS, formatModelRef, parseModelRef } from "./models-builtin.ts";

export type ModelProvider = {
  baseUrl?: string;
  apiKey?: string;
  apiKeyPrefix?: string;
  auth?: string;
  api?: string;
  headers?: Record<string, string>;
  displayName?: string;
  envVars?: Record<string, string>;
  models?: Array<{ id: string; name?: string }>;
};

export type AddProviderForm = {
  providerId: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  apiKeyPrefix: string;
};

export type AddModelForm = {
  modelId: string;
  modelName: string;
};

export type ModelsProps = {
  providers: Record<string, ModelProvider>;
  modelEnv: Record<string, Record<string, string>>; // key: "provider/modelId"
  defaultModelRef: string | null;
  loading: boolean;
  saving: boolean;
  selectedProvider: string | null;
  viewMode: "list" | "card";
  formDirty: boolean;
  addProviderModalOpen: boolean;
  addProviderForm: AddProviderForm;
  addModelModalOpen: boolean;
  addModelForm: AddModelForm;
  useModelModalOpen: boolean;
  useModelModalProvider: string | null;
  saveError: string | null;
  onRefresh: () => void;
  onAddProvider: () => void;
  onAddProviderModalClose: () => void;
  onAddProviderFormChange: (form: Partial<AddProviderForm>) => void;
  onAddProviderSubmit: () => void;
  onSelect: (key: string | null) => void;
  onViewModeChange: (mode: "list" | "card") => void;
  onPatch: (key: string, patch: Partial<ModelProvider>) => void;
  onAddModel: (providerKey: string) => void;
  onAddModelModalClose: () => void;
  onAddModelFormChange: (form: Partial<AddModelForm>) => void;
  onAddModelSubmit: (providerKey: string) => void;
  onRemoveModel: (providerKey: string, modelId: string) => void;
  onPatchModelEnv: (providerKey: string, modelId: string, envVars: Record<string, string>) => void;
  onSave: () => void;
  onCancel: () => void;
  onUseModelClick: (provider: string) => void;
  onUseModelModalClose: () => void;
  onUseModel: (provider: string, modelId: string) => void;
  onCancelUse: (provider: string) => void;
};

function getProviderDisplayName(providerKey: string, provider?: ModelProvider): string {
  const builtin = BUILTIN_PROVIDERS.find((p) => p.id === providerKey);
  if (builtin) return builtin.label;
  return provider?.displayName ?? providerKey;
}

function getModelsForProvider(providerKey: string, provider?: ModelProvider): Array<{ id: string; name?: string }> {
  const builtin = BUILTIN_PROVIDERS.find((p) => p.id === providerKey);
  const configured = provider?.models ?? [];
  if (configured.length > 0) return configured;
  if (builtin?.defaultModel) return [{ id: builtin.defaultModel, name: builtin.defaultModel }];
  return [];
}

export function renderModels(props: ModelsProps) {
  const current = parseModelRef(props.defaultModelRef);

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">${t("navTitleModels")}</div>
          <div class="card-sub">${t("subtitleModels")}</div>
        </div>
        <div class="row" style="gap: 8px; align-items: center;">
          <div class="row" style="gap: 4px;" title=${t("modelsViewList")}>
            <button
              type="button"
              class="btn ${props.viewMode === "list" ? "primary" : ""}"
              style="padding: 6px 10px;"
              @click=${() => props.onViewModeChange("list")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              class="btn ${props.viewMode === "card" ? "primary" : ""}"
              style="padding: 6px 10px;"
              @click=${() => props.onViewModeChange("card")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
          <button class="btn primary" ?disabled=${props.loading} @click=${props.onAddProvider}>
            ${t("modelsAddProvider")}
          </button>
          <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
            ${props.loading ? t("commonLoading") : t("commonRefresh")}
          </button>
        </div>
      </div>

      ${props.defaultModelRef
        ? html`
            <div class="callout" style="margin-top: 12px;">
              <strong>${t("modelsCurrentDefault")}:</strong> ${props.defaultModelRef}
            </div>
          `
        : nothing}

      <div class="models-provider-list" style="margin-top: 16px;">
        ${props.viewMode === "list"
          ? html`
              <div class="models-table table" style="margin-top: 0;">
                <div class="models-table-head table-head">
                  <div>${t("modelsTableName")}</div>
                  <div>${t("modelsTableModel")}</div>
                  <div>${t("modelsTableBaseUrl")}</div>
                  <div>${t("modelsTableActions")}</div>
                </div>
                ${BUILTIN_PROVIDERS.map((p) => {
                  const prov = props.providers?.[p.id];
                  const hasConfig = !!prov;
                  const modelId = hasConfig ? (prov?.models?.[0]?.id ?? p.defaultModel ?? "(需指定)") : null;
                  const canUse = hasConfig && modelId && modelId !== "(需指定)";
                  const isProviderCurrent = canUse && current?.provider === p.id;
                  return html`
                    <div
                      class="models-table-row table-row ${props.selectedProvider === p.id ? "list-item-selected" : ""}"
                      style="cursor: pointer;"
                      @click=${() => props.onSelect(props.selectedProvider === p.id ? null : p.id)}
                    >
                      <div class="models-table-cell" style="font-weight: 500;">
                        ${p.label}
                        ${isProviderCurrent ? html`<span class="muted" style="font-size: 12px;"> (${t("modelsCurrentDefault")})</span>` : nothing}
                      </div>
                      <div class="models-table-cell muted" style="font-size: 13px;">${hasConfig ? modelId : "-"}</div>
                      <div class="models-table-cell muted" style="font-size: 12px;">${prov?.baseUrl ?? p.baseUrl}</div>
                      <div class="models-table-cell row" style="gap: 6px; justify-content: flex-start;" @click=${(e: Event) => e.stopPropagation()}>
                        ${canUse
                          ? html`
                              <button
                                class="btn btn--sm ${isProviderCurrent ? "btn-ok" : "primary"}"
                                ?disabled=${props.saving}
                                @click=${(e: Event) => {
                                  e.stopPropagation();
                                  props.onUseModelClick(p.id);
                                }}
                              >
                                ${t("modelsUseAsDefault")}
                              </button>
                            `
                          : html`<button class="btn btn--sm" disabled>${t("modelsUseAsDefault")}</button>`}
                        <button
                          class="btn btn--sm"
                          ?disabled=${props.saving}
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            props.onSelect(props.selectedProvider === p.id ? null : p.id);
                          }}
                        >
                          ${t("channelsConfigure")}
                        </button>
                        ${hasConfig
                          ? html`
                              <button
                                class="btn btn--sm ${isProviderCurrent ? "btn-ok" : ""}"
                                ?disabled=${props.saving || !isProviderCurrent}
                                @click=${(e: Event) => {
                                  e.stopPropagation();
                                  props.onCancelUse(p.id);
                                }}
                              >
                                ${t("modelsCancelUse")}
                              </button>
                            `
                          : nothing}
                      </div>
                    </div>
                  `;
                })}
                ${Object.entries(props.providers ?? {})
                  .filter(([key]) => !BUILTIN_PROVIDERS.some((p) => p.id === key))
                  .map(
                    ([key, provider]) => {
                      const modelId = provider.models?.[0]?.id;
                      const canUse = !!modelId;
                      const isProviderCurrent = canUse && current?.provider === key;
                      return html`
                      <div
                        class="models-table-row table-row ${props.selectedProvider === key ? "list-item-selected" : ""}"
                        style="cursor: pointer;"
                        @click=${() => props.onSelect(props.selectedProvider === key ? null : key)}
                      >
                        <div class="models-table-cell" style="font-weight: 500;">${getProviderDisplayName(key, provider)}</div>
                        <div class="models-table-cell muted" style="font-size: 13px;">
                          ${canUse ? modelId : (provider.models?.length ?? 0) + " " + t("modelsModels")}
                        </div>
                        <div class="models-table-cell muted" style="font-size: 12px;">${provider.baseUrl ?? t("commonNA")}</div>
                        <div class="models-table-cell row" style="gap: 6px; justify-content: flex-start;" @click=${(e: Event) => e.stopPropagation()}>
                          ${canUse
                            ? html`
                                <button
                                  class="btn btn--sm ${isProviderCurrent ? "btn-ok" : "primary"}"
                                  ?disabled=${props.saving}
                                  @click=${(e: Event) => {
                                    e.stopPropagation();
                                    props.onUseModelClick(key);
                                  }}
                                >
                                  ${t("modelsUseAsDefault")}
                                </button>
                              `
                            : html`<button class="btn btn--sm" disabled>${t("modelsUseAsDefault")}</button>`}
                          <button
                            class="btn btn--sm"
                            ?disabled=${props.saving}
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              props.onSelect(props.selectedProvider === key ? null : key);
                            }}
                          >
                            ${t("channelsConfigure")}
                          </button>
                          <button
                            class="btn btn--sm ${isProviderCurrent ? "btn-ok" : ""}"
                            ?disabled=${props.saving || !isProviderCurrent}
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              props.onCancelUse(key);
                            }}
                          >
                            ${t("modelsCancelUse")}
                          </button>
                        </div>
                      </div>
                    `;
                    },
                  )}
              </div>
            `
          : html`
              <div class="models-card-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;">
                ${BUILTIN_PROVIDERS.map((p) => {
                  const prov = props.providers?.[p.id];
                  const hasConfig = !!prov;
                  const modelId = hasConfig ? (prov?.models?.[0]?.id ?? p.defaultModel ?? "(需指定)") : null;
                  const canUse = hasConfig && modelId && modelId !== "(需指定)";
                  const isProviderCurrent = canUse && current?.provider === p.id;
                  return html`
                    <div
                      class="models-provider-card ${props.selectedProvider === p.id ? "list-item-selected" : ""}"
                      style="cursor: pointer;"
                      @click=${() => props.onSelect(props.selectedProvider === p.id ? null : p.id)}
                    >
                      <div class="models-provider-card__header">
                        <div class="models-provider-card__icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                          </svg>
                        </div>
                        <div class="models-provider-card__title-row" style="min-width: 0;">
                          <span class="models-provider-card__name">${p.label}</span>
                          ${hasConfig ? html`<span class="chip" style="font-size: 11px;">${modelId}</span>` : nothing}
                        </div>
                      </div>
                      <div class="models-provider-card__meta muted" style="font-size: 12px;">${prov?.baseUrl ?? p.baseUrl}</div>
                      <div class="models-provider-card__footer" @click=${(e: Event) => e.stopPropagation()}>
                        ${canUse
                          ? html`
                              <button
                                class="btn btn--sm ${isProviderCurrent ? "btn-ok" : "primary"}"
                                ?disabled=${props.saving}
                                @click=${(e: Event) => {
                                  e.stopPropagation();
                                  props.onUseModelClick(p.id);
                                }}
                              >
                                ${t("modelsUseAsDefault")}
                              </button>
                            `
                          : html`<button class="btn btn--sm" disabled>${t("modelsUseAsDefault")}</button>`}
                        <button
                          class="btn btn--sm"
                          ?disabled=${props.saving}
                          @click=${(e: Event) => {
                            e.stopPropagation();
                            props.onSelect(props.selectedProvider === p.id ? null : p.id);
                          }}
                        >
                          ${t("channelsConfigure")}
                        </button>
                        ${hasConfig
                          ? html`
                              <button
                                class="btn btn--sm ${isProviderCurrent ? "btn-ok" : ""}"
                                ?disabled=${props.saving || !isProviderCurrent}
                                @click=${(e: Event) => {
                                  e.stopPropagation();
                                  props.onCancelUse(p.id);
                                }}
                              >
                                ${t("modelsCancelUse")}
                              </button>
                            `
                          : nothing}
                      </div>
                    </div>
                  `;
                })}
                ${Object.entries(props.providers ?? {})
                  .filter(([key]) => !BUILTIN_PROVIDERS.some((p) => p.id === key))
                  .map(
                    ([key, provider]) => {
                      const modelId = provider.models?.[0]?.id;
                      const canUse = !!modelId;
                      const isProviderCurrent = canUse && current?.provider === key;
                      return html`
                      <div
                        class="models-provider-card ${props.selectedProvider === key ? "list-item-selected" : ""}"
                        style="cursor: pointer;"
                        @click=${() => props.onSelect(props.selectedProvider === key ? null : key)}
                      >
                        <div class="models-provider-card__header">
                          <div class="models-provider-card__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                              <path d="M2 17l10 5 10-5"/>
                            </svg>
                          </div>
                          <div class="models-provider-card__title-row" style="min-width: 0;">
                            <span class="models-provider-card__name">${getProviderDisplayName(key, provider)}</span>
                            ${canUse ? html`<span class="chip" style="font-size: 11px;">${modelId}</span>` : html`<span class="chip" style="font-size: 11px;">${(provider.models?.length ?? 0)} ${t("modelsModels")}</span>`}
                          </div>
                        </div>
                        <div class="models-provider-card__meta muted" style="font-size: 12px;">${provider.baseUrl ?? t("commonNA")}</div>
                        <div class="models-provider-card__footer" @click=${(e: Event) => e.stopPropagation()}>
                          ${canUse
                            ? html`
                                <button
                                  class="btn btn--sm ${isProviderCurrent ? "btn-ok" : "primary"}"
                                  ?disabled=${props.saving}
                                  @click=${(e: Event) => {
                                    e.stopPropagation();
                                    props.onUseModelClick(key);
                                  }}
                                >
                                  ${t("modelsUseAsDefault")}
                                </button>
                              `
                            : html`<button class="btn btn--sm" disabled>${t("modelsUseAsDefault")}</button>`}
                          <button
                            class="btn btn--sm"
                            ?disabled=${props.saving}
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              props.onSelect(props.selectedProvider === key ? null : key);
                            }}
                          >
                            ${t("channelsConfigure")}
                          </button>
                          <button
                            class="btn btn--sm ${isProviderCurrent ? "btn-ok" : ""}"
                            ?disabled=${props.saving || !isProviderCurrent}
                            @click=${(e: Event) => {
                              e.stopPropagation();
                              props.onCancelUse(key);
                            }}
                          >
                            ${t("modelsCancelUse")}
                          </button>
                        </div>
                      </div>
                    `;
                    },
                  )}
              </div>
            `
        }
    </section>

    ${props.addProviderModalOpen
      ? html`
          <div class="channel-panel-overlay" @click=${props.onAddProviderModalClose}>
            <div class="channel-panel card" style="max-width: 480px;" @click=${(e: Event) => e.stopPropagation()}>
              <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                <div class="card-title">${t("modelsAddCustomProvider")}</div>
                <button class="btn" @click=${props.onAddProviderModalClose}>×</button>
              </div>
              <div class="channel-panel-content">
                <div class="config-form">
                  <div class="field">
                    <span>${t("modelsProviderId")} *</span>
                    <input
                      type="text"
                      .value=${props.addProviderForm.providerId}
                      placeholder=${t("modelsProviderIdPlaceholder")}
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({
                          providerId: (e.target as HTMLInputElement).value
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9_-]/g, ""),
                        })}
                    />
                    <small class="muted" style="font-size: 11px;">${t("modelsProviderIdHint")}</small>
                  </div>
                  <div class="field">
                    <span>${t("modelsDisplayName")} *</span>
                    <input
                      type="text"
                      .value=${props.addProviderForm.displayName}
                      placeholder=${t("modelsDisplayNamePlaceholder")}
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ displayName: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                  <div class="field">
                    <span>${t("modelsDefaultBaseUrl")}</span>
                    <input
                      type="text"
                      .value=${props.addProviderForm.baseUrl}
                      placeholder=${t("modelsDefaultBaseUrlPlaceholder")}
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ baseUrl: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                  <div class="field">
                    <span>${t("modelsApiKey")}</span>
                    <input
                      type="password"
                      .value=${props.addProviderForm.apiKey}
                      placeholder="sk-... or $ENV_VAR"
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ apiKey: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                  <div class="field">
                    <span>${t("modelsApiKeyPrefix")}</span>
                    <input
                      type="text"
                      .value=${props.addProviderForm.apiKeyPrefix}
                      placeholder=${t("modelsApiKeyPrefixPlaceholder")}
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ apiKeyPrefix: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                </div>
                <div class="row" style="margin-top: 16px; gap: 8px;">
                  <button class="btn" @click=${props.onAddProviderModalClose}>${t("commonCancel")}</button>
                  <button
                    class="btn primary"
                    ?disabled=${!props.addProviderForm.providerId.trim() || !props.addProviderForm.displayName.trim()}
                    @click=${props.onAddProviderSubmit}
                  >
                    ${t("commonCreate")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
      : nothing}

    ${props.useModelModalOpen && props.useModelModalProvider
      ? html`
          <div class="channel-panel-overlay" style="z-index: 165;" @click=${props.onUseModelModalClose}>
            <div class="channel-panel card" style="max-width: 400px;" @click=${(e: Event) => e.stopPropagation()}>
              <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                <div class="card-title">${getProviderDisplayName(props.useModelModalProvider!, props.providers?.[props.useModelModalProvider!])} - ${t("modelsSelectModelToUse")}</div>
                <button class="btn" @click=${props.onUseModelModalClose}>×</button>
              </div>
              <div class="channel-panel-content">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${getModelsForProvider(props.useModelModalProvider!, props.providers?.[props.useModelModalProvider!]).map(
                    (m) => {
                      const isCurrent = current?.provider === props.useModelModalProvider && current?.modelId === m.id;
                      return html`
                        <li style="padding: 10px 0; border-bottom: 1px solid var(--border-color, #eee);">
                          <button
                            class="btn ${isCurrent ? "btn-ok" : ""}"
                            style="width: 100%; justify-content: flex-start; text-align: left;"
                            ?disabled=${props.saving}
                            @click=${() => props.onUseModel(props.useModelModalProvider!, m.id)}
                          >
                            <code>${m.id}</code> ${m.name ? `- ${m.name}` : ""}
                          </button>
                        </li>
                      `;
                    },
                  )}
                </ul>
              </div>
            </div>
          </div>
        `
      : nothing}

    ${props.addModelModalOpen && props.selectedProvider
      ? html`
          <div class="channel-panel-overlay" style="z-index: 160;" @click=${props.onAddModelModalClose}>
            <div class="channel-panel card" style="max-width: 400px;" @click=${(e: Event) => e.stopPropagation()}>
              <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                <div class="card-title">${getProviderDisplayName(props.selectedProvider, props.providers?.[props.selectedProvider])} - ${t("modelsAddModel")}</div>
                <button class="btn" @click=${props.onAddModelModalClose}>×</button>
              </div>
              <div class="channel-panel-content">
                <div class="config-form">
                  <div class="field">
                    <span>${t("modelsModelId")} *</span>
                    <input
                      type="text"
                      .value=${props.addModelForm.modelId}
                      placeholder="e.g. qwen3-max"
                      @input=${(e: Event) =>
                        props.onAddModelFormChange({ modelId: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                  <div class="field">
                    <span>${t("modelsModelName")} *</span>
                    <input
                      type="text"
                      .value=${props.addModelForm.modelName}
                      placeholder="e.g. Qwen3 Max"
                      @input=${(e: Event) =>
                        props.onAddModelFormChange({ modelName: (e.target as HTMLInputElement).value })}
                    />
                  </div>
                </div>
                <div class="row" style="margin-top: 16px; gap: 8px;">
                  <button class="btn" @click=${props.onAddModelModalClose}>${t("commonCancel")}</button>
                  <button
                    class="btn primary"
                    ?disabled=${!props.addModelForm.modelId.trim() || !props.addModelForm.modelName.trim()}
                    @click=${() => props.onAddModelSubmit(props.selectedProvider!)}
                  >
                    ${t("modelsAddModel")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
      : nothing}

    ${
      props.selectedProvider && (props.providers?.[props.selectedProvider] ?? BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider))
        ? html`
            <div class="channel-panel-overlay" @click=${(e: Event) => {
              if ((e.target as HTMLElement).classList.contains("channel-panel-overlay")) {
                props.onCancel();
              }
            }}>
              <div class="channel-panel card" @click=${(e: Event) => e.stopPropagation()}>
                <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                  <div class="card-title">
                    ${getProviderDisplayName(props.selectedProvider!, props.providers?.[props.selectedProvider!])} ${t("configSettingsTitle")}
                  </div>
                  <button class="btn" @click=${props.onCancel}>×</button>
                </div>
                <div class="channel-panel-content">
                  ${props.saveError
                    ? html`<div class="callout" style="margin-bottom: 12px; color: var(--color-error, #c00);">${t("modelsEnvVarConflict")}: ${props.saveError}</div>`
                    : nothing}
                  <div class="config-form">
                    <div class="field">
                      <span>${t("modelsBaseUrl")}</span>
                      <input
                        type="text"
                        .value=${props.providers?.[props.selectedProvider!]?.baseUrl ?? BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider)?.baseUrl ?? ""}
                        placeholder=${BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider)?.baseUrl ?? ""}
                        @input=${(e: Event) =>
                          props.onPatch(props.selectedProvider!, {
                            baseUrl: (e.target as HTMLInputElement).value,
                          })}
                      />
                    </div>
                    <div class="field">
                      <span>${t("modelsApiKey")}</span>
                      <input
                        type="password"
                        .value=${props.providers?.[props.selectedProvider!]?.apiKey ?? ""}
                        placeholder="sk-... or $ENV_VAR"
                        @input=${(e: Event) =>
                          props.onPatch(props.selectedProvider!, {
                            apiKey: (e.target as HTMLInputElement).value,
                          })}
                      />
                    </div>
                    ${!BUILTIN_PROVIDERS.some((p) => p.id === props.selectedProvider)
                      ? html`
                          <div class="field">
                            <span>${t("modelsDisplayName")}</span>
                            <input
                              type="text"
                              .value=${props.providers?.[props.selectedProvider!]?.displayName ?? ""}
                              placeholder=${props.selectedProvider}
                              @input=${(e: Event) =>
                                props.onPatch(props.selectedProvider!, {
                                  displayName: (e.target as HTMLInputElement).value,
                                })}
                            />
                          </div>
                        `
                      : nothing}
                    <div class="field">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${t("modelsApiType")}</span>
                        <span
                          class="muted"
                          style="cursor: help; font-size: 12px;"
                          title=${t("modelsApiTypeTooltip")}
                        >?</span>
                      </div>
                      <select
                        .value=${props.providers?.[props.selectedProvider!]?.api ?? BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider)?.defaultApi ?? "openai-completions"}
                        @change=${(e: Event) =>
                          props.onPatch(props.selectedProvider!, {
                            api: (e.target as HTMLSelectElement).value as string,
                          })}
                      >
                        <option value="openai-completions">${t("modelsApiTypeOpenAI")}</option>
                        <option value="anthropic-messages">${t("modelsApiTypeAnthropic")}</option>
                      </select>
                      <p class="muted" style="font-size: 12px; margin-bottom: 0; margin-top: 6px; line-height: 1.5;">
                        ${t("modelsApiTypeTooltip")}
                      </p>
                    </div>
                  </div>

                  <div style="margin-top: 16px;">
                    <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <strong>${t("modelsModelManagement")}</strong>
                      <button
                        class="btn btn--sm primary"
                        ?disabled=${props.saving}
                        @click=${() => props.onAddModel(props.selectedProvider!)}
                      >
                        + ${t("modelsAddModel")}
                      </button>
                    </div>
                    ${(props.providers?.[props.selectedProvider!]?.models ?? []).length === 0
                      ? html`<p class="muted" style="font-size: 13px;">${t("modelsNoModels")}</p>`
                      : html`
                          <ul style="list-style: none; padding: 0; margin: 0;">
                            ${(props.providers?.[props.selectedProvider!]?.models ?? []).map(
                              (m) => {
                                const modelRef = `${props.selectedProvider}/${m.id}`;
                                const mEnv = props.modelEnv?.[modelRef] ?? {};
                                const mEnvEntries = Object.entries(mEnv);
                                return html`
                                <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color, #eee);">
                                  <div class="row" style="justify-content: space-between; align-items: center;">
                                    <span><code>${m.id}</code> ${m.name ? `- ${m.name}` : ""}</span>
                                    <button
                                      class="btn btn--sm"
                                      ?disabled=${props.saving}
                                      @click=${() => props.onRemoveModel(props.selectedProvider!, m.id)}
                                    >
                                      ${t("commonDelete")}
                                    </button>
                                  </div>
                                  <div style="margin-top: 6px; font-size: 12px;">
                                    <strong class="muted">${t("modelsEnvVars")}</strong>
                                    ${mEnvEntries.length === 0
                                      ? html`
                                          <button
                                            class="btn btn--sm"
                                            style="font-size: 11px; margin-top: 4px;"
                                            @click=${() => props.onPatchModelEnv(props.selectedProvider!, m.id, { "__new__": "" })}
                                          >
                                            + ${t("envVarsAdd")}
                                          </button>
                                        `
                                      : html`
                                          <div style="margin-top: 4px;">
                                            ${mEnvEntries.map(([k, v]) => html`
                                              <div class="row" style="gap: 6px; align-items: center; margin-top: 4px;">
                                                <input
                                                  type="text"
                                                  style="flex: 1; font-size: 11px; padding: 4px;"
                                                  placeholder=${t("envVarsKeyPlaceholder")}
                                                  .value=${k === "__new__" ? "" : k}
                                                  @input=${(e: Event) => {
                                                    const nk = (e.target as HTMLInputElement).value;
                                                    const next = { ...mEnv };
                                                    delete next[k];
                                                    if (nk) next[nk] = v;
                                                    props.onPatchModelEnv(props.selectedProvider!, m.id, next);
                                                  }}
                                                />
                                                <input
                                                  type="text"
                                                  style="flex: 1; font-size: 11px; padding: 4px;"
                                                  placeholder=${t("envVarsValuePlaceholder")}
                                                  .value=${v}
                                                  @input=${(e: Event) => {
                                                    const next = { ...mEnv };
                                                    next[k] = (e.target as HTMLInputElement).value;
                                                    props.onPatchModelEnv(props.selectedProvider!, m.id, next);
                                                  }}
                                                />
                                                <button class="btn btn--sm" style="font-size: 11px;" @click=${() => {
                                                  const next = { ...mEnv };
                                                  delete next[k];
                                                  props.onPatchModelEnv(props.selectedProvider!, m.id, next);
                                                }}>×</button>
                                              </div>
                                            `)}
                                            <button
                                              class="btn btn--sm"
                                              style="margin-top: 4px; font-size: 11px;"
                                              @click=${() => {
                                                const next = { ...mEnv, "__new__": "" };
                                                props.onPatchModelEnv(props.selectedProvider!, m.id, next);
                                              }}
                                            >
                                              + ${t("envVarsAdd")}
                                            </button>
                                          </div>
                                        `}
                                  </div>
                                </li>
                              `;
                              },
                            )}
                          </ul>
                        `}
                  </div>

                  <div class="row" style="margin-top: 16px; gap: 8px;">
                    <button
                      class="btn primary"
                      ?disabled=${props.saving || !props.formDirty}
                      @click=${props.onSave}
                    >
                      ${props.saving ? t("commonSaving") : t("commonSave")}
                    </button>
                    <button class="btn" ?disabled=${props.saving} @click=${props.onCancel}>
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `
        : nothing
    }
  `;
}
