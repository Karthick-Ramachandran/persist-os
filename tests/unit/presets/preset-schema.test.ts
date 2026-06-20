import { describe, expect, it } from "vitest";

import {
  parsePreset,
  PresetValidationError,
  type Preset
} from "../../../src/core/presets/preset-schema.js";

function createValidPreset(overrides: Partial<Preset> = {}): Preset {
  return {
    id: "valid-preset",
    name: "Valid Preset",
    description: "A valid test preset.",
    templates: [
      {
        destination: "docs/ai/presets/valid.md",
        content: "# Valid\n"
      }
    ],
    guidance: [
      {
        title: "Use repository memory",
        body: "Keep guidance optional until accepted."
      }
    ],
    proposedDecisions: [
      {
        id: "valid-decision",
        title: "Valid Decision",
        status: "proposed",
        destination: "docs/adrs/proposed/ADR-PROPOSED-valid-decision.md",
        body: "# Proposed ADR\n"
      }
    ],
    ...overrides
  };
}

describe("preset schema", () => {
  it("validates a preset and normalizes safe destinations", () => {
    const preset = parsePreset(
      createValidPreset({
        templates: [
          {
            destination: "docs/./ai/presets/valid.md",
            content: "# Valid\n"
          }
        ]
      })
    );

    expect(preset.templates[0]?.destination).toBe("docs/ai/presets/valid.md");
  });

  it("rejects invalid preset ids", () => {
    for (const id of ["Next JS", "next_js", "nextjs-", "-nextjs", "../../evil"]) {
      expect(() => parsePreset(createValidPreset({ id }))).toThrow(
        PresetValidationError
      );
    }
  });

  it("rejects unsafe template destinations", () => {
    const unsafeDestinations = [
      "../outside.md",
      "/tmp/outside.md",
      "C:/tmp/outside.md",
      "docs\\outside.md",
      "docs//outside.md",
      "docs/\u0000outside.md"
    ];

    for (const destination of unsafeDestinations) {
      expect(() =>
        parsePreset(
          createValidPreset({
            templates: [{ destination, content: "# Unsafe\n" }]
          })
        )
      ).toThrow(PresetValidationError);
    }
  });

  it("rejects unsafe proposed decision destinations", () => {
    expect(() =>
      parsePreset(
        createValidPreset({
          proposedDecisions: [
            {
              id: "unsafe-decision",
              title: "Unsafe Decision",
              status: "proposed",
              destination: "../ADR-PROPOSED-unsafe.md",
              body: "# Unsafe\n"
            }
          ]
        })
      )
    ).toThrow(PresetValidationError);
  });

  it("rejects duplicate normalized destinations", () => {
    expect(() =>
      parsePreset(
        createValidPreset({
          templates: [
            {
              destination: "docs/ai/presets/valid.md",
              content: "# One\n"
            },
            {
              destination: "docs/ai/./presets/valid.md",
              content: "# Two\n"
            }
          ],
          proposedDecisions: []
        })
      )
    ).toThrow(PresetValidationError);

    expect(() =>
      parsePreset(
        createValidPreset({
          templates: [
            {
              destination: "docs/adrs/proposed/ADR-PROPOSED-valid-decision.md",
              content: "# One\n"
            }
          ]
        })
      )
    ).toThrow(PresetValidationError);
  });

  it("rejects accepted decisions in presets", () => {
    expect(() =>
      parsePreset({
        ...createValidPreset(),
        proposedDecisions: [
          {
            id: "accepted-decision",
            title: "Accepted Decision",
            status: "accepted",
            destination: "docs/adrs/ADR-0002-accepted-decision.md",
            body: "# Accepted\n"
          }
        ]
      })
    ).toThrow(PresetValidationError);
  });

  it("rejects unknown top-level and nested keys", () => {
    expect(() =>
      parsePreset({
        ...createValidPreset(),
        secret: "nope"
      })
    ).toThrow(PresetValidationError);

    expect(() =>
      parsePreset({
        ...createValidPreset(),
        templates: [
          {
            destination: "docs/ai/presets/valid.md",
            content: "# Valid\n",
            secret: "nope"
          }
        ]
      })
    ).toThrow(PresetValidationError);

    expect(() =>
      parsePreset({
        ...createValidPreset(),
        proposedDecisions: [
          {
            id: "valid-decision",
            title: "Valid Decision",
            status: "proposed",
            destination: "docs/adrs/proposed/ADR-PROPOSED-valid-decision.md",
            body: "# Proposed ADR\n",
            acceptedBy: "nobody"
          }
        ]
      })
    ).toThrow(PresetValidationError);
  });
});
