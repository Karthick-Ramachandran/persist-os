import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkRetiredSkills } from "../../../src/core/doctor/checks/retired-skills-check.js";
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

  it("warns with the removal command for a non-catalog skill", async () => {
    const rootDir = await createRoot("retired-present");
    await writeSkill(rootDir, ".agents/skills", "plan-feature");
    await writeSkill(rootDir, ".agents/skills", "old-custom-skill");

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(outcome).toEqual({ id: "retired-skills", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "retired-skills",
      path: ".agents/skills/old-custom-skill/SKILL.md",
    });
    expect(findings[0]?.message).toContain('"old-custom-skill"');
    expect(findings[0]?.message).toContain("rm -rf .agents/skills/old-custom-skill");
  });

  it("warns on each of the nine retired catalog ids", async () => {
    const rootDir = await createRoot("retired-nine");
    const retired = [
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
    for (const name of retired) {
      await writeSkill(rootDir, ".agents/skills", name);
    }

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(outcome).toEqual({ id: "retired-skills", status: "evaluated" });
    expect(findings).toHaveLength(retired.length);
    for (const name of retired) {
      expect(findings).toContainEqual(
        expect.objectContaining({
          severity: "warning",
          check: "retired-skills",
          path: `.agents/skills/${name}/SKILL.md`,
        }),
      );
      expect(
        findings.find((finding) => finding.path === `.agents/skills/${name}/SKILL.md`)?.message,
      ).toContain(`rm -rf .agents/skills/${name}`);
    }
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

  it("stays quiet when the skills directories are absent", async () => {
    const rootDir = await createRoot("retired-absent");

    const { findings, outcome } = await checkRetiredSkills(contextFor(rootDir));

    expect(outcome).toEqual({ id: "retired-skills", status: "evaluated" });
    expect(findings).toEqual([]);
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
