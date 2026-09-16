import { html, nothing } from "lit";
import { icons } from "../icons.js";
import { t } from "../strings.js";
import {
  BUILTIN_PROVIDERS,
  formatModelRef,
  parseModelRef,
  type BuiltInProvider,
} from "./models-builtin.ts";
import { resolveModelProviderLogo } from "./model-provider-logos.js";

export type ModelDefinitionEntry = {
  id: string;
  name?: string;
  /** Estimated token budget for conversation history (agentsdk trimmer). */
  contextWindow?: number;
  /** Max completion tokens per model request (provider MaxTokens). */
  maxTokens?: number;
};

export type ModelProvider = {
  baseUrl?: string;
  apiKey?: string;
  apiKeyPrefix?: string;
  auth?: string;
  api?: string;
  headers?: Record<string, string>;
  displayName?: string;
  envVars?: Record<string, string>;
  models?: ModelDefinitionEntry[];
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
  /** Optional; empty omits. Positive integers only. */
  contextWindow: string;
  maxTokens: string;
};

export type ModelsProps = {
  providers: Record<string, ModelProvider>;
  /** 用于配置弹框的数据源（未保存的表单数据），如果不传则使用 providers */
  formProviders?: Record<string, ModelProvider>;
  modelEnv: Record<string, Record<string, string>>; // key: "provider/modelId"
  defaultModelRef: string | null;
  loading: boolean;
  saving: boolean;
  selectedProvider: string | null;
  /** Filter built-in + custom provider rows by display name / id (case-insensitive substring). */
  providerSearchQuery: string;
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
  onProviderSearchChange: (query: string) => void;
  onViewModeChange: (mode: "list" | "card") => void;
  onPatch: (key: string, patch: Partial<ModelProvider>) => void;
  onAddModel: (providerKey: string) => void;
  onAddModelModalClose: () => void;
  onAddModelFormChange: (form: Partial<AddModelForm>) => void;
  onAddModelSubmit: (providerKey: string) => void;
  onRemoveModel: (providerKey: string, modelId: string) => void;
  onPatchModel: (
    providerKey: string,
    modelId: string,
    patch: Partial<{ id: string; name: string; contextWindow: number | null; maxTokens: number | null }>,
  ) => void;
  onPatchModelEnv: (providerKey: string, modelId: string, envVars: Record<string, string>) => void;
  onSave: () => void;
  onCancel: () => void;
  onUseModelClick: (provider: string) => void;
  onUseModelModalClose: () => void;
  onUseModel: (provider: string, modelId: string) => void;
  onCancelUse: (provider: string) => void;
  onDeleteProvider: (providerKey?: string) => void;
  /** Extra class on overlay roots (e.g. setup-wizard__overlay in install wizard). */
  overlayClass?: string;
};

function modelOverlayClass(props: ModelsProps, extra?: string): string {
  const parts = ["channel-panel-overlay"];
  const overlayClass = props.overlayClass?.trim();
  if (overlayClass) {
    parts.push(overlayClass);
  }
  if (extra?.trim()) {
    parts.push(extra.trim());
  }
  return parts.join(" ");
}

export function getProviderDisplayName(providerKey: string, provider?: ModelProvider): string {
  const builtin = BUILTIN_PROVIDERS.find((p) => p.id === providerKey);
  if (builtin) return builtin.label;
  return provider?.displayName ?? providerKey;
}

/** 自定义厂商始终可删；内置厂商仅当已在配置中写入时可删（移除配置，不删内置模板）。 */
export function canDeleteModelProvider(
  providerKey: string,
  providers?: Record<string, ModelProvider>,
): boolean {
  if (!BUILTIN_PROVIDERS.some((p) => p.id === providerKey)) {
    return true;
  }
  return Boolean(providers?.[providerKey]);
}

export function providerMatchesSearch(
  providerKey: string,
  provider: ModelProvider | undefined,
  builtin: BuiltInProvider | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (providerKey.toLowerCase().includes(q)) return true;
  if (builtin) {
    if (builtin.label.toLowerCase().includes(q) || builtin.id.toLowerCase().includes(q)) {
      return true;
    }
  }
  const dn = (provider?.displayName ?? "").toLowerCase();
  return dn.includes(q);
}

