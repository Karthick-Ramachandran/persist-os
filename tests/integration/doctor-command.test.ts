import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runCommand,
  runInitCommand
} from "../helpers/init-test-helpers.js";
import type { SpecForgeConfig } from "../../src/core/config/config-schema.js";

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
    expect(result.stdout).toContain("Missing .specforge/config.json.");
    expect(result.stdout).toContain("Result: FAILED");
  });

  it("returns two when config is invalid", async () => {
    const rootDir = await createRoot("doctor-invalid-config");
    await mkdir(path.join(rootDir, ".specforge"), { recursive: true });
    await writeFile(path.join(rootDir, ".specforge/config.json"), "{", "utf8");

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Config file is not valid JSON.");
  });

  it("returns two when required root or AI docs are missing", async () => {
    const rootDir = await createRoot("doctor-missing-root-ai");
    await runInitCommand(rootDir);
    await rm(path.join(rootDir, "docs/ai/SPECFORGE_COMMANDS.md"));

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("docs/ai/SPECFORGE_COMMANDS.md");
  });

  it("returns two when configured directories are missing", async () => {
    const rootDir = await createRoot("doctor-missing-configured-dir");
    await runInitCommand(rootDir);
    const configPath = path.join(rootDir, ".specforge/config.json");
    const config = await readGeneratedJson<SpecForgeConfig>(
      rootDir,
      ".specforge/config.json"
    );
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
      recursive: true
    });
    await writeFile(
      path.join(rootDir, "docs/40-features/F-001-auth/PRD.md"),
      "# PRD\n",
      "utf8"
    );

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("Feature folder is missing a required doc.");
  });

  it("returns two when module folders are missing required docs", async () => {
    const rootDir = await createRoot("doctor-missing-module-doc");
    await runInitCommand(rootDir);
    await mkdir(path.join(rootDir, "docs/30-modules/auth"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/30-modules/auth/MODULE.md"),
      "# Module\n",
      "utf8"
    );

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
      "utf8"
    );

    const result = await runCommand(rootDir, ["doctor"]);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toContain("ADR file is missing required section");
  });

  it("generates command reference memory during init", async () => {
    const rootDir = await createRoot("doctor-command-reference");
    await runInitCommand(rootDir);

    const commandReference = await readGeneratedFile(
      rootDir,
      "docs/ai/SPECFORGE_COMMANDS.md"
    );

    expect(commandReference).toContain("specforge init");
    expect(commandReference).toContain("specforge feature create <name>");
    expect(commandReference).toContain("specforge adr create <title>");
    expect(commandReference).toContain("specforge module create <name>");
    expect(commandReference).toContain("specforge doctor");
  });
});

