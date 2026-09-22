import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { readAcceptedAdrs, matchesPattern } from "../../../src/core/adr/governing-adrs.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

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

describe("decision quotes", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function acceptAdr(rootDir: string, decision: string): Promise<string> {
    const adrDir = "docs/adrs";
    await mkdir(path.join(rootDir, adrDir), { recursive: true });
    await writeFile(
      path.join(rootDir, adrDir, "ADR-0001-money-is-integer-cents.md"),
      [
        "# ADR-0001: Money Is Integer Cents",
        "",
        "## Status",
        "",
        "Accepted",
        "",
        "## Decision",
        "",
        decision,
        "",
        "## Applies To",
        "",
        "- `src/lib/**`",
        "",
        "## Alternatives Considered",
        "",
        "Floats.",
        "",
        "## Consequences",
        "",
        "Rounding once.",
        "",
        "## Related Documents",
        "",
        "- None yet.",
        "",
      ].join("\n"),
      "utf8",
    );
    const [adr] = await readAcceptedAdrs(rootDir, adrDir);
    return adr?.decision ?? "";
  }

  async function repo(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  it("quotes a two-sentence first bullet whole instead of cutting the important words", async () => {
    const rootDir = await repo("quote-bullet");
    const decision = await acceptAdr(
      rootDir,
      "- Every amount is integer cents, including intermediate math. Never floats.",
    );

    expect(decision).toBe(
      "Every amount is integer cents, including intermediate math. Never floats.",
    );
  });

  it("quotes a multi-sentence first paragraph whole", async () => {
    const rootDir = await repo("quote-paragraph");
    const decision = await acceptAdr(
      rootDir,
      "Every amount is integer cents, including intermediate math. Never floats. Round once, where the fraction appears.",
    );

    expect(decision).toBe(
      "Every amount is integer cents, including intermediate math. Never floats. Round once, where the fraction appears.",
    );
  });

  it("caps a long decision near 300 characters at a word boundary", async () => {
    const rootDir = await repo("quote-cap");
    // Long words-free body: 40 repetitions, so any mid-word cut is detectable.
    const sentence = "All money handling uses integer cents everywhere. ";
    const decision = await acceptAdr(rootDir, sentence.repeat(40).trim());

    expect(decision.endsWith("…")).toBe(true);
    expect(decision.length).toBeLessThanOrEqual(301);
    const quoted = decision.slice(0, -1);
    expect(sentence.repeat(40).startsWith(quoted)).toBe(true);
    // The cut fell on a space: the next source character is not a word middle.
    expect(sentence.repeat(40)[quoted.length]).toBe(" ");
  });
});
