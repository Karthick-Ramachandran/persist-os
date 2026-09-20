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

  it("reports not-evaluated when no features, modules, or ADRs exist", async () => {
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
        "no feature folders, module folders, or ADRs exist, so there is no memory to validate",
    });
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
