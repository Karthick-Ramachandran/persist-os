import { createDefaultConfig } from "../core/config/default-config.js";
import { ConfigValidationError } from "../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../core/config/load-config.js";
import { generateAdoptionFiles } from "../core/adopt/generate-adoption.js";
import { inspectRepo, type RepoSignals } from "../core/adopt/inspect-repo.js";
import { createWritePlan, type WritePlan } from "../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../core/filesystem/write-file-safe.js";
import { appendNextSteps, appendWriteSummary } from "./write-summary.js";

export type AdoptOptions = {
  rootDir: string;
  dryRun?: boolean;
  force?: boolean;
};

export type AdoptResult = {
  signals: RepoSignals;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type AdoptErrorCode = "WRITE_PLAN_ERROR";

export class AdoptError extends Error {
  readonly code: AdoptErrorCode;
  readonly details: string[];

  constructor(code: AdoptErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "AdoptError";
    this.code = code;
    this.details = details;
  }
}

export async function adoptProject(options: AdoptOptions): Promise<AdoptResult> {
  const config = await loadConfigOrDefault(options.rootDir);
  const signals = await inspectRepo(options.rootDir);
  const files = generateAdoptionFiles({ adrDir: config.adrDir, signals });
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new AdoptError(
      "WRITE_PLAN_ERROR",
      "Recall OS adopt write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    signals,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatAdoptResult(result: AdoptResult): string {
  const lines = [
    result.dryRun ? "Recall OS adopt dry run complete." : "Recall OS adopt complete.",
    "Inferred signals are proposed and require human review.",
    `Languages: ${formatList(result.signals.languages)}`,
    `Package manager: ${result.signals.packageManager ?? "none detected"}`,
    `Frameworks: ${formatList(result.signals.frameworks)}`,
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  if (!result.dryRun) {
    appendNextSteps(lines, [
      "Review docs/adopt/ADOPTION_REPORT.md — everything in it is proposed.",
      "Run `recall init` to establish neutral repository memory if it does not exist yet.",
      "Accept or reject each proposed ADR under docs/adrs/proposed/.",
    ]);
  }

  return `${lines.join("\n")}\n`;
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

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none detected";
}
