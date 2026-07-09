import { describe, expect, it } from "vitest";
import { WIN_OPENOCTA_APPDATA, WIN_OPENOCTA_WORKSPACE } from "./platform-paths.ts";

describe("platform-paths", () => {
  it("preserves Windows backslashes for display", () => {
    expect(WIN_OPENOCTA_WORKSPACE).toBe("%APPDATA%\\openocta\\workspace");
    expect(WIN_OPENOCTA_APPDATA).toBe("%APPDATA%\\openocta");
  });
});
