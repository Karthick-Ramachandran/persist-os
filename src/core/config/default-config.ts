import { parseConfig, type RecallConfig } from "./config-schema.js";

const DEFAULT_CONFIG = {
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
} satisfies RecallConfig;

export function createDefaultConfig(overrides: Partial<RecallConfig> = {}): RecallConfig {
  return parseConfig({
    ...DEFAULT_CONFIG,
    aiTools: [...DEFAULT_CONFIG.aiTools],
    preCommitGates: [...DEFAULT_CONFIG.preCommitGates],
    ...overrides,
  });
}
