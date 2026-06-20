import type { Preset } from "../../core/presets/preset-schema.js";

const guidance = `# iOS Swift Preset Guidance

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
`;

function proposedAdr(topic: string, title: string, body: string) {
  return {
    id: `ios-swift-${topic}`,
    title,
    status: "proposed" as const,
    destination: `docs/adrs/proposed/ADR-PROPOSED-ios-swift-${topic}.md`,
    body,
  };
}

export const iosSwiftPreset: Preset = {
  id: "ios-swift",
  name: "iOS Swift",
  description: "Opinionated iOS Swift opinion pack with proposed decisions only.",
  templates: [
    {
      destination: "docs/ai/presets/ios-swift-guidance.md",
      description: "iOS Swift guidance that remains proposed until accepted.",
      content: guidance,
    },
  ],
  guidance: [
    {
      title: "Separate platform guidance from decisions",
      body: "SwiftUI vs UIKit, concurrency, persistence, presentation pattern, and testing choices must be documented as proposed before acceptance.",
    },
    {
      title: "Abstract dependencies behind protocols",
      body: "Hide platform services behind protocols for testability, but record this as a proposed decision before treating it as accepted.",
    },
  ],
  proposedDecisions: [
    proposedAdr(
      "platform",
      "Use iOS Swift",
      `# Proposed ADR: Use iOS Swift

## Status

Proposed

## Context

The team needs a primary platform and language for the iOS application.

## Decision

Consider iOS Swift as the platform direction. This is not accepted until a human reviews and accepts
it.

## Alternatives Considered

- Objective-C.
- A cross-platform stack such as Flutter or React Native.

## Consequences

- Native performance and first-class Apple APIs.
- Requires Swift and Apple toolchain proficiency.
`,
    ),
    proposedAdr(
      "ui-swiftui",
      "Use SwiftUI for UI",
      `# Proposed ADR: Use SwiftUI

## Status

Proposed

## Context

The app needs a UI framework. SwiftUI and UIKit are the main options.

## Decision

Consider SwiftUI as the UI framework, awaiting human acceptance.

## Alternatives Considered

- UIKit.
- A hybrid of SwiftUI and UIKit during migration.

## Consequences

- Declarative UI and less boilerplate.
- Some advanced cases still require UIKit interop.
`,
    ),
    proposedAdr(
      "concurrency-async",
      "Use async/await and Observation",
      `# Proposed ADR: Use async/await and Observation

## Status

Proposed

## Context

The app needs a concurrency and state-observation approach.

## Decision

Consider Swift async/await with the Observation framework, awaiting human acceptance.

## Alternatives Considered

- Combine.
- Completion handlers and delegates.

## Consequences

- Structured concurrency and simpler state flow.
- Requires a recent deployment target.
`,
    ),
    proposedAdr(
      "persistence-swiftdata",
      "Use SwiftData for persistence",
      `# Proposed ADR: Use SwiftData

## Status

Proposed

## Context

The app needs local persistence.

## Decision

Consider SwiftData for local persistence, awaiting human acceptance.

## Alternatives Considered

- Core Data directly.
- A lightweight store such as GRDB.

## Consequences

- Swift-native modeling and SwiftUI integration.
- Requires a recent deployment target and migration care.
`,
    ),
    proposedAdr(
      "architecture-mvvm",
      "Use MVVM presentation pattern",
      `# Proposed ADR: Use MVVM

## Status

Proposed

## Context

The app needs a presentation architecture.

## Decision

Consider MVVM with observable view models, awaiting human acceptance.

## Alternatives Considered

- The Composable Architecture (TCA).
- Plain views with embedded logic.

## Consequences

- Clear separation of UI and state.
- Teams must agree on view-model conventions.
`,
    ),
  ],
};
