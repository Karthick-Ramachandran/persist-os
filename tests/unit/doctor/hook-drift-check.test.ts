import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkHookDrift } from "../../../src/core/doctor/checks/hook-drift-check.js";
import {
  PRE_COMMIT_HOOK_PATH,
  PRE_PUSH_HOOK_PATH,
  renderPreCommitHook,
  renderPrePushHook,
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
      },
    };
  }

  async function writeHooks(rootDir: string, preCommit: string, prePush: string): Promise<void> {
    await mkdir(path.join(rootDir, ".persist/hooks"), { recursive: true });
    await writeFile(path.join(rootDir, PRE_COMMIT_HOOK_PATH), preCommit, "utf8");
    await writeFile(path.join(rootDir, PRE_PUSH_HOOK_PATH), prePush, "utf8");
  }

  it("passes when both hooks match the config", async () => {
    const rootDir = await createRoot("drift-agree");
    const context = contextFor(rootDir);
    await writeHooks(
      rootDir,
      renderPreCommitHook(context.config.preCommitGates ?? []),
      renderPrePushHook(context.config.testCommand ?? null, context.config.prePushGates ?? []),
    );

    const { findings, outcome } = await checkHookDrift(context);

    expect(findings).toEqual([]);
    expect(outcome).toEqual({ check: "hook-drift", status: "evaluated" });
  });

  it("warns naming the hook when a baked-in gate disagrees with config", async () => {
    const rootDir = await createRoot("drift-disagree");
    const context = contextFor(rootDir);
    await writeHooks(
      rootDir,
      `${renderPreCommitHook([])}pnpm run test\n`,
      renderPrePushHook("pnpm run test:run", ["pnpm run typecheck"]),
    );

    const { findings, outcome } = await checkHookDrift(context);

    expect(outcome).toEqual({ check: "hook-drift", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "hook-drift",
      path: PRE_COMMIT_HOOK_PATH,
    });
  });

  it("reports not-evaluated when the hooks do not exist", async () => {
    const rootDir = await createRoot("drift-absent");

    const { findings, outcome } = await checkHookDrift(contextFor(rootDir));

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
    expect(outcome.reason).toContain(PRE_COMMIT_HOOK_PATH);
  });
});
