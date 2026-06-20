import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

describe("guided command output", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("init guides the user to the next actions", async () => {
    const rootDir = await createRoot("guided-init");
    const result = await runInitCommand(rootDir);

    expect(result.stdout).toContain("Next steps:");
    expect(result.stdout).toContain("recall feature create");
    expect(result.stdout).toContain("recall doctor");
  });

  it("adr create points at the file and what to fill", async () => {
    const rootDir = await createRoot("guided-adr");
    await runInitCommand(rootDir);
    const result = await runCommand(rootDir, ["adr", "create", "use-postgres"]);

    expect(result.stdout).toContain("Next steps:");
    expect(result.stdout).toContain("docs/adrs/ADR-0001-use-postgres.md");
    expect(result.stdout).toContain("Context, Decision, Alternatives, Consequences");
  });

  it("feature, module, skill, and mcp commands all guide next steps", async () => {
    const rootDir = await createRoot("guided-rest");
    await runInitCommand(rootDir);

    const feature = await runCommand(rootDir, ["feature", "create", "checkout"]);
    expect(feature.stdout).toContain("Next steps:");
    expect(feature.stdout).toContain("PRD.md");

    const module = await runCommand(rootDir, ["module", "create", "billing"]);
    expect(module.stdout).toContain("Next steps:");
    expect(module.stdout).toContain("MODULE.md");

    const skill = await runCommand(rootDir, ["skill", "create", "write-tests"]);
    expect(skill.stdout).toContain("Next steps:");

    const mcp = await runCommand(rootDir, ["mcp", "add", "figma"]);
    expect(mcp.stdout).toContain("Next steps:");
    expect(mcp.stdout).toContain("docs/ai/mcp/figma.md");
  });

  it("does not print next steps on a dry run", async () => {
    const rootDir = await createRoot("guided-dry-run");
    const result = await runInitCommand(rootDir, ["--dry-run"]);

    expect(result.stdout).not.toContain("Next steps:");
  });
});
