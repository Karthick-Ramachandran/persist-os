import { normalizeOutputPath } from "../filesystem/safe-path.js";

/** FENCES.md location under the configured docs dir (ADR-0010). Never required, only written. */
export const FENCES_FILE = "60-engineering/FENCES.md";

/**
 * The header a new FENCES.md opens with. It explains the file to whoever opens it cold, because
 * the file is the only place the convention is written down.
 */
const FENCES_HEADER = `# Fences

Why code is shaped the way it is, for reasoning that never rose to an architecture decision.

Each entry is a path, one sentence of why, and the dated record of times the reason was
confirmed. A human answers the why — the whole premise is that the constraint lives in
someone's memory rather than in the code, so a guess inferred from the source is worse than
no entry at all.

Add an entry with \`persist fence add <path> --why "<reason>"\`.
`;

/** A fence section heading: `` ## `path` `` with an optional `:symbol` suffix. */
export const FENCE_HEADING_PATTERN = /^## `([^`]+)`/u;

/** The one-sentence standing reason directly under a fence heading. */
export const FENCE_WHY_PATTERN = /^Why:\s*(.+)$/u;

/**
 * The standing line of an entry whose file a human cleared: nothing in it is
 * deliberate. Exact shape, because the fence check, the SessionStart hook, and
 * the context-budget check all parse it.
 */
export const FENCE_NO_CONSTRAINT_PATTERN = /^No constraint:\s*(.+)$/u;

/** The standing line of an entry whose file a human cleared: nothing deliberate. */
export const NO_CONSTRAINT_STANDING =
  "No constraint: a human confirmed nothing here is deliberate; change it freely.";

/**
 * The file part of a fence key. A fence may name a symbol — `src/billing.ts:writeLedger` — but a
 * diff is per-file and so is existence, so both the matcher and the rot check work on the file.
 */
export function fenceFileKey(fencePath: string): string {
  const separator = fencePath.indexOf(":");
  return separator === -1 ? fencePath : fencePath.slice(0, separator);
}

export type FenceEntry = {
  /** Repo-relative path, optionally suffixed with a symbol or line (\`src/a.ts:writeLedger\`). */
  path: string;
  /** One sentence. Why the code is shaped this way. Absent with `noConstraint`. */
  why?: string;
  /** Record that a human confirmed nothing in the file is deliberate. */
  noConstraint?: boolean;
  /** The person who confirmed it. Required with `noConstraint`. */
  by?: string;
  /** A related decision, when one exists. Never with `noConstraint`. */
  adr?: string;
  /** ISO date for the crossing line. Injectable so tests are not clock-dependent. */
  date?: string;
};

export class FenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FenceValidationError";
  }
}

/**
 * The path portion, with any `:symbol` suffix kept but the file part normalised and checked.
 * Exported so `fence add` validates existence against the recorded path, not the raw input.
 */
export function normalizeFencePath(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === "") {
    throw new FenceValidationError("A fence needs a path.");
  }

  const separator = trimmed.indexOf(":");
  const filePart = separator === -1 ? trimmed : trimmed.slice(0, separator);
  const suffix = separator === -1 ? "" : trimmed.slice(separator);

  // Reuse the write pipeline's own rules: a fence must not name a path outside the repository.
  const normalized = normalizeOutputPath(filePart);
  return `${normalized}${suffix}`;
}

function normalizeWhy(raw: string): string {
  // The Why must stay on one line: the SessionStart hook greps `^Why: ` and flattens the index,
  // and fence-check reads the first Why line under a heading. A wrapped reason would be truncated.
  const collapsed = raw.replace(/\s+/gu, " ").trim();

  if (collapsed === "") {
    throw new FenceValidationError('A fence needs a reason. Pass --why "<reason>".');
  }

  return collapsed;
}

/** `## \`path\`` exactly as FENCE_HEADING_PATTERN in fence-check expects it. */
function headingFor(path: string): string {
  return `## \`${path}\``;
}

/**
 * Render a new FENCES.md, or the same file with one entry added or extended.
 *
 * An existing path gains a dated crossing line rather than a second heading: the file is read by
 * path, so two headings for one path would make the standing reason ambiguous.
 *
 * A `noConstraint` entry records the second answer a fence can get: a named human confirmed
 * nothing in the file is deliberate. A later `--why` for the same heading replaces the standing
 * line and keeps the history; `--no-constraint` over a standing `Why:` is refused, so a real
 * reason is never replaced by its absence.
 */
