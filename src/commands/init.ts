import { existsSync } from "node:fs";
import path from "node:path";

import { createDefaultConfig } from "../core/config/default-config.js";
import { CONFIG_PATH } from "../core/config/load-config.js";
import {
  createWritePlan,
  type WritePlan,
  type WriteFileInput,
} from "../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../core/filesystem/write-file-safe.js";
import { generateInitFiles } from "../core/generator/generate-init.js";
import { detectPreCommitGates } from "../core/hooks/detect-gates.js";
import {
  HOOKS_PATH_ACTIVATION_COMMAND,
  PRE_COMMIT_HOOK_PATH,
  renderPreCommitHook,
} from "../core/hooks/generate-hook.js";
import { getPreset } from "../core/presets/preset-registry.js";
import type { Preset } from "../core/presets/preset-schema.js";
import { appendNextSteps, appendWriteSummary } from "./write-summary.js";

export type InitOptions = {
  rootDir: string;
  preset?: string;
  dryRun?: boolean;
  force?: boolean;
  reinit?: boolean;
};

export type InitResult = {
  preset: string | null;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type InitErrorCode = "UNKNOWN_PRESET" | "WRITE_PLAN_ERROR" | "EXISTING_INSTALLATION";

export class InitError extends Error {
  readonly code: InitErrorCode;
  readonly details: string[];

  constructor(code: InitErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "InitError";
    this.code = code;
    this.details = details;
  }
}

export async function initProject(options: InitOptions): Promise<InitResult> {
  if (
    options.force === true &&
    options.reinit !== true &&
    existsSync(path.join(options.rootDir, CONFIG_PATH))
  ) {
    throw new InitError(
      "EXISTING_INSTALLATION",
      "Refusing to re-initialize an existing Recall OS installation.",
      [
        "An existing .recall/config.json was found in this directory.",
        "Running init --force here would overwrite existing repository memory.",
        "Pass --reinit together with --force to overwrite an existing installation.",
      ],
    );
  }

  const preset = resolvePreset(options.preset);
  const preCommitGates = await detectPreCommitGates(options.rootDir);
  const config = createDefaultConfig({ preset: preset?.id ?? null, preCommitGates });
  const files = createInitWriteFiles(options.rootDir, config, preset);
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new InitError(
      "WRITE_PLAN_ERROR",
      "Recall OS init write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    preset: preset?.id ?? null,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatInitResult(result: InitResult): string {
  const lines = [
    result.dryRun ? "Recall OS init dry run complete." : "Recall OS init complete.",
    `Preset: ${result.preset ?? "none"}`,
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  const hookWritten =
    result.writeResult.created.includes(PRE_COMMIT_HOOK_PATH) ||
    result.writeResult.overwritten.includes(PRE_COMMIT_HOOK_PATH);

  if (hookWritten) {
    lines.push("");
    lines.push(
      result.dryRun
        ? "Pre-commit hook will be written to .recall/hooks/pre-commit."
        : "Pre-commit hook written to .recall/hooks/pre-commit.",
    );
    lines.push(`Enable it once per clone: ${HOOKS_PATH_ACTIVATION_COMMAND}`);
  }

  if (!result.dryRun) {
    appendNextSteps(lines, [
      "Read CLAUDE.md and AGENTS.md, then the docs/ memory they point to.",
      "Plan your first feature: `recall feature create <name>`.",
      "Record a decision: `recall adr create <title>`.",
      "Check repository memory health anytime: `recall doctor`.",
    ]);
  }

  return `${lines.join("\n")}\n`;
}

function resolvePreset(presetId: string | undefined): Preset | null {
  if (presetId === undefined) {
    return null;
  }

  const preset = getPreset(presetId);

  if (preset === undefined) {
    throw new InitError("UNKNOWN_PRESET", `Unknown preset "${presetId}".`);
  }

  return preset;
}

function createInitWriteFiles(
  rootDir: string,
  config: ReturnType<typeof createDefaultConfig>,
  preset: Preset | null,
): WriteFileInput[] {
  return [
    {
      path: CONFIG_PATH,
      content: `${JSON.stringify(config, null, 2)}\n`,
    },
    ...generateInitFiles({ rootDir, preset }),
    {
      path: PRE_COMMIT_HOOK_PATH,
      content: renderPreCommitHook(config.preCommitGates),
      executable: true,
    },
  ];
}
