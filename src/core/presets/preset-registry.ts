import { flutterPreset } from "../../presets/flutter/preset.js";
import { genericPreset } from "../../presets/generic/preset.js";
import { iosSwiftPreset } from "../../presets/ios-swift/preset.js";
import { kotlinAndroidPreset } from "../../presets/kotlin-android/preset.js";
import { nextjsPreset } from "../../presets/nextjs/preset.js";
import { pythonFastapiPreset } from "../../presets/python-fastapi/preset.js";
import { validatePresetRegistry } from "./validate-preset.js";
import type { Preset } from "./preset-schema.js";

const builtInPresets = validatePresetRegistry([
  flutterPreset,
  genericPreset,
  iosSwiftPreset,
  kotlinAndroidPreset,
  nextjsPreset,
  pythonFastapiPreset,
]);

export function listPresets(): Preset[] {
  return [...builtInPresets];
}

export function getPreset(id: string): Preset | undefined {
  return builtInPresets.find((preset) => preset.id === id);
}
