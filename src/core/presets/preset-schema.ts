import { z } from "zod";

import { normalizeOutputPath } from "../filesystem/safe-path.js";

const PRESET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const safeDestinationSchema = z.string().transform((value, context) => {
  try {
    return normalizeOutputPath(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message: error instanceof Error ? error.message : "Destination is invalid."
    });
    return z.NEVER;
  }
});

export class PresetValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid SpecForge preset: ${issues.join("; ")}`);
    this.name = "PresetValidationError";
    this.issues = issues;
  }
}

export const presetTemplateSchema = z
  .object({
    destination: safeDestinationSchema,
    content: z.string().min(1, "Template content cannot be empty."),
    description: z.string().min(1).optional()
  })
  .strict();

export const presetGuidanceSchema = z
  .object({
    title: z.string().min(1, "Guidance title cannot be empty."),
    body: z.string().min(1, "Guidance body cannot be empty.")
  })
  .strict();

export const presetProposedDecisionSchema = z
  .object({
    id: z
      .string()
      .min(1, "Decision id cannot be empty.")
      .max(80, "Decision id cannot exceed 80 characters.")
      .regex(
        PRESET_ID_PATTERN,
        "Decision id must use lowercase letters, numbers, and single hyphens."
      ),
    title: z.string().min(1, "Decision title cannot be empty."),
    status: z.literal("proposed"),
    destination: safeDestinationSchema,
    body: z.string().min(1, "Decision body cannot be empty.")
  })
  .strict();

export const presetSchema = z
  .object({
    id: z
      .string()
      .min(1, "Preset id cannot be empty.")
      .max(80, "Preset id cannot exceed 80 characters.")
      .regex(
        PRESET_ID_PATTERN,
        "Preset id must use lowercase letters, numbers, and single hyphens."
      ),
    name: z.string().min(1, "Preset name cannot be empty."),
    description: z.string().min(1, "Preset description cannot be empty."),
    templates: z.array(presetTemplateSchema).min(1, "Preset must include a template."),
    guidance: z.array(presetGuidanceSchema).default([]),
    proposedDecisions: z.array(presetProposedDecisionSchema).default([])
  })
  .strict()
  .superRefine((preset, context) => {
    const destinations = new Set<string>();

    for (const [index, template] of preset.templates.entries()) {
      if (destinations.has(template.destination)) {
        context.addIssue({
          code: "custom",
          path: ["templates", index, "destination"],
          message: `Duplicate destination "${template.destination}".`
        });
      }

      destinations.add(template.destination);
    }

    for (const [index, decision] of preset.proposedDecisions.entries()) {
      if (destinations.has(decision.destination)) {
        context.addIssue({
          code: "custom",
          path: ["proposedDecisions", index, "destination"],
          message: `Duplicate destination "${decision.destination}".`
        });
      }

      destinations.add(decision.destination);
    }
  });

export type PresetTemplate = z.infer<typeof presetTemplateSchema>;
export type PresetGuidance = z.infer<typeof presetGuidanceSchema>;
export type PresetProposedDecision = z.infer<typeof presetProposedDecisionSchema>;
export type Preset = z.infer<typeof presetSchema>;

export function parsePreset(value: unknown): Preset {
  const result = presetSchema.safeParse(value);

  if (!result.success) {
    throw new PresetValidationError(
      result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
    );
  }

  return result.data;
}
