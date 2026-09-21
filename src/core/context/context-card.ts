/**
 * Context cards: one Markdown file per area of the codebase at
 * `<docsDir>/context/<name>.md`.
 *
 * The headings are exact (writers must use them); this reader is tolerant:
 * unknown sections are ignored, missing sections read as empty, and bullets
 * work with or without backticks. Hand-editing is expected here, unlike
 * FENCES.md, so strictness would punish the workflow the feature needs.
 */

export const CONTEXT_DIR_NAME = "context";

/** `<docsDir>/context`, so cards follow a moved memory folder. */
export function contextDir(docsDir: string): string {
  return `${docsDir.replace(/\/+$/u, "")}/${CONTEXT_DIR_NAME}`;
}

export type ContextCardStartHere = {
  /** Repo-relative path as written, e.g. `src/lib/split.ts`. */
  path: string;
  /** One line of what the path is. */
  note: string;
};

export type ContextCard = {
  /** Repo-relative path to the card file, e.g. `docs/context/billing.md`. */
  file: string;
  /** File slug without extension, e.g. `billing`. */
  name: string;
  title: string;
  purpose: string;
  answers: string[];
  alsoKnownAs: string[];
  startHere: ContextCardStartHere[];
  rules: string[];
  pitfalls: string[];
  appliesTo: string[];
};

const KNOWN_SECTIONS = new Set([
  "purpose",
  "answers",
  "also known as",
  "start here",
  "rules",
  "pitfalls",
  "applies to",
]);

/** Guidance comments the scaffold leaves behind; never indexed, never shown. */
const COMMENT_PATTERN = /<!--[\s\S]*?-->/gu;

function stripComments(text: string): string {
  return text.replace(COMMENT_PATTERN, "");
}

function splitSections(content: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let current: string | null = null;
  for (const line of content.split("\n")) {
    const heading = /^##\s+(.+?)\s*$/u.exec(line);
    if (heading !== null) {
      const name = (heading[1] ?? "").trim().toLowerCase();
      current = KNOWN_SECTIONS.has(name) ? name : null;
      if (current !== null && !sections.has(current)) {
        sections.set(current, []);
      }
      continue;
    }
    if (current !== null) {
      sections.get(current)?.push(line);
    }
  }
  return sections;
}

function bullets(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const match = /^\s*[-*]\s+(.+?)\s*$/u.exec(line);
    if (match === null) {
      continue;
    }
    const text = stripOuterBackticks((match[1] ?? "").trim());
    if (text !== "") {
      items.push(text);
    }
  }
  return items;
}

function stripOuterBackticks(text: string): string {
  if (text.length >= 2 && text.startsWith("`") && text.endsWith("`")) {
    return text.slice(1, -1).trim();
  }
  return text;
}

function prose(lines: string[]): string {
  return stripComments(lines.join("\n")).replace(/\s+/gu, " ").trim();
}

/**
 * Parse one Start Here bullet into a path plus its note. The path is the
 * first backticked span when there is one (`src/lib/split.ts` — note...),
 * otherwise the first whitespace-separated token. A bullet with no note
 * keeps an empty note rather than failing.
 */
function parseStartHere(bullet: string): ContextCardStartHere {
  const ticked = /`([^`]+)`/u.exec(bullet);
  if (ticked !== null) {
    const path = (ticked[1] ?? "").trim();
    const note = bullet
      .replace(ticked[0], " ")
      .replace(/^[\s—–-]+/u, "")
      .replace(/\s+/gu, " ")
      .trim();
    return { path, note };
  }
  const [first, ...rest] = bullet.split(/\s+/u);
  return {
    path: first ?? "",
    note: rest
      .join(" ")
      .replace(/^[\s—–\-:]+/u, "")
      .trim(),
  };
}

/** The file part of a card path, mirroring the fence key: a `:symbol` suffix names no file. */
export function cardFileKey(cardPath: string): string {
  const separator = cardPath.indexOf(":");
  return separator === -1 ? cardPath : cardPath.slice(0, separator);
}

export function parseContextCard(content: string, file: string): ContextCard {
  const title =
    (/^#\s+(.+?)\s*$/mu.exec(stripComments(content))?.[1] ?? "").trim() ||
    (file.split("/").pop()?.replace(/\.md$/iu, "") ?? file);
  const sections = splitSections(content);
  const linesOf = (section: string): string[] => sections.get(section) ?? [];

  return {
    file,
    name: file.split("/").pop()?.replace(/\.md$/iu, "") ?? file,
    title,
    purpose: prose(linesOf("purpose")),
    answers: bullets(linesOf("answers")),
    alsoKnownAs: bullets(linesOf("also known as")),
    startHere: bullets(linesOf("start here"))
      .map(parseStartHere)
      .filter((entry) => entry.path !== ""),
    rules: bullets(linesOf("rules")),
    pitfalls: bullets(linesOf("pitfalls")),
    appliesTo: bullets(linesOf("applies to")),
  };
}

/**
 * Scaffold a new card with the exact shape readers parse and empty sections.
 * Guidance rides in HTML comments so the parser and the index never see it.
 */
export function renderContextCard(title: string, purpose: string): string {
  return [
    `# ${title}`,
    "",
    "## Purpose",
    "",
    purpose.trim(),
    "",
    "## Answers",
    "",
    "<!-- Task phrasings in the words a user or agent would type, one per bullet.",
    "This list is what search matches — add the task you were just given, phrased the way it was asked. -->",
    "",
    "## Also Known As",
    "",
    "<!-- Synonyms and domain words, one per bullet, so jargon finds the area. -->",
    "",
    "## Start Here",
    "",
    "<!-- Ordered reading list: one bullet per path, path first plus one line of what it is. -->",
    "",
    "## Rules",
    "",
    "<!-- Pointers, never copies: ADR ids, fence paths, convention names. -->",
    "",
    "## Pitfalls",
    "",
    "<!-- Pointers to lessons and known mistakes in this area. -->",
    "",
    "## Applies To",
    "",
    "<!-- Path patterns this card covers, same syntax as an ADR Applies To. -->",
    "",
  ].join("\n");
}
