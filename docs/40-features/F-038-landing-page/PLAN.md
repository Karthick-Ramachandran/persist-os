# Landing page redesign

## Requirements

The public landing page should explain the complete shipped product with natural, concrete copy,
restrained typography, a coherent color palette, and responsive layouts. Readers should understand
why repository memory helps their next coding session and find installation or documentation easily.

The user identified v1.5.0 as the target stable version for this landing page. Present the target
version without asserting that publication has happened, and retain `npx persist-os@latest init` as
the primary installation command. Package version changes and release publication are outside this
website task.

## Acceptance criteria

- The page covers memory, ADR lifecycle, fences, context cards, agent integrations, workflow skills,
  Doctor, git hooks, configured tests, CI, adoption, optional features/modules, offline MCP memory,
  configurable paths and safe local writes.
- Current commands and accepted decisions govern claims. Retired presets and future functionality
  are not advertised as shipped. Illustrative examples are identified.
- Headings remain moderate; every section works at mobile, tablet and desktop widths.
- Install copy, command search, theme switching, keyboard controls and mobile navigation work.
- Interactive examples let readers explore each feature: task context, decision lifecycle, fences,
  memory files, agent targets and Doctor scenarios, with an integrated playground covering all 16
  public command actions. Each uses labeled browser-local sample data and shows commands/results.
- The page remains readable without JavaScript and honors reduced motion.
- The revised hero uses a two-column grid: direct benefit-led copy and actions on the left, an
  interactive repository/terminal workspace on the right. The workspace covers setup, adoption,
  decisions and Doctor, following the user's screenshot reference. Columns stack on small screens.
  Spacing is reviewed across every section using a consistent rhythm, compact eyebrow/title gaps,
  aligned descriptions and responsive card padding.
- The visual reset removes the hero eyebrow and fact row. The latest CTA refinement pairs a primary
  setup-guide link with a visible, copyable `npx persist-os@latest init` command, grouped beneath
  the support copy in a horizontal flex/grid row, wrapping only when space is insufficient. This
  explicitly supersedes the earlier single-action and stacked-action requirements. Keep the existing
  two-column composition and all demos. Replace mixed pastel panels with neutral surfaces and one
  blue accent. Marketing copy is at least 16px, demo text 13–14px, and metadata no smaller than
  12px, with a consistent regular/medium/semibold hierarchy.

## Architecture impact

This is an existing static website presentation change. Only the landing HTML and its isolated CSS
and JavaScript change. Documentation styles and CLI behavior are outside scope. No new dependency,
external asset fetch, telemetry or runtime API is introduced. Existing metadata and public links are
preserved or updated accurately. No ADR or migration is needed.

The user's typography refinement adds self-hosted Manrope for interface/marketing text and Geist
Mono for code, with their upstream licenses and source revisions. These require no browser request
to a third-party service or package dependency. Manrope replaces the rejected small Geist Sans
treatment from the initial design iteration.

## Source references

Use `README.md`, current CLI declarations and accepted ADRs, including ADR-0014, ADR-0015 and
ADR-0016, for shipped behavior. The older product/roadmap documents contain historical feature
counts and are not the basis for current marketing claims.

## Approach

Compose a clear developer-tool landing page with neutral surfaces, one blue accent, readable
typography, useful product examples, comprehensive feature coverage and a compact command reference.
Apply the humanizer editing pass to the finished copy. Keep existing progressive enhancements and
validate them against the new markup.

## Design references

Inspected the current [Linear landing page](https://linear.app),
[Geist design system](https://vercel.com/geist/introduction), its
[typography](https://vercel.com/geist/typography) and
[color roles](https://vercel.com/geist/colors), and [Raycast](https://www.raycast.com). Use their
product-led examples, consistent spacing, surface hierarchy and keyboard affordances as craft
references. The current palette and typography follow the latest reset described above, with
moderate heading sizes and interactive repository-memory examples.

The latest reset also inspected [Resend](https://resend.com), [Clerk](https://clerk.com),
[GitButler](https://gitbutler.com) and [Tremor](https://www.tremor.so) in a live browser. The new
direction borrows their clear hierarchy and product-led examples while retaining moderate headings,
the requested two-column hero, a clear primary CTA and Persist OS's own content.
