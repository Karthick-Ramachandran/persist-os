import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkSuperseded } from "../../../src/core/doctor/checks/superseded-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor superseded-reference check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeSupersededAdr(rootDir: string): Promise<void> {
    const dir = path.join(rootDir, "docs/adrs");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "ADR-0001-use-postgresql.md"),
      "# ADR-0001: Use PostgreSQL\n\n## Status\n\nAccepted — superseded by ADR-0002-use-mysql\n",
      "utf8",
    );
  }

  async function writeFeature(rootDir: string, body: string): Promise<void> {
    const dir = path.join(rootDir, "docs/40-features/F-001-checkout");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "ARCHITECTURE_IMPACT.md"), body, "utf8");
  }

  it("warns when memory references a superseded ADR", async () => {
    const rootDir = await createRoot("superseded-ref");
    await writeSupersededAdr(rootDir);
    await writeFeature(
      rootDir,
      "# Impact\n\nThis feature relies on ADR-0001 for its data store.\n",
    );

    const findings = await checkSuperseded({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "superseded-reference",
        message: expect.stringContaining("ADR-0001"),
      }),
    );
  });

  it("produces no findings when nothing references the superseded ADR", async () => {
    const rootDir = await createRoot("superseded-none");
    await writeSupersededAdr(rootDir);
    await writeFeature(rootDir, "# Impact\n\nNo decision references here.\n");

    const findings = await checkSuperseded({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("ignores references inside code blocks", async () => {
    const rootDir = await createRoot("superseded-code");
    await writeSupersededAdr(rootDir);
    await writeFeature(rootDir, "# Impact\n\n```txt\nExample: ADR-0001 format\n```\n");

    const findings = await checkSuperseded({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("produces no findings when there is no superseded ADR at all", async () => {
    const rootDir = await createRoot("superseded-absent");
    const dir = path.join(rootDir, "docs/adrs");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "ADR-0001-use-postgresql.md"),
      "# ADR-0001: Use PostgreSQL\n\n## Status\n\nAccepted\n",
      "utf8",
    );
    await writeFeature(rootDir, "# Impact\n\nRelies on ADR-0001.\n");

    const findings = await checkSuperseded({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });
});
