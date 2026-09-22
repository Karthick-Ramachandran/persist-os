import { mkdtemp, mkdir, rm, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  LESSONS_ALWAYS_LABEL,
  LESSONS_ALWAYS_TRUNCATION_MARKER,
  renderSessionStartHook,
} from "../../../src/core/hooks/generate-hook.js";

/**
 * SessionStart delivery of the Always lessons: injected after the fence
 * index, within the same 24 KB always-loaded budget and truncation rules.
 */
describe("renderSessionStartHook Always lessons", () => {
  /** Execute the rendered hook in a fixture repo and return the injected context. */
  async function injectedContext(files: Record<string, string>): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-session-always-"));
    try {
      for (const [relativePath, content] of Object.entries(files)) {
        const full = path.join(dir, relativePath);
        await mkdir(path.dirname(full), { recursive: true });
        await writeFile(full, content);
      }

      const hookPath = path.join(dir, "session-start.sh");
      await writeFile(hookPath, renderSessionStartHook());
      await chmod(hookPath, 0o755);

      const result = spawnSync("sh", [hookPath], { cwd: dir, encoding: "utf8" });
      expect(result.status).toBe(0);

      const parsed = JSON.parse(result.stdout) as {
        hookSpecificOutput: { additionalContext: string };
      };
      return parsed.hookSpecificOutput.additionalContext;
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  const LESSONS = [
    "# Lessons",
    "",
    "## Always",
    "",
    "- Never log a raw database driver error.",
    "- The verified token user id is authoritative.",
    "",
    "## Deploy",
    "",
    "Applies To:",
    "- `deploy/**`",
    "",
    "- Ship behind the flag.",
    "",
  ].join("\n");

  it("injects the Always bullets after the fence index", async () => {
    const context = await injectedContext({
      "CLAUDE.md": "# x\n",
      "docs/60-engineering/FENCES.md": "## `src/a.ts`\nWhy: fence reason.\n",
      "docs/60-engineering/LESSONS.md": LESSONS,
    });

    expect(context).toContain("Never log a raw database driver error");
    expect(context).toContain("verified token user id is authoritative");
    // Area lessons never load into every session — only Always does.
    expect(context).not.toContain("Ship behind the flag");
    expect(context.indexOf("fence reason.")).toBeLessThan(
      context.indexOf("Never log a raw database driver error"),
    );
  });

  it("injects nothing lessons-related when there is no Always section", async () => {
    const context = await injectedContext({
      "CLAUDE.md": "# x\n",
      "docs/60-engineering/LESSONS.md": "# Lessons\n\n- A flat legacy lesson.\n",
    });

    expect(context).not.toContain("A flat legacy lesson");
    expect(context).not.toContain("Always lessons");
  });

  it("injects nothing lessons-related when LESSONS.md is absent", async () => {
    const context = await injectedContext({ "CLAUDE.md": "# x\n" });

    expect(context).not.toContain("Always lessons");
  });

  it("truncates huge Always lessons with a marker inside the budget", async () => {
    const lines = ["# Lessons", "", "## Always", ""];
    for (let i = 0; i < 800; i += 1) {
      lines.push(`- Always lesson number ${i} that every task in this repository must follow.`);
    }
    const context = await injectedContext({
      "CLAUDE.md": "x",
      "docs/60-engineering/LESSONS.md": lines.join("\n"),
    });

    expect(Buffer.byteLength(context, "utf8") + 1).toBeLessThanOrEqual(24 * 1024);
    expect(context).toContain("always lessons truncated to the context budget");
    expect(context).toContain("docs/60-engineering/LESSONS.md");
  });

  it("exposes the exact Always strings the budget check measures against", () => {
    const hook = renderSessionStartHook();

    expect(hook).toContain(`alabel="${LESSONS_ALWAYS_LABEL}"`);
    expect(hook).toContain(`amarker="${LESSONS_ALWAYS_TRUNCATION_MARKER}"`);
  });

  it("escapes Always lessons so the hook output stays valid JSON", async () => {
    // Quotes, backslashes, a tab, and CRLF endings: without the fence index's
    // escaping the injected string breaks JSON.parse.
    const hostile = [
      "# Lessons",
      "",
      "## Always",
      "",
      '- Reject `$ne` in partial filters; use `$type: "string"` instead.',
      "- Windows paths like C:\\temp\\out break naive joins.",
      "- A lesson\twith a tab inside it.",
      "",
    ].join("\r\n");
    const context = await injectedContext({
      "CLAUDE.md": "# x\n",
      ".persist/config.json": '{"docsDir":"docs","adrDir":"docs/adrs"}',
      "docs/adrs/ADR-0001-example.md": "# ADR\n\n## Status\n\nAccepted\n",
      "docs/60-engineering/FENCES.md": "## `src/a.ts`\nWhy: fence reason.\n",
      "docs/60-engineering/LESSONS.md": hostile,
    });

    // The harness already parsed the hook's stdout as JSON to get here: without
    // the escaping that parse throws on the raw quotes, so reaching these
    // assertions proves the output was valid JSON.
    expect(context).toContain('$type: "string"');
    expect(context).toContain("C:\\temp\\out");
    expect(context).toContain("A lesson with a tab inside it.");
    expect(context).not.toContain("\t");
    expect(context).not.toContain("\r");
    // The ADR list and the fence index survive alongside the escaped lessons.
    expect(context).toContain("ADR-0001-example");
    expect(context).toContain("fence reason.");
  });
});
