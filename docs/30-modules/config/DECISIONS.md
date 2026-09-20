# Config Decisions

## P2: Boring Manifest First

P2 config includes only the fields needed by near-term commands:

- version.
- template version.
- preset.
- memory profile.
- AI tools.
- docs paths.
- write policy.

## P2: No Decision Index Yet

P2 does not include decision indexes.

Accepted decisions, proposed decisions, and organization standards remain in docs until later work
defines a stronger indexing model.

## P2: Safe Writes

Config writes must use the existing safe write planning and execution path.

## P10: Persist Config Path

P10 uses `.persist/config.json` as the only supported config path.

No compatibility shim is added for the pre-public config path.

## Test Gate Fields (ADR-0009)

`testCommand` (one-shot test command, null means the gate is off) and `prePushGates` (push-only
gates) join `preCommitGates`. Both are optional on read via zod defaults so pre-1.0 configs keep
loading; this spends no breaking-change budget. `testCommand` shares the gate validation shape
(single line, no control characters, 200-char cap) because the test gate executes it.

## Preset Field Retired (ADR-0007)

The `preset` config field is removed (1.0 breaking change, budgeted by ADR-0011). A config that
still contains it fails to parse with an error naming the field and the one-line fix (delete the
line) — neither a zod unrecognized-key dump nor silent acceptance.

## Fence Toggle (F-037)

`fenceEnabled` (default true) records whether the Chesterton fence is active. Optional on read
via zod default so existing configs keep loading; this spends no breaking-change budget. No
strictness knob exists anywhere by decision (ADR-0013): one good default, with `preCommitGates`
as the escape hatch.
