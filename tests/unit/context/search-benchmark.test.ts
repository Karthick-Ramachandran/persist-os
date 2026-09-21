import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { searchContext } from "../../../src/core/context/search.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

const DOCS = "docs";
const ADRS = "docs/adrs";

function card(
  title: string,
  purpose: string,
  answers: string[],
  aka: string[],
  startHere: string[],
  rules: string[],
  pitfalls: string[],
  appliesTo: string[],
): string {
  const bullets = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");
  return [
    `# ${title}`,
    "",
    "## Purpose",
    "",
    purpose,
    "",
    "## Answers",
    "",
    bullets(answers),
    "",
    "## Also Known As",
    "",
    bullets(aka),
    "",
    "## Start Here",
    "",
    bullets(startHere),
    "",
    "## Rules",
    "",
    bullets(rules),
    "",
    "## Pitfalls",
    "",
    bullets(pitfalls),
    "",
    "## Applies To",
    "",
    bullets(appliesTo.map((p) => `\`${p}\``)),
    "",
  ].join("\n");
}

function adr(id: string, title: string, decision: string, appliesTo: string[]): string {
  return [
    `# ${id}: ${title}`,
    "",
    "## Status",
    "",
    "Accepted",
    "",
    "## Decision",
    "",
    decision,
    "",
    "## Applies To",
    "",
    ...appliesTo.map((p) => `- \`${p}\``),
    "",
  ].join("\n");
}

/**
 * The Splitr fixture: five cards over split, ledger, money, tip, members, and
 * settle-up, plus two ADRs, two fences, two conventions, and two lessons.
 * Prompts are written the way a person types them, including paraphrases that
 * share no words with the code. Starred prompts are answerable only through
 * Answers / Also Known As — no code word in the prompt appears in any Start
 * Here path, rule, or secondary record.
 */
const CARDS: [string, string][] = [
  [
    "splitting-and-rounding.md",
    card(
      "Splitting and rounding",
      "How an expense is divided between members, and where leftover cents go.",
      [
        "make rounding fair",
        "change how an expense is split",
        "who pays the extra cent",
        "shares don't add up to the total",
        "split the dinner bill evenly",
      ],
      ["split, splitting, shares, rounding, remainder, leftover cent, penny"],
      [
        "`src/lib/split.ts` — splitEvenly: divides a total, hands out leftover cents",
        "`src/lib/ledger.ts` — sharesFor/balances: where splits become balances",
      ],
      [
        "ADR-0001 — money is integer cents, including intermediate calculations",
        "Fence `src/lib/split.ts` — leftover cents go to the earliest joiner, and why",
        "CONVENTIONS: `splitEvenly` is the only place an amount is divided",
      ],
      ["LESSONS: duplicate member ids in splitAmong lose a share silently"],
      ["src/lib/split.ts", "src/lib/ledger.ts"],
    ),
  ],
  [
    "tipping.md",
    card(
      "Tipping",
      "How tips are added to a bill and how the default percentage is chosen.",
      [
        "add a tip to the bill",
        "change the default tip percentage",
        "gratuity for large parties",
        "the tip math is wrong for big groups",
      ],
      ["tip, tips, gratuity, service charge, percentage"],
      ["`src/lib/tip.ts` — tipFor: computes the tip, applies the default percentage"],
      [
        "Fence `src/lib/tip.ts` — tip is computed pre-tax, and why",
        "CONVENTIONS: percentages live beside the math that uses them",
      ],
      ["LESSONS: tip percentage applied after tax double-charges large parties"],
      ["src/lib/tip.ts"],
    ),
  ],
  [
    "members.md",
    card(
      "Members",
      "Who belongs to a group and how people join or leave it.",
      [
        "add a member to a group",
        "remove someone from the group",
        "invite a friend to share expenses",
        "add someone new to the expense group",
      ],
      ["member, members, group, participant, friend, invite"],
      ["`src/lib/members.ts` — addMember/removeMember: group roster changes"],
      ["CONVENTIONS: roster changes go through `addMember` and `removeMember`"],
      ["LESSONS: duplicate member ids in splitAmong lose a share silently"],
      ["src/lib/members.ts"],
    ),
  ],
  [
    "settle-up.md",
    card(
      "Settle up",
      "Who owes whom once expenses are recorded, and how payments zero the balances.",
      [
        "settle up debts",
        "who owes whom after dinner",
        "record a payment between members",
        "balances don't zero out after settling",
      ],
      ["settle, debt, owe, payment, balance, reimburse"],
      ["`src/lib/settle.ts` — settleUp: nets balances into the fewest payments"],
      ["ADR-0002 — settlement nets to the fewest payments, and why"],
      ["LESSONS: settling twice without recording the first payment double-pays"],
      ["src/lib/settle.ts"],
    ),
  ],
  [
    "money.md",
    card(
      "Money",
      "How amounts are stored and computed so cents never drift.",
      ["totals are off by a cent", "store dollar amounts as floats", "why is money integer cents"],
      ["cent, cents, penny, money, currency, float, integer"],
      ["`src/lib/money.ts` — toCents/fromCents: the only float boundary"],
      ["ADR-0001 — money is integer cents, including intermediate calculations"],
      ["LESSONS: float math in a loop drifts a cent per thousand rows"],
      ["src/lib/money.ts"],
    ),
  ],
];

