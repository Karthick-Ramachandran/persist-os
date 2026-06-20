import type { Preset } from "../../core/presets/preset-schema.js";

const guidance = `# Kotlin Android Preset Guidance

This guidance is proposed, not accepted. Convert any choice you adopt into an accepted ADR in
repository memory. Until then, treat everything here as a recommendation awaiting human review.

## Decision forks this stack forces

- UI toolkit: Jetpack Compose vs Android Views/XML.
- Asynchrony: Kotlin Coroutines and Flow vs RxJava/callbacks.
- Dependency injection: Hilt vs Koin vs manual.
- Local persistence: Room vs SQLDelight vs DataStore.
- Presentation pattern: MVVM vs MVI.

## Recommended structure (proposed)

- Feature-based modules or packages (\`feature/\`, \`core/\`, \`data/\`, \`ui/\`).
- A repository layer between ViewModels and data sources.
- Immutable UI state exposed as \`StateFlow\` from ViewModels.

## Testing (proposed)

- Unit tests with JUnit5 and coroutine test dispatchers.
- Flow assertions with Turbine.
- UI tests with Compose UI testing or Espresso.

## Security considerations (proposed)

- Store secrets with the Android Keystore, never in source or version control.
- Use EncryptedSharedPreferences or DataStore with encryption for sensitive local data.
- Enforce network security config and certificate pinning where appropriate.
`;

function proposedAdr(topic: string, title: string, body: string) {
  return {
    id: `kotlin-android-${topic}`,
    title,
    status: "proposed" as const,
    destination: `docs/adrs/proposed/ADR-PROPOSED-kotlin-android-${topic}.md`,
    body,
  };
}

export const kotlinAndroidPreset: Preset = {
  id: "kotlin-android",
  name: "Kotlin Android",
  description: "Opinionated Kotlin Android opinion pack with proposed decisions only.",
  templates: [
    {
      destination: "docs/ai/presets/kotlin-android-guidance.md",
      description: "Kotlin Android guidance that remains proposed until accepted.",
      content: guidance,
    },
  ],
  guidance: [
    {
      title: "Keep stack choices proposed",
      body: "Compose vs Views, Coroutines/Flow vs RxJava, DI framework, persistence, and presentation pattern must remain proposed until accepted in repository memory.",
    },
    {
      title: "Prefer unidirectional state",
      body: "Expose immutable UI state from ViewModels and keep side effects explicit, but record this as a proposed decision before treating it as accepted.",
    },
  ],
  proposedDecisions: [
    proposedAdr(
      "platform",
      "Use Kotlin for Android",
      `# Proposed ADR: Use Kotlin for Android

## Status

Proposed

## Context

The team needs a primary language and platform for the Android application.

## Decision

Consider Kotlin as the Android application language. This is not accepted until a human reviews and
accepts it.

## Alternatives Considered

- Java for Android.
- A cross-platform stack such as Flutter or React Native.

## Consequences

- Idiomatic Android APIs and coroutines support.
- Requires Kotlin proficiency across the team.
`,
    ),
    proposedAdr(
      "ui-compose",
      "Use Jetpack Compose for UI",
      `# Proposed ADR: Use Jetpack Compose

## Status

Proposed

## Context

The app needs a UI toolkit. Compose and the legacy View/XML system are the main options.

## Decision

Consider Jetpack Compose as the UI toolkit, awaiting human acceptance.

## Alternatives Considered

- Android Views with XML layouts.
- A hybrid of Compose and Views during migration.

## Consequences

- Declarative UI and less boilerplate.
- Requires Compose tooling and team ramp-up.
`,
    ),
    proposedAdr(
      "async-coroutines",
      "Use Coroutines and Flow for async",
      `# Proposed ADR: Use Coroutines and Flow

## Status

Proposed

## Context

The app needs a concurrency and reactive streams approach.

## Decision

Consider Kotlin Coroutines with Flow for asynchronous work and streams, awaiting human acceptance.

## Alternatives Considered

- RxJava/RxKotlin.
- Callbacks and \`LiveData\` only.

## Consequences

- Structured concurrency and cancellation.
- Requires discipline around dispatchers and scope.
`,
    ),
    proposedAdr(
      "di-hilt",
      "Use Hilt for dependency injection",
      `# Proposed ADR: Use Hilt

## Status

Proposed

## Context

The app needs a dependency injection approach for testability and lifecycle scoping.

## Decision

Consider Hilt for dependency injection, awaiting human acceptance.

## Alternatives Considered

- Koin.
- Manual constructor injection.

## Consequences

- Compile-time validation and Android lifecycle scopes.
- Adds annotation processing to the build.
`,
    ),
    proposedAdr(
      "persistence-room",
      "Use Room for local persistence",
      `# Proposed ADR: Use Room

## Status

Proposed

## Context

The app needs structured local persistence.

## Decision

Consider Room for local relational persistence, awaiting human acceptance.

## Alternatives Considered

- SQLDelight.
- DataStore for simple key-value needs.

## Consequences

- Compile-time verified SQL and Flow integration.
- Schema migrations must be maintained.
`,
    ),
    proposedAdr(
      "architecture-mvvm",
      "Use MVVM presentation pattern",
      `# Proposed ADR: Use MVVM

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
`,
    ),
  ],
};
