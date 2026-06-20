import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runDoctor } from "../../../src/core/doctor/doctor-check.js";
import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor checks", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  async function writeConfig(rootDir: string): Promise<void> {
    await mkdir(path.join(rootDir, ".specforge"), { recursive: true });
    await writeFile(
      path.join(rootDir, ".specforge/config.json"),
      `${JSON.stringify(createDefaultConfig(), null, 2)}\n`,
      "utf8"
    );
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("reports missing config as an error", async () => {
    const rootDir = await createRoot("doctor-missing-config-unit");
    const report = await runDoctor(rootDir);

    expect(report.summary.errors).toBeGreaterThan(0);
    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "config",
        path: ".specforge/config.json"
      })
    );
  });

  it("reports invalid JSON config as an error", async () => {
    const rootDir = await createRoot("doctor-invalid-json-unit");
    await mkdir(path.join(rootDir, ".specforge"), { recursive: true });
    await writeFile(path.join(rootDir, ".specforge/config.json"), "{", "utf8");

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        message: "Config file is not valid JSON."
      })
    );
  });

  it("reports missing configured directories", async () => {
    const rootDir = await createRoot("doctor-missing-dirs-unit");
    await writeConfig(rootDir);

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "configured-directories",
        path: "docs"
      })
    );
  });

  it("reports missing ADR sections", async () => {
    const rootDir = await createRoot("doctor-adr-sections-unit");
    await writeConfig(rootDir);
    await mkdir(path.join(rootDir, "docs/adrs"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/adrs/ADR-0001-bad.md"),
      "# ADR-0001: Bad\n\n## Status\n\nProposed\n",
      "utf8"
    );

    const report = await runDoctor(rootDir);

    expect(report.findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "adr-memory",
        path: "docs/adrs/ADR-0001-bad.md"
      })
    );
  });
});

