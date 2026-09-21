/**
 * Tokenizer for context-card search.
 *
 * Exact rules, in order:
 * 1. Lowercase the text.
 * 2. Split camelCase (`splitEvenly` → `split Evenly`) and acronym boundaries
 *    (`HTTPSConnection` → `HTTPS Connection`).
 * 3. Split on every run of non-alphanumeric characters (this also splits
 *    snake_case and dotted paths).
 * 4. Drop tokens in the fixed STOPWORDS list (articles, prepositions,
 *    question words, and generic task verbs like "make" and "fix" that carry
 *    no domain signal — the brief's own example matches "make rounding fair"
 *    on "rounding" and "fair" only).
 * 5. Apply one suffix strip, first match wins:
 *    - `ies` (length ≥ 5) → `y` (`pennies` → `penny`).
 *    - `ing` (length ≥ 6) → strip; then collapse a trailing double consonant
 *      when the stem is still ≥ 5 long (`splitting` → `split`).
 *    - `ed` (length ≥ 5) → strip, with the same double-consonant collapse
 *      (`stopped` → `stop`).
 *    - `es` after a sibilant (`s`, `x`, `z`, `ch`, `sh`, length ≥ 5) → strip
 *      both letters (`branches` → `branch`).
 *    - trailing `s` (length ≥ 4) → strip one (`shares` → `share`).
 *
 * The strip is deliberately small: matching quality is meant to come from the
 * stored Answers and Also Known As phrasings, not from clever morphology.
 * Card text and task text pass through the same function, so both sides stem
 * identically.
 */

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "as",
  "at",
  "by",
  "from",
  "into",
  "over",
  "after",
  "before",
  "between",
  "how",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "do",
  "does",
  "did",
  "done",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "may",
  "might",
  "must",
  "i",
  "me",
  "my",
  "we",
  "us",
  "our",
  "you",
  "your",
  "he",
  "him",
  "his",
  "she",
  "her",
  "they",
  "them",
  "their",
  "s",
  "t",
  "d",
  "m",
  "re",
  "ve",
  "ll",
  "about",
  "out",
  "up",
  "down",
  "off",
  "so",
  "than",
  "too",
  "very",
  "just",
  "not",
  "no",
  "nor",
  "any",
  "all",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "only",
  "own",
  "same",
  "there",
  "here",
  "then",
  "once",
  "also",
  "across",
  "per",
  "via",
  "within",
  "without",
  // Generic task verbs: present in almost every prompt, absent from cards.
  "make",
  "change",
  "fix",
  "add",
  "update",
  "create",
  "remove",
  "delete",
  "show",
  "explain",
  "describe",
  "tell",
  "give",
  "help",
  "please",
  "want",
  "need",
  "get",
  "set",
  "put",
  "take",
  "come",
  "look",
  "use",
  "using",
  "work",
  "way",
  "thing",
  "things",
  "something",
  "someone",
]);

const SIBILANT_ENDINGS = ["sses", "xes", "zes", "ches", "shes"];

function isConsonant(letter: string): boolean {
  return /^[b-df-hj-np-tv-z]$/u.test(letter);
}

function stem(token: string): string {
  if (token.endsWith("ies") && token.length >= 5) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith("ing") && token.length >= 6) {
    return collapseDouble(token.slice(0, -3));
  }
  if (token.endsWith("ed") && token.length >= 5) {
    return collapseDouble(token.slice(0, -2));
  }
  if (
    token.length >= 5 &&
    SIBILANT_ENDINGS.some((ending) => token.endsWith(ending))
  ) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && token.length >= 4) {
    return token.slice(0, -1);
  }
  return token;
}

function collapseDouble(stemmed: string): string {
  if (stemmed.length < 5) {
    return stemmed;
  }
  const last = stemmed[stemmed.length - 1] ?? "";
  const previous = stemmed[stemmed.length - 2] ?? "";
  if (last === previous && isConsonant(last)) {
    return stemmed.slice(0, -1);
  }
  return stemmed;
}

export function tokenize(text: string): string[] {
  const splitCamel = text
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/gu, "$1 $2");
  return splitCamel
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((token) => token !== "" && !STOPWORDS.has(token))
    .map(stem)
    .filter((token) => token !== "");
}
