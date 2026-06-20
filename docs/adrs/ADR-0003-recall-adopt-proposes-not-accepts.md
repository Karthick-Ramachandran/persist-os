# ADR-0003: Recall Adopt Proposes, Never Accepts

## Status

Accepted

## Context

Most repositories already exist before they meet Recall OS. `recall adopt` inspects an existing
repository and produces memory from what it finds. The risk is that automated inference becomes
accepted repository truth, which would violate the core principle that Recall OS records and protects
decisions but never makes them silently.

## Decision

`recall adopt` performs read-only inspection and emits only **proposed** memory for human review.

- Inspection reads manifest and marker files (for example `package.json`, lockfiles, `pyproject.toml`,
  `go.mod`, `Cargo.toml`, `Package.swift`, `pubspec.yaml`) and the presence of tests and docs.
- It never executes repository code, makes network calls, or installs anything.
- Output is an adoption report and proposed ADRs, all marked `Proposed` and requiring human
  acceptance.
- Writes are non-destructive: existing files are skipped unless `--force`.
- Adopt does not create accepted ADRs, does not overwrite existing repository memory, and does not
  infer decisions the repository does not clearly signal.

## Alternatives Considered

- Generate accepted memory directly from inference. Rejected: it would silently accept decisions the
  product is designed to keep reviewable.
- Execute build tooling to detect richer signals. Rejected: running repository code is a security and
  trust boundary the local-first model forbids.
- Require `recall init` first and only add proposals. Considered acceptable, but adopt should also
  work on a repository with no Recall memory, using default paths when no config is present.

## Consequences

- Adoption output is always a reviewable proposal, never silent truth.
- Humans must accept inferred decisions before they become repository memory.
- Inference stays conservative; weak or ambiguous signals are reported as observations, not
  decisions.
- Adopt reuses the existing safe write pipeline, so path-traversal, symlink, and non-destructive
  guarantees hold.

## Related Documents

- `docs/40-features/F-022-recall-adopt/`
- `docs/00-product/PRODUCT_VISION.md`
- `docs/10-architecture/OPINION_PACKS.md`
