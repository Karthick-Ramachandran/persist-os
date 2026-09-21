import { describe, expect, it } from "vitest";

import { editDistance, suggestCorrection } from "../../../src/core/context/spelling.js";
import { tokenize } from "../../../src/core/context/tokenize.js";

function vocab(words: [string, number][]): Map<string, number> {
  return new Map(words);
}

describe("context spelling correction", () => {
  it("corrects one-edit typos in medium words", () => {
    const words = vocab([
      ["login", 3],
      ["realtime", 2],
      ["session", 5],
    ]);
    expect(suggestCorrection("logn", words)).toBe("login");
    expect(suggestCorrection("realtme", words)).toBe("realtime");
    // The pipeline stems before suggesting, so "sesions" arrives here as
    // "sesion" — one insertion from "session". (Raw "sesions" is genuinely
    // two edits away: a deletion plus an insertion.)
    expect(suggestCorrection("sesion", words)).toBe("session");
  });

  it("counts an adjacent transposition as one edit", () => {
    // Plain Levenshtein scores "replya" → "replay" as 2, which would reject a
    // 6-letter word. Damerau keeps typo correction useful for real slips.
    expect(editDistance("replya", "replay")).toBe(1);
    expect(editDistance("logn", "login")).toBe(1);
    expect(editDistance("kitten", "sitting")).toBe(3);
    expect(suggestCorrection("replya", vocab([["replay", 1]]))).toBe("replay");
  });

  it("allows two edits only for longer words", () => {
    const words = vocab([
      ["session", 5],
      ["realtime", 2],
    ]);
    // 7 letters, two edits away: too far.
    expect(suggestCorrection("sxxsion", words)).toBeNull();
    // 8 letters, two edits away: correctable.
    expect(suggestCorrection("rxxltime", words)).toBe("realtime");
  });

  it("leaves short words and real words alone", () => {
    // "tea" is absent from the vocabulary on purpose: length 3 alone must refuse.
    const words = vocab([["login", 3]]);
    expect(suggestCorrection("tea", words)).toBeNull();
    expect(suggestCorrection("login", words)).toBeNull();
    expect(suggestCorrection("zzzzzz", words)).toBeNull();
  });

  it("corrects sesions through the real pipeline order", () => {
    // The review's example only works because stemming runs first.
    expect(tokenize("sesions")).toEqual(["sesion"]);
    expect(suggestCorrection("sesion", vocab([["session", 5]]))).toBe("session");
  });

  it("breaks distance ties by frequency, then alphabetically", () => {
    expect(
      suggestCorrection(
        "abcx",
        vocab([
          ["abcd", 1],
          ["abce", 1],
        ]),
      ),
    ).toBe("abcd");
    expect(
      suggestCorrection(
        "abcx",
        vocab([
          ["abcd", 1],
          ["abce", 5],
        ]),
      ),
    ).toBe("abce");
  });
});
