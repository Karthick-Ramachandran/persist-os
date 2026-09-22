import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkMemoryIntegrity } from "../../../src/core/doctor/checks/memory-integrity-check.js";
import {
  createTempRoot,
  removeTempRoot,
  runCommand,
  runInitCommand,
} from "../../helpers/init-test-helpers.js";

function adrDocument(title: string, status: string): string {
  return [
    `# ${title}`,
    "",
    "## Status",
    "",
    status,
    "",
    "## Context",
    "",
    "Context.",
    "",
    "## Decision",
    "",
    "Decision.",
    "",
    "## Alternatives Considered",
    "",
    "Alternatives.",
    "",
    "## Consequences",
    "",
    "Consequences.",
    "",
    "## Related Documents",
    "",
    "- None yet.",
    "",
  ].join("\n");
}

describe("doctor pending ADR proposals", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  async function writeDoc(rootDir: string, relativePath: string, content: string): Promise<void> {
    const full = path.join(rootDir, relativePath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf8");
  }

  it("counts accepted and proposed ADRs in the detected line", async () => {
    const rootDir = await createTempRoot("pending-count");
    roots.push(rootDir);
    await writeDoc(
      rootDir,
      "docs/adrs/ADR-0001-example.md",
      adrDocument("ADR-0001: Example", "Accepted"),
    );
    await writeDoc(
      rootDir,
      "docs/adrs/ADR-0002-tip-rounding.md",
      adrDocument("ADR-0002: Tip is stored in cents, rounded once at creation", "Proposed"),
    );

    const { findings } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "info",
        check: "adr-memory",
        message: "2 ADRs detected (1 accepted, 1 proposed).",
      }),
    );
  });

  it("reports a numbered Proposed ADR once, as info, with its accept slug", async () => {
    const rootDir = await createTempRoot("pending-numbered");
    roots.push(rootDir);
    await writeDoc(
      rootDir,
      "docs/adrs/ADR-0002-tip-rounding.md",
      adrDocument("ADR-0002: Tip is stored in cents, rounded once at creation", "Proposed"),
    );

    const { findings } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    const pending = findings.filter((finding) => finding.message.includes("awaiting your review"));
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      severity: "info",
      check: "adr-memory",
      path: "docs/adrs/ADR-0002-tip-rounding.md",
    });
    expect(pending[0]?.message).toContain(
      "ADR-0002 (Tip is stored in cents, rounded once at creation)",
    );
    expect(pending[0]?.message).toContain("persist adr accept tip-rounding");
  });

  it("reports a draft under proposed/ as pending", async () => {
    const rootDir = await createTempRoot("pending-draft");
    roots.push(rootDir);
    await writeDoc(
      rootDir,
      "docs/adrs/proposed/ADR-PROPOSED-tip-rounding.md",
      adrDocument("Proposed ADR: Tip is stored in cents, rounded once at creation", "Proposed"),
    );

    const { findings } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    const pending = findings.filter((finding) => finding.message.includes("awaiting your review"));
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      severity: "info",
      check: "adr-memory",
      path: "docs/adrs/proposed/ADR-PROPOSED-tip-rounding.md",
    });
    expect(pending[0]?.message).toContain("persist adr accept tip-rounding");
  });

  it("stays silent when every ADR is accepted, with the old count line", async () => {
    const rootDir = await createTempRoot("pending-none");
    roots.push(rootDir);
    await writeDoc(
      rootDir,
      "docs/adrs/ADR-0001-example.md",
      adrDocument("ADR-0001: Example", "Accepted"),
    );
    await writeDoc(
      rootDir,
      "docs/adrs/ADR-0002-other.md",
      adrDocument("ADR-0002: Other", "Accepted"),
    );

    const { findings } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings.map((finding) => finding.message)).toContain("2 ADRs detected.");
    expect(findings.filter((finding) => finding.message.includes("awaiting your review"))).toEqual(
      [],
    );
  });

  it("never reports a superseded ADR as pending", async () => {
    const rootDir = await createTempRoot("pending-superseded");
    roots.push(rootDir);
    await writeDoc(
      rootDir,
      "docs/adrs/ADR-0001-example.md",
      adrDocument("ADR-0001: Example", "Accepted, superseded by ADR-0002"),
    );

    const { findings } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings.filter((finding) => finding.message.includes("awaiting your review"))).toEqual(
      [],
    );
    expect(findings.map((finding) => finding.message)).toContain(
      "1 ADRs detected (0 accepted, 0 proposed, 1 other).",
    );
  });

  it("never warns or errors on a pending proposal, so commits go through", async () => {
    const rootDir = await createTempRoot("pending-commit");
    roots.push(rootDir);
    await runInitCommand(rootDir, ["--yes"]);
    await writeDoc(
      rootDir,
      "docs/adrs/proposed/ADR-PROPOSED-tip-rounding.md",
      adrDocument("Proposed ADR: Tip is stored in cents, rounded once at creation", "Proposed"),
    );

    const { findings } = await checkMemoryIntegrity({
      rootDir,
      config: createDefaultConfig(),
    });

    // The pre-commit hook fails only on errors (exit 2): a pending proposal
    // must not add any warning or error finding.
    expect(
      findings.filter((finding) => finding.severity === "warning" || finding.severity === "error"),
      "blocking findings",
    ).toEqual([]);

    const result = await runCommand(rootDir, ["doctor"]);
    // Exit 0 (passed) or 1 (warnings elsewhere); never 2 (errors).
    expect(result.exitCode).toBeLessThanOrEqual(1);
  });
});
