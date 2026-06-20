import path from "node:path";

import type { WriteFileInput } from "../filesystem/write-plan.js";
import { slugify } from "../naming/slugify.js";
import { createTemplateContext } from "./template-context.js";
import { renderTemplate } from "./render-template.js";

export type GenerateModuleFilesOptions = {
  modulesDir: string;
  moduleName: string;
};

type ModuleTemplate = {
  fileName: string;
  content: string;
};

const moduleTemplates: ModuleTemplate[] = [
  {
    fileName: "MODULE.md",
    content: `# Module: {{title}}

## Purpose

Describe what this module owns and why it exists.

## Owns

- TBD

## Does Not Own

- TBD

## Public Interfaces

- TBD

## Boundaries

Describe important dependencies, callers, and constraints.
`
  },
  {
    fileName: "TASKS.md",
    content: `# Module Tasks: {{title}}

## Active Work

- TBD

## Tasks

- Todo: Define module responsibilities.
- Todo: Define tests.
- Todo: Update decisions as behavior changes.
`
  },
  {
    fileName: "TEST_PLAN.md",
    content: `# Module Test Plan: {{title}}

## Unit Tests

- TBD

## Integration Tests

- TBD

## Security Tests

- TBD
`
  },
  {
    fileName: "DECISIONS.md",
    content: `# Module Decisions: {{title}}

Record durable module decisions here.

## Current Decisions

- TBD
`
  }
];

export function generateModuleFiles(options: GenerateModuleFilesOptions): WriteFileInput[] {
  const slug = slugify(options.moduleName);
  const moduleDir = path.posix.join(options.modulesDir, slug);
  const title = titleizeModuleName(options.moduleName);
  const context = createTemplateContext({
    slug,
    title
  });

  return moduleTemplates.map((template) => ({
    path: path.posix.join(moduleDir, template.fileName),
    content: renderTemplate(template.content, context)
  }));
}

function titleizeModuleName(moduleName: string): string {
  return moduleName
    .trim()
    .replace(/[-_]+/gu, " ")
    .replace(/\s+/gu, " ")
    .replace(/\b\w/gu, (character) => character.toUpperCase());
}
