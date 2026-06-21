import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ConfigValidationError, parseConfig } from "../../../src/core/config/config-schema.js";
import { createDefaultConfig } from "../../../src/core/config/default-config.js";

describe("config schema", () => {
  it("validates the default config", () => {
    expect(createDefaultConfig()).toEqual({
      version: "0.1.0",
      templateVersion: "0.1.0",
      preset: null,
      memoryProfile: "standard",
      mode: "standard",
      aiTools: ["claude", "codex", "cursor"],
      docsDir: "docs",
      featuresDir: "docs/40-features",
      modulesDir: "docs/30-modules",
      adrDir: "docs/adrs",
      writePolicy: "skip-existing",
      preCommitGates: [],
    });
  });

  it("validates the dogfooded root config", () => {
    const rawConfig = readFileSync(path.join(process.cwd(), ".recall", "config.json"), "utf8");

    expect(parseConfig(JSON.parse(rawConfig))).toEqual(createDefaultConfig());
  });

  it("rejects invalid enum values", () => {
    const baseConfig = createDefaultConfig();

    expect(() => parseConfig({ ...baseConfig, memoryProfile: "full" })).toThrow(
      ConfigValidationError,
    );
    expect(() => parseConfig({ ...baseConfig, mode: "full" })).toThrow(ConfigValidationError);
    expect(() => parseConfig({ ...baseConfig, aiTools: ["claude", "unknown"] })).toThrow(
      ConfigValidationError,
    );
    expect(() => parseConfig({ ...baseConfig, writePolicy: "backup-and-write" })).toThrow(
      ConfigValidationError,
    );
  });

  it("rejects invalid preset values", () => {
    const baseConfig = createDefaultConfig();

    expect(() => parseConfig({ ...baseConfig, preset: 42 })).toThrow(ConfigValidationError);
    expect(() => parseConfig({ ...baseConfig, preset: "Next JS" })).toThrow(ConfigValidationError);
    expect(() => parseConfig({ ...baseConfig, preset: "../../evil" })).toThrow(
      ConfigValidationError,
    );
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

  it("requires memoryProfile and mode to match", () => {
    expect(() =>
      parseConfig({ ...createDefaultConfig(), memoryProfile: "lite", mode: "standard" }),
    ).toThrow(ConfigValidationError);
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
