import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createTempRoot,
  listRelativeFiles,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

function card(
  title: string,
  answers: string[],
  startHere: string[],
  appliesTo: string[] = startHere,
): string {
  return [
    `# ${title}`,
    "",
    "## Purpose",
    "",
    "A test area.",
    "",
    "## Answers",
    "",
    ...answers.map((a) => `- ${a}`),
    "",
    "## Also Known As",
    "",
    "- testarea",
    "",
    "## Start Here",
    "",
    ...startHere.map((s) => `- \`${s}\``),
    "",
    "## Rules",
    "",
    "- ADR-0001 — a recorded decision about the test area",
    "",
    "## Pitfalls",
    "",
    "- LESSONS: the test area bites when fed empty input",
    "",
    "## Applies To",
    "",
    ...appliesTo.map((s) => `- \`${s}\``),
    "",
  ].join("\n");
}

describe("persist context", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function repoWithCard(prefix = "context-find"): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/billing.md"),
      card(
        "Billing",
        ["make the invoice total fair", "who pays the extra cent on invoices"],
        ["src/lib/billing.ts"],
      ),
      "utf8",
    );
    return rootDir;
  }

  it("points at the card with matched terms, start here, rules, and pitfalls", async () => {
    const rootDir = await repoWithCard();

    const result = await runCommand(rootDir, ["context", "who pays the extra cent"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Start here for "who pays the extra cent":');
    expect(result.stdout).toContain("Billing");
    expect(result.stdout).toContain("docs/context/billing.md");
    expect(result.stdout).toContain("matched:");
    expect(result.stdout).toContain("src/lib/billing.ts");
    expect(result.stdout).toContain("Rules:");
    expect(result.stdout).toContain("Pitfall:");
  });

  it("emits the same content as JSON", async () => {
    const rootDir = await repoWithCard();

    const result = await runCommand(rootDir, ["context", "who pays the extra cent", "--json"]);

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as {
      task: string;
      matched: boolean;
      cards: { title: string; file: string }[];
    };
    expect(parsed.matched).toBe(true);
    expect(parsed.cards[0]?.title).toBe("Billing");
    expect(parsed.cards[0]?.file).toBe("docs/context/billing.md");
  });

  it("stays silent when only the file-name bridge fires", async () => {
    // "saved" stems to the tracked file's name, but the card covers it only
    // through Applies To — no card line says it. The old boost showed the
    // card with an empty matched line; now nothing clears the threshold.
    const rootDir = await createTempRoot("context-find-bridge-silent");
    roots.push(rootDir);
    execFileSync("git", ["init", "-q"], { cwd: rootDir, stdio: "ignore" });
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/reports.md"),
      card("Reports", ["monthly sales summary"], ["src/reports/index.ts"], ["src/reports/**"]),
      "utf8",
    );
    await mkdir(path.join(rootDir, "src/reports"), { recursive: true });
    await writeFile(
      path.join(rootDir, "src/reports/saved-analytics-routes.ts"),
      "export const routes = 1;\n",
      "utf8",
    );
    execFileSync("git", ["add", "-A"], { cwd: rootDir, stdio: "ignore" });

    const result = await runCommand(rootDir, ["context", "saved"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No recorded memory matches this task.");
  });

  it("names the bridged file behind a genuine match", async () => {
    const rootDir = await createTempRoot("context-find-bridge-named");
    roots.push(rootDir);
    execFileSync("git", ["init", "-q"], { cwd: rootDir, stdio: "ignore" });
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/reports.md"),
      card("Reports", ["monthly sales summary"], ["src/reports/index.ts"], ["src/reports/**"]),
      "utf8",
    );
    await mkdir(path.join(rootDir, "src/reports"), { recursive: true });
    await writeFile(
      path.join(rootDir, "src/reports/saved-analytics-routes.ts"),
      "export const routes = 1;\n",
      "utf8",
    );
    execFileSync("git", ["add", "-A"], { cwd: rootDir, stdio: "ignore" });

    const result = await runCommand(rootDir, ["context", "monthly summary saved"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("(via src/reports/saved-analytics-routes.ts)");
  });

  it("says plainly when nothing matches, and still exits 0", async () => {
    const rootDir = await repoWithCard();

    const result = await runCommand(rootDir, ["context", "write a haiku about spring"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No recorded memory matches this task.");
  });

  it("falls back to recorded decisions and fences, marked as such", async () => {
    const rootDir = await createTempRoot("context-find-secondary");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/adrs"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/adrs/ADR-0001-thresholds.md"),
      [
        "# ADR-0001: Retry thresholds",
        "",
        "## Status",
        "",
        "Accepted",
        "",
        "## Decision",
        "",
        "Retries use exponential backoff with jitter.",
        "",
        "## Applies To",
        "",
        "- `src/lib/retry.ts`",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = await runCommand(rootDir, ["context", "exponential backoff jitter retries"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No context card covers this task.");
    expect(result.stdout).toContain("ADR-0001");
  });

  it("is byte-identical across runs", async () => {
    const rootDir = await repoWithCard();

    const first = await runCommand(rootDir, ["context", "who pays the extra cent"]);
    const second = await runCommand(rootDir, ["context", "who pays the extra cent"]);

    expect(first.exitCode).toBe(0);
    expect(second.stdout).toBe(first.stdout);
  });

  it("orders tied cards by path", async () => {
    const rootDir = await repoWithCard("context-find-ties");
    await writeFile(
      path.join(rootDir, "docs/context/accounting.md"),
      card(
        "Accounting",
        ["make the invoice total fair", "who pays the extra cent on invoices"],
        ["src/lib/accounting.ts"],
      ),
      "utf8",
    );

    const result = await runCommand(rootDir, ["context", "who pays the extra cent on invoices"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.indexOf("docs/context/accounting.md")).toBeLessThan(
      result.stdout.indexOf("docs/context/billing.md"),
    );
  });

  it("honours --limit", async () => {
    const rootDir = await repoWithCard("context-find-limit");
    await writeFile(
      path.join(rootDir, "docs/context/accounting.md"),
      card(
        "Accounting",
        ["make the invoice total fair", "who pays the extra cent on invoices"],
        ["src/lib/accounting.ts"],
      ),
      "utf8",
    );

    const result = await runCommand(rootDir, [
      "context",
      "who pays the extra cent on invoices",
      "--limit",
      "1",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).not.toContain("docs/context/billing.md");
  });

  it("refuses outside an initialised repository", async () => {
    const rootDir = await createTempRoot("context-find-no-repo");
    roots.push(rootDir);

    const result = await runCommand(rootDir, ["context", "who pays the extra cent"]);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/init/);
  });

  it("refuses an empty task", async () => {
    const rootDir = await repoWithCard("context-find-empty");

    const result = await runCommand(rootDir, ["context", "   "]);

    expect(result.exitCode).not.toBe(0);
  });

  it("still routes context add beside the lookup", async () => {
    const rootDir = await repoWithCard("context-find-add");

    const result = await runCommand(rootDir, [
      "context",
      "add",
      "refunds",
      "--purpose",
      "How money flows back.",
    ]);

    expect(result.exitCode).toBe(0);
    expect(await listRelativeFiles(rootDir)).toContain("docs/context/refunds.md");
  });
});

/**
 * A card paraphrases its rules, and a paraphrase drifts. In a rehearsal an agent was handed
 * "ADR-0001 — money is integer cents", never opened the ADR, and did float division that its
 * Decision ("including intermediate calculations") forbade. The lookup now quotes the Decision
 * itself, read from the ADR, first under the card, for every ADR the card's area falls under.
 */
describe("persist context quotes governing decisions", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function readText(rootDir: string, relative: string): Promise<string> {
    const { readFile } = await import("node:fs/promises");
    return readFile(path.join(rootDir, relative), "utf8");
  }

  async function acceptAdr(
    rootDir: string,
    title: string,
    slug: string,
    decision: string,
    appliesTo: string[],
  ): Promise<void> {
    await runCommand(rootDir, ["adr", "create", title]);
    const { readdir } = await import("node:fs/promises");
    const file = (await readdir(path.join(rootDir, "docs/adrs"))).find((name) =>
      name.endsWith(`-${slug}.md`),
    );
    const relative = `docs/adrs/${file}`;
    const content = await readText(rootDir, relative);
    await writeFile(
      path.join(rootDir, relative),
      content
        .replace(/## Decision\n\n[\s\S]*?\n\n## /u, `## Decision\n\n${decision}\n\n## `)
        .replace(
          /## Applies To\n\n[\s\S]*?\n\n## /u,
          `## Applies To\n\n${appliesTo.map((p) => `- \`${p}\``).join("\n")}\n\n## `,
        ),
      "utf8",
    );
    await runCommand(rootDir, ["adr", "accept", slug]);
  }

  async function repo(prefix: string, rules: string[]): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    const body = card(
      "Billing",
      ["who pays the extra cent on invoices"],
      ["src/lib/billing.ts"],
    ).replace("- ADR-0001 — a recorded decision about the test area", rules.join("\n"));
    await writeFile(path.join(rootDir, "docs/context/billing.md"), body, "utf8");
    return rootDir;
  }

  it("quotes a cited ADR's Decision from the ADR, not the card's paraphrase", async () => {
    const rootDir = await repo("context-cited", ["- ADR-0001 — money stuff"]);
    await acceptAdr(
      rootDir,
      "Money is integer cents",
      "money-is-integer-cents",
      "Every amount is integer cents, including intermediate calculations.",
      [],
    );

    const result = await runCommand(rootDir, ["context", "who pays the extra cent"]);

    expect(result.stdout).toContain(
      "Follow ADR-0001 (Money Is Integer Cents): Every amount is integer cents, including intermediate calculations.",
    );
    // The paraphrase is dropped rather than shown beside the real rule.
    expect(result.stdout).not.toContain("money stuff");
  });

  it("quotes an ADR that governs the card's files even when the card never cites it", async () => {
    const rootDir = await repo("context-governed", ["- CONVENTIONS: use the shared helper"]);
    await acceptAdr(
      rootDir,
      "Invoices are immutable",
      "invoices-are-immutable",
      "An issued invoice is never edited; corrections are new credit notes.",
      ["src/lib/**"],
    );

    const result = await runCommand(rootDir, ["context", "who pays the extra cent"]);

    expect(result.stdout).toContain(
      "Follow ADR-0001 (Invoices Are Immutable): An issued invoice is never edited; corrections are new credit notes.",
    );
    expect(result.stdout).toContain("Rules: CONVENTIONS: use the shared helper");
  });

  it("puts the decision before the file pointers, so a byte cap never cuts it", async () => {
    const rootDir = await repo("context-order", ["- ADR-0001 — money stuff"]);
    await acceptAdr(
      rootDir,
      "Money is integer cents",
      "money-is-integer-cents",
      "Every amount is integer cents.",
      [],
    );

    const out = (await runCommand(rootDir, ["context", "who pays the extra cent"])).stdout;

    expect(out.indexOf("Follow ADR-0001")).toBeGreaterThan(-1);
    expect(out.indexOf("Follow ADR-0001")).toBeLessThan(out.indexOf("src/lib/billing.ts"));
  });

  it("never quotes a superseded decision", async () => {
    const rootDir = await repo("context-superseded", ["- ADR-0001 — money stuff"]);
    await acceptAdr(
      rootDir,
      "Money is integer cents",
      "money-is-integer-cents",
      "Every amount is integer cents.",
      [],
    );
    await runCommand(rootDir, [
      "adr",
      "supersede",
      "money-is-integer-cents",
      "Money is minor units per currency",
    ]);

    const result = await runCommand(rootDir, ["context", "who pays the extra cent"]);

    expect(result.stdout).not.toContain("Follow ADR-0001");
  });
});
