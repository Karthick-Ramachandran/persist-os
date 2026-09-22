import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * The init template once shipped example bullets under Always and an example area, so every
 * session of every new repository was handed "Always lessons: (example) Replace this line…",
 * and the example area's `src/example/**` scope pointed at nothing. The template now explains the
 * format in comments only, so a fresh repository hands agents no lessons until someone writes one.
 */
describe("the LESSONS.md init template", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function fresh(): Promise<string> {
    const rootDir = await createTempRoot("lessons-fresh");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    return rootDir;
  }

  it("contains no lesson bullets, only guidance in comments", async () => {
    const rootDir = await fresh();
    const lessons = await readFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), "utf8");

    expect(lessons).toContain("## Always");
    expect(lessons.split("\n").filter((line) => /^\s*[-*]\s/u.test(line))).toEqual([]);
  });

  it("injects no lessons at session start in a fresh repository", async () => {
    const rootDir = await fresh();

    const result = spawnSync("sh", [".claude/hooks/session-start.sh"], {
      cwd: rootDir,
      encoding: "utf8",
    });
    const context = (
      JSON.parse(result.stdout) as { hookSpecificOutput: { additionalContext: string } }
    ).hookSpecificOutput.additionalContext;

    expect(context).not.toContain("Always lessons");
  });

  it("hands no template text to a task lookup", async () => {
    const rootDir = await fresh();

    const result = await runCommand(rootDir, ["context", "fix the example area"]);

    expect(result.stdout).not.toMatch(/example/iu);
  });
});
