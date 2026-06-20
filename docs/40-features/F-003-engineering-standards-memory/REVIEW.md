# Review: Engineering Standards Memory

## Drift Review

Status: Complete.

Review areas:

- Standards are introduced as a first-class memory pillar.
- Standards do not outrank architecture docs.
- Only three docs are created under `docs/60-engineering/`.
- No runtime behavior changed.

## Findings

- No architecture drift found. Architecture remains higher than engineering standards in the source-of-truth order.
- No product drift found. Product docs now position SpecForge as an Engineering Memory Operating System while preserving architecture-neutral positioning.
- No engineering standards drift found. Root agent files, review docs, and relevant skills route agents to `docs/60-engineering/`.
- No runtime drift found. P1.6 changed docs and skill templates only.

## Manual Review Evidence

- `docs/60-engineering/` contains exactly three files.
- `ENGINEERING_STANDARDS.md` covers secrets, dependencies, documentation, git, releases, migrations, operations, and AI agent behavior.
- Repository rules override model preferences is documented in root agent files and engineering standards.
- Source-of-truth order places accepted ADRs and repository decisions first, architecture docs second, and engineering standards third.
