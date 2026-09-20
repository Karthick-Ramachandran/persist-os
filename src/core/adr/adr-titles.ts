/**
 * ADR title identity for duplicate-title detection: the `# ` heading with any decision-ref
 * prefix stripped, normalised by trim, whitespace collapse, and lowercase. File names are
 * deliberately not identity — `ADR-0001-use-postgres.md` and `ADR-0003-use-postgres.md` are
 * different files that can hold the same decision title, which is exactly the drift.
 */
export function extractAdrTitle(content: string): string | null {
  for (const line of content.split(/\r?\n/u)) {
    const match = /^#\s+(.+?)\s*$/u.exec(line);
    if (match !== null) {
      const title = stripDecisionRefPrefix(match[1] ?? "").trim();
      return title.length > 0 ? title : null;
    }
  }

  return null;
}

export function normalizeAdrTitle(title: string): string {
  return title.trim().replace(/\s+/gu, " ").toLowerCase();
}

/**
 * A live accepted decision: the `## Status` section says accepted and does not hand off to a
 * successor. `Accepted — superseded by ADR-…` is history, not a live decision, so
 * supersede-with-an-unchanged-title (the natural succession pair) is not a collision.
 * Section matching mirrors the standards check (`## Status`, case-insensitive, to the next
 * `## ` heading).
 */
export function isLiveAcceptedAdr(content: string): boolean {
  const section = readStatusSection(content);
  if (section === undefined) {
    return false;
  }

  return /\baccepted\b/iu.test(section) && !isSupersededAdr(content);
}

/** A decision record handed off to a successor — history, invisible to collision detection. */
export function isSupersededAdr(content: string): boolean {
  const section = readStatusSection(content);
  return section !== undefined && /\bsupersede/iu.test(section);
}

const DECISION_REF_PREFIX_PATTERN =
  /^(?:ADR(?:-PROPOSED)?(?:-\d+(?:-[A-Za-z0-9-]+)?)?|Proposed ADR)\s*:\s*/iu;

function stripDecisionRefPrefix(heading: string): string {
  return heading.replace(DECISION_REF_PREFIX_PATTERN, "");
}

function readStatusSection(content: string): string | undefined {
  const lines = content.split(/\r?\n/u);
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === "## status");

  if (startIndex === -1) {
    return undefined;
  }

  const body: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/u.test(lines[index] ?? "")) {
      break;
    }
    body.push(lines[index] ?? "");
  }

  return body.join("\n").trim();
}
