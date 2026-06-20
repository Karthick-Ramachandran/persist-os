import path from "node:path";

import type { WriteFileInput } from "../filesystem/write-plan.js";
import type { Preset } from "../presets/preset-schema.js";
import { createTemplateContext } from "./template-context.js";
import { renderTemplate } from "./render-template.js";

export type GenerateInitFilesOptions = {
  rootDir: string;
  preset?: Preset | null;
};

type InitTemplate = {
  path: string;
  content: string;
};

const neutralTemplates: InitTemplate[] = [
  {
    path: "AGENTS.md",
    content: `# {{repositoryName}} Agent Instructions

This repository uses SpecForge repository memory.

Start with durable source-of-truth docs under \`docs/\`.

Required reading:

- \`docs/00-product/PRD.md\`
- \`docs/10-architecture/ARCHITECTURE.md\`
- \`docs/20-security/SECURITY_MODEL.md\`
- \`docs/50-quality/QUALITY_GATES.md\`
- \`docs/60-engineering/ENGINEERING_STANDARDS.md\`

Repository rules override model preferences. If instructions conflict, stop and report the conflict.
`
  },
  {
    path: "CLAUDE.md",
    content: `# {{repositoryName}} Claude Instructions

Use this file as a short routing guide.

The durable project memory lives in \`docs/\`. Do not rely on chat history as source of truth.

Read \`AGENTS.md\` and the relevant docs before changing code or repository memory.
`
  },
  {
    path: "docs/00-product/PRD.md",
    content: `# PRD: {{repositoryName}}

## Purpose

Describe what this repository is building and why.

## Current Status

Draft.

## Notes

Keep product intent durable here. Do not rely on chat history as source of truth.
`
  },
  {
    path: "docs/00-product/BRD.md",
    content: `# BRD: {{repositoryName}}

## Purpose

Describe the business goal, target users, and success criteria for this repository.

## Current Status

Draft.
`
  },
  {
    path: "docs/10-architecture/ARCHITECTURE.md",
    content: `# Architecture

## Purpose

Describe the accepted architecture for this repository.

## Current Status

No architecture decisions are accepted yet.

Use ADRs to accept architecture choices.
`
  },
  {
    path: "docs/10-architecture/MEMORY_ENGINE.md",
    content: `# Repository Memory

Repository memory is the durable source of truth for humans and AI agents.

Source-of-truth order:

1. Accepted ADRs and repository decisions
2. Architecture docs
3. Engineering standards
4. Current PRD and accepted change requests
5. Security and testing docs
6. Module docs
7. Feature plans
8. Task files
9. External context
10. Chat history
`
  },
  {
    path: "docs/10-architecture/FILE_WRITE_POLICY.md",
    content: `# File Write Policy

Default behavior:

- Skip existing files.
- Use dry run before risky writes.
- Require explicit force to overwrite.
- Never write outside the repository root.
`
  },
  {
    path: "docs/20-security/SECURITY_MODEL.md",
    content: `# Security Model

## Current Status

Draft.

## Baseline Rules

- Do not commit secrets.
- Do not read or copy \`.env\` files into docs.
- Do not add network, telemetry, cloud, MCP runtime, or AI API behavior without explicit review.
`
  },
  {
    path: "docs/20-security/THREAT_MODEL.md",
    content: `# Threat Model

## Current Status

Draft.

Track repository-specific risks here as the project evolves.
`
  },
  {
    path: "docs/50-quality/TESTING_STRATEGY.md",
    content: `# Testing Strategy

Tests should derive from acceptance criteria, risk, security invariants, and module boundaries.

Document required unit, integration, security, and golden tests as the repository grows.
`
  },
  {
    path: "docs/50-quality/QUALITY_GATES.md",
    content: `# Quality Gates

Do not claim completion without evidence.

Completion evidence should include:

- Files changed.
- Tests run.
- Results.
- Skipped checks.
- Remaining risks.
`
  },
  {
    path: "docs/60-engineering/ENGINEERING_STANDARDS.md",
    content: `# Engineering Standards

Repository rules override model preferences.

Baseline rules:

- Never commit secrets.
- Keep changes scoped.
- Update docs when behavior or architecture changes.
- Add tests or document why tests were skipped.
- Do not claim completion without evidence.
`
  },
  {
    path: "docs/60-engineering/AI_AGENT_RULES.md",
    content: `# AI Agent Rules

AI agents must follow repository memory over model preference.

If a request conflicts with accepted repository memory or engineering standards, stop and report the conflict.
`
  },
  {
    path: "docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md",
    content: `# AI Agents, Skills, And MCP Strategy

Root agent files are entry points, not guarantees.

Durable memory lives in \`docs/\`.

MCP is optional external context and does not override accepted repository memory.
`
  },
  {
    path: "docs/ai/MCP_STRATEGY.md",
    content: `# MCP Strategy

MCP is not required for this repository.

If MCP is introduced later, document trusted servers, data accessed, permissions, risks, and source-of-truth rules.
`
  },
  {
    path: "docs/adrs/README.md",
    content: `# Architecture Decision Records

Accepted architecture choices belong here.

Presets and AI agents may propose decisions, but humans accept them.
`
  }
];

export function generateInitFiles(options: GenerateInitFilesOptions): WriteFileInput[] {
  const repositoryName = path.basename(path.resolve(options.rootDir)) || "repository";
  const context = createTemplateContext({ repositoryName });
  const files = neutralTemplates.map((template) => ({
    path: template.path,
    content: renderTemplate(template.content, context)
  }));

  if (options.preset !== undefined && options.preset !== null) {
    files.push(...generatePresetFiles(options.preset));
  }

  return files;
}

function generatePresetFiles(preset: Preset): WriteFileInput[] {
  return [
    ...preset.templates.map((template) => ({
      path: template.destination,
      content: template.content
    })),
    ...preset.proposedDecisions.map((decision) => ({
      path: decision.destination,
      content: decision.body
    }))
  ];
}
