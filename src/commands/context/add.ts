import { existsSync } from "node:fs";
import path from "node:path";

import { getStyle } from "../../cli/style.js";
import { ConfigValidationError } from "../../core/config/config-schema.js";
import { loadConfig, ConfigLoadError } from "../../core/config/load-config.js";
import { contextDir, renderContextCard } from "../../core/context/context-card.js";
import { executeWritePlan, type WriteResult } from "../../core/filesystem/write-file-safe.js";
import { createWritePlan, type WritePlan } from "../../core/filesystem/write-plan.js";
import { SlugifyError, slugify } from "../../core/naming/slugify.js";
import { appendNextSteps, appendWriteSummary } from "../write-summary.js";

export type ContextAddOptions = {
  rootDir: string;
  name: string;
  purpose: string;
  dryRun?: boolean;
};

export type ContextAddResult = {
  cardPath: string;
  title: string;
  dryRun: boolean;
  plan: WritePlan;
  writeResult: WriteResult;
};

export type ContextAddErrorCode = "INVALID_CARD" | "CARD_EXISTS" | "WRITE_PLAN_ERROR" | "NOT_INITIALIZED";

export class ContextAddError extends Error {
  readonly code: ContextAddErrorCode;
  readonly details: string[];

  constructor(code: ContextAddErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "ContextAddError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Scaffold a context card for an area of the codebase.
 *
 * The agent that just finished work fills the sections by hand — that is the
 * habit the feature depends on — so this only writes the exact shape with an
 * empty body. An existing card is never overwritten: its Answers list is
 * accumulated history, and a rewrite would silently drop it.
 */
export async function addContext(options: ContextAddOptions): Promise<ContextAddResult> {
  const config = await loadRepoConfig(options.rootDir);
  const slug = cardSlug(options.name);
  const title = cardTitle(options.name);
  const purpose = options.purpose.trim();
  if (purpose === "") {
    throw new ContextAddError(
      "INVALID_CARD",
      'A context card needs a purpose. Pass --purpose "<one line>".',
    );
  }
  const cardPath = path.posix.join(contextDir(config.docsDir), `${slug}.md`);

  // Refuse before anything is written, dry runs included: a skipped write
  // would read as success while leaving the existing Answers list untouched.
  if (existsSync(path.join(options.rootDir, cardPath))) {
    throw new ContextAddError(
      "CARD_EXISTS",
      `Context card ${cardPath} already exists — edit it directly instead of scaffolding it again.`,
      [`Add the task phrasing to its ## Answers list so the next lookup finds it.`],
    );
  }

  const plan = createWritePlan({
    rootDir: options.rootDir,
    files: [{ path: cardPath, content: renderContextCard(title, purpose) }],
  });

  if (plan.hasErrors) {
    throw new ContextAddError(
      "WRITE_PLAN_ERROR",
      "Persist OS context add write plan contains errors.",
      plan.entries
        .filter((entry) => entry.action === "error")
        .map((entry) => `${entry.path}: ${entry.reason}`),
    );
  }

  const writeResult = await executeWritePlan(plan, { dryRun: options.dryRun });

  return {
    cardPath,
    title,
    dryRun: options.dryRun ?? false,
    plan,
    writeResult,
  };
}

export function formatAddContextResult(result: ContextAddResult): string {
  const style = getStyle();
  const lines = [
    result.dryRun ? "Persist OS context add dry run complete." : "Persist OS context add complete.",
    `Card: ${style.accent(result.cardPath)}`,
  ];

  appendWriteSummary(lines, { dryRun: result.dryRun, writeResult: result.writeResult });

  if (!result.dryRun) {
    appendNextSteps(lines, [
      `Fill the sections in ${result.cardPath}: Start Here paths, Rules pointers, and above all the Answers list with the task you were just given, phrased the way it was asked.`,
      'Run `persist context "<task>"` to check the card is found before calling the work done.',
    ]);
  }

  return `${lines.join("\n")}\n`;
}

function cardSlug(raw: string): string {
  try {
    return slugify(raw);
  } catch (error) {
    if (error instanceof SlugifyError) {
      throw new ContextAddError("INVALID_CARD", error.message);
    }
    throw error;
  }
}

function cardTitle(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/gu, " ");
  if (trimmed === "") {
    throw new ContextAddError("INVALID_CARD", "A context card needs a name.");
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// A card is only ever read inside its own repository's loop — the lookup, the
// hook, and the doctor check — so one recorded outside an initialized
// repository is never loaded. Refuse like `fence add` instead of falling back
// to defaults that would scatter dead cards into bare directories.
async function loadRepoConfig(rootDir: string) {
  try {
    return await loadConfig(rootDir);
  } catch (error) {
    if (error instanceof ConfigLoadError || error instanceof ConfigValidationError) {
      throw new ContextAddError(
        "NOT_INITIALIZED",
        "No Persist OS config found — run `persist init` in this repository first. A context card is only read inside its own repository, so one recorded outside it is never loaded.",
      );
    }

    throw error;
  }
}
