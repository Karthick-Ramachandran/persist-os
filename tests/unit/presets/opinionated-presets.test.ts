import { describe, expect, it } from "vitest";

import { getPreset, listPresets } from "../../../src/core/presets/preset-registry.js";
import { parsePreset } from "../../../src/core/presets/preset-schema.js";

const OPINIONATED_PRESET_IDS = ["kotlin-android", "python-fastapi", "ios-swift", "nextjs"];

describe("opinionated presets", () => {
  it("registers the new kotlin-android and python-fastapi presets", () => {
    expect(getPreset("kotlin-android")?.name).toBe("Kotlin Android");
    expect(getPreset("python-fastapi")?.name).toBe("Python FastAPI");
  });

  it("ships at least four proposed decisions for each opinionated preset", () => {
    for (const id of OPINIONATED_PRESET_IDS) {
      const preset = getPreset(id);
      expect(preset, `preset ${id} should exist`).toBeDefined();
      expect(preset!.proposedDecisions.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("keeps every preset decision proposed", () => {
    for (const preset of listPresets()) {
      for (const decision of preset.proposedDecisions) {
        expect(decision.status).toBe("proposed");
        expect(decision.body).toContain("## Status\n\nProposed");
      }
    }
  });

  it("uses unique destinations within each preset", () => {
    for (const preset of listPresets()) {
      const destinations = [
        ...preset.templates.map((template) => template.destination),
        ...preset.proposedDecisions.map((decision) => decision.destination),
      ];
      expect(new Set(destinations).size).toBe(destinations.length);
    }
  });

  it("validates every built-in preset through parsePreset", () => {
    for (const preset of listPresets()) {
      expect(() => parsePreset(preset)).not.toThrow();
    }
  });

  it("names real decision forks in opinionated guidance", () => {
    expect(getPreset("kotlin-android")!.templates[0].content).toContain("Jetpack Compose");
    expect(getPreset("python-fastapi")!.templates[0].content).toContain("FastAPI");
    expect(getPreset("ios-swift")!.templates[0].content).toContain("SwiftUI");
    expect(getPreset("nextjs")!.templates[0].content).toContain("App Router");
  });
});
