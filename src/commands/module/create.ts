import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { generateModuleFiles } from "../../core/generator/generate-module.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type ModuleCreateOptions = {
  rootDir: string;
  name: string;
  dryRun?: boolean;
  force?: boolean;
};

export type ModuleCreateResult = {
  slug: string;
  modulePath: string;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type ModuleCreateErrorCode = "CONFIG_REQUIRED" | "INVALID_MODULE_NAME" | "WRITE_PLAN_ERROR";

export class ModuleCreateError extends Error {
  readonly code: ModuleCreateErrorCode;
  readonly details: string[];

  constructor(code: ModuleCreateErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "ModuleCreateError";
    this.code = code;
    this.details = details;
  }
}

export async function createModule(options: ModuleCreateOptions): Promise<ModuleCreateResult> {
  const slug = createModuleSlug(options.name);
  const config = await loadRequiredConfig(options.rootDir);
  const files = generateModuleFiles({
    modulesDir: config.modulesDir,
    moduleName: options.name,
  });
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new ModuleCreateError(
      "WRITE_PLAN_ERROR",
      "Module create write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    slug,
    modulePath: `${config.modulesDir}/${slug}`,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatModuleCreateResult(result: ModuleCreateResult): string {
  const lines = [
    result.dryRun
      ? "Recall OS module create dry run complete."
      : "Recall OS module create complete.",
    `Module: ${result.modulePath}`,
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  if (!result.dryRun) {
    appendNextSteps(lines, [
      `Open ${result.modulePath}/MODULE.md and describe what this module owns and does not own.`,
      "Record durable decisions in DECISIONS.md, or link an ADR.",
    ]);
  }

  return `${lines.join("\n")}\n`;
}

function createModuleSlug(name: string): string {
  try {
    return slugify(name);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new ModuleCreateError("INVALID_MODULE_NAME", error.message);
    }

    throw error;
  }
}

async function loadRequiredConfig(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      throw new ModuleCreateError(
        "CONFIG_REQUIRED",
        "Recall OS config not found or invalid. Run `recall init` first.",
        [error.message],
      );
    }

    throw error;
  }
}
