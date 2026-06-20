import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { ConfigLoadError, loadConfig } from "../../../src/core/config/load-config.js";

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), "specforge-config-load-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function writeRawConfig(content: string): Promise<void> {
  await mkdir(path.join(rootDir, ".specforge"), { recursive: true });
  await writeFile(path.join(rootDir, ".specforge", "config.json"), content, "utf8");
}

describe("loadConfig", () => {
  it("loads and validates config", async () => {
    const config = createDefaultConfig({ aiTools: ["claude", "codex", "cursor"] });
    await writeRawConfig(JSON.stringify(config));

    await expect(loadConfig(rootDir)).resolves.toEqual(config);
  });

  it("fails clearly when config is missing", async () => {
    await expect(loadConfig(rootDir)).rejects.toThrow(ConfigLoadError);
  });

  it("fails clearly when config is not valid JSON", async () => {
    await writeRawConfig("{");

    await expect(loadConfig(rootDir)).rejects.toThrow(ConfigLoadError);
  });

  it("rejects invalid loaded config", async () => {
    await writeRawConfig(
      JSON.stringify({
        ...createDefaultConfig(),
        docsDir: "../outside"
      })
    );

    await expect(loadConfig(rootDir)).rejects.toThrow();
  });
});