export function addFenceEntry(existing: string | undefined, entry: FenceEntry): string {
  const path = normalizeFencePath(entry.path);
  const date = entry.date ?? new Date().toISOString().slice(0, 10);

  if (entry.noConstraint === true) {
    if (entry.why !== undefined) {
      throw new FenceValidationError("Pass either --why or --no-constraint, not both.");
    }
    if (entry.adr !== undefined) {
      throw new FenceValidationError("--adr cannot be used with --no-constraint.");
    }
    if (entry.by === undefined || entry.by.trim() === "") {
      throw new FenceValidationError(
        "--by <name> is required with --no-constraint: the record is only worth something because a named person gave it.",
      );
    }
    return addNoConstraintEntry(existing, path, entry.by.trim(), date);
  }

  const why = normalizeWhy(entry.why ?? "");
  const crossing = `- ${date} — recorded${entry.by === undefined ? "" : ` by ${entry.by}`}.`;

  const body = existing === undefined || existing.trim() === "" ? FENCES_HEADER : existing;
  const heading = headingFor(path);

  if (!body.includes(heading)) {
    const block = [
      heading,
      "",
      `Why: ${why}`,
      ...(entry.adr === undefined ? [] : [`Decision: ${entry.adr}`]),
      "",
      crossing,
      "",
    ].join("\n");

    return `${body.replace(/\s+$/u, "")}\n\n${block}`;
  }

  const standing = standingLine(body, heading);
  if (standing !== null && FENCE_NO_CONSTRAINT_PATTERN.test(standing)) {
    return replaceNoConstraintWithWhy(body, heading, {
      why,
      adr: entry.adr,
      by: entry.by,
      date,
    });
  }

  // The path is already fenced: keep the standing reason and append the crossing to its block.
  const lines = body.split("\n");
  const start = lines.indexOf(heading);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index]?.startsWith("## ")) {
      end = index;
      break;
    }
  }

  const block = lines.slice(start, end);
  while (block.length > 0 && (block[block.length - 1] ?? "").trim() === "") {
    block.pop();
  }
  block.push(crossing, "");

  return [...lines.slice(0, start), ...block, ...lines.slice(end)].join("\n");
}

/**
 * Write a no-constraint entry: the standing line says a named human confirmed
 * nothing in the file is deliberate, plus a dated confirmation line. A repeat
 * answer for the same heading appends another dated line, like any crossing.
 */
function addNoConstraintEntry(
  existing: string | undefined,
  path: string,
  by: string,
  date: string,
): string {
  const crossing = `- ${date} — no constraint, confirmed by ${by}.`;
  const body = existing === undefined || existing.trim() === "" ? FENCES_HEADER : existing;
  const heading = headingFor(path);

  if (!body.includes(heading)) {
    const block = [heading, "", NO_CONSTRAINT_STANDING, "", crossing, ""].join("\n");

    return `${body.replace(/\s+$/u, "")}\n\n${block}`;
  }

  const standing = standingLine(body, heading);
  if (standing !== null && FENCE_WHY_PATTERN.test(standing)) {
    throw new FenceValidationError(
      `${path} has a recorded reason: "${standingReason(standing)}". ` +
        `A human can edit or remove it in FENCES.md if it no longer holds.`,
    );
  }

  const lines = body.split("\n");
  const start = lines.indexOf(heading);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index]?.startsWith("## ")) {
      end = index;
      break;
    }
  }

  const block = lines.slice(start, end);
  while (block.length > 0 && (block[block.length - 1] ?? "").trim() === "") {
    block.pop();
  }
  block.push(crossing, "");

  return [...lines.slice(0, start), ...block, ...lines.slice(end)].join("\n");
}

/**
 * A real reason replaces "no constraint": the standing line becomes the Why,
 * the earlier confirmation stays in the history, and a dated line says what
 * happened and who confirmed it.
 */
function replaceNoConstraintWithWhy(
  body: string,
  heading: string,
  entry: { why: string; adr?: string; by?: string; date: string },
): string {
  const lines = body.split("\n");
  const start = lines.indexOf(heading);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index]?.startsWith("## ")) {
      end = index;
      break;
    }
  }

  const rest = lines.slice(start + 1, end);
  let standingIndex = rest.findIndex((line) => FENCE_NO_CONSTRAINT_PATTERN.test(line));
  if (standingIndex === -1) {
    standingIndex = 0;
  }
  const replacement = [
    `Why: ${entry.why}`,
    ...(entry.adr === undefined ? [] : [`Decision: ${entry.adr}`]),
  ];
  rest.splice(standingIndex, 1, ...replacement);

  const block = [heading, ...rest];
  while (block.length > 0 && (block[block.length - 1] ?? "").trim() === "") {
    block.pop();
  }
  block.push(
    `- ${entry.date} — reason recorded, replacing no constraint${entry.by === undefined ? "" : `, by ${entry.by}`}.`,
    "",
  );

  return [...lines.slice(0, start), ...block, ...lines.slice(end)].join("\n");
}

/** The standing `Why:` or `No constraint:` line of an existing heading, if any. */
function standingLine(body: string, heading: string): string | null {
  const lines = body.split("\n");
  const start = lines.indexOf(heading);
  if (start === -1) {
    return null;
  }
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.startsWith("## ")) {
      return null;
    }
    if (FENCE_WHY_PATTERN.test(line) || FENCE_NO_CONSTRAINT_PATTERN.test(line)) {
      return line;
    }
  }
  return null;
}

function standingReason(standing: string): string {
  return (FENCE_WHY_PATTERN.exec(standing)?.[1] ?? "").trim();
}
