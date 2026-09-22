import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { findContext, formatFindContextResult } from "../../src/commands/context/find.js";
import { hookContext } from "../../src/commands/context/hook.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../helpers/init-test-helpers.js";

const FIXTURE = readFileSync(new URL("../fixtures/lessons-by-area.md", import.meta.url), "utf8");

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
    "- Recorded pointers for the test area",
    "",
    "## Pitfalls",
    "",
    "- The test area bites when fed empty input",
    "",
    "## Applies To",
    "",
    ...appliesTo.map((s) => `- \`${s}\``),
    "",
  ].join("\n");
}

const ADR = [
  "# ADR-0001: Per-collection idempotency keys",
  "",
  "## Status",
  "",
  "Accepted",
  "",
  "## Decision",
  "",
  "Keep per-collection idempotency keys for the ledger.",
  "",
  "## Applies To",
  "",
  "- `internal/db/**`",
  "",
].join("\n");

/** prompt → areas that must ride along → areas that must not. */
const PROMPTS: { task: string; include: string[]; exclude: string[] }[] = [
  {
    task: "add a unique mongo index for signups",
    include: ["Mongo indexes"],
    exclude: ["Auth sessions", "Push notifications", "Deploy", "API errors"],
  },
  {
    task: "E11000 duplicate key on the email index",
    include: ["Mongo indexes"],
    exclude: ["Auth sessions", "Push notifications", "Deploy"],
  },
  {
    task: "rotate refresh tokens and revoke sessions on password change",
    include: ["Auth sessions"],
    exclude: ["Mongo indexes", "Push notifications", "Deploy"],
  },
  {
    task: "FCM device token NotRegistered after app reinstall",
    include: ["Push notifications"],
    exclude: ["Mongo indexes", "Auth sessions", "Deploy"],
  },
  {
    task: "CleverTap checkout event missing from the funnel",
    include: ["Product analytics"],
    exclude: ["Mongo indexes", "Push notifications", "Fix-It jobs"],
  },
  {
    task: "run the migration before the new code serves traffic",
    include: ["Deploy"],
    exclude: ["Mongo indexes", "Auth sessions", "Fix-It jobs", "API errors"],
  },
  {
    task: "idempotent Fix-It job retries after worker restart",
    include: ["Fix-It jobs"],
    exclude: ["Deploy", "Product analytics", "API errors"],
  },
  {
    task: "return 422 field problems for validation failures",
    include: ["API errors"],
    exclude: ["Auth sessions", "Deploy", "Fix-It jobs"],
  },
  {
    task: "partialFilterExpression rejects dollar-ne filters",
    include: ["Mongo indexes"],
    exclude: ["Auth sessions", "API errors", "Deploy"],
  },
  {
    task: "session cookie flags for login",
    include: ["Auth sessions"],
    exclude: ["Mongo indexes", "Push notifications", "API errors"],
  },
  {
    task: "add a unique index on push device tokens",
    include: ["Mongo indexes", "Push notifications"],
    exclude: ["Auth sessions", "Deploy", "API errors"],
  },
  {
    task: "migrate session storage to a new compound index",
    include: ["Mongo indexes", "Auth sessions"],
    exclude: ["Push notifications", "Deploy", "Fix-It jobs"],
  },
];

