import { PERSIST_VERSION } from "../version.js";
import { parseConfig, type PersistConfig } from "./config-schema.js";

const DEFAULT_CONFIG = {
  version: PERSIST_VERSION,
  templateVersion: PERSIST_VERSION,
  preset: null,
  aiTools: ["claude", "codex", "cursor"],
  docsDir: "docs",
  featuresDir: "docs/40-features",
  modulesDir: "docs/30-modules",
  adrDir: "docs/adrs",
  preCommitGates: [],
} satisfies PersistConfig;

export function createDefaultConfig(overrides: Partial<PersistConfig> = {}): PersistConfig {
  return parseConfig({
    ...DEFAULT_CONFIG,
    aiTools: [...DEFAULT_CONFIG.aiTools],
    preCommitGates: [...DEFAULT_CONFIG.preCommitGates],
    ...overrides,
  });
}
