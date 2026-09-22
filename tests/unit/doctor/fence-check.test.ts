import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkFence, isInScope } from "../../../src/core/doctor/checks/fence-check.js";
import type { DoctorCheckContext } from "../../../src/core/doctor/doctor-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("checkFence", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  function contextFor(rootDir: string, fenceEnabled = true): DoctorCheckContext {
    return {
      rootDir,
      config: {
        docsDir: "docs",
        featuresDir: "docs/40-features",
        modulesDir: "docs/30-modules",
        adrDir: "docs/adrs",
        fenceEnabled,
      },
    };
  }

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  function git(rootDir: string, args: string[]): void {
    execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
  }

  function commitAll(rootDir: string, message: string): void {
    git(rootDir, ["config", "user.email", "test@example.com"]);
    git(rootDir, ["config", "user.name", "Test"]);
    git(rootDir, ["add", "-A"]);
    git(rootDir, ["commit", "-q", "-m", message, "--no-verify"]);
  }

  /**
   * Stage an edit of a tracked file: the crossing case. A staged brand-new file is never a
   * crossing (it has no existing logic to misunderstand), so crossing tests must modify.
   */
  async function stageSource(rootDir: string, relativePath = "src/billing.ts"): Promise<string> {
    git(rootDir, ["init"]);
    await write(rootDir, relativePath, "export const x = 1;\n");
    commitAll(rootDir, "base");
    await write(rootDir, relativePath, "export const x = 2;\n");
    git(rootDir, ["add", relativePath]);
    return relativePath;
  }

  it("warns on a staged in-scope file with no fence and no ADR reference", async () => {
    const rootDir = await createRoot("fence-crossing");
    const staged = await stageSource(rootDir);

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome).toEqual({ id: "fence", status: "evaluated" });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "warning", check: "fence", path: staged });
  });

  it("stays quiet for a staged brand-new file: nothing existing to misunderstand", async () => {
    const rootDir = await createRoot("fence-added");
    git(rootDir, ["init"]);
    await write(rootDir, "src/fresh.ts", "export const fresh = 1;\n");
    git(rootDir, ["add", "src/fresh.ts"]);

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome).toEqual({ id: "fence", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("judges a staged rename as its new path", async () => {
    const rootDir = await createRoot("fence-rename");
    git(rootDir, ["init"]);
    await write(rootDir, "src/old.ts", "export const old = 1;\n");
    commitAll(rootDir, "base");
    git(rootDir, ["mv", "src/old.ts", "src/new.ts"]);

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "warning", check: "fence", path: "src/new.ts" });
  });

  it("stays quiet for a staged new file even under a modified old migration", async () => {
    // The pair that proves both halves: the new migration is added (quiet) while the edited
    // old migration still crosses.
    const rootDir = await createRoot("fence-migrations");
    git(rootDir, ["init"]);
    await write(
      rootDir,
      "database/migrations/2024_01_01_create_users_table.php",
      "<?php // create users\n",
    );
    commitAll(rootDir, "base");
    await write(
      rootDir,
      "database/migrations/2024_01_01_create_users_table.php",
      "<?php // create users, edited\n",
    );
    git(rootDir, ["add", "database/migrations/2024_01_01_create_users_table.php"]);
    await write(rootDir, "database/migrations/2024_02_01_add_index.php", "<?php // new\n");
    git(rootDir, ["add", "database/migrations/2024_02_01_add_index.php"]);

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      severity: "warning",
      check: "fence",
      path: "database/migrations/2024_01_01_create_users_table.php",
    });
  });

  it("warns without FENCES.md: the file is never required", async () => {
    const rootDir = await createRoot("fence-no-file");
    await stageSource(rootDir);

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings.some((finding) => finding.severity === "warning")).toBe(true);
  });

  it("surfaces the recorded reason as info on a second crossing", async () => {
    const rootDir = await createRoot("fence-recorded");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/60-engineering/FENCES.md",
      [
        "# Fences",
        "",
        `## \`${staged}\``,
        "Why: the split exists for per-collection idempotency keys.",
        "### Crossings",
        "- 2026-09-20: kept the split; constraint confirmed by H.",
        "",
      ].join("\n"),
    );

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "info", check: "fence", path: staged });
    expect(findings[0]?.message).toContain("per-collection idempotency keys");
  });

  it("stays quiet for an ADR-referenced file", async () => {
    const rootDir = await createRoot("fence-adr-ref");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/ADR-0001-example.md",
      `# ADR-0001: Example\n\n## Status\n\nAccepted\n\nCovers \`${staged}\` and its split.\n`,
    );

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toEqual([]);
  });

  it("stays quiet for out-of-scope staged files", async () => {
    const rootDir = await createRoot("fence-scope");
    git(rootDir, ["init"]);
    const outOfScope = [
      "tests/billing.test.ts",
      "src/app.css",
      "docs/notes.md",
      "pnpm-lock.yaml",
      "dist/bundle.js",
      "package.json",
      ".persist/hooks/pre-commit",
      "bootstrap/cache/services.php",
      "storage/framework/views/cached.php",
      "var/cache/dev/app.php",
      "__pycache__/billing.pyc",
      "pkg/__pycache__/nested.pyc",
      "node_modules/acme/index.js",
    ];
    for (const file of outOfScope) {
      await write(rootDir, file, "x\n");
    }
    commitAll(rootDir, "base");
    // Modified, not added, so the quiet comes from scope — never from the added-file rule.
    for (const file of outOfScope) {
      await write(rootDir, file, "y\n");
      git(rootDir, ["add", file]);
    }

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(outcome.status).toBe("evaluated");
    expect(findings).toEqual([]);
  });

  it("reports not-evaluated with reason when the fence is disabled", async () => {
    const rootDir = await createRoot("fence-disabled");
    await stageSource(rootDir);

    const { findings, outcome } = await checkFence(contextFor(rootDir, false));

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
    expect(outcome.reason).toContain("disabled");
  });

  it("reports not-evaluated with reason outside a git work tree", async () => {
    const rootDir = await createRoot("fence-nogit");
    await write(rootDir, "src/billing.ts", "export const x = 1;\n");

    const { findings, outcome } = await checkFence(contextFor(rootDir));

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
    expect(outcome.reason).toContain("git work tree");
  });

  it("reports not-evaluated with reason when config is missing", async () => {
    const rootDir = await createRoot("fence-noconfig");

    const { findings, outcome } = await checkFence({ rootDir });

    expect(findings).toEqual([]);
    expect(outcome.status).toBe("not-evaluated");
  });
});

