import path from "node:path";

import type { WriteFileInput } from "../filesystem/write-plan.js";
import { slugify } from "../naming/slugify.js";
import { createTemplateContext } from "./template-context.js";
import { renderTemplate } from "./render-template.js";

export type GenerateFeatureFilesOptions = {
  featuresDir: string;
  featureId: string;
  featureName: string;
};

type FeatureTemplate = {
  fileName: string;
  content: string;
};

const featureTemplates: FeatureTemplate[] = [
  {
    fileName: "PRD.md",
    content: `# PRD: {{title}}

## Purpose

Describe why this feature exists and what user or business problem it solves.

## In Scope

- TBD

## Non-Goals

- TBD
`
  },
  {
    fileName: "ACCEPTANCE.md",
    content: `# Acceptance Criteria: {{title}}

## Criteria

- TBD

## Out Of Scope

- TBD
`
  },
  {
    fileName: "ARCHITECTURE_IMPACT.md",
    content: `# Architecture Impact: {{title}}

## Affected Modules

- TBD

## ADR Impact

State whether this feature needs a new or updated ADR.

## Security Impact

State whether auth, secrets, storage, networking, telemetry, file writes, or dependencies change.
`
  },
  {
    fileName: "CHANGE_REQUESTS.md",
    content: `# Change Requests: {{title}}

Record accepted changes to the feature requirements here.
`
  },
  {
    fileName: "PLAN.md",
    content: `# Plan: {{title}}

## Approach

TBD

## Boundaries

TBD
`
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

Do Not:

- Start implementation before PRD, acceptance, architecture impact, and test plan are clear.
`
  },
  {
    fileName: "TEST_PLAN.md",
    content: `# Test Plan: {{title}}

## Unit Tests

- TBD

## Integration Tests

- TBD

## Security Tests

- TBD
`
  },
  {
    fileName: "REVIEW.md",
    content: `# Review: {{title}}

## Status

Pending review.

## Findings

- TBD
`
  },
  {
    fileName: "COMPLETION_REPORT.md",
    content: `# Completion Report: {{title}}

## Status

Pending.

## Files Changed

- TBD

## Tests Run

- TBD

## Results

- TBD

## Remaining Risks

- TBD
`
  }
];

export function generateFeatureFiles(options: GenerateFeatureFilesOptions): WriteFileInput[] {
  const slug = slugify(options.featureName);
  const featureDir = path.posix.join(options.featuresDir, `${options.featureId}-${slug}`);
  const title = titleizeFeatureName(options.featureName);
  const context = createTemplateContext({
    featureId: options.featureId,
    slug,
    title
  });

  return featureTemplates.map((template) => ({
    path: path.posix.join(featureDir, template.fileName),
    content: renderTemplate(template.content, context)
  }));
}

function titleizeFeatureName(featureName: string): string {
  return featureName
    .trim()
    .replace(/[-_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}
