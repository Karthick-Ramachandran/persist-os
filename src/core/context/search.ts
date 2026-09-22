import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { codePathsIn, readCodeRoots, type CodeRoots } from "../memory/code-paths.js";
import { promisify } from "node:util";

import { type GoverningAdr, matchesPattern, readGoverningAdrs } from "../adr/governing-adrs.js";
import { fenceFileKey, FENCE_HEADING_PATTERN } from "../fence/generate-fence.js";
import { CONTEXT_DIR_NAME, parseContextCard, type ContextCard } from "./context-card.js";
import { LESSONS_FILE, parseLessons, type LessonSection } from "../lessons/lessons.js";
import { suggestCorrection } from "./spelling.js";
import { STOPWORDS, tokenize } from "./tokenize.js";

const execFileAsync = promisify(execFile);

/**
 * Field weights, in one place. Answers carries task phrasings in the asker's
 * own words, so it dominates: five prompts in the benchmark are answerable
 * only through it. Also Known As carries synonyms next. Purpose and title
 * describe the area. Rules, Pitfalls, and Start Here are code-word heavy, so
 * they only disambiguate — a task naming `splitEvenly` should prefer the card
 * whose Start Here names it, not outrank a card whose Answers match.
 */
export const FIELD_WEIGHTS = {
  answers: 3,
  alsoKnownAs: 2.5,
  purpose: 2,
  title: 2,
  rules: 1,
  pitfalls: 1,
  startHere: 1,
} as const;

type FieldName = keyof typeof FIELD_WEIGHTS;

/** BM25 constants from the brief (k1 = 1.2, b = 0.75). */
const K1 = 1.2;
const B = 0.75;

/**
 * A card boosted because the task names a file it covers ("tip" matches
 * `src/lib/tip.ts`). Sized to outrank a weak single-term field hit but not a
 * strong Answers match. The boost applies only alongside a field score (see
 * below), so the bridge resolves ambiguity but never invents relevance.
 */
const PATH_BOOST = 1.5;

/** Below this total a hit is noise. Tuned against the retrieval benchmark. */
export const MIN_SCORE = 0.9;

/**
 * Lesson-area field weights, mirroring the card table: the heading names the
 * area and Also Known As carries its synonyms, so both outrank a shared word
 * in a bullet. An area's score is its best bullet plus the heading/synonym
 * boost — never the whole section as one length-diluted document.
 */
export const LESSON_AREA_WEIGHTS = {
  title: 2,
  alsoKnownAs: 2.5,
  bullets: 1,
} as const;

/**
 * Below this total an area stays out of the pointers. Well above the card
 * threshold on purpose: per-bullet scoring lets one shared word ("code",
 * "new", "migration") score 2–7 through a single bullet, so areas need a bar
 * that genuine multi-term matches clear but one- or two-word overlap does
 * not. Tuned against the lessons fixture (`tests/fixtures/`): wanted areas
 * score 20–28 there, shared-word noise 2–7.5, so 8 separates them with
 * margin on both sides. A lone unique heading or Also Known As term
 * (e.g. `E11000`, ~7.4) rides below the bar through the named-area rule in
 * `selectLessons` instead, and an area whose Applies To covers a matched
 * card's files rides regardless — the card already grounds it.
 */
export const MIN_AREA_SCORE = 8;

const FENCES_FILE = "60-engineering/FENCES.md";
const CONVENTIONS_FILE = "60-engineering/CONVENTIONS.md";

const WHY_PATTERN = /^Why:\s*(.+)$/u;
const BULLET_PATTERN = /^\s*[-*]\s+(.+?)\s*$/u;

export type SecondaryKind = "adr" | "fence" | "convention" | "lesson";

export type SecondaryDocument = {
  kind: SecondaryKind;
  /** Display label: ADR id, fence path, or source file. */
  label: string;
  /** Repo-relative source file for tie-breaks and display. */
  file: string;
  /** Indexed text. */
  text: string;
  /** Path patterns or files this record covers, for the path bridge. */
  paths: string[];
  /** One-line display detail: decision sentence, Why, or bullet. */
  detail: string;
};

