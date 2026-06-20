# Next.js Preset Guidance

This is proposed guidance, not accepted. Convert any architecture choice into a proposed ADR, then
an accepted ADR, before treating it as repository truth.

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
