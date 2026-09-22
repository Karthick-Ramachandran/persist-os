import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkCodeReferences } from "../../../src/core/doctor/checks/code-reference-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor code-reference checks", () => {
  it("flags a fence whose file no longer exists", async () => {
    // A fence is current-state memory. A renamed or deleted file leaves an entry pointing at
    // nothing — inert, but still loaded into every session by the SessionStart hook.
    const rootDir = await createRoot("coderef-dead-fence");
    await mkdir(path.join(rootDir, "docs/60-engineering"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/60-engineering/FENCES.md"),
      "# Fences\n\n## `src/gone.ts`\n\nWhy: Deliberate.\n",
      "utf8",
    );

    const { findings } = await checkCodeReferences({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "code-reference",
        message: expect.stringContaining("src/gone.ts"),
      }),
    );
  });

  it("stays quiet on a fence whose file still exists", async () => {
    const rootDir = await createRoot("coderef-live-fence");
    await mkdir(path.join(rootDir, "src"), { recursive: true });
    await writeFile(path.join(rootDir, "src/here.ts"), "export const x = 1;\n", "utf8");
    await mkdir(path.join(rootDir, "docs/60-engineering"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/60-engineering/FENCES.md"),
      "# Fences\n\n## `src/here.ts`\n\nWhy: Deliberate.\n",
      "utf8",
    );

    const { findings } = await checkCodeReferences({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("resolves a symbol-suffixed fence to its file before checking existence", async () => {
    // The shared backticked-path pattern does not admit a `:symbol` suffix, so fences are read
    // from their headings instead. Without that, a suffixed fence would never be checked at all.
    const rootDir = await createRoot("coderef-suffixed-fence");
    await mkdir(path.join(rootDir, "docs/60-engineering"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/60-engineering/FENCES.md"),
      "# Fences\n\n## `src/gone.ts:writeLedger`\n\nWhy: Deliberate.\n",
      "utf8",
    );

    const { findings } = await checkCodeReferences({ rootDir, config: createDefaultConfig() });

    expect(findings).toHaveLength(1);
  });

  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeModule(rootDir: string, body: string): Promise<void> {
    const moduleDir = path.join(rootDir, "docs/30-modules/blog-store");
    await mkdir(moduleDir, { recursive: true });
    await writeFile(path.join(moduleDir, "MODULE.md"), `# Module\n\n${body}\n`, "utf8");
  }

  async function writeAdr(rootDir: string, body: string): Promise<void> {
    const adrDir = path.join(rootDir, "docs/adrs");
    await mkdir(adrDir, { recursive: true });
    await writeFile(path.join(adrDir, "ADR-0001-example.md"), `# ADR-0001\n\n${body}\n`, "utf8");
  }

  async function writeSource(rootDir: string, relativePath: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, "export {};\n", "utf8");
  }

  async function writeFeatureDoc(
    rootDir: string,
    fileName: string,
    content: string,
  ): Promise<void> {
    const featureDir = path.join(rootDir, "docs/40-features/F-001-x");
    await mkdir(featureDir, { recursive: true });
    await writeFile(path.join(featureDir, fileName), content, "utf8");
  }

  it("flags a module that references a source path which does not exist", async () => {
    const rootDir = await createRoot("coderef-missing");
    await mkdir(path.join(rootDir, "src/lib"), { recursive: true });
    await writeFile(path.join(rootDir, "src/lib/store.ts"), "export {};\n", "utf8");
    await writeModule(rootDir, "Owns `src/lib/store.ts` and `src/lib/missing.ts`.");

    const { findings } = await checkCodeReferences({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "drift-code-reference",
        message: "Repository memory references src/lib/missing.ts, which does not exist.",
        path: "docs/30-modules/blog-store/MODULE.md",
      }),
    );
    // The real file is not flagged.
    expect(findings).not.toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("src/lib/store.ts") }),
    );
  });

  it("ignores placeholder paths and produces nothing when all references exist", async () => {
    const rootDir = await createRoot("coderef-clean");
    await mkdir(path.join(rootDir, "src/core"), { recursive: true });
    await writeFile(path.join(rootDir, "src/core/store.ts"), "export {};\n", "utf8");
    await writeModule(
      rootDir,
      "Owns `src/core/store.ts`. Generated at `src/presets/<id>/preset.ts`.",
    );

    const { findings } = await checkCodeReferences({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("flags an ADR that references a source path which does not exist", async () => {
    const rootDir = await createRoot("coderef-adr-missing");
    await writeSource(rootDir, "src/lib/store.ts");
    await writeAdr(rootDir, "Owns `src/lib/store.ts` and `src/does/not/exist.ts`.");

    const { findings, outcome } = await checkCodeReferences({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "code-references", status: "evaluated" });
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "drift-code-reference",
        message: "Repository memory references src/does/not/exist.ts, which does not exist.",
        path: "docs/adrs/ADR-0001-example.md",
      }),
    );
    expect(findings).not.toContainEqual(
      expect.objectContaining({ message: expect.stringContaining("src/lib/store.ts") }),
    );
  });

  it("flags a lesson citing a deleted file", async () => {
    const rootDir = await createRoot("coderef-dead-lesson");
    const lessonsDir = path.join(rootDir, "docs/60-engineering");
    await mkdir(lessonsDir, { recursive: true });
    await writeFile(
      path.join(lessonsDir, "LESSONS.md"),
      "# Lessons\n\n## Deploy\n\n- Always gate `src/lib/removed.ts` behind a flag.\n",
      "utf8",
    );

    const { findings } = await checkCodeReferences({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "drift-code-reference",
        message: "Repository memory references src/lib/removed.ts, which does not exist.",
        path: "docs/60-engineering/LESSONS.md",
      }),
    );
  });

  it("stays quiet on healthy ADRs and conventions", async () => {
    const rootDir = await createRoot("coderef-healthy");
    await writeSource(rootDir, "src/lib/store.ts");
    await writeAdr(rootDir, "Owns `src/lib/store.ts`.");
    const conventionsDir = path.join(rootDir, "docs/60-engineering");
    await mkdir(conventionsDir, { recursive: true });
    await writeFile(
      path.join(conventionsDir, "CONVENTIONS.md"),
      "# Conventions\n\nReuse `src/lib/store.ts`.\n",
      "utf8",
    );

    const { findings, outcome } = await checkCodeReferences({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "code-references", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("treats a completed feature's docs as history", async () => {
    const rootDir = await createRoot("coderef-history");
    await writeFeatureDoc(
      rootDir,
      "ARCHITECTURE_IMPACT.md",
      "# Architecture Impact\n\nBuilt `src/lib/removed.ts`.\n",
    );
    await writeFeatureDoc(rootDir, "COMPLETION_REPORT.md", "# Completion Report\n");

    const { findings, outcome } = await checkCodeReferences({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "code-references", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("still flags an in-progress feature's docs", async () => {
    const rootDir = await createRoot("coderef-inprogress");
    await writeFeatureDoc(
      rootDir,
      "ARCHITECTURE_IMPACT.md",
      "# Architecture Impact\n\nBuilds `src/lib/removed.ts`.\n",
    );

    const { findings } = await checkCodeReferences({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "drift-code-reference",
        message: "Repository memory references src/lib/removed.ts, which does not exist.",
        path: "docs/40-features/F-001-x/ARCHITECTURE_IMPACT.md",
      }),
    );
  });

  it("reports not-evaluated when no scannable memory exists", async () => {
    const rootDir = await createRoot("coderef-empty");

    const { findings, outcome } = await checkCodeReferences({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "code-references",
      status: "not-evaluated",
      reason:
        "no ADRs, conventions, lessons, feature folders, or module folders exist, so there is no memory to scan for code references",
    });
  });
});
