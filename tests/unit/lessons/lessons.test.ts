import { describe, expect, it } from "vitest";

import {
  countLessonBullets,
  flattenAlwaysSection,
  parseLessons,
} from "../../../src/core/lessons/lessons.js";

const SECTIONED = [
  "# Lessons",
  "",
  "## Always",
  "",
  "- Never log a raw database driver error; duplicate-key messages can echo an access token.",
  "- The user id in the verified token is authoritative.",
  "",
  "## Mongo indexes",
  "",
  "Applies To:",
  "- `internal/db/**`",
  "- `migrations/**`",
  "",
  "Also Known As: index, unique, partial index, migration, E11000",
  "",
  "- Existing index names are part of deployment compatibility; keep the deployed name.",
  '- MongoDB 8 rejects `$ne` in `partialFilterExpression`; use `$type: "string"` with `$gt: ""`.',
  "",
  "## Deploy",
  "",
  "- Ship behind the flag before removing the old path.",
  "",
].join("\n");

describe("lessons reader", () => {
  it("parses a sectioned file into Always plus areas", () => {
    const lessons = parseLessons(SECTIONED);

    expect(lessons.isSectioned).toBe(true);
    expect(lessons.always).toHaveLength(2);
    expect(lessons.always[0]).toContain("Never log a raw database driver error");
    expect(lessons.areas.map((area) => area.title)).toEqual(["Mongo indexes", "Deploy"]);
    expect(lessons.flat).toEqual([]);
  });

  it("reads Applies To patterns and Also Known As terms", () => {
    const lessons = parseLessons(SECTIONED);
    const mongo = lessons.areas[0];

    expect(mongo?.appliesTo).toEqual(["internal/db/**", "migrations/**"]);
    expect(mongo?.alsoKnownAs).toEqual(["index", "unique", "partial index", "migration", "E11000"]);
    expect(mongo?.bullets).toHaveLength(2);
    // Patterns are metadata, never lessons.
    expect(mongo?.bullets.join("\n")).not.toContain("internal/db");
  });

  it("reads a lowercase always heading and inline header forms", () => {
    const lessons = parseLessons(
      [
        "# Lessons",
        "",
        "## always",
        "",
        "- Every task needs this.",
        "",
        "## Cache",
        "",
        "Applies To: `src/cache/**`, `src/queue.ts`",
        "Also Known As: cache, memoize",
        "- Expire entries explicitly.",
        "",
      ].join("\n"),
    );

    expect(lessons.always).toEqual(["Every task needs this."]);
    expect(lessons.areas[0]?.appliesTo).toEqual(["src/cache/**", "src/queue.ts"]);
    expect(lessons.areas[0]?.alsoKnownAs).toEqual(["cache", "memoize"]);
  });

  it("treats a missing Applies To as an empty list, not an error", () => {
    const lessons = parseLessons(
      ["# Lessons", "", "## Deploy", "", "- Ship behind the flag.", ""].join("\n"),
    );

    expect(lessons.isSectioned).toBe(true);
    expect(lessons.areas[0]?.appliesTo).toEqual([]);
    expect(lessons.areas[0]?.alsoKnownAs).toEqual([]);
    expect(lessons.areas[0]?.bullets).toEqual(["Ship behind the flag."]);
  });

  it("joins wrapped continuation lines into the bullet above", () => {
    const lessons = parseLessons(
      [
        "# Lessons",
        "",
        "## Deploy",
        "",
        "- Ship behind the flag before removing",
        "  the old path, or traffic splits.",
        "- A second lesson.",
        "",
      ].join("\n"),
    );

    expect(lessons.areas[0]?.bullets).toEqual([
      "Ship behind the flag before removing the old path, or traffic splits.",
      "A second lesson.",
    ]);
  });

  it("reads a flat legacy file bullet by bullet with no sections", () => {
    const lessons = parseLessons(
      [
        "# Lessons",
        "",
        "- Never log a raw driver error.",
        "  Continuations still join.",
        "- Repair by verified user id.",
        "",
      ].join("\n"),
    );

    expect(lessons.isSectioned).toBe(false);
    expect(lessons.always).toEqual([]);
    expect(lessons.areas).toEqual([]);
    expect(lessons.flat).toEqual([
      "Never log a raw driver error. Continuations still join.",
      "Repair by verified user id.",
    ]);
  });

  it("counts every bullet for the doctor's size checks", () => {
    expect(countLessonBullets(parseLessons(SECTIONED))).toBe(2 + 2 + 1);
    expect(countLessonBullets(parseLessons("# Lessons\n\n- one\n- two\n"))).toBe(2);
  });

  it("flattens the Always section the way the SessionStart hook injects it", () => {
    expect(flattenAlwaysSection(SECTIONED)).toBe(
      "Never log a raw database driver error; duplicate-key messages can echo an access token. " +
        "The user id in the verified token is authoritative. ",
    );
    expect(flattenAlwaysSection("# Lessons\n\n- flat\n")).toBe("");
    expect(flattenAlwaysSection("# Lessons\n\n## Always\n")).toBe("");
  });
});
