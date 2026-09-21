import { describe, expect, it } from "vitest";

import { matchesPattern } from "../../../src/core/adr/governing-adrs.js";

describe("Applies To path patterns", () => {
  it("treats a plain path as a file or a whole directory", () => {
    expect(matchesPattern("src/lib", "src/lib/money.ts")).toBe(true);
    expect(matchesPattern("src/lib/", "src/lib/deep/split.ts")).toBe(true);
    expect(matchesPattern("src/lib/money.ts", "src/lib/money.ts")).toBe(true);
    // A shared prefix is not a directory.
    expect(matchesPattern("src/lib", "src/library/x.ts")).toBe(false);
  });

  it("lets ** span directories and * stay within one", () => {
    expect(matchesPattern("src/**", "src/a/b/c.ts")).toBe(true);
    expect(matchesPattern("src/**/*.ts", "src/money.ts")).toBe(true);
    expect(matchesPattern("src/**/*.ts", "src/a/b/money.ts")).toBe(true);
    expect(matchesPattern("src/*.ts", "src/a/money.ts")).toBe(false);
    expect(matchesPattern("src/*.ts", "src/money.ts")).toBe(true);
  });

  it("escapes dots so a pattern cannot match more than it says", () => {
    expect(matchesPattern("src/*.ts", "src/moneyxts")).toBe(false);
  });
});
