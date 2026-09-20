import type { SkillDefinition } from "./skill-catalog.js";

/**
 * Render a SkillDefinition into a valid Agent Skills SKILL.md.
 *
 * Sections are earned, never stamped: a heading appears only when the skill has content
 * for it, so a skill without non-obvious inputs gets no `Inputs` heading. The output
 * uses only the standard portable fields (`name`, `description`).
 */
export function renderSkill(skill: SkillDefinition): string {
  const lines: string[] = [
    "---",
    `name: ${skill.name}`,
    // JSON-stringify yields a valid double-quoted YAML scalar, so descriptions with any punctuation
    // stay valid Agent Skills frontmatter.
    `description: ${JSON.stringify(skill.description)}`,
    "---",
    "",
    "# Goal",
    "",
    skill.goal,
    "",
  ];

  pushBullets(lines, "Inputs", skill.inputs);
  pushNumbered(lines, "Workflow", skill.workflow);
  pushBullets(lines, "Decisions", skill.decisions);
  pushBullets(lines, "Verification", skill.verification);
  pushBullets(lines, "Resources", skill.resources);
  pushBullets(lines, "Output", skill.output);

  return `${lines.join("\n")}\n`;
}

function pushBullets(lines: string[], heading: string, values: string[] | undefined): void {
  if (values === undefined || values.length === 0) {
    return;
  }

  lines.push(`## ${heading}`, "", ...values.map((value) => `- ${value}`), "");
}

function pushNumbered(lines: string[], heading: string, values: string[] | undefined): void {
  if (values === undefined || values.length === 0) {
    return;
  }

  lines.push(`## ${heading}`, "", ...values.map((value, index) => `${index + 1}. ${value}`), "");
}
