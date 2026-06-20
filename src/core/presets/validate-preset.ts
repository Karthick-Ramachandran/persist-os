import { parsePreset, PresetValidationError, type Preset } from "./preset-schema.js";

export function validatePreset(preset: Preset): Preset {
  return parsePreset(preset);
}

export function validatePresetRegistry(presets: readonly Preset[]): Preset[] {
  const validatedPresets = presets.map((preset) => parsePreset(preset));
  const seenIds = new Set<string>();

  for (const preset of validatedPresets) {
    if (seenIds.has(preset.id)) {
      throw new PresetValidationError([`Duplicate preset id "${preset.id}".`]);
    }

    seenIds.add(preset.id);
  }

  return [...validatedPresets].sort((left, right) => left.id.localeCompare(right.id));
}
