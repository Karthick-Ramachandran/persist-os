import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

const EXPECTED_MINIMAL_FILES = [
  ".agents/skills/architecture-drift-review/SKILL.md",
  ".agents/skills/capture-mcp-context/SKILL.md",
  ".agents/skills/completion-report/SKILL.md",
  ".agents/skills/conventions-adherence/SKILL.md",
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
  ".claude/skills/conventions-adherence/SKILL.md",
  ".claude/skills/create-adr/SKILL.md",
  ".claude/skills/create-prd/SKILL.md",
  ".claude/skills/implement-task/SKILL.md",
  ".claude/skills/plan-feature/SKILL.md",
  ".claude/skills/plan-module/SKILL.md",
  ".claude/skills/security-review/SKILL.md",
  ".claude/skills/update-module-memory/SKILL.md",
  ".claude/skills/write-tests/SKILL.md",
  ".cursor/rules/persist-memory.mdc",
  ".github/workflows/persist.yml",
  ".persist/config.json",
  ".persist/hooks/pre-commit",
  ".persist/hooks/pre-push",
  "AGENTS.md",
  "CLAUDE.md",
  "docs/00-product/PRODUCT.md",
  "docs/20-security/SECURITY_MODEL.md",
  "docs/50-quality/QUALITY_GATES.md",
  "docs/60-engineering/CONVENTIONS.md",
  "docs/60-engineering/ENGINEERING_STANDARDS.md",
  "docs/60-engineering/LESSONS.md",
  "docs/adrs/README.md",
];

describe("minimal generated shape (ADR-0007)", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("generates the six required documents and nothing optional", async () => {
    const rootDir = await createRoot("golden-minimal");
    const result = await runInitCommand(rootDir);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toEqual(EXPECTED_MINIMAL_FILES);
  });

  it("generates PRODUCT.md instead of PRD.md and BRD.md", async () => {
    const rootDir = await createRoot("golden-product");
    await runInitCommand(rootDir);

    const files = await listRelativeFiles(rootDir);

    expect(files).toContain("docs/00-product/PRODUCT.md");
    expect(files).not.toContain("docs/00-product/PRD.md");
    expect(files).not.toContain("docs/00-product/BRD.md");
    expect(files).not.toContain("docs/10-architecture/ARCHITECTURE.md");
    expect(files).not.toContain("docs/20-security/THREAT_MODEL.md");
    expect(files).not.toContain("docs/ai/PERSIST_COMMANDS.md");
  });

  it("generates opt-in scaffolding only with --features and --modules", async () => {
    const rootDir = await createRoot("golden-optin");
    await runInitCommand(rootDir, ["--features", "--modules"]);

    const files = await listRelativeFiles(rootDir);

    expect(files).toContain("docs/40-features/README.md");
    expect(files).toContain("docs/30-modules/README.md");
  });
});
