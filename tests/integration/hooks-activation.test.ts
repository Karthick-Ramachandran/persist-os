import { execFileSync } from "node:child_process";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

function git(rootDir: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" }).trim();
}

function hooksPath(rootDir: string): string | null {
  try {
    return git(rootDir, "config", "--get", "core.hooksPath");
  } catch {
    return null;
  }
}

/**
 * ADR-0014. The printed `git config core.hooksPath` step was the one people skipped, and with it
 * the fence question and the push gate silently never ran. Init now takes the step when agreed
 * (the default), never over another tool's hooks, and doctor tells every other clone.
 */
describe("git hooks activation", () => {
  const roots: string[] = [];

  async function gitRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    git(rootDir, "init", "-q");
    return rootDir;
  }

  beforeEach(() => {
    vi.stubEnv("CI", "");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("switches the hooks on with --yes and says so", async () => {
    const rootDir = await gitRoot("hooks-yes");

    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(hooksPath(rootDir)).toBe(".persist/hooks");
    expect(result.stdout).toContain("Git hooks switched on for this clone");
  });

  it("leaves git config alone with --no-enable-hooks and prints the command", async () => {
    const rootDir = await gitRoot("hooks-opt-out");

    const result = await runInitCommand(rootDir, ["--yes", "--no-enable-hooks"]);

    expect(hooksPath(rootDir)).toBeNull();
    expect(result.stdout).toContain(
      "Git hooks are not switched on. Turn them on once per clone: git config core.hooksPath .persist/hooks",
    );
  });

  it("never replaces another hooks tool's core.hooksPath", async () => {
    const rootDir = await gitRoot("hooks-husky");
    git(rootDir, "config", "core.hooksPath", ".husky");

    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(hooksPath(rootDir)).toBe(".husky");
    expect(result.stdout).toContain("core.hooksPath is already set to .husky");
  });

  it("changes nothing under --dry-run", async () => {
    const rootDir = await gitRoot("hooks-dry");

    const result = await runInitCommand(rootDir, ["--yes", "--dry-run"]);

    expect(hooksPath(rootDir)).toBeNull();
    expect(result.stdout).toContain("Would switch the git hooks on for this clone");
  });

  it("explains the step when the folder is not a git repository yet", async () => {
    const rootDir = await createTempRoot("hooks-not-git");
    roots.push(rootDir);

    const result = await runInitCommand(rootDir, ["--yes"]);

    expect(result.stdout).toContain(
      "Not a git repository yet. After git init, switch the hooks on",
    );
  });

  it("warns in a clone where the hooks are off, with the command to fix it", async () => {
    const rootDir = await gitRoot("hooks-doctor-off");
    await runInitCommand(rootDir, ["--yes", "--no-enable-hooks"]);

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "hooks-active", status: "evaluated" });
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "hooks-active",
        message: expect.stringContaining("git config core.hooksPath .persist/hooks"),
      }),
    );
  });

  it("is quiet once the hooks are on", async () => {
    const rootDir = await gitRoot("hooks-doctor-on");
    await runInitCommand(rootDir, ["--yes"]);

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "hooks-active", status: "evaluated" });
    expect(report.findings.filter((finding) => finding.check === "hooks-active")).toEqual([]);
  });

  it("notes another hooks tool as info, not a warning", async () => {
    const rootDir = await gitRoot("hooks-doctor-other");
    git(rootDir, "config", "core.hooksPath", ".husky");
    await runInitCommand(rootDir, ["--yes"]);

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({ severity: "info", check: "hooks-active" }),
    );
  });

  it("stands down in CI, where hooks are never switched on", async () => {
    // The generated workflow fails on warnings; a CI checkout never has hooks, so warning there
    // would turn every repository's CI red for nothing.
    const rootDir = await gitRoot("hooks-doctor-ci");
    await runInitCommand(rootDir, ["--yes", "--no-enable-hooks"]);
    vi.stubEnv("CI", "true");

    const report = await runDoctor(rootDir);
    const result = await runCommand(rootDir, ["doctor"]);

    expect(report.checks).toContainEqual({
      id: "hooks-active",
      status: "not-evaluated",
      reason: expect.stringContaining("CI"),
    });
    expect(result.stdout).not.toContain("Git hooks are not switched on");
  });
});
