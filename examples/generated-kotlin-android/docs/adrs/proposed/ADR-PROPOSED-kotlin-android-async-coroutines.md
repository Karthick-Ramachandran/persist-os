# Proposed ADR: Use Coroutines and Flow

## Status

Proposed

## Context

The app needs a concurrency and reactive streams approach.

## Decision

Consider Kotlin Coroutines with Flow for asynchronous work and streams, awaiting human acceptance.

## Alternatives Considered

- RxJava/RxKotlin.
- Callbacks and `LiveData` only.

## Consequences

- Structured concurrency and cancellation.
- Requires discipline around dispatchers and scope.
