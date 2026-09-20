# Adopt Decisions

## ADR-0003: Propose, Never Accept

Adopt produces only proposed memory. Inferred decisions require human acceptance before they become
repository truth.

## Read-Only Inspection

Inspection reads manifest and marker files only. It never executes repository code, makes network
calls, or installs dependencies.

## Conservative Inference

Only clear manifest and marker signals are inferred. Weak or ambiguous signals are reported as
observations, not decisions.

## Config Optional

Adopt works with or without an existing Persist config, using default paths when none is present.

## Dev-Only Dependencies Never Signal Frameworks

`package.json` reads runtime `dependencies` only. Cargo skips `[dev-dependencies]`,
`composer.json` matches the `require` table (raw-text fallback when unparseable), Gemfiles skip
`group :development` / `:test` blocks by pattern (honest ceiling — inline `group:` options and
nested blocks are documented misses), and pyproject skips Poetry dev groups and extras.
`requirements-dev.txt` is never read. Test detection still uses the full text, so pytest in a
dev table counts as tests. Every signal stays proposed.
