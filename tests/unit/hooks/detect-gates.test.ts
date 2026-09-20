import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  detectPreCommitGates,
  detectPrePushGates,
  detectTestCommand,
  isWatchCommand,
} from "../../../src/core/hooks/detect-gates.js";
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

describe("detectTestCommand", () => {
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

  it("prefers test:run over test in a Vitest repository", async () => {
    const rootDir = await createRoot("detect-vitest");
    await writePackageJson(rootDir, { test: "vitest", "test:run": "vitest run" });
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");

    expect(await detectTestCommand(rootDir)).toBe("pnpm run test:run");
  });

  it("never selects a bare watch-mode test script", async () => {
    const rootDir = await createRoot("detect-watch");
    await writePackageJson(rootDir, { test: "vitest" });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("selects test when it is one-shot, as with Jest", async () => {
    const rootDir = await createRoot("detect-jest");
    await writePackageJson(rootDir, { test: "jest" });

    expect(await detectTestCommand(rootDir)).toBe("npm run test");
  });

  it("rejects a test script with a watch flag", async () => {
    const rootDir = await createRoot("detect-jest-watch");
    await writePackageJson(rootDir, { test: "jest --watch" });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("returns null with no package.json rather than guessing", async () => {
    const rootDir = await createRoot("detect-nopackage");

    expect(await detectTestCommand(rootDir)).toBeNull();
  });

  it("returns null when package.json has neither variant", async () => {
    const rootDir = await createRoot("detect-neither");
    await writePackageJson(rootDir, { start: "node ." });

    expect(await detectTestCommand(rootDir)).toBeNull();
  });
});

describe("detectPrePushGates", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("detects typecheck and lint without repeating the test command", async () => {
    const rootDir = await createRoot("detect-push");
    await mkdir(rootDir, { recursive: true });
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify(
        {
          name: "x",
          scripts: { test: "vitest", "test:run": "vitest run", typecheck: "tsc", lint: "eslint ." },
        },
        null,
        2,
      ),
      "utf8",
    );
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");

    expect(await detectPrePushGates(rootDir)).toEqual(["pnpm run typecheck", "pnpm run lint"]);
  });

  it("returns an empty list with no package.json", async () => {
    const rootDir = await createRoot("detect-push-none");

    expect(await detectPrePushGates(rootDir)).toEqual([]);
  });
});

describe("isWatchCommand", () => {
  it("treats bare vitest as watch mode", () => {
    expect(isWatchCommand("vitest")).toBe(true);
  });

  it("treats --watch flags as watch mode", () => {
    expect(isWatchCommand("jest --watch")).toBe(true);
    expect(isWatchCommand("jest --watchAll")).toBe(false);
  });

  it("treats plain runners as one-shot", () => {
    expect(isWatchCommand("jest")).toBe(false);
    expect(isWatchCommand("vitest run")).toBe(false);
    expect(isWatchCommand("pytest")).toBe(false);
  });
});
