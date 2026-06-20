import type { Preset } from "../../core/presets/preset-schema.js";

export const iosSwiftPreset: Preset = {
  id: "ios-swift",
  name: "iOS Swift",
  description: "Minimal iOS Swift-aware opinion pack guidance with proposed decisions only.",
  templates: [
    {
      destination: "docs/ai/presets/ios-swift-guidance.md",
      description: "iOS Swift guidance that remains non-authoritative until accepted.",
      content:
        "# iOS Swift Preset Guidance\n\nTreat iOS architecture, package, and platform choices as proposed guidance until accepted in repository memory.\n"
    }
  ],
  guidance: [
    {
      title: "Separate platform guidance from decisions",
      body:
        "SwiftUI, UIKit, package management, persistence, and deployment assumptions must be documented as proposed choices before acceptance."
    }
  ],
  proposedDecisions: [
    {
      id: "ios-swift-platform",
      title: "Use iOS Swift",
      status: "proposed",
      destination: "docs/adrs/proposed/ADR-PROPOSED-ios-swift-platform.md",
      body:
        "# Proposed ADR: Use iOS Swift\n\n## Status\n\nProposed\n\n## Decision\n\nConsider iOS Swift as the platform direction. This is not accepted until a human reviews and accepts it.\n"
    }
  ]
};
