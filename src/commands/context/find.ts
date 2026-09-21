import { getStyle } from "../../cli/style.js";
import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import {
  adrGoverns,
  matchesPattern,
  readAcceptedAdrs,
  type GoverningAdr,
} from "../../core/adr/governing-adrs.js";
import type { ContextCard } from "../../core/context/context-card.js";
import { searchContext, type ScoredCard, type ScoredSecondary } from "../../core/context/search.js";

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
  /** File names whose bridge boosted this card; empty when it did not fire. */
  bridge: string[];
  startHere: { path: string; note: string }[];
  /** The live Decision sentence of every accepted ADR this card's area falls under. */
  decisions: { id: string; title: string; decision: string; file: string }[];
  rules: string[];
  pitfalls: string[];
  score: number;
};

export type FindContextSecondary = {
  kind: string;
  label: string;
  file: string;
  matched: string[];
  /** File names whose bridge boosted this record; empty when it did not fire. */
  bridge: string[];
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

  const adrs = await readAcceptedAdrs(options.rootDir, config.adrDir);
  const cards = found.cards.slice(0, limit).map((hit: ScoredCard): FindContextCard => {
    const decisions = decisionsFor(hit.card, adrs);
    const quoted = new Set(decisions.map((adr) => adr.id));
    return {
      title: hit.card.title,
      file: hit.card.file,
      matched: hit.matched,
      bridge: hit.bridge,
      startHere: hit.card.startHere,
      decisions,
      // A Rules line that only restates a quoted ADR would repeat it in a byte budget.
      rules: hit.card.rules.filter((rule) => !citedIds(rule).some((id) => quoted.has(id))),
      pitfalls: hit.card.pitfalls,
      score: round(hit.score),
    };
  });
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
            bridge: hit.bridge,
            detail: hit.doc.detail,
          }),
        );

  return { task, cards, secondary, matched: cards.length > 0 || secondary.length > 0 };
}

export type FormatFindContextOptions = {
  /**
   * Repeat the task in the heading. The prompt hook turns this off: the agent already has the
   * prompt, and echoing it back spends the hook's byte budget on nothing new.
   */
  echoTask?: boolean;
};

export function formatFindContextResult(
  result: FindContextResult,
  options: FormatFindContextOptions = {},
): string {
  if (result.cards.length > 0) {
    return formatCards(result, options.echoTask ?? true);
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

function formatCards(result: FindContextResult, echoTask: boolean): string {
  const style = getStyle();
  const lines = [echoTask ? `Start here for "${result.task}":` : "Start here:", ""];
  // Cards in one area often share a decision; quote it once and point back after that.
  const quoted = new Set<string>();
  for (const card of result.cards) {
    lines.push(
      `${style.accent(card.title)} (${card.file}) — matched: ${card.matched.join(", ")}${via(card.bridge)}`,
    );
    // Decisions come first: a byte cap truncates from the end, and the rule the change must
    // follow matters more than any pointer.
    for (const adr of card.decisions) {
      lines.push(
        quoted.has(adr.id)
          ? `  Follow ${adr.id} (above).`
          : `  Follow ${adr.id} (${adr.title}): ${adr.decision}`,
      );
      quoted.add(adr.id);
    }
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
      `${style.accent(`${hit.kind} ${hit.label}`)} (${hit.file}) — matched: ${hit.matched.join(", ")}${via(hit.bridge)}`,
    );
    lines.push(`  ${clip(hit.detail)}`);
  }
  return `${lines.join("\n")}\n`;
}

/** Names the bridged files behind a boost; empty when the bridge did not fire. */
function via(bridge: string[]): string {
  return bridge.length === 0 ? "" : ` (via ${bridge.join(", ")})`;
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

/**
 * The accepted ADRs a card's area falls under: those the card cites by id, and those whose
 * Applies To covers a file the card points at. The decision text is read from the ADR itself,
 * so the agent gets the rule as written, not a card's paraphrase that can drift.
 */
function decisionsFor(card: ContextCard, adrs: GoverningAdr[]): FindContextCard["decisions"] {
  const cited = new Set([...card.rules, ...card.pitfalls].flatMap(citedIds));
  const cardPaths = [
    ...card.startHere.map((entry) => entry.path),
    ...card.appliesTo.map((pattern) => pattern.replace(/\/\*\*?$/u, "")),
  ];

  return adrs
    .filter(
      (adr) =>
        cited.has(adr.id) ||
        cardPaths.some(
          (cardPath) =>
            adrGoverns(adr, cardPath) ||
            adr.appliesTo.some((pattern) => matchesPattern(`${cardPath}/**`, pattern)),
        ),
    )
    .map((adr) => ({ id: adr.id, title: adr.title, decision: adr.decision, file: adr.file }));
}

function citedIds(text: string): string[] {
  return [...text.matchAll(/ADR-\d{4,}/giu)].map((match) => match[0].toUpperCase());
}
