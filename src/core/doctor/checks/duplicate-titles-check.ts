import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  extractAdrTitle,
  isLiveAcceptedAdr,
  isSupersededAdr,
  normalizeAdrTitle,
} from "../../adr/adr-titles.js";
import type { DoctorCheckContext, DoctorCheckOutcome, DoctorFinding } from "../doctor-check.js";

export type DuplicateTitlesCheckResult = {
  findings: DoctorFinding[];
  outcome: DoctorCheckOutcome;
};

/**
 * Deterministic ADR title-collision check. Two live accepted decisions under one title is the
 * drift decision memory exists to catch, occurring inside itself — an error. A proposal
 * sharing a live title is a collision about to happen — a warning on the proposal. Two
 * proposals sharing a title stay silent: proposals collide harmlessly, and `adr create` is
 * already idempotent by slug. Superseded records are history, so a succession pair (old
 * superseded, new live, same title) is not a collision.
 */
export async function checkDuplicateTitles(
  context: DoctorCheckContext,
): Promise<DuplicateTitlesCheckResult> {
  if (context.config === undefined) {
    return notEvaluated("no validated Persist OS config, so the ADR directory is unknown");
  }

  const entries = await readAdrTitles(context.rootDir, context.config.adrDir);
  if (entries === null) {
    return notEvaluated(
      `no ADR directory at ${context.config.adrDir}, so titles cannot be compared`,
    );
  }

  const byTitle = new Map<string, AdrTitleEntry[]>();
  for (const entry of entries) {
    const group = byTitle.get(entry.normalized);
    if (group === undefined) {
      byTitle.set(entry.normalized, [entry]);
    } else {
      group.push(entry);
    }
  }

  const findings: DoctorFinding[] = [];
  for (const group of byTitle.values()) {
    findings.push(...checkGroup(context.config.adrDir, group));
  }

  return { findings, outcome: { id: "duplicate-titles", status: "evaluated" } };
}

type AdrTitleEntry = {
  file: string;
  title: string;
  normalized: string;
  live: boolean;
  superseded: boolean;
};

function checkGroup(adrDir: string, group: AdrTitleEntry[]): DoctorFinding[] {
  const live = group.filter((entry) => entry.live);
  const proposals = group.filter((entry) => !entry.live && !entry.superseded);

  if (live.length >= 2) {
    const keeper = live[0];
    return live.slice(1).map((entry) => ({
      severity: "error" as const,
      check: "duplicate-titles",
      message:
        `Accepted ADR "${entry.title}" shares its title with accepted ${keeper?.file ?? "another ADR"}. ` +
        `Two accepted decisions under one title is ambiguity, not memory — retitle or supersede one of them.`,
      path: path.posix.join(adrDir, entry.file),
    }));
  }

  if (live.length === 1 && proposals.length > 0) {
    const keeper = live[0];
    return proposals.map((entry) => ({
      severity: "warning" as const,
      check: "duplicate-titles",
      message:
        `Proposed ADR "${entry.title}" shares its title with accepted ${keeper?.file ?? "another ADR"}. ` +
        `Accepting it would create two decisions under one title — retitle the proposal first.`,
      path: path.posix.join(adrDir, entry.file),
    }));
  }

  return [];
}

async function readAdrTitles(rootDir: string, adrDir: string): Promise<AdrTitleEntry[] | null> {
  let dirents;
  try {
    dirents = await readdir(path.join(rootDir, adrDir), { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const entries: AdrTitleEntry[] = [];
  const files = dirents
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".md"))
    .map((dirent) => dirent.name)
    .sort((left, right) => left.localeCompare(right));

  for (const file of files) {
    const content = await readFileIfExists(rootDir, path.posix.join(adrDir, file));
    if (content === undefined) {
      continue;
    }
    const title = extractAdrTitle(content);
    if (title === null) {
      continue;
    }
    entries.push({
      file,
      title,
      normalized: normalizeAdrTitle(title),
      live: isLiveAcceptedAdr(content),
      superseded: isSupersededAdr(content),
    });
  }

  return entries;
}

function notEvaluated(reason: string): DuplicateTitlesCheckResult {
  return { findings: [], outcome: { id: "duplicate-titles", status: "not-evaluated", reason } };
}

async function readFileIfExists(
  rootDir: string,
  relativePath: string,
): Promise<string | undefined> {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}
