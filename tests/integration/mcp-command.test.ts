import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
} from "../helpers/init-test-helpers.js";

describe("mcp command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("generates proposed MCP memory without an existing config", async () => {
    const rootDir = await createRoot("mcp-add");

    const result = await runCommand(rootDir, ["mcp", "add", "figma"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("proposed — review before adopting");

    const doc = await readFile(path.join(rootDir, "docs/ai/mcp/figma.md"), "utf8");
    expect(doc).toContain("# MCP: Figma");

    const adr = await readFile(
      path.join(rootDir, "docs/adrs/proposed/ADR-PROPOSED-mcp-figma.md"),
      "utf8",
    );
    expect(adr).toContain("## Status\n\nProposed");
  });

  it("installs the capture skill so agents record context into the memory", async () => {
    const rootDir = await createRoot("mcp-capture-skill");

    const result = await runCommand(rootDir, ["mcp", "add", "figma"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Capture skill installed");

    const skill = await readFile(
      path.join(rootDir, ".claude/skills/capture-mcp-context/SKILL.md"),
      "utf8",
    );
    // capture-mcp-context is retired from the catalog (ADR-0008): mcp add still
    // installs the file, now as a skeleton the agent fills in.
    expect(skill).toContain("name: capture-mcp-context");
    expect(skill).toContain("Use when");
  });

  it("writes nothing on dry run", async () => {
    const rootDir = await createRoot("mcp-dry-run");

    const result = await runCommand(rootDir, ["mcp", "add", "figma", "--dry-run"]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).not.toContain("docs/ai/mcp/figma.md");
  });

  it("skips an existing MCP doc unless forced", async () => {
    const rootDir = await createRoot("mcp-skip");
    await mkdir(path.join(rootDir, "docs/ai/mcp"), { recursive: true });
    await writeFile(path.join(rootDir, "docs/ai/mcp/figma.md"), "custom\n", "utf8");

    const result = await runCommand(rootDir, ["mcp", "add", "figma"]);

    expect(result.exitCode).toBe(0);
    expect(await readFile(path.join(rootDir, "docs/ai/mcp/figma.md"), "utf8")).toBe("custom\n");
  });
});
