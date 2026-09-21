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

  it("strips stacked suffixes until the stem stops changing", () => {
    // One strip turns "recordings" into "recording" while the card holds
    // "record" — a plural -ings word could never meet its own root. "settings"
    // lands on "sett", not "set": the collapse floor that protects
    // "called" → "call" refuses, and both sides stem the same way regardless.
    expect(tokenize("recordings meetings bookings settings")).toEqual([
      "record",
      "meet",
      "book",
      "sett",
    ]);
    expect(tokenize("mornings kings evenings")).toEqual(["morn", "king", "even"]);
  });

  it("strips the bare plural only once per token", () => {
    // The loop bound: "class" keeps the single strip it always had instead of
    // eroding further.
    expect(tokenize("class glass")).toEqual(["clas", "glas"]);
  });

  it("strips nominal suffixes so derived nouns meet their roots", () => {
    // "reimbursement" must tokenize like "reimburse" — otherwise a task about
    // getting paid back never meets a card written about reimbursing.
    expect(tokenize("reimbursement reimbursements")).toEqual(["reimburse", "reimburse"]);
    expect(tokenize("registration registrations")).toEqual(["registr", "registr"]);
  });

  it("leaves short -ment words whole instead of guessing", () => {
    // A length guard, not a dictionary: "moment" and "comment" keep their shape
    // while longer derivations still strip.
    expect(tokenize("moment comment payments station")).toEqual([
      "moment",
      "comment",
      "payment",
      "station",
    ]);
  });
});