describe("fence ADR status", () => {
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
        fenceEnabled: true,
      },
    };
  }

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  function git(rootDir: string, args: string[]): void {
    execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
  }

  function commitAll(rootDir: string, message: string): void {
    git(rootDir, ["config", "user.email", "test@example.com"]);
    git(rootDir, ["config", "user.name", "Test"]);
    git(rootDir, ["add", "-A"]);
    git(rootDir, ["commit", "-q", "-m", message, "--no-verify"]);
  }

  async function stageSource(rootDir: string, relativePath = "src/billing.ts"): Promise<string> {
    git(rootDir, ["init"]);
    await write(rootDir, relativePath, "export const x = 1;\n");
    commitAll(rootDir, "base");
    await write(rootDir, relativePath, "export const x = 2;\n");
    git(rootDir, ["add", relativePath]);
    return relativePath;
  }

  function adrDocument(id: string, title: string, status: string, body: string): string {
    return [`# ${id}: ${title}`, "", "## Status", "", status, "", "## Decision", "", body, ""].join(
      "\n",
    );
  }

  it("stays quiet when an Accepted ADR names the file as a whole path", async () => {
    const rootDir = await createRoot("fence-accepted-names");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/ADR-0007-rounding.md",
      adrDocument("ADR-0007", "Rounding", "Accepted", `Covers \`${staged}\` and its split.`),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toEqual([]);
  });

  it("reports info naming the ADR when only a Proposed ADR names the file", async () => {
    const rootDir = await createRoot("fence-proposed-info");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/ADR-0019-tip-rounding.md",
      adrDocument("ADR-0019", "Tip rounding", "Proposed", `Covers \`${staged}\`.`),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "info", check: "fence", path: staged });
    expect(findings[0]?.message).toContain("Proposed ADR-0019");
    expect(findings[0]?.message).toContain("Tip rounding");
    expect(findings[0]?.message).toContain("pending review");
    expect(findings[0]?.message).toContain("persist fence add");
  });

  it("reports info when only a proposal under proposed/ names the file", async () => {
    const rootDir = await createRoot("fence-proposed-dir-info");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/proposed/ADR-PROPOSED-tip-rounding.md",
      adrDocument(
        "Proposed ADR",
        "Tip rounding",
        "Proposed",
        `Covers \`${staged}\` once accepted.`,
      ),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "info", check: "fence", path: staged });
    expect(findings[0]?.message).toContain("Proposed");
    expect(findings[0]?.message).toContain("pending review");
  });

  it("warns when the only naming ADR was superseded", async () => {
    const rootDir = await createRoot("fence-superseded-warns");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/ADR-0007-rounding.md",
      adrDocument(
        "ADR-0007",
        "Rounding",
        "Accepted — superseded by ADR-0020",
        `Covers \`${staged}\`.`,
      ),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "warning", check: "fence", path: staged });
  });

  it("warns when only a Rejected ADR names the file", async () => {
    const rootDir = await createRoot("fence-rejected-warns");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/ADR-0007-rounding.md",
      adrDocument("ADR-0007", "Rounding", "Rejected", `Covers \`${staged}\`.`),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "warning", check: "fence", path: staged });
  });

  it("warns when only docs/adrs/README.md names the file", async () => {
    const rootDir = await createRoot("fence-readme-warns");
    const staged = await stageSource(rootDir);
    await write(rootDir, "docs/adrs/README.md", `# ADRs\n\nSee \`${staged}\` for context.\n`);

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "warning", check: "fence", path: staged });
  });

  it("warns when an ADR names src/a.tsx and the change is src/a.ts", async () => {
    const rootDir = await createRoot("fence-near-miss-ext");
    await stageSource(rootDir, "src/a.ts");
    await write(
      rootDir,
      "docs/adrs/ADR-0007-example.md",
      adrDocument("ADR-0007", "Example", "Accepted", "Covers `src/a.tsx` and its styles."),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "warning", check: "fence", path: "src/a.ts" });
  });

  it("warns when an ADR names packages/x/src/a.ts and the change is src/a.ts", async () => {
    const rootDir = await createRoot("fence-near-miss-prefix");
    await stageSource(rootDir, "src/a.ts");
    await write(
      rootDir,
      "docs/adrs/ADR-0007-example.md",
      adrDocument(
        "ADR-0007",
        "Example",
        "Accepted",
        "Covers `packages/x/src/a.ts` in the monorepo.",
      ),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "warning", check: "fence", path: "src/a.ts" });
  });

  it.each([
    ["line-suffixed mention", "Covers `src/a.ts:12` and its split."],
    ["backticked mention", "Covers `src/a.ts` and its split."],
    ["bare mention in prose", "Covers src/a.ts and its split."],
  ])("stays quiet for a %s in an Accepted ADR", async (_label, mention) => {
    const rootDir = await createRoot("fence-mention-styles");
    await stageSource(rootDir, "src/a.ts");
    await write(
      rootDir,
      "docs/adrs/ADR-0007-example.md",
      adrDocument("ADR-0007", "Example", "Accepted", mention),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toEqual([]);
  });

  it("stays quiet when Accepted and Proposed ADRs both name the file", async () => {
    const rootDir = await createRoot("fence-accepted-wins");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/ADR-0007-rounding.md",
      adrDocument("ADR-0007", "Rounding", "Accepted", `Covers \`${staged}\`.`),
    );
    await write(
      rootDir,
      "docs/adrs/ADR-0019-tip-rounding.md",
      adrDocument("ADR-0019", "Tip rounding", "Proposed", `Also covers \`${staged}\`.`),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toEqual([]);
  });

  it("names the lowest-numbered Proposed ADR when several name the file", async () => {
    const rootDir = await createRoot("fence-lowest-proposed");
    const staged = await stageSource(rootDir);
    await write(
      rootDir,
      "docs/adrs/ADR-0021-later.md",
      adrDocument("ADR-0021", "Later", "Proposed", `Covers \`${staged}\`.`),
    );
    await write(
      rootDir,
      "docs/adrs/ADR-0019-earlier.md",
      adrDocument("ADR-0019", "Earlier", "Proposed", `Covers \`${staged}\`.`),
    );

    const { findings } = await checkFence(contextFor(rootDir));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ severity: "info", check: "fence", path: staged });
    expect(findings[0]?.message).toContain("Proposed ADR-0019");
  });
});

