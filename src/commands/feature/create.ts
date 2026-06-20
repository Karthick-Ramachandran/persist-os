import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { resolveSafePath } from "../../core/filesystem/safe-path.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { generateFeatureFiles } from "../../core/generator/generate-feature.js";
import { getFeatureFolderForSlug } from "../../core/naming/feature-number.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { appendWriteSummary } from "../write-summary.js";

export type FeatureCreateOptions = {
  rootDir: string;
  name: string;
  dryRun?: boolean;
  force?: boolean;
};

export type FeatureCreateResult = {
  featureId: string;
  slug: string;
  featurePath: string;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type FeatureCreateErrorCode =
  | "CONFIG_REQUIRED"
  | "INVALID_FEATURE_NAME"
  | "WRITE_PLAN_ERROR";

export class FeatureCreateError extends Error {
  readonly code: FeatureCreateErrorCode;
  readonly details: string[];

  constructor(code: FeatureCreateErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "FeatureCreateError";
    this.code = code;
    this.details = details;
  }
}

export async function createFeature(
  options: FeatureCreateOptions
): Promise<FeatureCreateResult> {
  const slug = createFeatureSlug(options.name);
  const config = await loadRequiredConfig(options.rootDir);
  const featuresDirPath = resolveSafePath(options.rootDir, config.featuresDir);
  const featureFolder = await getFeatureFolderForSlug(featuresDirPath.absolutePath, slug);
  const files = generateFeatureFiles({
    featuresDir: config.featuresDir,
    featureId: featureFolder.id,
    featureName: options.name
  });
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force
  });

  if (plan.hasErrors) {
    throw new FeatureCreateError(
      "WRITE_PLAN_ERROR",
      "Feature create write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`)
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    featureId: featureFolder.id,
    slug,
    featurePath: `${config.featuresDir}/${featureFolder.folderName}`,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult
  };
}

export function formatFeatureCreateResult(result: FeatureCreateResult): string {
  const lines = [
    result.dryRun
      ? "SpecForge feature create dry run complete."
      : "SpecForge feature create complete.",
    `Feature: ${result.featurePath}`
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult
  });

  return `${lines.join("\n")}\n`;
}

function createFeatureSlug(name: string): string {
  try {
    return slugify(name);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new FeatureCreateError("INVALID_FEATURE_NAME", error.message);
    }

    throw error;
  }
}

async function loadRequiredConfig(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      throw new FeatureCreateError(
        "CONFIG_REQUIRED",
        "SpecForge config not found or invalid. Run `specforge init` first.",
        [error.message]
      );
    }

    throw error;
  }
}
