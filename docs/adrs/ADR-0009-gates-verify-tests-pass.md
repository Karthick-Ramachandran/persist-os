# ADR-0009: Gates Verify Tests Pass

## Status

Accepted

## Context

`persist guard` checks whether a test _file_ changed alongside a source change. That is a proxy, and
a weak one: touching a test file satisfies it, and a passing suite is neither required nor checked.
It answers "did someone remember tests?" when the question worth answering is "do the tests pass?"

Two further problems sit next to it.

**The hooks duplicate each other.** `persist init` generates a pre-commit and a pre-push hook that
run the identical gate list. Measured on this repository:

```txt
doctor           1.7s
typecheck+lint   3.3s
tests           ~5.0s
                -----
                ~10s   on every commit, then ~10s again on every push
```

Ten seconds per commit is the kind of cost people route around with `--no-verify`, which disables
the gate entirely — the worst outcome.

**Gate detection picks the wrong script.** `detect-gates.ts` has
`KNOWN_SCRIPTS = ["test", "typecheck", "lint"]`. In any Vitest or Jest repository, `test` is the
watch-mode script and `test:run` is the one-shot variant that exists for exactly this purpose. This
repository's own generated hook runs `pnpm run test` while its CI runs `test:run`.

## Decision

**`guard` is replaced by a test gate that runs the tests and requires them to pass.** Checking that
a test file was touched is a weaker version of a check we can now perform directly, so both are not
worth keeping.

**The gate is off by default** and enabled by the third question in interactive `persist init`.

**The test command lives in config** as `testCommand`, detected at init and freely editable.
Detection prefers `test:run` over `test`, and more generally prefers a one-shot script over a watch
script. Storing it makes the gate auditable: a reader of `.persist/config.json` can see exactly what
runs.

**The hooks split by cost:**

```txt
pre-commit   persist doctor                      ~1.7s
pre-push     testCommand, typecheck, lint        ~8s, once per push
```

Doctor belongs at commit time because it checks memory, which is what a commit is usually changing,
and because it is cheap enough not to be resented. The expensive gates belong at push time, where
they run once per push instead of once per commit and where they also catch anything committed with
`--no-verify`. Per-commit cost drops from ~10s to ~1.7s with nothing checked less thoroughly.

Config gains `prePushGates` alongside `preCommitGates`, so the two hooks stop sharing one list.

**A generated hook must match the config that produced it.** This repository currently ships a
committed `.persist/config.json` with `preCommitGates: []` and a committed pre-commit hook with four
gates baked in. Nothing detects that disagreement. Doctor gains a check that compares the generated
hooks against the config, so a hook that has drifted from its source is reported rather than
silently trusted.

## Alternatives Considered

- **Keep `guard` alongside the test gate.** Rejected. "You changed code without touching tests" and
  "tests pass" overlap heavily in practice, and two commands that feel similar is a worse surface
  than one that is clearly defined.
- **Fold `guard` into the test gate as a mode.** Rejected for 1.0. Configurable depth can be added
  later if the simpler gate proves insufficient; starting with the option makes the first version
  harder to explain.
- **Re-detect the test command on every hook run.** Rejected. Nothing drifts, but nothing is
  auditable or overridable either, and a user with a non-standard setup has no way to correct it.
- **Reuse `preCommitGates` and add no new config.** Rejected. It cannot express "tests pass" as its
  own reportable outcome, and it keeps the two hooks sharing a single list — the duplication this
  ADR exists to remove.
- **Doctor on both hooks.** Rejected as the current state. At 1.7s the duplication is not expensive,
  but it is pure repetition, and running a check twice is not the same as checking twice.

## Consequences

**Improves.** The gate verifies the property that matters instead of a proxy for it. Commits get
roughly six times cheaper, which makes the hooks something people leave enabled. The `test` versus
`test:run` bug is fixed at the source rather than worked around. Hook drift becomes visible.

**Worsens.** Removing `guard` is a breaking change for anyone who has it in their gate list, and
this is where 1.0's breaking budget gets spent (see
[ADR-0011](ADR-0011-one-zero-stability-contract.md)). A failing test now blocks a push rather than
producing a warning, which is the intent but will feel stricter.

**Risks.** Detection picking the wrong script silently disables the gate. Detection must be covered
by tests across the common shapes — Vitest, Jest, pytest, Go, Cargo — and `persist init` must print
the command it selected so a wrong choice is visible immediately rather than discovered during an
incident.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/40-features/F-030-test-change-guard/`,
  `docs/40-features/F-029-pre-push-regression-gate/`
- Related: [ADR-0002](ADR-0002-pre-commit-hook-generation.md),
  [ADR-0011](ADR-0011-one-zero-stability-contract.md)
