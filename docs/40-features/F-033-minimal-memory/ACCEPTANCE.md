# Acceptance: Minimal-By-Default Memory

1. Empty repo: `persist init` generates the six required documents + `docs/adrs/`, and
   `persist doctor` exits 0.
2. No feature/module folders: doctor exits 0 with the inapplicable checks not-evaluated
   and reasoned.
3. `feature create` writes PLAN+TASKS with no gate, +TEST_PLAN with `testCommand` set.
4. No `persist preset list`; `--help` silent on presets.
5. Config with `preset` fails naming the field and the one-line fix.
6. Config without `preset` loads normally.
7. Full repo (features + modules) evaluates everything as before.
8. Generated output has PRODUCT.md, no PRD.md/BRD.md.
9. This repo's `docs/00-product/` untouched.
10. Retired (non-catalog) skills on disk warn with names + removal command.
