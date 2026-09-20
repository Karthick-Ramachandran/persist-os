import path from "node:path";

import type { WriteFileInput } from "../filesystem/write-plan.js";
import { slugify } from "../naming/slugify.js";
import { createTemplateContext } from "./template-context.js";
import { renderTemplate } from "./render-template.js";

export type GenerateFeatureFilesOptions = {
  featuresDir: string;
  featureId: string;
  featureName: string;
  /** Include TEST_PLAN.md. True only when the test gate is enabled — the scaffold never
   * outruns the gate that enforces it. */
  testGate: boolean;
};

type FeatureTemplate = {
  fileName: string;
  content: string;
};

/**
 * Minimal feature scaffold (ADR-0007): PLAN.md and TASKS.md, with acceptance criteria folded
 * into PLAN and completion evidence folded into TASKS. TEST_PLAN.md exists only when the test
 * gate is enabled.
 */
const featureTemplates: FeatureTemplate[] = [
  {
    fileName: "PLAN.md",
    content: `# Plan: {{title}}

## Approach

TBD

## Boundaries

TBD

## Acceptance Criteria

- TBD
`,
  },
  {
    fileName: "TASKS.md",
    content: `# Tasks: {{title}}

## T1: Define Scope

Status: Todo

Scope:

- TBD

Acceptance:

- TBD

Tests:

- TBD

## Completion Evidence

Status: Pending.

Files Changed:

- TBD

Tests Run:

- TBD

Results:

- TBD

Remaining Risks:

- TBD
`,
  },
];

const testPlanTemplate: FeatureTemplate = {
  fileName: "TEST_PLAN.md",
  content: `# Test Plan: {{title}}

## Unit Tests

- TBD

## Integration Tests

- TBD

## Security Tests

- TBD
`,
};

export function generateFeatureFiles(options: GenerateFeatureFilesOptions): WriteFileInput[] {
  const slug = slugify(options.featureName);
  const featureDir = path.posix.join(options.featuresDir, `${options.featureId}-${slug}`);
  const title = titleizeFeatureName(options.featureName);
  const context = createTemplateContext({
    featureId: options.featureId,
    slug,
    title,
  });
  const templates = options.testGate ? [...featureTemplates, testPlanTemplate] : featureTemplates;

  return templates.map((template) => ({
    path: path.posix.join(featureDir, template.fileName),
    content: renderTemplate(template.content, context),
  }));
}

function titleizeFeatureName(featureName: string): string {
  return featureName
    .trim()
    .replace(/[-_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}
