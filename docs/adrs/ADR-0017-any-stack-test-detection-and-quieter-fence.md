# ADR-0017: Test Detection for Any Stack and a Quieter Fence

## Status

Proposed

## Context

Persist is framework-neutral in its memory, but two automatic behaviours assume a JavaScript
repository:

1. **Test and lint detection reads only `package.json`.** On Laravel, Django, Rails, Go, or Rust,
   `init` finds no test command, so the pre-push test gate starts switched off and the user has to
   know to set `testCommand` by hand.
2. **The Chesterton fence is noisy on framework layouts.** It warns on brand-new files — every new
   migration or controller "crosses the fence", though a new file has no existing logic to
   misunderstand — and its built-in skip list misses common generated folders such as Laravel's
   `bootstrap/cache/` and Symfony's `var/cache/`.

`persist adopt` already recognises Laravel, Symfony, Django, FastAPI, Flask, Rails, Gin, Echo,
Fiber, Chi, Actix, Axum, and Rocket, and 1.4.1 made the doctor's code checks follow any top-level
folder. This ADR closes the remaining two gaps.

## Decision

**Detection proposes one runnable command per stack, first match winning.** Detection is a proposal
saved as a config value the user can edit; it only ever picks a one-shot command, never a watch
mode; when nothing is safe to pick it returns null rather than guessing — a loud unconfigured gate
beats a hanging hook. Within a stack the first matching rule wins; across stacks the order is
composer, Python, Go, Rust, Ruby, `package.json`, Makefile. A `package.json` with a usable test
script outranks only the Makefile. `init` prints what it chose and what else it detected, so the
choice is visible and easy to change:

| Stack signal                                                                                         | Test command                                                                                | Push gates (only when the tool is clearly set up)                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `composer.json` with a `scripts.test` entry                                                          | `composer test`                                                                             |                                                                                                                                      |
| `composer.json` requiring `laravel/framework`, and an `artisan` file                                 | `php artisan test`                                                                          | `vendor/bin/pint --test` if `laravel/pint` is required; `vendor/bin/phpstan analyse` if `phpstan.neon` or `phpstan.neon.dist` exists |
| `composer.json` requiring `pestphp/pest`                                                             | `vendor/bin/pest`                                                                           | same PHP gates as above                                                                                                              |
| `composer.json` requiring `phpunit/phpunit`                                                          | `vendor/bin/phpunit`                                                                        | same PHP gates as above                                                                                                              |
| `pyproject.toml`, `requirements*.txt`, or `setup.cfg` naming `pytest`, or a `[tool.pytest…]` section | `pytest`, prefixed `uv run` when `uv.lock` exists or `poetry run` when `poetry.lock` exists | `ruff check .` if ruff is configured or listed; `mypy .` if a mypy config exists                                                     |
| Django (`manage.py` present) without pytest                                                          | `python manage.py test`                                                                     | same Python gates                                                                                                                    |
| `go.mod`                                                                                             | `go test ./...`                                                                             | `go vet ./...`                                                                                                                       |
| `Cargo.toml`                                                                                         | `cargo test`                                                                                | `cargo clippy -- -D warnings` only if `clippy.toml` or `.clippy.toml` exists                                                         |
| `Gemfile` listing `rspec` or `rspec-rails`                                                           | `bundle exec rspec`                                                                         | `bundle exec rubocop` if `.rubocop.yml` exists                                                                                       |
| `Gemfile` listing `rails`, no rspec                                                                  | `bin/rails test`                                                                            | same Ruby gate                                                                                                                       |
| `package.json` (unchanged)                                                                           | as before                                                                                   | as before                                                                                                                            |
| `Makefile` with a `test:` target, and nothing above matched                                          | `make test`                                                                                 |                                                                                                                                      |

A JavaScript-only repository resolves byte-identically to 1.4.1. Detection only reads files; it
never runs `composer`, `pip`, `go`, or any other tool.

**The fence ignores added files.** A file with status `A` in the change has no existing logic to
misunderstand, so it is never a crossing — in the staged set, the unpushed commits, and the working
tree alike. The change set carries each path's status (parsed from `--name-status -z`, renames
judged as their new path); modified and copied files behave as before. The built-in skip list grows
with generated and cache folders that are never logic — `bootstrap/cache/`, `storage/framework/`,
`var/cache/`, `__pycache__/`, `.pytest_cache/`, `node_modules/`, `.turbo/`, `.svelte-kit/`,
`.nuxt/`, `.output/`, `tmp/cache/` — in one visible constant, still unconfigurable (ADR-0010).
Configuration and migration folders (`config/`, `database/migrations/`, Rails
`config/initializers/`) stay in scope: they can hold real logic, and editing an old migration is
exactly the change the fence exists for. The governing-ADRs check keeps judging added files — a new
file under an ADR's Applies To paths still gets the decision named.

## Applies To

- `src/core/hooks/detect-gates.ts`
- `src/commands/init.ts`
- `src/core/doctor/change-set.ts`
- `src/core/doctor/checks/fence-check.ts`
- `src/core/doctor/checks/governing-adrs-check.ts`

## Alternatives Considered

- **Union the gates of every detected stack.** Rejected: a Laravel app with a Vite `package.json`
  would inherit `npm run lint` alongside Pint with no evidence either is the project's gate. One
  winning stack keeps the proposal reviewable.
- **Skip migration and config folders wholesale.** Rejected: those hold real logic, and editing an
  old migration is precisely a fence crossing. New files are already quiet by status, so the noisy
  case (new migrations) needs no folder skip.
- **Make the fence scope configurable.** Rejected (ADR-0010): a scope set wrong disables the fence
  silently. The list stays in one visible constant instead.

## Consequences

**Improves.** Non-JavaScript repositories get a working pre-push test gate out of the box instead of
a gate that starts switched off; framework repositories stop being warned about new files and
generated caches.

**Worsens.** One more detection table to keep honest as ecosystems move; each new stack rule is a
new surface for a wrong-but-confident proposal, mitigated by the proposed-not-accepted standing of
every detected value.

**Risks.** A wrong precedence choice in a monorepo picks the wrong runner — mitigated by printing
every detected stack alongside the choice, so the fix is one config edit.

## Related Documents

- Product: `docs/00-product/PRODUCT.md`
- Architecture: `docs/10-architecture/ARCHITECTURE.md`
- Security: `docs/20-security/SECURITY_MODEL.md`
- Feature: `docs/50-quality/QUALITY_GATES.md`
- Related: [ADR-0009](ADR-0009-gates-verify-tests-pass.md),
  [ADR-0010](ADR-0010-chestertons-fence.md), [ADR-0011](ADR-0011-one-zero-stability-contract.md)
