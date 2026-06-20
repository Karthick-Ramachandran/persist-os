# Tech Stack

## MVP Stack

- Language: TypeScript
- Runtime: Node.js LTS
- Package manager: pnpm
- CLI framework: Commander
- Validation: Zod
- Template engine: Eta
- Tests: Vitest
- Build: tsup
- Linting: ESLint
- Formatting: Prettier
- CI: GitHub Actions
- Distribution: npm

## Rationale

This stack supports `npx specforge init`, strong typing, deterministic builds, fast tests, and a familiar OSS contributor experience.

## Constraints

- Keep runtime dependencies small and defensible.
- Do not add production dependencies without ADR consideration.
- Prefer standard library APIs for filesystem work unless a dependency clearly reduces risk.
- Do not add dependencies that introduce network behavior in MVP runtime.
- Do not add postinstall scripts or hidden background behavior.

## Future Review

Any change to language, runtime, package manager, template engine, validation library, build system, or distribution model requires an ADR.
