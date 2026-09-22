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
});
