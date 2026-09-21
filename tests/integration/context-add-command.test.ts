import { rename, readFile, writeFile } from "node:fs/promises";
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

/**
 * The habit this command exists to start: the agent that just finished work
 * records the area while it is fresh, so the next lookup has something to
 * find. A scaffold that overwrites, lands outside the repo, or writes on a
 * dry run breaks that trust at the first use.
 */
describe("persist context add", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function initializedRepo(prefix: string): Promise<string> {
    const rootDir = await createRoot(prefix);
    await runInitCommand(rootDir, ["--yes"]);
    return rootDir;
  }

  it("scaffolds a card with the exact shape the reader parses", async () => {
    const rootDir = await initializedRepo("context-add-shape");

    const result = await runCommand(rootDir, [
      "context",
      "add",
      "splitting and rounding",
      "--purpose",
      "How an expense is divided between members.",
    ]);

    expect(result.exitCode).toBe(0);
    const card = await readGeneratedFile(rootDir, "docs/context/splitting-and-rounding.md");
    for (const heading of [
      "# Splitting and rounding",
      "## Purpose",
      "## Answers",
      "## Also Known As",
      "## Start Here",
      "## Rules",
      "## Pitfalls",
      "## Applies To",
    ]) {
      expect(card).toContain(heading);
    }
    expect(card).toContain("How an expense is divided between members.");
  });

  it("refuses to overwrite an existing card", async () => {
    const rootDir = await initializedRepo("context-add-exists");

    await runCommand(rootDir, [
      "context",
      "add",
      "billing",
      "--purpose",
      "Charges.",
    ]);
    const cardPath = path.join(rootDir, "docs/context/billing.md");
    await writeFile(cardPath, `${await readFile(cardPath, "utf8")}\n- hand edit\n`, "utf8");

    const result = await runCommand(rootDir, [
      "context",
      "add",
      "billing",
      "--purpose",
      "Different purpose.",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("already exists");
    expect(await readFile(cardPath, "utf8")).toContain("hand edit");
  });

  it("writes nothing on --dry-run", async () => {
    const rootDir = await initializedRepo("context-add-dry");

    const result = await runCommand(rootDir, [
      "context",
      "add",
      "billing",
      "--purpose",
      "Charges.",
      "--dry-run",
    ]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).not.toContain("docs/context/billing.md");
  });

  it("refuses outside an initialised repository", async () => {
    const rootDir = await createRoot("context-add-no-repo");

    const result = await runCommand(rootDir, [
      "context",
      "add",
      "billing",
      "--purpose",
      "Charges.",
    ]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/init/);
    const files = await listRelativeFiles(rootDir);
    expect(files.some((file) => file.endsWith("billing.md"))).toBe(false);
  });

  it("follows a moved docsDir", async () => {
    const rootDir = await initializedRepo("context-add-moved");
    await rename(path.join(rootDir, "docs"), path.join(rootDir, ".memory"));
    const configPath = path.join(rootDir, ".persist/config.json");
    const config = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
    await writeFile(
      configPath,
      `${JSON.stringify({ ...config, docsDir: ".memory" }, null, 2)}\n`,
      "utf8",
    );

    const result = await runCommand(rootDir, [
      "context",
      "add",
      "billing",
      "--purpose",
      "Charges.",
    ]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".memory/context/billing.md");
    expect(files.some((file) => file.startsWith("docs/"))).toBe(false);
  });

  it("refuses a card with no purpose", async () => {
    const rootDir = await initializedRepo("context-add-no-purpose");

    const result = await runCommand(rootDir, [
      "context",
      "add",
      "billing",
      "--purpose",
      "   ",
    ]);

    expect(result.exitCode).not.toBe(0);
  });
});
