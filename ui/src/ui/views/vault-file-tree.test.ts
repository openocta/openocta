import { describe, expect, it } from "vitest";
import { buildFileTree, filterFilesByName } from "./vault-file-tree.ts";

describe("buildFileTree", () => {
  it("sorts folders before files and builds hierarchy", () => {
    const tree = buildFileTree(
      [
        { path: "notes/a.md", title: "A" },
        { path: "readme.md", title: "Readme" },
      ],
      ["notes"],
    );
    expect(tree.length).toBe(2);
    expect(tree[0].folderPath).toBe("notes");
    expect(tree[1].filePath).toBe("readme.md");
    expect(tree[0].children[0].filePath).toBe("notes/a.md");
  });
});

describe("filterFilesByName", () => {
  it("filters by path and title", () => {
    const files = [
      { path: "runbook.md", title: "Runbook" },
      { path: "other.md", title: "Other" },
    ];
    expect(filterFilesByName(files, "run").map((f) => f.path)).toEqual(["runbook.md"]);
    expect(filterFilesByName(files, "book").map((f) => f.path)).toEqual(["runbook.md"]);
  });
});
