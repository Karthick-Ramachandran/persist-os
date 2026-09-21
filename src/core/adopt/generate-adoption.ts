import path from "node:path";

import type { WriteFileInput } from "../filesystem/write-plan.js";
import { summarizeSignals, type RepoSignals } from "./inspect-repo.js";

/** Default adoption-report location, when the memory folder has not moved. */
export const ADOPTION_REPORT_PATH = "docs/adopt/ADOPTION_REPORT.md";

/** The report lives beside the memory it proposes: under the configured docs dir. */
export function adoptionReportPath(docsDir: string): string {
  return path.posix.join(docsDir, "adopt/ADOPTION_REPORT.md");
}

export type GenerateAdoptionOptions = {
  docsDir: string;
  adrDir: string;
  signals: RepoSignals;
};

export function generateAdoptionFiles(options: GenerateAdoptionOptions): WriteFileInput[] {
  const files: WriteFileInput[] = [
    {
      path: adoptionReportPath(options.docsDir),
      content: renderReport(options.docsDir, options.adrDir, options.signals),
    },
  ];

  for (const framework of options.signals.frameworks) {
    files.push({
      path: `${options.adrDir}/proposed/ADR-PROPOSED-adopt-${frameworkSlug(framework)}.md`,
      content: renderProposedAdr(options.docsDir, framework),
    });
  }

  return files;
}

function renderReport(docsDir: string, adrDir: string, signals: RepoSignals): string {
  return `# Adoption Report

## Status

Proposed. Everything below is inferred from this repository and requires human review. Nothing here
is accepted repository memory until you accept it.

## Detected Signals

Each signal notes the file it was inferred from. If one is wrong, correct the source or edit this
report — nothing here is accepted.

${summarizeSignals(signals).join("\n")}

## Proposed Decisions

${renderProposedDecisions(adrDir, signals)}

## Review Checklist

- [ ] Confirm the detected languages and package manager (and the source each was read from).
- [ ] Confirm where tests were detected, or point Persist at the right location if it is wrong.
- [ ] Accept or reject each proposed framework ADR under \`${adrDir}/proposed/\`.
- [ ] Run \`persist init\` to establish neutral repository memory if it does not exist yet.
- [ ] Record any decision you accept with \`persist adr create\` or by accepting the proposed ADR.

## Notes

This report was produced by \`persist adopt\` through read-only inspection of manifest and marker
files. No repository code was executed and no decision was accepted automatically.
`;
}

function renderProposedDecisions(adrDir: string, signals: RepoSignals): string {
  if (signals.frameworks.length === 0) {
    return "- No framework decisions were inferred. Add decisions with `persist adr create` as needed.";
  }

  return signals.frameworks
    .map(
      (framework) =>
        `- Proposed: record **${framework}** as an architecture decision (see ` +
        `\`${adrDir}/proposed/ADR-PROPOSED-adopt-${frameworkSlug(framework)}.md\`). Requires review.`,
    )
    .join("\n");
}

function renderProposedAdr(docsDir: string, framework: string): string {
  return `# Proposed ADR: Use ${framework}

## Status

Proposed

## Context

\`persist adopt\` detected ${framework} in this repository through read-only inspection.

## Decision

Consider recording ${framework} as an accepted architecture decision. This is proposed by adoption
and is not accepted until a human reviews and accepts it.

## Alternatives Considered

- Record a different framework.
- Leave the decision unrecorded for now.

## Consequences

- Captures a framework already in use as reviewable repository memory.
- Requires explicit human acceptance before it becomes repository truth.

## Related Documents

- \`${docsDir}/10-architecture/ARCHITECTURE.md\` — record the accepted architecture here once promoted.
- The adoption report generated alongside this proposal.
`;
}

function frameworkSlug(framework: string): string {
  return framework
    .toLowerCase()
    .replace(/\./gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}
