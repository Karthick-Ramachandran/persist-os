import { describe, expect, it } from "vitest";

import { FenceValidationError, addFenceEntry } from "../../../src/core/fence/generate-fence.js";

/**
 * The shape here is not cosmetic. `fence-check` reads `## \`path\`` headings and the first
 * `Why:` line beneath one, and the generated SessionStart hook greps those same two prefixes to
 * build its index. A writer that drifts from either is invisible to both.
 */
describe("addFenceEntry", () => {
  const entry = { path: "src/billing.ts", why: "Four writes are deliberate.", date: "2026-01-02" };

  it("writes the shape the readers parse", () => {
    const out = addFenceEntry(undefined, entry);

    expect(out).toContain("## `src/billing.ts`");
    expect(out).toContain("Why: Four writes are deliberate.");
    expect(out.split("\n").some((line) => line.startsWith("Why: "))).toBe(true);
  });

  it("keeps the Why on one line", () => {
    // The hook flattens the index by grepping `^Why: `; a wrapped reason would be truncated
    // at the newline and the rest silently dropped.
    const out = addFenceEntry(undefined, {
      ...entry,
      why: "Four writes\nare deliberate,   because\tof a constraint.",
    });

    expect(out).toContain("Why: Four writes are deliberate, because of a constraint.");
  });

  it("records who confirmed it, and the date", () => {
    const out = addFenceEntry(undefined, { ...entry, by: "Karthick" });

    expect(out).toContain("- 2026-01-02 — recorded by Karthick.");
  });

  it("links a decision when one exists", () => {
    const out = addFenceEntry(undefined, { ...entry, adr: "ADR-0007" });

    expect(out).toContain("Decision: ADR-0007");
  });

  it("appends a crossing to an existing path rather than a second heading", () => {
    // Two headings for one path would make the standing reason ambiguous, since the reader
    // takes the first Why it finds under a heading.
    const first = addFenceEntry(undefined, entry);
    const second = addFenceEntry(first, { ...entry, why: "Ignored.", date: "2026-03-04" });

    expect(second.split("## `src/billing.ts`")).toHaveLength(2);
    expect(second).toContain("Why: Four writes are deliberate.");
    expect(second).not.toContain("Why: Ignored.");
    expect(second).toContain("- 2026-03-04 — recorded.");
  });

  it("keeps other entries intact when appending", () => {
    const first = addFenceEntry(undefined, entry);
    const second = addFenceEntry(first, {
      path: "src/auth.ts",
      why: "Second.",
      date: "2026-02-02",
    });
    const third = addFenceEntry(second, { ...entry, why: "x", date: "2026-03-03" });

    expect(third).toContain("## `src/auth.ts`");
    expect(third).toContain("Why: Second.");
  });

  it("refuses a reason that is only whitespace", () => {
    expect(() => addFenceEntry(undefined, { ...entry, why: "   " })).toThrow(FenceValidationError);
  });

  it("refuses a path that escapes the repository", () => {
    expect(() => addFenceEntry(undefined, { ...entry, path: "../outside.ts" })).toThrow();
  });

  it("keeps a symbol suffix", () => {
    const out = addFenceEntry(undefined, { ...entry, path: "src/billing.ts:writeLedger" });

    expect(out).toContain("## `src/billing.ts:writeLedger`");
  });
});
