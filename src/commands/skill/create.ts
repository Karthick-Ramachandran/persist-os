import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { generateSkillFiles } from "../../core/skills/generate-skill.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type SkillCreateOptions = {
  rootDir: string;
  name: string;
  dryRun?: boolean;
  force?: boolean;
};

export type SkillCreateResult = {
  slug: string;
  fromCatalog: boolean;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type SkillCreateErrorCode = "INVALID_SKILL_NAME" | "WRITE_PLAN_ERROR";

export class SkillCreateError extends Error {
  readonly code: SkillCreateErrorCode;
  readonly details: string[];

  constructor(code: SkillCreateErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "SkillCreateError";
    this.code = code;
    this.details = details;
  }
}

export async function createSkill(options: SkillCreateOptions): Promise<SkillCreateResult> {
  const slug = createSkillSlug(options.name);
  const { files, fromCatalog } = generateSkillFiles(slug);
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new SkillCreateError(
      "WRITE_PLAN_ERROR",
      "Recall OS skill create write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    slug,
    fromCatalog,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatSkillCreateResult(result: SkillCreateResult): string {
  const lines = [
    result.dryRun ? "Recall OS skill create dry run complete." : "Recall OS skill create complete.",
    `Skill: ${result.slug}${result.fromCatalog ? " (from catalog)" : " (skeleton — fill it in)"}`,
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  if (!result.dryRun) {
    appendNextSteps(
      lines,
      result.fromCatalog
        ? [
            `The skill is ready in .claude/skills/${result.slug}/ and .agents/skills/${result.slug}/.`,
            "Restart your AI tool to load it; the agent triggers it from the description.",
          ]
        : [
            `Open .claude/skills/${result.slug}/SKILL.md and fill the description, process, and quality bar.`,
            "Keep the same content in .agents/skills/ for portability.",
          ],
    );
  }

  return `${lines.join("\n")}\n`;
}

function createSkillSlug(name: string): string {
  try {
    return slugify(name);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new SkillCreateError("INVALID_SKILL_NAME", error.message);
    }

    throw error;
  }
}
