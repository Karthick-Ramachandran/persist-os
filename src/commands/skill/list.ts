import { SKILL_CATALOG } from "../../core/skills/skill-catalog.js";

export function formatSkillListResult(): string {
  const lines = ["Recall OS skill catalog", ""];

  for (const skill of SKILL_CATALOG) {
    lines.push(`- ${skill.name}: ${skill.title}`);
  }

  return `${lines.join("\n")}\n`;
}
