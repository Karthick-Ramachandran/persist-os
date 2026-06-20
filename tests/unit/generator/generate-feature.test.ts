import { describe, expect, it } from "vitest";

import { generateFeatureFiles } from "../../../src/core/generator/generate-feature.js";
import { SlugifyError } from "../../../src/core/naming/slugify.js";

describe("generateFeatureFiles", () => {
  it("generates all required feature docs with deterministic paths", () => {
    const files = generateFeatureFiles({
      featuresDir: "docs/40-features",
      featureId: "F-001",
      featureName: "Auth Provider"
    });

    expect(files.map((file) => file.path)).toEqual([
      "docs/40-features/F-001-auth-provider/PRD.md",
      "docs/40-features/F-001-auth-provider/ACCEPTANCE.md",
      "docs/40-features/F-001-auth-provider/ARCHITECTURE_IMPACT.md",
      "docs/40-features/F-001-auth-provider/CHANGE_REQUESTS.md",
      "docs/40-features/F-001-auth-provider/PLAN.md",
      "docs/40-features/F-001-auth-provider/TASKS.md",
      "docs/40-features/F-001-auth-provider/TEST_PLAN.md",
      "docs/40-features/F-001-auth-provider/REVIEW.md",
      "docs/40-features/F-001-auth-provider/COMPLETION_REPORT.md"
    ]);
  });

  it("creates concise starter memory content", () => {
    const files = generateFeatureFiles({
      featuresDir: "docs/40-features",
      featureId: "F-002",
      featureName: "auth-provider"
    });
    const prd = files.find((file) => file.path.endsWith("/PRD.md"));
    const tasks = files.find((file) => file.path.endsWith("/TASKS.md"));

    expect(prd?.content).toContain("# PRD: Auth Provider");
    expect(tasks?.content).toContain("Do Not:");
    expect(tasks?.content).toContain(
      "Start implementation before PRD, acceptance, architecture impact, and test plan are clear."
    );
  });

  it("rejects unsafe feature names", () => {
    expect(() =>
      generateFeatureFiles({
        featuresDir: "docs/40-features",
        featureId: "F-001",
        featureName: "../../evil"
      })
    ).toThrow(SlugifyError);
  });
});
