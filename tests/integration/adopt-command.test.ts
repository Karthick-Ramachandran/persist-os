import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
} from "../helpers/init-test-helpers.js";

describe("adopt command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeRepo(rootDir: string): Promise<void> {
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({ dependencies: { next: "14" }, scripts: { test: "vitest" } }),
      "utf8",
    );
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");
    await writeFile(path.join(rootDir, "tsconfig.json"), "{}", "utf8");
  }

  it("proposes reviewable memory without an existing config", async () => {
    const rootDir = await createRoot("adopt-basic");
    await writeRepo(rootDir);

    const result = await runCommand(rootDir, ["adopt"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Recall OS adopt complete.");
    expect(result.stdout).toContain("require human review");

    const report = await readFile(path.join(rootDir, "docs/adopt/ADOPTION_REPORT.md"), "utf8");
    expect(report).toContain("## Status\n\nProposed.");

    const adr = await readFile(
      path.join(rootDir, "docs/adrs/proposed/ADR-PROPOSED-adopt-nextjs.md"),
      "utf8",
    );
    expect(adr).toContain("## Status\n\nProposed");
  });

  it("writes nothing on dry run", async () => {
    const rootDir = await createRoot("adopt-dry-run");
    await writeRepo(rootDir);

    const result = await runCommand(rootDir, ["adopt", "--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/adopt/ADOPTION_REPORT.md");
  });

  it("skips an existing adoption report unless forced", async () => {
    const rootDir = await createRoot("adopt-skip");
    await writeRepo(rootDir);
    await mkdir(path.join(rootDir, "docs/adopt"), { recursive: true });
    await writeFile(path.join(rootDir, "docs/adopt/ADOPTION_REPORT.md"), "custom\n", "utf8");

    const result = await runCommand(rootDir, ["adopt"]);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "docs/adopt/ADOPTION_REPORT.md"), "utf8")).toBe(
      "custom\n",
    );
  });
});
