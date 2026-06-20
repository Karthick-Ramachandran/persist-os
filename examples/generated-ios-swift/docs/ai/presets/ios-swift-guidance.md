# iOS Swift Preset Guidance

This is proposed guidance, not accepted. Convert any choice you adopt into an accepted ADR in
repository memory. Until then, treat everything here as a recommendation awaiting human review.

## Decision forks this stack forces

- UI framework: SwiftUI vs UIKit.
- Concurrency: Swift async/await with the Observation framework vs Combine.
- Persistence: SwiftData vs Core Data.
- Presentation pattern: MVVM vs The Composable Architecture (TCA).
- Testing: XCTest vs the Swift Testing framework.

## Recommended structure (proposed)

- Feature folders with view, model, and view-model separation.
- A dependency layer abstracted behind protocols for testability.
- Swift Package Manager for modular code.

## Testing (proposed)

- Unit tests with XCTest or Swift Testing.
- View-model tests independent of the UI.
- Snapshot or UI tests for critical flows.

## Security considerations (proposed)

- Store credentials and tokens in the Keychain, never in source or UserDefaults.
- Enable App Transport Security and consider certificate pinning.
- Avoid logging sensitive data.
