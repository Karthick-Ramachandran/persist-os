import { describe, expect, it } from "vitest";

import { generateModuleFiles } from "../../../src/core/generator/generate-module.js";
import { SlugifyError } from "../../../src/core/naming/slugify.js";

describe("generateModuleFiles", () => {
  it("generates all required module docs with deterministic paths", () => {
    const files = generateModuleFiles({
      modulesDir: "docs/30-modules",
      moduleName: "Billing"
    });

    expect(files.map((file) => file.path)).toEqual([
      "docs/30-modules/billing/MODULE.md",
      "docs/30-modules/billing/TASKS.md",
      "docs/30-modules/billing/TEST_PLAN.md",
      "docs/30-modules/billing/DECISIONS.md"
    ]);
  });

  it("creates concise starter module memory content", () => {
    const files = generateModuleFiles({
      modulesDir: "docs/30-modules",
      moduleName: "payment-gateway"
    });
    const moduleDoc = files.find((file) => file.path.endsWith("/MODULE.md"));
    const decisions = files.find((file) => file.path.endsWith("/DECISIONS.md"));

    expect(moduleDoc?.content).toContain("# Module: Payment Gateway");
    expect(moduleDoc?.content).toContain("## Owns");
    expect(moduleDoc?.content).toContain("## Does Not Own");
    expect(moduleDoc?.content).toContain("## Public Interfaces");
    expect(decisions?.content).toContain("# Module Decisions: Payment Gateway");
  });

  it("rejects unsafe module names", () => {
    expect(() =>
      generateModuleFiles({
        modulesDir: "docs/30-modules",
        moduleName: "../../evil"
      })
    ).toThrow(SlugifyError);
  });
});
