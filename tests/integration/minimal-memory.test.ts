import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../src/core/doctor/doctor-check.js";
import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

const FIVE_CHECKS = ["memory-integrity", "standards", "content", "code-references", "staleness"];

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

function git(rootDir: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
}

describe("minimal-by-default memory", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("writes CLAUDE.md as the AGENTS.md import and nothing else", async () => {
    // Claude loads CLAUDE.md every session, so every line in it is paid for every time. The
    // rules live in AGENTS.md and the memory map in the SessionStart hook; prose here only
    // repeated them, and hardcoded docs/ paths that went wrong when the memory moved.
    const rootDir = await createRoot("minimal-claude-md");
    await runInitCommand(rootDir);

    const claude = await readFile(path.join(rootDir, "CLAUDE.md"), "utf8");
    expect(claude).toBe("@AGENTS.md\n");
  });

  it("tells agents that done means doctor passes, and how to run Persist without installing it", async () => {
    const rootDir = await createRoot("minimal-agent-rules");
    await runInitCommand(rootDir);

    for (const file of ["AGENTS.md", ".cursor/rules/persist-memory.mdc"]) {
      const rules = await readFile(path.join(rootDir, file), "utf8");
      expect(rules, file).toContain("reports PASSED");
      expect(rules, file).toContain("npx persist-os <command>");
    }
  });

  it("never replaces a CLAUDE.md the repository already has", async () => {
    const rootDir = await createRoot("minimal-claude-md-existing");
    await writeFile(path.join(rootDir, "CLAUDE.md"), "# Our own rules\n", "utf8");
    await runInitCommand(rootDir);

    expect(await readFile(path.join(rootDir, "CLAUDE.md"), "utf8")).toBe("# Our own rules\n");
  });

  it("evaluates the re-pointed checks on a minimal repo", async () => {
    const rootDir = await createRoot("minimal-doctor");
    await runInitCommand(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    // init ran before git init, so it could not switch the hooks on; do what it says to.
    git(rootDir, "config", "core.hooksPath", ".persist/hooks");

    const report = await runDoctor(rootDir);

    // The re-pointed checks evaluate the surviving memory: required docs exist, so
    // memory-integrity evaluates; conventions exist, so code-references evaluates; the
    // uncommitted docs have no history to compare, so staleness evaluates quietly.
    for (const id of ["memory-integrity", "code-references", "staleness"]) {
      expect(report.checks.find((check) => check.id === id)?.status, id).toBe("evaluated");
    }
    expect(report.findings.filter((finding) => finding.severity === "error")).toEqual([]);

    // Standards and content still abstain: no features, ADRs, or work exist to judge.
    for (const id of ["standards", "content"]) {
      const outcome = report.checks.find((check) => check.id === id);
      expect(outcome?.status, id).toBe("not-evaluated");
      expect(outcome?.reason, id).toMatch(/no .* exist/);
    }

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("NOT EVALUATED");
    expect(result.stdout).toContain("Result: PASSED");
  });

  it("evaluates everything on a full repo with no loss of capability", async () => {
    const rootDir = await createRoot("minimal-full");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);
    await runCommand(rootDir, ["module", "create", "billing"]);
    await runCommand(rootDir, ["adr", "create", "use-postgres"]);
    await runCommand(rootDir, ["adr", "accept", "use-postgres"]);
    await fillScaffoldDocs(rootDir);
    git(rootDir, "init");
    git(rootDir, "config", "user.email", "test@example.com");
    git(rootDir, "config", "user.name", "Test");
    git(rootDir, "add", "-A");
    git(rootDir, "commit", "-m", "init");

    const report = await runDoctor(rootDir);

    for (const id of FIVE_CHECKS) {
      expect(report.checks.find((check) => check.id === id)?.status, id).toBe("evaluated");
    }

    const failing = report.findings.filter((finding) => finding.severity === "error");
    expect(failing).toEqual([]);
  });

  it("writes two scaffold files gate-off and three gate-on", async () => {
    const rootDir = await createRoot("minimal-scaffold");
    await runInitCommand(rootDir);

    await runCommand(rootDir, ["feature", "create", "auth-provider"]);
    expect(
      await listRelativeFiles(path.join(rootDir, "docs/40-features/F-001-auth-provider")),
    ).toEqual(["PLAN.md", "TASKS.md"]);

    const configPath = path.join(rootDir, ".persist/config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
    config.testCommand = "pnpm run test:run";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    await runCommand(rootDir, ["feature", "create", "billing"]);
    expect(await listRelativeFiles(path.join(rootDir, "docs/40-features/F-002-billing"))).toEqual([
      "PLAN.md",
      "TASKS.md",
      "TEST_PLAN.md",
    ]);
  });

  it("mentions no presets in help and has no preset command", async () => {
    const rootDir = await createRoot("minimal-nopreset");

    const help = await runCommand(rootDir, ["--help"]);
    expect(help.stdout).not.toContain("preset");

    const preset = await runCommand(rootDir, ["preset", "list"]);
    expect(preset.exitCode).not.toBe(0);
  });
});
