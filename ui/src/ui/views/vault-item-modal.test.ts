import { describe, expect, it } from "vitest";
import {
  buildVaultParentOptions,
  isVaultFolderDescendant,
  vaultItemBaseName,
  vaultItemParent,
  vaultTargetPathTaken,
} from "./vault-item-modal.ts";

describe("vaultItemModal helpers", () => {
  it("parses parent and name from paths", () => {
    expect(vaultItemParent("notes/a.md", false)).toBe("notes");
    expect(vaultItemBaseName("notes/a.md", false)).toBe("a");
    expect(vaultItemParent("notes/sub", true)).toBe("notes");
    expect(vaultItemBaseName("notes/sub", true)).toBe("sub");
  });

  it("detects folder descendants", () => {
    expect(isVaultFolderDescendant("notes", "notes/sub")).toBe(true);
    expect(isVaultFolderDescendant("notes", "other")).toBe(false);
  });

  it("excludes invalid parent folders when editing", () => {
    const opts = buildVaultParentOptions(["notes", "notes/sub", "other"], {
      excludeFolderPath: "notes",
    });
    expect(opts.map((o) => o.value)).toEqual(["", "other"]);
  });

  it("detects duplicate vault paths", () => {
    const files = [{ path: "notes/a.md" }];
    const folders = ["notes", "drafts"];
    expect(vaultTargetPathTaken("notes/a", false, files, folders)).toBe(true);
    expect(vaultTargetPathTaken("notes", true, files, folders)).toBe(true);
    expect(vaultTargetPathTaken("other", true, files, folders)).toBe(false);
    expect(vaultTargetPathTaken("notes/a", false, files, folders, "notes/a.md")).toBe(false);
  });
});
