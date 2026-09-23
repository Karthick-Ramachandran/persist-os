import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkFence } from "../../../src/core/doctor/checks/fence-check.js";
import type { DoctorCheckContext } from "../../../src/core/doctor/doctor-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

/**
 * The purpose guard: the case ADR-0010 exists for — a write that calls four
 * collections on purpose, which an agent "simplifies" to one. Collapsing them
 * warns, and so does disabling them with a pure addition (an early `return`
 * above the four writes removes nothing and disables all four). Both must warn
 * before and after the answerable-fence release: the loop around the question
 * changed, never when it fires.
 */
describe("fence purpose guard", () => {
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

  async function write(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  function git(rootDir: string, args: string[]): void {
    execFileSync("git", args, { cwd: rootDir, stdio: "ignore" });
  }

  const FOUR_WRITES = `export async function writeLedger(db, entry) {
  await db.collection("ledger").insertOne(entry);
  await db.collection("audit").insertOne(entry);
  await db.collection("balances").updateOne({ id: entry.id }, { $set: entry });
  await db.collection("outbox").insertOne(entry);
}
`;

  async function repoWithLedger(prefix: string): Promise<string> {
    const rootDir = await createRoot(prefix);
    git(rootDir, ["init"]);
    git(rootDir, ["config", "user.email", "test@example.com"]);
    git(rootDir, ["config", "user.name", "Test"]);
    await write(rootDir, "src/ledger.ts", FOUR_WRITES);
    git(rootDir, ["add", "-A"]);
    git(rootDir, ["commit", "-q", "-m", "base", "--no-verify"]);
    return rootDir;
  }

  it("warns when four deliberate collection writes collapse into one", async () => {
    const rootDir = await repoWithLedger("fence-purpose-collapse");
    await write(
      rootDir,
      "src/ledger.ts",
      `export async function writeLedger(db, entry) {
  await db.collection("everything").insertOne(entry);
}
`,
    );
    git(rootDir, ["add", "src/ledger.ts"]);

    const { findings } = await checkFence(contextFor(rootDir));
    const fence = findings.filter((finding) => finding.check === "fence");

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "warning", path: "src/ledger.ts" });
  });

  it("warns when an early return disables the four writes without removing a line", async () => {
    const rootDir = await repoWithLedger("fence-purpose-early-return");
    await write(
      rootDir,
      "src/ledger.ts",
      `export async function writeLedger(db, entry) {
  if (entry.skip) return;
${FOUR_WRITES.slice(FOUR_WRITES.indexOf("  await"))}}`,
    );
    git(rootDir, ["add", "src/ledger.ts"]);

    const { findings } = await checkFence(contextFor(rootDir));
    const fence = findings.filter((finding) => finding.check === "fence");

    expect(fence).toHaveLength(1);
    expect(fence[0]).toMatchObject({ severity: "warning", path: "src/ledger.ts" });
  });
});
