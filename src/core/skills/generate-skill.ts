import type { WriteFileInput } from "../filesystem/write-plan.js";
import { renderSkill } from "./render-skill.js";
import { getCatalogSkill, type SkillDefinition } from "./skill-catalog.js";

/**
 * Skills are emitted to both the Claude Code target and the portable Agent Skills target so the same
 * SKILL.md is available across tools.
 */
export const SKILL_TARGETS = [".claude/skills", ".agents/skills"] as const;

export type GenerateSkillResult = {
  files: WriteFileInput[];
  fromCatalog: boolean;
};

export function generateSkillFiles(name: string): GenerateSkillResult {
  const catalogSkill = getCatalogSkill(name);
  const skill = catalogSkill ?? skeletonSkill(name);
  const content = renderSkill(skill);

  return {
    files: SKILL_TARGETS.map((target) => ({
      path: `${target}/${name}/SKILL.md`,
      content,
    })),
    fromCatalog: catalogSkill !== undefined,
  };
}

function skeletonSkill(name: string): SkillDefinition {
  return {
    name,
    title: titleize(name),
    description: `Describe what the ${name} skill does and when to use it. Use when ... (replace this with concrete trigger keywords).`,
    purpose: ["Describe the single job this skill performs."],
    inputs: ["List the inputs this skill needs."],
    requiredReading: ["List the source-of-truth docs this skill must read."],
    outputFiles: ["List the files this skill produces or updates."],
    process: ["Describe the steps, one job, routing to source-of-truth docs."],
    stopConditions: [
      "A request conflicts with accepted repository memory or engineering standards.",
      "The work would add network, telemetry, MCP runtime, AI API, or other MVP non-goals.",
    ],
    qualityBar: ["State how to tell the skill did its job well."],
  };
}

function titleize(name: string): string {
  return name
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
