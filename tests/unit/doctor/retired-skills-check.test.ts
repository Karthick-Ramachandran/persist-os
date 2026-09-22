import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import {
  RETIRED_SKILL_NAMES,
  RETIRED_SKILL_REPLACEMENTS,
  checkRetiredSkills,
} from "../../../src/core/doctor/checks/retired-skills-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("retired-skills check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeSkill(rootDir: string, dir: string, name: string): Promise<void> {
    const full = path.join(rootDir, dir, name, "SKILL.md");
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, "# Skill\n", "utf8");
  }

  function contextFor(rootDir: string) {
    return { rootDir, config: createDefaultConfig() };
  }

  it("warns with the removal command and the replacement for a retired skill and stays silent for custom ones", async () => {
    const rootDir = await createRoot("retired-present");
    await writeSkill(rootDir, ".agents/skills", "plan-feature");
    await writeSkill(rootDir, ".agents/skills", "create-prd");
    await writeSkill(rootDir, ".agents/skills", "my-team-review");

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(outcome).toEqual({ id: "retired-skills", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "retired-skills",
      path: ".agents/skills/create-prd/SKILL.md",
    });
    expect(findings[0]?.message).toContain('"create-prd"');
    expect(findings[0]?.message).toContain('"plan-feature"');
    expect(findings[0]?.message).toContain("rm -rf .agents/skills/create-prd");
    expect(findings[0]?.message).not.toContain("hand-made");
  });

  it("warns on each of the four still-retired skill names and names the replacement", async () => {
    const rootDir = await createRoot("retired-four");
    const retired = [...RETIRED_SKILL_NAMES];
    expect(retired).toHaveLength(4);
    for (const name of retired) {
      await writeSkill(rootDir, ".agents/skills", name);
    }

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(outcome).toEqual({ id: "retired-skills", status: "evaluated" });
    expect(findings).toHaveLength(retired.length);
    for (const name of retired) {
      const message = findings.find(
        (finding) => finding.path === `.agents/skills/${name}/SKILL.md`,
      )?.message;
      expect(findings, name).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          check: "retired-skills",
          path: `.agents/skills/${name}/SKILL.md`,
        }),
      );
      expect(message, name).toContain(`rm -rf .agents/skills/${name}`);
      expect(message, name).toContain(`"${RETIRED_SKILL_REPLACEMENTS.get(name)}"`);
    }
  });

  it("stays silent for the names 1.4.0 brought back", async () => {
    const rootDir = await createRoot("retired-restored");
    for (const name of ["implement-task", "write-tests", "create-adr", "completion-report"]) {
      await writeSkill(rootDir, ".agents/skills", name);
    }
    await writeSkill(rootDir, ".agents/skills", "capture-mcp-context");

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(outcome).toEqual({ id: "retired-skills", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("stays quiet when every skill is in the catalog", async () => {
    const rootDir = await createRoot("retired-clean");
    await writeSkill(rootDir, ".claude/skills", "plan-feature");
    await writeSkill(rootDir, ".agents/skills", "security-review");
    await writeSkill(rootDir, ".agents/skills", "conventions-adherence");

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(outcome).toEqual({ id: "retired-skills", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("reports not-evaluated with reason when the skills directories are absent", async () => {
    const rootDir = await createRoot("retired-absent");

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
    expect(outcome.reason).toContain("no skills directories exist");
  });

  it("ignores stray files and directories without a SKILL.md", async () => {
    const rootDir = await createRoot("retired-stray");
    await mkdir(path.join(rootDir, ".agents/skills"), { recursive: true });
    await writeFile(path.join(rootDir, ".agents/skills/stray.txt"), "x\n", "utf8");
    await mkdir(path.join(rootDir, ".agents/skills/empty-dir"), { recursive: true });

    const { findings } = await checkRetiredSkills(contextFor(rootDir));

    expect(findings).toEqual([]);
  });
});
