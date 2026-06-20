# Acceptance Criteria: Recall Adopt

## Inspection

- In a repository with `package.json` and `pnpm-lock.yaml`, adopt detects JavaScript/TypeScript and
  pnpm.
- In a repository with a `next` dependency, adopt detects Next.js as a framework.
- In a repository with `pyproject.toml` or `requirements.txt` containing `fastapi`, adopt detects
  Python and FastAPI.
- Adopt detects the presence of tests and a README.
- Inspection reads only manifest and marker files; it never executes repository code.

## Output

- Adopt writes `docs/adopt/ADOPTION_REPORT.md` listing detected signals and proposed decisions.
- Every proposed decision in the report is marked as proposed and requiring human review.
- Each detected framework produces a proposed ADR under `docs/adrs/proposed/` with
  `## Status\n\nProposed`.
- Adopt produces no accepted ADR.

## Safety

- Existing files are skipped unless `--force`; `--dry-run` writes nothing.
- All writes resolve inside the project root and reuse symlink and path-traversal protection.
- A repository with no `.recall/config.json` is adopted using default paths.

## Regression

- The full test suite passes and Doctor still passes on this repository.
