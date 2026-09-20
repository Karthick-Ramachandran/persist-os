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
