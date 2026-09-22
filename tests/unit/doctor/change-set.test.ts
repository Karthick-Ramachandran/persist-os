import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { readChangeSet } from "../../../src/core/doctor/change-set.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

function git(rootDir: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
}

async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

/**
 * Doctor runs before work is called done, which is before commit — so with nothing staged
 * the change must include the uncommitted working tree, not just the unpushed commits.
 * The staged-only view is kept exactly as it is: the pre-commit hook judges only the
 * commit being made.
 */
describe("readChangeSet", () => {
  const roots: string[] = [];

  async function gitRepo(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    git(rootDir, "init", "-q");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    return rootDir;
  }

  /** One commit marked as pushed, so "unpushed" means "committed after this point". */
  async function pushedRepo(prefix: string): Promise<string> {
    const rootDir = await gitRepo(prefix);
    await write(rootDir, "base.txt", "base\n");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "init", "--no-verify");
    git(rootDir, "branch", "pushed");
    git(rootDir, "branch", "--set-upstream-to=pushed");
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("judges an uncommitted edit with nothing staged", async () => {
    const rootDir = await pushedRepo("changeset-worktree");
    await write(rootDir, "src/tip.ts", "export const tip = 1;\n");

    const change = await readChangeSet(rootDir);

    expect(change).toEqual({
      kind: "unpushed",
      paths: ["src/tip.ts"],
      statuses: { "src/tip.ts": "A" },
    });
  });

  it("unions unpushed commits with working-tree edits", async () => {
    const rootDir = await pushedRepo("changeset-union");
    await write(rootDir, "src/committed.ts", "export const a = 1;\n");
    git(rootDir, "add", "src/committed.ts");
    git(rootDir, "commit", "-q", "-m", "committed", "--no-verify");
    await write(rootDir, "src/uncommitted.ts", "export const b = 2;\n");

    const change = await readChangeSet(rootDir);

    expect(change.kind).toBe("unpushed");
    expect(change.kind === "unpushed" ? [...change.paths].sort() : []).toEqual([
      "src/committed.ts",
      "src/uncommitted.ts",
    ]);
    expect(change.kind === "unpushed" ? change.statuses : {}).toEqual({
      "src/committed.ts": "A",
      "src/uncommitted.ts": "A",
    });
  });

  it("judges the staged set alone when something is staged", async () => {
    const rootDir = await pushedRepo("changeset-staged");
    await write(rootDir, "src/committed.ts", "export const a = 1;\n");
    git(rootDir, "add", "src/committed.ts");
    git(rootDir, "commit", "-q", "-m", "committed", "--no-verify");
    await write(rootDir, "src/staged.ts", "export const b = 2;\n");
    git(rootDir, "add", "src/staged.ts");
    await write(rootDir, "src/unstaged.ts", "export const c = 3;\n");

    const change = await readChangeSet(rootDir);

    expect(change).toEqual({
      kind: "staged",
      paths: ["src/staged.ts"],
      statuses: { "src/staged.ts": "A" },
    });
  });

  it("includes untracked files and excludes ignored ones", async () => {
    const rootDir = await pushedRepo("changeset-untracked");
    await write(rootDir, ".gitignore", "ignored.log\n");
    await write(rootDir, "src/new.ts", "export const n = 1;\n");
    await write(rootDir, "ignored.log", "noise\n");

    const change = await readChangeSet(rootDir);

    expect(change.kind).toBe("unpushed");
    const paths = change.kind === "unpushed" ? change.paths : [];
    expect(paths).toContain("src/new.ts");
    expect(paths).not.toContain("ignored.log");
  });

  it("evaluates working-tree edits alone when there is no upstream", async () => {
    const rootDir = await gitRepo("changeset-no-upstream");
    await write(rootDir, "base.txt", "base\n");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "init", "--no-verify");
    await write(rootDir, "src/tip.ts", "export const tip = 1;\n");

    const change = await readChangeSet(rootDir);

    expect(change).toEqual({
      kind: "working-tree",
      paths: ["src/tip.ts"],
      statuses: { "src/tip.ts": "A" },
    });
  });

  it("reports no-upstream only when the tree is clean too", async () => {
    const rootDir = await gitRepo("changeset-clean-no-upstream");
    await write(rootDir, "base.txt", "base\n");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "init", "--no-verify");

    expect(await readChangeSet(rootDir)).toEqual({ kind: "no-upstream" });
  });

  it("reports not-git outside a work tree", async () => {
    const rootDir = await createTempRoot("changeset-not-git");
    roots.push(rootDir);

    expect(await readChangeSet(rootDir)).toEqual({ kind: "not-git" });
  });

  it("carries a modified status for a staged edit of a tracked file", async () => {
    const rootDir = await pushedRepo("changeset-modified");
    await write(rootDir, "src/tip.ts", "export const tip = 1;\n");
    git(rootDir, "add", "src/tip.ts");
    git(rootDir, "commit", "-q", "-m", "tip", "--no-verify");
    await write(rootDir, "src/tip.ts", "export const tip = 2;\n");
    git(rootDir, "add", "src/tip.ts");

    expect(await readChangeSet(rootDir)).toEqual({
      kind: "staged",
      paths: ["src/tip.ts"],
      statuses: { "src/tip.ts": "M" },
    });
  });

  it("judges a staged rename as its new path with a renamed status", async () => {
    const rootDir = await pushedRepo("changeset-rename");
    await write(rootDir, "src/old.ts", "export const old = 1;\n");
    git(rootDir, "add", "src/old.ts");
    git(rootDir, "commit", "-q", "-m", "old", "--no-verify");
    git(rootDir, "mv", "src/old.ts", "src/new.ts");

    expect(await readChangeSet(rootDir)).toEqual({
      kind: "staged",
      paths: ["src/new.ts"],
      statuses: { "src/new.ts": "R" },
    });
  });
});
