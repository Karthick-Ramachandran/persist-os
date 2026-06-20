import { describe, expect, it } from "vitest";

import { generateSkillFiles, SKILL_TARGETS } from "../../../src/core/skills/generate-skill.js";

describe("generateSkillFiles", () => {
  it("emits the skill to both the Claude and portable Agent Skills targets", () => {
    const { files } = generateSkillFiles("write-tests");

    expect(files.map((file) => file.path)).toEqual([
      ".claude/skills/write-tests/SKILL.md",
      ".agents/skills/write-tests/SKILL.md",
    ]);
    expect(SKILL_TARGETS).toContain(".claude/skills");
    expect(SKILL_TARGETS).toContain(".agents/skills");
  });

  it("uses catalog content for a known skill with a valid trigger description", () => {
    const { files, fromCatalog } = generateSkillFiles("write-tests");

    expect(fromCatalog).toBe(true);
    const content = files[0].content;
    expect(content.startsWith("---\nname: write-tests\n")).toBe(true);
    expect(content).toContain("description: Write meaningful tests");
    expect(content).toContain("Use when");
    expect(content).toContain("## Stop Conditions");
    expect(content).not.toContain("```"); // no scripts / fenced code in generated skills
  });

  it("falls back to a skeleton for an unknown skill name", () => {
    const { files, fromCatalog } = generateSkillFiles("deploy-service");

    expect(fromCatalog).toBe(false);
    expect(files[0].content).toContain("name: deploy-service");
    expect(files[0].content).toContain("# Skill: Deploy Service");
    expect(files[0].content).toContain("Use when");
  });

  it("emits identical content to both targets", () => {
    const { files } = generateSkillFiles("create-prd");
    expect(files[0].content).toBe(files[1].content);
  });
});
