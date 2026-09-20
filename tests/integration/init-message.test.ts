import { afterEach, describe, expect, it } from "vitest";

import { createTempRoot, removeTempRoot, runInitCommand } from "../helpers/init-test-helpers.js";

describe("init message reflects generated files", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("codex-only init never mentions Claude or Cursor artifacts", async () => {
    const rootDir = await createRoot("init-msg-codex");
    const result = await runInitCommand(rootDir, ["--ai-tools", "codex"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("CLAUDE.md");
    expect(result.stdout).not.toContain(".claude/skills/");
    expect(result.stdout).not.toContain("SessionStart");
    expect(result.stdout).not.toContain("Cursor rule");
    expect(result.stdout).not.toContain(".cursor/rules/persist-memory.mdc");
    expect(result.stdout).toContain("AGENTS.md");
    expect(result.stdout).toContain(".agents/skills/");
  });

  it("claude-only init never mentions Cursor or Agent Skills artifacts", async () => {
    const rootDir = await createRoot("init-msg-claude");
    const result = await runInitCommand(rootDir, ["--ai-tools", "claude"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CLAUDE.md");
    expect(result.stdout).toContain(".claude/skills/");
    expect(result.stdout).toContain("SessionStart");
    expect(result.stdout).not.toContain("Cursor rule");
    expect(result.stdout).not.toContain(".cursor/rules/persist-memory.mdc");
    expect(result.stdout).not.toContain(".agents/skills/");
  });

  it("cursor-only init mentions the Cursor rule and Agent Skills only", async () => {
    const rootDir = await createRoot("init-msg-cursor");
    const result = await runInitCommand(rootDir, ["--ai-tools", "cursor"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("CLAUDE.md");
    expect(result.stdout).not.toContain(".claude/skills/");
    expect(result.stdout).not.toContain("SessionStart");
    expect(result.stdout).toContain("Cursor rule");
    expect(result.stdout).toContain(".agents/skills/");
  });

  it("default init mentions all three tool families", async () => {
    const rootDir = await createRoot("init-msg-default");
    const result = await runInitCommand(rootDir, []);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("CLAUDE.md");
    expect(result.stdout).toContain(".claude/skills/");
    expect(result.stdout).toContain(".agents/skills/");
    expect(result.stdout).toContain("SessionStart");
    expect(result.stdout).toContain("Cursor rule");
  });

  // AGENTS.md is generated for every tool selection, so the message must not name Codex
  // unless the user actually picked it.
  it("names Codex only when codex is selected", async () => {
    for (const [prefix, aiTools, mentionsCodex] of [
      ["init-msg-codex-named", ["--ai-tools", "codex"], true],
      ["init-msg-codex-default", [], true],
      ["init-msg-codex-claude", ["--ai-tools", "claude"], false],
      ["init-msg-codex-cursor", ["--ai-tools", "cursor"], false],
      ["init-msg-codex-generic", ["--ai-tools", "generic"], false],
    ] as const) {
      const rootDir = await createRoot(prefix);
      const result = await runInitCommand(rootDir, [...aiTools]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.includes("for Codex")).toBe(mentionsCodex);
    }
  });
});
