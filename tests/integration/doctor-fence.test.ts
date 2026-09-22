import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

function git(rootDir: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
}

async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

async function setFenceEnabled(rootDir: string, enabled: boolean): Promise<void> {
  const configPath = path.join(rootDir, ".persist/config.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
  config.fenceEnabled = enabled;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

describe("doctor fence integration", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("fires a fence warning through runDoctor on a staged source change", async () => {
    const rootDir = await createRoot("fence-fires");
    await runInitCommand(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    await write(rootDir, "src/ledger.ts", "export const ledger = 1;\n");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "init", "--no-verify");
    // A staged edit of a tracked file crosses; a staged brand-new file never does.
    await write(rootDir, "src/ledger.ts", "export const ledger = 2;\n");
    git(rootDir, "add", "src/ledger.ts");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(report.findings).toContainEqual(
      expect.objectContaining({ severity: "warning", check: "fence", path: "src/ledger.ts" }),
    );
  });

  it("stays quiet for a staged brand-new file through runDoctor", async () => {
    const rootDir = await createRoot("fence-new-quiet");
    await runInitCommand(rootDir);
    git(rootDir, "init");
    await write(rootDir, "src/ledger.ts", "export const ledger = 1;\n");
    git(rootDir, "add", "src/ledger.ts");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(report.findings.filter((finding) => finding.check === "fence")).toEqual([]);
  });

  /**
   * An initialised repository with one commit, marked as pushed: a local branch stands in for
   * the upstream, so "unpushed" means "committed after this point".
   */
  async function pushedRepo(prefix: string): Promise<string> {
    const rootDir = await createRoot(prefix);
    await runInitCommand(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-m", "init");
    git(rootDir, "branch", "pushed");
    git(rootDir, "branch", "--set-upstream-to=pushed");
    return rootDir;
  }

  it("asks about a crossing that was committed without the hook", async () => {
    // Hooks off, the agent commits, then runs doctor as evidence. Judging the empty staged set
    // passed a change that never met the fence; the unpushed commits are what is pending.
    // The file must predate the pushed marker: a file committed after it is added, not edited.
    const rootDir = await pushedRepo("fence-unpushed");
    await write(rootDir, "src/split.ts", "export const split = 1;\n");
    git(rootDir, "add", "src/split.ts");
    git(rootDir, "commit", "-m", "add split");
    git(rootDir, "branch", "-f", "pushed", "HEAD");
    await write(rootDir, "src/split.ts", "export const split = 2;\n");
    git(rootDir, "add", "src/split.ts");
    git(rootDir, "commit", "-m", "change split");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "fence",
        path: "src/split.ts",
        message: expect.stringContaining("Unpushed change crosses the Chesterton fence"),
      }),
    );
  });

  it("stays quiet for an unpushed commit that only adds files", async () => {
    // Added files never cross, in the unpushed commits exactly as in the staged set.
    const rootDir = await pushedRepo("fence-unpushed-added");
    await write(rootDir, "src/split.ts", "export const split = 1;\n");
    git(rootDir, "add", "src/split.ts");
    git(rootDir, "commit", "-m", "add split");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(report.findings.filter((finding) => finding.check === "fence")).toEqual([]);
  });

  it("stops asking once the crossing is pushed", async () => {
    const rootDir = await pushedRepo("fence-pushed");
    await write(rootDir, "src/split.ts", "export const split = 1;\n");
    git(rootDir, "add", "src/split.ts");
    git(rootDir, "commit", "-m", "change split");
    git(rootDir, "branch", "-f", "pushed", "HEAD");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(report.findings.filter((finding) => finding.check === "fence")).toEqual([]);
  });

  it("judges only the staged set when something is staged", async () => {
    // The pre-commit hook's view is unchanged: the unpushed add stays quiet and unrepeated,
    // and only the staged edit is judged.
    const rootDir = await pushedRepo("fence-staged-wins");
    await write(rootDir, "src/split.ts", "export const split = 1;\n");
    git(rootDir, "add", "src/split.ts");
    git(rootDir, "commit", "-m", "change split");
    await write(rootDir, "src/ledger.ts", "export const ledger = 1;\n");
    git(rootDir, "add", "src/ledger.ts");
    git(rootDir, "commit", "-q", "-m", "add ledger", "--no-verify");
    await write(rootDir, "src/ledger.ts", "export const ledger = 2;\n");
    git(rootDir, "add", "src/ledger.ts");

    const report = await runDoctor(rootDir);
    const fencePaths = report.findings
      .filter((finding) => finding.check === "fence")
      .map((finding) => finding.path);

    expect(fencePaths).toEqual(["src/ledger.ts"]);
  });

  it("treats a commit that only deletes as staged, not as nothing staged", async () => {
    // Deletions need no fence, but they are still a commit in progress: falling through to the
    // "nothing staged" path would misreport a deletion-only commit as having no change at all.
    const rootDir = await createRoot("fence-delete-only");
    await runInitCommand(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-m", "init");
    git(rootDir, "rm", "-q", "docs/00-product/PRODUCT.md");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(report.findings.filter((finding) => finding.check === "fence")).toEqual([]);
  });

  it("reports not-evaluated when nothing is staged and there is no upstream", async () => {
    const rootDir = await createRoot("fence-no-upstream");
    await runInitCommand(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-m", "init");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({
      id: "fence",
      status: "not-evaluated",
      reason: expect.stringContaining("no upstream"),
    });
  });

  it("reports not-evaluated for a disabled fence and exits without fence findings", async () => {
    const rootDir = await createRoot("fence-off");
    await runInitCommand(rootDir);
    await setFenceEnabled(rootDir, false);
    git(rootDir, "init");
    await write(rootDir, "src/ledger.ts", "export const ledger = 1;\n");
    git(rootDir, "add", "src/ledger.ts");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({
      id: "fence",
      status: "not-evaluated",
      reason: expect.stringContaining("disabled"),
    });
    expect(report.findings.filter((finding) => finding.check === "fence")).toEqual([]);

    const result = await runCommand(rootDir, ["doctor", "--json"]);
    const parsed = JSON.parse(result.stdout) as {
      checks: { id: string; status: string; reason?: string }[];
    };
    expect(parsed.checks.find((check) => check.id === "fence")?.status).toBe("not-evaluated");
  });
});
