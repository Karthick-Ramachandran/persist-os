import type { Preset } from "../../core/presets/preset-schema.js";

export const nextjsPreset: Preset = {
  id: "nextjs",
  name: "Next.js",
  description: "Minimal Next.js-aware opinion pack guidance with proposed decisions only.",
  templates: [
    {
      destination: "docs/ai/presets/nextjs-guidance.md",
      description: "Next.js guidance that remains non-authoritative until accepted.",
      content:
        "# Next.js Preset Guidance\n\nTreat Next.js assumptions as non-authoritative guidance. Convert any architecture choice into a proposed ADR before accepting it.\n"
    }
  ],
  guidance: [
    {
      title: "Keep framework choices proposed",
      body:
        "Next.js-specific routing, rendering, deployment, and data-fetching choices must remain proposed until accepted in repository memory."
    }
  ],
  proposedDecisions: [
    {
      id: "nextjs-framework",
      title: "Use Next.js",
      status: "proposed",
      destination: "docs/adrs/proposed/ADR-PROPOSED-nextjs-framework.md",
      body:
        "# Proposed ADR: Use Next.js\n\n## Status\n\nProposed\n\n## Decision\n\nConsider Next.js as the application framework. This is not accepted until a human reviews and accepts it.\n"
    }
  ]
};
