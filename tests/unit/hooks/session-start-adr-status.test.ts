import { spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { readAcceptedAdrs } from "../../../src/core/adr/governing-adrs.js";
import { renderSessionStartHook } from "../../../src/core/hooks/generate-hook.js";

/**
 * SessionStart ADR standing (1.6.1 Part 3): every ADR file used to be injected
 * under "Accepted ADRs" whatever its status, so a Proposed draft read as an
 * accepted decision in every later session. Each ADR now goes on exactly one
 * list by its ## Status section, matching readAcceptedAdrs.
 */
describe("renderSessionStartHook ADR standing", () => {
  function adrDocument(id: string, title: string, status: string): string {
    return [
      `# ${id}: ${title}`,
      "",
      "## Status",
      "",
      status,
      "",
      "## Decision",
      "",
      "Kept.",
      "",
    ].join("\n");
  }

  /** The shared parity fixture: one ADR per standing, plus the edge cases. */
  function parityFixture(): Record<string, string> {
    return {
      "docs/adrs/ADR-0001-ledger.md": adrDocument("ADR-0001", "Ledger", "Accepted"),
      "docs/adrs/ADR-0002-rounding.md": adrDocument(
        "ADR-0002",
        "Rounding",
        "Accepted — superseded by ADR-0009",
      ),
      "docs/adrs/ADR-0003-draft.md": adrDocument("ADR-0003", "Draft", "Proposed"),
      "docs/adrs/ADR-0004-rejected.md": adrDocument("ADR-0004", "Rejected", "Rejected"),
      "docs/adrs/proposed/ADR-PROPOSED-tip-rounding.md": adrDocument(
        "Proposed ADR",
        "Tip rounding",
        "Proposed",
      ),
      "docs/adrs/ADR-0005-crlf.md": adrDocument("ADR-0005", "CRLF", "Accepted").replaceAll(
        "\n",
        "\r\n",
      ),
      "docs/adrs/ADR-0006-nostatus.md": "# ADR-0006: No status\n\n## Decision\n\nNothing.\n",
    };
  }

  async function setupFixture(files: Record<string, string>): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "persist-session-adr-status-"));
    for (const [relativePath, content] of Object.entries(files)) {
      const full = path.join(dir, relativePath);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, content);
    }
    return dir;
  }

  /** Execute the rendered hook in a fixture repo and return the injected context. */
  async function injectedContext(dir: string): Promise<string> {
    const hookPath = path.join(dir, "session-start.sh");
    await writeFile(hookPath, renderSessionStartHook());
    await chmod(hookPath, 0o755);

    const result = spawnSync("sh", [hookPath], { cwd: dir, encoding: "utf8" });
    expect(result.status).toBe(0);

    // Reaching the assertions below proves the hook output was valid JSON even
    // with hostile ADR text: without the fence-style escaping this parse throws.
    const parsed = JSON.parse(result.stdout) as {
      hookSpecificOutput: { additionalContext: string };
    };
    return parsed.hookSpecificOutput.additionalContext;
  }

  async function contextFor(files: Record<string, string>): Promise<string> {
    const dir = await setupFixture(files);
    try {
      return await injectedContext(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  function acceptedItems(context: string): string[] {
    const section = context.split("Accepted ADRs (docs/adrs/): ")[1]?.split(". ")[0] ?? "";
    return section === "none yet" ? [] : section.split(" ").filter((item) => item !== "");
  }

  /** Null when the Proposed list is absent, as it must be when empty. */
  function proposedItems(context: string): string[] | null {
    const parts = context.split("Proposed ADRs, pending review, not binding: ");
    if (parts.length < 2) {
      return null;
    }
    return (parts[1]?.split(". ")[0] ?? "").split(" ").filter((item) => item !== "");
  }

  it("leaves a Proposed ADR out of the Accepted list", async () => {
    const context = await contextFor(parityFixture());

    expect(acceptedItems(context)).not.toContain("ADR-0003-draft");
  });

  it("lists a Proposed ADR right after the Accepted list, only when non-empty", async () => {
    const context = await contextFor(parityFixture());
    const proposed = proposedItems(context);

    expect(proposed).not.toBeNull();
    expect(proposed).toContain("ADR-0003-draft");
    expect(context.indexOf("Accepted ADRs (docs/adrs/)")).toBeLessThan(
      context.indexOf("Proposed ADRs, pending review, not binding:"),
    );
    expect(context.indexOf("Proposed ADRs, pending review, not binding:")).toBeLessThan(
      context.indexOf("Modules (docs/30-modules/)"),
    );
  });

  it("lists a superseded ADR in neither list", async () => {
    const context = await contextFor(parityFixture());

    expect(acceptedItems(context)).not.toContain("ADR-0002-rounding");
    expect(proposedItems(context)).not.toContain("ADR-0002-rounding");
  });

  it("lists a Rejected ADR in neither list", async () => {
    const context = await contextFor(parityFixture());

    expect(acceptedItems(context)).not.toContain("ADR-0004-rejected");
    expect(proposedItems(context)).not.toContain("ADR-0004-rejected");
  });

  it("lists a proposed/ file in the Proposed list", async () => {
    const context = await contextFor(parityFixture());
    const proposed = proposedItems(context);

    expect(proposed).not.toBeNull();
    expect(proposed).toContain("ADR-PROPOSED-tip-rounding");
    expect(acceptedItems(context)).not.toContain("ADR-PROPOSED-tip-rounding");
  });

  it("keeps a CRLF Accepted ADR in the Accepted list", async () => {
    const context = await contextFor(parityFixture());

    expect(acceptedItems(context)).toContain("ADR-0001-ledger");
    expect(acceptedItems(context)).toContain("ADR-0005-crlf");
  });

  it("lists an ADR with no Status section in neither list", async () => {
    const context = await contextFor(parityFixture());

    expect(acceptedItems(context)).not.toContain("ADR-0006-nostatus");
    expect(proposedItems(context)).not.toContain("ADR-0006-nostatus");
  });

  it("omits the Proposed list entirely when every ADR is Accepted", async () => {
    const context = await contextFor({
      "docs/adrs/ADR-0001-ledger.md": adrDocument("ADR-0001", "Ledger", "Accepted"),
    });

    expect(proposedItems(context)).toBeNull();
    expect(context).not.toContain("Proposed ADRs");
  });

  it("matches readAcceptedAdrs over the shared fixture", async () => {
    const dir = await setupFixture(parityFixture());
    try {
      const context = await injectedContext(dir);
      const accepted = await readAcceptedAdrs(dir, "docs/adrs");
      const expected = accepted.map((adr) => path.posix.basename(adr.file, ".md")).sort();

      expect(acceptedItems(context).sort()).toEqual(expected);
      expect(expected).toEqual(["ADR-0001-ledger", "ADR-0005-crlf"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("stays valid JSON when a Proposed title contains quotes", async () => {
    const context = await contextFor({
      "docs/adrs/ADR-0008-quoted.md": adrDocument("ADR-0008", 'Tip "rounding" rules', "Proposed"),
    });
    const proposed = proposedItems(context);

    expect(proposed).not.toBeNull();
    expect(proposed).toContain("ADR-0008-quoted");
    expect(acceptedItems(context)).not.toContain("ADR-0008-quoted");
  });

  it("is byte-identical to 1.6.0 when every ADR is Accepted", async () => {
    // Golden: repositories with only accepted decisions see no change. The
    // literal below is the 1.6.0 hook output for this fixture, captured before
    // the standing split.
    const context = await contextFor({
      "CLAUDE.md": "# x\n",
      "docs/adrs/ADR-0001-ledger.md": adrDocument("ADR-0001", "Ledger", "Accepted"),
      "docs/adrs/ADR-0002-rounding.md": adrDocument("ADR-0002", "Rounding", "Accepted"),
    });

    expect(context).toBe(
      "Persist OS repository memory is the source of truth over chat history. " +
        "Before non-trivial work, read AGENTS.md and the docs it routes to; repository rules " +
        "override model preference. Accepted ADRs (docs/adrs/): ADR-0001-ledger ADR-0002-rounding . " +
        "Modules (docs/30-modules/): none yet. Use the Persist OS CLI commands listed in AGENTS.md " +
        "(persist feature/adr/module create, persist adr accept and supersede, persist doctor) " +
        "yourself, as 'npx persist-os <command>' if persist is not installed; do not web-search them. " +
        "Before calling work done, check the diff against every accepted ADR governing the files you " +
        "changed (read its Decision, not just its title); work is done only when 'persist doctor' " +
        "reports PASSED. When you finish work in an area, create or update its context card — above " +
        "all the Answers list, with the task you were just given phrased the way it was asked.",
    );
  });
});