describe("isInScope", () => {
  it("treats source files as in scope", () => {
    expect(isInScope("src/billing.ts")).toBe(true);
    expect(isInScope("src/server/index.go")).toBe(true);
    expect(isInScope("lib/worker.py")).toBe(true);
  });

  it("excludes obvious non-logic", () => {
    expect(isInScope("tests/billing.test.ts")).toBe(false);
    expect(isInScope("src/billing.spec.ts")).toBe(false);
    expect(isInScope("src/app.css")).toBe(false);
    expect(isInScope("docs/notes.md")).toBe(false);
    expect(isInScope("docs/60-engineering/FENCES.md")).toBe(false);
    expect(isInScope("pnpm-lock.yaml")).toBe(false);
    expect(isInScope("dist/bundle.js")).toBe(false);
    expect(isInScope("package.json")).toBe(false);
    expect(isInScope("tsconfig.json")).toBe(false);
    expect(isInScope("vitest.config.ts")).toBe(false);
    expect(isInScope(".github/workflows/ci.yml")).toBe(false);
    expect(isInScope(".persist/hooks/pre-commit")).toBe(false);
  });

  it("excludes framework generated and cache folders", () => {
    expect(isInScope("bootstrap/cache/services.php")).toBe(false);
    expect(isInScope("storage/framework/views/cached.php")).toBe(false);
    expect(isInScope("var/cache/dev/app.php")).toBe(false);
    expect(isInScope("__pycache__/billing.pyc")).toBe(false);
    expect(isInScope("pkg/__pycache__/nested.pyc")).toBe(false);
    expect(isInScope("node_modules/acme/index.js")).toBe(false);
    expect(isInScope("tmp/cache/dev.txt")).toBe(false);
  });

  it("keeps configuration and migration folders in scope", () => {
    expect(isInScope("config/app.php")).toBe(true);
    expect(isInScope("config/initializers/session_store.rb")).toBe(true);
    expect(isInScope("database/migrations/2024_01_01_create_users_table.php")).toBe(true);
    expect(isInScope("src/billing.ts")).toBe(true);
  });
});
