/**
 * Lessons by area: the reader for `LESSONS.md` (under `docsDir`, as today).
 *
 * A sectioned file groups bullets under `##` headings:
 *
 * ```markdown
 * # Lessons
 *
 * ## Always
 *
 * - Never log a raw database driver error.
 *
 * ## Mongo indexes
 *
 * Applies To:
 * - `internal/db/**`
 *
 * Also Known As: index, unique, migration
 *
 * - Existing index names are part of deployment compatibility.
 * ```
 *
 * Rules for the reader (tolerant, like the context card reader):
 *
 * - `## Always` (case-insensitive) is the always-loaded section. Any other
 *   `##` heading is an area.
 * - An area may have an `Applies To:` list (same patterns as ADRs; matched
 *   with `matchesPattern`) and an `Also Known As:` line. Both are optional.
 * - Bullets under a heading are that section's lessons. Wrapped continuation
 *   lines belong to the bullet above.
 * - A flat file with no `##` sections still works: it reads as one unnamed
 *   area, searched bullet by bullet as today. Nothing breaks for existing
 *   repositories.
 */

export const LESSONS_FILE = "60-engineering/LESSONS.md";

export type LessonSection = {
  /** Area title as written, e.g. `Mongo indexes`. Empty for a flat legacy file. */
  title: string;
  /** Path patterns from the `Applies To:` list, backticks stripped. */
  appliesTo: string[];
  /** Synonyms from the `Also Known As:` line. */
  alsoKnownAs: string[];
  /** The section's lesson bullets, continuations joined. */
  bullets: string[];
};

export type ParsedLessons = {
  /** Bullets under `## Always`: loaded into every session. */
  always: string[];
  /** One entry per area heading. Empty for a flat legacy file. */
  areas: LessonSection[];
  /** The flat-file fallback: every bullet, searched as today. */
  flat: string[];
  /** True when the file has at least one `##` section. */
  isSectioned: boolean;
};

const HEADING_PATTERN = /^##\s+(.+?)\s*$/u;
const BULLET_PATTERN = /^\s*[-*]\s+(.+?)\s*$/u;
const APPLIES_TO_PATTERN = /^applies\s+to\s*:?\s*(.*)$/iu;
const ALSO_KNOWN_AS_PATTERN = /^also\s+known\s+as\s*:?\s*(.*)$/iu;

/** Total bullets across every tier, for the doctor's size checks. */
export function countLessonBullets(lessons: ParsedLessons): number {
  return (
    lessons.always.length +
    lessons.areas.reduce((sum, area) => sum + area.bullets.length, 0) +
    (lessons.isSectioned ? 0 : lessons.flat.length)
  );
}

export function parseLessons(content: string): ParsedLessons {
  const lines = content.split("\n");
  const sections = splitSections(lines);
  if (sections.length === 0) {
    return { always: [], areas: [], flat: bulletsOf(lines), isSectioned: false };
  }

  let always: string[] = [];
  const areas: LessonSection[] = [];
  for (const section of sections) {
    if (section.title.trim().toLowerCase() === "always") {
      always = sectionBullets(section.lines);
    } else {
      areas.push(parseArea(section.title, section.lines));
    }
  }
  return { always, areas, flat: [], isSectioned: true };
}

/**
 * The flattened Always section as the SessionStart hook injects it: the body
 * lines between the `## Always` heading (case-insensitive) and the next `##`
 * heading, bullet markers stripped, joined to one line with a trailing space.
 *
 * This mirrors the hook's awk/sed pipeline line for line — section scan,
 * comment strip, marker strip, blank skip, single-space join — so the
 * context-budget check measures the exact bytes the hook emits.
 */
export function flattenAlwaysSection(content: string): string {
  const parts: string[] = [];
  let want = false;
  for (const line of content.split("\n")) {
    if (/^##\s+/u.test(line)) {
      want = /^##\s+always\s*$/iu.test(line);
      continue;
    }
    if (!want) {
      continue;
    }
    const text = line
      .replace(/<!--.*?-->/gu, "")
      .replace(/^\s*[-*]\s*/u, "")
      .trim();
    if (text !== "") {
      parts.push(text);
    }
  }
  const flat = parts.join(" ").replace(/\s+/gu, " ").trim();
  return flat === "" ? "" : `${flat} `;
}

/** Repo-relative path to LESSONS.md under a docs dir, for display lines. */
export function lessonsPath(docsDir: string): string {
  return pathPosixJoin(docsDir, LESSONS_FILE);
}

function pathPosixJoin(docsDir: string, file: string): string {
  return `${docsDir.replace(/\/+$/u, "")}/${file}`;
}

type RawSection = {
  title: string;
  lines: string[];
};

function splitSections(lines: string[]): RawSection[] {
  const sections: RawSection[] = [];
  let current: RawSection | null = null;
  for (const line of lines) {
    const heading = HEADING_PATTERN.exec(line);
    if (heading !== null) {
      current = { title: (heading[1] ?? "").trim(), lines: [] };
      sections.push(current);
      continue;
    }
    current?.lines.push(line);
  }
  return sections;
}

