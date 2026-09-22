import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import { createTempRoot, removeTempRoot, runInitCommand } from "../helpers/init-test-helpers.js";

/**
 * Many repositories keep one rules file and link the others to it (Saleor links CLAUDE.md to
 * AGENTS.md). Doctor checked with lstat, saw a link rather than a file, and reported CLAUDE.md as
 * missing: an error, so the pre-commit hook blocked every commit in those repositories.
 */
describe("doctor with symlinked memory", () => {
  const roots: string[] = [];
  const outside: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
    await Promise.all(outside.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  async function repoWithLinkedClaude(): Promise<string> {
    const rootDir = await createTempRoot("doctor-symlink");
    roots.push(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Our rules\n", "utf8");
    await symlink("AGENTS.md", path.join(rootDir, "CLAUDE.md"));
    await runInitCommand(rootDir, ["--yes"]);
    return rootDir;
  }

  it("counts a CLAUDE.md linked to AGENTS.md as present", async () => {
    const rootDir = await repoWithLinkedClaude();

    const report = await runDoctor(rootDir);

    expect(report.findings.filter((f) => f.severity === "error")).toEqual([]);
    expect(report.findings.some((f) => f.path === "CLAUDE.md" && /missing/u.test(f.message))).toBe(
      false,
    );
  });

  it("lets a commit through the pre-commit hook", async () => {
    const rootDir = await repoWithLinkedClaude();
    const git = (...args: string[]) => execFileSync("git", args, { cwd: rootDir, stdio: "pipe" });
    git("init", "-q");
    git("config", "user.email", "t@e.x");
    git("config", "user.name", "T");
    git("config", "core.hooksPath", ".persist/hooks");
    const bin = await mkdtemp(path.join(tmpdir(), "persist-bin-"));
    outside.push(bin);
    await writeFile(
      path.join(bin, "persist"),
      `#!/bin/sh\nexec node ${JSON.stringify(path.resolve("dist/cli.js"))} "$@"\n`,
      { mode: 0o755 },
    );
    git("add", "-A");

    const commit = () =>
      execFileSync("git", ["commit", "-q", "-m", "Add memory"], {
        cwd: rootDir,
        stdio: "pipe",
        env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}` },
      });

    expect(commit).not.toThrow();
  });

  it("still treats a link that points outside the repository as missing", async () => {
    const rootDir = await createTempRoot("doctor-symlink-outside");
    roots.push(rootDir);
    const elsewhere = await mkdtemp(path.join(tmpdir(), "persist-elsewhere-"));
    outside.push(elsewhere);
    await writeFile(path.join(elsewhere, "CLAUDE.md"), "# Not this repository's\n", "utf8");
    await symlink(path.join(elsewhere, "CLAUDE.md"), path.join(rootDir, "CLAUDE.md"));
    await runInitCommand(rootDir, ["--yes"]);

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({ severity: "error", path: "CLAUDE.md" }),
    );
  });

  it("treats a dangling link as missing", async () => {
    const rootDir = await createTempRoot("doctor-symlink-dangling");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await rm(path.join(rootDir, "CLAUDE.md"));
    await symlink("NOPE.md", path.join(rootDir, "CLAUDE.md"));

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({ severity: "error", path: "CLAUDE.md" }),
    );
  });

  it("counts linked always-loaded text once against the budget", async () => {
    const rootDir = await createTempRoot("doctor-symlink-budget");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    // Pad AGENTS.md to just over half the budget; counted twice it would exceed 24 KB.
    const agents = path.join(rootDir, "AGENTS.md");
    await writeFile(
      agents,
      `${await readFile(agents, "utf8")}\n${"x".repeat(13 * 1024)}\n`,
      "utf8",
    );
    await rm(path.join(rootDir, "CLAUDE.md"));
    await rm(path.join(rootDir, ".cursor"), { recursive: true, force: true });
    await symlink("AGENTS.md", path.join(rootDir, "CLAUDE.md"));

    const report = await runDoctor(rootDir);

    expect(report.findings.filter((f) => f.check === "context-budget")).toEqual([]);
  });
});
