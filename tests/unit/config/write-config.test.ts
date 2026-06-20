import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { writeConfig } from "../../../src/core/config/write-config.js";

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "specforge-config-write-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function readWrittenConfig(): Promise<string> {
  return readFile(path.join(rootDir, ".specforge", "config.json"), "utf8");
}

describe("writeConfig", () => {
  it("creates .specforge/config.json", async () => {
    const config = createDefaultConfig();

    const result = await writeConfig(rootDir, config);

    expect(result.created).toEqual([".specforge/config.json"]);
    await expect(readWrittenConfig()).resolves.toBe(`${JSON.stringify(config, null, 2)}\n`);
  });

  it("skips existing config by default", async () => {
    await mkdir(path.join(rootDir, ".specforge"), { recursive: true });
    await writeFile(path.join(rootDir, ".specforge", "config.json"), "existing", "utf8");

    const result = await writeConfig(rootDir, createDefaultConfig());

    expect(result.skipped).toEqual([".specforge/config.json"]);
    await expect(readWrittenConfig()).resolves.toBe("existing");
  });

  it("dry run writes nothing", async () => {
    const result = await writeConfig(rootDir, createDefaultConfig(), { dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.created).toEqual([".specforge/config.json"]);
    await expect(readWrittenConfig()).rejects.toThrow();
  });

  it("overwrites only with explicit force", async () => {
    await mkdir(path.join(rootDir, ".specforge"), { recursive: true });
    await writeFile(path.join(rootDir, ".specforge", "config.json"), "existing", "utf8");
    const config = createDefaultConfig({ aiTools: ["claude", "codex", "cursor"] });

    const result = await writeConfig(rootDir, config, { force: true });

    expect(result.overwritten).toEqual([".specforge/config.json"]);
    await expect(readWrittenConfig()).resolves.toBe(`${JSON.stringify(config, null, 2)}\n`);
  });

  it("rejects invalid config before writing", async () => {
    await expect(
      writeConfig(rootDir, {
        ...createDefaultConfig(),
        docsDir: "../outside"
      })
    ).rejects.toThrow();

    await expect(readWrittenConfig()).rejects.toThrow();
  });
});
