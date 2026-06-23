import { describe, expect, it } from "vitest";

import { renderSkill } from "../../../src/core/skills/render-skill.js";
import { SKILL_CATALOG } from "../../../src/core/skills/skill-catalog.js";

const NAME_PATTERN = /^[a-z0-9](?:-?[a-z0-9])*$/u;

describe("skill catalog", () => {
  it("ships the documented MVP skill set", () => {
    expect(SKILL_CATALOG.map((skill) => skill.name)).toEqual([
      "create-prd",
      "plan-feature",
      "plan-module",
      "create-adr",
      "implement-task",
      "write-tests",
      "security-review",
      "architecture-drift-review",
      "update-module-memory",
      "completion-report",
      "conventions-adherence",
      "capture-mcp-context",
    ]);
  });

  it("every skill is valid per the Agent Skills format", () => {
    for (const skill of SKILL_CATALOG) {
      expect(skill.name, `name ${skill.name}`).toMatch(NAME_PATTERN);
      expect(skill.name.length).toBeLessThanOrEqual(64);
      expect(skill.description.length).toBeGreaterThan(0);
      expect(skill.description.length).toBeLessThanOrEqual(1024);
      expect(skill.description, `${skill.name} description`).toContain("Use when");

      const rendered = renderSkill(skill);
      expect(rendered.startsWith(`---\nname: ${skill.name}\n`)).toBe(true);
      expect(rendered).toContain("## Quality Bar");
    }
  });
});
