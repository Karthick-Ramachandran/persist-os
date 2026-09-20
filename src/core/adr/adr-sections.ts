/**
 * The section headings every accepted ADR must contain. This is the single source of truth:
 * `persist doctor` validates against it, and every generator that emits a proposed ADR
 * (`persist mcp add`, `persist adopt`) normalizes its body to include all of them — so a
 * proposed ADR stays healthy once a human promotes it with `persist adr accept`.
 */
export const REQUIRED_ADR_SECTIONS = [
  "## Status",
  "## Context",
  "## Decision",
  "## Alternatives Considered",
  "## Consequences",
  "## Related Documents",
] as const;

const SECTION_PLACEHOLDERS: Record<string, string> = {
  "## Related Documents":
    "- None yet. Link related ADRs, features, or modules as they are accepted.",
};

/**
 * Append any required ADR section missing from `body`, using a neutral proposed-stage placeholder.
 * Idempotent: a body that already contains every required section is returned unchanged (aside from
 * a single trailing newline). Generated proposed ADRs historically stopped at `## Consequences`,
 * which made them fail Doctor's `## Related Documents` check the moment they were accepted.
 */
export function ensureRequiredAdrSections(body: string): string {
  let result = body.replace(/\s+$/u, "");

  for (const section of REQUIRED_ADR_SECTIONS) {
    if (!result.includes(section)) {
      const placeholder = SECTION_PLACEHOLDERS[section] ?? "To be documented.";
      result += `\n\n${section}\n\n${placeholder}`;
    }
  }

  return `${result}\n`;
}
