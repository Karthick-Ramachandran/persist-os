import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { fenceIndexLines } from "../../../src/core/fence/fence-entries.js";
import { renderSessionStartHook } from "../../../src/core/hooks/generate-hook.js";

/**
 * No-constraint entries are not injected into sessions: they answer nothing an
 * agent needs before editing. With only Why entries the extraction is
 * byte-identical to 1.6.x, and the shell pipeline agrees with the shared
 * TypeScript reader on a fixture mixing both kinds, CRLF, and a symbol entry.
 */
describe("SessionStart fence index with no-constraint entries", () => {
  const WHY_ONLY = [
    "# Fences",
    "",
    "## `src/ledger.ts`",
    "",
    "Why: Four writes are deliberate.",
    "",
    "- 2026-09-22 — recorded by Priya.",
    "",
    "## `src/auth.ts:refreshToken`",
    "",
    "Why: Rotation keeps sessions alive.",
    "",
    "- 2026-09-22 — recorded.",
    "",
  ].join("\n");

  const MIXED = [
    "# Fences",
    "",
    "## `src/ledger.ts`",
    "",
    "Why: Four writes are deliberate.",
    "",
    "- 2026-09-22 — recorded by Priya.",
    "",
    "## `src/types.ts`",
    "",
    "No constraint: a human confirmed nothing here is deliberate; change it freely.",
    "",
    "- 2026-09-22 — no constraint, confirmed by Karthick.",
    "",
  ].join("\n");

  function hookAwkProgram(): string {
    const hook = renderSessionStartHook();
    const match = /full=\$\(awk '([^']*)' "\$fences_file"/u.exec(hook);
    expect(match, "hook carries the fence-index awk pipeline").not.toBeNull();
    return match?.[1] ?? "";
  }

  function runAwk(program: string, fencesFile: string): string {
    const result = spawnSync(
      "sh",
      ["-c", `awk '${program}' "$1" | tr '\n' ' '`, "--", fencesFile],
      {
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(0);
    return result.stdout;
  }

  function runOldPipeline(fencesFile: string): string {
    const result = spawnSync(
      "sh",
      ["-c", `grep -e '^## ' -e '^Why: ' "$1" | tr '\n' ' '`, "--", fencesFile],
      {
        encoding: "utf8",
      },
    );
    expect(result.status).toBe(0);
    return result.stdout;
  }

  async function withFences(content: string | Buffer, label: string): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), `persist-fence-index-${label}-`));
    try {
      await mkdir(path.join(dir, "docs/60-engineering"), { recursive: true });
      await writeFile(path.join(dir, "docs/60-engineering/FENCES.md"), content);
      await mkdir(path.join(dir, ".persist"), { recursive: true });
      await writeFile(path.join(dir, ".persist/config.json"), JSON.stringify({ docsDir: "docs" }));
      await writeFile(path.join(dir, "CLAUDE.md"), "# x\n");
      await writeFile(path.join(dir, "AGENTS.md"), "# y\n");
      const hookPath = path.join(dir, "session-start.sh");
      await writeFile(hookPath, renderSessionStartHook());
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

  it("injects Why entries and leaves no-constraint entries out", async () => {
    const context = await withFences(MIXED, "mixed");

    expect(context).toContain("src/ledger.ts");
    expect(context).toContain("Four writes are deliberate.");
    expect(context).not.toContain("src/types.ts");
    expect(context).not.toContain("No constraint:");
  });

  it("injects nothing new for a file with only a no-constraint entry", async () => {
    const onlyCleared = [
      "# Fences",
      "",
      "## `src/types.ts`",
      "",
      "No constraint: a human confirmed nothing here is deliberate; change it freely.",
      "",
      "- 2026-09-22 — no constraint, confirmed by Karthick.",
      "",
    ].join("\n");

    const context = await withFences(onlyCleared, "cleared");

    expect(context).not.toContain("src/types.ts");
  });

  it("extracts byte-identical text to 1.6.x when every entry records a reason", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-fence-index-golden-"));
    try {
      const fencesFile = path.join(dir, "FENCES.md");
      await writeFile(fencesFile, WHY_ONLY);

      expect(runAwk(hookAwkProgram(), fencesFile)).toBe(runOldPipeline(fencesFile));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("keeps the hook output valid JSON with a no-constraint entry present", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-fence-index-json-"));
    try {
      await mkdir(path.join(dir, "docs/60-engineering"), { recursive: true });
      await writeFile(path.join(dir, "docs/60-engineering/FENCES.md"), MIXED);
      await mkdir(path.join(dir, ".persist"), { recursive: true });
      await writeFile(path.join(dir, ".persist/config.json"), JSON.stringify({ docsDir: "docs" }));
      const hookPath = path.join(dir, "session-start.sh");
      await writeFile(hookPath, renderSessionStartHook());
      const result = spawnSync("sh", [hookPath], { cwd: dir, encoding: "utf8" });

      expect(result.status).toBe(0);
      expect(() => JSON.parse(result.stdout) as unknown).not.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("agrees between the shell pipeline and the TypeScript reader on mixed, CRLF, and symbol entries", async () => {
    const fixture = [
      "## `src/ledger.ts`",
      "",
      "Why: Four writes are deliberate.",
      "",
      "- 2026-09-22 — recorded by Priya.",
      "",
      "## `src/types.ts`",
      "",
      "No constraint: a human confirmed nothing here is deliberate; change it freely.",
      "",
      "- 2026-09-22 — no constraint, confirmed by Karthick.",
      "",
      "## `src/auth.ts:refreshToken`",
      "",
      "Why: Rotation keeps sessions alive.",
      "",
      "- 2026-09-22 — recorded.",
      "",
    ].join("\r\n");

    const dir = await mkdtemp(path.join(tmpdir(), "persist-fence-index-parity-"));
    try {
      const fencesFile = path.join(dir, "FENCES.md");
      await writeFile(fencesFile, fixture);
      const shell = runAwk(hookAwkProgram(), fencesFile);
      const lines = fenceIndexLines(fixture);
      const ts = lines.length === 0 ? "" : `${lines.join(" ")} `;

      expect(shell).toBe(ts);
      expect(ts).toContain("src/ledger.ts");
      expect(ts).toContain("src/auth.ts:refreshToken");
      expect(ts).not.toContain("src/types.ts");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("measures the same index the hook injects through the shared reader", () => {
    // The context-budget check flattens through fenceIndexLines; the hook
    // flattens through awk. Both must see the same lines, or the budget
    // measures what the hook does not emit.
    const lines = fenceIndexLines(MIXED);

    expect(lines.join(" ")).toContain("## `src/ledger.ts`");
    expect(lines.join(" ")).toContain("Why: Four writes are deliberate.");
    expect(lines.join(" ")).not.toContain("src/types.ts");
  });
});
