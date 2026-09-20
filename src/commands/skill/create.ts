import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { generateSkillFiles } from "../../core/skills/generate-skill.js";
import { filterFilesForTools } from "../../core/aitools/tool-paths.js";
import { createDefaultConfig } from "../../core/config/default-config.js";
import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
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
  const { files: allFiles, fromCatalog } = generateSkillFiles(slug);
  const config = await loadConfigOrDefault(options.rootDir);
  const files = filterFilesForTools(allFiles, config.aiTools);
  const plan = createWritePlan({
    rootDir: options.rootDir,
    files,
    force: options.force,
  });

  if (plan.hasErrors) {
    throw new SkillCreateError(
      "WRITE_PLAN_ERROR",
      "Persist OS skill create write plan contains errors.",
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
    result.dryRun
      ? "Persist OS skill create dry run complete."
      : "Persist OS skill create complete.",
    `Skill: ${result.slug}${result.fromCatalog ? " (from catalog)" : " (skeleton — fill it in)"}`,
  ];

  appendWriteSummary(lines, {
    dryRun: result.dryRun,
    writeResult: result.writeResult,
  });

  if (!result.dryRun) {
    appendNextSteps(lines, buildSkillNextSteps(result));
  }

  return `${lines.join("\n")}\n`;
}

function skillTargets(result: SkillCreateResult): string[] {
  const present = new Set([
    ...result.writeResult.created,
    ...result.writeResult.overwritten,
    ...result.writeResult.skipped,
  ]);
  const targets: string[] = [];
  if ([...present].some((filePath) => filePath.startsWith(".claude/skills/"))) {
    targets.push(`.claude/skills/${result.slug}/`);
  }
  if ([...present].some((filePath) => filePath.startsWith(".agents/skills/"))) {
    targets.push(`.agents/skills/${result.slug}/`);
  }
  return targets;
}

function buildSkillNextSteps(result: SkillCreateResult): string[] {
  const targets = skillTargets(result);

  if (result.fromCatalog) {
    if (targets.length === 0) {
      return ["Restart your AI tool to load it; the agent triggers it from the description."];
    }
    return [
      `The skill is ready in ${targets.join(" and ")}.`,
      "Restart your AI tool to load it; the agent triggers it from the description.",
    ];
  }

  const claudeSkill = `.claude/skills/${result.slug}/SKILL.md`;
  const agentSkill = `.agents/skills/${result.slug}/SKILL.md`;
  const present = new Set([
    ...result.writeResult.created,
    ...result.writeResult.overwritten,
    ...result.writeResult.skipped,
  ]);
  const hasClaude = present.has(claudeSkill);
  const hasAgents = present.has(agentSkill);
  if (hasClaude && hasAgents) {
    return [
      `Open ${claudeSkill} and fill the description, process, and quality bar.`,
      "Keep the same content in .agents/skills/ for portability.",
    ];
  }
  if (hasClaude) {
    return [`Open ${claudeSkill} and fill the description, process, and quality bar.`];
  }

  return [`Open ${agentSkill} and fill the description, process, and quality bar.`];
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
