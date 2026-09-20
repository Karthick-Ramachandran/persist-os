# Test Plan: Chesterton's Fence

Per ADR-0011 every check needs unit tests, a fires-test, and a not-evaluated test. Plus the
brief's list:

- Crossing creates the warning; second crossing of the same fenced file surfaces the reason.
- Out-of-scope file (test, style, lockfile) produces nothing.
- ADR-referenced file produces nothing.
- Disabled: no prompt, no check, no `FENCES.md`; not-evaluated with reason.
- Skill trigger tests, both directions; catalog count four; word ceiling holds.
- `FENCES.md` large enough to matter: hook output stays within budget with marker.
- Hook: warnings proceed (covered under ADR-0013 tests); init fifth question on TTY / default on
  for `--yes` and non-TTY with the choice stated.
- No real-TTY tests anywhere (established prompter injection pattern).
