# Module Memory

Module memory records what each important module owns, how it should be tested, and which decisions affect it.

Treat every important module as a mini product inside the repository.

Module memory is not the first step. For a new module, create feature delivery docs first under `docs/40-features/F-###-<module>-module/`, then create or update module memory here.

Future module folders should use:

```txt
docs/30-modules/<module>/
  MODULE.md
  TASKS.md
  TEST_PLAN.md
  DECISIONS.md
```

Agents should update module memory when implementation changes responsibilities, boundaries, tests, risks, or decisions.

Module memory should answer:

- What this module owns.
- What this module does not own.
- Public interfaces and callers.
- Key edge cases.
- Security boundaries.
- Testing expectations.
- Durable decisions and ADR links.
