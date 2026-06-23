import path from "node:path";

import { ensureRequiredAdrSections } from "../adr/adr-sections.js";
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

This repository uses Persist OS repository memory. Durable memory under \`docs/\` is the source of
truth over chat history; repository rules override model preference. If an instruction conflicts with
repository memory, stop and report it.

## Rules — follow on every change

- Read the Required reading below before non-trivial work.
- Match ceremony to scope — both ways. A genuinely new feature, module, integration, data model, or
  security/architecture decision gets proper planning (PRD/plan/ADR as fit) — do not under-build it.
  A small addition or fix within an already-decided area (a component, helper, endpoint, bug fix)
  just gets implemented with focused tests — no planning docs. Judge by novelty and blast radius, not
  line count: a one-button change inside an existing feature is small; building that feature is not.
- Record substantial work with the persist CLI so the memory actually exists — a new feature →
  \`persist feature create <name>\` (then fill its PRD and acceptance); a real decision (a dependency,
  data model, auth/security choice, API shape) → \`persist adr create <title>\` then
  \`persist adr accept <name>\`. Reasoning left only in the chat is gone next session — if it is not in
  a file, it did not happen.
- Reuse what \`docs/60-engineering/CONVENTIONS.md\` names. Never reinvent a component, helper, client,
  type, or pattern it lists; when you make a new reusable one, add it there.
- When something breaks non-obviously, add a one-line entry to \`docs/60-engineering/LESSONS.md\`.
- Never contradict an accepted ADR in \`docs/adrs/\`. To change one, confirm with a human and run
  \`persist adr supersede <old> <new-title>\` — never overwrite an accepted decision.
- Before claiming work complete, run \`persist doctor\` and fix every error. Never claim "done" without
  test evidence.
- Run the \`persist\` CLI yourself; never ask the human to run it or web-search this project-local tool.

## Required reading

- \`docs/00-product/PRD.md\`
- \`docs/10-architecture/ARCHITECTURE.md\`
- \`docs/20-security/SECURITY_MODEL.md\`
- \`docs/50-quality/QUALITY_GATES.md\`
- \`docs/60-engineering/ENGINEERING_STANDARDS.md\`
- \`docs/60-engineering/CONVENTIONS.md\`
- \`docs/60-engineering/LESSONS.md\`

## Persist commands

- \`persist doctor\` — validate repository memory; run before claiming work complete.
- \`persist feature create <name>\` — scaffold feature memory before non-trivial feature work.
- \`persist adr create <title>\` then \`persist adr accept <name>\` — propose, then accept, a decision.
- \`persist adr supersede <old> <new-title>\` — record a changed decision (never overwrite an accepted ADR).
- \`persist module create <name>\` — scaffold module memory for a new responsibility boundary.
- \`persist mcp add <server>\` — capture an MCP tool's context into memory, offline.

Full reference: \`docs/ai/PERSIST_COMMANDS.md\`.
`,
  },
  {
    path: "CLAUDE.md",
    content: `# {{repositoryName}} Claude Instructions

This file is loaded automatically every Claude session. The durable project memory lives in \`docs/\`;
do not rely on chat history as source of truth, and repository rules override model preference.

@AGENTS.md

Read the docs that \`AGENTS.md\` routes to before changing code or repository memory. A SessionStart
hook (\`.claude/hooks/session-start.sh\`) also injects a memory map at the start of each session.
`,
  },
  {
    // Cursor auto-applies rules under .cursor/rules. alwaysApply makes this the portable equivalent
    // of the Claude Code SessionStart hook: Cursor injects it into every request so the agent loads
    // repository memory even though it cannot run the Claude-specific hook.
    path: ".cursor/rules/persist-memory.mdc",
    content: `---
description: {{repositoryName}} repository memory and rules (Persist OS). Read before non-trivial work.
globs:
alwaysApply: true
---

# {{repositoryName}} repository memory

Durable memory under \`docs/\` is the source of truth over chat history; repository rules override
model preference. If an instruction conflicts with repository memory, stop and report it.

## Rules — follow on every change

- Read \`AGENTS.md\` and the docs it routes to before non-trivial work.
- Match ceremony to scope, both ways: a genuinely new feature, module, integration, data model, or
  security/architecture decision gets proper planning; a small addition or fix within an
  already-decided area just gets implemented with focused tests. Judge by novelty and blast radius,
  not line count — a one-button change inside an existing feature is small; building that feature is
  not.
- Record substantial work with the persist CLI so the memory exists: a new feature →
  \`persist feature create <name>\` (fill its PRD and acceptance); a real decision →
  \`persist adr create <title>\` then \`persist adr accept <name>\`. Reasoning left only in chat is gone
  next session — if it is not in a file, it did not happen.
- Reuse what \`docs/60-engineering/CONVENTIONS.md\` names; never reinvent what it lists, and add a new
  reusable primitive there when you make one.
- When something breaks non-obviously, add a one-line entry to \`docs/60-engineering/LESSONS.md\`.
- Never contradict an accepted ADR in \`docs/adrs/\`. To change one, confirm with a human and run
  \`persist adr supersede <old> <new-title>\`.
- Before claiming work complete, run \`persist doctor\` and fix every error; never claim "done" without
  test evidence.
- Run the \`persist\` CLI yourself (do not web-search this project-local tool); full command reference
  is in \`AGENTS.md\` and \`docs/ai/PERSIST_COMMANDS.md\`.
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

## Status

Draft — fill the prompted sections below with this repository's real model as it grows. \`persist doctor\`
flags these as warnings once the repository has real work (a feature, module, or accepted decision).

## Baseline Rules

- Never commit secrets or credentials, and never read or copy \`.env\` files into docs.
- Validate and authorize untrusted input at every trust boundary.
- Do not add network, telemetry, cloud, MCP runtime, or AI API behavior without explicit review.

## Authentication And Authorization

Describe how this repository authenticates users or clients and how it authorizes actions, including
where those checks live.

## Secrets And Configuration

Describe where secrets live, how they are injected, and how configuration is kept out of version
control.

## Sensitive Data

Describe the sensitive or personal data this repository handles, and how it is protected at rest and
in transit.

## Dependencies And Supply Chain

Describe how third-party dependencies are vetted, pinned, and updated.
`,
  },
  {
    path: "docs/20-security/THREAT_MODEL.md",
    content: `# Threat Model

## Status

Draft — replace the prompts below with this repository's real analysis as it grows. \`persist doctor\`
flags these as warnings once the repository has real work (a feature, module, or accepted decision).

## Assets

Describe what this repository must protect: user data, credentials, money, availability, or
reputation.

## Entry Points

Describe where untrusted input enters: HTTP endpoints, webhooks, file uploads, queues, CLI input, or
third-party callbacks.

## Trust Boundaries

Describe where trust changes: client to server, service to database, your code to third-party APIs.

## Threats

Describe the concrete threats that apply to this repository, by category:

- Spoofing — how identities are faked or sessions stolen.
- Tampering — how requests, data, or builds are altered (injection, mass assignment).
- Repudiation — actions that must remain auditable.
- Information disclosure — how sensitive data or secrets could leak.
- Denial of service — how the system can be overwhelmed or abused.
- Elevation of privilege — how a user could gain access they should not have.

## Mitigations

Describe the control in place or planned for each threat above.

## Open Risks

Describe accepted or unresolved risks and who owns them.
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
    path: "docs/60-engineering/CONVENTIONS.md",
    content: `# Conventions

The canonical, reusable vocabulary for this repository. Agents reference these by name and reuse them
instead of inventing new components, helpers, or patterns. Repository rules override model
preferences.

## Canonical Primitives

Describe the named building blocks this codebase reuses — shared components, utilities, helpers,
clients, types, endpoints — and where each lives, so agents reuse them instead of reinventing.

## Naming Conventions

Describe how things are named here, so generated code matches the existing codebase.

## Rules

List falsifiable do/do-not rules an agent can check itself against. For example: do not hardcode a
value that already has a named primitive; reuse the shared client instead of creating a new one; do
not duplicate a pattern that already exists.

## Anti-Patterns

Describe patterns that look reasonable but are wrong here, and what to do instead.
`,
  },
  {
    path: "docs/60-engineering/LESSONS.md",
    content: `# Lessons

Durable, hard-won lessons for this repository, so agents and humans do not repeat the same mistakes.
Add a lesson when something broke in a non-obvious way, or when a tempting approach turned out to be
wrong. Keep each entry short: what happened, why, and what to do instead. Repository rules override
model preferences.

## Lessons

- (none yet) Record the first lesson when one is learned.
`,
  },
  {
    path: "docs/60-engineering/AI_AGENT_RULES.md",
    content: `# AI Agent Rules

AI agents must follow repository memory over model preference.

If a request conflicts with accepted repository memory or engineering standards, stop and report the conflict.

## Changing an accepted decision

When work would change something an accepted ADR governs:

1. Find the accepted ADR in \`docs/adrs/\` that covers it.
2. If the change contradicts it, stop and confirm with a human before changing the code.
3. Record the new decision with \`persist adr supersede <old> <new-title>\` so the old ADR is marked
   superseded and the reasoning is preserved, instead of silently editing or contradicting it.
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
    path: "docs/ai/PERSIST_COMMANDS.md",
    content: `# Persist OS Commands

This document records the Persist OS commands available to humans and AI agents.

## Completion Gate

Before claiming implementation work is complete, run:

\`\`\`txt
pnpm test:run
pnpm typecheck
persist doctor
\`\`\`

If \`persist doctor\` reports errors, fix them or report why they cannot be fixed. If it reports
warnings, address them or record why they are acceptable.

Package binary behavior is covered by binary integration tests.

## Commands

### \`persist init\`

Initialize neutral repository memory.

Options:

- \`--preset <id>\`: apply optional preset guidance and proposed decisions.
- \`--ai-tools <list>\`: comma-separated AI tools to generate files for (\`claude\`, \`codex\`, \`cursor\`,
  \`generic\`). Default: \`claude,codex,cursor\` (all). \`AGENTS.md\` is always generated. Stored in
  \`.persist/config.json\` as \`aiTools\`.
- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.
- \`--reinit\`: required with \`--force\` to overwrite an existing Persist OS installation
  (a directory that already has \`.persist/config.json\`). Without it, \`--force\` refuses, protecting
  existing repository memory.

Init also generates tracked pre-commit and pre-push hooks at \`.persist/hooks/\` that run \`persist doctor\`
plus any \`preCommitGates\` in \`.persist/config.json\`. The pre-push hook is the final regression gate
before code leaves the machine (it catches commits made with \`--no-verify\` or before the hook was
active). Init proposes, but does not run, the activation command \`git config core.hooksPath .persist/hooks\`.

### \`persist adopt\`

Inspect an existing repository through read-only manifest and marker files, then write a proposed
adoption report and proposed framework ADRs for human review. Adopt never executes repository code
and never produces accepted memory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist skill create <name>\`

Generate a portable AI agent skill as \`SKILL.md\` for both Claude Code (\`.claude/skills/\`) and the
portable Agent Skills target (\`.agents/skills/\`). Known names use the built-in catalog; unknown names
produce a valid skeleton. Generated skills contain no scripts.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist skill list\`

List the built-in catalog skills.

### \`persist mcp add <server>\`

Generate offline, proposed memory for an MCP server (for example \`figma\`) as \`docs/ai/mcp/<server>.md\`
plus a proposed adoption ADR. Persist OS never connects to the MCP server or makes network calls; the
agent records durable MCP-derived context into the generated memory for human review. It also
installs a \`capture-mcp-context\` agent skill that prompts the agent to record that context.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist preset list\`

List built-in presets.

### \`persist feature create <name>\`

Create feature memory docs under the configured features directory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist adr create <title>\`

Create a proposed ADR under the configured ADR directory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist adr accept <name>\`

Promote a proposed ADR to accepted repository memory. A proposal under
\`docs/adrs/proposed/ADR-PROPOSED-<slug>.md\` becomes a numbered, accepted \`ADR-####-<slug>.md\` and the
proposal is removed; an existing numbered Proposed ADR is accepted in place.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist adr supersede <old> <new-title>\`

Record a changed decision. Marks an accepted ADR as \`Accepted — superseded by ADR-####\` and creates a
new accepted ADR that declares what it supersedes, so the reasoning trail stays auditable instead of
being overwritten. Doctor then warns about any memory still referencing the superseded decision.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist module create <name>\`

Create module memory docs under the configured modules directory.

Options:

- \`--dry-run\`: show planned writes without writing files.
- \`--force\`: overwrite existing files explicitly.

### \`persist doctor\`

Check whether repository memory is structurally healthy enough for AI-assisted work, whether basic
engineering evidence is present, and whether memory references decisions that exist and are accepted.

Doctor also runs deterministic drift checks: feature or module memory that references a missing ADR
is an error, memory that references a not-yet-accepted ADR is a warning, and memory that still
references a superseded decision is a warning. Inside a git repository it also flags memory whose
referenced \`src/\` code changed long after the memory did (staleness), and it warns when the
always-loaded agent files grow past a context budget.

Exit codes:

- \`0\`: healthy
- \`1\`: warnings only
- \`2\`: errors

### \`persist guard\`

Fail when staged source changes have no accompanying test changes, so "tests are mandatory for every
change" is enforced rather than hoped for. Deterministic and read-only (a \`git diff\`); it only acts
when told what counts as source, and skips gracefully outside a git repository.

Options:

- \`--source <list>\`: comma-separated source directories to guard, e.g. \`src,app\`.
- \`--base <ref>\`: compare against a git ref instead of the staged index.

Add it to your gates to enforce it in the generated hooks, for example set \`preCommitGates\` in
\`.persist/config.json\` to include \`persist guard --source src\`. Exit code \`1\` blocks the commit/push
when source changed without tests; \`0\` otherwise.
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

Presets and AI agents may propose decisions; humans accept them with \`persist adr accept <name>\`,
which promotes a proposal into an accepted ADR here.
`,
  },
  {
    path: ".github/workflows/persist.yml",
    content: `name: Persist OS

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
        run: npx --yes persist-os@latest doctor
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
      // Normalize every preset's proposed ADR so it stays Doctor-healthy once accepted.
      content: ensureRequiredAdrSections(decision.body),
    })),
  ];
}
