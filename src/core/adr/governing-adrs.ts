import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/**
 * An accepted, still-binding ADR and the paths it says it governs (ADR `## Applies To`).
 * Superseded and proposed ADRs never govern: the first no longer binds, the second does not yet.
 */
export type GoverningAdr = {
  /** `ADR-0001`. */
  id: string;
  /** Repo-relative path to the ADR file. */
  file: string;
  title: string;
  /** The first sentence or bullet of the Decision section, flattened to one line. */
  decision: string;
  /** Path patterns from `## Applies To`: `src/lib/**`, `src/billing.ts`, `src/api/`. */
  appliesTo: string[];
};

const ADR_FILE_PATTERN = /^(ADR-\d{4,})-[a-z0-9-]+\.md$/iu;

/** Accepted ADRs that declare the paths they govern. */
export async function readGoverningAdrs(rootDir: string, adrDir: string): Promise<GoverningAdr[]> {
  return (await readAcceptedAdrs(rootDir, adrDir)).filter((adr) => adr.appliesTo.length > 0);
}

/**
 * Every accepted, still-binding ADR, with or without an Applies To list. Context cards cite
 * ADRs by id, so a decision is looked up here even when it never declared its paths.
 */
export async function readAcceptedAdrs(rootDir: string, adrDir: string): Promise<GoverningAdr[]> {
  let names: string[];
  try {
    names = (await readdir(path.join(rootDir, adrDir), { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }

  const adrs: GoverningAdr[] = [];
  for (const name of names) {
    const match = ADR_FILE_PATTERN.exec(name);
    if (match === null) {
      continue;
    }

    const file = path.posix.join(adrDir, name);
    const content = await readFile(path.join(rootDir, file), "utf8");
    const status = section(content, "Status");
    if (!/\baccepted\b/iu.test(status) || /superseded\s+by/iu.test(status)) {
      continue;
    }

    const appliesTo = parseAppliesTo(section(content, "Applies To"));

    adrs.push({
      id: (match[1] ?? "").toUpperCase(),
      file,
      title: (/^#\s+(?:ADR-\d+:\s*)?(.+)$/mu.exec(content)?.[1] ?? name).trim(),
      decision: firstStatement(section(content, "Decision")),
      appliesTo,
    });
  }

  return adrs;
}

/** Whether a repo-relative path falls under one of an ADR's patterns. */
export function adrGoverns(adr: GoverningAdr, filePath: string): boolean {
  return adr.appliesTo.some((pattern) => matchesPattern(pattern, filePath));
}

/**
 * `**` spans directories, `*` stays within one, and a pattern without wildcards names a file or a
 * whole directory (`src/lib` and `src/lib/` both cover `src/lib/money.ts`).
 */
export function matchesPattern(pattern: string, filePath: string): boolean {
  const normalized = pattern.replace(/^\.\//u, "");
  if (!/[*?]/u.test(normalized)) {
    const prefix = normalized.replace(/\/+$/u, "");
    return filePath === prefix || filePath.startsWith(`${prefix}/`);
  }

  let source = "";
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index] ?? "";
    if (char === "*" && normalized[index + 1] === "*") {
      // `**/` matches zero or more whole directories; a trailing `**` matches the rest.
      if (normalized[index + 2] === "/") {
        source += "(?:.*/)?";
        index += 2;
      } else {
        source += ".*";
        index += 1;
      }
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/gu, "\\$&");
    }
  }
  return new RegExp(`^${source}$`, "u").test(filePath);
}

/** Bullet lines under `## Applies To`, backticks stripped. Prose and placeholders are ignored. */
function parseAppliesTo(body: string): string[] {
  return body
    .split("\n")
    .map((line) => /^\s*[-*]\s+`?([^`\s]+)`?\s*$/u.exec(line)?.[1])
    .filter((pattern): pattern is string => pattern !== undefined && pattern !== "");
}

function section(content: string, heading: string): string {
  const lines = content.split("\n");
  const start = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase(),
  );
  if (start === -1) {
    return "";
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/**
 * The decision in one line: the first sentence, or the first bullet. A lead-in that ends in a
 * colon introduces a list, so the first item comes with it ("… except activation: init asks").
 */
function firstStatement(body: string): string {
  const blocks = body
    .split(/\n\s*\n/u)
    .map((block) => block.trim())
    .filter((block) => block !== "");
  const first = statementOf(blocks[0] ?? "");
  if (first.endsWith(":") && blocks[1] !== undefined) {
    return clip(`${first} ${statementOf(blocks[1])}`);
  }
  return clip(first);
}

function statementOf(block: string): string {
  const text = /^[-*]\s+|^\d+\.\s+/u.test(block)
    ? (block.split(/\n(?=\s*(?:[-*]|\d+\.)\s)/u)[0] ?? "").replace(/^[-*]\s+|^\d+\.\s+/u, "")
    : block;
  const flat = text.replace(/\s+/gu, " ").trim();
  return /^(.+?[.!?])(\s|$)/u.exec(flat)?.[1] ?? flat;
}

function clip(sentence: string): string {
  return sentence.length > 240 ? `${sentence.slice(0, 237)}…` : sentence;
}
