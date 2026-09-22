import { describe, expect, it } from "vitest";

import { renderSkill } from "../../../src/core/skills/render-skill.js";
import { SKILL_CATALOG } from "../../../src/core/skills/skill-catalog.js";

const NAME_PATTERN = /^[a-z0-9](?:-?[a-z0-9])*$/u;
const WORD_CEILING = 600;

/**
 * Distinctive trigger phrases per skill. The regression this guards is a rewritten
 * description that routes worse: a term lost from the description means prompts using
 * it no longer match, and the skill silently never fires.
 */
const TRIGGER_TERMS: Record<string, string[]> = {
  "plan-feature": ["implementation plan", "test plan", "approved requirements", "one-page prd"],
  "security-review": ["security risk", "trust boundary", "secret"],
  "conventions-adherence": ["naming convention", "canonical", "reinvent"],
  "chestertons-fence": ["chesterton", "fence crossing", "fences.md"],
  context: ["area memory", "context card"],
  "implement-task": ["code change", "five-step loop"],
  "write-tests": ["acceptance criteria", "fails without the fix"],
  "create-adr": ["record a decision", "applies to"],
  "drift-review": ["fresh-context review", "non-trivial change"],
  "completion-report": ["completion report", "commands run", "files changed"],
  "module-memory": ["module memory", "ownership"],
};

const MUST_ACTIVATE: Record<string, string[]> = {
  "plan-feature": [
    "Turn this approved PRD into an implementation plan with tasks and a test plan",
    "We have approved requirements; break them into ordered tasks with completion evidence",
  ],
  "security-review": [
    "Review this diff for security risks before merging; it moves a trust boundary",
    "Check this change for a leaked secret before it lands",
  ],
  "conventions-adherence": [
    "Before finishing, check this change against our naming conventions and canonical helpers",
    "Does this refactor reinvent anything our canonical primitives already cover",
  ],
  "chestertons-fence": [
    "A fence warning fired on the staged diff; work through the chesterton questions with me",
    "Record the human-confirmed reason for this logic in FENCES.md before I commit",
  ],
  context: [
    "Starting work in the billing area; check its area memory before I read code",
    "Finished the rounding fix; record it on the area context card for the next task",
  ],
  "implement-task": [
    "Make this code change with focused tests",
    "Run the five-step loop on this code change before calling it done",
  ],
  "write-tests": [
    "Write a test from the acceptance criteria that fails without the fix",
    "Cover this bug fix with a test that fails without the fix",
  ],
  "create-adr": [
    "Record our database choice as a decision with an Applies To list",
    "Record a decision for the new auth flow before we build it",
  ],
  "drift-review": [
    "Give this finished change a fresh-context review before it lands",
    "This non-trivial change is done; review it against the ADRs and boundaries",
  ],
  "completion-report": [
    "Write the completion report with files changed and commands run",
    "Summarise the files changed and commands run for handover",
  ],
  "module-memory": [
    "Plan the module memory for the billing area and its ownership",
    "Update the module memory where the ownership changed",
  ],
};

const MUST_NOT_ACTIVATE: Record<string, string[]> = {
  "plan-feature": [
    "Review this diff for security risks before merging",
    "Does this change follow our naming conventions",
  ],
  "security-review": [
    "Turn the roadmap into an implementation plan with a test plan",
    "Check this refactor against canonical naming conventions",
  ],
  "conventions-adherence": [
    "Look for hardcoded passwords in this diff",
    "Write tasks and a test plan for the billing feature",
  ],
  "chestertons-fence": [
    "Turn this approved plan into ordered tasks with completion evidence",
    "Check this diff for hardcoded passwords before merging",
  ],
  context: [
    "Turn this approved plan into ordered tasks with completion evidence",
    "Check this diff for hardcoded passwords before merging",
  ],
  "implement-task": [
    "Review this diff for security risks before merging",
    "Turn the roadmap into an implementation plan with a test plan",
  ],
  "write-tests": [
    "Turn the roadmap into an implementation plan with a test plan",
    "Check this refactor against canonical naming conventions",
  ],
  "create-adr": [
    "Check this diff for hardcoded passwords before merging",
    "Turn this approved plan into ordered tasks with completion evidence",
  ],
  "drift-review": [
    "Turn this approved plan into ordered tasks with completion evidence",
    "Check this diff for hardcoded passwords before merging",
  ],
  "completion-report": [
    "Turn this approved plan into ordered tasks with completion evidence",
    "Review this diff for security risks before merging",
  ],
  "module-memory": [
    "Turn this approved plan into ordered tasks with completion evidence",
    "Check this diff for hardcoded passwords before merging",
  ],
};

