import type { SkillDefinition } from "./skill-catalog.js";

/**
 * Render a SkillDefinition into a valid Agent Skills SKILL.md.
 *
 * The output uses only the standard portable fields (`name`, `description`) and contains no scripts,
 * so the same file works in Claude Code and other Agent Skills-compatible tools.
 */
export function renderSkill(skill: SkillDefinition): string {
  const lines: string[] = [
    "---",
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    "---",
    "",
    `# Skill: ${skill.title}`,
    "",
    "## Purpose",
    "",
    ...paragraphs(skill.purpose),
    "",
    "## Inputs",
    "",
    ...bullets(skill.inputs),
    "",
    "## Required Reading",
    "",
    ...bullets(skill.requiredReading),
    "",
    "## Output Files",
    "",
    ...bullets(skill.outputFiles),
    "",
    "## Process",
    "",
    ...numbered(skill.process),
    "",
  ];

  for (const section of skill.extraSections ?? []) {
    lines.push(`## ${section.heading}`, "", ...bullets(section.bullets), "");
  }

  lines.push(
    "## Stop Conditions",
    "",
    "Stop and request human decision if:",
    "",
    ...bullets(skill.stopConditions),
    "",
    "## Quality Bar",
    "",
    ...bullets(skill.qualityBar),
  );

  return `${lines.join("\n")}\n`;
}

function paragraphs(values: string[]): string[] {
  const out: string[] = [];
  values.forEach((value, index) => {
    if (index > 0) {
      out.push("");
    }
    out.push(value);
  });
  return out;
}

function bullets(values: string[]): string[] {
  return values.map((value) => `- ${value}`);
}

function numbered(values: string[]): string[] {
  return values.map((value, index) => `${index + 1}. ${value}`);
}