/**
 * Stored phrasings: task wordings copied into the cards' Answers when the work was
 * fresh. This set measures lookup — the write-when-fresh habit working as designed.
 */
const STORED_PROMPTS: { prompt: string; expected: string }[] = [
  { prompt: "make rounding fair", expected: "splitting-and-rounding.md" },
  { prompt: "who ends up paying the extra penny", expected: "splitting-and-rounding.md" },
  { prompt: "change how an expense is split", expected: "splitting-and-rounding.md" },
  { prompt: "shares don't add up to the total", expected: "splitting-and-rounding.md" },
  { prompt: "split the dinner bill evenly", expected: "splitting-and-rounding.md" },
  { prompt: "leftover cent goes to whoever joined first", expected: "splitting-and-rounding.md" },
  { prompt: "add a tip to the bill", expected: "tipping.md" },
  { prompt: "change the default tip percentage", expected: "tipping.md" },
  { prompt: "gratuity for large parties", expected: "tipping.md" },
  { prompt: "the tip math is wrong for big groups", expected: "tipping.md" },
  { prompt: "add a member to a group", expected: "members.md" },
  { prompt: "remove someone from the group", expected: "members.md" },
  { prompt: "invite a friend to share expenses", expected: "members.md" },
  { prompt: "add someone new to the expense group", expected: "members.md" },
  { prompt: "settle up debts", expected: "settle-up.md" },
  { prompt: "who owes whom after dinner", expected: "settle-up.md" },
  { prompt: "record a payment between members", expected: "settle-up.md" },
  { prompt: "balances don't zero out after settling", expected: "settle-up.md" },
  { prompt: "store dollar amounts as floats", expected: "money.md" },
  { prompt: "why is money integer cents", expected: "money.md" },
  { prompt: "people complain the totals are off by a cent", expected: "money.md" },
  { prompt: "duplicate members break the split silently", expected: "splitting-and-rounding.md" },
];

/** Measured 2026-09-22 on this fixture; the assertions below pin them. */
const RECALL_AT_1 = 1;
const RECALL_AT_3 = 1;

/**
 * Held-out paraphrases: written from the area names alone, before measuring, without
 * reading the card text — and the contamination test below enforces that none copies
 * a stored phrase. This set measures paraphrase, not lookup. It must stay fixed:
 * do not reword prompts to chase the score, and do not tune weights against it.
 */
const HELD_OUT_PROMPTS: { prompt: string; expected: string }[] = [
  { prompt: "which member absorbs the stray pennies", expected: "splitting-and-rounding.md" },
  { prompt: "evening out the restaurant check", expected: "splitting-and-rounding.md" },
  {
    prompt: "the group total doesn't match everyone's portions",
    expected: "splitting-and-rounding.md",
  },
  { prompt: "dividing costs fairly between friends", expected: "splitting-and-rounding.md" },
  { prompt: "how much extra to leave the server", expected: "tipping.md" },
  { prompt: "showing appreciation to the waitstaff in cash", expected: "tipping.md" },
  { prompt: "rewarding good service at dinner", expected: "tipping.md" },
  { prompt: "bringing a newcomer into the shared trip fund", expected: "members.md" },
  { prompt: "kicking a freeloader out of the pool", expected: "members.md" },
  { prompt: "seeing everyone who belongs to the trip fund", expected: "members.md" },
  { prompt: "closing out everyone's debts at the end", expected: "settle-up.md" },
  { prompt: "settling debts when the trip ends", expected: "settle-up.md" },
  { prompt: "squaring balances so nobody is owed anything", expected: "settle-up.md" },
  { prompt: "getting reimbursed for what I fronted", expected: "money.md" },
  { prompt: "why are all amounts stored as whole cents", expected: "money.md" },
  { prompt: "handling foreign currency on a trip abroad", expected: "money.md" },
];

