import { existsSync, readFileSync } from 'fs';

/**
 * history entry with full context for edit mode
 */
export type HistoryEntry = {
  text: string;
  severity: 'blocker' | 'nitpick';
  index: number;
};

/**
 * .what = count prior feedback blocks in a feedback file
 * .why = enables repl to show correct next index and counts on startup
 */
export const countPriorFeedback = (input: {
  feedbackFile: string;
}): {
  count: number;
  blockerCount: number;
  nitpickCount: number;
  texts: string[];
  entries: HistoryEntry[];
} => {
  // return zero if file does not exist
  if (!existsSync(input.feedbackFile)) {
    return {
      count: 0,
      blockerCount: 0,
      nitpickCount: 0,
      texts: [],
      entries: [],
    };
  }

  // read file content
  const content = readFileSync(input.feedbackFile, 'utf-8');

  // match all feedback blocks (both blocker and nitpick)
  const blockRegex = /# (blocker|nitpick)\.(\d+)\n\n([\s\S]*?)\n---\n/g;
  const matches = [...content.matchAll(blockRegex)];

  // count by severity
  const blockerCount = matches.filter((m) => m[1] === 'blocker').length;
  const nitpickCount = matches.filter((m) => m[1] === 'nitpick').length;

  // extract texts from matches (for backward compat)
  const texts = matches.map((match) => match[3] ?? '').filter((t) => t !== '');

  // extract full entries for history navigation
  const entries: HistoryEntry[] = matches
    .map((match) => ({
      severity: match[1] as 'blocker' | 'nitpick',
      index: parseInt(match[2] ?? '0', 10),
      text: match[3] ?? '',
    }))
    .filter((e) => e.text !== '');

  return { count: matches.length, blockerCount, nitpickCount, texts, entries };
};
