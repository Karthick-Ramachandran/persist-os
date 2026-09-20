import { execFileSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

const GATED_CHECKS = [
  "memory-integrity",
  "standards",
  "drift",
  "content",
  "conventions",
  "code-references",
  "superseded",
  "context-budget",
  "staleness",
];

function git(rootDir: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
}

describe("doctor not-evaluated reporting", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("reports nine not-evaluated checks when config is missing", async () => {
    const rootDir = await createRoot("noteval-noconfig");
    const report = await runDoctor(rootDir);

    expect(report.checks).toHaveLength(11);
    for (const check of GATED_CHECKS) {
      expect(report.checks).toContainEqual({
        id: check,
        status: "not-evaluated",
        reason: "no .persist/config.json, so configured paths are unknown",
      });
    }
    expect(report.checks.filter((check) => check.status === "not-evaluated")).toHaveLength(9);
  });

  it("shows the NOT EVALUATED section without moving the exit code by itself", async () => {
    const rootDir = await createRoot("noteval-nogit");
    await runInitCommand(rootDir);

    const report = await runDoctor(rootDir);
    const staleness = report.checks.find((check) => check.id === "staleness");

    expect(staleness).toEqual({
      id: "staleness",
      status: "not-evaluated",
      reason: "not a git repository, so commit history is unavailable",
    });

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("NOT EVALUATED");
    expect(result.stdout).toContain(
      "- staleness: not a git repository, so commit history is unavailable",
    );
    expect(result.stdout).toContain("Result: PASSED");
  });

  it("reports staleness as not-evaluated in a real shallow clone", async () => {
    const source = await createRoot("noteval-shallow-source");
    await runInitCommand(source);
    git(source, "init");
    git(source, "config", "user.email", "test@example.com");
    git(source, "config", "user.name", "Test");
    git(source, "add", "-A");
    git(source, "commit", "-m", "init");

    const cloneDir = await createTempRoot("noteval-shallow-clone");
    roots.push(cloneDir);
    execFileSync("git", ["clone", "--depth", "1", `file://${source}`, cloneDir], {
      stdio: "ignore",
    });

    const report = await runDoctor(cloneDir);
    const staleness = report.checks.find((check) => check.id === "staleness");

    expect(staleness?.status).toBe("not-evaluated");
    expect(staleness?.reason).toContain("fetch-depth");

    const result = await runCommand(cloneDir, ["doctor"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("NOT EVALUATED");
  });

  it("evaluates all eleven checks with no NOT EVALUATED section in full history", async () => {
    const rootDir = await createRoot("noteval-healthy");
    await runInitCommand(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-m", "init");

    const report = await runDoctor(rootDir);

    expect(report.checks).toHaveLength(11);
    expect(report.checks.every((check) => check.status === "evaluated")).toBe(true);

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("NOT EVALUATED");
    expect(result.stdout).toContain("Result: PASSED");
  });

  it("keeps the JSON shape and adds the checks array", async () => {
    const rootDir = await createRoot("noteval-json");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["doctor", "--json"]);
    const parsed = JSON.parse(result.stdout) as {
      schemaVersion: string;
      status: string;
      exitCode: number;
      summary: { errors: number; warnings: number; info: number };
      findings: unknown[];
      checks: { id: string; status: string; reason?: string }[];
    };

    expect(parsed.schemaVersion).toBe("persist.doctor.v1");
    expect(parsed.status).toBe("passed");
    expect(parsed.exitCode).toBe(0);
    expect(parsed.summary).toMatchObject({ errors: 0, warnings: 0 });
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(parsed.checks).toHaveLength(11);
    expect(parsed.checks.find((check) => check.id === "staleness")).toMatchObject({
      status: "not-evaluated",
    });
    expect(
      parsed.checks
        .filter((check) => check.status === "not-evaluated")
        .every((check) => typeof check.reason === "string" && check.reason.length > 0),
    ).toBe(true);
  });
});
