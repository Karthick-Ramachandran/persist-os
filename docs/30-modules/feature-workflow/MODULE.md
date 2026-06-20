# Module: Feature Workflow

## Purpose

Feature workflow owns the repository-memory process for planning and completing feature work.

## Owns

- Feature folder shape.
- Required feature docs.
- Relationship between PRD, acceptance, architecture impact, test plan, tasks, review, and completion evidence.
- Rerun semantics for feature memory creation.

## Does Not Own

- CLI parser wiring.
- Filesystem writes.
- Feature number scanning.
- Template rendering internals.
- ADR creation.
- Module creation.
- Doctor checks.

## Public Interface Direction

`specforge feature create <name>` creates feature memory before implementation work begins.

## Current Decision

P6 creates concise starter feature docs.

Feature substance should be filled in by humans or agents after the structure exists.

Rerunning a feature create command for an existing slug should target the existing feature folder so write policy controls skip or overwrite behavior.
