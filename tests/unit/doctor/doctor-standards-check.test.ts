import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDefaultConfig } from "../../../src/core/config/default-config.js";
import { checkStandards } from "../../../src/core/doctor/checks/standards-check.js";
import { createTempRoot, removeTempRoot } from "../../helpers/init-test-helpers.js";

describe("doctor standards checks", () => {
  const roots: string[] = [];

  async function createRoot(prefix: string): Promise<string> {
    const rootDir = await createTempRoot(prefix);
    roots.push(rootDir);
    return rootDir;
  }

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((rootDir) => removeTempRoot(rootDir)));
  });

  it("reports completed features with pending review as errors", async () => {
    const rootDir = await createRoot("doctor-standards-pending-review");
    await writeFeatureMemory(rootDir, {
      completionStatus: "Complete.",
      reviewStatus: "Pending review.",
      testsRun: "pnpm test:run",
      results: "Passed.",
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "standards-feature-completion",
        message: "Feature is marked complete but review is still pending.",
        path: "docs/40-features/F-001-auth-provider/REVIEW.md",
      }),
    );
  });

  it("reports completed features without test or result evidence as errors", async () => {
    const rootDir = await createRoot("doctor-standards-missing-evidence");
    await writeFeatureMemory(rootDir, {
      completionStatus: "Complete.",
      reviewStatus: "Passed.",
      testsRun: "TBD",
      results: "Not available yet.",
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        message: "Feature is marked complete but completion report is missing test evidence.",
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        message: "Feature is marked complete but completion report is missing result evidence.",
      }),
    );
  });

  it("reports proposed ADRs with placeholder consequences as warnings", async () => {
    const rootDir = await createRoot("doctor-standards-proposed-adr");
    await writeAdr(rootDir, "Proposed", "TBD");

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "standards-adr-consequences",
        message: "ADR consequence evidence is incomplete.",
      }),
    );
  });

  it("reports accepted ADRs with placeholder consequences as errors", async () => {
    const rootDir = await createRoot("doctor-standards-accepted-adr");
    await writeAdr(rootDir, "Accepted", "TBD");

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "standards-adr-consequences",
        message: "ADR consequence evidence is incomplete.",
      }),
    );
  });

  it("reports missing security impact notes for security-sensitive feature planning", async () => {
    const rootDir = await createRoot("doctor-standards-security-impact");
    await writeFeatureMemory(rootDir, {
      completionStatus: "In progress.",
      reviewStatus: "Pending review.",
      testsRun: "Not run yet. Implementation is in progress.",
      results: "Not available yet.",
      architectureImpact: `# Architecture Impact: Auth Provider

## Affected Modules

- Authentication and authorization behavior changes.

## Security Impact

- TBD
`,
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "standards-security-impact",
        message: "Security-sensitive feature planning is missing security impact evidence.",
      }),
    );
  });

  it("reports missing security impact notes as errors when the feature is complete", async () => {
    const rootDir = await createRoot("doctor-standards-complete-security-impact");
    await writeFeatureMemory(rootDir, {
      completionStatus: "Complete.",
      reviewStatus: "Passed.",
      testsRun: "pnpm test:run",
      results: "Passed.",
      architectureImpact: `# Architecture Impact: Auth Provider

## Affected Modules

- Authentication and authorization behavior changes.

## Security Impact

- TBD
`,
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "standards-security-impact",
        message: "Security-sensitive feature planning is missing security impact evidence.",
      }),
    );
  });

  it("reports accepted ADRs with placeholder alternatives as errors", async () => {
    const rootDir = await createRoot("doctor-standards-alternatives");
    await writeAdrFull(rootDir, {
      status: "Accepted",
      alternatives: "TBD",
      consequences: "Real consequence text.",
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "error",
        check: "standards-adr-alternatives",
        message: "ADR decision evidence is incomplete.",
      }),
    );
    expect(findings).not.toContainEqual(
      expect.objectContaining({ check: "standards-adr-consequences" }),
    );
  });

  it("warns on proposed ADRs with placeholder alternatives", async () => {
    const rootDir = await createRoot("doctor-standards-proposed-alternatives");
    await writeAdrFull(rootDir, {
      status: "Proposed",
      alternatives: "TBD",
      consequences: "Real consequence text.",
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "standards-adr-alternatives",
      }),
    );
    expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
  });

  it("warns on security-sensitive decisions without security notes", async () => {
    const rootDir = await createRoot("doctor-standards-security-notes");
    await writeAdrFull(rootDir, {
      status: "Accepted",
      decision: "Route authentication through the MCP gateway with network retries.",
      alternatives: "Real alternative text.",
      consequences: "Real consequence text.",
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        check: "standards-adr-security-notes",
        message: "Security-sensitive ADR decision is missing security notes.",
      }),
    );
    expect(findings.filter((finding) => finding.severity === "error")).toEqual([]);
  });

  it("stays quiet when security notes exist", async () => {
    const rootDir = await createRoot("doctor-standards-security-noted");
    await writeAdrFull(rootDir, {
      status: "Accepted",
      decision: "Route authentication through the MCP gateway with network retries.",
      alternatives: "Real alternative text.",
      consequences: "Real consequence text.",
      securityNotes: "MCP calls stay local; the gateway never reaches the network.",
    });

    const { findings } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
  });

  it("stays quiet on a healthy ADR", async () => {
    const rootDir = await createRoot("doctor-standards-healthy");
    await writeAdrFull(rootDir, {
      status: "Accepted",
      decision: "Record the choice in a new ADR file.",
      alternatives: "Real alternative text.",
      consequences: "Real consequence text.",
    });

    const { findings, outcome } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(outcome).toEqual({ id: "standards", status: "evaluated" });
    expect(findings).toEqual([]);
  });

  it("reports not-evaluated when no features or ADRs exist", async () => {
    const rootDir = await createRoot("standards-empty");

    const { findings, outcome } = await checkStandards({
      rootDir,
      config: createDefaultConfig(),
    });

    expect(findings).toEqual([]);
    expect(outcome).toEqual({
      id: "standards",
      status: "not-evaluated",
      reason:
        "no feature folders or ADRs exist, so there are no completion claims or decisions to check",
    });
  });
});

