import { flutterPreset } from "../../presets/flutter/preset.js";
import { genericPreset } from "../../presets/generic/preset.js";
import { iosSwiftPreset } from "../../presets/ios-swift/preset.js";
import { nextjsPreset } from "../../presets/nextjs/preset.js";
import { validatePresetRegistry } from "./validate-preset.js";
import type { Preset } from "./preset-schema.js";

const builtInPresets = validatePresetRegistry([
  flutterPreset,
  genericPreset,
  iosSwiftPreset,
  nextjsPreset
]);

export function listPresets(): Preset[] {
  return [...builtInPresets];
}

export function getPreset(id: string): Preset | undefined {
  return builtInPresets.find((preset) => preset.id === id);
}
