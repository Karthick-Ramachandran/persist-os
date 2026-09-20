import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
} from "../helpers/init-test-helpers.js";

describe("skill command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("creates a catalog skill in both targets", async () => {
    const rootDir = await createRoot("skill-create");

    const result = await runCommand(rootDir, ["skill", "create", "plan-feature"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("(from catalog)");

    const claudeSkill = await readFile(
      path.join(rootDir, ".claude/skills/plan-feature/SKILL.md"),
      "utf8",
    );
    const agentsSkill = await readFile(
      path.join(rootDir, ".agents/skills/plan-feature/SKILL.md"),
      "utf8",
    );
    expect(claudeSkill).toContain("name: plan-feature");
    expect(agentsSkill).toBe(claudeSkill);
  });

  it("writes skill scripts as executable files", async () => {
    const rootDir = await createRoot("skill-scripts");

    const result = await runCommand(rootDir, ["skill", "create", "security-review"]);

    expect(result.exitCode).toBe(0);

    for (const scriptPath of [
      ".claude/skills/security-review/scripts/scan-secrets.sh",
      ".agents/skills/security-review/scripts/scan-secrets.sh",
    ]) {
      const stats = await stat(path.join(rootDir, scriptPath));
      expect(stats.isFile()).toBe(true);
      expect(stats.mode & 0o777).toBe(0o755);
    }
  });

  it("lists exactly the three catalog skills", async () => {
    const rootDir = await createRoot("skill-list");

    const result = await runCommand(rootDir, ["skill", "list"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("plan-feature");
    expect(result.stdout).toContain("security-review");
    expect(result.stdout).toContain("conventions-adherence");
    expect(result.stdout).not.toContain("write-tests");
    expect(result.stdout).not.toContain("create-adr");
  });

  it("writes nothing on dry run", async () => {
    const rootDir = await createRoot("skill-dry-run");

    const result = await runCommand(rootDir, ["skill", "create", "plan-feature", "--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).not.toContain(".claude/skills/plan-feature/SKILL.md");
  });

  it("skips an existing skill unless forced", async () => {
    const rootDir = await createRoot("skill-skip");
    await mkdir(path.join(rootDir, ".claude/skills/plan-feature"), { recursive: true });
    await writeFile(path.join(rootDir, ".claude/skills/plan-feature/SKILL.md"), "custom\n", "utf8");

    const result = await runCommand(rootDir, ["skill", "create", "plan-feature"]);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, ".claude/skills/plan-feature/SKILL.md"), "utf8")).toBe(
      "custom\n",
    );
  });
});
