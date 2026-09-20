import { readFile } from "node:fs/promises";
import path from "node:path";

import { getStyle } from "../../cli/style.js";
import { ConfigValidationError } from "../../core/config/config-schema.js";
import { createDefaultConfig } from "../../core/config/default-config.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import {
  FENCES_FILE,
  FenceValidationError,
  addFenceEntry,
} from "../../core/fence/generate-fence.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type FenceAddOptions = {
  rootDir: string;
  path: string;
  why: string;
  by?: string;
  adr?: string;
  date?: string;
  dryRun?: boolean;
};

export type FenceAddResult = {
  fencesPath: string;
  fencedPath: string;
  existed: boolean;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type FenceAddErrorCode = "INVALID_FENCE" | "WRITE_PLAN_ERROR";

export class FenceAddError extends Error {
  readonly code: FenceAddErrorCode;
  readonly details: string[];

  constructor(code: FenceAddErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "FenceAddError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Record why a piece of code is shaped the way it is.
 *
 * The reason comes from a human. This command exists so that the writing is deterministic —
 * `fence-check` reads `## \`path\`` headings and the `Why:` line beneath them, and the
 * SessionStart hook greps the same two shapes to build its index. Hand-written markdown that
 * drifts from that shape is invisible to both, which is the failure that makes a fence worthless.
 *
 * Adding a path that is already fenced keeps the standing reason and appends a dated crossing,
 * because the file is read by path and two headings for one path would make the reason ambiguous.
 */
export async function addFence(options: FenceAddOptions): Promise<FenceAddResult> {
  const config = await loadConfigOrDefault(options.rootDir);
  const fencesPath = path.posix.join(config.docsDir, FENCES_FILE);
  const existing = await readFileIfExists(options.rootDir, fencesPath);

  let content: string;
  try {
    content = addFenceEntry(existing, {
      path: options.path,
      why: options.why,
      by: options.by,
      adr: options.adr,
      date: options.date,
    });
  } catch (error) {
    if (error instanceof FenceValidationError) {
      throw new FenceAddError("INVALID_FENCE", error.message);
    }
    throw error;
  }

  const plan = createWritePlan({
    rootDir: options.rootDir,
    files: [{ path: fencesPath, content }],
    // FENCES.md is append-only by nature: every add rewrites the whole file with one more entry,
    // so this is the one generated file that is meant to be overwritten.
    force: true,
  });

  if (plan.hasErrors) {
    throw new FenceAddError(
      "WRITE_PLAN_ERROR",
      "Persist OS fence add write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    fencesPath,
    fencedPath: options.path.trim(),
    existed: existing !== undefined,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatFenceAddResult(result: FenceAddResult): string {
  const style = getStyle();
  const lines = [
    result.dryRun ? "Persist OS fence add dry run complete." : "Persist OS fence add complete.",
    `Fenced: ${style.accent(result.fencedPath)}`,
  ];

  appendWriteSummary(lines, { dryRun: result.dryRun, writeResult: result.writeResult });

  if (!result.dryRun) {
    appendNextSteps(lines, [
      `The reason is in ${result.fencesPath} and loads into every session from now on.`,
      "A change to this path no longer raises a fence warning; doctor surfaces the reason instead.",
    ]);
  }

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

async function loadConfigOrDefault(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      return createDefaultConfig();
    }

    throw error;
  }
}
