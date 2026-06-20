# Acceptance Criteria: Opinionated Presets

## New presets

- `recall preset list` includes `kotlin-android` and `python-fastapi`.
- `recall init --preset kotlin-android` writes Kotlin guidance and proposed ADRs under
  `docs/adrs/proposed/`.
- `recall init --preset python-fastapi` writes FastAPI guidance and proposed ADRs under
  `docs/adrs/proposed/`.

## Opinionated content

- Each of the four batch presets exposes at least four proposed decisions.
- Each proposed decision has status `Proposed` and a unique destination.
- Each preset guidance template names the stack's real decision forks (for example UI framework,
  concurrency, persistence, dependency injection or data layer, testing).

## Neutrality

- No preset emits a decision with status other than `Proposed` (enforced by the preset schema).
- Preset guidance is framed as proposed, not accepted.

## Regression

- The `ios-swift` golden test still finds `proposed guidance` and the
  `ADR-PROPOSED-ios-swift-platform.md` decision with `## Status\n\nProposed`.
- The `nextjs` golden test still finds its guidance and `ADR-PROPOSED-nextjs-framework.md`.
- All built-in presets validate through the registry.
- The full test suite passes.
