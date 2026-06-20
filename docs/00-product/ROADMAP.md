# Roadmap

## Current State

Recall OS has reached the first release-ready foundation.

Completed capabilities:

- Repository memory initialization.
- Optional presets as opinion packs.
- Feature memory creation.
- Proposed ADR creation.
- Module memory creation.
- Structural Doctor checks.
- Doctor standards checks for completion, review, ADR consequence, and security-impact evidence.
- Doctor drift checks for ADR reference integrity in feature and module memory.
- Pre-commit hook generation that enforces Doctor and configured gates at commit time.
- AI command memory.
- Packaged `recall` CLI build.
- README, examples, CI, release-candidate workflow, and package validation.

## Release Foundation

The current release foundation proves:

- Recall OS can create memory.
- Recall OS can validate memory structure.
- Recall OS can run as a packaged CLI.
- Recall OS can dogfood its own feature, module, review, and completion workflow.

## Next Product Priority: Deepen Drift Detection

Doctor now answers:

```txt
Is the memory structure present?
Is the required engineering evidence present when memory claims completion or acceptance?
Does memory reference decisions that do not exist or are not yet accepted?
```

The first deterministic drift checks are implemented (P13): feature and module memory that
references a missing ADR is an error, and memory that references a not-yet-accepted ADR is a
warning.

Drift detection should continue to deepen, staying deterministic and local:

- Module docs disagreeing with feature planning docs.
- Accepted ADRs contradicted by proposed decisions or feature notes.
- Security-sensitive feature changes missing security review notes.

Done in earlier milestones:

- ADR required sections and consequence substance (P9, P12).
- Proposed versus accepted decision references (P13).
- Feature and module docs referencing missing ADRs (P13).
- Completion reports missing test evidence (P12).

## Future Product Sequence

### P11: Product Vision And Roadmap Alignment

Lock the product thesis, future levels, anti-scope, and roadmap into durable product memory.

### P12: Doctor Standards Checks

Extend Doctor from structural checks into deterministic governance checks.

Status: implemented.

Examples:

- Feature folder has completion report but review is still pending.
- Completion report exists without tests run.
- ADR exists without consequences.
- Security-sensitive architecture impact lacks security notes.

### P13: Drift Detection MVP

Add first deterministic drift checks against accepted repository memory.

Status: implemented (ADR reference integrity).

Implemented checks:

- Feature or module memory referencing a missing ADR is an error.
- Feature or module memory referencing a not-yet-accepted ADR is a warning.

Still future work:

- Accepted ADR contradicted by a proposed decision or feature note.
- Module ownership docs disagree with feature planning docs.
- Code-to-doc and dependency drift.

### P14: Legacy Adoption Planning

Define `recall adopt` as a reviewable memory extraction workflow for existing repositories.

Adoption must produce proposed memory, not silently accepted truth.

### P15: Organization Memory Planning

Define organization memory as shared standards, ADRs, architecture guidance, and opinion packs
across repositories.

Organization memory must remain explicit and reviewable.

## Non-Roadmap

Recall OS should not pursue:

- AI coding agent runtime.
- IDE replacement.
- Cloud execution platform.
- Model hosting.
- Automatic architecture selection.
- Production app generation.

Those areas distract from the durable category: engineering memory, quality gates, governance, and
drift detection.
