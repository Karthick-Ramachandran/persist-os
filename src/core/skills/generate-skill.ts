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

  const files: WriteFileInput[] = SKILL_TARGETS.map((target) => ({
    path: `${target}/${name}/SKILL.md`,
    content,
  }));

  // Scripts ride the same safe write pipeline as everything else: root-confined and
  // never-overwrite-by-default, with the executable bit carried on the plan entry.
  for (const target of SKILL_TARGETS) {
    for (const script of skill.scripts ?? []) {
      files.push({
        path: `${target}/${name}/${script.path}`,
        content: script.content,
        executable: script.executable,
      });
    }
  }

  return {
    files,
    fromCatalog: catalogSkill !== undefined,
  };
}

function skeletonSkill(name: string): SkillDefinition {
  return {
    name,
    title: titleize(name),
    description: `Describe what the ${name} skill does and when to use it. Use when ... (replace this with concrete trigger keywords).`,
    goal: "Describe the single job this skill performs.",
    inputs: ["List the inputs this skill needs, if any are non-obvious."],
    workflow: ["Describe the steps: one job, routing to source-of-truth docs."],
    verification: ["State how to tell the skill did its job well."],
    resources: ["List the source-of-truth docs this skill reads on demand."],
    output: ["List what the skill hands back."],
  };
}

function titleize(name: string): string {
  return name
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
