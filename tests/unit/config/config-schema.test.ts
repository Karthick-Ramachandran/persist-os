import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ConfigValidationError, parseConfig } from "../../../src/core/config/config-schema.js";
import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { PERSIST_VERSION } from "../../../src/core/version.js";

describe("config schema", () => {
  it("validates the default config without dead knobs", () => {
    expect(createDefaultConfig()).toEqual({
      version: PERSIST_VERSION,
      templateVersion: PERSIST_VERSION,
      aiTools: ["claude", "codex", "cursor"],
      docsDir: "docs",
      featuresDir: "docs/40-features",
      modulesDir: "docs/30-modules",
      adrDir: "docs/adrs",
      preCommitGates: [],
      prePushGates: [],
      testCommand: null,
      fenceEnabled: true,
      contextHook: true,
    });
  });

  it("loads a 0.6.x config without testCommand, prePushGates, fenceEnabled, or contextHook", () => {
    const legacy = {
      version: "0.6.2",
      templateVersion: "0.6.2",
      aiTools: ["claude", "codex", "cursor"],
      docsDir: "docs",
      featuresDir: "docs/40-features",
      modulesDir: "docs/30-modules",
      adrDir: "docs/adrs",
      preCommitGates: [],
    };

    expect(parseConfig(legacy)).toMatchObject({
      prePushGates: [],
      testCommand: null,
      fenceEnabled: true,
      contextHook: true,
    });
  });

  it("rejects an invalid testCommand", () => {
    const baseConfig = createDefaultConfig();

    expect(() => parseConfig({ ...baseConfig, testCommand: "" })).toThrow(ConfigValidationError);
    expect(() => parseConfig({ ...baseConfig, testCommand: "pnpm test\nrm -rf /" })).toThrow(
      ConfigValidationError,
    );
  });

  it("keeps version and templateVersion in sync with the package", async () => {
    const { readFile } = await import("node:fs/promises");
    const pkg = JSON.parse(
      await readFile(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as { version: string };

    expect(PERSIST_VERSION).toBe(pkg.version);
    expect(createDefaultConfig().version).toBe(pkg.version);
    expect(createDefaultConfig().templateVersion).toBe(pkg.version);
  });

  it("validates the dogfooded root config", () => {
    const rawConfig = readFileSync(path.join(process.cwd(), ".persist", "config.json"), "utf8");

    const config = parseConfig(JSON.parse(rawConfig));

    expect(config.version).toBe(createDefaultConfig().version);
    expect(Array.isArray(config.preCommitGates)).toBe(true);
    expect(config.prePushGates).toContain("pnpm run typecheck");
    expect(config.prePushGates).toContain("pnpm run lint");
    expect(typeof config.testCommand).toBe("string");
  });

  it("rejects invalid enum values", () => {
    const baseConfig = createDefaultConfig();

    expect(() => parseConfig({ ...baseConfig, aiTools: ["claude", "unknown"] })).toThrow(
      ConfigValidationError,
    );
  });

  it("accepts deprecated knobs on read for backward compat but never writes them", () => {
    const baseConfig = createDefaultConfig();

    expect(baseConfig).not.toHaveProperty("memoryProfile");
    expect(baseConfig).not.toHaveProperty("mode");
    expect(baseConfig).not.toHaveProperty("writePolicy");

    const legacy = parseConfig({
      ...baseConfig,
      memoryProfile: "standard",
      mode: "standard",
      writePolicy: "skip-existing",
    });
    expect(legacy.memoryProfile).toBe("standard");

    expect(() => parseConfig({ ...baseConfig, memoryProfile: "full" })).toThrow(
      ConfigValidationError,
    );
    expect(() => parseConfig({ ...baseConfig, writePolicy: "backup-and-write" })).toThrow(
      ConfigValidationError,
    );
  });

  it("rejects a retired preset field with the fix, not a generic error", () => {
    expect(() => parseConfig({ ...createDefaultConfig(), preset: "nextjs" })).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(
          'preset: presets were retired in 1.0 — delete the "preset" line from .persist/config.json',
        ),
      }),
    );
  });

  it("loads a 0.6.x config without preset", () => {
    const legacy = {
      version: "0.6.2",
      templateVersion: "0.6.2",
      aiTools: ["claude", "codex", "cursor"],
      docsDir: "docs",
      featuresDir: "docs/40-features",
      modulesDir: "docs/30-modules",
      adrDir: "docs/adrs",
      preCommitGates: [],
    };

    expect(parseConfig(legacy)).toMatchObject({ preCommitGates: [] });
  });

  it("accepts valid pre-commit gates and defaults them to empty", () => {
    expect(createDefaultConfig().preCommitGates).toEqual([]);
    expect(
      parseConfig({ ...createDefaultConfig(), preCommitGates: ["pnpm run test", "npm run lint"] })
        .preCommitGates,
    ).toEqual(["pnpm run test", "npm run lint"]);
  });

  it("rejects pre-commit gates with control characters", () => {
    expect(() =>
      parseConfig({ ...createDefaultConfig(), preCommitGates: ["pnpm test\nrm -rf /"] }),
    ).toThrow(ConfigValidationError);
    expect(() => parseConfig({ ...createDefaultConfig(), preCommitGates: [""] })).toThrow(
      ConfigValidationError,
    );
  });

  it("rejects duplicate AI tools", () => {
    expect(() => parseConfig({ ...createDefaultConfig(), aiTools: ["claude", "claude"] })).toThrow(
      ConfigValidationError,
    );
  });

  it("rejects unsafe paths", () => {
    const unsafePaths = [
      "../docs",
      "/tmp/docs",
      "C:/tmp/docs",
      "docs\\features",
      "docs//features",
      "docs/\u0000features",
    ];

    for (const unsafePath of unsafePaths) {
      expect(() => parseConfig({ ...createDefaultConfig(), featuresDir: unsafePath })).toThrow(
        ConfigValidationError,
      );
    }
  });

  it("normalizes safe relative paths", () => {
    expect(
      parseConfig({ ...createDefaultConfig(), featuresDir: "docs/./40-features" }),
    ).toMatchObject({
      featuresDir: "docs/40-features",
    });
  });

  it("rejects unknown keys including decision indexes and organization standards", () => {
    const baseConfig = createDefaultConfig();

    expect(() => parseConfig({ ...baseConfig, secret: "abc" })).toThrow(ConfigValidationError);
    expect(() => parseConfig({ ...baseConfig, decisions: {} })).toThrow(ConfigValidationError);
    expect(() => parseConfig({ ...baseConfig, acceptedDecisions: [] })).toThrow(
      ConfigValidationError,
    );
    expect(() => parseConfig({ ...baseConfig, proposedDecisions: [] })).toThrow(
      ConfigValidationError,
    );
    expect(() => parseConfig({ ...baseConfig, organizationStandards: [] })).toThrow(
      ConfigValidationError,
    );
  });
});
