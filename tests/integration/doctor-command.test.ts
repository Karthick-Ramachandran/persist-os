import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";
import type { PersistConfig } from "../../src/core/config/config-schema.js";

describe("doctor command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("returns zero for a healthy initialized repo", async () => {
    const rootDir = await createRoot("doctor-healthy");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Doctor Report");
    expect(result.stdout).toContain("INFO");
    expect(result.stdout).toContain("Result: PASSED");
  });

  it("returns two when config is missing", async () => {
    const rootDir = await createRoot("doctor-missing-config");
    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Missing .persist/config.json.");
    expect(result.stdout).toContain("Result: FAILED");
  });

  it("returns two when config is invalid", async () => {
    const rootDir = await createRoot("doctor-invalid-config");
    await mkdir(path.join(rootDir, ".persist"), { recursive: true });
    await writeFile(path.join(rootDir, ".persist/config.json"), "{", "utf8");

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Config file is not valid JSON.");
  });

  it("returns two when required root or AI docs are missing", async () => {
    const rootDir = await createRoot("doctor-missing-root-ai");
    await runInitCommand(rootDir);
    await rm(path.join(rootDir, "docs/ai/PERSIST_COMMANDS.md"));

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("docs/ai/PERSIST_COMMANDS.md");
  });

  it("returns two when configured directories are missing", async () => {
    const rootDir = await createRoot("doctor-missing-configured-dir");
    await runInitCommand(rootDir);
    const configPath = path.join(rootDir, ".persist/config.json");
    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    config.featuresDir = "missing/features";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Configured directory is missing.");
    expect(result.stdout).toContain("missing/features");
  });

  it("returns two when feature folders are missing required docs", async () => {
    const rootDir = await createRoot("doctor-missing-feature-doc");
    await runInitCommand(rootDir);
    await mkdir(path.join(rootDir, "docs/40-features/F-001-auth"), {
      recursive: true,
    });
    await writeFile(path.join(rootDir, "docs/40-features/F-001-auth/PRD.md"), "# PRD\n", "utf8");

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Feature folder is missing a required doc.");
  });

  it("returns two when module folders are missing required docs", async () => {
    const rootDir = await createRoot("doctor-missing-module-doc");
    await runInitCommand(rootDir);
    await mkdir(path.join(rootDir, "docs/30-modules/auth"), { recursive: true });
    await writeFile(path.join(rootDir, "docs/30-modules/auth/MODULE.md"), "# Module\n", "utf8");

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Module folder is missing a required doc.");
  });

  it("returns two when ADR files are missing required sections", async () => {
    const rootDir = await createRoot("doctor-missing-adr-section");
    await runInitCommand(rootDir);
    await writeFile(
      path.join(rootDir, "docs/adrs/ADR-0001-bad.md"),
      "# ADR-0001: Bad\n\n## Status\n\nProposed\n",
      "utf8",
    );

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("ADR file is missing required section");
  });

  it("returns one for standards warnings without errors", async () => {
    const rootDir = await createRoot("doctor-standards-warning");
    await runInitCommand(rootDir);
    await writeFile(
      path.join(rootDir, "docs/adrs/ADR-0001-draft.md"),
      `# ADR-0001: Draft

## Status

Proposed

## Context

Draft context.

## Decision

Draft decision.

## Alternatives Considered

Draft alternative.

## Consequences

TBD

## Related Documents

- Draft.
`,
      "utf8",
    );

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("WARNING");
    expect(result.stdout).toContain("ADR consequence evidence is incomplete.");
    expect(result.stdout).toContain("Result: WARNINGS");
  });

  it("returns two for standards errors", async () => {
    const rootDir = await createRoot("doctor-standards-error");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);
    const featureDir = path.join(rootDir, "docs/40-features/F-001-auth-provider");
    await writeFile(
      path.join(featureDir, "COMPLETION_REPORT.md"),
      `# Completion Report: Auth Provider

## Status

Complete.

## Tests Run

TBD

## Results

Passed.
`,
      "utf8",
    );
    await writeFile(
      path.join(featureDir, "REVIEW.md"),
      `# Review: Auth Provider

## Status

Pending review.
`,
      "utf8",
    );

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Feature is marked complete but review is still pending.");
    expect(result.stdout).toContain(
      "Feature is marked complete but completion report is missing test evidence.",
    );
    expect(result.stdout).toContain("Result: FAILED");
  });

  it("returns two when memory references a missing ADR", async () => {
    const rootDir = await createRoot("doctor-drift-missing-adr");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);
    await writeFile(
      path.join(rootDir, "docs/40-features/F-001-auth-provider/PLAN.md"),
      "# Plan\n\nImplements ADR-0042 for auth.\n",
      "utf8",
    );

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("references ADR-0042 but no matching ADR exists");
    expect(result.stdout).toContain("Result: FAILED");
  });

  it("returns one when memory references a not-yet-accepted ADR", async () => {
    const rootDir = await createRoot("doctor-drift-proposed-adr");
    await runInitCommand(rootDir);
    await mkdir(path.join(rootDir, "docs/adrs"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/adrs/ADR-0001-example.md"),
      `# ADR-0001: Example

## Status

Proposed

## Context

Example context.

## Decision

Example decision.

## Alternatives Considered

Example alternative.

## Consequences

Example consequence text.

## Related Documents

- None.
`,
      "utf8",
    );
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);
    await writeFile(
      path.join(rootDir, "docs/40-features/F-001-auth-provider/PLAN.md"),
      "# Plan\n\nFollows ADR-0001.\n",
      "utf8",
    );

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("references ADR-0001 which is not accepted");
    expect(result.stdout).toContain("Result: WARNINGS");
  });

  it("generates command reference memory during init", async () => {
    const rootDir = await createRoot("doctor-command-reference");
    await runInitCommand(rootDir);

    const commandReference = await readGeneratedFile(rootDir, "docs/ai/PERSIST_COMMANDS.md");

    expect(commandReference).toContain("persist init");
    expect(commandReference).toContain("persist preset list");
    expect(commandReference).toContain("persist feature create <name>");
    expect(commandReference).toContain("persist adr create <title>");
    expect(commandReference).toContain("persist module create <name>");
    expect(commandReference).toContain("persist doctor");
  });
  it("emits JSON for CI and agent handoff", async () => {
    const rootDir = await createRoot("doctor-json");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["doctor", "--json"]);
    const parsed = JSON.parse(result.stdout) as {
      schemaVersion: string;
      status: string;
      exitCode: number;
      summary: { errors: number; warnings: number; info: number };
      findings: unknown[];
    };

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(parsed.schemaVersion).toBe("persist.doctor.v1");
    expect(parsed.status).toBe("passed");
    expect(parsed.exitCode).toBe(0);
    expect(parsed.summary).toMatchObject({ errors: 0, warnings: 0, info: 4 });
    expect(parsed.findings).toHaveLength(4);
  });
});
