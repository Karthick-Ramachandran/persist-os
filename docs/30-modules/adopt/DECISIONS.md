# Adopt Decisions

## ADR-0003: Propose, Never Accept

Adopt produces only proposed memory. Inferred decisions require human acceptance before they become
repository truth.

## Read-Only Inspection

Inspection reads manifest and marker files only. It never executes repository code, makes network
calls, or installs dependencies.

## Conservative Inference

Only clear manifest and marker signals are inferred. Weak or ambiguous signals are reported as
observations, not decisions.

## Config Optional

Adopt works with or without an existing Recall config, using default paths when none is present.
