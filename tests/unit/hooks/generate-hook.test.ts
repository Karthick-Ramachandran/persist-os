import { describe, expect, it } from "vitest";

import {
  HOOKS_PATH_ACTIVATION_COMMAND,
  PRE_COMMIT_HOOK_PATH,
  PRE_PUSH_HOOK_PATH,
  SESSION_START_HOOK_PATH,
  renderClaudeSettings,
  renderPreCommitHook,
  renderPrePushHook,
  renderSessionStartHook,
} from "../../../src/core/hooks/generate-hook.js";

describe("renderPreCommitHook", () => {
  it("starts with a POSIX sh shebang", () => {
    expect(renderPreCommitHook([]).startsWith("#!/bin/sh\n")).toBe(true);
  });

  it("runs persist doctor", () => {
    expect(renderPreCommitHook([])).toContain("\npersist doctor\n");
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

describe("renderPrePushHook", () => {
  it("starts with a POSIX sh shebang and runs the test gate instead of doctor", () => {
    const hook = renderPrePushHook(null, []);
    expect(hook.startsWith("#!/bin/sh\n")).toBe(true);
    expect(hook).toContain("\npersist test-gate\n");
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
});
