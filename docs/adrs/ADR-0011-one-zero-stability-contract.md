# ADR-0011: One Zero Stability Contract

## Status

Accepted

## Context

Persist OS is at 0.6.2. The next release ships the largest change in the project's history:
[ADR-0007](ADR-0007-minimal-by-default-repository-memory.md) cuts required documents from 11 to 6
and retires presets, [ADR-0008](ADR-0008-skill-architecture-progressive-disclosure.md) cuts skills
from 12 to 3, [ADR-0009](ADR-0009-gates-verify-tests-pass.md) replaces `guard`, and
[ADR-0010](ADR-0010-chestertons-fence.md) adds the fence.

The decision is to ship this as **1.0.0**, not 0.7.0.

That is a choice worth examining rather than assuming. A major version is not merely a bigger number
— it is a promise, and a tool that asks teams to build their engineering memory on it should be
explicit about which promise it is making. Persist OS writes files into other people's repositories
and gates their commits. If those guarantees are vague, the reasonable response is not to adopt it.

A 1.0 that breaks its users at 1.1 is worse than staying at 0.x honestly.

## Decision

1.0.0 promises **CLI surface and config schema stability**.

**Stable from 1.0 onward:**

- Command names, subcommands, and flags. A flag may be added; an existing one does not change
  meaning or disappear within 1.x.
- `.persist/config.json` field names, types, and semantics. New optional fields may be added.
  Existing fields are not removed or repurposed within 1.x.
- Doctor exit codes: `0` pass, `1` warnings, `2` errors. Scripts and CI depend on these.
- The `--json` report shape for doctor.

**Explicitly not stable:**

- Generated document _content_. Templates keep improving; wording changes are not breaking.
  `templateVersion` tracks this, and a future `persist upgrade` is how content evolution reaches
  existing repositories.
- Which checks produce warnings. New warnings may appear in a minor release. New _errors_ may not —
  an error breaks a build, so a check may only be promoted to error in a major release.
- Internal module layout under `src/`. Persist OS is a CLI, not a library.

**The breaking changes happen at 1.0 and only at 1.0.** Two are known:

1. `preset` is removed from the config schema (ADR-0007). Accepted deliberately rather than carrying
   an ignored field forever. The pattern of accepting-but-ignoring was used for `memoryProfile`,
   `mode`, and `writePolicy` in 0.7, and doing it a second time would make the schema a museum of
   retired ideas.
2. `persist guard` is removed (ADR-0009).

Both are named in the release notes with the exact edit required.

**The bar for shipping 1.0**, since the promise is only as good as the evidence:

- Every doctor check has unit tests, an integration test proving it fires, and a test proving it
  reports _not evaluated_ rather than passing when its input is missing.
- Every CLI command has an end-to-end test against a real repository.
- An upgrade test proves a repository initialised on 0.6.x still works on 1.0.

The third item is the one that actually backs the promise. The first targets a bug class this
project has hit twice: the staleness check silently passing on a shallow CI clone, and the five
checks that would silently pass once their input documents became optional. Both report `PASSED`
while evaluating nothing. For a tool whose entire pitch is a deterministic gate, a check that cannot
run must say so.

## Alternatives Considered

- **Ship as 0.7.0 and defer 1.0.** Safer, and it avoids making promises before the new shape has
  real-world use. Rejected: the shape after these ADRs is the shape the product is meant to have,
  and continuing to signal "not ready" for something ready is its own cost.
- **Promise generated structure too** — paths and required files, not just CLI and config. Rejected:
  it would freeze the document layout immediately after reorganising it, making every future
  template improvement breaking.
- **Promise everything including template content.** Rejected as too rigid. A copy-edit would become
  a major release.
- **Keep `preset` as an accepted-but-ignored field to avoid any config break.** Rejected. Deprecated
  fields accumulate, and a major version is the honest place to remove them.
- **Split into 0.7 and 0.8 and reach 1.0 later.** Rejected. The pieces interlock: skills reference
  the documents, the test gate shapes the feature scaffold, and the fence depends on both. Shipping
  them apart means two migrations instead of one.

## Consequences

**Improves.** Teams can adopt Persist OS knowing their config and scripts keep working. The
distinction between stable interface and evolving content is stated rather than inferred. The test
bar directly targets the failure mode most damaging to a gate's credibility.

**Worsens.** Adding a config field or changing a flag's meaning now requires a major release. Two
known breaking changes land at once, so the 0.6 to 1.0 step needs a clear migration note rather than
a silent upgrade.

**Risks.** The bar is substantial — every check and every command tested, plus an upgrade path — and
the temptation under deadline will be to ship 1.0 with the promise but not the evidence. That would
be worse than shipping 0.7.0, because the promise is what people would be relying on.

## Related Documents

- PRD: `docs/00-product/PRD.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/50-quality/QUALITY_GATES.md`
- Related: [ADR-0007](ADR-0007-minimal-by-default-repository-memory.md),
  [ADR-0009](ADR-0009-gates-verify-tests-pass.md)