export type ScoredCard = {
  card: ContextCard;
  score: number;
  /**
   * Query tokens hit in any field, in query order — the match explains itself.
   * Corrected typos show as `looks≈like`, so the substitution is visible.
   */
  matched: string[];
  /** Bridged file names covered by this card, present only when boosted. */
  bridge: string[];
};

export type ScoredSecondary = {
  doc: SecondaryDocument;
  score: number;
  matched: string[];
  /** Bridged file names covered by this record, present only when boosted. */
  bridge: string[];
};

export type ScoredLessonArea = {
  area: LessonSection;
  /** Repo-relative LESSONS.md path, for display and the index line. */
  file: string;
  score: number;
  matched: string[];
  /** Bridged file names covered by this area, present only when boosted. */
  bridge: string[];
};

export type ContextSearchResult = {
  task: string;
  query: string[];
  cards: ScoredCard[];
  secondary: ScoredSecondary[];
  /**
   * Lesson areas of a sectioned LESSONS.md: each area's match is its best
   * bullet plus the heading/Also Known As boost. Empty for a flat legacy
   * file, which still reads bullet by bullet through `secondary` as today.
   */
  lessonAreas: ScoredLessonArea[];
  /** Repo-relative LESSONS.md path, or undefined when there is no file. */
  lessonsFile: string | undefined;
};

export type ContextSearchDirs = {
  docsDir: string;
  adrDir: string;
};

/** Field texts in weight-table order, so the scorer cannot drift from it. */
function cardFields(card: ContextCard): { field: FieldName; text: string }[] {
  return [
    { field: "answers", text: card.answers.join("\n") },
    { field: "alsoKnownAs", text: card.alsoKnownAs.join(" ") },
    { field: "purpose", text: card.purpose },
    { field: "title", text: card.title },
    { field: "rules", text: card.rules.join("\n") },
    { field: "pitfalls", text: card.pitfalls.join("\n") },
    {
      field: "startHere",
      text: card.startHere.map((entry) => `${entry.path} ${entry.note}`).join("\n"),
    },
  ];
}

/** Paths a card covers: Applies To patterns plus Start Here files. */
function cardPaths(card: ContextCard): string[] {
  return [...card.appliesTo, ...card.startHere.map((entry) => entry.path)];
}

function idf(docFreq: number, docCount: number): number {
  return Math.log(1 + (docCount - docFreq + 0.5) / (docFreq + 0.5));
}

function bm25Term(termFreq: number, docLength: number, avgLength: number, termIdf: number): number {
  if (termFreq === 0 || avgLength === 0) {
    return 0;
  }
  const norm = 1 - B + (B * docLength) / avgLength;
  return termIdf * ((termFreq * (K1 + 1)) / (termFreq + K1 * norm));
}

/**
 * Score one query against one corpus of field texts with BM25 per field. The
 * corpus is a single field across documents, so identical phrasing in a rare
 * field outranks the same words repeated in a common one.
 */
