import { describe, expect, it } from "vitest";

import { generateFeatureFiles } from "../../../src/core/generator/generate-feature.js";
import { SlugifyError } from "../../../src/core/naming/slugify.js";

describe("generateFeatureFiles", () => {
  it("writes two files when the test gate is off", () => {
    const files = generateFeatureFiles({
      featuresDir: "docs/40-features",
      featureId: "F-001",
      featureName: "Auth Provider",
      testGate: false,
    });

    expect(files.map((file) => file.path)).toEqual([
      "docs/40-features/F-001-auth-provider/PLAN.md",
      "docs/40-features/F-001-auth-provider/TASKS.md",
    ]);
  });

  it("adds TEST_PLAN.md when the test gate is on", () => {
    const files = generateFeatureFiles({
      featuresDir: "docs/40-features",
      featureId: "F-001",
      featureName: "Auth Provider",
      testGate: true,
    });

    expect(files.map((file) => file.path)).toEqual([
      "docs/40-features/F-001-auth-provider/PLAN.md",
      "docs/40-features/F-001-auth-provider/TASKS.md",
      "docs/40-features/F-001-auth-provider/TEST_PLAN.md",
    ]);
  });

  it("folds acceptance into PLAN and evidence into TASKS", () => {
    const files = generateFeatureFiles({
      featuresDir: "docs/40-features",
      featureId: "F-002",
      featureName: "auth-provider",
      testGate: false,
    });
    const plan = files.find((file) => file.path.endsWith("/PLAN.md"));
    const tasks = files.find((file) => file.path.endsWith("/TASKS.md"));

    expect(plan?.content).toContain("# Plan: Auth Provider");
    expect(plan?.content).toContain("## Acceptance Criteria");
    expect(tasks?.content).toContain("## Completion Evidence");
    expect(tasks?.content).toContain("Tests Run:");
  });

  it("rejects unsafe feature names", () => {
    expect(() =>
      generateFeatureFiles({
        featuresDir: "docs/40-features",
        featureId: "F-001",
        featureName: "../../evil",
        testGate: false,
      }),
    ).toThrow(SlugifyError);
  });
});
