import { readFile } from "node:fs/promises";
import path from "node:path";

import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { expectedHookFiles } from "../../core/hooks/generate-hook.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type HooksSyncOptions = {
  rootDir: string;
  dryRun?: boolean;
};

export type HooksSyncResult = {
  dryRun: boolean;
  /** Already identical to what this version renders. */
  unchanged: string[];
  /** User-owned files that differ; left alone on purpose. */
  leftAlone: string[];
  plan: WritePlan;
  writeResult: WriteResult;
};

export type HooksSyncErrorCode = "NOT_INITIALIZED" | "WRITE_PLAN_ERROR";

export class HooksSyncError extends Error {
  readonly code: HooksSyncErrorCode;
  readonly details: string[];

  constructor(code: HooksSyncErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "HooksSyncError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Regenerate the generated hooks from `.persist/config.json`, and nothing else.
 *
 * This is the repair `hook-drift` points at. It exists because the only other way to regenerate a
 * hook was `init --force --reinit`, which rewrites every generated file — filled-in docs included —
 * and resets the config to defaults. Following a doctor warning should never cost a repository
 * its memory.
 *
 * Hook scripts are pure rendered output, so a differing one is overwritten. Claude settings can
 * hold the user's own entries, so that file is created when missing and otherwise left alone.
 * Identical files are reported as unchanged rather than rewritten.
 */
export async function syncHooks(options: HooksSyncOptions): Promise<HooksSyncResult> {
  const config = await loadRepoConfig(options.rootDir);

  const unchanged: string[] = [];
  const leftAlone: string[] = [];
  const toWrite: { path: string; content: string; executable?: boolean }[] = [];

  for (const file of expectedHookFiles(config)) {
    const current = await readFileIfExists(options.rootDir, file.path);

    if (current === file.content) {
      unchanged.push(file.path);
    } else if (current !== undefined && file.userOwned === true) {
      leftAlone.push(file.path);
    } else {
      toWrite.push({ path: file.path, content: file.content, executable: file.executable });
    }
  }

  // force is safe here: user-owned files only reach the plan when they do not exist.
  const plan = createWritePlan({ rootDir: options.rootDir, files: toWrite, force: true });

  if (plan.hasErrors) {
    throw new HooksSyncError(
      "WRITE_PLAN_ERROR",
      "Persist OS hooks sync write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return { dryRun: options.dryRun ?? false, unchanged, leftAlone, plan, writeResult };
}

export function formatSyncHooksResult(result: HooksSyncResult): string {
  const lines = [
    result.dryRun ? "Persist OS hooks sync dry run complete." : "Persist OS hooks sync complete.",
  ];

  appendWriteSummary(lines, { dryRun: result.dryRun, writeResult: result.writeResult });

  if (result.unchanged.length > 0) {
    lines.push("Unchanged:");
    for (const filePath of result.unchanged) {
      lines.push(`- ${filePath}`);
    }
  }

  const steps = result.leftAlone.map(
    (filePath) =>
      `${filePath} has your own settings, so it was left alone. Check it still wires the SessionStart hook.`,
  );
  if (result.dryRun && result.plan.entries.length > 0) {
    steps.push("Run `persist hooks sync` to write these changes.");
  }
  appendNextSteps(lines, steps);

  return `${lines.join("\n")}\n`;
}

async function readFileIfExists(
  rootDir: string,
  relativePath: string,
): Promise<string | undefined> {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

// Hooks are rendered from the repository's config; without one there is nothing to render
// from, and falling back to defaults would write hooks the repository never configured.
async function loadRepoConfig(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      throw new HooksSyncError(
        "NOT_INITIALIZED",
        "No valid Persist OS config found — hooks are rendered from .persist/config.json. Run `persist init` first, or fix the config errors `persist doctor` reports.",
      );
    }

    throw error;
  }
}