function scoreFields<Field extends string>(
  query: string[],
  fieldDocs: Map<Field, string[][]>,
  weights: Readonly<Record<Field, number>>,
  docIndex: number,
  docCount: number,
): { score: number; matched: string[] } {
  let score = 0;
  const matched: string[] = [];

  for (const [field, docs] of fieldDocs) {
    const weight = weights[field] ?? 0;
    const tokenized = docs.map((tokens) => tokens);
    const avgLength = tokenized.reduce((sum, tokens) => sum + tokens.length, 0) / docCount;
    const docTokens = tokenized[docIndex] ?? [];
    const docLength = docTokens.length;
    const counts = new Map<string, number>();
    for (const token of docTokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    for (const term of query) {
      const termFreq = counts.get(term) ?? 0;
      if (termFreq === 0) {
        continue;
      }
      let docFreq = 0;
      for (const tokens of tokenized) {
        if (tokens.includes(term)) {
          docFreq += 1;
        }
      }
      score += weight * bm25Term(termFreq, docLength, avgLength, idf(docFreq, docCount));
      if (!matched.includes(term)) {
        matched.push(term);
      }
    }
  }

  return { score, matched: query.filter((term) => matched.includes(term)) };
}

function scoreSecondaryDocs(
  query: string[],
  docs: SecondaryDocument[],
): { score: number; matched: string[] }[] {
  const tokenized = docs.map((doc) => tokenize(doc.text));
  const avgLength =
    tokenized.reduce((sum, tokens) => sum + tokens.length, 0) / Math.max(docs.length, 1);
  const docFreq = new Map<string, number>();
  for (const tokens of tokenized) {
    for (const term of new Set(tokens)) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  return tokenized.map((tokens) => {
    const counts = new Map<string, number>();
    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
    let score = 0;
    const matched: string[] = [];
    for (const term of query) {
      const termFreq = counts.get(term) ?? 0;
      if (termFreq === 0) {
        continue;
      }
      score += bm25Term(
        termFreq,
        tokens.length,
        avgLength,
        idf(docFreq.get(term) ?? 0, docs.length),
      );
      matched.push(term);
    }
    return { score, matched };
  });
}

/** Backticked code paths mentioned in a prose line, for any repository layout. */
function mentionedPaths(text: string, roots: CodeRoots): string[] {
  return codePathsIn(text, roots);
}

function bulletsOf(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split("\n")) {
    const match = BULLET_PATTERN.exec(line);
    if (match !== null) {
      const text = (match[1] ?? "").trim();
      if (text !== "") {
        items.push(text);
      }
    }
  }
  return items;
}

async function readCards(rootDir: string, docsDir: string): Promise<ContextCard[]> {
  const dir = path.join(rootDir, docsDir, CONTEXT_DIR_NAME);
  let names: string[];
  try {
    names = (await readdir(dir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }

  const cards: ContextCard[] = [];
  for (const name of names) {
    const file = path.posix.join(docsDir, CONTEXT_DIR_NAME, name);
    const content = await readFile(path.join(rootDir, file), "utf8");
    cards.push(parseContextCard(content, file));
  }
  return cards;
}

/**
 * Fence path plus standing Why, read from the same `## \`path\`` / `Why:`
 * shape fence-check reads. Kept local so search never depends on a doctor
 * gate's internals; both follow generate-fence's writer, which is the shape's
 * owner.
 */
async function readFenceDocs(rootDir: string, docsDir: string): Promise<SecondaryDocument[]> {
  const content = await readFileIfExists(rootDir, path.posix.join(docsDir, FENCES_FILE));
  if (content === undefined) {
    return [];
  }
  const file = path.posix.join(docsDir, FENCES_FILE);
  const docs: SecondaryDocument[] = [];
  let current: string | null = null;
  let why: string | null = null;
  const flush = (): void => {
    if (current !== null && why !== null) {
      docs.push({
        kind: "fence",
        label: current,
        file,
        text: `${current} ${why}`,
        paths: [fenceFileKey(current)],
        detail: why,
      });
    }
  };
  for (const line of content.split("\n")) {
    const heading = FENCE_HEADING_PATTERN.exec(line);
    if (heading !== null) {
      flush();
      current = ((heading[1] ?? "").trim() || null) as string | null;
      why = null;
      continue;
    }
    if (current !== null && why === null) {
      const match = WHY_PATTERN.exec(line);
      if (match !== null) {
        why = (match[1] ?? "").trim();
      }
    }
  }
  flush();
  return docs;
}

async function readConventionDocs(
  rootDir: string,
  docsDir: string,
  roots: CodeRoots,
): Promise<SecondaryDocument[]> {
  const file = path.posix.join(docsDir, CONVENTIONS_FILE);
  const content = await readFileIfExists(rootDir, file);
  if (content === undefined) {
    return [];
  }
  return bulletsOf(content).map((bullet) => ({
    kind: "convention" as const,
    label: "CONVENTIONS",
    file,
    text: bullet,
    paths: mentionedPaths(bullet, roots),
    detail: bullet,
  }));
}

export type LessonDocs = {
  /** Loose bullets of a flat legacy file, searched exactly as today. */
  legacy: SecondaryDocument[];
  /** Areas of a sectioned file, each scored as one document. */
  areas: { area: LessonSection; file: string; paths: string[] }[];
  /** Repo-relative LESSONS.md path, or undefined when there is no file. */
  file: string | undefined;
};

async function readLessonDocs(
  rootDir: string,
  docsDir: string,
  roots: CodeRoots,
): Promise<LessonDocs> {
  const file = path.posix.join(docsDir, LESSONS_FILE);
  const content = await readFileIfExists(rootDir, file);
  if (content === undefined) {
    return { legacy: [], areas: [], file: undefined };
  }
  const lessons = parseLessons(content);
  // A `## Lessons` section's bullets ride the legacy list even beside areas.
  const legacy = lessons.flat.map((bullet) => ({
    kind: "lesson" as const,
    label: "LESSONS",
    file,
    text: bullet,
    paths: mentionedPaths(bullet, roots),
    detail: bullet,
  }));
  if (!lessons.isSectioned) {
    return { legacy, areas: [], file };
  }
  return {
    legacy,
    areas: lessons.areas.map((area) => ({
      area,
      file,
      paths: [...area.appliesTo, ...mentionedPaths(area.bullets.join("\n"), roots)],
    })),
    file,
  };
}

function adrDocs(adrs: GoverningAdr[]): SecondaryDocument[] {
  return adrs.map((adr) => ({
    kind: "adr" as const,
    label: adr.id,
    file: adr.file,
    text: `${adr.title} ${adr.decision} ${adr.appliesTo.join(" ")}`,
    paths: adr.appliesTo,
    detail: adr.decision,
  }));
}

/** Repo files from `git ls-files`. Outside git there is no bridge — never an error. */
async function listTrackedFiles(rootDir: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync("git", ["ls-files"], { cwd: rootDir });
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  } catch {
    return [];
  }
}

/**
 * The file-name bridge: a task token matching a tracked file's name ("tip"
 * matches `src/lib/tip.ts`), or the task naming the path outright, marks the
 * file. Records covering a marked file get the path boost, and each boosted
 * record names the files that boosted it — the bridge always shows its work.
 */
function bridgeFiles(task: string, query: string[], tracked: string[]): Set<string> {
  const lowered = task.toLowerCase();
  const named = new Set<string>();
  for (const file of tracked) {
    if (lowered.includes(file.toLowerCase())) {
      named.add(file);
      continue;
    }
    const base = file.split("/").pop() ?? file;
    const stem = base.replace(/\.[^.]+$/u, "");
    const nameTokens = new Set(tokenize(stem));
    if (query.some((term) => nameTokens.has(term))) {
      named.add(file);
    }
  }
  return named;
}

function covers(paths: string[], file: string): boolean {
  return paths.some((pattern) => {
    if (/[*?]/u.test(pattern)) {
      return matchesPattern(pattern, file);
    }
    const key = pattern.includes(":") ? (pattern.split(":")[0] ?? pattern) : pattern;
    return file === key || file.startsWith(`${key.replace(/\/+$/u, "")}/`);
  });
}

export async function searchContext(
  rootDir: string,
  task: string,
  dirs: ContextSearchDirs,
): Promise<ContextSearchResult> {
  const query = tokenize(task);
  const roots = await readCodeRoots(rootDir, dirs.docsDir);
  const cards = await readCards(rootDir, dirs.docsDir);
  const adrs = await readGoverningAdrs(rootDir, dirs.adrDir);
  const lessons = await readLessonDocs(rootDir, dirs.docsDir, roots);
  const secondary: SecondaryDocument[] = [
    ...adrDocs(adrs),
    ...(await readFenceDocs(rootDir, dirs.docsDir)),
    ...(await readConventionDocs(rootDir, dirs.docsDir, roots)),
    ...lessons.legacy,
  ];
  const lessonAreas = lessons.areas;

  const fieldDocs = new Map<FieldName, string[][]>();
  const fields = cards.map(cardFields);
  for (const field of Object.keys(FIELD_WEIGHTS) as FieldName[]) {
    fieldDocs.set(
      field,
      fields.map((entries) => tokenize(entries.find((entry) => entry.field === field)?.text ?? "")),
    );
  }

  // Area matching is per bullet, not per joined section: an area's match is
  // its best bullet plus the heading/Also Known As boost, so a large area
  // never falls below the bar just because its length dilutes the score.
  type LessonAreaField = keyof typeof LESSON_AREA_WEIGHTS;
  const titleFieldDocs = new Map<LessonAreaField, string[][]>([
    ["title", lessonAreas.map((entry) => tokenize(entry.area.title))],
  ]);
  const akaFieldDocs = new Map<LessonAreaField, string[][]>([
    ["alsoKnownAs", lessonAreas.map((entry) => tokenize(entry.area.alsoKnownAs.join(" ")))],
  ]);
  const bulletTokens: string[][] = [];
  const bulletOwner: number[] = [];
  lessonAreas.forEach((entry, areaIndex) => {
    for (const bullet of entry.area.bullets) {
      bulletOwner.push(areaIndex);
      bulletTokens.push(tokenize(bullet));
    }
  });
  const bulletFieldDocs = new Map<LessonAreaField, string[][]>([["bullets", bulletTokens]]);

  const tracked = await listTrackedFiles(rootDir);
  // The boost amplifies genuine field relevance; it never invents it. A card
  // whose fields score nothing stays silent even when a file name matches —
  // otherwise a single common word in a file name clears the threshold alone
  // and prints an empty matched line no one can explain.
  const boosted = (
    named: Set<string>,
    paths: string[],
    fieldScore: number,
  ): { boost: number; bridge: string[] } => {
    if (fieldScore <= 0 || named.size === 0) {
      return { boost: 0, bridge: [] };
    }
    const bridge = [...named].filter((file) => covers(paths, file));
    return bridge.length === 0 ? { boost: 0, bridge: [] } : { boost: PATH_BOOST, bridge };
  };

  // Spelling corrections are a fallback, never a first pass. Exact search runs
  // first; only when no card clears the threshold does the corrected query
  // run. Correcting up front demotes genuine exact matches (a real word like
  // "trip" "correcting" to "tip" outranks the card the asker meant), so the
  // fallback guarantees exact behavior is preserved bit-for-bit.
  const scoreAll = (
    queryTerms: string[],
    named: Set<string>,
    display: (terms: string[]) => string[],
  ): Pick<ContextSearchResult, "cards" | "secondary" | "lessonAreas" | "lessonsFile"> => {
    const scored: ScoredCard[] = cards.map((card, index) => {
      const { score, matched } = scoreFields(
        queryTerms,
        fieldDocs,
        FIELD_WEIGHTS,
        index,
        Math.max(cards.length, 1),
      );
      const { boost, bridge } = boosted(named, cardPaths(card), score);
      // A word typed three times is one reason to match, not three.
      return { card, score: score + boost, matched: display(unique(matched)), bridge };
    });
    scored.sort((a, b) => b.score - a.score || (a.card.file < b.card.file ? -1 : 1));

    const secondaryScores = scoreSecondaryDocs(queryTerms, secondary);
    const scoredSecondary: ScoredSecondary[] = secondary.map((doc, index) => {
      const base = secondaryScores[index] ?? { score: 0, matched: [] };
      const { boost, bridge } = boosted(named, doc.paths, base.score);
      return { doc, score: base.score + boost, matched: display(unique(base.matched)), bridge };
    });
    scoredSecondary.sort((a, b) => b.score - a.score || (a.doc.file < b.doc.file ? -1 : 1));

    const areaCount = Math.max(lessonAreas.length, 1);
    const bulletHits = bulletTokens.map((_, bulletIndex) =>
      scoreFields(
        queryTerms,
        bulletFieldDocs,
        { ...LESSON_AREA_WEIGHTS, title: 0, alsoKnownAs: 0 },
        bulletIndex,
        Math.max(bulletTokens.length, 1),
      ),
    );
    const scoredAreas: ScoredLessonArea[] = lessonAreas.map((entry, index) => {
      const title = scoreFields(
        queryTerms,
        titleFieldDocs,
        { ...LESSON_AREA_WEIGHTS, alsoKnownAs: 0, bullets: 0 },
        index,
        areaCount,
      );
      const aka = scoreFields(
        queryTerms,
        akaFieldDocs,
        { ...LESSON_AREA_WEIGHTS, title: 0, bullets: 0 },
        index,
        areaCount,
      );
      let best = 0;
      let bestMatched: string[] = [];
      bulletHits.forEach((hit, bulletIndex) => {
        if (bulletOwner[bulletIndex] === index && hit.score > best) {
          best = hit.score;
          bestMatched = hit.matched;
        }
      });
      const score = title.score + aka.score + best;
      const matched = queryTerms.filter(
        (term) =>
          title.matched.includes(term) || aka.matched.includes(term) || bestMatched.includes(term),
      );
      const { boost, bridge } = boosted(named, entry.paths, score);
      return {
        area: entry.area,
        file: entry.file,
        score: score + boost,
        matched: display(unique(matched)),
        bridge,
      };
    });
    scoredAreas.sort((a, b) => b.score - a.score || (a.area.title < b.area.title ? -1 : 1));

    return {
      cards: scored.filter((hit) => hit.score >= MIN_SCORE),
      secondary: scoredSecondary.filter((hit) => hit.score >= MIN_SCORE),
      lessonAreas: scoredAreas,
      lessonsFile: lessons.file,
    };
  };

  const identity = (terms: string[]): string[] => terms;
  const exact = scoreAll(query, bridgeFiles(task, query, tracked), identity);
  if (exact.cards.length > 0) {
    return { task, query, ...exact };
  }

  const vocabulary = buildVocabulary(fieldDocs, cards.length);
  const corrections = new Map<string, string>();
  const correctedQuery = query.map((term) => {
    const suggestion = suggestCorrection(term, vocabulary);
    if (suggestion === null) {
      return term;
    }
    if (!corrections.has(suggestion)) {
      corrections.set(suggestion, term);
    }
    return suggestion;
  });
  if (correctedQuery.every((term, index) => term === query[index])) {
    return { task, query, ...exact };
  }
  // The display maps corrections back so the output owns up to them.
  const display = (terms: string[]): string[] =>
    terms.map((term) => {
      const original = corrections.get(term);
      return original === undefined || original === term ? term : `${original}≈${term}`;
    });
  const corrected = scoreAll(correctedQuery, bridgeFiles(task, correctedQuery, tracked), display);
  return { task, query: correctedQuery, ...corrected };
}

/**
 * Card words by document frequency, stopwords excluded. The corrector may only
 * suggest these — a slip must land on a real card word, never on glue.
 */
function buildVocabulary(
  fieldDocs: Map<FieldName, string[][]>,
  docCount: number,
): Map<string, number> {
  const vocabulary = new Map<string, number>();
  for (let index = 0; index < docCount; index += 1) {
    const terms = new Set<string>();
    for (const docs of fieldDocs.values()) {
      for (const token of docs[index] ?? []) {
        if (!STOPWORDS.has(token)) {
          terms.add(token);
        }
      }
    }
    for (const term of terms) {
      vocabulary.set(term, (vocabulary.get(term) ?? 0) + 1);
    }
  }
  return vocabulary;
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

function unique(terms: string[]): string[] {
  return [...new Set(terms)];
}
