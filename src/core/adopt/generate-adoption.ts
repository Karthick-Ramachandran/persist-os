import type { WriteFileInput } from "../filesystem/write-plan.js";
import type { RepoSignals } from "./inspect-repo.js";

export const ADOPTION_REPORT_PATH = "docs/adopt/ADOPTION_REPORT.md";

export type GenerateAdoptionOptions = {
  adrDir: string;
  signals: RepoSignals;
};

export function generateAdoptionFiles(options: GenerateAdoptionOptions): WriteFileInput[] {
  const files: WriteFileInput[] = [
    {
      path: ADOPTION_REPORT_PATH,
      content: renderReport(options.signals),
    },
  ];

  for (const framework of options.signals.frameworks) {
    files.push({
      path: `${options.adrDir}/proposed/ADR-PROPOSED-adopt-${frameworkSlug(framework)}.md`,
      content: renderProposedAdr(framework),
    });
  }

  return files;
}

function renderReport(signals: RepoSignals): string {
  return `# Adoption Report

## Status

Proposed. Everything below is inferred from this repository and requires human review. Nothing here
is accepted repository memory until you accept it.

## Detected Signals

- Languages: ${formatList(signals.languages)}
- Package manager: ${signals.packageManager ?? "none detected"}
- Frameworks: ${formatList(signals.frameworks)}
- Tests present: ${formatBool(signals.hasTests)}
- README present: ${formatBool(signals.hasReadme)}
- Docs folder present: ${formatBool(signals.hasDocs)}

## Proposed Decisions

${renderProposedDecisions(signals)}

## Review Checklist

- [ ] Confirm the detected languages and package manager.
- [ ] Accept or reject each proposed framework ADR under \`docs/adrs/proposed/\`.
- [ ] Run \`recall init\` to establish neutral repository memory if it does not exist yet.
- [ ] Record any decision you accept with \`recall adr create\` or by accepting the proposed ADR.

## Notes

This report was produced by \`recall adopt\` through read-only inspection of manifest and marker
files. No repository code was executed and no decision was accepted automatically.
`;
}

function renderProposedDecisions(signals: RepoSignals): string {
  if (signals.frameworks.length === 0) {
    return "- No framework decisions were inferred. Add decisions with `recall adr create` as needed.";
  }

  return signals.frameworks
    .map(
      (framework) =>
        `- Proposed: record **${framework}** as an architecture decision (see ` +
        `\`docs/adrs/proposed/ADR-PROPOSED-adopt-${frameworkSlug(framework)}.md\`). Requires review.`,
    )
    .join("\n");
}

function renderProposedAdr(framework: string): string {
  return `# Proposed ADR: Use ${framework}

## Status

Proposed

## Context

\`recall adopt\` detected ${framework} in this repository through read-only inspection.

## Decision

Consider recording ${framework} as an accepted architecture decision. This is proposed by adoption
and is not accepted until a human reviews and accepts it.

## Alternatives Considered

- Record a different framework.
- Leave the decision unrecorded for now.

## Consequences

- Captures a framework already in use as reviewable repository memory.
- Requires explicit human acceptance before it becomes repository truth.
`;
}

function frameworkSlug(framework: string): string {
  return framework
    .toLowerCase()
    .replace(/\./gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none detected";
}

function formatBool(value: boolean): string {
  return value ? "yes" : "no";
}
