import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkHookDrift } from "../../../src/core/doctor/checks/hook-drift-check.js";
import {
  CLAUDE_SETTINGS_PATH,
  CODEX_CONTEXT_HOOK_PATH,
  CODEX_HOOKS_JSON_PATH,
  CONTEXT_PROMPT_HOOK_PATH,
  PRE_COMMIT_HOOK_PATH,
  PRE_PUSH_HOOK_PATH,
  SESSION_START_HOOK_PATH,
  renderClaudeSettings,
  renderCodexHooksJson,
  renderContextPromptHook,
  renderPreCommitHook,
  renderPrePushHook,
  renderSessionStartHook,
} from "../../../src/core/hooks/generate-hook.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("hook-drift check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  function contextFor(rootDir: string, overrides: Record<string, unknown> = {}) {
    const config = createDefaultConfig({
      testCommand: "pnpm run test:run",
      preCommitGates: [],
      prePushGates: ["pnpm run typecheck"],
      ...overrides,
    });
    return {
      rootDir,
      config: {
        docsDir: config.docsDir,
        featuresDir: config.featuresDir,
        modulesDir: config.modulesDir,
        adrDir: config.adrDir,
        aiTools: [...config.aiTools],
        testCommand: config.testCommand,
        preCommitGates: [...config.preCommitGates],
        prePushGates: [...config.prePushGates],
        contextHook: config.contextHook,
      },
    };
  }

  async function writeHooks(rootDir: string, preCommit: string, prePush: string): Promise<void> {
    await mkdir(path.join(rootDir, ".persist/hooks"), { recursive: true });
    await writeFile(path.join(rootDir, PRE_COMMIT_HOOK_PATH), preCommit, "utf8");
    await writeFile(path.join(rootDir, PRE_PUSH_HOOK_PATH), prePush, "utf8");
  }

  /** The Claude generated files, written as the generator would produce them. */
  async function writeClaudeFiles(rootDir: string, sessionStart?: string): Promise<void> {
    await mkdir(path.join(rootDir, ".claude/hooks"), { recursive: true });
    await writeFile(
      path.join(rootDir, SESSION_START_HOOK_PATH),
      sessionStart ?? renderSessionStartHook(),
      "utf8",
    );
    await writeFile(path.join(rootDir, CLAUDE_SETTINGS_PATH), renderClaudeSettings(), "utf8");
    await writeFile(
      path.join(rootDir, CONTEXT_PROMPT_HOOK_PATH),
      renderContextPromptHook("claude"),
      "utf8",
    );
  }

  /** The Codex generated files, written as the generator would produce them. */
  async function writeCodexFiles(rootDir: string): Promise<void> {
    await mkdir(path.join(rootDir, ".codex/hooks"), { recursive: true });
    await writeFile(
      path.join(rootDir, CODEX_CONTEXT_HOOK_PATH),
      renderContextPromptHook("codex"),
      "utf8",
    );
    await writeFile(path.join(rootDir, CODEX_HOOKS_JSON_PATH), renderCodexHooksJson(), "utf8");
  }

  it("passes when both hooks match the config", async () => {
    const rootDir = await createRoot("drift-agree");
    const context = contextFor(rootDir);
    await writeHooks(
      rootDir,
      renderPreCommitHook(context.config.preCommitGates ?? []),
      renderPrePushHook(context.config.testCommand ?? null, context.config.prePushGates ?? []),
    );
    await writeClaudeFiles(rootDir);
    await writeCodexFiles(rootDir);

    const { findings, outcome } = await checkHookDrift(context);

    expect(findings).toEqual([]);
    expect(outcome).toEqual({ id: "hook-drift", status: "evaluated" });
  });

  it("warns naming the hook when a baked-in gate disagrees with config", async () => {
    const rootDir = await createRoot("drift-disagree");
    const context = contextFor(rootDir);
    await writeHooks(
      rootDir,
      `${renderPreCommitHook([])}pnpm run test\n`,
      renderPrePushHook("pnpm run test:run", ["pnpm run typecheck"]),
    );
    await writeClaudeFiles(rootDir);
    await writeCodexFiles(rootDir);

    const { findings, outcome } = await checkHookDrift(context);

    expect(outcome).toEqual({ id: "hook-drift", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "hook-drift",
      path: PRE_COMMIT_HOOK_PATH,
    });
  });

  it("warns when the Claude SessionStart hook is stale", async () => {
    // The one that drifts silently: it carries the memory map and the fence index, so a stale
    // hook loads the wrong context into every session without anything failing.
    const rootDir = await createRoot("drift-session-start");
    const context = contextFor(rootDir);
    await writeHooks(
      rootDir,
      renderPreCommitHook(context.config.preCommitGates ?? []),
      renderPrePushHook(context.config.testCommand ?? null, context.config.prePushGates ?? []),
    );
    await writeClaudeFiles(rootDir, "#!/bin/sh\n# an older generated hook\n");
    await writeCodexFiles(rootDir);

    const { findings, outcome } = await checkHookDrift(context);

    expect(outcome).toEqual({ id: "hook-drift", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "hook-drift",
      path: SESSION_START_HOOK_PATH,
    });
  });

  it("does not expect Claude files in a repository that did not ask for them", async () => {
    const rootDir = await createRoot("drift-codex-only");
    const context = contextFor(rootDir, { aiTools: ["codex"] });
    await writeHooks(
      rootDir,
      renderPreCommitHook(context.config.preCommitGates ?? []),
      renderPrePushHook(context.config.testCommand ?? null, context.config.prePushGates ?? []),
    );
    await writeCodexFiles(rootDir);

    const { findings, outcome } = await checkHookDrift(context);

    // No .claude/ anywhere, and that is correct rather than drift.
    expect(findings).toEqual([]);
    expect(outcome).toEqual({ id: "hook-drift", status: "evaluated" });
  });

  it("warns when the context prompt hook is stale", async () => {
    const rootDir = await createRoot("drift-context-stale");
    const context = contextFor(rootDir);
    await writeHooks(
      rootDir,
      renderPreCommitHook(context.config.preCommitGates ?? []),
      renderPrePushHook(context.config.testCommand ?? null, context.config.prePushGates ?? []),
    );
    await writeClaudeFiles(rootDir);
    await writeCodexFiles(rootDir);
    await writeFile(
      path.join(rootDir, CONTEXT_PROMPT_HOOK_PATH),
      "#!/bin/sh\n# an older generated hook\n",
      "utf8",
    );

    const { findings, outcome } = await checkHookDrift(context);

    expect(outcome).toEqual({ id: "hook-drift", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "hook-drift",
      path: CONTEXT_PROMPT_HOOK_PATH,
    });
  });

  it("expects no prompt hook files when the toggle is off", async () => {
    const rootDir = await createRoot("drift-context-off");
    const context = contextFor(rootDir, { aiTools: ["claude"], contextHook: false });
    await writeHooks(
      rootDir,
      renderPreCommitHook(context.config.preCommitGates ?? []),
      renderPrePushHook(context.config.testCommand ?? null, context.config.prePushGates ?? []),
    );
    // The toggle-off shapes: session start without the prompt entry, and no
    // prompt script anywhere. Expecting either would punish the opt-out.
    await mkdir(path.join(rootDir, ".claude/hooks"), { recursive: true });
    await writeFile(path.join(rootDir, SESSION_START_HOOK_PATH), renderSessionStartHook(), "utf8");
    await writeFile(path.join(rootDir, CLAUDE_SETTINGS_PATH), renderClaudeSettings(false), "utf8");

    const { findings, outcome } = await checkHookDrift(context);

    expect(findings).toEqual([]);
    expect(outcome).toEqual({ id: "hook-drift", status: "evaluated" });
  });

  it("reports not-evaluated when the hooks do not exist", async () => {
    const rootDir = await createRoot("drift-absent");

    const { findings, outcome } = await checkHookDrift(contextFor(rootDir));

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
    expect(outcome.reason).toContain(PRE_COMMIT_HOOK_PATH);
  });
});
