import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  readGeneratedFile,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * `init` owns the LESSONS.md shape but never a user's lessons: it creates the
 * sectioned template when missing and leaves an existing file alone — even
 * under `--reinit --force`, which rewrites everything else.
 */
describe("init LESSONS.md", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("writes the sectioned template with Always, an example area, and the tiers comment", async () => {
    const rootDir = await createTempRoot("init-lessons-template");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);

    const lessons = await readGeneratedFile(rootDir, "docs/60-engineering/LESSONS.md");
    expect(lessons).toContain("## Always");
    expect(lessons).toContain("## Example area");
    expect(lessons).toContain("Applies To:");
    expect(lessons).toContain("Also Known As:");
    expect(lessons).toContain("Always loads into every session");
    expect(lessons).toContain("the rest are only indexed");
  });

  it("never rewrites an existing LESSONS.md, even with --reinit --force", async () => {
    const rootDir = await createTempRoot("init-lessons-keep");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);

    const edited = "# Lessons\n\n## Always\n\n- Our hard-won lesson.\n";
    await writeFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), edited, "utf8");

    const result = await runCommand(rootDir, ["init", "--reinit", "--force", "--yes"]);
    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), "utf8")).toBe(
      edited,
    );
  });
});
