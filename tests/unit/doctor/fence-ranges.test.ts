import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkFence } from "../../../src/core/doctor/checks/fence-check.js";
import type { DoctorCheckContext } from "../../../src/core/doctor/doctor-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

/**
 * The warning asks a question someone can answer: it names the old-side line
 * ranges the diff rewrites (with git's hunk context), the insertion points of
 * a pure addition, or `binary change` — and carries `ranges` in JSON.
 */
describe("fence warning ranges", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  function contextFor(rootDir: string): DoctorCheckContext {
    return {
      rootDir,
      config: {
        docsDir: "docs",
        featuresDir: "docs/40-features",
        modulesDir: "docs/30-modules",
        adrDir: "docs/adrs",
      },
    };
  }

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  function git(rootDir: string, args: string[]): void {
    execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
  }

  function commitAll(rootDir: string, message: string): void {
    git(rootDir, ["config", "user.email", "test@example.com"]);
    git(rootDir, ["config", "user.name", "Test"]);
    git(rootDir, ["add", "-A"]);
    git(rootDir, ["commit", "-q", "-m", message, "--no-verify"]);
  }

  async function fenceFindings(rootDir: string) {
    const { findings } = await checkFence(contextFor(rootDir));
    return findings.filter((finding) => finding.check === "fence");
  }

  it("names the old-side ranges and hunk context for a modification", async () => {
    const rootDir = await createRoot("fence-ranges-modify");
    git(rootDir, ["init"]);
    await write(
      rootDir,
      "src/split.ts",
      "export function splitEvenly(items) {\n  return items;\n}\nexport function settleUp(ledger) {\n  return ledger;\n}\n",
    );
    commitAll(rootDir, "base");
    await write(
      rootDir,
      "src/split.ts",
      "export function splitEvenly(items) {\n  return [...items];\n}\nexport function settleUp(ledger) {\n  return null;\n}\n",
    );
    git(rootDir, ["add", "src/split.ts"]);

    const fence = await fenceFindings(rootDir);

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "warning", path: "src/split.ts" });
    expect(fence[0]?.message).toContain("rewrites existing code in src/split.ts");
    expect(fence[0]?.message).toContain("line 2 (in `export function splitEvenly(items) {`)");
    expect(fence[0]?.message).toContain("line 5 (in `export function settleUp(ledger) {`)");
    expect(fence[0]?.message).toContain(
      "persist fence add src/split.ts --no-constraint --by <name>",
    );
    expect(fence[0]?.ranges).toEqual([
      { start: 2, end: 2, context: "export function splitEvenly(items) {" },
      { start: 5, end: 5, context: "export function settleUp(ledger) {" },
    ]);
  });

  it("names the insertion points for a pure addition", async () => {
    const rootDir = await createRoot("fence-ranges-add");
    git(rootDir, ["init"]);
    await write(rootDir, "src/ledger.ts", "export function writeLedger(db) {\n  return db;\n}\n");
    commitAll(rootDir, "base");
    await write(
      rootDir,
      "src/ledger.ts",
      "export function writeLedger(db) {\n  if (!db) return null;\n  return db;\n}\n",
    );
    git(rootDir, ["add", "src/ledger.ts"]);

    const fence = await fenceFindings(rootDir);

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "warning", path: "src/ledger.ts" });
    // New-side line 2: the guard is the second line of the file now. The old-side
    // anchor (1) is the line it follows, which the reader did not change.
    expect(fence[0]?.message).toContain("adds lines at 2");
    expect(fence[0]?.ranges).toEqual([
      { start: 2, end: 2, context: "export function writeLedger(db) {" },
    ]);
  });

  it("numbers insertions as they stand in the file, including the first line", async () => {
    // Every insertion used to be reported at the line it follows: an insertion at the top
    // of a file named line 0, which no file has, and later ones drifted further as earlier
    // insertions pushed the lines down.
    const rootDir = await createRoot("fence-ranges-add-many");
    git(rootDir, ["init"]);
    await write(rootDir, "src/x.ts", "const a = 1;\nconst b = 2;\nconst c = 3;\n");
    commitAll(rootDir, "base");
    await write(
      rootDir,
      "src/x.ts",
      "// top\nconst a = 1;\nconst b = 2;\n// middle\nconst c = 3;\n// end\n",
    );
    git(rootDir, ["add", "src/x.ts"]);

    const fence = await fenceFindings(rootDir);

    expect(fence[0]?.message).toContain("adds lines at 1, 4, 6");
    expect(fence[0]?.ranges?.map((range) => range.start)).toEqual([1, 4, 6]);
  });

  it("says binary change for a binary file", async () => {
    const rootDir = await createRoot("fence-ranges-binary");
    git(rootDir, ["init"]);
    const full = path.join(rootDir, "src/logo.bin");
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from([0x00, 0x01, 0x02]));
    commitAll(rootDir, "base");
    await writeFile(full, Buffer.from([0x00, 0x01, 0x03]));
    git(rootDir, ["add", "src/logo.bin"]);

    const fence = await fenceFindings(rootDir);

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "warning", path: "src/logo.bin" });
    expect(fence[0]?.message).toContain("binary change");
  });

  it("shows at most three ranges, then and N more", async () => {
    const rootDir = await createRoot("fence-ranges-cap");
    git(rootDir, ["init"]);
    // Four separated edits: adjacent changes would merge into one hunk.
    const before = Array.from({ length: 20 }, (_, index) => `line${index + 1} = ${index + 1};`);
    await write(rootDir, "src/big.ts", `${before.join("\n")}\n`);
    commitAll(rootDir, "base");
    const after = [...before];
    for (const line of [1, 6, 11, 16]) {
      after[line - 1] = `line${line} = ${line * 10};`;
    }
    await write(rootDir, "src/big.ts", `${after.join("\n")}\n`);
    git(rootDir, ["add", "src/big.ts"]);

    const fence = await fenceFindings(rootDir);

    expect(fence).toHaveLength(1);
    expect(fence[0]?.message).toContain("and 1 more");
    expect(fence[0]?.message).not.toContain("line 16");
    expect(fence[0]?.ranges).toHaveLength(4);
  });

  it("produces correct ranges for the working-tree change set", async () => {
    const rootDir = await createRoot("fence-ranges-worktree");
    git(rootDir, ["init"]);
    await write(rootDir, "src/split.ts", "export const x = 1;\nexport const y = 2;\n");
    commitAll(rootDir, "base");
    await write(rootDir, "src/split.ts", "export const x = 10;\nexport const y = 2;\n");

    const fence = await fenceFindings(rootDir);

    expect(fence).toHaveLength(1);
    expect(fence[0]?.message).toContain("Uncommitted change rewrites existing code");
    expect(fence[0]?.message).toContain("line 1");
    expect(fence[0]?.ranges).toEqual([{ start: 1, end: 1, context: "" }]);
  });

  it("produces correct ranges for the unpushed change set", async () => {
    const rootDir = await createRoot("fence-ranges-unpushed");
    git(rootDir, ["init"]);
    git(rootDir, ["config", "user.email", "test@example.com"]);
    git(rootDir, ["config", "user.name", "Test"]);
    await write(rootDir, "src/split.ts", "export const x = 1;\nexport const y = 2;\n");
    git(rootDir, ["add", "-A"]);
    git(rootDir, ["commit", "-q", "-m", "base", "--no-verify"]);
    git(rootDir, ["branch", "pushed"]);
    git(rootDir, ["branch", "--set-upstream-to=pushed"]);
    await write(rootDir, "src/split.ts", "export const x = 1;\nexport const y = 20;\n");
    git(rootDir, ["add", "src/split.ts"]);
    git(rootDir, ["commit", "-q", "-m", "change", "--no-verify"]);

    const fence = await fenceFindings(rootDir);

    expect(fence).toHaveLength(1);
    expect(fence[0]?.message).toContain("Unpushed change rewrites existing code");
    expect(fence[0]?.message).toContain("line 2");
    // Git's language-agnostic hunk context falls back to the previous line here.
    expect(fence[0]?.ranges).toEqual([{ start: 2, end: 2, context: "export const x = 1;" }]);
  });

  it("judges a rename as its new path with ranges from the rename pair's diff", async () => {
    const rootDir = await createRoot("fence-ranges-rename");
    git(rootDir, ["init"]);
    // Large enough that one edited line still reads as a rename, not add+delete.
    const base = Array.from({ length: 10 }, (_, index) => `export const v${index} = ${index};`);
    await write(rootDir, "src/old.ts", `${base.join("\n")}\n`);
    commitAll(rootDir, "base");
    git(rootDir, ["mv", "src/old.ts", "src/new.ts"]);
    const changed = [...base];
    changed[0] = "export const v0 = 100;";
    await write(rootDir, "src/new.ts", `${changed.join("\n")}\n`);
    git(rootDir, ["add", "-A"]);

    const fence = await fenceFindings(rootDir);

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "warning", path: "src/new.ts" });
    expect(fence[0]?.message).toContain("rewrites existing code in src/new.ts");
    expect(fence[0]?.message).toContain("line 1");
  });
});
