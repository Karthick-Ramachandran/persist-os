import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { detectPreCommitGates } from "../../../src/core/hooks/detect-gates.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("detectPreCommitGates", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writePackageJson(rootDir: string, scripts: Record<string, string>): Promise<void> {
    await mkdir(rootDir, { recursive: true });
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({ name: "x", scripts }, null, 2),
      "utf8",
    );
  }

  it("returns an empty list when there is no package.json", async () => {
    const rootDir = await createRoot("detect-no-package");
    expect(await detectPreCommitGates(rootDir)).toEqual([]);
  });

  it("proposes pnpm gates for known scripts when a pnpm lockfile exists", async () => {
    const rootDir = await createRoot("detect-pnpm");
    await writePackageJson(rootDir, { test: "vitest", typecheck: "tsc", build: "tsup" });
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual(["pnpm run test", "pnpm run typecheck"]);
  });

  it("uses npm when only a package-lock.json exists", async () => {
    const rootDir = await createRoot("detect-npm");
    await writePackageJson(rootDir, { test: "jest", lint: "eslint ." });
    await writeFile(path.join(rootDir, "package-lock.json"), "{}", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual(["npm run test", "npm run lint"]);
  });

  it("uses yarn when a yarn.lock exists", async () => {
    const rootDir = await createRoot("detect-yarn");
    await writePackageJson(rootDir, { typecheck: "tsc" });
    await writeFile(path.join(rootDir, "yarn.lock"), "", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual(["yarn run typecheck"]);
  });

  it("returns an empty list when package.json has no known scripts", async () => {
    const rootDir = await createRoot("detect-no-scripts");
    await writePackageJson(rootDir, { start: "node ." });

    expect(await detectPreCommitGates(rootDir)).toEqual([]);
  });

  it("returns an empty list when package.json is invalid", async () => {
    const rootDir = await createRoot("detect-bad-json");
    await mkdir(rootDir, { recursive: true });
    await writeFile(path.join(rootDir, "package.json"), "{ not json", "utf8");

    expect(await detectPreCommitGates(rootDir)).toEqual([]);
  });
});
