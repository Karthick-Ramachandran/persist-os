import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runInitCommand
} from "../helpers/init-test-helpers.js";
import type { SpecForgeConfig } from "../../src/core/config/config-schema.js";

describe("generic init golden output", () => {
  let rootDir: string | undefined;

  afterEach(async () => {
    if (rootDir !== undefined) {
      await removeTempRoot(rootDir);
      rootDir = undefined;
    }
  });

  it("generates deterministic generic preset memory", async () => {
    rootDir = await createTempRoot("golden-generic");
    const result = await runInitCommand(rootDir, ["--preset", "generic"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toEqual([
      ".specforge/config.json",
      "AGENTS.md",
      "CLAUDE.md",
      "docs/00-product/BRD.md",
      "docs/00-product/PRD.md",
      "docs/10-architecture/ARCHITECTURE.md",
      "docs/10-architecture/FILE_WRITE_POLICY.md",
      "docs/10-architecture/MEMORY_ENGINE.md",
      "docs/20-security/SECURITY_MODEL.md",
      "docs/20-security/THREAT_MODEL.md",
      "docs/30-modules/README.md",
      "docs/40-features/README.md",
      "docs/50-quality/QUALITY_GATES.md",
      "docs/50-quality/TESTING_STRATEGY.md",
      "docs/60-engineering/AI_AGENT_RULES.md",
      "docs/60-engineering/ENGINEERING_STANDARDS.md",
      "docs/adrs/README.md",
      "docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md",
      "docs/ai/MCP_STRATEGY.md",
      "docs/ai/presets/generic-guidance.md",
      "docs/ai/SPECFORGE_COMMANDS.md"
    ]);

    const config = await readGeneratedJson<SpecForgeConfig>(
      rootDir,
      ".specforge/config.json"
    );
    expect(config.preset).toBe("generic");
    expect(await readGeneratedFile(rootDir, "docs/ai/presets/generic-guidance.md"))
      .toContain("neutral repository memory");
  });
});
