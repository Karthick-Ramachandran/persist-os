import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ContextHookError, hookContext } from "../../../src/commands/context/hook.js";
import { createTempRoot, removeTempRoot, runInitCommand } from "../../helpers/init-test-helpers.js";

function card(title: string, answers: string[], startHere: string[]): string {
  return [
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "A test area.",
    "",
    "## Answers",
    "",
    ...answers.map((a) => `- ${a}`),
    "",
    "## Also Known As",
    "",
    "- testarea",
    "",
    "## Start Here",
    "",
    ...startHere.map((s) => `- \`${s}\``),
    "",
    "## Rules",
    "",
    "- ADR-0001 — a recorded decision about the test area",
    "",
    "## Pitfalls",
    "",
    "- LESSONS: the test area bites when fed empty input",
    "",
    "## Applies To",
    "",
    ...startHere.map((s) => `- \`${s}\``),
    "",
  ].join("\n");
}

/** The documented hook input shape, shared by Claude Code and Codex. */
function hookInput(prompt: string): string {
  return `${JSON.stringify({
    session_id: "abc123",
    transcript_path: "/tmp/transcript.jsonl",
    cwd: "/repo",
    permission_mode: "default",
    hook_event_name: "UserPromptSubmit",
    prompt,
  })}\n`;
}

describe("persist context --hook", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function repoWithCard(prefix = "context-hook"): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/billing.md"),
      card(
        "Billing",
        ["make the invoice total fair", "who pays the extra cent on invoices"],
        ["src/lib/billing.ts"],
      ),
      "utf8",
    );
    return rootDir;
  }

  function envelope(output: string): { hookEventName: string; additionalContext: string } {
    const parsed = JSON.parse(output) as {
      hookSpecificOutput: { hookEventName: string; additionalContext: string };
    };
    return parsed.hookSpecificOutput;
  }

  it("answers a Claude Code payload with the documented output format", async () => {
    const rootDir = await repoWithCard();

    const result = await hookContext({
      rootDir,
      tool: "claude",
      rawInput: hookInput("who pays the extra cent"),
    });

    expect(result.matched).toBe(true);
    const specific = envelope(result.output);
    expect(specific.hookEventName).toBe("UserPromptSubmit");
    expect(specific.additionalContext).toContain("Billing");
    expect(specific.additionalContext).toContain("src/lib/billing.ts");
  });

  it("answers a Codex payload with the documented output format", async () => {
    const rootDir = await repoWithCard("context-hook-codex");

    const result = await hookContext({
      rootDir,
      tool: "codex",
      rawInput: hookInput("who pays the extra cent"),
    });

    expect(result.matched).toBe(true);
    const specific = envelope(result.output);
    expect(specific.hookEventName).toBe("UserPromptSubmit");
    expect(specific.additionalContext).toContain("Billing");
  });

  it("prints nothing below the threshold", async () => {
    const rootDir = await repoWithCard("context-hook-quiet");

    for (const tool of ["claude", "codex"]) {
      const result = await hookContext({
        rootDir,
        tool,
        rawInput: hookInput("write a haiku about spring"),
      });

      expect(result.output, tool).toBe("");
      expect(result.matched, tool).toBe(false);
    }
  });

  it("prints nothing for an unparseable payload or a missing prompt", async () => {
    const rootDir = await repoWithCard("context-hook-bad");

    for (const rawInput of ["not json", "{}", JSON.stringify({ prompt: "   " })]) {
      const result = await hookContext({ rootDir, tool: "claude", rawInput });

      expect(result.output, rawInput).toBe("");
    }
  });

  it("prints nothing outside an initialised repository instead of failing", async () => {
    const rootDir = await createTempRoot("context-hook-no-repo");
    roots.push(rootDir);

    const result = await hookContext({
      rootDir,
      tool: "claude",
      rawInput: hookInput("who pays the extra cent"),
    });

    expect(result.output).toBe("");
    expect(result.matched).toBe(false);
  });

  it("refuses an unknown tool, since that is a wiring bug", async () => {
    const rootDir = await repoWithCard("context-hook-tool");

    await expect(
      hookContext({ rootDir, tool: "cursor", rawInput: hookInput("who pays the extra cent") }),
    ).rejects.toThrow(ContextHookError);
  });

  it("caps the injected pointers at about 1500 bytes", async () => {
    const rootDir = await repoWithCard("context-hook-cap");
    const manyPaths = Array.from({ length: 60 }, (_, index) => `src/lib/part-${index}.ts`);
    await writeFile(
      path.join(rootDir, "docs/context/billing.md"),
      card(
        "Billing",
        ["make the invoice total fair", "who pays the extra cent on invoices"],
        manyPaths,
      ),
      "utf8",
    );

    const result = await hookContext({
      rootDir,
      tool: "claude",
      rawInput: hookInput("who pays the extra cent on invoices"),
    });

    expect(result.matched).toBe(true);
    expect(
      Buffer.byteLength(envelope(result.output).additionalContext, "utf8"),
    ).toBeLessThanOrEqual(1500);
  });
});
