/**
 * Typo tolerance without AI. When a prompt word is absent from the card
 * vocabulary, try close spellings within a length-scaled edit budget: one
 * edit for 4–7 letter words, two for longer ones, nothing below 4 letters.
 * Only real card words are candidates, and the output names the substitution
 * (`logn≈login`), so every correction stays explainable. Fully
 * deterministic: lowest distance wins, then higher document frequency, then
 * alphabetical order. Cheap, because the vocabulary is only the cards' words.
 */

/**
 * Damerau-Levenshtein distance (optimal string alignment): an adjacent
 * transposition costs 1 (`replya` → `replay`), so real slips stay correctable
 * where plain Levenshtein would score them 2 and reject medium words.
 */
export function editDistance(a: string, b: string): number {
  const previous: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  const current: number[] = new Array<number>(b.length + 1).fill(0);
  const beforePrevious: number[] = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, beforePrevious[j - 2] + 1);
      }
      current[j] = best;
    }
    beforePrevious.splice(0, beforePrevious.length, ...previous);
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length] ?? 0;
}

/**
 * The closest vocabulary word within budget, or null when the token is
 * already a word, too short to correct safely, or has nothing close.
 * Vocabulary maps word → document frequency for the tie-break.
 */
export function suggestCorrection(token: string, vocabulary: Map<string, number>): string | null {
  if (token.length < 4 || vocabulary.has(token)) {
    return null;
  }
  const maxDistance = token.length <= 7 ? 1 : 2;

  let best: string | null = null;
  let bestDistance = maxDistance + 1;
  let bestFrequency = -1;
  for (const [word, frequency] of vocabulary) {
    if (Math.abs(word.length - token.length) > maxDistance) {
      continue;
    }
    const distance = editDistance(token, word);
    if (distance > maxDistance) {
      continue;
    }
    const better =
      best === null ||
      distance < bestDistance ||
      (distance === bestDistance &&
        (frequency > bestFrequency || (frequency === bestFrequency && word < best)));
    if (better) {
      best = word;
      bestDistance = distance;
      bestFrequency = frequency;
    }
  }

  return best;
}