function parseArea(title: string, lines: string[]): LessonSection {
  const appliesTo: string[] = [];
  const alsoKnownAs: string[] = [];
  const bullets: string[] = [];
  // Header lines come first: a bare `Applies To:` / `Also Known As:` line puts
  // the following bullets in header mode until the first real lesson bullet.
  let headerMode: "applies" | "aka" | null = null;
  let lessonsStarted = false;

  const joined = joinContinuations(lines);
  for (const entry of joined) {
    if (entry.kind === "prose") {
      const applies = APPLIES_TO_PATTERN.exec(entry.text);
      if (applies !== null && !lessonsStarted) {
        pushCommaList(appliesTo, applies[1] ?? "");
        headerMode = (applies[1] ?? "").trim() === "" ? "applies" : null;
        continue;
      }
      const aka = ALSO_KNOWN_AS_PATTERN.exec(entry.text);
      if (aka !== null && !lessonsStarted) {
        pushCommaList(alsoKnownAs, aka[1] ?? "");
        headerMode = (aka[1] ?? "").trim() === "" ? "aka" : null;
        continue;
      }
      // Other prose continues the bullet above (already joined) or is ignored.
      continue;
    }

    if (!lessonsStarted && headerMode === "applies" && isPatternBullet(entry.text)) {
      appliesTo.push(stripOuterBackticks(entry.text));
      continue;
    }
    if (!lessonsStarted && headerMode === "aka") {
      alsoKnownAs.push(stripOuterBackticks(entry.text));
      continue;
    }
    lessonsStarted = true;
    headerMode = null;
    bullets.push(stripOuterBackticks(entry.text));
  }
  return { title, appliesTo, alsoKnownAs, bullets };
}

/** A bullet that names only a path or pattern, never a lesson sentence. */
function isPatternBullet(text: string): boolean {
  const stripped = stripOuterBackticks(text);
  if (/\s/u.test(stripped)) {
    return false;
  }
  return (
    text.includes("`") || stripped.includes("/") || stripped.includes("*") || stripped.includes("?")
  );
}

function pushCommaList(target: string[], rest: string): void {
  for (const part of rest.split(/,/u)) {
    const term = part.replace(/`/gu, "").trim();
    if (term !== "") {
      target.push(term);
    }
  }
}

type JoinedLine = {
  kind: "bullet" | "prose";
  text: string;
};

/**
 * One pass over raw lines: bullets start entries, wrapped continuation lines
 * join the bullet above. Anything before the first bullet is prose (a header
 * line); other stray prose is kept so the caller can match header lines.
 */
function joinContinuations(lines: string[]): JoinedLine[] {
  const entries: JoinedLine[] = [];
  for (const line of lines) {
    const match = BULLET_PATTERN.exec(line);
    if (match !== null) {
      const text = (match[1] ?? "").trim();
      if (text !== "") {
        entries.push({ kind: "bullet", text });
      }
      continue;
    }
    if (line.trim() === "") {
      continue;
    }
    // A header line is metadata even right after a bullet: without this, an
    // `Also Known As:` line following an Applies To list glues onto the last
    // pattern as a continuation and both are lost.
    if (/^(applies\s+to|also\s+known\s+as)\s*(:|$)/iu.test(line.trim())) {
      entries.push({ kind: "prose", text: line.trim() });
      continue;
    }
    const last = entries[entries.length - 1];
    if (last?.kind === "bullet") {
      last.text = `${last.text} ${line.trim()}`;
    } else {
      entries.push({ kind: "prose", text: line.trim().replace(/^[-*]\s+/u, "") });
    }
  }
  return entries;
}

/**
 * Bullets with their wrapped continuation lines joined. A non-bullet,
 * non-blank line continues the bullet above; Anything before the first
 * bullet is ignored. Applies To / Also Known As lines are already removed.
 */
function sectionBullets(lines: string[]): string[] {
  return bulletsWithContinuations(lines);
}

function bulletsWithContinuations(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const match = BULLET_PATTERN.exec(line);
    if (match !== null) {
      const text = stripOuterBackticks((match[1] ?? "").trim());
      if (text !== "") {
        items.push(text);
      }
      continue;
    }
    if (line.trim() === "" || items.length === 0) {
      continue;
    }
    const continuation = line.trim();
    if (continuation !== "") {
      items[items.length - 1] = `${items[items.length - 1] ?? ""} ${continuation}`;
    }
  }
  return items;
}

/** Bullets of a flat legacy file: every `-`/`-` line, continuations joined. */
function bulletsOf(lines: string[]): string[] {
  return bulletsWithContinuations(lines);
}

function stripOuterBackticks(text: string): string {
  if (text.length >= 2 && text.startsWith("`") && text.endsWith("`")) {
    return text.slice(1, -1).trim();
  }
  return text;
}
