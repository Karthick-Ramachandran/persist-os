import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkFence } from "../../../src/core/doctor/checks/fence-check.js";
import type { DoctorCheckContext } from "../../../src/core/doctor/doctor-check.js";
import { FenceValidationError, addFenceEntry } from "../../../src/core/fence/generate-fence.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

/**
 * "No constraint" is an answer, and it is recorded: a human said nothing in
 * the file is deliberate, named themselves, and from then on the file stays
 * quiet. A real reason replaces it; it never replaces a real reason.
 */
describe("no-constraint fence entries", () => {
  it("writes the exact block", () => {
    const out = addFenceEntry(undefined, {
      path: "src/lib/types.ts",
      noConstraint: true,
      by: "Karthick",
      date: "2026-09-22",
    });

    expect(out).toContain("## `src/lib/types.ts`");
    expect(out).toContain(
      "No constraint: a human confirmed nothing here is deliberate; change it freely.",
    );
    expect(out).toContain("- 2026-09-22 — no constraint, confirmed by Karthick.");
  });

  it("requires --by: an unnamed answer is worth nothing", () => {
    expect(() =>
      addFenceEntry(undefined, { path: "src/a.ts", noConstraint: true, date: "2026-09-22" }),
    ).toThrow(FenceValidationError);
  });

  it("refuses --why together with --no-constraint", () => {
    expect(() =>
      addFenceEntry(undefined, {
        path: "src/a.ts",
        why: "Deliberate.",
        noConstraint: true,
        by: "Karthick",
        date: "2026-09-22",
      }),
    ).toThrow(/either --why or --no-constraint/);
  });

  it("refuses --adr with --no-constraint", () => {
    expect(() =>
      addFenceEntry(undefined, {
        path: "src/a.ts",
        noConstraint: true,
        by: "Karthick",
        adr: "ADR-0007",
        date: "2026-09-22",
      }),
    ).toThrow(/--adr/);
  });

  it("replaces no-constraint with a real reason and keeps the history", () => {
    const first = addFenceEntry(undefined, {
      path: "src/a.ts",
      noConstraint: true,
      by: "Karthick",
      date: "2026-09-22",
    });
    const second = addFenceEntry(first, {
      path: "src/a.ts",
      why: "Four writes are deliberate.",
      by: "Priya",
      date: "2026-09-23",
    });

    expect(second.split("## `src/a.ts`")).toHaveLength(2);
    expect(second).toContain("Why: Four writes are deliberate.");
    expect(second).not.toContain("No constraint: a human confirmed");
    expect(second).toContain("- 2026-09-22 — no constraint, confirmed by Karthick.");
    expect(second).toContain("- 2026-09-23 — reason recorded, replacing no constraint, by Priya.");
  });

  it("refuses --no-constraint over a recorded reason and writes nothing", () => {
    const first = addFenceEntry(undefined, {
      path: "src/a.ts",
      why: "Four writes are deliberate.",
      date: "2026-09-22",
    });

    let thrown: unknown;
    try {
      addFenceEntry(first, { path: "src/a.ts", noConstraint: true, by: "Karthick" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(FenceValidationError);
    expect((thrown as Error).message).toContain(
      'src/a.ts has a recorded reason: "Four writes are deliberate."',
    );
  });
});

describe("fence check with no-constraint entries", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  function contextFor(rootDir: string): DoctorCheckContext {
    return {
      rootDir,
      config: {
        docsDir: "docs",
        featuresDir: "docs/40-features",
        modulesDir: "docs/30-modules",
        adrDir: "docs/adrs",
      },
    };
  }

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  function git(rootDir: string, args: string[]): void {
    execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
  }

  async function stageTwoEdits(rootDir: string): Promise<void> {
    git(rootDir, ["init"]);
    await write(rootDir, "src/quiet.ts", "export const q = 1;\n");
    await write(rootDir, "src/loud.ts", "export const l = 1;\n");
    git(rootDir, ["config", "user.email", "test@example.com"]);
    git(rootDir, ["config", "user.name", "Test"]);
    git(rootDir, ["add", "-A"]);
    git(rootDir, ["commit", "-q", "-m", "base", "--no-verify"]);
    await write(rootDir, "src/quiet.ts", "export const q = 2;\n");
    await write(rootDir, "src/loud.ts", "export const l = 2;\n");
    await write(
      rootDir,
      "docs/60-engineering/FENCES.md",
      [
        "# Fences",
        "",
        "## `src/quiet.ts`",
        "",
        "No constraint: a human confirmed nothing here is deliberate; change it freely.",
        "",
        "- 2026-09-22 — no constraint, confirmed by Karthick.",
        "",
      ].join("\n"),
    );
    git(rootDir, ["add", "src/quiet.ts", "src/loud.ts"]);
  }

  it("silences the answered file, and only that file", async () => {
    const rootDir = await createRoot("fence-no-constraint-quiet");
    await stageTwoEdits(rootDir);

    const { findings } = await checkFence(contextFor(rootDir));
    const fence = findings.filter((finding) => finding.check === "fence");

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "warning", path: "src/loud.ts" });
  });

  it("keeps reporting the recorded reason for a Why entry", async () => {
    const rootDir = await createRoot("fence-no-constraint-why");
    await stageTwoEdits(rootDir);
    await write(
      rootDir,
      "docs/60-engineering/FENCES.md",
      [
        "# Fences",
        "",
        "## `src/quiet.ts`",
        "",
        "No constraint: a human confirmed nothing here is deliberate; change it freely.",
        "",
        "- 2026-09-22 — no constraint, confirmed by Karthick.",
        "",
        "## `src/loud.ts`",
        "",
        "Why: The split is deliberate.",
        "",
        "- 2026-09-22 — recorded by Priya.",
        "",
      ].join("\n"),
    );
    git(rootDir, ["add", "docs/60-engineering/FENCES.md"]);

    const { findings } = await checkFence(contextFor(rootDir));
    const fence = findings.filter((finding) => finding.check === "fence");

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "info", path: "src/loud.ts" });
    expect(fence[0]?.message).toContain("The split is deliberate.");
  });
});
