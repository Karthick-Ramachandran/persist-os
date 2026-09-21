import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { searchContext } from "../../../src/core/context/search.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

function card(sections: {
  title: string;
  purpose: string;
  answers: string[];
  alsoKnownAs: string[];
  startHere: string[];
  appliesTo: string[];
}): string {
  return [
    `# ${sections.title}`,
    "",
    "## Purpose",
    "",
    sections.purpose,
    "",
    "## Answers",
    "",
    ...sections.answers.map((a) => `- ${a}`),
    "",
    "## Also Known As",
    "",
    ...sections.alsoKnownAs.map((a) => `- ${a}`),
    "",
    "## Start Here",
    "",
    ...sections.startHere.map((s) => `- \`${s}\` — entry point`),
    "",
    "## Rules",
    "",
    "## Pitfalls",
    "",
    "## Applies To",
    "",
    ...sections.appliesTo.map((s) => `- \`${s}\``),
    "",
  ].join("\n");
}

describe("context search bridge and corrections", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function gitRepo(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    execFileSync("git", ["init", "-q"], { cwd: rootDir, stdio: "ignore" });
    return rootDir;
  }

  async function reportsRepo(prefix: string): Promise<string> {
    // The card covers src/reports/** but no line of it stems to "sav": the
    // only evidence for that stem is the tracked file name below ("saved" →
    // "sav", the same strip the file name gets).
    const rootDir = await gitRepo(prefix);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/reports.md"),
      card({
        title: "Reports",
        purpose: "Monthly output area.",
        answers: ["monthly sales summary"],
        alsoKnownAs: ["reporting"],
        startHere: ["src/reports/index.ts"],
        appliesTo: ["src/reports/**"],
      }),
      "utf8",
    );
    await mkdir(path.join(rootDir, "src/reports"), { recursive: true });
    await writeFile(
      path.join(rootDir, "src/reports/saved-analytics-routes.ts"),
      "export const routes = 1;\n",
      "utf8",
    );
    execFileSync("git", ["add", "-A"], { cwd: rootDir, stdio: "ignore" });
    return rootDir;
  }

  it("stays silent when only the file-name bridge fires", async () => {
    // "saved" stems to "sav", matching the tracked file name — but no card
    // line stems that way. The old boost cleared the threshold on its own and
    // printed an empty matched line; a bridge that invents relevance is not a
    // bridge.
    const rootDir = await reportsRepo("search-bridge-silent");

    const found = await searchContext(rootDir, "saved", {
      docsDir: "docs",
      adrDir: "docs/adrs",
    });

    expect(found.cards).toEqual([]);
  });

  it("still boosts a genuine match and names the bridged file", async () => {
    const rootDir = await reportsRepo("search-bridge-named");

    const found = await searchContext(rootDir, "monthly summary saved", {
      docsDir: "docs",
      adrDir: "docs/adrs",
    });

    expect(found.cards).toHaveLength(1);
    expect(found.cards[0]?.matched).toEqual(["monthly", "summary"]);
    expect(found.cards[0]?.bridge).toEqual(["src/reports/saved-analytics-routes.ts"]);
  });

  it("corrects a typo on the fallback pass and shows the correction", async () => {
    // Corrections run only when exact search finds no card: a single typo'd
    // word clears nothing exactly, so the fallback corrects it. A query whose
    // clean words already match never reaches the corrector.
    const rootDir = await gitRepo("search-typo");
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/money.md"),
      card({
        title: "Money",
        purpose: "How amounts move.",
        answers: ["reimburse travel costs", "reimburse client dinners"],
        alsoKnownAs: ["payments"],
        startHere: ["src/money/ledger.ts"],
        appliesTo: ["src/money/**"],
      }),
      "utf8",
    );

    const found = await searchContext(rootDir, "reimbruse", {
      docsDir: "docs",
      adrDir: "docs/adrs",
    });

    expect(found.cards).toHaveLength(1);
    expect(found.cards[0]?.matched).toContain("reimbruse≈reimburse");
  });

  it("leaves exact matches untouched by the corrector", async () => {
    const rootDir = await gitRepo("search-exact-untouched");
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/money.md"),
      card({
        title: "Money",
        purpose: "How amounts move.",
        answers: ["reimburse travel costs", "reimburse client dinners"],
        alsoKnownAs: ["payments"],
        startHere: ["src/money/ledger.ts"],
        appliesTo: ["src/money/**"],
      }),
      "utf8",
    );

    const found = await searchContext(rootDir, "reimburse travel", {
      docsDir: "docs",
      adrDir: "docs/adrs",
    });

    expect(found.cards).toHaveLength(1);
    expect(found.cards[0]?.matched).toEqual(["reimburse", "travel"]);
  });
});
