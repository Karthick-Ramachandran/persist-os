# Module Memory

Module memory records what each important module owns, how it should be tested, and which decisions
affect it.

Future module folders should use:

```txt
docs/30-modules/<module>/
  MODULE.md
  TASKS.md
  TEST_PLAN.md
  DECISIONS.md
```

Agents should update module memory when implementation changes responsibilities, boundaries, tests,
risks, or decisions.
