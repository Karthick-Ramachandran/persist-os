import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createTempRoot, removeTempRoot, runCommand } from "../helpers/init-test-helpers.js";

function git(rootDir: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
}

async function initRepo(rootDir: string): Promise<void> {
  git(rootDir, "init");
  git(rootDir, "config", "user.email", "test@example.com");
  git(rootDir, "config", "user.name", "Test");
}

async function write(rootDir: string, relativePath: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, "// content\n", "utf8");
}

describe("guard --source auto-detect", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("auto-detects src without --source and fails without tests", async () => {
    const rootDir = await createRoot("guard-auto-src");
    await initRepo(rootDir);
    await write(rootDir, "src/sum.ts");
    git(rootDir, "add", "src/sum.ts");

    const result = await runCommand(rootDir, ["guard"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("without any accompanying test");
    expect(result.stdout).toContain("auto-detected");
    expect(result.stdout).toContain("src/sum.ts");
  });

  it("auto-detected guard passes when tests accompany the change", async () => {
    const rootDir = await createRoot("guard-auto-pass");
    await initRepo(rootDir);
    await write(rootDir, "src/sum.ts");
    await write(rootDir, "src/sum.test.ts");
    git(rootDir, "add", "-A");

    const result = await runCommand(rootDir, ["guard"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("passed");
    expect(result.stdout).toContain("auto-detected");
  });

  it("auto-detects app and packages/*/src", async () => {
    const rootDir = await createRoot("guard-auto-multi");
    await initRepo(rootDir);
    await write(rootDir, "app/page.ts");
    await write(rootDir, "packages/api/src/index.ts");
    git(rootDir, "add", "-A");

    // No test files staged: both auto-detected dirs should gate.
    const failed = await runCommand(rootDir, ["guard"]);
    expect(failed.exitCode).toBe(1);
    expect(failed.stdout).toContain("app/page.ts");

    await write(rootDir, "app/page.test.ts");
    git(rootDir, "add", "-A");
    const passed = await runCommand(rootDir, ["guard"]);
    expect(passed.exitCode).toBe(0);
  });

  it("skips loudly when no --source and no conventional dirs exist", async () => {
    const rootDir = await createRoot("guard-auto-none");
    await initRepo(rootDir);

    const result = await runCommand(rootDir, ["guard"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("skipped");
    expect(result.stdout).toContain("no conventional source directories");
    expect(result.stdout).toContain("pass --source");
  });

  it("explicit --source still wins over auto-detect", async () => {
    const rootDir = await createRoot("guard-explicit");
    await initRepo(rootDir);
    await write(rootDir, "src/sum.ts");
    git(rootDir, "add", "src/sum.ts");

    const result = await runCommand(rootDir, ["guard", "--source", "lib"]);

    // src changed but only lib is guarded, so it passes without auto-detect noise.
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("passed");
    expect(result.stdout).not.toContain("auto-detected");
  });
});
