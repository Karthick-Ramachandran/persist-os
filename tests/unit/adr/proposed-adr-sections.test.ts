import { describe, expect, it } from "vitest";

import {
  REQUIRED_ADR_SECTIONS,
  ensureRequiredAdrSections,
} from "../../../src/core/adr/adr-sections.js";
import { generateAdoptionFiles } from "../../../src/core/adopt/generate-adoption.js";
import { generateMcpFiles } from "../../../src/core/mcp/generate-mcp.js";

/**
 * Regression: a proposed ADR that stops at "## Consequences" fails `persist doctor` the moment a
 * human accepts it (Doctor requires "## Related Documents"). Every generator that emits a proposed
 * ADR must therefore produce all required sections, so the propose -> accept cycle stays green.
 */
function isProposedAdr(filePath: string): boolean {
  return /\/ADR-PROPOSED-[^/]+\.md$/u.test(filePath);
}

function expectAllRequiredSections(content: string): void {
  for (const section of REQUIRED_ADR_SECTIONS) {
    expect(content).toContain(section);
  }
}

describe("ensureRequiredAdrSections", () => {
  it("appends a missing Related Documents section", () => {
    const body = "# Proposed ADR: Thing\n\n## Status\n\nProposed\n";
    const result = ensureRequiredAdrSections(body);
    expect(result).toContain("## Related Documents");
    expect(result.endsWith("\n")).toBe(true);
  });

  it("leaves a complete body unchanged apart from a trailing newline", () => {
    const complete = REQUIRED_ADR_SECTIONS.map((section) => `${section}\n\nx`).join("\n\n");
    const result = ensureRequiredAdrSections(complete);
    expect(result).toBe(`${complete}\n`);
  });
});

describe("generated proposed ADRs contain every required section", () => {
  it("covers MCP adoption ADRs", () => {
    const files = generateMcpFiles({ adrDir: "docs/adrs", server: "figma" });
    const adr = files.find((file) => isProposedAdr(file.path));
    expect(adr).toBeDefined();
    expectAllRequiredSections(adr!.content);
  });

  it("covers adopt framework ADRs", () => {
    const files = generateAdoptionFiles({
      adrDir: "docs/adrs",
      signals: {
        languages: ["Go"],
        packageManager: "Go modules",
        packageManagerSource: "go.mod",
        frameworks: ["Gin"],
        hasTests: true,
        testsEvidence: "`internal/foo_test.go`",
        hasReadme: true,
        hasDocs: false,
      },
    });
    const adr = files.find((file) => isProposedAdr(file.path));
    expect(adr).toBeDefined();
    expectAllRequiredSections(adr!.content);
  });
});
