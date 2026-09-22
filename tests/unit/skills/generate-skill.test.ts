import { describe, expect, it } from "vitest";

import { generateSkillFiles, SKILL_TARGETS } from "../../../src/core/skills/generate-skill.js";

describe("generateSkillFiles", () => {
  it("emits the skill to both the Claude and portable Agent Skills targets", () => {
    const { files } = generateSkillFiles("plan-feature");

    expect(files.map((file) => file.path)).toEqual([
      ".claude/skills/plan-feature/SKILL.md",
      ".agents/skills/plan-feature/SKILL.md",
    ]);
    expect(SKILL_TARGETS).toContain(".claude/skills");
    expect(SKILL_TARGETS).toContain(".agents/skills");
  });

  it("uses catalog content for a known skill with a valid trigger description", () => {
    const { files, fromCatalog } = generateSkillFiles("plan-feature");

    expect(fromCatalog).toBe(true);
    const content = files[0].content;
    expect(content.startsWith("---\nname: plan-feature\n")).toBe(true);
    expect(content).toContain("Turn approved requirements into an implementation plan");
    expect(content).toContain("Use when");
    expect(content).toContain("## Verification");
    expect(content).toContain("## Output");
    expect(content).not.toContain("Required Reading");
    expect(content).not.toContain("```"); // no scripts / fenced code in generated skills
  });

  it("emits scripts alongside SKILL.md for skills that ship them", () => {
    const { files, fromCatalog } = generateSkillFiles("security-review");

    expect(fromCatalog).toBe(true);
    expect(files.map((file) => file.path)).toEqual([
      ".claude/skills/security-review/SKILL.md",
      ".agents/skills/security-review/SKILL.md",
      ".claude/skills/security-review/scripts/scan-secrets.sh",
      ".agents/skills/security-review/scripts/scan-secrets.sh",
    ]);

    for (const file of files.filter((entry) => entry.path.endsWith(".sh"))) {
      expect(file.executable).toBe(true);
      expect(file.content.startsWith("#!/bin/sh\n")).toBe(true);
    }

    const skillMd = files.find((file) => file.path.endsWith("SKILL.md"))?.content ?? "";
    expect(skillMd).toContain("scripts/scan-secrets.sh");
    expect(skillMd).toContain("scripts/ is unavailable");
  });

  it("falls back to a skeleton for an unknown skill name", () => {
    const { files, fromCatalog } = generateSkillFiles("deploy-service");

    expect(fromCatalog).toBe(false);
    expect(files.map((file) => file.path)).toEqual([
      ".claude/skills/deploy-service/SKILL.md",
      ".agents/skills/deploy-service/SKILL.md",
    ]);
    expect(files[0].content).toContain("name: deploy-service");
    expect(files[0].content).toContain("# Goal");
    expect(files[0].content).toContain("Use when");
    expect(files[0].content).not.toContain("Required Reading");
  });

  it("emits identical content to both targets", () => {
    const { files } = generateSkillFiles("security-review");
    expect(files[0].content).toBe(files[1].content);
  });

  it("keeps every resource one hop from SKILL.md", () => {
    for (const name of ["plan-feature", "security-review", "conventions-adherence"]) {
      const { files } = generateSkillFiles(name);

      for (const file of files) {
        expect(file.path).not.toContain("/references/");
        expect(file.path).not.toContain("/assets/");
      }

      const skillMd = files.find((file) => file.path.endsWith("SKILL.md"))?.content ?? "";
      const resources = skillMd.split("## Resources")[1]?.split("## Output")[0] ?? "";
      for (const line of resources.split("\n").filter((entry) => entry.startsWith("- "))) {
        // One hop from SKILL.md: a docs/ memory file, or the AGENTS.md entry point that
        // defines the shared Stop and ask list the skills link to instead of copying.
        expect(line, `${name} resource`).toMatch(/^-\s+For .+ → (docs\/\S+|AGENTS\.md)$/u);
      }
    }
  });
});
