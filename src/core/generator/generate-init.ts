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

This repository uses Recall OS repository memory.

Start with durable source-of-truth docs under \`docs/\`.

Required reading:

- \`docs/00-product/PRD.md\`
- \`docs/10-architecture/ARCHITECTURE.md\`
- \`docs/20-security/SECURITY_MODEL.md\`
- \`docs/50-quality/QUALITY_GATES.md\`
- \`docs/60-engineering/ENGINEERING_STANDARDS.md\`

Repository rules override model preferences. If instructions conflict, stop and report the conflict.
`,
  },
  {
    path: "CLAUDE.md",
    content: `# {{repositoryName}} Claude Instructions

Use this file as a short routing guide.

The durable project memory lives in \`docs/\`. Do not rely on chat history as source of truth.

Read \`AGENTS.md\` and the relevant docs before changing code or repository memory.
`,
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
`,
  },
  {
    path: "docs/00-product/BRD.md",
    content: `# BRD: {{repositoryName}}

## Purpose

Describe the business goal, target users, and success criteria for this repository.

## Current Status

Draft.
`,
  },
  {
    path: "docs/10-architecture/ARCHITECTURE.md",
    content: `# Architecture

## Purpose

Describe the accepted architecture for this repository.

## Current Status

No architecture decisions are accepted yet.

Use ADRs to accept architecture choices.
`,
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
`,
  },
  {
    path: "docs/10-architecture/FILE_WRITE_POLICY.md",
    content: `# File Write Policy

Default behavior:

- Skip existing files.
- Use dry run before risky writes.
- Require explicit force to overwrite.
- Never write outside the repository root.
`,
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
`,
  },
  {
    path: "docs/20-security/THREAT_MODEL.md",
    content: `# Threat Model

## Current Status

Draft.

Track repository-specific risks here as the project evolves.
`,
  },
  {
    path: "docs/50-quality/TESTING_STRATEGY.md",
    content: `# Testing Strategy

Tests should derive from acceptance criteria, risk, security invariants, and module boundaries.

Document required unit, integration, security, and golden tests as the repository grows.
`,
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
`,
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
`,
  },
  {
    path: "docs/60-engineering/AI_AGENT_RULES.md",
    content: `# AI Agent Rules

AI agents must follow repository memory over model preference.

If a request conflicts with accepted repository memory or engineering standards, stop and report the conflict.
`,
  },
  {
    path: "docs/ai/AI_AGENTS_SKILLS_MCP_STRATEGY.md",
    content: `# AI Agents, Skills, And MCP Strategy

Root agent files are entry points, not guarantees.

Durable memory lives in \`docs/\`.

MCP is optional external context and does not override accepted repository memory.
`,
  },
  {
    path: "docs/ai/MCP_STRATEGY.md",
    content: `# MCP Strategy

MCP is not required for this repository.

If MCP is introduced later, document trusted servers, data accessed, permissions, risks, and source-of-truth rules.
`,
  },
  {
    path: "docs/ai/RECALL_COMMANDS.md",
    content: `# Recall OS Commands

This document records the Recall OS commands available to humans and AI agents.

## Completion Gate

Before claiming implementation work is complete, run:

\`\`\`txt
pnpm test:run
pnpm typecheck
recall doctor
\`\`\`

If \`recall doctor\` reports errors, fix them or report why they cannot be fixed. If it reports
warnings, address them or record why they are acceptable.

Package binary behavior is covered by binary integration tests.

## Commands

### \`recall init\`

Initialize neutral repository memory.

Options:

- \`--preset <id>\`: apply optional preset guidance and proposed decisions.
- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.
- \`--reinit\`: required with \`--force\` to overwrite an existing Recall OS installation
  (a directory that already has \`.recall/config.json\`). Without it, \`--force\` refuses, protecting
  existing repository memory.

Init also generates a tracked pre-commit hook at \`.recall/hooks/pre-commit\` that runs \`recall doctor\`
plus any \`preCommitGates\` in \`.recall/config.json\`. Init proposes, but does not run, the activation
command \`git config core.hooksPath .recall/hooks\`.

### \`recall adopt\`

Inspect an existing repository through read-only manifest and marker files, then write a proposed
adoption report and proposed framework ADRs for human review. Adopt never executes repository code
and never produces accepted memory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`recall skill create <name>\`

Generate a portable AI agent skill as \`SKILL.md\` for both Claude Code (\`.claude/skills/\`) and the
portable Agent Skills target (\`.agents/skills/\`). Known names use the built-in catalog; unknown names
produce a valid skeleton. Generated skills contain no scripts.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`recall skill list\`

List the built-in catalog skills.

### \`recall mcp add <server>\`

Generate offline, proposed memory for an MCP server (for example \`figma\`) as \`docs/ai/mcp/<server>.md\`
plus a proposed adoption ADR. Recall OS never connects to the MCP server or makes network calls; the
agent records durable MCP-derived context into the generated memory for human review. It also
installs a \`capture-mcp-context\` agent skill that prompts the agent to record that context.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`recall preset list\`

List built-in presets.

### \`recall feature create <name>\`

Create feature memory docs under the configured features directory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`recall adr create <title>\`

Create a proposed ADR under the configured ADR directory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`recall adr accept <name>\`

Promote a proposed ADR to accepted repository memory. A proposal under
\`docs/adrs/proposed/ADR-PROPOSED-<slug>.md\` becomes a numbered, accepted \`ADR-####-<slug>.md\` and the
proposal is removed; an existing numbered Proposed ADR is accepted in place.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`recall module create <name>\`

Create module memory docs under the configured modules directory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`recall doctor\`

Check whether repository memory is structurally healthy enough for AI-assisted work, whether basic
engineering evidence is present, and whether memory references decisions that exist and are accepted.

Doctor also runs deterministic drift checks: feature or module memory that references a missing ADR
is an error, and memory that references a not-yet-accepted ADR is a warning.

Exit codes:

- \`0\`: healthy
- \`1\`: warnings only
- \`2\`: errors
`,
  },
  {
    path: "docs/30-modules/README.md",
    content: `# Module Memory

Module memory records what each important module owns, how it should be tested, and which decisions affect it.

Future module folders should use:

\`\`\`txt
docs/30-modules/<module>/
  MODULE.md
  TASKS.md
  TEST_PLAN.md
  DECISIONS.md
\`\`\`

Agents should update module memory when implementation changes responsibilities, boundaries, tests, risks, or decisions.
`,
  },
  {
    path: "docs/40-features/README.md",
    content: `# Feature Memory

Feature memory records requirements, acceptance criteria, plans, tests, reviews, and completion evidence.

Future feature folders should use:

\`\`\`txt
docs/40-features/F-###-<feature>/
  PRD.md
  ACCEPTANCE.md
  ARCHITECTURE_IMPACT.md
  CHANGE_REQUESTS.md
  PLAN.md
  TASKS.md
  TEST_PLAN.md
  REVIEW.md
  COMPLETION_REPORT.md
\`\`\`

Agents should not implement meaningful feature work without a feature plan or clear source-of-truth reference.
`,
  },
  {
    path: "docs/adrs/README.md",
    content: `# Architecture Decision Records

Accepted ADRs live in this directory as \`ADR-####-<slug>.md\` with \`## Status\` set to \`Accepted\`.
Proposed ADRs live under \`docs/adrs/proposed/\`.

There is no \`accepted/\` subdirectory: accepted ADRs sit at the top level of \`docs/adrs/\`.

Presets and AI agents may propose decisions; humans accept them with \`recall adr accept <name>\`,
which promotes a proposal into an accepted ADR here.
`,
  },
  {
    path: ".github/workflows/recall.yml",
    content: `name: Recall OS

on:
  push:
  pull_request:

jobs:
  doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Validate repository memory
        run: npx --yes recall-os@latest doctor
`,
  },
];

export function generateInitFiles(options: GenerateInitFilesOptions): WriteFileInput[] {
  const repositoryName = path.basename(path.resolve(options.rootDir)) || "repository";
  const context = createTemplateContext({ repositoryName });
  const files = neutralTemplates.map((template) => ({
    path: template.path,
    content: renderTemplate(template.content, context),
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
      content: template.content,
    })),
    ...preset.proposedDecisions.map((decision) => ({
      path: decision.destination,
      content: decision.body,
    })),
  ];
}
