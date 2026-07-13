import { describe, expect, it } from "vitest";
import { knowledgeVaultIsDirty } from "./app-knowledge-vault.ts";

describe("knowledgeVaultIsDirty", () => {
  it("returns false when no selection", () => {
    expect(
      knowledgeVaultIsDirty({
        knowledgeVaultSelectedPath: null,
        knowledgeVaultDraftContent: "a",
        knowledgeVaultContent: "b",
      } as never),
    ).toBe(false);
  });

  it("detects draft changes", () => {
    expect(
      knowledgeVaultIsDirty({
        knowledgeVaultSelectedPath: "note.md",
        knowledgeVaultDraftContent: "draft",
        knowledgeVaultContent: "saved",
      } as never),
    ).toBe(true);
  });

  it("returns false when content matches", () => {
    expect(
      knowledgeVaultIsDirty({
        knowledgeVaultSelectedPath: "note.md",
        knowledgeVaultDraftContent: "same",
        knowledgeVaultContent: "same",
      } as never),
    ).toBe(false);
  });
});
