import { spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ALWAYS_LOADED_BUDGET_BYTES,
  CODEX_CONTEXT_HOOK_PATH,
  CODEX_HOOKS_JSON_PATH,
  CONTEXT_PROMPT_HOOK_PATH,
  FENCE_INDEX_LABEL,
  FENCE_INDEX_TRUNCATION_MARKER,
  HOOKS_PATH_ACTIVATION_COMMAND,
  PRE_COMMIT_HOOK_PATH,
  PRE_PUSH_HOOK_PATH,
  SESSION_START_BASE_CONTEXT,
  SESSION_START_HOOK_PATH,
  expectedHookFiles,
  renderClaudeSettings,
  renderCodexHooksJson,
  renderContextPromptHook,
  renderPreCommitHook,
  renderPrePushHook,
  renderSessionStartHook,
} from "../../../src/core/hooks/generate-hook.js";

describe("renderPreCommitHook", () => {
  it("starts with a POSIX sh shebang", () => {
    expect(renderPreCommitHook([]).startsWith("#!/bin/sh\n")).toBe(true);
  });

  it("runs persist doctor", () => {
    expect(renderPreCommitHook([])).toContain("\nrun_persist doctor\n");
  });

  it("runs only persist doctor when there are no gates", () => {
    const hook = renderPreCommitHook([]);
    expect(hook).not.toContain("pnpm");
    expect(hook).not.toContain("npm run");
  });

  it("appends each configured gate in order after persist doctor", () => {
    const hook = renderPreCommitHook(["pnpm run test", "pnpm run typecheck"]);
    const doctorIndex = hook.indexOf("persist doctor");
    const testIndex = hook.indexOf("pnpm run test");
    const typecheckIndex = hook.indexOf("pnpm run typecheck");

    expect(doctorIndex).toBeLessThan(testIndex);
    expect(testIndex).toBeLessThan(typecheckIndex);
  });

  it("documents the activation command without running it", () => {
    expect(renderPreCommitHook([])).toContain(HOOKS_PATH_ACTIVATION_COMMAND);
  });

  it("exposes the tracked hook path", () => {
    expect(PRE_COMMIT_HOOK_PATH).toBe(".persist/hooks/pre-commit");
  });
});

