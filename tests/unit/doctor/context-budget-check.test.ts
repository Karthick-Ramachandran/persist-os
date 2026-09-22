import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkContextBudget } from "../../../src/core/doctor/checks/context-budget-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor context-budget check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("produces no finding for a normal-sized always-loaded set", async () => {
    const rootDir = await createRoot("budget-ok");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Agents\n\nShort floor.\n", "utf8");
    await writeFile(path.join(rootDir, "CLAUDE.md"), "# Claude\n\n@AGENTS.md\n", "utf8");

    const findings = await checkContextBudget({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("warns when the always-loaded files exceed the budget", async () => {
    const rootDir = await createRoot("budget-over");
    await writeFile(path.join(rootDir, "AGENTS.md"), "x".repeat(30 * 1024), "utf8");

    const findings = await checkContextBudget({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "context-budget",
        message: expect.stringContaining("budget"),
      }),
    );
  });

  it("stays silent for a fence index that fits the budget", async () => {
    const rootDir = await createRoot("budget-fences-fit");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Agents\n\nShort floor.\n", "utf8");
    const fencesDir = path.join(rootDir, "docs/60-engineering");
    await mkdir(fencesDir, { recursive: true });
    await writeFile(
      path.join(fencesDir, "FENCES.md"),
      ["# Fences", "", "## `src/billing.ts`", "Why: four writes are deliberate.", ""].join("\n"),
      "utf8",
    );

    const findings = await checkContextBudget({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("warns when the fence index outgrows its share of the budget", async () => {
    // The SessionStart hook injects the fence index into every session, so it is
    // always-loaded weight — but truncation hid its growth from this check entirely.
    const rootDir = await createRoot("budget-fences-over");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Agents\n", "utf8");
    const lines = ["# Fences", ""];
    for (let i = 0; i < 1500; i += 1) {
      lines.push(`## \`src/mod/file${String(i).padStart(4, "0")}.ts\``);
      lines.push(`Why: reason number ${i}; do not merge the handlers.`);
      lines.push("");
    }
    const fencesDir = path.join(rootDir, "docs/60-engineering");
    await mkdir(fencesDir, { recursive: true });
    await writeFile(path.join(fencesDir, "FENCES.md"), lines.join("\n"), "utf8");

    const findings = await checkContextBudget({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "context-budget",
        message: expect.stringContaining("fence"),
      }),
    );
  });

  it("counts the Always lessons toward the budget like the fence index", async () => {
    // The SessionStart hook injects the Always bullets into every session after
    // the fence index, so they are always-loaded weight under the same budget.
    const rootDir = await createRoot("budget-always-over");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Agents\n", "utf8");
    const lines = ["# Lessons", "", "## Always", ""];
    for (let i = 0; i < 800; i += 1) {
      lines.push(`- Always lesson number ${i} that every task must follow.`);
    }
    const lessonsDir = path.join(rootDir, "docs/60-engineering");
    await mkdir(lessonsDir, { recursive: true });
    await writeFile(path.join(lessonsDir, "LESSONS.md"), lines.join("\n"), "utf8");

    const findings = await checkContextBudget({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "context-budget",
        message: expect.stringContaining("Always lessons"),
      }),
    );
  });

  it("stays silent for an Always section that fits the budget", async () => {
    const rootDir = await createRoot("budget-always-fit");
    await writeFile(path.join(rootDir, "AGENTS.md"), "# Agents\n\nShort floor.\n", "utf8");
    const lessonsDir = path.join(rootDir, "docs/60-engineering");
    await mkdir(lessonsDir, { recursive: true });
    await writeFile(
      path.join(lessonsDir, "LESSONS.md"),
      ["# Lessons", "", "## Always", "", "- Never log a raw driver error.", ""].join("\n"),
      "utf8",
    );

    const findings = await checkContextBudget({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("counts a Cursor rule toward the budget", async () => {
    const rootDir = await createRoot("budget-cursor");
    const cursorDir = path.join(rootDir, ".cursor/rules");
    await mkdir(cursorDir, { recursive: true });
    await writeFile(path.join(cursorDir, "persist-memory.mdc"), "y".repeat(25 * 1024), "utf8");

    const findings = await checkContextBudget({ rootDir, config: createDefaultConfig() });

    expect(findings.some((finding) => finding.check === "context-budget")).toBe(true);
  });
});
