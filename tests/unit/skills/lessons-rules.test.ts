import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { getCatalogSkill } from "../../../src/core/skills/skill-catalog.js";
import { createTempRoot, removeTempRoot, runInitCommand } from "../../helpers/init-test-helpers.js";

/**
 * Lessons-by-area agent rules, pinned by phrase the way the content-routing
 * tests pin theirs: Required reading no longer lists LESSONS.md read-in-full,
 * adding goes under an area, and retiring names the test or rule.
 */
describe("lessons agent rules", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function initializedRepo(): Promise<string> {
    const rootDir = await createTempRoot("lessons-rules");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    return rootDir;
  }

  const REQUIRED = [
    "The Always lessons load every session",
    "the lessons for your area arrive with the pointers",
    "open the section of",
    "LESSONS.md",
    "the pointers list them",
  ];
  const ADDING = [
    "create the area with an Applies To list if none fits",
    "Put it under Always only if every task in this repository needs it",
  ];
  const RETIRING = [
    "move it there or delete it, and name the test or rule in the commit",
    "Delete a lesson that describes a temporary state once that state is fixed",
  ];

  it("routes Required reading through Always and the pointers in AGENTS.md", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");

    const required = agents.split("## Required reading")[1] ?? "";
    for (const phrase of REQUIRED) {
      expect(required, phrase).toContain(phrase);
    }
    // No longer read-in-full: no bare LESSONS.md line in Required reading.
    expect(required).not.toMatch(/^- `docs\/60-engineering\/LESSONS\.md`$/mu);
  });

  it("teaches adding and retiring lessons in AGENTS.md and the Cursor rule", async () => {
    const rootDir = await initializedRepo();
    const agents = readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");
    const cursor = readFileSync(path.join(rootDir, ".cursor/rules/persist-memory.mdc"), "utf8");

    // Flattened: both rules wrap the sentences across lines.
    for (const content of [agents, cursor].map((text) => text.replace(/\s+/gu, " "))) {
      for (const phrase of [...ADDING, ...RETIRING]) {
        expect(content, phrase).toContain(phrase);
      }
    }
    expect(agents).toContain("When something breaks non-obviously, add a one-line lesson");
  });

  it("carries the lessons rules in the implement-task and context skills", () => {
    for (const name of ["implement-task", "context"]) {
      const skill = getCatalogSkill(name);
      const text = [
        skill?.description,
        ...((skill?.workflow ?? []) as string[]),
        ...((skill?.decisions ?? []) as string[]),
      ].join("\n");
      for (const phrase of [...REQUIRED.slice(0, 2), ...ADDING, ...RETIRING]) {
        expect(text, `${name}: ${phrase}`).toContain(phrase);
      }
    }
  });
});
