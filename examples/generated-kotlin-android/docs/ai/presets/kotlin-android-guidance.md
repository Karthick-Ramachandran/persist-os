# Kotlin Android Preset Guidance

This guidance is proposed, not accepted. Convert any choice you adopt into an accepted ADR in
repository memory. Until then, treat everything here as a recommendation awaiting human review.

## Decision forks this stack forces

- UI toolkit: Jetpack Compose vs Android Views/XML.
- Asynchrony: Kotlin Coroutines and Flow vs RxJava/callbacks.
- Dependency injection: Hilt vs Koin vs manual.
- Local persistence: Room vs SQLDelight vs DataStore.
- Presentation pattern: MVVM vs MVI.

## Recommended structure (proposed)

- Feature-based modules or packages (`feature/`, `core/`, `data/`, `ui/`).
- A repository layer between ViewModels and data sources.
- Immutable UI state exposed as `StateFlow` from ViewModels.

## Testing (proposed)

- Unit tests with JUnit5 and coroutine test dispatchers.
- Flow assertions with Turbine.
- UI tests with Compose UI testing or Espresso.

## Security considerations (proposed)

- Store secrets with the Android Keystore, never in source or version control.
- Use EncryptedSharedPreferences or DataStore with encryption for sensitive local data.
- Enforce network security config and certificate pinning where appropriate.
