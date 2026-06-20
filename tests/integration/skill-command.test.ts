import { mkdir, readFile, writeFile } from "node:fs/promises";
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

    const result = await runCommand(rootDir, ["skill", "create", "write-tests"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("(from catalog)");

    const claudeSkill = await readFile(
      path.join(rootDir, ".claude/skills/write-tests/SKILL.md"),
      "utf8",
    );
    const agentsSkill = await readFile(
      path.join(rootDir, ".agents/skills/write-tests/SKILL.md"),
      "utf8",
    );
    expect(claudeSkill).toContain("name: write-tests");
    expect(agentsSkill).toBe(claudeSkill);
  });

  it("lists catalog skills", async () => {
    const rootDir = await createRoot("skill-list");

    const result = await runCommand(rootDir, ["skill", "list"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("write-tests");
    expect(result.stdout).toContain("security-review");
  });

  it("writes nothing on dry run", async () => {
    const rootDir = await createRoot("skill-dry-run");

    const result = await runCommand(rootDir, ["skill", "create", "write-tests", "--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).not.toContain(".claude/skills/write-tests/SKILL.md");
  });

  it("skips an existing skill unless forced", async () => {
    const rootDir = await createRoot("skill-skip");
    await mkdir(path.join(rootDir, ".claude/skills/write-tests"), { recursive: true });
    await writeFile(path.join(rootDir, ".claude/skills/write-tests/SKILL.md"), "custom\n", "utf8");

    const result = await runCommand(rootDir, ["skill", "create", "write-tests"]);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, ".claude/skills/write-tests/SKILL.md"), "utf8")).toBe(
      "custom\n",
    );
  });
});
