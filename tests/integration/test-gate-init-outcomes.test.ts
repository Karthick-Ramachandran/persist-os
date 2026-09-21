import { execFileSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import {
  createTempRoot,
  readGeneratedJson,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";
import type { PersistConfig } from "../../src/core/config/config-schema.js";

describe("init test-gate seeding", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writePackageJson(rootDir: string, scripts: Record<string, string>): Promise<void> {
    await writeFile(
      path.join(rootDir, "package.json"),
      JSON.stringify({ name: "x", scripts }, null, 2),
      "utf8",
    );
    await writeFile(path.join(rootDir, "pnpm-lock.yaml"), "", "utf8");
  }

  it("detects, saves, and prints the one-shot test command", async () => {
    const rootDir = await createRoot("init-testgate");
    await writePackageJson(rootDir, {
      test: "vitest",
      "test:run": "vitest run",
      typecheck: "tsc",
      lint: "eslint .",
    });

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test gate: pnpm run test:run");

    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    expect(config.testCommand).toBe("pnpm run test:run");
    expect(config.preCommitGates).toEqual([]);
    expect(config.prePushGates).toEqual(["pnpm run typecheck", "pnpm run lint"]);
  });

  it("says the gate is off when nothing safe is detected", async () => {
    const rootDir = await createRoot("init-testgate-none");
    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Test gate: not configured");

    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    expect(config.testCommand).toBeNull();
  });

  it("splits the hooks: doctor at commit, test gate at push", async () => {
    const rootDir = await createRoot("init-hooks-split");
    await writePackageJson(rootDir, {
      test: "vitest",
      "test:run": "vitest run",
      typecheck: "tsc",
    });
    await runInitCommand(rootDir);

    const preCommit = await readFile(path.join(rootDir, ".persist/hooks/pre-commit"), "utf8");
    const prePush = await readFile(path.join(rootDir, ".persist/hooks/pre-push"), "utf8");

    expect(preCommit).toContain("persist doctor");
    expect(preCommit).not.toContain("persist test-gate");
    expect(prePush).toContain("persist test-gate");
    expect(prePush).toContain("pnpm run typecheck");
    expect(prePush).not.toContain("persist doctor");
  });
});

async function fillScaffoldDocs(rootDir: string): Promise<void> {
  const conventionsPath = path.join(rootDir, "docs/60-engineering/CONVENTIONS.md");
  const conventions = await readFile(conventionsPath, "utf8");
  await writeFile(
    conventionsPath,
    conventions.replace(
      "Describe the named building blocks this codebase reuses",
      "Shared primitives: the ledger writer in src/ledger and the receipt renderer in src/receipts. Replaces the template sentence:",
    ),
    "utf8",
  );
  const securityPath = path.join(rootDir, "docs/20-security/SECURITY_MODEL.md");
  const security = await readFile(securityPath, "utf8");
  await writeFile(
    securityPath,
    security.replace(
      "Describe how this repository authenticates users or clients",
      "Clients authenticate with API keys and the gateway authorizes every action. Replaces the template sentence:",
    ),
    "utf8",
  );
}

async function fillModuleDoc(rootDir: string, name: string): Promise<void> {
  await writeFile(
    path.join(rootDir, "docs/30-modules", name, "MODULE.md"),
    "# Module: billing\n\n## Purpose\n\nOwns invoicing and receipts.\n\n## Owns\n\nThe ledger writer and the receipt renderer.\n",
    "utf8",
  );
}
describe("doctor check outcomes", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("records fourteen not-evaluated checks when config is missing", async () => {
    const rootDir = await createRoot("outcomes-noconfig");
    const report = await runDoctor(rootDir);

    expect(report.checks).toHaveLength(16);
    expect(report.checks.filter((check) => check.status === "not-evaluated")).toHaveLength(14);
    expect(report.checks).toContainEqual({
      id: "hook-drift",
      status: "not-evaluated",
      reason: "no .persist/config.json, so configured paths are unknown",
    });

    const result = await runCommand(rootDir, ["doctor"]);
    expect(result.stdout).toContain("NOT EVALUATED");
  });

  it("reports hook-drift as not-evaluated when hooks are absent", async () => {
    const rootDir = await createRoot("outcomes-nohooks");
    await runInitCommand(rootDir);
    await rm(path.join(rootDir, ".persist/hooks"), { recursive: true, force: true });

    const report = await runDoctor(rootDir);
    const drift = report.checks.find((check) => check.id === "hook-drift");

    expect(drift?.status).toBe("not-evaluated");
    expect(drift?.reason).toContain(".persist/hooks/pre-commit");

    const result = await runCommand(rootDir, ["doctor"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("NOT EVALUATED");
    expect(result.stdout).toContain("Result: PASSED");
  });

  it("evaluates every check with no NOT EVALUATED section on a healthy repo", async () => {
    const rootDir = await createRoot("outcomes-healthy");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);
    await runCommand(rootDir, ["module", "create", "billing"]);
    await runCommand(rootDir, ["adr", "create", "use-postgres"]);
    await runCommand(rootDir, ["adr", "accept", "use-postgres"]);
    await fillModuleDoc(rootDir, "billing");
    await fillScaffoldDocs(rootDir);
    // staleness needs real commit history, so a "healthy" repo is a git repo with
    // full history — otherwise it correctly reports not-evaluated.
    execFileSync("git", ["init"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: rootDir,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["add", "-A"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["commit", "-m", "init"], { cwd: rootDir, stdio: "ignore" });

    const report = await runDoctor(rootDir);

    expect(report.checks).toHaveLength(16);
    expect(report.checks.every((check) => check.status === "evaluated")).toBe(true);

    const result = await runCommand(rootDir, ["doctor"]);
    expect(result.stdout).not.toContain("NOT EVALUATED");
  });

  it("keeps the JSON shape and adds the checks array", async () => {
    const rootDir = await createRoot("outcomes-json");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["doctor", "--json"]);
    const parsed = JSON.parse(result.stdout) as {
      schemaVersion: string;
      status: string;
      exitCode: number;
      summary: { errors: number; warnings: number; info: number };
      findings: unknown[];
      checks: { check: string; status: string }[];
    };

    expect(parsed.schemaVersion).toBe("persist.doctor.v1");
    expect(parsed.status).toBe("passed");
    expect(parsed.exitCode).toBe(0);
    expect(parsed.summary).toMatchObject({ errors: 0, warnings: 0 });
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(parsed.checks).toHaveLength(16);
  });

  it("has no guard command left", async () => {
    const rootDir = await createRoot("outcomes-noguard");
    const result = await runCommand(rootDir, ["guard"]);

    expect(result.exitCode).not.toBe(0);
  });
});
