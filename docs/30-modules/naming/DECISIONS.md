# Naming Module Decisions

## P1: Strict Rejection Before Normalization

Inputs containing traversal or path separators are rejected before slug normalization.

This prevents unsafe input like `../../evil` from becoming a safe-looking slug like `evil`.

## P1: Slug Length

P1 limits slugs to 80 characters.

## P6: Feature Creation Is Idempotent By Slug

If a valid feature folder already exists for a slug, `feature create <name>` reuses that folder instead of creating duplicate feature memory.

If no valid folder exists for the slug, the next feature number is one greater than the highest valid `F-###-*` folder.

## P7: ADR Creation Is Idempotent By Slug

If a valid ADR file already exists for a slug, `adr create <title>` reuses that file instead of creating duplicate decision memory.

If no valid file exists for the slug, the next ADR number is one greater than the highest valid `ADR-####-*` file.

## P8: Module Names Use Existing Slug Rules

P8 does not add module-specific naming rules.

Module names use `slugify`, including strict traversal, separator, reserved-name, control-character, and empty-name rejection.