async function writeFeatureMemory(
  rootDir: string,
  options: {
    completionStatus: string;
    reviewStatus: string;
    testsRun: string;
    results: string;
    architectureImpact?: string;
  },
): Promise<void> {
  const featureDir = path.join(rootDir, "docs/40-features/F-001-auth-provider");
  await mkdir(featureDir, { recursive: true });

  await writeFile(
    path.join(featureDir, "COMPLETION_REPORT.md"),
    `# Completion Report: Auth Provider

## Status

${options.completionStatus}

## Tests Run

${options.testsRun}

## Results

${options.results}
`,
    "utf8",
  );

  await writeFile(
    path.join(featureDir, "REVIEW.md"),
    `# Review: Auth Provider

## Status

${options.reviewStatus}
`,
    "utf8",
  );

  await writeFile(
    path.join(featureDir, "ARCHITECTURE_IMPACT.md"),
    options.architectureImpact ??
      `# Architecture Impact: Auth Provider

## Affected Modules

- No security-sensitive scope.

## Security Impact

- No security impact.
`,
    "utf8",
  );
}

async function writeAdrFull(
  rootDir: string,
  options: {
    status: string;
    decision?: string;
    alternatives?: string;
    consequences?: string;
    securityNotes?: string;
  },
): Promise<void> {
  const adrDir = path.join(rootDir, "docs/adrs");
  await mkdir(adrDir, { recursive: true });
  await writeFile(
    path.join(adrDir, "ADR-0001-example.md"),
    `# ADR-0001: Example

## Status

${options.status}

## Context

Example context.

## Decision

${options.decision ?? "Example decision."}

## Alternatives Considered

${options.alternatives ?? "Example alternative."}

## Consequences

${options.consequences ?? "Example consequence."}
${options.securityNotes === undefined ? "" : `\n## Security Notes\n\n${options.securityNotes}\n`}
## Related Documents

- Example.
`,
    "utf8",
  );
}

async function writeAdr(rootDir: string, status: string, consequences: string): Promise<void> {
  const adrDir = path.join(rootDir, "docs/adrs");
  await mkdir(adrDir, { recursive: true });
  await writeFile(
    path.join(adrDir, "ADR-0001-example.md"),
    `# ADR-0001: Example

## Status

${status}

## Context

Example context.

## Decision

Example decision.

## Alternatives Considered

Example alternative.

## Consequences

${consequences}

## Related Documents

- Example.
`,
    "utf8",
  );
}
