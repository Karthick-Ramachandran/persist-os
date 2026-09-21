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

/** Fill a generated ADR with a real decision and the paths it governs. */
async function decide(rootDir: string, file: string, decision: string, appliesTo: string[]) {
  const full = path.join(rootDir, file);
  const content = await readFile(full, "utf8");
  await writeFile(
    full,
    content
      .replace(/## Decision\n\n[\s\S]*?\n\n## /u, `## Decision\n\n${decision}\n\n## `)
      .replace(
        /## Applies To\n\n[\s\S]*?\n\n## /u,
        `## Applies To\n\n${appliesTo.map((p) => `- \`${p}\``).join("\n")}\n\n## `,
      ),
    "utf8",
  );
}

/**
 * A session sees ADR titles; the rule lives in the body. An agent followed "money is integer
 * cents" by name and still did float division inside the tip calculation. Doctor now puts the
 * decision itself in front of the agent for exactly the files the ADR governs.
 */
describe("doctor governing ADRs", () => {
  const roots: string[] = [];

  async function repo(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    git(rootDir, "init", "-q");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    await runInitCommand(rootDir, ["--yes"]);
    await runCommand(rootDir, ["adr", "create", "Money is integer cents"]);
    await decide(
      rootDir,
      "docs/adrs/ADR-0001-money-is-integer-cents.md",
      "Every amount is an integer number of cents, including intermediate calculations.",
      ["src/lib/**"],
    );
    await runCommand(rootDir, ["adr", "accept", "money-is-integer-cents"]);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("names the governing ADR and its decision for a staged change in its paths", async () => {
    const rootDir = await repo("governing-staged");
    await write(rootDir, "src/lib/tip.ts", "export const tip = 1;\n");
    git(rootDir, "add", "src/lib/tip.ts");

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({ id: "governing-adrs", status: "evaluated" });
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "info",
        check: "governing-adrs",
        path: "docs/adrs/ADR-0001-money-is-integer-cents.md",
        message: expect.stringContaining(
          "src/lib/tip.ts fall under ADR-0001 (Money Is Integer Cents): Every amount is an integer number of cents, including intermediate calculations.",
        ),
      }),
    );
  });

  it("stays quiet for a change outside the ADR's paths", async () => {
    const rootDir = await repo("governing-outside");
    await write(rootDir, "src/ui/main.ts", "export const ui = 1;\n");
    git(rootDir, "add", "src/ui/main.ts");

    const report = await runDoctor(rootDir);

    expect(report.findings.filter((finding) => finding.check === "governing-adrs")).toEqual([]);
  });

  it("stops naming an ADR once it is superseded", async () => {
    const rootDir = await repo("governing-superseded");
    await runCommand(rootDir, [
      "adr",
      "supersede",
      "money-is-integer-cents",
      "Money is minor units per currency",
    ]);
    await write(rootDir, "src/lib/tip.ts", "export const tip = 1;\n");
    git(rootDir, "add", "src/lib/tip.ts");

    const report = await runDoctor(rootDir);

    expect(report.findings.filter((finding) => finding.message.includes("ADR-0001"))).toEqual([]);
  });

  it("names it for unpushed commits when nothing is staged", async () => {
    const rootDir = await repo("governing-unpushed");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-q", "-m", "init", "--no-verify");
    git(rootDir, "branch", "pushed");
    git(rootDir, "branch", "--set-upstream-to=pushed");
    await write(rootDir, "src/lib/tip.ts", "export const tip = 1;\n");
    git(rootDir, "add", "src/lib/tip.ts");
    git(rootDir, "commit", "-q", "-m", "tip", "--no-verify");

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({
        check: "governing-adrs",
        message: expect.stringContaining("Unpushed changes to src/lib/tip.ts fall under ADR-0001"),
      }),
    );
  });

  it("reports not-evaluated when no accepted ADR lists the paths it governs", async () => {
    const rootDir = await createTempRoot("governing-none");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);

    const report = await runDoctor(rootDir);

    expect(report.checks).toContainEqual({
      id: "governing-adrs",
      status: "not-evaluated",
      reason: expect.stringContaining("Applies To"),
    });
  });
});
