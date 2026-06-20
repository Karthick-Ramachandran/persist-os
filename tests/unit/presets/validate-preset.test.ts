import { describe, expect, it } from "vitest";

import { getPreset, listPresets } from "../../../src/core/presets/preset-registry.js";
import {
  parsePreset,
  PresetValidationError,
  type Preset
} from "../../../src/core/presets/preset-schema.js";
import {
  validatePreset,
  validatePresetRegistry
} from "../../../src/core/presets/validate-preset.js";

describe("preset validation and registry", () => {
  it("validates all built-in presets through the public validation path", () => {
    const presets = listPresets();

    expect(presets.map((preset) => preset.id)).toEqual([
      "flutter",
      "generic",
      "ios-swift",
      "nextjs"
    ]);

    for (const preset of presets) {
      expect(validatePreset(preset)).toEqual(preset);
    }
  });

  it("keeps built-in decisions proposed", () => {
    for (const preset of listPresets()) {
      for (const decision of preset.proposedDecisions) {
        expect(decision.status).toBe("proposed");
      }
    }
  });

  it("looks up presets by id", () => {
    expect(getPreset("generic")?.name).toBe("Generic");
    expect(getPreset("nextjs")?.name).toBe("Next.js");
  });

  it("returns undefined for missing preset lookup", () => {
    expect(getPreset("missing")).toBeUndefined();
  });

  it("rejects duplicate preset ids in registries", () => {
    const preset = parsePreset({
      id: "duplicate",
      name: "Duplicate",
      description: "Duplicate preset.",
      templates: [
        {
          destination: "docs/ai/presets/duplicate.md",
          content: "# Duplicate\n"
        }
      ]
    });

    expect(() => validatePresetRegistry([preset, preset])).toThrow(
      PresetValidationError
    );
  });

  it("sorts registry presets deterministically", () => {
    const beta = parsePreset({
      id: "beta",
      name: "Beta",
      description: "Beta preset.",
      templates: [{ destination: "docs/ai/presets/beta.md", content: "# Beta\n" }]
    });
    const alpha = parsePreset({
      id: "alpha",
      name: "Alpha",
      description: "Alpha preset.",
      templates: [{ destination: "docs/ai/presets/alpha.md", content: "# Alpha\n" }]
    });

    expect(validatePresetRegistry([beta, alpha]).map((preset) => preset.id)).toEqual([
      "alpha",
      "beta"
    ]);
  });

  it("validates preset objects passed to validatePreset", () => {
    const invalidPreset = {
      id: "invalid preset",
      name: "Invalid",
      description: "Invalid preset.",
      templates: [{ destination: "docs/ai/presets/invalid.md", content: "# Invalid\n" }]
    } as Preset;

    expect(() => validatePreset(invalidPreset)).toThrow(PresetValidationError);
  });
});
