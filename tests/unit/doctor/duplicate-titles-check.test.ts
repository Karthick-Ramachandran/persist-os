import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkDuplicateTitles } from "../../../src/core/doctor/checks/duplicate-titles-check.js";
import type { DoctorCheckContext } from "../../../src/core/doctor/doctor-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("checkDuplicateTitles", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  function contextFor(rootDir: string): DoctorCheckContext {
    return {
      rootDir,
      config: {
        docsDir: "docs",
        featuresDir: "docs/40-features",
        modulesDir: "docs/30-modules",
        adrDir: "docs/adrs",
      },
    };
  }

  async function writeAdr(
    rootDir: string,
    fileName: string,
    title: string,
    status: string,
  ): Promise<void> {
    const full = path.join(rootDir, "docs/adrs", fileName);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(
      full,
      `# ${fileName.replace(/\.md$/u, "")}: ${title}\n\n## Status\n\n${status}\n`,
      "utf8",
    );
  }

  it("errors on two accepted ADRs sharing a title", async () => {
    const rootDir = await createRoot("titles-dup");
    await writeAdr(rootDir, "ADR-0001-use-postgres.md", "Use Postgres", "Accepted");
    await writeAdr(rootDir, "ADR-0003-use-postgres.md", "Use Postgres", "Accepted");

    const { findings, outcome } = await checkDuplicateTitles(contextFor(rootDir));

    expect(outcome).toEqual({ id: "duplicate-titles", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "error",
      check: "duplicate-titles",
      path: "docs/adrs/ADR-0003-use-postgres.md",
    });
    expect(findings[0]?.message).toContain("Use Postgres");
    expect(findings[0]?.message).toContain("ADR-0001-use-postgres.md");
  });

  it("warns on an accepted title with a proposed collision", async () => {
    const rootDir = await createRoot("titles-proposed");
    await writeAdr(rootDir, "ADR-0001-use-postgres.md", "Use Postgres", "Accepted");
    await writeAdr(rootDir, "ADR-0002-use-postgres.md", "Use Postgres", "Proposed");

    const { findings, outcome } = await checkDuplicateTitles(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "duplicate-titles",
      path: "docs/adrs/ADR-0002-use-postgres.md",
    });
  });

  it("treats titles differing only in case or spacing as duplicates", async () => {
    const rootDir = await createRoot("titles-normalized");
    await writeAdr(rootDir, "ADR-0001-a.md", "Use   Postgres", "Accepted");
    await writeAdr(rootDir, "ADR-0002-b.md", "use postgres ", "Accepted");

    const { findings } = await checkDuplicateTitles(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("error");
  });

  it("stays silent for distinct titles and for proposal-only collisions", async () => {
    const rootDir = await createRoot("titles-clean");
    await writeAdr(rootDir, "ADR-0001-a.md", "Use Postgres", "Accepted");
    await writeAdr(rootDir, "ADR-0002-b.md", "Use SQLite", "Proposed");
    await writeAdr(rootDir, "ADR-0003-c.md", "Use SQLite", "Proposed");

    const { findings, outcome } = await checkDuplicateTitles(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toEqual([]);
  });

  it("stays silent for a succession pair sharing a title", async () => {
    const rootDir = await createRoot("titles-succession");
    await writeAdr(
      rootDir,
      "ADR-0001-use-postgres.md",
      "Use Postgres",
      "Accepted — superseded by ADR-0002-use-postgres",
    );
    await writeAdr(rootDir, "ADR-0002-use-postgres.md", "Use Postgres", "Accepted");

    const { findings, outcome } = await checkDuplicateTitles(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toEqual([]);
  });

  it("reports not-evaluated with reason when the ADR directory is absent", async () => {
    const rootDir = await createRoot("titles-noadr");

    const { findings, outcome } = await checkDuplicateTitles(contextFor(rootDir));

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
    expect(outcome.reason).toContain("no ADR directory");
  });

  it("reports not-evaluated with reason when config is missing", async () => {
    const rootDir = await createRoot("titles-noconfig");

    const { findings, outcome } = await checkDuplicateTitles({ rootDir });

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
  });
});
