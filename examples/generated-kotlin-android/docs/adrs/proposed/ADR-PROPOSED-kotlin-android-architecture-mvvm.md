# Proposed ADR: Use MVVM

## Status

Proposed

## Context

The app needs a presentation architecture for separating UI from logic.

## Decision

Consider MVVM with unidirectional state from ViewModels, awaiting human acceptance.

## Alternatives Considered

- MVI with explicit intents and reducers.
- Plain ViewModels without a strict pattern.

## Consequences

- Clear separation of UI and state.
- Teams must agree on state and event conventions.