/**
 * Floors measured 2026-09-22 on this fixture: 7/16 at rank 1, 11/16 in the top 3
 * (5 prompts clear nothing). The PR reports both sets; these pin the numbers.
 * Corrections are fallback-only, so exact ranks cannot regress from here.
 */
const HELD_OUT_RECALL_AT_1 = 0.4375;
const HELD_OUT_RECALL_AT_3 = 0.6875;

describe("context retrieval benchmark", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function fixture(): Promise<string> {
    const rootDir = await createTempRoot("context-benchmark");
    roots.push(rootDir);
    execFileSync("git", ["init"], { cwd: rootDir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: rootDir,
      stdio: "ignore",
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: rootDir, stdio: "ignore" });

    await mkdir(path.join(rootDir, DOCS, "context"), { recursive: true });
    await mkdir(path.join(rootDir, ADRS), { recursive: true });
    await mkdir(path.join(rootDir, "src/lib"), { recursive: true });

    for (const [name, content] of CARDS) {
      await writeFile(path.join(rootDir, DOCS, "context", name), content, "utf8");
    }
    await writeFile(
      path.join(rootDir, ADRS, "ADR-0001-money-is-integer-cents.md"),
      adr(
        "ADR-0001",
        "Money is integer cents",
        "Money is integer cents, including intermediate calculations, so float drift can never move a total.",
        ["src/lib/money.ts", "src/lib/split.ts"],
      ),
      "utf8",
    );
    await writeFile(
      path.join(rootDir, ADRS, "ADR-0002-settlement-nets-payments.md"),
      adr(
        "ADR-0002",
        "Settlement nets to the fewest payments",
        "Settlement nets balances to the fewest payments between members.",
        ["src/lib/settle.ts"],
      ),
      "utf8",
    );
    await mkdir(path.join(rootDir, DOCS, "60-engineering"), { recursive: true });
    await writeFile(
      path.join(rootDir, DOCS, "60-engineering", "CONVENTIONS.md"),
      [
        "# Conventions",
        "",
        "- `splitEvenly` in `src/lib/split.ts` is the only place an amount is divided.",
        "- Money is integer cents in `src/lib/money.ts`, including intermediate calculations.",
        "",
      ].join("\n"),
      "utf8",
    );
    await writeFile(
      path.join(rootDir, DOCS, "60-engineering", "LESSONS.md"),
      [
        "# Lessons",
        "",
        "- Duplicate member ids in splitAmong lose a share silently (`src/lib/split.ts`).",
        "- Tip percentage applied after tax double-charges large parties (`src/lib/tip.ts`).",
        "",
      ].join("\n"),
      "utf8",
    );
    await writeFile(
      path.join(rootDir, DOCS, "60-engineering", "FENCES.md"),
      [
        "# Fences",
        "",
        "## `src/lib/split.ts`",
        "",
        "Why: splitting with floats once moved cent totals, so division stays in splitEvenly.",
        "",
        "## `src/lib/tip.ts`",
        "",
        "Why: tip is computed pre-tax because post-tax tips double-charged large parties.",
        "",
      ].join("\n"),
      "utf8",
    );

    for (const file of ["split.ts", "ledger.ts", "money.ts", "tip.ts", "members.ts", "settle.ts"]) {
      await writeFile(path.join(rootDir, "src/lib", file), `export const x = 1;\n`, "utf8");
    }
    execFileSync("git", ["add", "-A"], { cwd: rootDir, stdio: "ignore" });
    return rootDir;
  }

  it("puts the expected card in the top 3 for every stored phrasing", async () => {
    const rootDir = await fixture();
    const ranks: { prompt: string; expected: string; rank: number; top: string }[] = [];

    for (const { prompt, expected } of STORED_PROMPTS) {
      const found = await searchContext(rootDir, prompt, { docsDir: DOCS, adrDir: ADRS });
      const rank = found.cards.findIndex((hit) => hit.card.file.endsWith(expected)) + 1;
      ranks.push({
        prompt,
        expected,
        rank,
        top: found.cards[0]?.card.file ?? "(none)",
      });
      expect(rank, `"${prompt}" → rank ${rank}, top ${found.cards[0]?.card.file}`).toBeGreaterThan(
        0,
      );
      expect(
        rank,
        `"${prompt}" → rank ${rank}, top ${found.cards[0]?.card.file}`,
      ).toBeLessThanOrEqual(3);
    }

    const at1 = ranks.filter((r) => r.rank === 1).length / ranks.length;
    const at3 = ranks.filter((r) => r.rank >= 1 && r.rank <= 3).length / ranks.length;
    console.log(`recall@1=${at1.toFixed(3)} recall@3=${at3.toFixed(3)} (${ranks.length} prompts)`);
    expect(at1).toBe(RECALL_AT_1);
    expect(at3).toBe(RECALL_AT_3);
  }, 60000);

  it("holds out paraphrases that copy no stored phrase", () => {
    // A held-out prompt that repeats a stored phrase measures lookup, not paraphrase.
    // Single shared words are unavoidable ("tip", "group") and out of scope; what must
    // never appear is a multi-word stored phrase, verbatim, inside a held-out prompt.
    // If this fails after a fixture edit, reword the prompt — never the card.
    const phrases = new Set<string>();
    for (const [, content] of CARDS) {
      for (const line of content.split("\n")) {
        const bullet = line.match(/^-\s+(.*)$/u)?.[1] ?? "";
        for (const part of bullet.split(",")) {
          const phrase = part.toLowerCase().replace(/`+/gu, "").trim();
          if (phrase.includes(" ")) {
            phrases.add(phrase);
          }
        }
      }
    }

    const stored = new Set(STORED_PROMPTS.map((entry) => entry.prompt.toLowerCase()));
    expect(HELD_OUT_PROMPTS.length).toBeGreaterThanOrEqual(15);
    for (const { prompt } of HELD_OUT_PROMPTS) {
      expect(stored.has(prompt.toLowerCase())).toBe(false);
      for (const phrase of phrases) {
        expect(
          prompt.toLowerCase().includes(phrase),
          `"${prompt}" copies stored phrase "${phrase}"`,
        ).toBe(false);
      }
    }
  });

  it("reports honest recall on held-out paraphrases", async () => {
    // No top-3 assertion here: misses are the signal, and the floors below pin the
    // measured values so regressions show. Weights and threshold are never tuned
    // against this set — only the tokenizer experiment in the review moved it, and
    // its before/after is reported in the PR, not hidden in the constants.
    const rootDir = await fixture();
    const rows: string[] = [];
    let at1 = 0;
    let at3 = 0;

    for (const { prompt, expected } of HELD_OUT_PROMPTS) {
      const found = await searchContext(rootDir, prompt, { docsDir: DOCS, adrDir: ADRS });
      const rank = found.cards.findIndex((hit) => hit.card.file.endsWith(expected)) + 1;
      if (rank === 1) {
        at1 += 1;
      }
      if (rank >= 1 && rank <= 3) {
        at3 += 1;
      }
      rows.push(
        `${rank === 0 ? "-" : rank}  "${prompt}" → ${expected} (top: ${found.cards[0]?.card.file ?? "(none)"})`,
      );
    }

    const r1 = at1 / HELD_OUT_PROMPTS.length;
    const r3 = at3 / HELD_OUT_PROMPTS.length;
    console.log(`held-out ranks:\n${rows.join("\n")}`);
    console.log(
      `held-out recall@1=${r1.toFixed(3)} recall@3=${r3.toFixed(3)} (${HELD_OUT_PROMPTS.length} prompts)`,
    );
    expect(r1).toBeGreaterThanOrEqual(HELD_OUT_RECALL_AT_1);
    expect(r3).toBeGreaterThanOrEqual(HELD_OUT_RECALL_AT_3);
  }, 60000);
});
