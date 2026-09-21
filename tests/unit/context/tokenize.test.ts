import { describe, expect, it } from "vitest";

import { tokenize } from "../../../src/core/context/tokenize.js";

describe("context tokenizer", () => {
  it("lowercases and splits on non-alphanumerics", () => {
    expect(tokenize("Who pays the extra CENT?")).toEqual(["pay", "extra", "cent"]);
  });

  it("splits camelCase and snake_case", () => {
    expect(tokenize("splitEvenly")).toEqual(["split", "evenly"]);
    expect(tokenize("shares_for")).toEqual(["share"]);
  });

  it("drops the fixed stopword list, including generic task verbs", () => {
    expect(tokenize("make rounding fair")).toEqual(["round", "fair"]);
    expect(tokenize("how do I change this")).toEqual([]);
  });

  it("strips plural and verb suffixes", () => {
    expect(tokenize("shares totals members expenses")).toEqual([
      "share",
      "total",
      "member",
      "expense",
    ]);
    expect(tokenize("pennies")).toEqual(["penny"]);
    expect(tokenize("splitting rounding stopped")).toEqual(["split", "round", "stop"]);
  });

  it("keeps short tokens and numbers intact", () => {
    expect(tokenize("tip ADR-0001")).toEqual(["tip", "adr", "0001"]);
  });
});