describe("persist context with lessons by area", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function fixtureRepo(): Promise<string> {
    const rootDir = await createTempRoot("context-lessons");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await mkdir(path.join(rootDir, "docs/context"), { recursive: true });
    await writeFile(
      path.join(rootDir, "docs/context/database.md"),
      card(
        "Database",
        ["add a unique mongo index for signups", "backfill rows before enforcing uniqueness"],
        ["internal/db/indexes.ts"],
      ),
      "utf8",
    );
    await writeFile(
      path.join(rootDir, "docs/context/authentication.md"),
      card(
        "Authentication",
        [
          "rotate the session credential on every use",
          "log out everywhere after a password change",
        ],
        ["src/auth/session.ts"],
      ),
      "utf8",
    );
    await mkdir(path.join(rootDir, "docs/adrs"), { recursive: true });
    await writeFile(path.join(rootDir, "docs/adrs/ADR-0001-ledger-keys.md"), ADR, "utf8");
    await writeFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), FIXTURE, "utf8");
    return rootDir;
  }

  it.each(PROMPTS)('hands over $include for "$task"', async ({ task, include, exclude }) => {
    const rootDir = await fixtureRepo();
    const result = await runCommand(rootDir, ["context", task]);

    expect(result.exitCode).toBe(0);
    for (const area of include) {
      expect(result.stdout, `expected area "${area}"`).toContain(`Lesson — ${area}`);
    }
    for (const area of exclude) {
      expect(result.stdout, `unexpected area "${area}"`).not.toContain(`Lesson — ${area}`);
    }
    // The index line names the rest so the agent knows where to look.
    expect(result.stdout).toContain("More lessons:");
    expect(result.stdout).toContain("docs/60-engineering/LESSONS.md");
    // One blank line between blocks, never two (the lessons-only header once doubled it).
    expect(result.stdout).not.toContain("\n\n\n");
  });

  it("shows at most 3 bullets per area and at most 2 areas", async () => {
    const rootDir = await fixtureRepo();
    const found = await findContext({
      rootDir,
      task: "migrate session storage to a new compound index",
    });

    expect(found.lessons.length).toBeLessThanOrEqual(2);
    for (const lesson of found.lessons) {
      expect(lesson.bullets.length).toBeLessThanOrEqual(3);
    }
  });

  it("orders decisions, Start Here files, then lessons", async () => {
    const rootDir = await fixtureRepo();
    const result = await runCommand(rootDir, ["context", "add a unique mongo index for signups"]);

    const decision = result.stdout.indexOf("Follow ADR-0001");
    const startHere = result.stdout.indexOf("internal/db/indexes.ts");
    const lesson = result.stdout.indexOf("Lesson — Mongo indexes");
    expect(decision).toBeGreaterThanOrEqual(0);
    expect(startHere).toBeGreaterThan(decision);
    expect(lesson).toBeGreaterThan(startHere);
  });

  it("carries area and file for each lesson in JSON", async () => {
    const rootDir = await fixtureRepo();
    const result = await runCommand(rootDir, [
      "context",
      "add a unique mongo index for signups",
      "--json",
    ]);

    const parsed = JSON.parse(result.stdout) as {
      matched: boolean;
      lessons: { area: string; file: string; bullets: string[] }[];
      moreLessons: string[];
      lessonsFile: string;
    };
    expect(parsed.matched).toBe(true);
    expect(parsed.lessons.length).toBeGreaterThan(0);
    expect(parsed.lessons.length).toBeLessThanOrEqual(2);
    for (const lesson of parsed.lessons) {
      expect(lesson.area).toMatch(/.+/u);
      expect(lesson.file).toBe("docs/60-engineering/LESSONS.md");
      expect(lesson.bullets.length).toBeLessThanOrEqual(3);
    }
    expect(parsed.lessonsFile).toBe("docs/60-engineering/LESSONS.md");
    expect(parsed.moreLessons.length).toBeGreaterThan(0);
  });

  it("names an area outright with a single rare term below the bar", async () => {
    // `E11000` alone scores under the area bar, but it sits in exactly one
    // area's Also Known As and nowhere else — that is a name, not noise.
    const rootDir = await fixtureRepo();
    const result = await runCommand(rootDir, ["context", "E11000"]);

    expect(result.stdout).toContain("Lesson — Mongo indexes");
    expect(result.stdout).not.toContain("Lesson — Auth sessions");
    expect(result.stdout).not.toContain("\n\n\n");
  });

  it("stays silent about lessons for an unrelated task", async () => {
    const rootDir = await fixtureRepo();
    const result = await runCommand(rootDir, ["context", "rename the settings button component"]);

    expect(result.stdout).not.toContain("Lesson —");
    expect(result.stdout).not.toContain("More lessons:");
  });

  it("reads a flat LESSONS.md exactly as before", async () => {
    const rootDir = await createTempRoot("context-lessons-flat");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await writeFile(
      path.join(rootDir, "docs/60-engineering/LESSONS.md"),
      [
        "# Lessons",
        "",
        "- Billing recounts the invoice total from line items every night.",
        "- Refunded orders stay out of the nightly revenue rollup.",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = await runCommand(rootDir, ["context", "invoice line items total"]);

    expect(result.stdout).toContain("lesson LESSONS");
    expect(result.stdout).toContain("Billing recounts the invoice total");
    expect(result.stdout).not.toContain("Lesson —");
    expect(result.stdout).not.toContain("More lessons:");
  });

  it("keeps the More lessons index line under the hook byte cap", async () => {
    const rootDir = await fixtureRepo();
    const found = await findContext({
      rootDir,
      task: "add a unique index on push device tokens",
      limit: 2,
    });
    const capped = formatFindContextResult(found, { echoTask: false, maxBytes: 1500 });

    expect(Buffer.byteLength(capped, "utf8")).toBeLessThanOrEqual(1500);
    expect(capped).toContain("More lessons:");
  });

  it("reads a ## Lessons section as the legacy flat list", async () => {
    // The pre-1.6 template files every existing repo has: one `## Lessons`
    // heading with bullets under it. Those bullets search exactly as before,
    // not as one diluted area document.
    const rootDir = await createTempRoot("context-lessons-template");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await writeFile(
      path.join(rootDir, "docs/60-engineering/LESSONS.md"),
      [
        "# Lessons",
        "",
        "Durable, hard-won lessons for this repository.",
        "",
        "## Lessons",
        "",
        '- MongoDB rejects `$ne` in `partialFilterExpression`; use `$type: "string"` instead.',
        "- Ship behind the flag before removing the old path.",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = await runCommand(rootDir, [
      "context",
      "mongo partialFilterExpression $ne rejected",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("partialFilterExpression");
    expect(result.stdout).not.toContain("Lesson — Lessons");
  });

  it("matches a large area by its best bullet, not its diluted whole", async () => {
    // Sixty bullets, one of them the answer: joined-section scoring buries it
    // under the length norm, per-bullet scoring does not.
    const lines = ["# Lessons", "", "## Mongo indexes", "", "Also Known As: index, E11000", ""];
    for (let i = 0; i < 59; i += 1) {
      lines.push(`- Routine upkeep note number ${i} about scheduled rotation.`);
    }
    lines.push(
      '- MongoDB rejects `$ne` in `partialFilterExpression`; use `$type: "string"` instead.',
      "",
    );
    const rootDir = await createTempRoot("context-lessons-large");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await writeFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), lines.join("\n"), "utf8");

    const result = await runCommand(rootDir, [
      "context",
      "mongo partialFilterExpression $ne rejected",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Lesson — Mongo indexes");
    // The match line cites the answer's terms even in a 60-bullet area.
    expect(result.stdout).toContain("partial, filter, expression");
  });

  it("answers a prompt hook with lessons when no card matches", async () => {
    const rootDir = await createTempRoot("context-lessons-hook");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await writeFile(path.join(rootDir, "docs/60-engineering/LESSONS.md"), FIXTURE, "utf8");

    const result = await hookContext({
      rootDir,
      tool: "claude",
      rawInput: `${JSON.stringify({ prompt: "CleverTap checkout event missing from the funnel" })}\n`,
    });

    expect(result.matched).toBe(true);
    const parsed = JSON.parse(result.output) as {
      hookSpecificOutput: { additionalContext: string };
    };
    const injected = parsed.hookSpecificOutput.additionalContext;
    expect(injected).toContain("Lesson — Product analytics");
    expect(injected).toContain("More lessons:");
    expect(Buffer.byteLength(injected, "utf8")).toBeLessThanOrEqual(1500);
  });
});
