# Architecture Impact: Opinionated Presets

## Affected Modules

- `presets`: adds two preset definitions and enriches two existing ones; registers the new presets.
- `opinion-packs` (architecture memory): gains a documented content standard for opinionated
  presets.

No engine, schema, config, filesystem, generator, or doctor behavior changes.

## New Behavior

- New `src/presets/kotlin-android/preset.ts` and `src/presets/python-fastapi/preset.ts`.
- Enriched `src/presets/ios-swift/preset.ts` and `src/presets/nextjs/preset.ts`.
- Registry includes the two new presets.
- Each preset ships richer guidance templates and multiple proposed ADRs.

## Decision Records

No new ADR is required.

- The opinion-pack contract is already accepted repository memory: presets may propose choices, not
  accept them. The preset schema enforces this by requiring `status: "proposed"` for every preset
  decision, so richer content cannot violate neutrality.
- This feature only authors content within that accepted contract and documents the content standard
  in `docs/10-architecture/OPINION_PACKS.md`.

## Security Impact

- No new capability. Presets remain static content rendered through the existing safe write pipeline.
- Preset destinations are validated and confined to the project root, unchanged from prior behavior.
- No network, telemetry, dependency installation, or code execution is introduced.

## Compatibility

- Existing presets keep their ids, destinations, and golden anchors; content is added, not removed.
- `recall preset list` output grows by two presets.
- Committed examples grow to include the two new presets and the enriched guidance.
