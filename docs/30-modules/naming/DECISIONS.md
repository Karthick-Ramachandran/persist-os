# Naming Module Decisions

## P1: Strict Rejection Before Normalization

Inputs containing traversal or path separators are rejected before slug normalization.

This prevents unsafe input like `../../evil` from becoming a safe-looking slug like `evil`.

## P1: Slug Length

P1 limits slugs to 80 characters.
