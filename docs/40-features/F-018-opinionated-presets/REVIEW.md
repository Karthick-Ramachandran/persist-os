# Review: Opinionated Presets

## Status

Passed.

## Scope Review

- Adds two presets (`kotlin-android`, `python-fastapi`) and enriches two (`ios-swift`, `nextjs`).
- No schema, engine, config, filesystem, generator, or doctor changes.
- Documents the opinionated-preset content standard in OPINION_PACKS.md.

## Neutrality Review

- Every preset decision uses `status: "proposed"`, enforced structurally by the preset schema and
  asserted in tests.
- Guidance is framed as proposed, not accepted.
- No accepted ADRs, dependency installation, scaffolding, or network behavior.

## Correctness Review

- Each batch preset exposes at least four proposed decisions with unique destinations.
- Existing golden anchors for `ios-swift` and `nextjs` are preserved.
- New golden tests cover `kotlin-android` and `python-fastapi`.

## Dogfooding Review

### Did Recall OS-generated docs help implementation?

Yes. The opinion-pack architecture memory already encoded the non-authority rule, so enrichment was a
content task with a clear neutrality boundary.

### Did the workflow catch any issue?

The preset registry and golden tests caught every assumption: the registry id-list test, the nextjs
guidance wording assertion, and the proposed-status checks all had to be satisfied, which kept the
enrichment honest.

### What should Recall OS improve before public release?

Enrich the remaining stubs (Flutter) and add the deferred stacks (Java/Spring Boot, React Native,
Node/NestJS) under the same content standard. Consider a doctor check that flags preset guidance
which contains an accepted decision.
