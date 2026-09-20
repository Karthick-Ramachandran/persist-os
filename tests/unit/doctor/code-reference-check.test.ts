import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkCodeReferences } from "../../../src/core/doctor/checks/code-reference-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor code-reference checks", () => {
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

  it("reports not-evaluated when no feature or module folders exist", async () => {
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
        "no feature or module folders exist, so there is no memory to scan for code references",
    });
  });
});
