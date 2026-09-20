import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkMemoryIntegrity } from "../../../src/core/doctor/checks/memory-integrity-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

const OLD_SCAFFOLD = [
  "PRD.md",
  "ACCEPTANCE.md",
  "ARCHITECTURE_IMPACT.md",
  "CHANGE_REQUESTS.md",
  "PLAN.md",
  "TASKS.md",
  "TEST_PLAN.md",
  "REVIEW.md",
  "COMPLETION_REPORT.md",
];

describe("memory-integrity check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeDocs(rootDir: string, folder: string, names: string[]): Promise<void> {
    for (const name of names) {
      const full = path.join(rootDir, folder, name);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, "# doc\n", "utf8");
    }
  }

  async function writeDoc(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  async function writeHealthyAdr(rootDir: string, status: string): Promise<void> {
    await writeDoc(
      rootDir,
      "docs/adrs/ADR-0001-example.md",
      `# ADR-0001: Example

## Status

${status}

## Context

Example context.

## Decision

Example decision.

## Alternatives Considered

Example alternative.

## Consequences

Example consequence.

## Related Documents

- Example.
`,
    );
  }

  it("reports not-evaluated when no features, modules, ADRs, or required docs exist", async () => {
    const rootDir = await createRoot("mi-empty");

    const { findings, outcome } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "memory-integrity",
      status: "not-evaluated",
      reason:
        "no feature folders, module folders, ADRs, or required documents exist, so there is no memory to validate",
    });
  });

  it("reports not-evaluated when config is missing", async () => {
    const rootDir = await createRoot("mi-noconfig");

    const { findings, outcome } = await checkMemoryIntegrity({
      rootDir,
      config: undefined,
    });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "memory-integrity",
      status: "not-evaluated",
      reason: "Memory integrity checks require Persist OS config.",
    });
  });

  it("flags broken required-doc links and unknown ADR references", async () => {
    const rootDir = await createRoot("mi-brokenrefs");
    await writeDoc(
      rootDir,
      "docs/00-product/PRODUCT.md",
      "# Product\n\nSee [Missing](docs/00-product/MISSING.md) and ADR-9999.\n",
    );

    const { findings, outcome } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "memory-integrity", status: "evaluated" });
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "memory-doc-reference",
        message: "Required memory references docs/00-product/MISSING.md, which does not exist.",
        path: "docs/00-product/PRODUCT.md",
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "memory-adr-reference",
        message: "Required memory references ADR-9999 but no matching ADR exists.",
        path: "docs/00-product/PRODUCT.md",
      }),
    );
  });

  it("warns when required docs cite a proposed ADR", async () => {
    const rootDir = await createRoot("mi-proposedref");
    await writeHealthyAdr(rootDir, "Proposed");
    await writeDoc(rootDir, "docs/00-product/PRODUCT.md", "# Product\n\nFollows ADR-0001.\n");

    const { findings } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "memory-proposed-reference",
        message: "Required memory references ADR-0001 which is not accepted.",
        path: "docs/00-product/PRODUCT.md",
      }),
    );
  });

  it("stays quiet on healthy minimal memory", async () => {
    const rootDir = await createRoot("mi-healthy");
    await writeHealthyAdr(rootDir, "Accepted");
    await writeDoc(
      rootDir,
      "docs/60-engineering/ENGINEERING_STANDARDS.md",
      "# Engineering Standards\n",
    );
    await writeDoc(
      rootDir,
      "docs/00-product/PRODUCT.md",
      "# Product\n\nSee [Standards](docs/60-engineering/ENGINEERING_STANDARDS.md) and [ADR-0001](docs/adrs/ADR-0001-example.md).\n",
    );

    const { findings, outcome } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "memory-integrity", status: "evaluated" });
    expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
  });

  it("still passes an old nine-document feature folder", async () => {
    const rootDir = await createRoot("mi-old");
    await writeDocs(rootDir, "docs/40-features/F-001-x", OLD_SCAFFOLD);

    const { findings, outcome } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "memory-integrity", status: "evaluated" });
    expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
  });

  it("requires TEST_PLAN.md only while the test gate is on", async () => {
    const rootDir = await createRoot("mi-gate");
    await writeDocs(rootDir, "docs/40-features/F-001-x", ["PLAN.md", "TASKS.md"]);

    const off = await checkMemoryIntegrity({ rootDir, config: createDefaultConfig() });
    expect(off.findings.filter((finding) => finding.severity === "error")).toEqual([]);

    const on = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig({ testCommand: "pnpm run test:run" }),
    });
    expect(on.findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        path: "docs/40-features/F-001-x/TEST_PLAN.md",
      }),
    );

    await writeDocs(rootDir, "docs/40-features/F-001-x", ["TEST_PLAN.md"]);
    const fixed = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig({ testCommand: "pnpm run test:run" }),
    });
    expect(fixed.findings.filter((finding) => finding.severity === "error")).toEqual([]);
  });
});
