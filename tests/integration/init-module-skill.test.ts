import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkContextBudget } from "../../src/core/doctor/checks/context-budget-check.js";
import { createDefaultConfig } from "../../src/core/config/default-config.js";
import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * The `module-memory` skill is the one conditional catalog skill: it is generated only
 * when module memory is enabled (`--modules`, or a modules directory that already
 * exists). `persist skill create module-memory` still adds it to any repository.
 */
describe("module-memory skill gating", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("omits module-memory without --modules", async () => {
    const rootDir = await createRoot("modskill-off");
    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".claude/skills/plan-feature/SKILL.md");
    expect(files).not.toContain(".claude/skills/module-memory/SKILL.md");
    expect(files).not.toContain(".agents/skills/module-memory/SKILL.md");
  });

  it("generates module-memory with --modules", async () => {
    const rootDir = await createRoot("modskill-on");
    const result = await runInitCommand(rootDir, ["--yes", "--modules"]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".claude/skills/module-memory/SKILL.md");
    expect(files).toContain(".agents/skills/module-memory/SKILL.md");
  });

  it("generates module-memory when a modules directory already exists", async () => {
    const rootDir = await createRoot("modskill-existing");
    await mkdir(path.join(rootDir, "docs/30-modules"), { recursive: true });
    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toContain(".claude/skills/module-memory/SKILL.md");
  });

  it("adds one module-memory skill with skill create", async () => {
    const rootDir = await createRoot("modskill-create");
    await runInitCommand(rootDir, ["--yes"]);

    const result = await runCommand(rootDir, ["skill", "create", "module-memory"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("(from catalog)");
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".claude/skills/module-memory/SKILL.md");
    expect(files).toContain(".agents/skills/module-memory/SKILL.md");
  });

  it("keeps the always-loaded budget quiet on a fresh init", async () => {
    const rootDir = await createRoot("modskill-budget");
    await runInitCommand(rootDir, ["--yes", "--features", "--modules"]);

    const findings = await checkContextBudget({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
  });

  it("adds missing skills without touching existing ones on re-init", async () => {
    const rootDir = await createRoot("modskill-reinit");
    await runInitCommand(rootDir, ["--yes"]);
    const custom = path.join(rootDir, ".claude/skills/plan-feature/SKILL.md");
    await writeFile(custom, "custom\n", "utf8");

    const result = await runInitCommand(rootDir, ["--yes", "--modules"]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".claude/skills/module-memory/SKILL.md");
    const { readFile } = await import("node:fs/promises");
    expect(await readFile(custom, "utf8")).toBe("custom\n");
  });
});
