# Landing page test plan

## Browser checks

Inspect light and dark desktop views and mobile/tablet layouts. Check 320, 375, 390, 768, 1024, 1440
and 1920 pixel widths for horizontal overflow. Exercise navigation, command search including an
empty result, copy feedback, tabs if present, theme persistence, modal dismissal/focus return,
keyboard controls and mobile disclosure. Check no-JavaScript readability and reduced motion. Verify
local assets and internal links resolve; review browser errors.

Exercise every interactive feature demo and all command playground actions. Verify labels and
selected states track visible results, command/result pairs describe current behavior, and examples
remain identified as sample data. No demo may execute commands or contact an external service.

The revised hero has four repository/terminal scenarios: setup, adoption, decision recording and
Doctor findings. Verify explorer contents, active tabs, command copying and mobile explorer
disclosure. Review page-wide vertical rhythm, eyebrow/title gaps, aligned text and consistent card
padding against the user's screenshot feedback.

For the visual reset, inspect computed typography at 320, 390, 768, 1024 and 1440 pixels: Manrope
loads locally, marketing body remains at least 16px, metadata never drops below 12px, headings stay
moderate, and visible weights follow the regular/medium/semibold scale. The hero must have one
primary guide link, one copyable init command and no category eyebrow. Check light/dark text
contrast and neutral feature surfaces. For the CTA refinement, verify the exact copied text,
successful and failed-copy feedback, keyboard activation/focus, a 44px minimum copy target, and a
selectable command with JavaScript disabled. Check normal/copied states at narrow widths without
clipping or overflow. At desktop and tablet widths with enough room, assert that the guide link and
init strip share one row and have aligned heights. Wrapping on phones must preserve readable code
and the copy target.

## Repository checks

Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm build`,
`node scripts/site/check-commands.mjs`, `node scripts/site/check-transcripts.mjs`, and
`node dist/cli.js doctor`. Record results and explain any pre-existing Doctor warnings.

## Evidence

Save representative desktop/mobile screenshots and a completion report with changed files,
commands/results, copy review, skipped checks and remaining risks. No new implementation-mirroring
unit tests are needed for this static presentation change; browser checks cover interaction risks.
