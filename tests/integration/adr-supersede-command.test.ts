import { readFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

describe("adr supersede command", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function acceptedAdr(rootDir: string, title: string, slug: string): Promise<void> {
    await runCommand(rootDir, ["adr", "create", title]);
    await runCommand(rootDir, ["adr", "accept", slug]);
  }

  it("marks the old ADR superseded and creates a new accepted ADR that supersedes it", async () => {
    const rootDir = await createRoot("adr-supersede");
    await runInitCommand(rootDir);
    await acceptedAdr(rootDir, "use-postgresql", "use-postgresql");

    const result = await runCommand(rootDir, ["adr", "supersede", "use-postgresql", "Use MySQL"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("superseded by ADR-0002-use-mysql");

    const oldAdr = await readFile(
      path.join(rootDir, "docs/adrs/ADR-0001-use-postgresql.md"),
      "utf8",
    );
    // Keeps "Accepted" so existing drift checks still treat it as a real, once-accepted decision.
    expect(oldAdr).toContain("## Status\n\nAccepted — superseded by ADR-0002-use-mysql");

    const newAdr = await readFile(path.join(rootDir, "docs/adrs/ADR-0002-use-mysql.md"), "utf8");
    expect(newAdr).toContain("# ADR-0002: Use MySQL");
    expect(newAdr).toContain("## Status\n\nAccepted");
    expect(newAdr).toContain("## Supersedes\n\n- ADR-0001-use-postgresql");
  });

  it("fails clearly when the target ADR is not accepted", async () => {
    const rootDir = await createRoot("adr-supersede-not-accepted");
    await runInitCommand(rootDir);
    await runCommand(rootDir, ["adr", "create", "use-postgresql"]); // proposed, not accepted

    const result = await runCommand(rootDir, ["adr", "supersede", "use-postgresql", "Use MySQL"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("is not Accepted");
  });

  it("fails clearly when no matching ADR exists", async () => {
    const rootDir = await createRoot("adr-supersede-missing");
    await runInitCommand(rootDir);

    const result = await runCommand(rootDir, ["adr", "supersede", "nonexistent", "Something"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No accepted ADR found for "nonexistent".');
  });

  it("writes nothing on a dry run", async () => {
    const rootDir = await createRoot("adr-supersede-dry-run");
    await runInitCommand(rootDir);
    await acceptedAdr(rootDir, "use-postgresql", "use-postgresql");

    await runCommand(rootDir, ["adr", "supersede", "use-postgresql", "Use MySQL", "--dry-run"]);

    const files = await listRelativeFiles(rootDir);
    expect(files).not.toContain("docs/adrs/ADR-0002-use-mysql.md");
    const oldAdr = await readFile(
      path.join(rootDir, "docs/adrs/ADR-0001-use-postgresql.md"),
      "utf8",
    );
    expect(oldAdr).toContain("## Status\n\nAccepted");
    expect(oldAdr).not.toContain("superseded by");
  });
});
