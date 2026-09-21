import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkContextCards } from "../../../src/core/doctor/checks/context-cards-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

function gitAt(rootDir: string, date: string, ...args: string[]): void {
  execFileSync("git", args, {
    cwd: rootDir,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  });
}

async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
  const full = path.join(rootDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
}

function card(options: { startHere?: string[]; answers?: string[]; appliesTo?: string[] }): string {
  const section = (heading: string, items: string[]): string =>
    [`## ${heading}`, "", ...items.map((item) => `- ${item}`), ""].join("\n");
  return [
    "# Billing",
    "",
    "## Purpose",
    "",
    "Charges.",
    "",
    section("Answers", options.answers ?? ["who pays the extra cent"]),
    section("Also Known As", ["billing"]),
    section(
      "Start Here",
      (options.startHere ?? ["`src/lib/billing.ts` — charges"]).map((s) => s),
    ),
    section("Rules", ["ADR-0001 — a decision"]),
    section("Pitfalls", ["LESSONS: a mistake"]),
    section(
      "Applies To",
      (options.appliesTo ?? ["src/lib/billing.ts"]).map((p) => `\`${p}\``),
    ),
  ].join("\n");
}

describe("doctor context-cards check", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  async function initRepo(rootDir: string): Promise<void> {
    execFileSync("git", ["init"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "t@t"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "t"], { cwd: rootDir, stdio: "ignore" });
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  function check(rootDir: string) {
    return checkContextCards({ rootDir, config: createDefaultConfig() });
  }

  it("is quiet for a healthy card", async () => {
    const rootDir = await createRoot("cards-healthy");
    await write(rootDir, "src/lib/billing.ts", "export const x = 1;\n");
    await write(rootDir, "docs/context/billing.md", card({}));

    const { findings, outcome } = await check(rootDir);

    expect(outcome).toEqual({ id: "context-cards", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("warns on a Start Here path that no longer exists, naming card and path", async () => {
    const rootDir = await createRoot("cards-dead");
    await write(
      rootDir,
      "docs/context/billing.md",
      card({ startHere: ["`src/lib/gone.ts` — was here"] }),
    );

    const { findings } = await check(rootDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "context-cards",
        path: "docs/context/billing.md",
      }),
    );
    const dead = findings.find((finding) => finding.message.includes("gone.ts"));
    expect(dead?.message).toContain("docs/context/billing.md");
    expect(dead?.message).toContain("src/lib/gone.ts");
  });

  it("informs on a card with an empty Answers list", async () => {
    const rootDir = await createRoot("cards-unanswerable");
    await write(rootDir, "src/lib/billing.ts", "export const x = 1;\n");
    await write(rootDir, "docs/context/billing.md", card({ answers: [] }));

    const { findings } = await check(rootDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "info",
        check: "context-cards",
        path: "docs/context/billing.md",
      }),
    );
  });

  it("warns when covered files changed long after the card", async () => {
    const rootDir = await createRoot("cards-stale");
    await initRepo(rootDir);
    await write(rootDir, "src/lib/billing.ts", "export const x = 1;\n");
    await write(rootDir, "docs/context/billing.md", card({}));
    gitAt(rootDir, "2024-01-01T00:00:00", "add", "-A");
    gitAt(rootDir, "2024-01-01T00:00:00", "commit", "-m", "card and code together");

    await write(rootDir, "src/lib/billing.ts", "export const x = 2;\n");
    gitAt(rootDir, "2024-12-01T00:00:00", "add", "src/lib/billing.ts");
    gitAt(rootDir, "2024-12-01T00:00:00", "commit", "-m", "code moved on");

    const { findings, outcome } = await check(rootDir);

    expect(outcome).toEqual({ id: "context-cards", status: "evaluated" });
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "context-cards",
        path: "docs/context/billing.md",
      }),
    );
  });

  it("reports not-evaluated with a reason when there are no cards", async () => {
    const rootDir = await createRoot("cards-none");
    await write(rootDir, "src/lib/billing.ts", "export const x = 1;\n");

    const { findings, outcome } = await check(rootDir);

    expect(outcome.status).toBe("not-evaluated");
    expect(outcome.reason).toMatch(/no context cards/i);
    expect(findings).toEqual([]);
  });
});
