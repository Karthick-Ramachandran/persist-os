# Quality Gates

## Purpose

This document defines release readiness as evidence, not confidence.

SpecForge should be judged by whether it helps humans and AI agents build safer software with clearer requirements, better tests, stronger review, and less architecture drift.

## Gate 1: Product Usefulness

Release evidence must show:

- Generated docs are short enough to use and specific enough to guide implementation.
- Root agent files route to source-of-truth docs.
- Feature, ADR, module, test, review, and completion workflows are connected.
- Dogfooding improved SpecForge itself.

## Gate 2: Security Posture

Release evidence must show:

- No network calls in MVP runtime.
- No telemetry.
- No secret collection.
- No `.env` reading.
- Existing files are skipped by default.
- Path traversal and unsafe writes are covered by tests.
- MCP remains guidance-only unless a future ADR changes that.

## Gate 3: Test Quality

Release evidence must show:

- Core logic has unit tests.
- Commands have integration tests.
- Generated output has golden tests.
- Path handling has security tests.
- Test names describe behavior, not implementation trivia.

## Gate 4: Architecture Discipline

Release evidence must show:

- Architecture changes have ADR consideration.
- Module boundaries are documented.
- Dependency additions are reviewed.
- Changed behavior updates PRD, feature docs, or change requests.
- Drift review happens before completion.

## Gate 5: CLI Quality

Release evidence must show:

- CLI output is calm, clear, and actionable.
- Dry run is trustworthy.
- Force behavior is explicit.
- Errors explain what happened and how to fix it.
- `doctor` identifies missing or stale structure.

## Gate 6: Release Readiness

Release evidence must show:

- Lint, typecheck, tests, and build pass.
- npm package contents are reviewed.
- README quickstart works.
- Examples match generated output.
- Remaining risks are documented.

## Scoring

Use this scale during review:

- `0`: missing or unsafe.
- `1`: present but vague or untested.
- `2`: usable with clear gaps.
- `3`: release-ready with evidence.

A public release should not proceed with any `0` in security, file writes, generated output, or CLI behavior.
