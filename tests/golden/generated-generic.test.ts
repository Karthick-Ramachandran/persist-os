import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  readGeneratedFile,
  readGeneratedJson,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";
import type { RecallConfig } from "../../src/core/config/config-schema.js";

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
      ".agents/skills/architecture-drift-review/SKILL.md",
      ".agents/skills/capture-mcp-context/SKILL.md",
      ".agents/skills/completion-report/SKILL.md",
      ".agents/skills/create-adr/SKILL.md",
      ".agents/skills/create-prd/SKILL.md",
      ".agents/skills/implement-task/SKILL.md",
      ".agents/skills/plan-feature/SKILL.md",
      ".agents/skills/plan-module/SKILL.md",
      ".agents/skills/security-review/SKILL.md",
      ".agents/skills/update-module-memory/SKILL.md",
      ".agents/skills/write-tests/SKILL.md",
      ".claude/hooks/session-start.sh",
      ".claude/settings.json",
      ".claude/skills/architecture-drift-review/SKILL.md",
      ".claude/skills/capture-mcp-context/SKILL.md",
      ".claude/skills/completion-report/SKILL.md",
      ".claude/skills/create-adr/SKILL.md",
      ".claude/skills/create-prd/SKILL.md",
      ".claude/skills/implement-task/SKILL.md",
      ".claude/skills/plan-feature/SKILL.md",
      ".claude/skills/plan-module/SKILL.md",
      ".claude/skills/security-review/SKILL.md",
      ".claude/skills/update-module-memory/SKILL.md",
      ".claude/skills/write-tests/SKILL.md",
      ".cursor/rules/recall-memory.mdc",
      ".github/workflows/recall.yml",
      ".recall/config.json",
      ".recall/hooks/pre-commit",
      ".recall/hooks/pre-push",
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
      "docs/ai/RECALL_COMMANDS.md",
    ]);

    const config = await readGeneratedJson<RecallConfig>(rootDir, ".recall/config.json");
    expect(config.preset).toBe("generic");
    expect(await readGeneratedFile(rootDir, "docs/ai/presets/generic-guidance.md")).toContain(
      "neutral repository memory",
    );
  });
});
