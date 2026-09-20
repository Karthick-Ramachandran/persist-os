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
- Standards checks for completion evidence, review evidence, ADR consequences, and security impact
  notes.
- Deterministic drift checks for ADR reference integrity in feature and module memory.
- Persist command memory health checks.
- Per-check evaluated / not-evaluated outcomes with reasons (a check whose inputs are absent reports
  so instead of passing silently).
- Hook-drift comparison of generated hooks against config, and retired-skill detection.

## Does Not Own

- File writes.
- Init generation.
- CLI parser wiring.
- Semantic architecture drift detection.
- Dependency drift detection.
- JSON reporting in P9.
- Auto-fix behavior.
- Network, telemetry, MCP runtime, AI API, or cloud behavior.

## Public Interfaces

- `DoctorSeverity`
- `DoctorFinding`
- `DoctorReport`
- `DoctorCheck`
- `DoctorCheckOutcome`
- `runDoctor`
- `formatDoctorReport`
- `getDoctorExitCode`

## Boundaries

Doctor reads repository memory and reports findings.

Doctor must not mutate files.

## Current Decision

P12 implements deterministic standards checks for repository memory evidence:

- completed features require review evidence;
- completed features require test and result evidence;
- ADRs require consequence substance;
- security-sensitive feature planning requires security-impact notes.

P13 adds the first deterministic drift checks:

- feature or module memory referencing a missing ADR is an error;
- feature or module memory referencing a not-yet-accepted ADR is a warning.

Semantic drift detection (natural-language contradiction, module-ownership comparison, code-to-doc
drift) remains future work.

P10 updates Doctor checks for `.persist/config.json` and `docs/ai/PERSIST_COMMANDS.md`.
