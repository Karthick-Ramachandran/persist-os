# Review: Empty-Folder Init And Repository Memory First

## Drift Review

Status: Complete.

Review areas:

- Empty-folder init is documented as first-class.
- Repository-memory-first positioning remains architecture-neutral.
- Presets remain optional opinion packs.
- Technology detection remains guidance only.
- `adopt` remains future scope.
- No runtime behavior changed.

## Findings

- No product drift found. Product docs now define SpecForge as repository memory first and empty-folder init as first-class.
- No architecture drift found. Architecture docs keep neutral init, architecture-neutral core, and no-runtime P1.7 scope.
- No opinion-pack drift found. Presets remain optional guidance and proposed decisions only.
- No adoption drift found. Legacy adoption is documented as future `specforge adopt`.
- No runtime drift found. P1.7 changed docs only and did not touch runtime source or tests.

## Manual Review Evidence

- Empty-folder init is documented in canonical and root product docs.
- `specforge init` remains neutral and architecture-opinion-free.
- Existing app code, framework files, and Git are not required for init.
- Technology detection is documented as guidance only.
- Root product docs are synchronized with canonical product docs.