describe("renderPreCommitHook exit codes (ADR-0013)", () => {
  /**
   * Execute the rendered hook with a stub `persist` first on PATH. The stub prints a
   * marker (proving doctor output stays visible) and exits with the code from
   * PERSIST_STUB_EXIT, so each doctor outcome maps to one hook run.
   */
  async function runHookWithStub(
    doctorExit: number,
    gates: string[],
  ): Promise<{ status: number | null; stdout: string }> {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-hook-"));
    try {
      const stub = path.join(dir, "persist");
      await writeFile(stub, '#!/bin/sh\necho "stub doctor output"\nexit "$PERSIST_STUB_EXIT"\n');
      await chmod(stub, 0o755);

      const hookPath = path.join(dir, "pre-commit");
      await writeFile(hookPath, renderPreCommitHook(gates));
      await chmod(hookPath, 0o755);

      const result = spawnSync("sh", [hookPath], {
        env: {
          ...process.env,
          PATH: `${dir}${path.delimiter}${process.env.PATH ?? ""}`,
          PERSIST_STUB_EXIT: String(doctorExit),
        },
        encoding: "utf8",
      });

      return { status: result.status, stdout: result.stdout };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it("lets warnings through: doctor exit 1 proceeds and later gates still run", async () => {
    const { status, stdout } = await runHookWithStub(1, ["echo gate-ran"]);

    expect(status).toBe(0);
    // Warnings nobody can see are not advisory: doctor output must stay visible.
    expect(stdout).toContain("stub doctor output");
    expect(stdout).toContain("gate-ran");
  });

  it("passes clean: doctor exit 0 proceeds", async () => {
    const { status, stdout } = await runHookWithStub(0, ["echo gate-ran"]);

    expect(status).toBe(0);
    expect(stdout).toContain("gate-ran");
  });

  it("fails on errors: doctor exit 2 blocks and later gates never run", async () => {
    const { status, stdout } = await runHookWithStub(2, ["echo gate-ran"]);

    expect(status).toBe(2);
    expect(stdout).toContain("stub doctor output");
    expect(stdout).not.toContain("gate-ran");
  });
});

describe("hooks without a global persist", () => {
  /**
   * Run a rendered hook where the only thing on PATH besides the system basics is a stub `npx`
   * that records its arguments. No `persist` anywhere, as for someone who only ever ran
   * `npx persist-os init`.
   */
  async function runWithOnlyNpx(hook: string): Promise<{ status: number | null; stdout: string }> {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-hook-npx-"));
    try {
      const stub = path.join(dir, "npx");
      await writeFile(stub, '#!/bin/sh\necho "npx $*"\n');
      await chmod(stub, 0o755);

      const hookPath = path.join(dir, "hook");
      await writeFile(hookPath, hook);
      await chmod(hookPath, 0o755);

      const result = spawnSync("sh", [hookPath], {
        env: { PATH: `${dir}${path.delimiter}/usr/bin${path.delimiter}/bin` },
        encoding: "utf8",
      });
      return { status: result.status, stdout: result.stdout };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  it("runs doctor through npx in the pre-commit hook", async () => {
    // With hooks on by default, a bare `persist` call would fail every commit with
    // "command not found" for anyone who never installed Persist globally.
    const { status, stdout } = await runWithOnlyNpx(renderPreCommitHook([]));

    expect(status).toBe(0);
    expect(stdout).toContain("npx --yes persist-os doctor");
  });

  it("runs the test gate through npx in the pre-push hook", async () => {
    const { status, stdout } = await runWithOnlyNpx(renderPrePushHook(null, []));

    expect(status).toBe(0);
    expect(stdout).toContain("npx --yes persist-os test-gate");
  });
});

describe("renderPrePushHook", () => {
  it("starts with a POSIX sh shebang and runs the test gate instead of doctor", () => {
    const hook = renderPrePushHook(null, []);
    expect(hook.startsWith("#!/bin/sh\n")).toBe(true);
    expect(hook).toContain("\nrun_persist test-gate\n");
    expect(hook).not.toContain("persist doctor");
  });

  it("appends each push gate in order after the test gate", () => {
    const hook = renderPrePushHook("pnpm run test:run", ["pnpm run typecheck", "pnpm run lint"]);
    expect(hook.indexOf("persist test-gate")).toBeLessThan(hook.indexOf("pnpm run typecheck"));
    expect(hook.indexOf("pnpm run typecheck")).toBeLessThan(hook.indexOf("pnpm run lint"));
    expect(hook).not.toContain("persist doctor");
  });

  it("takes a different list than pre-commit", () => {
    const preCommit = renderPreCommitHook(["pnpm run test"]);
    const prePush = renderPrePushHook("pnpm run test:run", ["pnpm run typecheck"]);

    expect(preCommit).toContain("persist doctor");
    expect(prePush).not.toContain("persist doctor");
    expect(prePush).toContain("persist test-gate");
    expect(preCommit).not.toContain("persist test-gate");
  });

  it("documents the activation command without running it", () => {
    expect(renderPrePushHook(null, [])).toContain(HOOKS_PATH_ACTIVATION_COMMAND);
  });

  it("exposes the tracked pre-push hook path", () => {
    expect(PRE_PUSH_HOOK_PATH).toBe(".persist/hooks/pre-push");
  });

  it("renders a read-only SessionStart hook that emits valid additionalContext JSON", () => {
    const hook = renderSessionStartHook();

    expect(hook.startsWith("#!/bin/sh")).toBe(true);
    expect(hook).toContain("SessionStart");
    expect(hook).toContain("additionalContext");
    // It makes no network calls (read-only, offline).
    expect(hook).not.toMatch(/\bcurl\b|\bwget\b/u);
  });

  it("wires the SessionStart hook in valid Claude settings JSON", () => {
    const settings = JSON.parse(renderClaudeSettings()) as {
      hooks: { SessionStart: { hooks: { command: string }[] }[] };
    };

    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe(`./${SESSION_START_HOOK_PATH}`);
  });

  it("wires the prompt hook in Claude settings with a short timeout", () => {
    const settings = JSON.parse(renderClaudeSettings()) as {
      hooks: { UserPromptSubmit: { hooks: { command: string; timeout: number }[] }[] };
    };

    expect(settings.hooks.UserPromptSubmit[0].hooks[0].command).toBe(
      `./${CONTEXT_PROMPT_HOOK_PATH}`,
    );
    expect(settings.hooks.UserPromptSubmit[0].hooks[0].timeout).toBeLessThanOrEqual(10);
  });

  it("omits the prompt hook from Claude settings when the toggle is off", () => {
    const settings = JSON.parse(renderClaudeSettings(false)) as {
      hooks: Record<string, unknown>;
    };

    expect(settings.hooks).not.toHaveProperty("UserPromptSubmit");
  });

  it("wires the prompt hook in a valid Codex hooks.json with a short timeout", () => {
    const parsed = JSON.parse(renderCodexHooksJson()) as {
      UserPromptSubmit: { hooks: { type: string; command: string; timeout: number }[] }[];
    };

    expect(parsed.UserPromptSubmit[0].hooks[0].type).toBe("command");
    expect(parsed.UserPromptSubmit[0].hooks[0].command).toBe(`./${CODEX_CONTEXT_HOOK_PATH}`);
    expect(parsed.UserPromptSubmit[0].hooks[0].timeout).toBeLessThanOrEqual(10);
  });
});

describe("renderContextPromptHook", () => {
  for (const tool of ["claude", "codex"] as const) {
    it(`forwards the ${tool} payload to persist context without slowness or failure`, () => {
      const hook = renderContextPromptHook(tool);

      expect(hook.startsWith("#!/bin/sh\n")).toBe(true);
      expect(hook).toContain(`persist context --hook ${tool}`);
      // npx on every prompt is far too slow; the installed binary or the local one wins.
      expect(hook).toContain("node_modules/.bin/persist");
      expect(hook).not.toContain("npx");
      // The prompt text is piped, never written: no redirect to a file, no log.
      expect(hook).not.toMatch(/>>|\blog\b/u);
      expect(hook.trimEnd().endsWith("exit 0")).toBe(true);
    });
  }

  it("exits 0 with no output when persist is missing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-context-hook-"));
    try {
      const hookPath = path.join(dir, "context-prompt.sh");
      await writeFile(hookPath, renderContextPromptHook("claude"));
      await chmod(hookPath, 0o755);

      const result = spawnSync("sh", [hookPath], {
        cwd: dir,
        input: JSON.stringify({ prompt: "who pays the extra cent" }),
        encoding: "utf8",
        // No persist on PATH and no node_modules/.bin below: the hook stands down.
        env: { PATH: "/usr/bin:/bin", SHELL: "/bin/sh" },
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("forwards stdin to persist and prints its output", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-context-hook-"));
    try {
      const bin = path.join(dir, "bin");
      await mkdir(bin, { recursive: true });
      await writeFile(path.join(bin, "persist"), '#!/bin/sh\ncat\nprintf -- "-hooked-"\n');
      await chmod(path.join(bin, "persist"), 0o755);
      const hookPath = path.join(dir, "context-prompt.sh");
      await writeFile(hookPath, renderContextPromptHook("claude"));
      await chmod(hookPath, 0o755);

      const result = spawnSync("sh", [hookPath], {
        cwd: dir,
        input: JSON.stringify({ prompt: "hello" }),
        encoding: "utf8",
        env: { PATH: `${bin}:/usr/bin:/bin`, SHELL: "/bin/sh" },
      });

      expect(result.status).toBe(0);
      // The stub echoes stdin (proving the payload arrived) and marks its output.
      expect(result.stdout).toContain('"prompt":"hello"');
      expect(result.stdout).toContain("-hooked-");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("lists the prompt hook files in the expected hook files", () => {
    const paths = expectedHookFiles({
      aiTools: ["claude", "codex"],
      contextHook: true,
    }).map((file) => file.path);

    expect(paths).toContain(CONTEXT_PROMPT_HOOK_PATH);
    expect(paths).toContain(CODEX_CONTEXT_HOOK_PATH);
    expect(paths).toContain(CODEX_HOOKS_JSON_PATH);
  });

  it("drops the prompt hook files when the toggle is off", () => {
    const paths = expectedHookFiles({
      aiTools: ["claude", "codex"],
      contextHook: false,
    }).map((file) => file.path);

    expect(paths).not.toContain(CONTEXT_PROMPT_HOOK_PATH);
    expect(paths).not.toContain(CODEX_CONTEXT_HOOK_PATH);
    expect(paths).not.toContain(CODEX_HOOKS_JSON_PATH);
  });
});

describe("renderSessionStartHook fence index (ADR-0010)", () => {
  /** Execute the rendered hook in a fixture repo and return the injected context. */
  async function injectedContext(files: Record<string, string>): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-session-start-"));
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

  it("injects nothing fence-related when FENCES.md is absent", async () => {
    const context = await injectedContext({ "CLAUDE.md": "# x\n" });

    expect(context).not.toMatch(/fence/i);
  });

  it("carries the card-update habit in every session", async () => {
    // The lookup habit lives in AGENTS.md; the write-when-fresh habit rides the
    // hook, because the agent that just finished work is the one who knows the area.
    const context = await injectedContext({ "CLAUDE.md": "# x\n" });

    expect(context).toContain("context card");
    expect(context).toContain("Answers list");
  });

  it("injects paths and reasons but not crossing history for a small FENCES.md", async () => {
    const context = await injectedContext({
      "CLAUDE.md": "# x\n",
      "docs/60-engineering/FENCES.md": [
        "# Fences",
        "",
        "## `src/payments/charge.ts`",
        "Why: four collections deliberately; the ledger needs per-collection idempotency keys.",
        "### Crossings",
        "- 2026-09-20: kept four calls; constraint confirmed by H.",
        "",
      ].join("\n"),
    });

    expect(context).toContain("src/payments/charge.ts");
    expect(context).toContain("four collections deliberately");
    expect(context).not.toContain("Crossings");
    expect(context).not.toContain("constraint confirmed by H.");
  });

  it("reads the memory folders from .persist/config.json", async () => {
    // A relocated docs folder must keep loading without regenerating the hook; fixed `docs/`
    // paths here once made a relocated repository inject nothing while doctor passed.
    const context = await injectedContext({
      ".persist/config.json": `${JSON.stringify(
        { docsDir: "memory", modulesDir: "memory/mods", adrDir: "memory/decisions" },
        null,
        2,
      )}\n`,
      "memory/decisions/ADR-0001-ledger.md": "# ADR-0001\n",
      "memory/mods/billing/MODULE.md": "# billing\n",
      "memory/60-engineering/FENCES.md": "## `src/a.ts`\nWhy: relocated reason.\n",
    });

    expect(context).toContain("Accepted ADRs (memory/decisions/): ADR-0001-ledger");
    expect(context).toContain("Modules (memory/mods/): billing");
    expect(context).toContain("relocated reason.");
    expect(context).toContain("full history in memory/60-engineering/FENCES.md");
  });

  it("falls back to the default layout when the config is missing", async () => {
    const context = await injectedContext({
      "docs/adrs/ADR-0002-default.md": "# ADR-0002\n",
      "docs/60-engineering/FENCES.md": "## `src/a.ts`\nWhy: default reason.\n",
    });

    expect(context).toContain("Accepted ADRs (docs/adrs/): ADR-0002-default");
    expect(context).toContain("default reason.");
  });

  it("exposes the exact strings the budget check measures against", () => {
    // The doctor context-budget check subtracts these constants from the budget. If the
    // rendered hook ever stopped emitting them verbatim, the check would measure a fiction —
    // so the constants are asserted against the rendered output, not just imported.
    const hook = renderSessionStartHook();

    expect(ALWAYS_LOADED_BUDGET_BYTES).toBe(24 * 1024);
    expect(hook).toContain(`base="${SESSION_START_BASE_CONTEXT}"`);
    expect(hook).toContain(`label="${FENCE_INDEX_LABEL}"`);
    expect(hook).toContain(`marker="${FENCE_INDEX_TRUNCATION_MARKER}"`);
    expect(hook).toContain(`room=$((${ALWAYS_LOADED_BUDGET_BYTES} - loaded`);
  });

  it("truncates a large FENCES.md to the budget with a marker", async () => {
    const lines = ["# Fences", ""];
    for (let i = 0; i < 1500; i += 1) {
      lines.push(`## \`src/mod/file${String(i).padStart(4, "0")}.ts\``);
      lines.push(`Why: reason number ${i}; do not merge the handlers.`);
      lines.push("");
    }

    const context = await injectedContext({
      "CLAUDE.md": "x",
      "docs/60-engineering/FENCES.md": lines.join("\n"),
    });

    // Files plus the whole injection stay within the 24KB always-loaded budget.
    expect(Buffer.byteLength(context, "utf8") + 1).toBeLessThanOrEqual(24 * 1024);
    expect(context).toContain("truncated to the context budget");
    expect(context).toContain("docs/60-engineering/FENCES.md");
    expect(context).toContain("src/mod/file0000.ts");
    expect(context).not.toContain("src/mod/file1499.ts");
  });
});
