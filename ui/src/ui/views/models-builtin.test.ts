import { describe, expect, it } from "vitest";
import { BUILTIN_PROVIDERS, parseModelRef, formatModelRef } from "./models-builtin.ts";
import { getModelsForProvider } from "./models.ts";

describe("BUILTIN_PROVIDERS MiniMax", () => {
  const minimax = BUILTIN_PROVIDERS.find((p) => p.id === "minimax");

  it("has minimax provider in the list", () => {
    expect(minimax).toBeDefined();
  });

  it("uses MiniMax-M3.1-Flash as default model", () => {
    expect(minimax!.defaultModel).toBe("MiniMax-M3.1-Flash");
  });

  it("lists only current built-in models with Flash first", () => {
    expect(minimax!.models).toEqual(["MiniMax-M3.1-Flash", "MiniMax-M3"]);
    expect(getModelsForProvider("minimax")).toEqual([
      { id: "MiniMax-M3.1-Flash", name: "MiniMax-M3.1-Flash" },
      { id: "MiniMax-M3", name: "MiniMax-M3" },
    ]);
  });

  it("preserves explicitly configured legacy and custom models", () => {
    const models = [
      { id: "MiniMax-M2.7", name: "Saved model", maxTokens: 4096 },
      { id: "custom-model", name: "Custom model" },
    ];
    expect(getModelsForProvider("minimax", { models })).toBe(models);
    expect(getModelsForProvider("custom-provider", { models })).toBe(models);
  });

  it("round-trips the Flash model reference", () => {
    const ref = formatModelRef("minimax", "MiniMax-M3.1-Flash");
    expect(parseModelRef(ref)).toEqual({ provider: "minimax", modelId: "MiniMax-M3.1-Flash" });
  });

  it("uses Anthropic Messages API endpoint", () => {
    expect(minimax!.baseUrl).toBe("https://api.minimax.io/anthropic");
  });

  it("uses anthropic-messages API type", () => {
    expect(minimax!.defaultApi).toBe("anthropic-messages");
  });

  it("uses MINIMAX_API_KEY env key", () => {
    expect(minimax!.envKey).toBe("MINIMAX_API_KEY");
  });

  it("has MiniMax label", () => {
    expect(minimax!.label).toBe("MiniMax");
  });
});

describe("BUILTIN_PROVIDERS NEAR AI Cloud", () => {
  const nearai = BUILTIN_PROVIDERS.find((p) => p.id === "nearai");

  it("has nearai provider in the list", () => {
    expect(nearai).toBeDefined();
  });

  it("uses a TEE-capable NEAR AI model as default", () => {
    expect(nearai!.defaultModel).toBe("zai-org/GLM-5.1-FP8");
  });

  it("uses the NEAR AI Cloud OpenAI-compatible endpoint", () => {
    expect(nearai!.baseUrl).toBe("https://cloud-api.near.ai/v1");
  });

  it("uses openai-completions API type", () => {
    expect(nearai!.defaultApi).toBe("openai-completions");
  });

  it("uses NEARAI_API_KEY env key", () => {
    expect(nearai!.envKey).toBe("NEARAI_API_KEY");
  });

  it("has NEAR AI Cloud label", () => {
    expect(nearai!.label).toBe("NEAR AI Cloud");
  });
});

describe("legacy gateway selection", () => {
  it("does not suggest an obsolete MiniMax gateway model", () => {
    expect(getModelsForProvider("synthetic")).toEqual([]);
  });

  it("preserves an explicitly saved gateway model", () => {
    const models = [{ id: "hf:MiniMaxAI/MiniMax-M2.1" }];
    expect(getModelsForProvider("synthetic", { models })).toBe(models);
    expect(parseModelRef("synthetic/hf:MiniMaxAI/MiniMax-M2.1")).toEqual({
      provider: "synthetic", modelId: "hf:MiniMaxAI/MiniMax-M2.1",
    });
  });
});

describe("parseModelRef with MiniMax", () => {
  it("parses minimax/MiniMax-M3", () => {
    const result = parseModelRef("minimax/MiniMax-M3");
    expect(result).toEqual({ provider: "minimax", modelId: "MiniMax-M3" });
  });

  it("parses minimax/MiniMax-M2.7", () => {
    const result = parseModelRef("minimax/MiniMax-M2.7");
    expect(result).toEqual({ provider: "minimax", modelId: "MiniMax-M2.7" });
  });

  it("parses minimax/MiniMax-M2.7-highspeed", () => {
    const result = parseModelRef("minimax/MiniMax-M2.7-highspeed");
    expect(result).toEqual({ provider: "minimax", modelId: "MiniMax-M2.7-highspeed" });
  });

  it("returns null for null input", () => {
    expect(parseModelRef(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(parseModelRef(undefined)).toBeNull();
  });
});

describe("parseModelRef with NEAR AI Cloud", () => {
  it("parses nearai/zai-org/GLM-5.1-FP8", () => {
    const result = parseModelRef("nearai/zai-org/GLM-5.1-FP8");
    expect(result).toEqual({ provider: "nearai", modelId: "zai-org/GLM-5.1-FP8" });
  });
});

describe("formatModelRef with MiniMax", () => {
  it("formats the MiniMax-M3 model ref", () => {
    expect(formatModelRef("minimax", "MiniMax-M3")).toBe("minimax/MiniMax-M3");
  });

  it("formats minimax model ref correctly", () => {
    expect(formatModelRef("minimax", "MiniMax-M2.7")).toBe("minimax/MiniMax-M2.7");
  });

  it("formats minimax highspeed model ref", () => {
    expect(formatModelRef("minimax", "MiniMax-M2.7-highspeed")).toBe("minimax/MiniMax-M2.7-highspeed");
  });
});

describe("formatModelRef with NEAR AI Cloud", () => {
  it("formats nearai model ref correctly", () => {
    expect(formatModelRef("nearai", "zai-org/GLM-5.1-FP8")).toBe("nearai/zai-org/GLM-5.1-FP8");
  });
});
