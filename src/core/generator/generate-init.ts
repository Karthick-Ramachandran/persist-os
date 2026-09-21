import path from "node:path";

import type { WriteFileInput } from "../filesystem/write-plan.js";
import { createTemplateContext } from "./template-context.js";
import { renderTemplate } from "./render-template.js";

export type GenerateInitFilesOptions = {
  rootDir: string;
};

export type GenerateOptInFilesOptions = {
  featuresDir: string;
  modulesDir: string;
  features: boolean;
  modules: boolean;
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

- Every task, kept short:
  1. Start from what Persist hands you: the "Start here" block in the prompt, or run
     \`persist context "<task>"\` (\`npx persist-os context "<task>"\` when \`persist\` is not
     installed). Open those files and what the task itself needs; do not survey the repository.
  2. Each "Follow ADR-…" line is a rule for this change. Keep to it; if the task needs to break it,
     stop and ask.
  3. Implement with focused tests.
  4. Before calling it done, check your changed lines against each governing decision
     (\`persist doctor\` names them), then run the tests and doctor.
  5. Add the task to the area card's Answers list, phrased the way it was asked.
- Read the Required reading below only when no card covers the area or the work is new ground: a new
  feature, module, data model, or security decision.
- Match ceremony to scope — both ways. A genuinely new feature, module, integration, data model, or
  security/architecture decision gets proper planning (PRD/plan/ADR as fit) — do not under-build it.
  A small addition or fix within an already-decided area (a component, helper, endpoint, bug fix)
  just gets implemented with focused tests — no planning docs. Judge by novelty and blast radius, not
  line count: a one-button change inside an existing feature is small; building that feature is not.
- Record substantial work with the persist CLI so the memory actually exists — a new feature →
  \`persist feature create <name>\` (then fill its plan); a real decision (a dependency,
  data model, auth/security choice, API shape) → \`persist adr create <title>\` then
  \`persist adr accept <name>\`. Reasoning left only in the chat is gone next session — if it is not in
  a file, it did not happen.
- Reuse what \`docs/60-engineering/CONVENTIONS.md\` names. Never reinvent a component, helper, client,
  type, or pattern it lists; when you make a new reusable one, add it there.
- When something breaks non-obviously, add a one-line entry to \`docs/60-engineering/LESSONS.md\`.
- Never contradict an accepted ADR in \`docs/adrs/\`. To change one, confirm with a human and run
  \`persist adr supersede <old> <new-title>\` — never overwrite an accepted decision.
- A conflict with an accepted ADR means stop: fix the code, or ask a human and supersede the ADR.
  Never diverge quietly. Run the adr-compliance skill in full when the diff is large, touches several
  decisions, or touches money, auth, or the data model; otherwise step 4's quick check is enough.
- Work is done only when \`persist doctor\` reports PASSED and the tests pass. Fix every error; fix
  each warning, or name it and say why it stays. Never claim "done" without that evidence.
- Run the \`persist\` CLI yourself; never ask the human to run it or web-search this project-local tool.
  If \`persist\` is not installed, run the same commands as \`npx persist-os <command>\`.

## Required reading

- \`docs/00-product/PRODUCT.md\`
- \`docs/20-security/SECURITY_MODEL.md\`
- \`docs/50-quality/QUALITY_GATES.md\`
- \`docs/60-engineering/ENGINEERING_STANDARDS.md\`
- \`docs/60-engineering/CONVENTIONS.md\`
- \`docs/60-engineering/LESSONS.md\`

## Persist commands

- \`persist doctor\` — validate repository memory; work is done only when it reports PASSED.
- \`persist feature create <name>\` — scaffold feature memory before non-trivial feature work.
- \`persist adr create <title>\` then \`persist adr accept <name>\` — propose, then accept, a decision.
- \`persist adr supersede <old> <new-title>\` — record a changed decision (never overwrite an accepted ADR).
- \`persist module create <name>\` — scaffold module memory for a new responsibility boundary.
- \`persist mcp add <server>\` — capture an MCP tool's context into memory, offline.
`,
  },
  {
    // Only the import. Claude loads this file every session, so anything else here is paid for
    // every time: AGENTS.md already carries the rules, and the SessionStart hook the memory map.
    // It is only written when no CLAUDE.md exists, so the import is always present when it is.
    path: "CLAUDE.md",
    content: `@AGENTS.md
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

- Every task, kept short: start from the "Start here" pointers (run \`persist context "<task>"\`, or
  \`npx persist-os context "<task>"\`) and open only those files and what the task needs; treat each
  "Follow ADR-…" line as a rule for this change; implement with focused tests; before calling it
  done, check your changed lines against each governing decision (\`persist doctor\` names them) and
  run the tests and doctor; then add the task to the area card's Answers list, as it was asked.
- Read \`AGENTS.md\` and the docs it routes to only when no card covers the area or the work is new
  ground.
- Match ceremony to scope, both ways: a genuinely new feature, module, integration, data model, or
  security/architecture decision gets proper planning; a small addition or fix within an
  already-decided area just gets implemented with focused tests. Judge by novelty and blast radius,
  not line count — a one-button change inside an existing feature is small; building that feature is
  not.
- Record substantial work with the persist CLI so the memory exists: a new feature →
  \`persist feature create <name>\` (fill its plan); a real decision →
  \`persist adr create <title>\` then \`persist adr accept <name>\`. Reasoning left only in chat is gone
  next session — if it is not in a file, it did not happen.
- Reuse what \`docs/60-engineering/CONVENTIONS.md\` names; never reinvent what it lists, and add a new
  reusable primitive there when you make one.
- When something breaks non-obviously, add a one-line entry to \`docs/60-engineering/LESSONS.md\`.
- Never contradict an accepted ADR in \`docs/adrs/\`. To change one, confirm with a human and run
  \`persist adr supersede <old> <new-title>\`.
- A conflict with an accepted ADR means stop: fix the code, or ask a human and supersede the ADR.
  Never diverge quietly. For a large diff, several decisions, or money, auth, or data-model code,
  run the full adr-compliance review.
- Work is done only when \`persist doctor\` reports PASSED and the tests pass. Fix every error; fix
  each warning, or name it and say why it stays. Never claim "done" without that evidence.
- Run the \`persist\` CLI yourself (do not web-search this project-local tool); if it is not installed,
  use \`npx persist-os <command>\`. The full command reference is in \`AGENTS.md\`.
`,
  },
  {
    path: "docs/00-product/PRODUCT.md",
    content: `# Product: {{repositoryName}}

## Purpose

Describe what this repository is building and why.

## Users

Describe who this is for and what success looks like for them.

## Non-Goals

Describe what this repository deliberately does not do.

## Current Status

Draft.

Keep product intent durable here. Do not rely on chat history as source of truth.
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
    path: "docs/adrs/README.md",
    content: `# Architecture Decision Records

Accepted ADRs live in this directory as \`ADR-####-<slug>.md\` with \`## Status\` set to \`Accepted\`.
Proposed ADRs live under \`docs/adrs/proposed/\`.

There is no \`accepted/\` subdirectory: accepted ADRs sit at the top level of \`docs/adrs/\`.

AI agents may propose decisions; humans accept them with \`persist adr accept <name>\`,
which promotes a proposal into an accepted ADR here.
`,
  },
  {
    path: ".github/workflows/persist.yml",
    content: `name: Persist OS

# Run once per change: on pull requests, and on pushes to the default branch.
# This avoids Doctor running twice for the same PR (branch push + pull_request event).
on:
  push:
    branches: [main]
  pull_request:

jobs:
  doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          # Full history: doctor's staleness check compares doc vs code commit times,
          # which is unmeasurable in a shallow clone.
          fetch-depth: 0
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

  return neutralTemplates.map((template) => ({
    path: template.path,
    content: renderTemplate(template.content, context),
  }));
}

/**
 * Opt-in workflow scaffolding, generated only when the user asks for it
 * (`persist init --features` / `--modules`). The default init writes neither.
 */
export function generateOptInFiles(options: GenerateOptInFilesOptions): WriteFileInput[] {
  const files: WriteFileInput[] = [];

  if (options.features) {
    files.push({
      path: path.posix.join(options.featuresDir, "README.md"),
      content: `# Feature Memory

Feature memory records the plan, tasks, and test evidence for meaningful feature work.

Future feature folders should use:

\`\`\`txt
${options.featuresDir}/F-###-<feature>/
  PLAN.md            (approach, boundaries, acceptance criteria)
  TASKS.md           (tasks, completion evidence)
  TEST_PLAN.md       (only when the test gate is enabled)
\`\`\`

Agents should not implement meaningful feature work without a feature plan or clear source-of-truth reference.
`,
    });
  }

  if (options.modules) {
    files.push({
      path: path.posix.join(options.modulesDir, "README.md"),
      content: `# Module Memory

Module memory records what each important module owns, how it should be tested, and which decisions affect it.

Future module folders should use:

\`\`\`txt
${options.modulesDir}/<module>/
  MODULE.md
  TASKS.md
  TEST_PLAN.md
  DECISIONS.md
\`\`\`

Agents should update module memory when implementation changes responsibilities, boundaries, tests, risks, or decisions.
`,
    });
  }

  return files;
}
