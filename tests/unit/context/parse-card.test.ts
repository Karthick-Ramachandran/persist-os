import { describe, expect, it } from "vitest";

import {
  contextDir,
  parseContextCard,
  renderContextCard,
} from "../../../src/core/context/context-card.js";

const FULL_CARD = `# Splitting and rounding

## Purpose

How an expense is divided between members, and where leftover cents go.

## Answers

- make rounding fair
- change how an expense is split
- who pays the extra cent
- shares don't add up to the total

## Also Known As

- split, splitting, shares, rounding, remainder, leftover cent, penny

## Start Here

- \`src/lib/split.ts\` — splitEvenly: divides a total, hands out leftover cents
- \`src/lib/ledger.ts\` — sharesFor/balances: where splits become balances
- \`tests/split.test.ts\` — the invariants the split must keep

## Rules

- ADR-0001 — money is integer cents, including intermediate calculations
- Fence \`src/lib/split.ts\` — leftover cents go to the earliest joiner, and why
- CONVENTIONS: \`splitEvenly\` is the only place an amount is divided

## Pitfalls

- LESSONS: duplicate member ids in splitAmong lose a share silently

## Applies To

- \`src/lib/split.ts\`
- \`src/lib/ledger.ts\`
`;

describe("context card reader", () => {
  it("parses the documented shape", () => {
    const card = parseContextCard(FULL_CARD, "docs/context/splitting-and-rounding.md");

    expect(card.title).toBe("Splitting and rounding");
    expect(card.purpose).toContain("leftover cents go");
    expect(card.answers).toHaveLength(4);
    expect(card.answers).toContain("who pays the extra cent");
    expect(card.alsoKnownAs).toHaveLength(1);
    expect(card.startHere).toHaveLength(3);
    expect(card.startHere[0]).toEqual({
      path: "src/lib/split.ts",
      note: "splitEvenly: divides a total, hands out leftover cents",
    });
    expect(card.rules).toHaveLength(3);
    expect(card.pitfalls).toHaveLength(1);
    expect(card.appliesTo).toEqual(["src/lib/split.ts", "src/lib/ledger.ts"]);
  });

  it("treats missing sections as empty", () => {
    const card = parseContextCard("# Billing\n\n## Purpose\n\nCharges.\n", "docs/context/billing.md");

    expect(card.title).toBe("Billing");
    expect(card.purpose).toBe("Charges.");
    expect(card.answers).toEqual([]);
    expect(card.startHere).toEqual([]);
    expect(card.appliesTo).toEqual([]);
  });

  it("ignores unknown sections", () => {
    const card = parseContextCard(
      "# Billing\n\n## Purpose\n\nCharges.\n\n## Owners\n\n- team-a\n",
      "docs/context/billing.md",
    );

    expect(card.purpose).toBe("Charges.");
    expect(card.answers).toEqual([]);
  });

  it("accepts bullets with and without backticks", () => {
    const card = parseContextCard(
      [
        "# Billing",
        "",
        "## Start Here",
        "",
        "- `src/lib/billing.ts` — charges",
        "- src/lib/tax.ts — taxes",
        "",
        "## Applies To",
        "",
        "- src/lib/billing.ts",
        "- `src/lib/tax.ts`",
        "",
      ].join("\n"),
      "docs/context/billing.md",
    );

    expect(card.startHere.map((entry) => entry.path)).toEqual([
      "src/lib/billing.ts",
      "src/lib/tax.ts",
    ]);
    expect(card.appliesTo).toEqual(["src/lib/billing.ts", "src/lib/tax.ts"]);
  });

  it("renders a scaffold the reader parses back", () => {
    const rendered = renderContextCard("Splitting and rounding", "How cents are split.");
    const card = parseContextCard(rendered, "docs/context/splitting-and-rounding.md");

    expect(card.title).toBe("Splitting and rounding");
    expect(card.purpose).toBe("How cents are split.");
    expect(card.answers).toEqual([]);
    expect(card.startHere).toEqual([]);
  });

  it("follows a moved docs dir", () => {
    expect(contextDir("docs")).toBe("docs/context");
    expect(contextDir("memory")).toBe("memory/context");
  });
});
