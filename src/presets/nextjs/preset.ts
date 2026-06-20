import type { Preset } from "../../core/presets/preset-schema.js";

const guidance = `# Next.js Preset Guidance

This is proposed guidance, not accepted. Convert any architecture choice into a proposed ADR, then an
accepted ADR, before treating it as repository truth.

## Decision forks this stack forces

- Routing: App Router vs Pages Router.
- Rendering: Server Components and server actions vs client-heavy rendering.
- Data layer: Drizzle or Prisma with PostgreSQL vs a hosted backend.
- Styling: Tailwind CSS vs CSS Modules vs a component library.
- Testing: Vitest with Testing Library and Playwright vs other runners.

## Recommended structure (proposed)

- The App Router with route groups and colocated server components.
- A typed data layer isolated from UI components.
- Shared UI primitives and a consistent styling system.

## Testing (proposed)

- Unit and component tests with Vitest and Testing Library.
- End-to-end tests with Playwright for critical flows.
- Type-safe data access tested against a disposable database.

## Security considerations (proposed)

- Keep secrets in server-only environment variables, never in client bundles.
- Validate input on the server, including server actions and route handlers.
- Scope authentication and authorization on the server, not the client.
`;

function proposedAdr(topic: string, title: string, body: string) {
  return {
    id: `nextjs-${topic}`,
    title,
    status: "proposed" as const,
    destination: `docs/adrs/proposed/ADR-PROPOSED-nextjs-${topic}.md`,
    body,
  };
}

export const nextjsPreset: Preset = {
  id: "nextjs",
  name: "Next.js",
  description: "Opinionated Next.js opinion pack with proposed decisions only.",
  templates: [
    {
      destination: "docs/ai/presets/nextjs-guidance.md",
      description: "Next.js guidance that remains proposed until accepted.",
      content: guidance,
    },
  ],
  guidance: [
    {
      title: "Keep framework choices proposed",
      body: "Routing, rendering, data layer, styling, and testing choices must remain proposed until accepted in repository memory.",
    },
    {
      title: "Keep secrets server-side",
      body: "Never expose secrets to the client bundle, and record the data and auth approach as proposed decisions before acceptance.",
    },
  ],
  proposedDecisions: [
    proposedAdr(
      "framework",
      "Use Next.js",
      `# Proposed ADR: Use Next.js

## Status

Proposed

## Context

The team needs a React framework for a production web application.

## Decision

Consider Next.js as the application framework. This is not accepted until a human reviews and accepts
it.

## Alternatives Considered

- A Vite single-page app with a separate API.
- Remix or another framework.

## Consequences

- Server rendering, routing, and a large ecosystem.
- Couples the app to Next.js conventions.
`,
    ),
    proposedAdr(
      "routing-app-router",
      "Use the App Router",
      `# Proposed ADR: Use the App Router

## Status

Proposed

## Context

Next.js offers the App Router and the legacy Pages Router.

## Decision

Consider the App Router with Server Components, awaiting human acceptance.

## Alternatives Considered

- The Pages Router.
- A mix during migration.

## Consequences

- Server Components and nested layouts.
- Requires understanding server and client boundaries.
`,
    ),
    proposedAdr(
      "data-layer",
      "Use a typed data layer with PostgreSQL",
      `# Proposed ADR: Use a typed data layer with PostgreSQL

## Status

Proposed

## Context

The app needs a database and a typed access layer.

## Decision

Consider Drizzle or Prisma with PostgreSQL, awaiting human acceptance.

## Alternatives Considered

- A hosted backend or BaaS.
- Raw SQL.

## Consequences

- Type-safe queries and migrations.
- Adds an ORM and schema workflow.
`,
    ),
    proposedAdr(
      "styling-tailwind",
      "Use Tailwind CSS",
      `# Proposed ADR: Use Tailwind CSS

## Status

Proposed

## Context

The app needs a styling approach.

## Decision

Consider Tailwind CSS for styling, awaiting human acceptance.

## Alternatives Considered

- CSS Modules.
- A component library with its own styling.

## Consequences

- Fast, consistent utility-based styling.
- Markup includes utility classes that teams must standardize.
`,
    ),
    proposedAdr(
      "testing",
      "Use Vitest and Playwright",
      `# Proposed ADR: Use Vitest and Playwright

## Status

Proposed

## Context

The app needs unit, component, and end-to-end testing.

## Decision

Consider Vitest with Testing Library and Playwright, awaiting human acceptance.

## Alternatives Considered

- Jest.
- Cypress for end-to-end tests.

## Consequences

- Fast unit and component tests plus reliable end-to-end coverage.
- Teams maintain two test toolchains.
`,
    ),
  ],
};
