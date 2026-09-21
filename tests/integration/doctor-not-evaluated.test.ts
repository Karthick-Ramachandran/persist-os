import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  "ignored-files",
  "hook-drift",
  "retired-skills",
  "duplicate-titles",
  "fence",
];

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
  const productPath = path.join(rootDir, "docs/00-product/PRODUCT.md");
  const product = await readFile(productPath, "utf8");
  await writeFile(
    productPath,
    product
      .replace(
        "Describe what this repository is building and why.",
        "A billing ledger service. Replaces the template sentence:",
      )
      .replace(
        "Describe who this is for and what success looks like for them.",
        "Operators who need auditable invoices. Replaces the template sentence:",
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

  // The hooks-active check stands down when CI is set; clear it so these outcomes are the same
  // locally and in GitHub Actions.
  beforeEach(() => {
    vi.stubEnv("CI", "");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("reports sixteen not-evaluated checks when config is missing", async () => {
    const rootDir = await createRoot("noteval-noconfig");
    const report = await runDoctor(rootDir);

    expect(report.checks).toHaveLength(18);
    for (const check of GATED_CHECKS) {
      expect(report.checks).toContainEqual({
        id: check,
        status: "not-evaluated",
        reason: "no .persist/config.json, so configured paths are unknown",
      });
    }
    expect(report.checks.filter((check) => check.status === "not-evaluated")).toHaveLength(16);
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

    // A clone never carries git config, so its hooks start off; switch them on so this test
    // stays about staleness.
    git(cloneDir, "config", "core.hooksPath", ".persist/hooks");
    const report = await runDoctor(cloneDir);
    const staleness = report.checks.find((check) => check.id === "staleness");

    expect(staleness?.status).toBe("not-evaluated");
    expect(staleness?.reason).toContain("fetch-depth");

    const result = await runCommand(cloneDir, ["doctor"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("NOT EVALUATED");
  });

  it("evaluates all eighteen checks with no NOT EVALUATED section in full history", async () => {
    const rootDir = await createRoot("noteval-healthy");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);
    await runCommand(rootDir, ["module", "create", "billing"]);
    await runCommand(rootDir, ["adr", "create", "use-postgres"]);
    await runCommand(rootDir, ["adr", "accept", "use-postgres"]);
    // A healthy repository's decision says which code it governs, so governing-adrs evaluates.
    await scopeAdr(rootDir, "docs/adrs/ADR-0001-use-postgres.md", "src/db/**");
    await fillModuleDoc(rootDir, "billing");
    await fillScaffoldDocs(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-m", "init");
    // An upstream to compare against: with nothing staged, the fence checks unpushed work,
    // and a branch with no upstream has none to check.
    git(rootDir, "branch", "pushed");
    git(rootDir, "branch", "--set-upstream-to=pushed");
    // Hooks switched on, as init does when it runs inside a git repository.
    git(rootDir, "config", "core.hooksPath", ".persist/hooks");

    const report = await runDoctor(rootDir);

    expect(report.checks).toHaveLength(18);
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
    expect(parsed.checks).toHaveLength(18);
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

/** Replace a generated ADR's Applies To placeholder with one governed path. */
async function scopeAdr(rootDir: string, adrPath: string, pattern: string): Promise<void> {
  const file = path.join(rootDir, adrPath);
  const content = await readFile(file, "utf8");
  await writeFile(
    file,
    content.replace(
      /## Applies To\n\n[\s\S]*?\n\n## /u,
      `## Applies To\n\n- \`${pattern}\`\n\n## `,
    ),
    "utf8",
  );
}
