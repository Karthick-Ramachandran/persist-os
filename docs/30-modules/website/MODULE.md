# Website

## Purpose and ownership

The static `site/` directory explains Persist OS and documents the shipped CLI. The landing page
owns product presentation, feature discovery, installation guidance and links into documentation.

## Boundaries

`site/index.html`, `site/assets/landing.css` and `site/assets/landing.js` own the landing
experience. Documentation pages use the separate `site/assets/site.css` and `site/assets/site.js`
assets. The site does not execute CLI commands, run models, collect analytics or connect to MCP
servers.

## Interfaces

Public documentation links, on-page anchors, copyable commands, theme preference, accessible command
search and responsive navigation. Commands in markup must exist in the built CLI.

The landing tour combines a four-scenario repository workspace with feature-specific demos and a
16-action command playground. These are labeled illustrative browser states, not CLI execution.

## Decisions and sources

Preserve a static dependency-free site and local assets. Use current CLI behavior and accepted ADRs
for claims, especially ADR-0014 (hook activation), ADR-0015 (context cards) and ADR-0016 (skills).
Keep illustrative examples visibly distinct from recorded output.

## Verification

See `docs/40-features/F-038-landing-page/TEST_PLAN.md`. Site scripts validate commands and recorded
transcripts. Browser checks cover layouts, links, accessibility and progressive enhancements.