export function getModelsForProvider(providerKey: string, provider?: ModelProvider): ModelDefinitionEntry[] {
  const builtin = BUILTIN_PROVIDERS.find((p) => p.id === providerKey);
  const configured = provider?.models ?? [];
  if (configured.length > 0) return configured;
  if (builtin?.models?.length) return builtin.models.map((id) => ({ id, name: id }));
  if (builtin?.defaultModel) return [{ id: builtin.defaultModel, name: builtin.defaultModel }];
  return [];
}

function renderProviderLogoGraphic(
  providerKey: string,
  displayName: string | undefined,
  baseUrl: string | undefined,
  builtin?: BuiltInProvider,
) {
  const logoUrl = resolveModelProviderLogo(providerKey, displayName, baseUrl, builtin);
  return logoUrl
    ? html`<img src=${logoUrl} alt="" class="provider-logo" loading="lazy" decoding="async" />`
    : icons.modelCube;
}

export function renderModels(props: ModelsProps) {
  const current = parseModelRef(props.defaultModelRef);
  const searchQ = props.providerSearchQuery ?? "";
  const filteredBuiltin = BUILTIN_PROVIDERS.filter((p) =>
    providerMatchesSearch(p.id, props.providers?.[p.id], p, searchQ),
  );
  const filteredCustom = Object.entries(props.providers ?? {}).filter(([key, prov]) => {
    if (BUILTIN_PROVIDERS.some((b) => b.id === key)) return false;
    return providerMatchesSearch(key, prov, undefined, searchQ);
  });
  const searchActive = searchQ.trim().length > 0;
  const noSearchResults = searchActive && filteredBuiltin.length === 0 && filteredCustom.length === 0;

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <div>
          <div class="card-title">${t("navTitleModels")}</div>
          <div class="card-sub">${t("subtitleModels")}</div>
        </div>
        <div class="row" style="gap: 8px; align-items: center; flex-wrap: wrap;">
          <div class="emp-search">
            <span class="input"><input
              style="padding-left:30px;"
              class="emp-search__input"
              type="text"
              placeholder=${t("modelsSearchPlaceholder")}
              .value=${props.providerSearchQuery}
              ?disabled=${props.loading}
              @input=${(e: Event) => props.onProviderSearchChange((e.target as HTMLInputElement).value)}
            /></span>
            <span class="emp-search__icon" aria-hidden="true">${icons.search}</span>
          </div>
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
        ${noSearchResults
          ? html`<p class="muted" style="margin: 12px 0 0; font-size: 14px;">${t("modelsSearchNoMatch")}</p>`
          : props.viewMode === "list"
          ? html`
              <div class="models-table table" style="margin-top: 0;">
                <div class="models-table-head table-head">
                  <div>${t("modelsTableName")}</div>
                  <div>${t("modelsTableModel")}</div>
                  <div>${t("modelsTableBaseUrl")}</div>
                  <div>${t("modelsTableActions")}</div>
                </div>
                ${filteredBuiltin.map((p) => {
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
                ${filteredCustom.map(
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
                ${filteredBuiltin.map((p) => {
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
                          ${renderProviderLogoGraphic(p.id, prov?.displayName, prov?.baseUrl, p)}
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
                ${filteredCustom.map(
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
                            ${renderProviderLogoGraphic(key, provider.displayName, provider.baseUrl)}
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

    ${renderModelsOverlays(props)}
  `;
}

export function renderModelsOverlays(props: ModelsProps) {
  const current = parseModelRef(props.defaultModelRef);
  // 配置弹框使用 formProviders（未保存的表单数据），否则使用 providers
  const providers = props.formProviders ?? props.providers;
  const selectedBuiltin = props.selectedProvider
    ? BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider)
    : undefined;
  const selectedProviderData = props.selectedProvider ? providers?.[props.selectedProvider] : undefined;

  return html`
    ${props.addProviderModalOpen
      ? html`
          <div class=${modelOverlayClass(props)} @click=${props.onAddProviderModalClose}>
            <div class="channel-panel card" style="max-width: 480px;" @click=${(e: Event) => e.stopPropagation()}>
              <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                <div class="card-title">${t("modelsAddCustomProvider")}</div>
                <button class="btn btn--icon" type="button" aria-label="关闭" @click=${props.onAddProviderModalClose}>
                  ${icons.x}
                </button>
              </div>
              <div class="channel-panel-content">
                <div class="config-form">
                  <div class="field">
                    <span>${t("modelsProviderId")} *</span>
                    <span class="input"><input
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
                    /></span>
                    <small class="muted" style="font-size: 11px;">${t("modelsProviderIdHint")}</small>
                  </div>
                  <div class="field">
                    <span>${t("modelsDisplayName")} *</span>
                    <span class="input"><input
                      type="text"
                      .value=${props.addProviderForm.displayName}
                      placeholder=${t("modelsDisplayNamePlaceholder")}
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ displayName: (e.target as HTMLInputElement).value })}
                    /></span>
                  </div>
                  <div class="field">
                    <span>${t("modelsDefaultBaseUrl")}</span>
                    <span class="input"><input
                      type="text"
                      .value=${props.addProviderForm.baseUrl}
                      placeholder=${t("modelsDefaultBaseUrlPlaceholder")}
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ baseUrl: (e.target as HTMLInputElement).value })}
                    /></span>
                  </div>
                  <div class="field">
                    <span>${t("modelsApiKey")}</span>
                    <span class="input"><input
                      type="password"
                      .value=${props.addProviderForm.apiKey}
                      placeholder="sk-... or $ENV_VAR"
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ apiKey: (e.target as HTMLInputElement).value })}
                    /></span>
                  </div>
                  <div class="field">
                    <span>${t("modelsApiKeyPrefix")}</span>
                    <span class="input"><input
                      type="text"
                      .value=${props.addProviderForm.apiKeyPrefix}
                      placeholder=${t("modelsApiKeyPrefixPlaceholder")}
                      @input=${(e: Event) =>
                        props.onAddProviderFormChange({ apiKeyPrefix: (e.target as HTMLInputElement).value })}
                    /></span>
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
          <div class=${modelOverlayClass(props, "models-overlay--use-model")} @click=${props.onUseModelModalClose}>
            <div class="channel-panel card" style="max-width: 400px;" @click=${(e: Event) => e.stopPropagation()}>
              <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                <div class="card-title">${getProviderDisplayName(props.useModelModalProvider!, providers?.[props.useModelModalProvider!])} - ${t("modelsSelectModelToUse")}</div>
                <button class="btn btn--icon" type="button" aria-label="关闭" @click=${props.onUseModelModalClose}>
                  ${icons.x}
                </button>
              </div>
              <div class="channel-panel-content">
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${getModelsForProvider(props.useModelModalProvider!, providers?.[props.useModelModalProvider!]).map(
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
          <div class=${modelOverlayClass(props, "models-overlay--add-model")} @click=${props.onAddModelModalClose}>
            <div class="channel-panel card" style="max-width: 400px;" @click=${(e: Event) => e.stopPropagation()}>
              <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                <div class="card-title">${getProviderDisplayName(props.selectedProvider, providers?.[props.selectedProvider])} - ${t("modelsAddModel")}</div>
                <button class="btn btn--icon" type="button" aria-label="关闭" @click=${props.onAddModelModalClose}>
                  ${icons.x}
                </button>
              </div>
              <div class="channel-panel-content">
                <div class="config-form">
                  <div class="field">
                    <span>${t("modelsModelId")} *</span>
                    <span class="input"><input
                      type="text"
                      .value=${props.addModelForm.modelId}
                      placeholder=${props.selectedProvider === "ollama" ? "e.g. llama3.3:latest" : "e.g. qwen3-max"}
                      @input=${(e: Event) =>
                        props.onAddModelFormChange({ modelId: (e.target as HTMLInputElement).value })}
                    /></span>
                    ${props.selectedProvider === "ollama"
                      ? html`<small style="font-size: 11px; color: var(--color-warning, #d97706);">
                          模型 ID 必须与本地 Ollama 执行 <code>ollama list</code> 命令显示的 NAME 完全一致
                        </small>`
                      : nothing}
                  </div>
                  <div class="field">
                    <span>${t("modelsModelName")} *</span>
                    <span class="input"><input
                      type="text"
                      .value=${props.addModelForm.modelName}
                      placeholder="e.g. Qwen3 Max"
                      @input=${(e: Event) =>
                        props.onAddModelFormChange({ modelName: (e.target as HTMLInputElement).value })}
                    /></span>
                  </div>
                  <div class="field">
                    <span>${t("modelsContextWindow")}</span>
                    <span class="input"><input
                      type="number"
                      step="1"
                      min="1"
                      .value=${props.addModelForm.contextWindow}
                      placeholder=${t("modelsContextWindowPlaceholder")}
                      @input=${(e: Event) =>
                        (() => {
                          const raw = (e.target as HTMLInputElement).value.trim();
                          // 只允许正整数；非法输入立即清空，避免写入非整数值
                          if (raw === "") return props.onAddModelFormChange({ contextWindow: "" });
                          if (/^\d+$/.test(raw)) return props.onAddModelFormChange({ contextWindow: raw });
                          return props.onAddModelFormChange({ contextWindow: "" });
                        })()}
                    /></span>
                    <small class="muted" style="font-size: 11px;">${t("modelsContextWindowHint")}</small>
                  </div>
                  <div class="field">
                    <span>${t("modelsMaxTokens")}</span>
                    <span class="input"><input
                      type="number"
                      step="1"
                      min="1"
                      .value=${props.addModelForm.maxTokens}
                      placeholder=${t("modelsMaxTokensPlaceholder")}
                      @input=${(e: Event) =>
                        (() => {
                          const raw = (e.target as HTMLInputElement).value.trim();
                          // 只允许正整数；非法输入立即清空，避免写入非整数值
                          if (raw === "") return props.onAddModelFormChange({ maxTokens: "" });
                          if (/^\d+$/.test(raw)) return props.onAddModelFormChange({ maxTokens: raw });
                          return props.onAddModelFormChange({ maxTokens: "" });
                        })()}
                    /></span>
                    <small class="muted" style="font-size: 11px;">${t("modelsMaxTokensHint")}</small>
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
      props.selectedProvider && (providers?.[props.selectedProvider] ?? BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider))
        ? html`
            <div
              class=${modelOverlayClass(props)}
              @click=${(e: Event) => {
              if ((e.target as HTMLElement).classList.contains("channel-panel-overlay")) {
                props.onCancel();
              }
            }}
            >
              <div class="channel-panel card" @click=${(e: Event) => e.stopPropagation()}>
                <div class="channel-panel-header row" style="justify-content: space-between; align-items: center;">
                  <div class="row" style="gap: 10px; align-items: center; min-width: 0;">
                    <div class="models-provider-card__icon" style="width: 24px; height: 24px; flex-shrink: 0;">
                      ${renderProviderLogoGraphic(
                        props.selectedProvider!,
                        selectedProviderData?.displayName,
                        selectedProviderData?.baseUrl,
                        selectedBuiltin,
                      )}
                    </div>
                    <div class="card-title">
                      ${getProviderDisplayName(props.selectedProvider!, selectedProviderData)} ${t("configSettingsTitle")}
                    </div>
                  </div>
                  <button class="btn btn--icon" type="button" aria-label="关闭" @click=${props.onCancel}>
                    ${icons.x}
                  </button>
                </div>
                <div class="channel-panel-content text-primary">
                  ${props.saveError
                    ? html`<div class="callout" style="margin-bottom: 12px; color: var(--color-error, #c00);">${t("modelsEnvVarConflict")}: ${props.saveError}</div>`
                    : nothing}
                  <div class="config-form">
                    <div class="field">
                      <span>${t("modelsBaseUrl")}</span>
                      <span class="input"><input
                        type="text"
                        .value=${providers?.[props.selectedProvider!]?.baseUrl ?? BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider)?.baseUrl ?? ""}
                        placeholder=${BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider)?.baseUrl ?? ""}
                        @input=${(e: Event) =>
                          props.onPatch(props.selectedProvider!, {
                            baseUrl: (e.target as HTMLInputElement).value,
                          })}
                      /></span>
                    </div>
                    <div class="field">
                      <span>${t("modelsApiKey")}</span>
                      <span class="input"><input
                        type="password"
                        .value=${providers?.[props.selectedProvider!]?.apiKey ?? ""}
                        placeholder="sk-... or $ENV_VAR"
                        @input=${(e: Event) =>
                          props.onPatch(props.selectedProvider!, {
                            apiKey: (e.target as HTMLInputElement).value,
                          })}
                      /></span>
                    </div>
                    ${!BUILTIN_PROVIDERS.some((p) => p.id === props.selectedProvider)
                      ? html`
                          <div class="field">
                            <span>${t("modelsDisplayName")}</span>
                            <span class="input"><input
                              type="text"
                              .value=${providers?.[props.selectedProvider!]?.displayName ?? ""}
                              placeholder=${props.selectedProvider}
                              @input=${(e: Event) =>
                                props.onPatch(props.selectedProvider!, {
                                  displayName: (e.target as HTMLInputElement).value,
                                })}
                            /></span>
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
                      <span class="select"><select
                        .value=${providers?.[props.selectedProvider!]?.api ?? BUILTIN_PROVIDERS.find((p) => p.id === props.selectedProvider)?.defaultApi ?? "openai-completions"}
                        @change=${(e: Event) =>
                          props.onPatch(props.selectedProvider!, {
                            api: (e.target as HTMLSelectElement).value as string,
                          })}
                      >
                        <option value="openai-completions">${t("modelsApiTypeOpenAI")}</option>
                        <option value="anthropic-messages">${t("modelsApiTypeAnthropic")}</option>
                      </select></span>
                      <p class="text-placeholder" style="font-size: 12px; margin-bottom: 0; margin-top: 6px; line-height: 1.5;">
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
                        <span class="btn__icon">${icons.plus}</span>${t("modelsAddModel")}
                      </button>
                    </div>
                    ${(providers?.[props.selectedProvider!]?.models ?? []).length === 0
                      ? html`<p class="muted" style="font-size: 13px;">${t("modelsNoModels")}</p>`
                      : html`
                          <ul style="list-style: none; padding: 0; margin: 0;">
                            ${(providers?.[props.selectedProvider!]?.models ?? []).map(
                              (m) => {
                                const modelRef = `${props.selectedProvider}/${m.id}`;
                                const mEnv = props.modelEnv?.[modelRef] ?? {};
                                const mEnvEntries = Object.entries(mEnv);
                                return html`
                                <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color, #eee);">
                                  <div class="row" style="justify-content: space-between; align-items: flex-start; gap: 8px;">
                                    <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px;">
                                      <div class="field" style="margin: 0;">
                                        <span style="font-size: 11px;">${t("modelsModelId")}</span>
                                        <span class="input"><input
                                          type="text"
                                          style="font-size: 12px; padding: 6px 8px;"
                                          .value=${m.id}
                                          @change=${(e: Event) => {
                                            const nextId = (e.target as HTMLInputElement).value.trim();
                                            if (nextId && nextId !== m.id) {
                                              props.onPatchModel(props.selectedProvider!, m.id, { id: nextId });
                                            }
                                          }}
                                        /></span>
                                      </div>
                                      <div class="field" style="margin: 0;">
                                        <span style="font-size: 11px;">${t("modelsModelName")}</span>
                                        <span class="input"><input
                                          type="text"
                                          style="font-size: 12px; padding: 6px 8px;"
                                          .value=${m.name ?? ""}
                                          placeholder=${m.id}
                                          @input=${(e: Event) =>
                                            props.onPatchModel(props.selectedProvider!, m.id, {
                                              name: (e.target as HTMLInputElement).value,
                                            })}
                                        /></span>
                                      </div>
                                    </div>
                                    <button
                                      class="btn btn--sm"
                                      ?disabled=${props.saving}
                                      @click=${() => props.onRemoveModel(props.selectedProvider!, m.id)}
                                    >
                                      ${t("commonDelete")}
                                    </button>
                                  </div>
                                  <div class="row" style="gap: 10px; margin-top: 8px; flex-wrap: wrap; align-items: flex-end;">
                                    <div class="field" style="flex: 1; min-width: 120px; margin: 0;">
                                      <span style="font-size: 11px;">${t("modelsContextWindow")}</span>
                                      <span class="input"><input
                                        type="number"
                                        step="1"
                                        min="1"
                                        style="font-size: 12px; padding: 6px 8px;"
                                        .value=${m.contextWindow != null ? String(m.contextWindow) : ""}
                                        placeholder=${t("modelsContextWindowPlaceholder")}
                                        @input=${(e: Event) => {
                                          const raw = (e.target as HTMLInputElement).value.trim();
                                          if (!raw) {
                                            props.onPatchModel(props.selectedProvider!, m.id, { contextWindow: null });
                                            return;
                                          }
                                          if (!/^\d+$/.test(raw)) {
                                            props.onPatchModel(props.selectedProvider!, m.id, { contextWindow: null });
                                            return;
                                          }
                                          const n = Number(raw);
                                          if (Number.isFinite(n) && n > 0) {
                                            props.onPatchModel(props.selectedProvider!, m.id, { contextWindow: n });
                                          }
                                        }}
                                      /></span>
                                    </div>
                                    <div class="field" style="flex: 1; min-width: 120px; margin: 0;">
                                      <span style="font-size: 11px;">${t("modelsMaxTokens")}</span>
                                      <span class="input"><input
                                        type="number"
                                        step="1"
                                        min="1"
                                        style="font-size: 12px; padding: 6px 8px;"
                                        .value=${m.maxTokens != null ? String(m.maxTokens) : ""}
                                        placeholder=${t("modelsMaxTokensPlaceholder")}
                                        @input=${(e: Event) => {
                                          const raw = (e.target as HTMLInputElement).value.trim();
                                          if (!raw) {
                                            props.onPatchModel(props.selectedProvider!, m.id, { maxTokens: null });
                                            return;
                                          }
                                          if (!/^\d+$/.test(raw)) {
                                            props.onPatchModel(props.selectedProvider!, m.id, { maxTokens: null });
                                            return;
                                          }
                                          const n = Number(raw);
                                          if (Number.isFinite(n) && n > 0) {
                                            props.onPatchModel(props.selectedProvider!, m.id, { maxTokens: n });
                                          }
                                        }}
                                      /></span>
                                    </div>
                                  </div>
                                  <div style="margin-top: 6px; font-size: 12px;">
                                    ${mEnvEntries.length === 0
                                      ? html`
                                          <button
                                            class="btn btn--sm"
                                            style="font-size: 11px; margin-top: 4px;"
                                            @click=${() => props.onPatchModelEnv(props.selectedProvider!, m.id, { "__new__": "" })}
                                          >
                                            <span class="btn__icon">${icons.plus}</span>${t("modelsEnvVars")}
                                          </button>
                                        `
                                      : html`
                                          <div style="margin-top: 4px;">
                                            ${mEnvEntries.map(([k, v]) => html`
                                              <div class="row" style="gap: 6px; align-items: center; margin-top: 4px;">
                                                <span class="input small"><input
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
                                                /></span>
                                                <span class="input small"><input
                                                  type="text"
                                                  style="flex: 1; font-size: 11px; padding: 4px;"
                                                  placeholder=${t("envVarsValuePlaceholder")}
                                                  .value=${v}
                                                  @input=${(e: Event) => {
                                                    const next = { ...mEnv };
                                                    next[k] = (e.target as HTMLInputElement).value;
                                                    props.onPatchModelEnv(props.selectedProvider!, m.id, next);
                                                  }}
                                                /></span>
                                                <button
                                                  class="btn btn--sm"
                                                  type="button"
                                                  style="font-size: 11px;"
                                                  aria-label=${t("envVarsDelete")}
                                                  title=${t("envVarsDelete")}
                                                  @click=${() => {
                                                  const next = { ...mEnv };
                                                  delete next[k];
                                                  props.onPatchModelEnv(props.selectedProvider!, m.id, next);
                                                }}
                                                >
                                                  ${icons.x}
                                                </button>
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
                                              <span class="btn__icon">${icons.plus}</span>${t("modelsEnvVars")}
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
                      ?disabled=${props.saving}
                      @click=${props.onSave}
                    >
                      ${props.saving ? t("commonSaving") : t("commonSave")}
                    </button>
                    ${canDeleteModelProvider(props.selectedProvider!, providers)
                      ? html`
                          <button
                            class="btn btn--danger"
                            type="button"
                            ?disabled=${props.saving}
                            @click=${() => props.onDeleteProvider(props.selectedProvider!)}
                          >
                            ${t("modelsDeleteProvider")}
                          </button>
                        `
                      : nothing}
                    <button class="btn" type="button" aria-label="关闭" ?disabled=${props.saving} @click=${props.onCancel}>
                      ${t("commonCancel")}
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
