import { DreamCandidate } from '../../../domain.objects/dreamer/DreamCandidate';
import { getAllDreamsFromPastWeek } from './getAllDreamsFromPastWeek';

/**
 * .what = finds dreams from past week with similar names
 * .why = enables fuzzy match recovery from typos
 */
export const getAllDreamsBySimilarity = (input: {
  name: string;
  dreamDir: string;
  threshold?: number;
}): DreamCandidate[] => {
  const threshold = input.threshold ?? 3;

  // get candidate pool from past week
  const dreams = getAllDreamsFromPastWeek({ dreamDir: input.dreamDir });

  // compute distances and filter by threshold
  const candidates: DreamCandidate[] = [];
  for (const dream of dreams) {
    // skip exact matches
    if (dream.name === input.name) continue;

    const distance = computeEditDistance({
      from: input.name,
      to: dream.name,
    });

    if (distance <= threshold) {
      candidates.push(new DreamCandidate({ dream, distance }));
    }
  }

  // sort by distance (closer = better)
  candidates.sort((a, b) => a.distance - b.distance);

  return candidates;
};

/**
 * .what = computes levenshtein distance between two strings
 * .why = quantifies similarity for fuzzy match
 */
const computeEditDistance = (input: { from: string; to: string }): number => {
  const { from, to } = input;

  // handle edge cases
  if (from === to) return 0;
  if (from.length === 0) return to.length;
  if (to.length === 0) return from.length;

  // create distance matrix
  const matrix: number[][] = [];

  // init first column
  for (let i = 0; i <= from.length; i++) {
    matrix[i] = [i];
  }

  // init first row
  for (let j = 0; j <= to.length; j++) {
    matrix[0]![j] = j;
  }

  // fill in the rest
  for (let i = 1; i <= from.length; i++) {
    for (let j = 1; j <= to.length; j++) {
      const cost = from[i - 1] === to[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1, // deletion
        matrix[i]![j - 1]! + 1, // insertion
        matrix[i - 1]![j - 1]! + cost, // substitution
      );
    }
  }

  return matrix[from.length]![to.length]!;
};
