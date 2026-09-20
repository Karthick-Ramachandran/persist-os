import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

/**
 * The loop this command exists to close: a fence warning names a path, a human answers why, and
 * from then on the reason is handed back instead of the question. Anything less than the full
 * round trip leaves the fence recording nothing, which is where 1.1 started.
 */
describe("persist fence add", () => {
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

  async function repoWithStagedChange(prefix: string): Promise<string> {
    const rootDir = await createRoot(prefix);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    await runInitCommand(rootDir, ["--yes"]);

    await mkdir(path.join(rootDir, "src"), { recursive: true });
    await writeFile(path.join(rootDir, "src/billing.ts"), "export const writes = 4;\n", "utf8");
    git(rootDir, "add", "src/billing.ts");
    return rootDir;
  }

  it("turns a fence warning into a recorded reason that comes back", async () => {
    const rootDir = await repoWithStagedChange("fence-add-loop");

    const before = await runCommand(rootDir, ["doctor"]);
    expect(before.stdout).toContain("crosses the Chesterton fence");

    const added = await runCommand(rootDir, [
      "fence",
      "add",
      "src/billing.ts",
      "--why",
      "Four collection writes are deliberate.",
    ]);
    expect(added.exitCode).toBe(0);

    const after = await runCommand(rootDir, ["doctor"]);
    // The question is gone and the answer is in its place.
    expect(after.stdout).not.toContain("crosses the Chesterton fence");
    expect(after.stdout).toContain("Four collection writes are deliberate.");
  });

  it("matches a symbol-suffixed fence against the file that changed", async () => {
    // A fence may name a symbol; a diff is per-file. Keying on the full `path:symbol` string
    // meant a suffixed fence recorded cleanly and then never fired — the shape of bug where
    // something looks like it works and does nothing.
    const rootDir = await repoWithStagedChange("fence-add-suffix");

    await runCommand(rootDir, [
      "fence",
      "add",
      "src/billing.ts:writeLedger",
      "--why",
      "Symbol-scoped reason.",
    ]);

    const after = await runCommand(rootDir, ["doctor"]);
    expect(after.stdout).toContain("Symbol-scoped reason.");
    expect(after.stdout).not.toContain("crosses the Chesterton fence");
  });

  it("records who confirmed it and a linked decision", async () => {
    const rootDir = await repoWithStagedChange("fence-add-by-adr");

    await runCommand(rootDir, [
      "fence",
      "add",
      "src/billing.ts",
      "--why",
      "Deliberate.",
      "--by",
      "Karthick",
      "--adr",
      "ADR-0007",
    ]);

    const fences = await readGeneratedFile(rootDir, "docs/60-engineering/FENCES.md");
    expect(fences).toContain("recorded by Karthick.");
    expect(fences).toContain("Decision: ADR-0007");
  });

  it("fences a second path without disturbing the first", async () => {
    const rootDir = await repoWithStagedChange("fence-add-second");

    await runCommand(rootDir, ["fence", "add", "src/billing.ts", "--why", "First reason."]);
    await runCommand(rootDir, ["fence", "add", "src/auth.ts", "--why", "Second reason."]);

    const fences = await readGeneratedFile(rootDir, "docs/60-engineering/FENCES.md");
    expect(fences).toContain("Why: First reason.");
    expect(fences).toContain("Why: Second reason.");
  });

  it("appends a crossing when the same path is fenced again", async () => {
    const rootDir = await repoWithStagedChange("fence-add-again");

    await runCommand(rootDir, ["fence", "add", "src/billing.ts", "--why", "Standing reason."]);
    await runCommand(rootDir, ["fence", "add", "src/billing.ts", "--why", "Later attempt."]);

    const fences = await readGeneratedFile(rootDir, "docs/60-engineering/FENCES.md");
    // One heading, the original reason, and two dated crossings.
    expect(fences.split("## `src/billing.ts`")).toHaveLength(2);
    expect(fences).toContain("Why: Standing reason.");
    expect(fences).not.toContain("Why: Later attempt.");
  });

  it("never writes FENCES.md on init", async () => {
    // ADR-0010: the file starts empty and grows through use. Nothing generates it. init names
    // the path in its status line, which is guidance rather than generation — so this asserts
    // on the filesystem, not the output.
    const rootDir = await createRoot("fence-add-not-generated");
    await runInitCommand(rootDir, ["--yes"]);

    const files = await listRelativeFiles(rootDir);
    expect(files).not.toContain("docs/60-engineering/FENCES.md");
  });

  it("refuses a fence with no reason", async () => {
    const rootDir = await repoWithStagedChange("fence-add-no-why");

    const result = await runCommand(rootDir, ["fence", "add", "src/billing.ts"]);

    expect(result.exitCode).not.toBe(0);
  });

  it("writes nothing on --dry-run", async () => {
    const rootDir = await repoWithStagedChange("fence-add-dry");

    const result = await runCommand(rootDir, [
      "fence",
      "add",
      "src/billing.ts",
      "--why",
      "Deliberate.",
      "--dry-run",
    ]);

    expect(result.exitCode).toBe(0);
    const after = await runCommand(rootDir, ["doctor"]);
    expect(after.stdout).toContain("crosses the Chesterton fence");
  });
});
