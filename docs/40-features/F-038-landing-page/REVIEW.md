# Landing page review

## Status

Accepted. Independent visual evaluation passed; no blocking findings remain.

## Security

Scoped review of landing markup, browser JavaScript, styles and self-hosted font assets found no new
runtime API calls, third-party asset requests, telemetry, executable command path, dependency or
secret collection. Demo inputs select local sample data and update text nodes; command strings are
copied only after user action. Theme storage contains only light/dark preferences. External
new-window links retain `noopener noreferrer`. CLI file-write, path, authentication and MCP
boundaries are unchanged.

The repository secret scanner's `--file` argument parser returned usage instead of scanning the
unstaged diff. An equivalent read-only scan using the same patterns found zero candidates. The
helper was not changed as part of this website task. Font provenance and the upstream OFL license
are recorded under `site/assets/fonts/`.

Verdict for these trust boundaries: accept. Browser and visual results are recorded below and in the
completion report.

## Conventions and architecture

This separate review pass checked the canonical primitives, naming rules and anti-patterns in
`docs/60-engineering/CONVENTIONS.md`. No CLI writer, path validator, renderer, prompt, Doctor check
or terminal style primitive is reinvented. The static site keeps its existing isolated landing
assets and progressive-enhancement patterns. No new shared primitive or conventions change is
needed. Feature requirements and website module memory describe the presentation changes.

Current CLI commands and accepted ADR-0014, ADR-0015 and ADR-0016 govern product claims. Doctor
examples distinguish warnings, errors and not-evaluated checks; every simulated workspace/output is
labeled illustrative. No semantic-autopilot, server connection or unshipped command is claimed.

## Doctor warnings

The built Doctor reports no errors. Its inactive-clone-hooks warning is accepted for this task:
changing local Git configuration is outside the requested website work. Seven fence notices cover
the changed landing HTML, browser script and newly added font binaries/license/font log. These
changes were reviewed as presentation/progressive-enhancement work with upstream font licensing, not
changes to protected CLI behavior. No historical human rationale was invented to suppress those
notices.

## Visual and interaction review

The initial layout was revised following the user's screenshots and feedback about hero copy, the
repository/terminal demo, line-height and spacing. The latest requested reset has larger Manrope
text, neutral feature surfaces, consistent weights and no category eyebrow. The latest hero action
refinement pairs a setup-guide CTA with a copyable init strip in a horizontal wrapping row. Copy and
the primary action sit left of the interactive terminal, stacking on smaller screens. The
independent evaluator returned PASS after fresh desktop, tablet, mobile and dark-mode review. It
noted minor non-blocking text-wrapping refinements. Main browser checks passed all 24 tab states and
16 command examples, typography minimums, light/dark contrast estimates, keyboard controls, copy
feedback, responsive layout, theme persistence and no-JavaScript fallback. See the completion report
for commands, coverage and limits. No separate-provider evaluator was available; a fresh independent
same-provider agent was used.

The r5 CTA-row review also returned PASS after fresh browser inspection. Controls share a row and
height wherever they fit, wrap safely on phones, and retain clear focus/copy states in both themes.
Main checks verified exact clipboard text, denied-copy feedback, 44px copy targets, no-JavaScript
selection, responsive alignment and all existing demo states. The new strip reuses the existing copy
handler; no new JavaScript or trust boundary was introduced.
