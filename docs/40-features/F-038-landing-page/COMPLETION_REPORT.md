# Landing page completion report

## Status

Complete. Ready for human review of the static website change; not published or released.

## Scope delivered

Rebuilt the landing page around a two-column hero with a setup-guide link and copyable init command,
a dark interactive repository workspace, self-hosted Manrope/Geist Mono, neutral surfaces and one
blue accent. The latest user feedback replaced the earlier pastel/small-type design. Body copy is
16px, hero support 17px, metadata at least 12px, with consistent 400/500/600 weights and restrained
headings.

Seven tabbed demos expose 24 states, and the command playground covers all 16 public command actions
with concrete illustrative artifacts. Search, copying, responsive navigation, dark mode, keyboard
controls, reduced motion and no-JavaScript content remain functional. The page displays the user's
target stable version 1.5.0; the package version and release state were not changed.

## Files changed

- `site/index.html`: content, hero, feature examples, command catalog and metadata.
- `site/assets/landing.css`: consolidated responsive visual system and local font faces.
- `site/assets/landing.js`: command examples, responsive controls and theme compatibility with docs.
- `site/assets/fonts/`: Manrope and Geist Mono assets, upstream licenses, font log and provenance.
- `docs/40-features/F-038-landing-page/`: requirements/plan, tasks, test plan, review and this
  report.
- `docs/30-modules/website/`: module ownership, boundaries, decisions, tasks and verification.

Documentation-page assets, CLI behavior, package dependencies and Git configuration are unchanged.
The unused assistant-added Geist Sans draft font was moved to the temporary review folder rather
than deleted. No existing user files were removed.

## Tests Run

| Command or check                                                                            | Result                                                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `env -u NO_COLOR pnpm test:run`                                                             | 659 tests in 90 files passed, including binary integration tests                      |
| `pnpm typecheck`                                                                            | Passed                                                                                |
| `pnpm lint`                                                                                 | Passed; landing JS also checked separately because site assets are outside lint scope |
| `pnpm build`                                                                                | Passed                                                                                |
| `node --check site/assets/landing.js`                                                       | Passed                                                                                |
| `pnpm exec prettier --check site/index.html site/assets/landing.css site/assets/landing.js` | Passed                                                                                |
| `node scripts/site/check-commands.mjs`                                                      | All 16 public actions and displayed options valid; no retired commands                |
| `node scripts/site/check-transcripts.mjs`                                                   | 381 site transcript lines match recorded output                                       |
| `git diff --check`                                                                          | Passed                                                                                |
| `node dist/cli.js doctor --json`                                                            | Exit 1: zero errors, eight advisory warnings, 15 informational findings               |
| Equivalent read-only secret scan of site diff                                               | Zero candidates                                                                       |

An initial unmodified `pnpm test:run` invocation had one forced-color binary assertion fail because
the environment defines `NO_COLOR` as an empty value. The CLI intentionally honors that variable.
Removing it for the test process produced the passing full-suite result above; no source or test was
changed to hide the environment conflict.

Browser QA used Chromium through `agent-browser`, with temporary executable checks and screenshots
under `/tmp/persist-landing-Kk2eUl7n/`:

- No page overflow at 320, 375, 390, 621, 768, 1024, 1440 and 1920 CSS pixels.
- All 40 tab/command states checked at 320, 390, 768 and 1440 without horizontal overflow.
- All command selections update scenario, command, result, artifact and copy target correctly.
- Horizontal/vertical arrow keys, Home/End, command search and empty result, modal Escape/focus
  return, successful copy feedback, mobile disclosure and breakpoint reset passed.
- Theme persistence passed in both directions between landing and documentation pages.
- Both local fonts loaded. Computed type audit passed at 320–1440: no visible text below 12px, 16px
  body, 17px hero support, consistent weights, one hero link and no removed eyebrow.
- Light/dark computed text-contrast estimates had no failures. Reduced motion is honored.
- JavaScript-disabled 320px view remains readable, installation is visible, and all 16 catalog
  entries can be revealed using the native disclosure, without overflow.
- Inventoried 31 unique href/src values; all local files and anchors resolve. No duplicate IDs,
  missing tab panels, broken anchors, unlabeled buttons or browser errors found.
- Independent fresh-context visual review returned PASS on desktop/tablet/mobile/dark mode.

## Results

The final implementation meets the recorded feature and browser acceptance criteria. The Humanizer
pass kept the copy concrete and removed the rejected hero wording; the frontend design workflow
added a separate visual evaluation. Conventions and architecture review found no drift beyond the
documented static presentation and font changes. Security review accepts the scoped change.

Doctor warnings are documented in REVIEW.md: one inactive-clone-hooks warning and seven fence
notices for landing source/font assets. This website task does not activate Git hooks, invent
historical human fence rationales, or alter protected CLI behavior. Doctor's context-card check
reports not evaluated because this repository has no Context Cards.

Latest screenshots: `cta-row-desktop.png` and `cta-row-mobile.png` in the temporary review folder.
Live local preview: `http://127.0.0.1:4173/index.html?v=1.5.0-r5`.

## Hero action refinement

The user approved the r3 composition and then requested a copyable init command, allowing two useful
actions. The r5 change is limited to hero markup/styles and asset cache keys; browser JavaScript is
unchanged. Following feedback on the stacked arrangement, a horizontal wrapping flex row places
`Read setup guide`, which links to the existing docs, beside a selectable
`npx persist-os@latest init` strip with a 44px copy target. Support-to-action spacing is 20px and
the two controls are 12px apart. Existing clipboard handling provides success and failure feedback.

Re-ran the full 659-test suite, typecheck, lint, build, syntax, formatting, command/transcript and
local-link checks successfully. Browser regression checks passed across the prior layout/type
matrix, all 40 demo states, navigation, search, themes and light/dark contrast estimates. A new
focused hero check verified exact clipboard content, Enter activation, preserved focus, accurate
failure feedback when both clipboard paths are denied, and 44px targets at 320 through 1920px. The
320px no-JavaScript view keeps the guide link and selectable command, hides the inactive copy
control and has no overflow. The Doctor result remains zero errors and eight documented advisory
warnings. Row-alignment and equal-height assertions passed at 768, 1024, 1440 and 1920px, with
readable wrapping at 320 and 390px. The independent r5 visual review returned PASS for the
horizontal row, phone wrapping, light/dark themes, focus and copied states. The Humanizer pass kept
the action label direct; the frontend-design workflow added this independent review.

## Documentation and standards

Requirements, acceptance criteria, architecture impact and test expectations were recorded before
implementation and updated with the user's revisions. Website module memory now documents local
assets, sample-only interactions, progressive enhancement and ownership. No ADR, migration, runtime
API, telemetry or dependency addition was needed. Upstream font licensing/provenance was verified.
Repository editing and review standards were followed.

## Limits and follow-up

- Chromium responsive emulation was exercised; physical devices, Safari, Firefox and a real screen
  reader were not tested. Contrast estimates and DOM checks are not a formal accessibility audit.
- Only one model provider was available. The design evaluator was independent and fresh-context, but
  not cross-provider. Its remaining text-wrapping suggestions are minor and non-blocking.
- The repository secret-scan helper's `--file` parser returned usage; equivalent patterns were
  applied read-only to the diff. The unrelated helper was left unchanged.
- No deployment, commit, npm publication, package bump or release-readiness claim for v1.5.0 was
  made. Publishing the website and stable package remains a separate human-directed step.
