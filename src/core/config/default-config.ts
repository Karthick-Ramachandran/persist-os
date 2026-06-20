import { parseConfig, type SpecForgeConfig } from "./config-schema.js";

const DEFAULT_CONFIG = {
  version: "0.1.0",
  templateVersion: "0.1.0",
  preset: null,
  memoryProfile: "standard",
  mode: "standard",
  aiTools: ["claude", "codex"],
  docsDir: "docs",
  featuresDir: "docs/40-features",
  modulesDir: "docs/30-modules",
  adrDir: "docs/adrs",
  writePolicy: "skip-existing"
} satisfies SpecForgeConfig;

export function createDefaultConfig(
  overrides: Partial<SpecForgeConfig> = {}
): SpecForgeConfig {
  return parseConfig({
    ...DEFAULT_CONFIG,
    aiTools: [...DEFAULT_CONFIG.aiTools],
    ...overrides
  });
}
