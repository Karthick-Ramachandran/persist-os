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

describe("guard command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("fails when staged source changed without tests", async () => {
    const rootDir = await createRoot("guard-fail");
    await initRepo(rootDir);
    await write(rootDir, "src/sum.ts");
    git(rootDir, "add", "src/sum.ts");

    const result = await runCommand(rootDir, ["guard", "--source", "src"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("src/sum.ts");
    expect(result.stdout).toContain("without any accompanying test");
  });

  it("passes when staged source is accompanied by a test", async () => {
    const rootDir = await createRoot("guard-pass");
    await initRepo(rootDir);
    await write(rootDir, "src/sum.ts");
    await write(rootDir, "src/sum.test.ts");
    git(rootDir, "add", "-A");

    const result = await runCommand(rootDir, ["guard", "--source", "src"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("passed");
  });

  it("passes when only non-source files changed", async () => {
    const rootDir = await createRoot("guard-nonsource");
    await initRepo(rootDir);
    await write(rootDir, "README.md");
    git(rootDir, "add", "-A");

    const result = await runCommand(rootDir, ["guard", "--source", "src"]);

    expect(result.exitCode).toBe(0);
  });

  it("skips when no --source is given", async () => {
    const rootDir = await createRoot("guard-skip-source");
    await initRepo(rootDir);

    const result = await runCommand(rootDir, ["guard"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("skipped");
  });

  it("skips gracefully outside a git repository", async () => {
    const rootDir = await createRoot("guard-skip-git");

    const result = await runCommand(rootDir, ["guard", "--source", "src"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("skipped");
  });
});
