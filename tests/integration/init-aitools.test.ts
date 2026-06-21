import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

describe("init --ai-tools selection", () => {
  let rootDir: string | undefined;

  afterEach(async () => {
    if (rootDir !== undefined) {
      await removeTempRoot(rootDir);
      rootDir = undefined;
    }
  });

  it("default init still generates Claude, Cursor, and Agent Skills files (zero regression)", async () => {
    rootDir = await createTempRoot("aitools-default");
    await runInitCommand(rootDir, []);
    const files = await listRelativeFiles(rootDir);

    expect(files).toContain("CLAUDE.md");
    expect(files).toContain("AGENTS.md");
    expect(files).toContain(".cursor/rules/recall-memory.mdc");
    expect(files.some((file) => file.startsWith(".claude/skills/"))).toBe(true);
    expect(files.some((file) => file.startsWith(".agents/skills/"))).toBe(true);
  });

  it("--ai-tools claude omits Cursor and Agent Skills, keeps AGENTS.md", async () => {
    rootDir = await createTempRoot("aitools-claude");
    await runInitCommand(rootDir, ["--ai-tools", "claude"]);
    const files = await listRelativeFiles(rootDir);

    expect(files).toContain("CLAUDE.md");
    expect(files).toContain("AGENTS.md"); // foundational — CLAUDE.md imports it
    expect(files.some((file) => file.startsWith(".claude/"))).toBe(true);
    expect(files.some((file) => file.startsWith(".cursor/"))).toBe(false);
    expect(files.some((file) => file.startsWith(".agents/"))).toBe(false);
  });

  it("--ai-tools codex omits Claude and Cursor, keeps AGENTS.md and Agent Skills", async () => {
    rootDir = await createTempRoot("aitools-codex");
    await runInitCommand(rootDir, ["--ai-tools", "codex"]);
    const files = await listRelativeFiles(rootDir);

    expect(files).toContain("AGENTS.md");
    expect(files.some((file) => file.startsWith(".agents/skills/"))).toBe(true);
    expect(files).not.toContain("CLAUDE.md");
    expect(files.some((file) => file.startsWith(".claude/"))).toBe(false);
    expect(files.some((file) => file.startsWith(".cursor/"))).toBe(false);
  });

  it("always writes tool-agnostic files regardless of selection", async () => {
    rootDir = await createTempRoot("aitools-agnostic");
    await runInitCommand(rootDir, ["--ai-tools", "cursor"]);
    const files = await listRelativeFiles(rootDir);

    expect(files).toContain(".recall/config.json");
    expect(files).toContain("docs/00-product/PRD.md");
    expect(files).toContain(".github/workflows/recall.yml");
    expect(files).toContain(".cursor/rules/recall-memory.mdc");
  });

  it("rejects an unknown --ai-tools value", async () => {
    rootDir = await createTempRoot("aitools-invalid");
    const result = await runCommand(rootDir, ["init", "--ai-tools", "claude,notatool"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("notatool");
  });
});
