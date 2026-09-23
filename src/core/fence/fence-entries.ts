import {
  FENCE_HEADING_PATTERN,
  FENCE_NO_CONSTRAINT_PATTERN,
  FENCE_WHY_PATTERN,
  fenceFileKey,
} from "./generate-fence.js";

/**
 * Which answer a FENCES.md entry records. `why` is a human-confirmed reason;
 * `no-constraint` is a human confirming nothing in the file is deliberate;
 * `unknown` is a heading with neither standing line yet.
 */
export type FenceEntryStanding = "why" | "no-constraint" | "unknown";

export type FenceEntryRecord = {
  /** Full heading path, symbol suffix kept (`src/a.ts:writeLedger`). */
  path: string;
  /** File part of the heading: diffs and existence are per-file. */
  file: string;
  standing: FenceEntryStanding;
  /** The Why reason, or an empty string when there is none. */
  reason: string;
};

function stripCr(line: string): string {
  return line.endsWith("\r") ? line.slice(0, -1) : line;
}

/**
 * Every entry in a FENCES.md body, in file order. The first standing line under
 * a heading wins; a later one cannot silently replace it. Carriage returns are
 * tolerated for matching but the record keeps the reason trimmed.
 *
 * Shared by the fence check, the SessionStart hook parity test, and the
 * context-budget check so all three agree on which entries are which.
 */
export function parseFenceEntries(content: string): FenceEntryRecord[] {
  const records: FenceEntryRecord[] = [];
  let current: FenceEntryRecord | null = null;

  for (const raw of content.split("\n")) {
    const line = stripCr(raw);
    const heading = FENCE_HEADING_PATTERN.exec(line);
    if (heading !== null) {
      const entryPath = (heading[1] ?? "").trim();
      if (entryPath !== "") {
        current = {
          path: entryPath,
          file: fenceFileKey(entryPath),
          standing: "unknown",
          reason: "",
        };
        records.push(current);
      } else {
        current = null;
      }
      continue;
    }

    if (current === null || current.standing !== "unknown") {
      continue;
    }
    const why = FENCE_WHY_PATTERN.exec(line);
    if (why !== null) {
      current.standing = "why";
      current.reason = (why[1] ?? "").trim();
      continue;
    }
    const noConstraint = FENCE_NO_CONSTRAINT_PATTERN.exec(line);
    if (noConstraint !== null) {
      current.standing = "no-constraint";
    }
  }

  return records;
}

/**
 * Standing `Why:` reason per fenced file, first entry winning: the fence check
 * reads the file by path, so two headings for one file cannot mean two reasons.
 */
export function whyReasonsByFile(content: string): Map<string, string> {
  const reasons = new Map<string, string>();
  for (const record of parseFenceEntries(content)) {
    if (record.standing === "why" && !reasons.has(record.file)) {
      reasons.set(record.file, record.reason);
    }
  }
  return reasons;
}

/**
 * Files a human cleared with no constraint and no later real reason. A `Why:`
 * entry for the file wins over a no-constraint one: a real reason replaces
 * "no constraint", never the other way round.
 */
export function noConstraintFiles(content: string): Set<string> {
  const cleared = new Set<string>();
  const reasoned = new Set<string>();
  for (const record of parseFenceEntries(content)) {
    if (record.standing === "why") {
      reasoned.add(record.file);
    } else if (record.standing === "no-constraint") {
      cleared.add(record.file);
    }
  }
  for (const file of reasoned) {
    cleared.delete(file);
  }
  return cleared;
}

/**
 * The `full` variable in the SessionStart hook: the `## ` heading and `Why: `
 * lines of entries that record a reason, in file order, raw (untrimmed) so the
 * shell pipeline and this function agree byte for byte. No-constraint entries
 * are not injected; they tell an agent nothing it needs before editing.
 */
export function fenceIndexLines(content: string): string[] {
  const lines: string[] = [];
  let pending: string | null = null;

  for (const raw of content.split("\n")) {
    const line = stripCr(raw);
    if (line.startsWith("## ")) {
      pending = raw;
      continue;
    }
    if (line.startsWith("Why: ")) {
      if (pending !== null) {
        lines.push(pending);
        pending = null;
      }
      lines.push(raw);
      continue;
    }
    if (line.startsWith("No constraint:")) {
      pending = null;
    }
  }

  return lines;
}
