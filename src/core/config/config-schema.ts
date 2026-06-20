import { z } from "zod";

import type { ConflictPolicy } from "../filesystem/conflict-policy.js";
import { normalizeOutputPath } from "../filesystem/safe-path.js";

const PRESET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;
// Reject empty strings and any ASCII control characters (including newlines and tabs).
const PRE_COMMIT_GATE_PATTERN = /^[^\u0000-\u001f\u007f]+$/u;

export const memoryProfileSchema = z.enum(["lite", "standard", "strict"]);
export const aiToolTargetSchema = z.enum(["claude", "codex", "cursor", "generic"]);
export const configWritePolicySchema = z.enum(["skip-existing", "overwrite"]);

export type MemoryProfile = z.infer<typeof memoryProfileSchema>;
export type AiToolTarget = z.infer<typeof aiToolTargetSchema>;
export type ConfigWritePolicy = Extract<ConflictPolicy, "skip-existing" | "overwrite">;

export class ConfigValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid Recall OS config: ${issues.join("; ")}`);
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}

const versionSchema = z
  .string()
  .regex(VERSION_PATTERN, "Version must use MAJOR.MINOR.PATCH format.");

const presetSchema = z.union([
  z.null(),
  z
    .string()
    .min(1, "Preset cannot be empty.")
    .max(80, "Preset cannot exceed 80 characters.")
    .regex(PRESET_ID_PATTERN, "Preset must use lowercase letters, numbers, and single hyphens."),
]);

const preCommitGateSchema = z
  .string()
  .min(1, "Pre-commit gate cannot be empty.")
  .max(200, "Pre-commit gate cannot exceed 200 characters.")
  .regex(
    PRE_COMMIT_GATE_PATTERN,
    "Pre-commit gate must be a single line without control characters.",
  );

const safeRelativePathSchema = z.string().transform((value, context) => {
  try {
    return normalizeOutputPath(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Path is invalid.",
    });
    return z.NEVER;
  }
});

export const recallConfigSchema = z
  .object({
    version: versionSchema,
    templateVersion: versionSchema,
    preset: presetSchema,
    memoryProfile: memoryProfileSchema,
    mode: memoryProfileSchema,
    aiTools: z.array(aiToolTargetSchema).min(1, "At least one AI tool is required."),
    docsDir: safeRelativePathSchema,
    featuresDir: safeRelativePathSchema,
    modulesDir: safeRelativePathSchema,
    adrDir: safeRelativePathSchema,
    writePolicy: configWritePolicySchema,
    preCommitGates: z.array(preCommitGateSchema).max(50, "Too many pre-commit gates.").default([]),
  })
  .strict()
  .superRefine((config, context) => {
    if (config.memoryProfile !== config.mode) {
      context.addIssue({
        code: "custom",
        path: ["mode"],
        message: "Mode must match memoryProfile in P2.",
      });
    }

    const seenAiTools = new Set<AiToolTarget>();
    for (const aiTool of config.aiTools) {
      if (seenAiTools.has(aiTool)) {
        context.addIssue({
          code: "custom",
          path: ["aiTools"],
          message: `Duplicate AI tool "${aiTool}".`,
        });
      }
      seenAiTools.add(aiTool);
    }
  });

export type RecallConfig = z.infer<typeof recallConfigSchema>;

export function parseConfig(value: unknown): RecallConfig {
  const result = recallConfigSchema.safeParse(value);

  if (!result.success) {
    throw new ConfigValidationError(
      result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      }),
    );
  }

  return result.data;
}
