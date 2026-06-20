# Module Delivery Workflow

## Purpose

Module work should be handled like a mini product inside the repository, not as a request to immediately write files.

When a user says:

```txt
Build the preset module for SpecForge.
```

The agent must first create or update the feature delivery docs and module memory.

## Required Flow

```txt
Module request
-> Module brief
-> User stories / use cases
-> Acceptance criteria
-> Architecture impact
-> Test plan
-> Task breakdown
-> Build one task at a time
-> Completion report
-> Drift review
-> Module memory update
```

## Required Feature Docs

For a module request, create a feature folder:

```txt
docs/40-features/F-###-<module>-module/
  PRD.md
  ACCEPTANCE.md
  ARCHITECTURE_IMPACT.md
  PLAN.md
  TASKS.md
  TEST_PLAN.md
  REVIEW.md
  COMPLETION_REPORT.md
```

Use the feature docs to define why the module exists, how it behaves, how it is tested, and how work is executed.

## Required Module Memory

Also create module memory:

```txt
docs/30-modules/<module>/
  MODULE.md
  TASKS.md
  TEST_PLAN.md
  DECISIONS.md
```

Use module memory to preserve ownership, public interfaces, boundaries, tests, and durable decisions for future agents.

## Planning Questions

Before implementation, answer:

- What does this module own?
- What does it not own?
- What public interfaces does it expose?
- What should users or CLI commands be able to do?
- What edge cases matter?
- What security boundaries apply?
- Does this affect config, templates, docs, presets, or file writes?
- Does this need an ADR?

## Acceptance Criteria

Acceptance criteria must be behavior-level and testable.

Example for a preset module:

- Built-in presets validate.
- Duplicate template destinations are rejected.
- Unsafe output paths are rejected.
- Preset-generated architecture choices are proposed decisions or optional guidance.
- Preset list can read from the registry.

## Test Plan

Test plans must be risk-based.

Example for a preset module:

- Unit tests for preset schema validation.
- Unit tests for invalid presets.
- Integration tests for preset list command behavior.
- Security tests proving presets cannot write outside the project root.
- Golden tests proving generated output matches expected files.

## Task Breakdown

Tasks must come after PRD, acceptance criteria, architecture impact, and test plan.

Example:

```txt
T1: Define preset schema
T2: Add preset registry
T3: Add validation
T4: Add built-in generic preset
T5: Add tests
T6: Update docs
T7: Review drift
```

Each task should include:

- Status.
- Scope.
- Acceptance.
- Tests.
- Do-not-do boundaries.

## Execution Rule

Build one task at a time.

Do not start the next task until the current task has completion evidence.

## Completion Report

After each task, write evidence:

- Task completed.
- Files changed.
- Tests run.
- Results.
- Remaining risks.
- Docs updated.

## Hierarchy

```txt
PRD = why and what
Acceptance = how we know it works
Architecture Impact = what it changes
Test Plan = how we prove it
Tasks = how we execute it
Completion Report = what actually happened
Module Memory = what future agents need to remember
```
