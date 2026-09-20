import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

describe("feature create command", () => {
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
    const rootDir = await createRoot("feature-config-required");
    const result = await runCommand(rootDir, ["feature", "create", "auth-provider"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Run `persist init` first.");
    expect(await listRelativeFiles(rootDir)).toEqual([]);
  });

  it("creates feature folder and required docs", async () => {
    const rootDir = await createRoot("feature-create");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["feature", "create", "auth-provider"]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persist OS feature create complete.");
    expect(result.stdout).toContain("Feature: docs/40-features/F-001-auth-provider");
    expect(
      await listRelativeFiles(path.join(rootDir, "docs/40-features/F-001-auth-provider")),
    ).toEqual(["PLAN.md", "TASKS.md"]);
    expect(
      await readGeneratedFile(rootDir, "docs/40-features/F-001-auth-provider/PLAN.md"),
    ).toContain("# Plan: Auth Provider");
  });

  it("increments feature numbers and ignores malformed folders", async () => {
    const rootDir = await createRoot("feature-increment");
    await runInitCommand(rootDir);
    await mkdir(path.join(rootDir, "docs/40-features/F-002-existing"), {
      recursive: true,
    });
    await mkdir(path.join(rootDir, "docs/40-features/F-999"), { recursive: true });

    const result = await runCommand(rootDir, ["feature", "create", "billing"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Feature: docs/40-features/F-003-billing");
  });

  it("rejects unsafe feature names", async () => {
    const rootDir = await createRoot("feature-unsafe");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["feature", "create", "../../evil"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Name cannot contain path separators.");
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/40-features/F-001-evil/PLAN.md");
  });

  it("skips existing files by default", async () => {
    const rootDir = await createRoot("feature-skip");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);

    const prdPath = path.join(rootDir, "docs/40-features/F-001-auth-provider/PLAN.md");
    await writeFile(prdPath, "custom prd\n", "utf8");

    const result = await runCommand(rootDir, ["feature", "create", "auth-provider"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Skipped:");
    expect(await readFile(prdPath, "utf8")).toBe("custom prd\n");
  });

  it("dry run writes nothing and reports planned files", async () => {
    const rootDir = await createRoot("feature-dry-run");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["feature", "create", "auth-provider", "--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Persist OS feature create dry run complete.");
    expect(result.stdout).toContain("Planned creates:");
    expect(await listRelativeFiles(rootDir)).not.toContain(
      "docs/40-features/F-001-auth-provider/PLAN.md",
    );
  });

  it("force overwrites explicitly", async () => {
    const rootDir = await createRoot("feature-force");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["feature", "create", "auth-provider"]);

    const prdPath = path.join(rootDir, "docs/40-features/F-001-auth-provider/PLAN.md");
    await writeFile(prdPath, "custom prd\n", "utf8");

    const result = await runCommand(rootDir, ["feature", "create", "auth-provider", "--force"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Overwritten:");
    expect(await readFile(prdPath, "utf8")).toContain("# Plan: Auth Provider");
  });

  it("uses configured featuresDir", async () => {
    const rootDir = await createRoot("feature-configured-dir");
    await runInitCommand(rootDir);
    const configPath = path.join(rootDir, ".persist/config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
    config.featuresDir = "memory/features";
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    const result = await runCommand(rootDir, ["feature", "create", "checkout"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Feature: memory/features/F-001-checkout");
    expect(await readGeneratedFile(rootDir, "memory/features/F-001-checkout/PLAN.md")).toContain(
      "# Plan: Checkout",
    );
  });
});
