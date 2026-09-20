import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  advisoryToolFiles,
  checkRequiredFiles,
  requiredRootFiles,
} from "../../../src/core/doctor/checks/required-files-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("requiredRootFiles derives required files from aiTools", () => {
  it("requires AGENTS.md always", () => {
    for (const aiTools of [
      ["claude"],
      ["codex"],
      ["cursor"],
      ["generic"],
      ["claude", "codex", "cursor"],
      ["codex", "generic"],
      [],
    ]) {
      expect(requiredRootFiles(aiTools)).toContain("AGENTS.md");
    }
  });

  it("requires CLAUDE.md only when claude is selected", () => {
    expect(requiredRootFiles(["claude"])).toContain("CLAUDE.md");
    expect(requiredRootFiles(["claude", "codex"])).toContain("CLAUDE.md");
    expect(requiredRootFiles(["claude", "cursor"])).toContain("CLAUDE.md");
    expect(requiredRootFiles(["claude", "codex", "cursor", "generic"])).toContain("CLAUDE.md");
    expect(requiredRootFiles(["codex"])).not.toContain("CLAUDE.md");
    expect(requiredRootFiles(["cursor"])).not.toContain("CLAUDE.md");
    expect(requiredRootFiles(["generic"])).not.toContain("CLAUDE.md");
    expect(requiredRootFiles(["codex", "cursor"])).not.toContain("CLAUDE.md");
  });

  it("never requires the Cursor rule — Cursor reads AGENTS.md without it", () => {
    for (const aiTools of [["cursor"], ["claude", "cursor"], ["codex", "cursor"], ["generic"]]) {
      expect(requiredRootFiles(aiTools)).not.toContain(".cursor/rules/persist-memory.mdc");
    }
  });

  it("advises the Cursor rule only when cursor is selected", () => {
    expect(advisoryToolFiles(["cursor"])).toEqual([".cursor/rules/persist-memory.mdc"]);
    expect(advisoryToolFiles(["claude", "cursor"])).toEqual([".cursor/rules/persist-memory.mdc"]);
    expect(advisoryToolFiles(["claude"])).toEqual([]);
    expect(advisoryToolFiles(["codex"])).toEqual([]);
    expect(advisoryToolFiles(["generic"])).toEqual([]);
    expect(advisoryToolFiles(undefined)).toEqual([]);
  });

  it("falls back to the legacy set when aiTools is unknown", () => {
    expect(requiredRootFiles(undefined)).toEqual(["AGENTS.md", "CLAUDE.md"]);
  });
});

describe("checkRequiredFiles honors aiTools", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeRequiredDocs(rootDir: string): Promise<void> {
    const docs = [
      "docs/00-product/PRODUCT.md",
      "docs/20-security/SECURITY_MODEL.md",
      "docs/50-quality/QUALITY_GATES.md",
      "docs/60-engineering/ENGINEERING_STANDARDS.md",
      "docs/60-engineering/CONVENTIONS.md",
      "docs/60-engineering/LESSONS.md",
      "docs/adrs/README.md",
    ];

    for (const relativePath of docs) {
      const full = path.join(rootDir, relativePath);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, "# doc\n", "utf8");
    }

    for (const dir of ["docs", "docs/40-features", "docs/30-modules", "docs/adrs"]) {
      await mkdir(path.join(rootDir, dir), { recursive: true });
    }
  }

  function contextFor(aiTools: string[] | undefined) {
    return {
      rootDir: "",
      config: {
        docsDir: "docs",
        featuresDir: "docs/40-features",
        modulesDir: "docs/30-modules",
        adrDir: "docs/adrs",
        ...(aiTools === undefined ? {} : { aiTools }),
      },
    };
  }

  it("codex-only repo passes without CLAUDE.md", async () => {
    const rootDir = await createRoot("required-codex");
    await writeRequiredDocs(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "# agents\n", "utf8");

    const findings = await checkRequiredFiles({ ...contextFor(["codex"]), rootDir });
    expect(findings.filter((finding) => finding.check === "required-files")).toEqual([]);
  });

  it("cursor-only repo warns about the missing Cursor rule but never errors", async () => {
    const rootDir = await createRoot("required-cursor");
    await writeRequiredDocs(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "# agents\n", "utf8");

    const missing = await checkRequiredFiles({ ...contextFor(["cursor"]), rootDir });
    // A gitignored .cursor/ must not be able to fail the gate.
    expect(missing.filter((finding) => finding.severity === "error")).toEqual([]);
    expect(missing).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "tool-files",
        path: ".cursor/rules/persist-memory.mdc",
      }),
    );
    expect(missing.some((finding) => finding.path === "CLAUDE.md")).toBe(false);

    const rulePath = path.join(rootDir, ".cursor/rules/persist-memory.mdc");
    await mkdir(path.dirname(rulePath), { recursive: true });
    await writeFile(rulePath, "# rule\n", "utf8");

    const fixed = await checkRequiredFiles({ ...contextFor(["cursor"]), rootDir });
    expect(fixed).toEqual([]);
  });

  it("claude-only repo requires CLAUDE.md but not the Cursor rule", async () => {
    const rootDir = await createRoot("required-claude");
    await writeRequiredDocs(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "# agents\n", "utf8");
    await writeFile(path.join(rootDir, "CLAUDE.md"), "# claude\n", "utf8");

    const findings = await checkRequiredFiles({ ...contextFor(["claude"]), rootDir });
    expect(findings.filter((finding) => finding.check === "required-files")).toEqual([]);
  });

  it("generic-only repo passes with AGENTS.md alone", async () => {
    const rootDir = await createRoot("required-generic");
    await writeRequiredDocs(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "# agents\n", "utf8");

    const findings = await checkRequiredFiles({ ...contextFor(["generic"]), rootDir });
    expect(findings.filter((finding) => finding.check === "required-files")).toEqual([]);
  });
});
