import { describe, expect, it } from "vitest";

import {
  ADOPTION_REPORT_PATH,
  generateAdoptionFiles,
} from "../../../src/core/adopt/generate-adoption.js";

describe("generateAdoptionFiles", () => {
  it("writes a proposed adoption report listing detected signals", () => {
    const files = generateAdoptionFiles({
      docsDir: "docs",
      adrDir: "docs/adrs",
      signals: {
        languages: ["TypeScript"],
        packageManager: "pnpm",
        packageManagerSource: "pnpm-lock.yaml",
        frameworks: ["Next.js"],
        hasTests: true,
        testsEvidence: "`tests/` directory",
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
    // Provenance is shown so a reviewer can correct a wrong signal.
    expect(report!.content).toContain("Package manager: pnpm (from `pnpm-lock.yaml`)");
    expect(report!.content).toContain("Tests: detected via `tests/` directory");
  });

  it("emits a proposed ADR per framework, never accepted", () => {
    const files = generateAdoptionFiles({
      docsDir: "docs",
      adrDir: "docs/adrs",
      signals: {
        languages: ["Python"],
        packageManager: null,
        packageManagerSource: null,
        frameworks: ["FastAPI"],
        hasTests: false,
        testsEvidence: null,
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

  it("follows the configured docsDir and adrDir, not hardcoded paths", () => {
    const files = generateAdoptionFiles({
      docsDir: "memory",
      adrDir: "docs/decisions",
      signals: {
        languages: ["TypeScript"],
        packageManager: "pnpm",
        packageManagerSource: "pnpm-lock.yaml",
        frameworks: ["Next.js"],
        hasTests: true,
        testsEvidence: "`tests/` directory",
        hasReadme: true,
        hasDocs: false,
      },
    });

    const report = files.find((file) => file.path === "memory/adopt/ADOPTION_REPORT.md");
    expect(report).toBeDefined();
    expect(report!.content).toContain("docs/decisions/proposed/ADR-PROPOSED-adopt-nextjs.md");
    expect(report!.content).not.toContain("docs/adrs/proposed");
    const adr = files.find(
      (file) => file.path === "docs/decisions/proposed/ADR-PROPOSED-adopt-nextjs.md",
    );
    expect(adr!.content).toContain("memory/10-architecture/ARCHITECTURE.md");
    expect(adr!.content).not.toContain("docs/10-architecture/ARCHITECTURE.md");
  });

  it("produces only the report when no frameworks are detected", () => {
    const files = generateAdoptionFiles({
      docsDir: "docs",
      adrDir: "docs/adrs",
      signals: {
        languages: [],
        packageManager: null,
        packageManagerSource: null,
        frameworks: [],
        hasTests: false,
        testsEvidence: null,
        hasReadme: false,
        hasDocs: false,
      },
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe(ADOPTION_REPORT_PATH);
  });
});
