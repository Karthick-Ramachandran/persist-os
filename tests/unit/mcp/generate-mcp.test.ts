import { describe, expect, it } from "vitest";

import { generateMcpFiles, mcpDocPath } from "../../../src/core/mcp/generate-mcp.js";

describe("generateMcpFiles", () => {
  it("pre-fills a design-context purpose for figma", () => {
    const files = generateMcpFiles({ adrDir: "docs/adrs", server: "figma" });

    const doc = files.find((file) => file.path === mcpDocPath("figma"));
    expect(doc).toBeDefined();
    expect(doc!.content).toContain("# MCP: Figma");
    expect(doc!.content).toContain("Design variables, components, and layout metadata");
    expect(doc!.content).toContain("## Captured Context");
    expect(doc!.content).toContain("## Source-Of-Truth Rule");
  });

  it("emits a proposed ADR for adopting the server", () => {
    const files = generateMcpFiles({ adrDir: "docs/adrs", server: "figma" });

    const adr = files.find((file) => file.path === "docs/adrs/proposed/ADR-PROPOSED-mcp-figma.md");
    expect(adr).toBeDefined();
    expect(adr!.content).toContain("## Status\n\nProposed");
    expect(adr!.content).not.toContain("## Status\n\nAccepted");
  });

  it("uses a usable template for an unknown server", () => {
    const files = generateMcpFiles({ adrDir: "docs/adrs", server: "customtool" });

    const doc = files.find((file) => file.path === mcpDocPath("customtool"));
    expect(doc!.content).toContain("# MCP: Customtool");
    expect(doc!.content).toContain("Describe why this MCP server is used.");
    expect(doc!.content).toContain("## Review Cadence");
  });
});
