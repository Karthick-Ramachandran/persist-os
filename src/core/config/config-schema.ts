import { z } from "zod";

import type { ConflictPolicy } from "../filesystem/conflict-policy.js";
import { normalizeOutputPath } from "../filesystem/safe-path.js";

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/u;
// Reject empty strings and any ASCII control characters (including newlines and tabs).
const PRE_COMMIT_GATE_PATTERN = /^[^\u0000-\u001f\u007f]+$/u;

export const memoryProfileSchema = z.enum(["lite", "standard", "strict"]);
export const aiToolTargetSchema = z.enum(["claude", "codex", "cursor", "generic"]);
export const configWritePolicySchema = z.enum(["skip-existing", "overwrite"]);

/** @deprecated Reserved for F5 (lite/standard/strict wiring). Accepted on read, never written or read. */
export type MemoryProfile = z.infer<typeof memoryProfileSchema>;
export type AiToolTarget = z.infer<typeof aiToolTargetSchema>;
export type ConfigWritePolicy = Extract<ConflictPolicy, "skip-existing" | "overwrite">;

export class ConfigValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid Persist OS config: ${issues.join("; ")}`);
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}

const versionSchema = z
  .string()
  .regex(VERSION_PATTERN, "Version must use MAJOR.MINOR.PATCH format.");

const preCommitGateSchema = z
  .string()
  .min(1, "Pre-commit gate cannot be empty.")
  .max(200, "Pre-commit gate cannot exceed 200 characters.")
  .regex(
    PRE_COMMIT_GATE_PATTERN,
    "Pre-commit gate must be a single line without control characters.",
  );

const testCommandSchema = z
  .string()
  .min(1, "Test command cannot be empty.")
  .max(200, "Test command cannot exceed 200 characters.")
  .regex(PRE_COMMIT_GATE_PATTERN, "Test command must be a single line without control characters.");

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

export const persistConfigSchema = z
  .object({
    version: versionSchema,
    templateVersion: versionSchema,
    aiTools: z.array(aiToolTargetSchema).min(1, "At least one AI tool is required."),
    docsDir: safeRelativePathSchema,
    featuresDir: safeRelativePathSchema,
    modulesDir: safeRelativePathSchema,
    adrDir: safeRelativePathSchema,
    preCommitGates: z.array(preCommitGateSchema).max(50, "Too many pre-commit gates.").default([]),
    prePushGates: z.array(preCommitGateSchema).max(50, "Too many pre-push gates.").default([]),
    // The one-shot test command the test gate runs. null means the gate is off. Optional on
    // read (zod default) so pre-existing configs without it keep loading.
    testCommand: testCommandSchema.nullable().default(null),
    // Deprecated B5 knobs: accepted on read for backward compat with pre-0.7 configs,
    // never written by new inits and never read. `mode` duplicated `memoryProfile`;
    // `writePolicy` was superseded by --force/--dry-run.
    memoryProfile: memoryProfileSchema.optional(),
    mode: memoryProfileSchema.optional(),
    writePolicy: configWritePolicySchema.optional(),
  })
  .strict()
  .superRefine((config, context) => {
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

export type PersistConfig = z.infer<typeof persistConfigSchema>;

export function parseConfig(value: unknown): PersistConfig {
  // Presets were retired in 1.0 (ADR-0007): fail with the fix, not zod's generic
  // unrecognized-key error and not silent acceptance.
  if (typeof value === "object" && value !== null && "preset" in value) {
    throw new ConfigValidationError([
      'preset: presets were retired in 1.0 — delete the "preset" line from .persist/config.json',
    ]);
  }

  const result = persistConfigSchema.safeParse(value);

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
