# Plan: Doctor Command

## Approach

Implement Doctor as a read-only core health check.

Keep command code focused on orchestration and let `core/doctor` own checks, findings, report formatting, and exit-code mapping.

## Tasks

1. Add P9 feature docs and doctor module memory.
2. Add generated command-reference memory to init output.
3. Implement Doctor report types, checks, formatting, and exit-code mapping.
4. Wire `doctor` into the CLI parser.
5. Update root agent files with Doctor completion gate guidance.
6. Add unit and integration tests.
7. Run verification and complete review evidence.

## Boundaries

Do not implement:

- semantic drift detection
- dependency drift detection
- code ownership scanning
- stale completion content analysis
- JSON reporting
- auto-fix
- package binary wiring
- network, telemetry, MCP runtime, AI API, cloud behavior, or app code generation
