import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkIgnoredFiles } from "../../../src/core/doctor/checks/ignored-files-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor ignored-files check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  function git(rootDir: string, ...args: string[]): void {
    execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
  }

  async function gitRepo(prefix: string): Promise<string> {
    const rootDir = await createRoot(prefix);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    return rootDir;
  }

  it("warns for memory files git would not share", async () => {
    const rootDir = await gitRepo("ignored-shared");
    await writeFile(path.join(rootDir, "CLAUDE.md"), "# Claude\n", "utf8");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Agents\n", "utf8");
    await writeFile(path.join(rootDir, ".gitignore"), "CLAUDE.md\n.claude/\n", "utf8");

    const result = await checkIgnoredFiles({ rootDir, config: createDefaultConfig() });

    expect(result.outcome).toEqual({ id: "ignored-files", status: "evaluated" });
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "git-ignored",
        message: expect.stringContaining("will not be shared"),
        path: "CLAUDE.md",
      }),
    );
    // AGENTS.md is tracked: one ignored file, one finding.
    expect(result.findings).toHaveLength(1);
  });

  it("stays quiet when git shares everything", async () => {
    const rootDir = await gitRepo("ignored-clean");
    await writeFile(path.join(rootDir, "CLAUDE.md"), "# Claude\n", "utf8");

    const result = await checkIgnoredFiles({ rootDir, config: createDefaultConfig() });

    expect(result.outcome).toEqual({ id: "ignored-files", status: "evaluated" });
    expect(result.findings).toEqual([]);
  });

  it("reports not-evaluated outside a git repository", async () => {
    const rootDir = await createRoot("ignored-nogit");
    await writeFile(path.join(rootDir, "CLAUDE.md"), "# Claude\n", "utf8");

    const result = await checkIgnoredFiles({ rootDir, config: createDefaultConfig() });

    expect(result.findings).toEqual([]);
    expect(result.outcome).toEqual({
      id: "ignored-files",
      status: "not-evaluated",
      reason: expect.stringContaining("not a git repository"),
    });
  });

  it("skips ignored paths that do not exist — missing is required-files' error", async () => {
    const rootDir = await gitRepo("ignored-missing");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Agents\n", "utf8");
    // CLAUDE.md is required for the default tools but absent here: required-files errors
    // on it, so an ignore warning on top would double-report the same file.
    await writeFile(path.join(rootDir, ".gitignore"), "CLAUDE.md\n", "utf8");

    const result = await checkIgnoredFiles({ rootDir, config: createDefaultConfig() });

    expect(result.findings).toEqual([]);
  });
});
