# Module: Doctor

## Purpose

Doctor owns read-only repository memory health checks.

It validates whether repository memory is structurally healthy enough for AI-assisted work.

## Owns

- Doctor findings.
- Severity model.
- Doctor report formatting.
- Doctor exit-code mapping.
- Config, required-doc, feature-doc, module-doc, and ADR-section health checks.

## Does Not Own

- File writes.
- Init generation.
- CLI parser wiring.
- Semantic architecture drift detection in P9.
- Dependency drift detection in P9.
- JSON reporting in P9.
- Auto-fix behavior.
- Network, telemetry, MCP runtime, AI API, or cloud behavior.

## Public Interfaces

- `DoctorSeverity`
- `DoctorFinding`
- `DoctorReport`
- `DoctorCheck`
- `runDoctor`
- `formatDoctorReport`
- `getDoctorExitCode`

## Boundaries

Doctor reads repository memory and reports findings.

Doctor must not mutate files.

## Current Decision

P9 implements structural memory health checks only.

Semantic drift detection remains future work.
