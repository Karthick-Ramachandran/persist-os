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

export type FenceEntry = {
  /** Repo-relative path, optionally suffixed with a symbol or line (\`src/a.ts:writeLedger\`). */
  path: string;
  /** One sentence. Why the code is shaped this way. */
  why: string;
  /** The person who confirmed it. */
  by?: string;
  /** A related decision, when one exists. */
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

/** The path portion, with any `:symbol` suffix kept but the file part normalised and checked. */
function normalizeFencePath(raw: string): string {
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
 */
export function addFenceEntry(existing: string | undefined, entry: FenceEntry): string {
  const path = normalizeFencePath(entry.path);
  const why = normalizeWhy(entry.why);
  const date = entry.date ?? new Date().toISOString().slice(0, 10);
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
