import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { getCatalogSkill } from "../../../src/core/skills/skill-catalog.js";
import { createTempRoot, removeTempRoot, runInitCommand } from "../../helpers/init-test-helpers.js";

/**
 * Fence agent rules, pinned by phrase the way the content-routing tests pin
 * theirs: a Proposed ADR never clears the fence, and no ADR is written just
 * to quiet a warning.
 */
describe("fence agent rules", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function initializedRepo(): Promise<string> {
    const rootDir = await createTempRoot("fence-rules");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    return rootDir;
  }

  const SENTENCE_PARTS = [
    "A Proposed ADR does not clear the fence",
    "it is reported for review until a human accepts it",
    "Never write an ADR just to quiet a fence warning",
  ];

  it("states the Proposed-ADR rule in generated AGENTS.md and the Cursor rule", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");
    const cursor = readFileSync(path.join(rootDir, ".cursor/rules/persist-memory.mdc"), "utf8");

    // Flattened: both rules wrap the sentence across lines.
    for (const content of [agents, cursor].map((text) => text.replace(/\s+/gu, " "))) {
      for (const phrase of SENTENCE_PARTS) {
        expect(content, phrase).toContain(phrase);
      }
    }
  });

  it("carries the Proposed-ADR rule in the chestertons-fence skill", () => {
    const skill = getCatalogSkill("chestertons-fence");
    const text = [
      skill?.description,
      ...((skill?.workflow ?? []) as string[]),
      ...((skill?.decisions ?? []) as string[]),
    ].join("\n");

    for (const phrase of SENTENCE_PARTS) {
      expect(text, phrase).toContain(phrase);
    }
  });

  it("asks one question per file with both answers ready in generated AGENTS.md and the Cursor rule", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");
    const cursor = readFileSync(path.join(rootDir, ".cursor/rules/persist-memory.mdc"), "utf8");

    for (const content of [agents, cursor].map((text) => text.replace(/\s+/gu, " "))) {
      // Human present: ask before handing back, quoting the warning's lines.
      expect(content).toContain("one question per file");
      expect(content).toContain("quoting the warning's lines");
      // Both ready-to-run answers, and never the agent's own pick.
      expect(content).toContain("--no-constraint");
      expect(content).toContain("never pick the answer yourself");
      // Unattended: the Needs your review list carries the question and both commands.
      expect(content).toContain("Needs your review");
      // Capture: a reason given in conversation is recorded right then.
      expect(content).toContain("record it with `persist fence add` right then");
    }
    // The generated AGENTS.md keeps the worked example with its ranges.
    expect(agents.replace(/\s+/gu, " ")).toContain("(lines 12-18) deliberate?");
  });

  it("states one done rule in generated AGENTS.md and the Cursor rule", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");
    const cursor = readFileSync(path.join(rootDir, ".cursor/rules/persist-memory.mdc"), "utf8");

    for (const content of [agents, cursor].map((text) => text.replace(/\s+/gu, " "))) {
      // Done when doctor reports no errors, the tests pass, and every warning is
      // fixed or listed under Needs your review — PASSED is the goal, not a
      // condition an agent can meet without a human.
      expect(content).toContain("reports no errors");
      expect(content).toContain("Needs your review with what the human has to decide");
      expect(content).toContain("`PASSED` is the goal");
    }
    for (const content of [agents, cursor]) {
      expect(content).not.toContain("Work is done only when `persist doctor` reports PASSED");
    }
  });

  it("records the accidental outcome with --no-constraint in the chestertons-fence skill", () => {
    const skill = getCatalogSkill("chestertons-fence");
    const text = [
      skill?.description,
      ...((skill?.workflow ?? []) as string[]),
      ...((skill?.decisions ?? []) as string[]),
      ...((skill?.verification ?? []) as string[]),
    ].join("\n");

    // All three outcomes and their records: fenced, answered, or deferred.
    expect(text).toContain("persist fence add <path> --no-constraint --by <name>");
    expect(text).toContain("deferred with nothing recorded");
    // Not knowing still records nothing.
    expect(text).toContain("record nothing; a confident guess is worse than an empty file");
  });
});
