import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { resolveSafePath } from "../../core/filesystem/safe-path.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { generateAdrFile } from "../../core/generator/generate-adr.js";
import { getAdrFileForSlug } from "../../core/naming/adr-number.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type AdrCreateOptions = {
  rootDir: string;
  title: string;
  dryRun?: boolean;
  force?: boolean;
};

export type AdrCreateResult = {
  adrId: string;
  slug: string;
  adrPath: string;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type AdrCreateErrorCode = "CONFIG_REQUIRED" | "INVALID_ADR_TITLE" | "WRITE_PLAN_ERROR";

export class AdrCreateError extends Error {
  readonly code: AdrCreateErrorCode;
  readonly details: string[];

  constructor(code: AdrCreateErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "AdrCreateError";
    this.code = code;
    this.details = details;
  }
}

export async function createAdr(options: AdrCreateOptions): Promise<AdrCreateResult> {
  const slug = createAdrSlug(options.title);
  const config = await loadRequiredConfig(options.rootDir);
  const adrDirPath = resolveSafePath(options.rootDir, config.adrDir);
  const adrFile = await getAdrFileForSlug(adrDirPath.absolutePath, slug);
  const files = generateAdrFile({
    adrDir: config.adrDir,
    adrId: adrFile.id,
    title: options.title,
  });
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new AdrCreateError(
      "WRITE_PLAN_ERROR",
      "ADR create write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    adrId: adrFile.id,
    slug,
    adrPath: `${config.adrDir}/${adrFile.fileName}`,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatAdrCreateResult(result: AdrCreateResult): string {
  const lines = [
    result.dryRun ? "Recall OS ADR create dry run complete." : "Recall OS ADR create complete.",
    `ADR: ${result.adrPath}`,
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  if (!result.dryRun) {
    appendNextSteps(lines, [
      `Open ${result.adrPath} and fill: Context, Decision, Alternatives, Consequences.`,
      "It is Proposed — set Status to Accepted once the team agrees.",
    ]);
  }

  return `${lines.join("\n")}\n`;
}

function createAdrSlug(title: string): string {
  try {
    return slugify(title);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new AdrCreateError("INVALID_ADR_TITLE", error.message);
    }

    throw error;
  }
}

async function loadRequiredConfig(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      throw new AdrCreateError(
        "CONFIG_REQUIRED",
        "Recall OS config not found or invalid. Run `recall init` first.",
        [error.message],
      );
    }

    throw error;
  }
}
