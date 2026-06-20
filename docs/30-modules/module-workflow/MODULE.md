# Module: Module Workflow

## Purpose

Module workflow owns the repository-memory process for creating and maintaining module ownership, boundaries, tests, and decisions.

## Owns

- Module folder shape.
- Required module memory docs.
- Relationship between module memory and feature delivery docs.
- Rerun semantics for module memory creation.

## Does Not Own

- CLI parser wiring.
- Filesystem writes.
- Template rendering internals.
- Feature creation.
- ADR creation.
- Doctor checks.

## Public Interface Direction

`specforge module create <name>` creates module memory only.

Feature delivery docs should be created separately with `feature create` when feature work is being planned.

## Current Decision

P8 creates concise starter module memory.

Module substance should be filled in by humans or agents after the structure exists.

Rerunning a module create command for an existing module slug should target the same module folder so write policy controls skip or overwrite behavior.
