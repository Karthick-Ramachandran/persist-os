# Supply Chain Security

## Package Boundary

SpecForge will be distributed through npm. The package must be small, inspectable, and deterministic.

## MVP Controls

- Use a lockfile.
- Keep production dependencies minimal.
- Prefer well-maintained packages with clear licenses.
- Run tests and build in CI before release.
- Verify package contents before publish.
- Do not use postinstall scripts.
- Do not download templates at runtime.
- Do not install dependencies into user projects.

## Release Evidence

Every release must record:

- Commit or source revision.
- Package version.
- Build command.
- Test command results.
- Security test results.
- Package contents review.
- Known risks.

## Future Risks

Community presets, plugins, remote registries, and MCP integrations expand the supply chain. Each requires RFC or ADR review before implementation.