describe("skill catalog", () => {
  it("ships exactly the twelve catalog skills", () => {
    expect(SKILL_CATALOG.map((skill) => skill.name)).toEqual([
      "implement-task",
      "write-tests",
      "create-adr",
      "drift-review",
      "completion-report",
      "module-memory",
      "plan-feature",
      "security-review",
      "conventions-adherence",
      "chestertons-fence",
      "adr-compliance",
      "context",
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
    }
  });

  it("no catalog skill contains Required Reading", () => {
    for (const skill of SKILL_CATALOG) {
      expect(renderSkill(skill), skill.name).not.toContain("Required Reading");
    }
  });

  it("no skill exceeds the word ceiling", () => {
    for (const skill of SKILL_CATALOG) {
      const words = renderSkill(skill).split(/\s+/u).filter(Boolean).length;
      expect(words, `${skill.name} words`).toBeLessThanOrEqual(WORD_CEILING);
    }
  });

  it("every skill has Verification and Output with 5-10 workflow steps", () => {
    for (const skill of SKILL_CATALOG) {
      const rendered = renderSkill(skill);
      expect(rendered, skill.name).toContain("## Verification");
      expect(rendered, skill.name).toContain("## Output");
      expect(skill.workflow.length).toBeGreaterThanOrEqual(5);
      expect(skill.workflow.length).toBeLessThanOrEqual(10);
    }
  });

  it("names stay short and descriptions stay in the router budget", () => {
    for (const skill of SKILL_CATALOG) {
      expect(skill.name.split("-").length, `${skill.name} name words`).toBeLessThanOrEqual(4);
      const words = skill.description.split(/\s+/u).filter(Boolean).length;
      expect(words, `${skill.name} description words`).toBeGreaterThanOrEqual(20);
      expect(words, `${skill.name} description words`).toBeLessThanOrEqual(60);
    }
  });

  it("keeps the combined router size small enough to stay always loaded", () => {
    // Every description rides in context on every task, so the sum is the router's
    // always-loaded cost. 1.3.0 shipped six skills at 1,889 bytes; twelve skills at
    // 3,599 bytes still cost less than one always-loaded agent file.
    const bytes = SKILL_CATALOG.reduce(
      (total, skill) => total + Buffer.byteLength(skill.description, "utf8"),
      0,
    );

    expect(bytes).toBeLessThanOrEqual(4096);
  });

  it("ends every change-making skill with the shared Stop and ask list", () => {
    const stopAndAsk = ["implement-task", "write-tests", "create-adr", "drift-review"];

    for (const name of stopAndAsk) {
      const skill = SKILL_CATALOG.find((entry) => entry.name === name)!;

      expect(skill.workflow.at(-1), `${name} last step`).toContain("Stop and ask");
      expect(skill.resources.join("\n"), `${name} resources`).toContain("AGENTS.md");
    }
  });

  it("every document a workflow step depends on is linked from Resources", () => {
    for (const skill of SKILL_CATALOG) {
      expect(skill.resources.length, `${skill.name} resources`).toBeGreaterThan(0);

      const linked = skill.resources.join("\n");
      const readDeps = [...skill.workflow, ...(skill.decisions ?? [])].join("\n");
      for (const match of readDeps.matchAll(/docs\/[A-Za-z0-9._/-]+\/?/gu)) {
        expect(linked, `${skill.name} step uses ${match[0]} without linking it`).toContain(
          match[0],
        );
      }

      for (const match of readDeps.matchAll(/\b[A-Z][A-Za-z0-9_-]*\.md\b/gu)) {
        expect(
          linked.includes(match[0]),
          `${skill.name} step uses ${match[0]} without linking it`,
        ).toBe(true);
      }

      for (const step of skill.workflow) {
        expect(
          step.split(/\s+/u).length,
          `${skill.name} step too short to be followable`,
        ).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("every verification bullet states a checkable condition", () => {
    const vague = ["the work is done", "the work is complete", "feels finished", "feels complete"];

    for (const skill of SKILL_CATALOG) {
      expect(skill.verification.length, `${skill.name} verification`).toBeGreaterThan(0);

      for (const bullet of skill.verification) {
        expect(
          bullet.split(/\s+/u).length,
          `${skill.name} verification too short to check`,
        ).toBeGreaterThanOrEqual(5);
        for (const phrase of vague) {
          expect(bullet.toLowerCase(), `${skill.name} verification`).not.toContain(phrase);
        }
      }
    }
  });

  it("omits headings for sections with no content", () => {
    const rendered = renderSkill({
      name: "sparse",
      title: "Sparse",
      description: "Does one thing. Use when testing the renderer.",
      goal: "Prove earned sections.",
      workflow: ["Do the one thing."],
      verification: ["The thing is done."],
      resources: ["For context → docs/adrs/"],
      output: ["The result."],
    });

    expect(rendered).toContain("## Workflow");
    expect(rendered).not.toContain("## Inputs");
    expect(rendered).not.toContain("## Decisions");
  });

  it("a catalog skill omits Inputs when everything it needs is obvious", () => {
    const rendered = renderSkill(
      SKILL_CATALOG.find((skill) => skill.name === "conventions-adherence")!,
    );

    expect(rendered).not.toContain("## Inputs");
  });

  it("routes must-activate prompts and never must-not prompts", () => {
    for (const skill of SKILL_CATALOG) {
      const terms = TRIGGER_TERMS[skill.name] ?? [];
      const description = skill.description.toLowerCase();

      for (const term of terms) {
        expect(description, `${skill.name} routes "${term}"`).toContain(term);
      }

      for (const prompt of MUST_ACTIVATE[skill.name] ?? []) {
        const hits = terms.filter((term) => prompt.toLowerCase().includes(term));
        expect(hits, `"${prompt}" must carry a ${skill.name} trigger term`).not.toHaveLength(0);
        for (const hit of hits) {
          expect(description).toContain(hit);
        }
      }

      for (const prompt of MUST_NOT_ACTIVATE[skill.name] ?? []) {
        expect(
          terms.filter((term) => prompt.toLowerCase().includes(term)),
          `"${prompt}" must not route ${skill.name}`,
        ).toEqual([]);
      }

      for (const other of SKILL_CATALOG) {
        if (other.name === skill.name) {
          continue;
        }
        for (const term of TRIGGER_TERMS[other.name] ?? []) {
          expect(
            description,
            `${skill.name} must not steal ${other.name}'s trigger term "${term}"`,
          ).not.toContain(term);
        }
      }
    }
  });
});
