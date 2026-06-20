import { describe, expect, it } from "vitest";

import {
  ADOPTION_REPORT_PATH,
  generateAdoptionFiles,
} from "../../../src/core/adopt/generate-adoption.js";

describe("generateAdoptionFiles", () => {
  it("writes a proposed adoption report listing detected signals", () => {
    const files = generateAdoptionFiles({
      adrDir: "docs/adrs",
      signals: {
        languages: ["TypeScript"],
        packageManager: "pnpm",
        frameworks: ["Next.js"],
        hasTests: true,
        hasReadme: true,
        hasDocs: false,
      },
    });

    const report = files.find((file) => file.path === ADOPTION_REPORT_PATH);
    expect(report).toBeDefined();
    expect(report!.content).toContain("## Status\n\nProposed.");
    expect(report!.content).toContain("Languages: TypeScript");
    expect(report!.content).toContain("Next.js");
    expect(report!.content).not.toContain("## Status\n\nAccepted");
  });

  it("emits a proposed ADR per framework, never accepted", () => {
    const files = generateAdoptionFiles({
      adrDir: "docs/adrs",
      signals: {
        languages: ["Python"],
        packageManager: null,
        frameworks: ["FastAPI"],
        hasTests: false,
        hasReadme: false,
        hasDocs: false,
      },
    });

    const adr = files.find(
      (file) => file.path === "docs/adrs/proposed/ADR-PROPOSED-adopt-fastapi.md",
    );
    expect(adr).toBeDefined();
    expect(adr!.content).toContain("## Status\n\nProposed");
    expect(adr!.content).not.toContain("Accepted");
  });

  it("produces only the report when no frameworks are detected", () => {
    const files = generateAdoptionFiles({
      adrDir: "docs/adrs",
      signals: {
        languages: [],
        packageManager: null,
        frameworks: [],
        hasTests: false,
        hasReadme: false,
        hasDocs: false,
      },
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe(ADOPTION_REPORT_PATH);
  });
});
