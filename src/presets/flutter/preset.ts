import type { Preset } from "../../core/presets/preset-schema.js";

export const flutterPreset: Preset = {
  id: "flutter",
  name: "Flutter",
  description: "Minimal Flutter-aware opinion pack guidance with proposed decisions only.",
  templates: [
    {
      destination: "docs/ai/presets/flutter-guidance.md",
      description: "Flutter guidance that remains non-authoritative until accepted.",
      content:
        "# Flutter Preset Guidance\n\nTreat Flutter package, state management, navigation, and platform choices as proposed guidance until accepted.\n"
    }
  ],
  guidance: [
    {
      title: "Do not silently choose state management",
      body:
        "Flutter state management, navigation, persistence, and backend choices must remain optional guidance or proposed ADRs."
    }
  ],
  proposedDecisions: [
    {
      id: "flutter-platform",
      title: "Use Flutter",
      status: "proposed",
      destination: "docs/adrs/proposed/ADR-PROPOSED-flutter-platform.md",
      body:
        "# Proposed ADR: Use Flutter\n\n## Status\n\nProposed\n\n## Decision\n\nConsider Flutter as the application platform. This is not accepted until a human reviews and accepts it.\n"
    }
  ]
};
