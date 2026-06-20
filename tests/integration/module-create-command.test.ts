import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  removeTempRoot,
  runCommand,
  runInitCommand
} from "../helpers/init-test-helpers.js";

describe("module create command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("requires initialized config", async () => {
    const rootDir = await createRoot("module-config-required");
    const result = await runCommand(rootDir, ["module", "create", "billing"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Run `specforge init` first.");
    expect(await listRelativeFiles(rootDir)).toEqual([]);
  });

  it("creates module folder and required docs", async () => {
    const rootDir = await createRoot("module-create");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["module", "create", "billing"]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("SpecForge module create complete.");
    expect(result.stdout).toContain("Module: docs/30-modules/billing");
    expect(await listRelativeFiles(path.join(rootDir, "docs/30-modules/billing"))).toEqual([
      "DECISIONS.md",
      "MODULE.md",
      "TASKS.md",
      "TEST_PLAN.md"
    ]);
    expect(await readGeneratedFile(rootDir, "docs/30-modules/billing/MODULE.md"))
      .toContain("# Module: Billing");
  });

  it("rejects unsafe module names", async () => {
    const rootDir = await createRoot("module-unsafe");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["module", "create", "../../evil"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Name cannot contain path separators.");
    expect(await listRelativeFiles(rootDir)).not.toContain(
      "docs/30-modules/evil/MODULE.md"
    );
  });

  it("skips existing files by default", async () => {
    const rootDir = await createRoot("module-skip");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["module", "create", "billing"]);

    const modulePath = path.join(rootDir, "docs/30-modules/billing/MODULE.md");
    await writeFile(modulePath, "custom module\n", "utf8");

    const result = await runCommand(rootDir, ["module", "create", "billing"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Skipped:");
    expect(await readFile(modulePath, "utf8")).toBe("custom module\n");
  });

  it("dry run writes nothing and reports planned files", async () => {
    const rootDir = await createRoot("module-dry-run");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, [
      "module",
      "create",
      "billing",
      "--dry-run"
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("SpecForge module create dry run complete.");
    expect(result.stdout).toContain("Planned creates:");
    expect(await listRelativeFiles(rootDir)).not.toContain(
      "docs/30-modules/billing/MODULE.md"
    );
  });

  it("force overwrites explicitly", async () => {
    const rootDir = await createRoot("module-force");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["module", "create", "billing"]);

    const modulePath = path.join(rootDir, "docs/30-modules/billing/MODULE.md");
    await writeFile(modulePath, "custom module\n", "utf8");

    const result = await runCommand(rootDir, [
      "module",
      "create",
      "billing",
      "--force"
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Overwritten:");
    expect(await readFile(modulePath, "utf8")).toContain("# Module: Billing");
  });

  it("uses configured modulesDir", async () => {
    const rootDir = await createRoot("module-configured-dir");
    await runInitCommand(rootDir);
    const configPath = path.join(rootDir, ".specforge/config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<
      string,
      unknown
    >;
    config.modulesDir = "memory/modules";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    const result = await runCommand(rootDir, ["module", "create", "billing"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Module: memory/modules/billing");
    expect(await readGeneratedFile(rootDir, "memory/modules/billing/MODULE.md"))
      .toContain("# Module: Billing");
  });
});
