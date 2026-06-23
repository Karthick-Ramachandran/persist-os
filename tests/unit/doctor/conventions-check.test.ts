import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkConventions } from "../../../src/core/doctor/checks/conventions-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

const CONVENTIONS_PATH = "docs/60-engineering/CONVENTIONS.md";

const STUB = `# Conventions

## Canonical Primitives

Describe the named building blocks this codebase reuses — shared components, utilities, helpers,
clients, types, endpoints — and where each lives, so agents reuse them instead of reinventing.

## Rules

Some rule.
`;

const FILLED = `# Conventions

## Canonical Primitives

- \`AppButton\` (src/ui/AppButton) — the only button; never inline a styled button.
- \`apiClient\` (src/lib/api) — the shared HTTP client.

## Rules

- Never hardcode a color that has a named token.
`;

async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

describe("doctor conventions check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("is quiet on a bare repo even when CONVENTIONS.md is a stub (no work yet)", async () => {
    const rootDir = await createRoot("conv-bare");
    await write(rootDir, CONVENTIONS_PATH, STUB);

    const findings = await checkConventions({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("warns when the repo has work and CONVENTIONS.md is still a stub", async () => {
    const rootDir = await createRoot("conv-stub-work");
    await write(rootDir, CONVENTIONS_PATH, STUB);
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n");

    const findings = await checkConventions({ rootDir, config: createDefaultConfig() });

    expect(findings).toContainEqual(
      expect.objectContaining({ severity: "warning", check: "content-conventions" }),
    );
  });

  it("is quiet when the repo has work and CONVENTIONS.md is filled", async () => {
    const rootDir = await createRoot("conv-filled-work");
    await write(rootDir, CONVENTIONS_PATH, FILLED);
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n");

    const findings = await checkConventions({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });

  it("is quiet when CONVENTIONS.md does not exist", async () => {
    const rootDir = await createRoot("conv-absent");
    await write(rootDir, "docs/40-features/F-001-x/PRD.md", "# PRD\n");

    const findings = await checkConventions({ rootDir, config: createDefaultConfig() });

    expect(findings).toEqual([]);
  });
});
