import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { inspectRepo } from "../../../src/core/adopt/inspect-repo.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("inspectRepo", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  it("detects TypeScript, pnpm, and Next.js", async () => {
    const rootDir = await createRoot("inspect-next");
    await write(
      rootDir,
      "package.json",
      JSON.stringify({ dependencies: { next: "14", react: "18" }, scripts: { test: "vitest" } }),
    );
    await write(rootDir, "tsconfig.json", "{}");
    await write(rootDir, "pnpm-lock.yaml", "");
    await write(rootDir, "README.md", "# x");

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toContain("TypeScript");
    expect(signals.packageManager).toBe("pnpm");
    expect(signals.frameworks).toContain("Next.js");
    expect(signals.hasTests).toBe(true);
    expect(signals.hasReadme).toBe(true);
  });

  it("detects Python and FastAPI from requirements", async () => {
    const rootDir = await createRoot("inspect-fastapi");
    await write(rootDir, "requirements.txt", "fastapi==0.110\nuvicorn\n");

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toContain("Python");
    expect(signals.frameworks).toContain("FastAPI");
  });

  it("returns empty signals for an empty repository", async () => {
    const rootDir = await createRoot("inspect-empty");

    const signals = await inspectRepo(rootDir);

    expect(signals.languages).toEqual([]);
    expect(signals.packageManager).toBeNull();
    expect(signals.frameworks).toEqual([]);
    expect(signals.hasTests).toBe(false);
    expect(signals.hasReadme).toBe(false);
  });
});
