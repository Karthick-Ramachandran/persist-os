# PRD: Opinionated Presets

## Purpose

Built-in presets are currently one-line stubs. They prove the opinion-pack contract but provide
almost no value: the Flutter preset proposes only "use Flutter".

P4 deferred rich framework guidance until real usage proved the contract. The contract is now proven
(presets ship, validate, and stay non-authoritative). This feature makes presets genuinely
opinionated while keeping the neutrality guarantee.

## Problem

- A new repository initialized with a preset gets a labeled empty folder, not stack-aware memory.
- The real value of an opinion pack is naming the architecture decisions a stack forces and the
  conventions teams should consider, as proposals for human review.

## In Scope

- Define an "opinionated preset" content standard in architecture memory.
- Add a new `kotlin-android` preset.
- Add a new `python-fastapi` preset.
- Enrich the existing `ios-swift` and `nextjs` presets.
- Each preset ships rich proposed guidance and several proposed ADRs covering the stack's real
  decision forks.
- Add tests proving the new presets validate and stay proposed.
- Regenerate examples and update docs.

## Non-Goals

- No accepted decisions. Every preset decision stays `Proposed`.
- No changes to the preset schema or the propose-not-accept contract.
- No installation of dependencies, scaffolding of application code, or network behavior.
- No remaining stacks beyond the four in this batch (Java/Spring, React Native, Node/Nest, etc. are
  deferred to follow-up features).

## Users

- Developers starting a repository on a known stack who want stack-aware proposed memory.
- AI agents that benefit from explicit, proposed architecture decisions to respect.
- Maintainers reviewing proposed decisions before accepting them.

## Success Criteria

- `kotlin-android` and `python-fastapi` presets exist, validate, and appear in `recall preset list`.
- `ios-swift` and `nextjs` presets carry rich guidance and multiple proposed ADRs.
- Every preset-generated decision has status `Proposed`.
- Each opinionated preset follows the documented content standard.
- A healthy `recall init --preset <id>` still passes Doctor.
- Existing golden anchors for `ios-swift` and `nextjs` continue to hold.
