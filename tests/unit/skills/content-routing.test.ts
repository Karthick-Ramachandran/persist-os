import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getCatalogSkill } from "../../../src/core/skills/skill-catalog.js";

/**
 * Criterion 10: every retired skill's content is routed to a Rule, Tool, or
 * Reference, or consciously dropped with the reason stated (see the F-035
 * completion report for the per-skill accounting).
 */
const RETIRED_IDS = [
  "create-prd",
  "create-adr",
  "plan-module",
  "implement-task",
  "write-tests",
  "update-module-memory",
  "completion-report",
  "capture-mcp-context",
  "architecture-drift-review",
];

describe("retired skill content routing", () => {
  it("moves the missing always-on constraint into AGENTS.md", () => {
    const agents = readFileSync("AGENTS.md", "utf8");

    expect(agents).toContain("Stop when tests cannot be designed from the available requirements");
  });

  it("routes module-request substance to the workflow reference from plan-feature", () => {
    const plan = getCatalogSkill("plan-feature");
    expect(plan).toBeDefined();
    expect(plan?.resources.join("\n")).toContain("docs/ai/MODULE_DELIVERY_WORKFLOW.md");

    const workflow = readFileSync("docs/ai/MODULE_DELIVERY_WORKFLOW.md", "utf8");
    expect(workflow).toContain("Module Memory Updates");
    expect(workflow).toContain("TEST_PLAN.md");
  });

  it("retired ids fall through to the skeleton instead of the catalog", () => {
    for (const name of RETIRED_IDS) {
      expect(getCatalogSkill(name), name).toBeUndefined();
    }
  });
});
