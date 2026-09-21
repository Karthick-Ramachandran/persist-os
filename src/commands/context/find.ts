import { getStyle } from "../../cli/style.js";
import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import {
  searchContext,
  type ScoredCard,
  type ScoredSecondary,
} from "../../core/context/search.js";

export type FindContextOptions = {
  rootDir: string;
  task: string;
  /** Maximum cards shown. Defaults to 3. */
  limit?: number;
};

export type FindContextCard = {
  title: string;
  file: string;
  matched: string[];
  startHere: { path: string; note: string }[];
  rules: string[];
  pitfalls: string[];
  score: number;
};

export type FindContextSecondary = {
  kind: string;
  label: string;
  file: string;
  matched: string[];
  detail: string;
};

export type FindContextResult = {
  task: string;
  cards: FindContextCard[];
  secondary: FindContextSecondary[];
  /** False when nothing cleared the threshold. Exit stays 0 either way. */
  matched: boolean;
};

export type FindContextErrorCode = "INVALID_TASK" | "NOT_INITIALIZED";

export class FindContextError extends Error {
  readonly code: FindContextErrorCode;
  readonly details: string[];

  constructor(code: FindContextErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "FindContextError";
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_LIMIT = 3;

/**
 * Deterministic lookup over context cards first, recorded decisions second.
 * Cards carry the task phrasings, so they answer when one covers the task;
 * ADRs, fences, conventions, and lessons are the fallback, marked as such.
 * Read-only: it never writes, and a miss is an empty result, not an error.
 */
export async function findContext(options: FindContextOptions): Promise<FindContextResult> {
  const task = options.task.trim().replace(/\s+/gu, " ");
  if (task === "") {
    throw new FindContextError(
      "INVALID_TASK",
      'Describe the task, e.g. `persist context "make rounding fair"`.',
    );
  }
  const limit = options.limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new FindContextError("INVALID_TASK", `--limit must be a positive integer.`);
  }

  const config = await loadRepoConfig(options.rootDir);
  const found = await searchContext(options.rootDir, task, {
    docsDir: config.docsDir,
    adrDir: config.adrDir,
  });

  const cards = found.cards.slice(0, limit).map(
    (hit: ScoredCard): FindContextCard => ({
      title: hit.card.title,
      file: hit.card.file,
      matched: hit.matched,
      startHere: hit.card.startHere,
      rules: hit.card.rules,
      pitfalls: hit.card.pitfalls,
      score: round(hit.score),
    }),
  );
  // Secondary records show only when no card covers the task — they answer a
  // different question ("what did we decide here") than the cards do.
  const secondary =
    cards.length > 0
      ? []
      : found.secondary.slice(0, limit).map(
          (hit: ScoredSecondary): FindContextSecondary => ({
            kind: hit.doc.kind,
            label: hit.doc.label,
            file: hit.doc.file,
            matched: hit.matched,
            detail: hit.doc.detail,
          }),
        );

  return { task, cards, secondary, matched: cards.length > 0 || secondary.length > 0 };
}

export function formatFindContextResult(result: FindContextResult): string {
  if (result.cards.length > 0) {
    return formatCards(result);
  }
  if (result.secondary.length > 0) {
    return formatSecondary(result);
  }
  return "No recorded memory matches this task.\n";
}

export function formatFindContextJson(result: FindContextResult): string {
  return `${JSON.stringify(
    {
      task: result.task,
      matched: result.matched,
      cards: result.cards,
      secondary: result.secondary,
    },
    null,
    2,
  )}\n`;
}

function formatCards(result: FindContextResult): string {
  const style = getStyle();
  const lines = [`Start here for "${result.task}":`, ""];
  for (const card of result.cards) {
    lines.push(
      `${style.accent(card.title)} (${card.file}) — matched: ${card.matched.join(", ")}`,
    );
    for (const entry of card.startHere) {
      lines.push(entry.note === "" ? `  ${entry.path}` : `  ${entry.path} — ${entry.note}`);
    }
    if (card.rules.length > 0) {
      lines.push(`  Rules: ${card.rules.map((rule) => clip(rule)).join(" · ")}`);
    }
    for (const pitfall of card.pitfalls) {
      lines.push(`  Pitfall: ${clip(pitfall)}`);
    }
    lines.push("");
  }
  // Drop the trailing blank line, keep the closing newline.
  lines.pop();
  return `${lines.join("\n")}\n`;
}

function formatSecondary(result: FindContextResult): string {
  const style = getStyle();
  const lines = [
    "No context card covers this task. The closest recorded decisions and fences:",
    "",
  ];
  for (const hit of result.secondary) {
    lines.push(
      `${style.accent(`${hit.kind} ${hit.label}`)} (${hit.file}) — matched: ${hit.matched.join(", ")}`,
    );
    lines.push(`  ${clip(hit.detail)}`);
  }
  return `${lines.join("\n")}\n`;
}

/** Pointer lines stay short: output is pointers, never whole files. */
function clip(text: string): string {
  const flat = text.replace(/\s+/gu, " ").trim();
  return flat.length > 120 ? `${flat.slice(0, 119)}…` : flat;
}

function round(score: number): number {
  return Math.round(score * 10000) / 10000;
}

// A lookup is only ever read inside its own repository's loop — the skill, the
// hook, and the agent habit — so one run outside an initialized repository has
// no dirs to read. Refuse like `context add` instead of falling back to
// defaults that would search the wrong folders.
async function loadRepoConfig(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      throw new FindContextError(
        "NOT_INITIALIZED",
        "No Persist OS config found — run `persist init` in this repository first. Context cards are only read inside their own repository.",
      );
    }

    throw error;
  }
}
