import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { matchesPattern } from "../../adr/governing-adrs.js";
import { CONTEXT_DIR_NAME, cardFileKey, parseContextCard } from "../../context/context-card.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";
import {
  STALE_AFTER_SECONDS,
  isGitRepository,
  isShallowRepository,
  lastCommitTime,
} from "./staleness-check.js";

const execFileAsync = promisify(execFile);

export type ContextCardsCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Deterministic, read-only honesty check for context cards.
 *
 * A card is a pointer, so it rots in three ways: its Start Here paths stop
 * existing (warning, names the card and the path), the files under Applies To
 * moved on long after the card did (warning, same gap and git plumbing as the
 * staleness check), and its Answers list is empty so no task can ever find it
 * (info). A repository with no cards reports not-evaluated with the reason —
 * cards are optional, and an empty pass would claim coverage that is absent.
 */
export async function checkContextCards(
  context: DoctorCheckContext,
): Promise<ContextCardsCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the context cards to scan are unknown");
  }

  const dir = path.posix.join(context.config.docsDir, CONTEXT_DIR_NAME);
  const cards = await readCards(context.rootDir, dir);
  if (cards.length === 0) {
    return notEvaluated("no context cards exist, so there is nothing to check for dead paths or staleness");
  }

  const findings: DoctorFinding[] = [];

  for (const { file, card } of cards) {
    for (const entry of card.startHere) {
      const target = cardFileKey(entry.path);
      if (!existsSync(path.join(context.rootDir, target))) {
        findings.push({
          severity: "warning",
          check: "context-cards",
          message: `Context card ${file} lists a Start Here path that no longer exists: ${entry.path}. Update the card to the current layout.`,
          path: file,
        });
      }
    }

    if (card.answers.length === 0) {
      findings.push({
        severity: "info",
        check: "context-cards",
        message: `Context card ${file} has an empty Answers list, so no task phrasing can ever find it. Add the task phrasings this area answers.`,
        path: file,
      });
    }
  }

  findings.push(...(await checkCardStaleness(context.rootDir, cards)));

  return { findings, outcome: { id: "context-cards", status: "evaluated" } };
}

async function readCards(
  rootDir: string,
  dir: string,
): Promise<{ file: string; card: ReturnType<typeof parseContextCard> }[]> {
  let names: string[];
  try {
    names = (await readdir(path.join(rootDir, dir), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }

  const cards: { file: string; card: ReturnType<typeof parseContextCard> }[] = [];
  for (const name of names) {
    const file = path.posix.join(dir, name);
    cards.push({ file, card: parseContextCard(await readFile(path.join(rootDir, file), "utf8"), file) });
  }
  return cards;
}

/**
 * Applies-To staleness with the staleness check's own gap and commit clock.
 * Outside git, or in a shallow clone where every file reports one commit
 * time, there is no history to compare — that slice is skipped, while the
 * dead-path and unanswerable findings above still report.
 */
async function checkCardStaleness(
  rootDir: string,
  cards: { file: string; card: ReturnType<typeof parseContextCard> }[],
): Promise<DoctorFinding[]> {
  if (!(await isGitRepository(rootDir)) || (await isShallowRepository(rootDir))) {
    return [];
  }

  let tracked: string[];
  try {
    const { stdout } = await execFileAsync("git", ["ls-files"], { cwd: rootDir });
    tracked = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  } catch {
    return [];
  }

  const findings: DoctorFinding[] = [];
  for (const { file, card } of cards) {
    const cardTime = await lastCommitTime(rootDir, file);
    if (cardTime === null) {
      continue; // uncommitted card has no history to compare against
    }
    let newest: number | null = null;
    let newestFile = "";
    for (const pattern of card.appliesTo) {
      for (const trackedFile of tracked) {
        if (!matchesPattern(pattern, trackedFile)) {
          continue;
        }
        const fileTime = await lastCommitTime(rootDir, trackedFile);
        if (fileTime !== null && (newest === null || fileTime > newest)) {
          newest = fileTime;
          newestFile = trackedFile;
        }
      }
    }
    if (newest !== null && newest - cardTime > STALE_AFTER_SECONDS) {
      findings.push({
        severity: "warning",
        check: "context-cards",
        message:
          `Context card ${file} may be stale: ${newestFile} changed long after the card was last updated — review the card's pointers.`,
        path: file,
      });
    }
  }
  return findings;
}

function notEvaluated(reason: string): ContextCardsCheckResult {
  return {
    findings: [],
    outcome: { id: "context-cards", status: "not-evaluated", reason },
  };
}
