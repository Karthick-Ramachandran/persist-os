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
/**
 * The 1.0 retirements that stayed retired in 1.4.0, with the skill that absorbed each
 * one's job. The other five 1.0 names came back as catalog skills (`implement-task`,
 * `write-tests`, `create-adr`, `completion-report`) or are still generated on demand
 * (`capture-mcp-context`, via `persist mcp add`), so doctor stays silent for them.
 */
const STILL_RETIRED: ReadonlyMap<string, string> = new Map([
  ["create-prd", "plan-feature"],
  ["plan-module", "module-memory"],
  ["update-module-memory", "module-memory"],
  ["architecture-drift-review", "drift-review"],
]);

const RESTORED_IDS = ["implement-task", "write-tests", "create-adr", "completion-report"];

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
    // The short loop cuts reading, never authority: pointers are a start, and ADRs beat cards.
    expect(agents).toContain("The pointers are where to start, not the limit of what applies");
    expect(agents).toContain("when a card disagrees with an ADR, the ADR wins");
    expect(agents).toContain("repository rules override model preference");
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

  it("restored ids are catalog skills again, not retired skeletons", () => {
    for (const name of RESTORED_IDS) {
      expect(getCatalogSkill(name), name).toBeDefined();
    }
  });

  it("still-retired ids fall through to the skeleton instead of the catalog", () => {
    for (const name of STILL_RETIRED.keys()) {
      expect(getCatalogSkill(name), name).toBeUndefined();
    }
  });

  it("still-retired skills point at their replacement in the doctor message", async () => {
    const rootDir = await initializedRepo();
    const { checkRetiredSkills } =
      await import("../../../src/core/doctor/checks/retired-skills-check.js");
    const { createDefaultConfig } = await import("../../../src/core/config/default-config.js");
    const { mkdir, writeFile } = await import("node:fs/promises");

    for (const name of STILL_RETIRED.keys()) {
      const full = path.join(rootDir, ".agents/skills", name, "SKILL.md");
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, "# Skill\n", "utf8");
    }

    const { findings } = await checkRetiredSkills({
      rootDir,
      config: createDefaultConfig(),
    });

    for (const [name, replacement] of STILL_RETIRED) {
      const finding = findings.find((entry) => entry.path === `.agents/skills/${name}/SKILL.md`);
      expect(finding, name).toBeDefined();
      expect(finding?.message).toContain(`"${replacement}"`);
    }
  });

  it("a restored name on disk stays silent instead of reporting retired", async () => {
    const rootDir = await initializedRepo();
    const { checkRetiredSkills } =
      await import("../../../src/core/doctor/checks/retired-skills-check.js");
    const { createDefaultConfig } = await import("../../../src/core/config/default-config.js");

    const { findings } = await checkRetiredSkills({
      rootDir,
      config: createDefaultConfig(),
    });

    // A fresh init writes the catalog skills (including the restored names) to disk;
    // none of them may be reported as retired.
    for (const name of RESTORED_IDS) {
      expect(
        findings.filter((finding) => finding.message.includes(`"${name}"`)),
        name,
      ).toEqual([]);
    }
  });

  it("loads the Stop and ask block and the source-of-truth order into AGENTS.md and the Cursor rule", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");
    const cursor = readFileSync(path.join(rootDir, ".cursor/rules/persist-memory.mdc"), "utf8");

    for (const content of [agents, cursor]) {
      expect(content).toContain("Stop and ask");
      expect(content).toContain("a new runtime dependency");
      expect(content).toContain("unclear to write a test");
      expect(content).toContain("a fix would change an accepted non-goal");
      expect(content).toContain("Accepted ADRs and repository decisions");
      expect(content).toContain("Chat history");
      expect(content).toContain("If two sources conflict, stop and report the conflict");
      expect(content).toContain("is the default for any code change");
      expect(content).toContain("drift-review");
    }
  });
});
