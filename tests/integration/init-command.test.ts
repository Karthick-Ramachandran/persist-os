import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";
import type { PersistConfig } from "../../src/core/config/config-schema.js";

describe("init command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("creates config and repository memory in an empty folder", async () => {
    const rootDir = await createRoot("init-empty");
    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persist OS init complete.");
    expect(result.stdout).toContain("Created:");

    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    expect(config.testCommand).toBeNull();
    expect(config.prePushGates).toEqual([]);
    expect(await readGeneratedFile(rootDir, "AGENTS.md")).toContain("repository memory");
    expect(await readGeneratedFile(rootDir, "docs/00-product/PRODUCT.md")).toContain(
      "Describe what this repository is building",
    );
  });

  it("works in a non-Git directory", async () => {
    const rootDir = await createRoot("init-non-git");
    const result = await runInitCommand(rootDir);
    const files = await listRelativeFiles(rootDir);

    expect(result.exitCode).toBe(0);
    expect(files).toContain(".persist/config.json");
    expect(files).not.toContain(".git/config");
  });

  it("skips existing files by default", async () => {
    const rootDir = await createRoot("init-skip");
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toBe("custom agents\n");
    expect(result.stdout).toContain("Skipped:");
    expect(result.stdout).toContain("- AGENTS.md");
  });

  it("dry run writes nothing and reports planned files", async () => {
    const rootDir = await createRoot("init-dry-run");
    const result = await runInitCommand(rootDir, ["--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Persist OS init dry run complete.");
    expect(result.stdout).toContain("Planned creates:");
    expect(await listRelativeFiles(rootDir)).toEqual([]);
  });

  it("force overwrites explicitly", async () => {
    const rootDir = await createRoot("init-force");
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir, ["--force"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Overwritten:");
    expect(result.stdout).toContain("- AGENTS.md");
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toContain("Agent Instructions");
  });

  it("generates executable pre-commit and pre-push hooks and proposes activation", async () => {
    const rootDir = await createRoot("init-hook");
    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Pre-commit and pre-push hooks written to .persist/hooks/");
    expect(result.stdout).toContain("git config core.hooksPath .persist/hooks");

    for (const name of ["pre-commit", "pre-push"]) {
      const hookPath = path.join(rootDir, `.persist/hooks/${name}`);
      const hook = await readFile(hookPath, "utf8");
      expect(hook.startsWith("#!/bin/sh")).toBe(true);
      expect((await stat(hookPath)).mode & 0o100).toBe(0o100);
    }

    const preCommit = await readFile(path.join(rootDir, ".persist/hooks/pre-commit"), "utf8");
    const prePush = await readFile(path.join(rootDir, ".persist/hooks/pre-push"), "utf8");
    expect(preCommit).toContain("persist doctor");
    expect(preCommit).not.toContain("persist test-gate");
    expect(prePush).toContain("persist test-gate");
    expect(prePush).not.toContain("persist doctor");

    const config = await readGeneratedJson<PersistConfig>(rootDir, ".persist/config.json");
    expect(config.preCommitGates).toEqual([]);
  });

  it("skips an existing pre-commit hook unless forced", async () => {
    const rootDir = await createRoot("init-hook-skip");
    await mkdir(path.join(rootDir, ".persist/hooks"), { recursive: true });
    await writeFile(path.join(rootDir, ".persist/hooks/pre-commit"), "#!/bin/sh\ncustom\n", "utf8");

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, ".persist/hooks/pre-commit"), "utf8")).toBe(
      "#!/bin/sh\ncustom\n",
    );
  });

  it("refuses init --force on an existing installation without --reinit", async () => {
    const rootDir = await createRoot("init-force-existing");
    await runInitCommand(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir, ["--force"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(
      "Refusing to re-initialize an existing Persist OS installation.",
    );
    expect(result.stderr).toContain("--reinit");
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toBe("custom agents\n");
  });

  it("allows init --force --reinit on an existing installation", async () => {
    const rootDir = await createRoot("init-force-reinit");
    await runInitCommand(rootDir);
    await writeFile(path.join(rootDir, "AGENTS.md"), "custom agents\n", "utf8");

    const result = await runInitCommand(rootDir, ["--force", "--reinit"]);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "AGENTS.md"), "utf8")).toContain("Agent Instructions");
  });

  it("generates opt-in scaffolding only with --features and --modules", async () => {
    const rootDir = await createRoot("init-optin");
    const plain = await runInitCommand(rootDir);

    expect(plain.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/40-features/README.md");
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/30-modules/README.md");

    const opted = await runInitCommand(rootDir, ["--features", "--modules", "--force", "--reinit"]);

    expect(opted.exitCode).toBe(0);
    expect(await readGeneratedFile(rootDir, "docs/40-features/README.md")).toContain(
      "TEST_PLAN.md",
    );
    expect(await readGeneratedFile(rootDir, "docs/30-modules/README.md")).toContain(
      "Module Memory",
    );
  });

  it("initializes inside existing app folders without requiring framework files", async () => {
    const rootDir = await createRoot("init-existing-app");
    await mkdir(path.join(rootDir, "src"));
    await writeFile(path.join(rootDir, "src", "index.ts"), "export {};\n", "utf8");

    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "src", "index.ts"), "utf8")).toBe("export {};\n");
    expect(await readGeneratedFile(rootDir, ".persist/config.json")).toContain(
      '"testCommand": null',
    );
  });
});
