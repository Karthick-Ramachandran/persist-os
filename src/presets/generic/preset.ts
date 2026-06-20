import type { Preset } from "../../core/presets/preset-schema.js";

export const genericPreset: Preset = {
  id: "generic",
  name: "Generic",
  description: "Neutral repository memory with no framework or architecture opinions.",
  templates: [
    {
      destination: "docs/ai/presets/generic-guidance.md",
      description: "Neutral guidance for repository memory initialization.",
      content:
        "# Generic Preset Guidance\n\nUse neutral repository memory first. Record architecture choices only after a human accepts them.\n"
    }
  ],
  guidance: [
    {
      title: "Neutral memory first",
      body:
        "Use this preset when the repository should start with memory structure only and no stack-specific recommendations."
    }
  ],
  proposedDecisions: []
};
