# Naming Module Decisions

## P1: Strict Rejection Before Normalization

Inputs containing traversal or path separators are rejected before slug normalization.

This prevents unsafe input like `../../evil` from becoming a safe-looking slug like `evil`.

## P1: Slug Length

P1 limits slugs to 80 characters.

## P6: Feature Creation Is Idempotent By Slug

If a valid feature folder already exists for a slug, `feature create <name>` reuses that folder instead of creating duplicate feature memory.

If no valid folder exists for the slug, the next feature number is one greater than the highest valid `F-###-*` folder.
