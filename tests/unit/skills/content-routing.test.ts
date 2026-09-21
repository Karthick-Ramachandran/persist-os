import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { SKILL_CATALOG, getCatalogSkill } from "../../../src/core/skills/skill-catalog.js";
import { createTempRoot, removeTempRoot, runInitCommand } from "../../helpers/init-test-helpers.js";

/**
 * Where the retired 0.x skills' substance went, checked against what a user's repository
 * actually receives. These tests used to read the Persist OS repository's own AGENTS.md and
 * docs/ai/, so they passed while the routed rules and links never reached a single user —
 * the ADR-compliance step of implement-task and architecture-drift-review among them.
 */
const RETIRED_IDS = [
  "create-prd",
  "create-adr",
  "plan-module",
  "implement-task",
  "write-tests",
  "update-module-memory",
  "completion-report",
  "capture-mcp-context",
  "architecture-drift-review",
];

describe("retired skill content routing", () => {
  const roots: string[] = [];

  async function initializedRepo(): Promise<string> {
    const rootDir = await createTempRoot("skill-routing");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes", "--features", "--modules"]);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("puts the ADR check from implement-task and architecture-drift-review in generated AGENTS.md", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");

    expect(agents).toContain("Never contradict an accepted ADR");
    expect(agents).toContain("check your changed lines against each governing decision");
  });

  it("routes the context lookup and card-update habit through AGENTS.md and the Cursor rule", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");
    const cursor = readFileSync(path.join(rootDir, ".cursor/rules/persist-memory.mdc"), "utf8");

    for (const content of [agents, cursor]) {
      expect(content).toContain('persist context "<task>"');
      expect(content).toContain("Answers list");
    }
  });

  it("carries the ADR check as its own skill", () => {
    const skill = getCatalogSkill("adr-compliance");

    expect(skill).toBeDefined();
    expect(skill?.workflow.join("\n")).toContain("Decision section in full");
    expect(skill?.workflow.join("\n")).toContain("fresh context");
  });

  it("links only to files a user's repository has", async () => {
    // A link that resolves only inside the Persist OS repository is a dead end for every user.
    // FENCES.md is the one exception: it is created by the first `persist fence add`.
    const rootDir = await initializedRepo();
    const createdLater = new Set(["docs/60-engineering/FENCES.md"]);

    for (const skill of SKILL_CATALOG) {
      for (const resource of skill.resources) {
        const target = /→\s*(\S+)/u.exec(resource)?.[1];
        if (target === undefined || createdLater.has(target)) {
          continue;
        }
        const optional = /when present/iu.test(resource);
        expect(existsSync(path.join(rootDir, target)) || optional, `${skill.name}: ${target}`).toBe(
          true,
        );
      }
    }
  });

  it("retired ids fall through to the skeleton instead of the catalog", () => {
    for (const name of RETIRED_IDS) {
      expect(getCatalogSkill(name), name).toBeUndefined();
    }
  });
});
