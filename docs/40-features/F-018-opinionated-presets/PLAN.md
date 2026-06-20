# Plan: Opinionated Presets

## Approach

Author content within the existing preset contract. No schema or engine change. Document the content
standard so every stack preset has the same shape.

## Content Standard (per opinionated preset)

1. A rich guidance template at `docs/ai/presets/<id>-guidance.md` that:
   - frames everything as proposed, not accepted;
   - names the stack's real decision forks;
   - lists recommended structure, testing, and security considerations.
2. At least four proposed ADRs at `docs/adrs/proposed/ADR-PROPOSED-<id>-<topic>.md`, each with
   Status, Context, Decision, Alternatives, and Consequences, all `Proposed`.
3. `guidance` entries summarizing the same forks for quick reference.

## Steps

1. Document the standard in `docs/10-architecture/OPINION_PACKS.md`.
2. Add `kotlin-android` preset (Compose, coroutines/Flow, DI, Room, MVVM/MVI).
3. Add `python-fastapi` preset (FastAPI, Postgres+SQLAlchemy/Alembic, Pydantic, pytest).
4. Enrich `ios-swift` (SwiftUI/UIKit, concurrency, SwiftData/CoreData, MVVM, XCTest), preserving the
   `ios-swift-platform` decision and the `proposed guidance` anchor.
5. Enrich `nextjs` (App Router, data layer, Tailwind, testing), preserving the `nextjs-framework`
   decision.
6. Register the two new presets.
7. Add tests, regenerate examples, and update README.

## Out Of Scope

- New stacks beyond the four.
- Schema or registry-loading changes.
