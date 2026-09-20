import { existsSync } from "node:fs";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

describe("skill create and mcp add honor aiTools", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("codex-only repo: skill create writes only .agents/skills", async () => {
    const rootDir = await createRoot("skill-aitools-codex");
    await runInitCommand(rootDir, ["--ai-tools", "codex"]);

    const result = await runCommand(rootDir, ["skill", "create", "demo-skill"]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".agents/skills/demo-skill/SKILL.md");
    expect(files.some((file) => file.startsWith(".claude/"))).toBe(false);
    expect(result.stdout).not.toContain(".claude/skills/demo-skill/");
    expect(result.stdout).toContain(".agents/skills/demo-skill/");
  });

  it("claude-only repo: skill create writes only .claude/skills", async () => {
    const rootDir = await createRoot("skill-aitools-claude");
    await runInitCommand(rootDir, ["--ai-tools", "claude"]);

    const result = await runCommand(rootDir, ["skill", "create", "demo-skill"]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".claude/skills/demo-skill/SKILL.md");
    expect(files.some((file) => file.startsWith(".agents/"))).toBe(false);
  });

  it("codex-only repo: mcp add never creates .claude", async () => {
    const rootDir = await createRoot("mcp-aitools-codex");
    await runInitCommand(rootDir, ["--ai-tools", "codex"]);

    const result = await runCommand(rootDir, ["mcp", "add", "figma"]);

    expect(result.exitCode).toBe(0);
    expect(existsSync(`${rootDir}/.claude`)).toBe(false);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain("docs/ai/mcp/figma.md");
    expect(files).toContain(".agents/skills/capture-mcp-context/SKILL.md");
  });

  it("default repo: skill create still writes both targets (zero regression)", async () => {
    const rootDir = await createRoot("skill-aitools-default");
    await runInitCommand(rootDir, []);

    const result = await runCommand(rootDir, ["skill", "create", "demo-skill"]);

    expect(result.exitCode).toBe(0);
    const files = await listRelativeFiles(rootDir);
    expect(files).toContain(".claude/skills/demo-skill/SKILL.md");
    expect(files).toContain(".agents/skills/demo-skill/SKILL.md");
  });
});
