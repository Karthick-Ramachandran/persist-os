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

/**
 * Doctor runs before work is called done — before commit — so with nothing staged it
 * must judge the uncommitted working tree, not the empty staged set. The staged-only
 * view stays exactly as it is for the pre-commit hook.
 */
describe("doctor judges uncommitted work", () => {
  const roots: string[] = [];

  async function pushedRepo(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    git(rootDir, "init", "-q");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "init", "--no-verify");
    git(rootDir, "branch", "pushed");
    git(rootDir, "branch", "--set-upstream-to=pushed");
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("names an uncommitted edit with nothing staged", async () => {
    const rootDir = await pushedRepo("worktree-fence");
    await write(rootDir, "src/tip.ts", "export const tip = 1;\n");

    const report = await runDoctor(rootDir);
    const fence = report.findings.filter((finding) => finding.check === "fence");

    expect(report.checks).toContainEqual({ id: "fence", status: "evaluated" });
    expect(fence.map((finding) => finding.path)).toContain("src/tip.ts");
  });

  it("names an untracked file and ignores an ignored one", async () => {
    const rootDir = await pushedRepo("worktree-untracked");
    await write(rootDir, ".gitignore", "ignored.log\n");
    git(rootDir, "add", ".gitignore");
    git(rootDir, "commit", "-q", "-m", "ignore", "--no-verify");
    await write(rootDir, "src/new.ts", "export const n = 1;\n");
    await write(rootDir, "ignored.log", "noise\n");

    const report = await runDoctor(rootDir);
    const fencePaths = report.findings
      .filter((finding) => finding.check === "fence")
      .map((finding) => finding.path);

    expect(fencePaths).toContain("src/new.ts");
    expect(fencePaths).not.toContain("ignored.log");
  });

  it("evaluates a working-tree edit with no upstream instead of reporting not-evaluated", async () => {
    const rootDir = await createTempRoot("worktree-no-upstream");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    git(rootDir, "init", "-q");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    await runCommand(rootDir, ["adr", "create", "Money is integer cents"]);
    const full = path.join(rootDir, "docs/adrs/ADR-0001-money-is-integer-cents.md");
    const content = await readFile(full, "utf8");
    await writeFile(
      full,
      content.replace(
        /## Applies To\n\n[\s\S]*?\n\n## /u,
        "## Applies To\n\n- `src/lib/**`\n\n## ",
      ),
      "utf8",
    );
    await runCommand(rootDir, ["adr", "accept", "money-is-integer-cents"]);
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "init", "--no-verify");
    await write(rootDir, "src/lib/tip.ts", "export const tip = 1;\n");

    const report = await runDoctor(rootDir);
    const fence = report.checks.find((check) => check.id === "fence");

    expect(fence?.status).toBe("evaluated");
    expect(
      report.findings.filter((finding) => finding.check === "fence").map((f) => f.path),
    ).toContain("src/lib/tip.ts");
    expect(
      report.findings.some(
        (finding) =>
          finding.check === "governing-adrs" &&
          finding.message.includes("Uncommitted changes to src/lib/tip.ts fall under ADR-0001"),
      ),
    ).toBe(true);
  });

  it("nudges an accepted ADR with no Applies To list", async () => {
    const rootDir = await createTempRoot("worktree-no-applies");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await runCommand(rootDir, ["adr", "create", "Money is integer cents"]);
    await runCommand(rootDir, ["adr", "accept", "money-is-integer-cents"]);

    const report = await runDoctor(rootDir);
    const nudge = report.findings.filter(
      (finding) => finding.check === "governing-adrs" && finding.message.includes("Applies To"),
    );

    expect(nudge).toHaveLength(1);
    expect(nudge[0]?.severity).toBe("info");
    expect(nudge[0]?.message).toContain("can't be matched to this decision");
  });

  it("names the governing ADR for an uncommitted edit inside its paths", async () => {
    const rootDir = await pushedRepo("worktree-governing");
    await runCommand(rootDir, ["adr", "create", "Money is integer cents"]);
    const full = path.join(rootDir, "docs/adrs/ADR-0001-money-is-integer-cents.md");
    const content = await readFile(full, "utf8");
    await writeFile(
      full,
      content
        .replace(
          /## Decision\n\n[\s\S]*?\n\n## /u,
          "## Decision\n\nEvery amount is integer cents, including intermediate math. Never floats.\n\n## ",
        )
        .replace(/## Applies To\n\n[\s\S]*?\n\n## /u, "## Applies To\n\n- `src/lib/**`\n\n## "),
      "utf8",
    );
    await runCommand(rootDir, ["adr", "accept", "money-is-integer-cents"]);
    // Commit the ADR so the only pending change is the worktree edit below.
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "adr", "--no-verify");
    await write(rootDir, "src/lib/tip.ts", "export const tip = 1;\n");

    const report = await runDoctor(rootDir);
    const governing = report.findings.filter(
      (finding) =>
        finding.check === "governing-adrs" &&
        (finding.path ?? "").endsWith("ADR-0001-money-is-integer-cents.md"),
    );

    expect(governing.length).toBeGreaterThan(0);
    // An upstream exists here, so the worktree edit joins the unpushed set.
    expect(governing.some((finding) => finding.message.includes("Unpushed changes"))).toBe(true);
    expect(
      governing.some((finding) =>
        finding.message.includes("including intermediate math. Never floats."),
      ),
    ).toBe(true);
  });
});
