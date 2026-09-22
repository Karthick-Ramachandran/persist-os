# Website verification

Run the existing command and transcript checks under `scripts/site/` against a fresh CLI build.
Check all landing demos, copy actions, search, keyboard controls, mobile navigation and theme
persistence in a browser. Verify no horizontal page overflow at 320 through 1920 pixels, no broken
local links or missing assets, useful no-JavaScript content and reduced-motion behavior. The hero's
setup-guide link and copyable init command must remain usable at narrow widths, with accurate
clipboard feedback, keyboard access and a manually selectable no-JavaScript command.

Run the repository test, typecheck, lint, build and Doctor gates. See the feature test plan at
`docs/40-features/F-038-landing-page/TEST_PLAN.md` for the current matrix and completion evidence.
