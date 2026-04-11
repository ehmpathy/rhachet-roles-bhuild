import { existsSync, readFileSync } from 'fs';

import { asFeedbackTakenPath } from './asFeedbackTakenPath';
import { computeFeedbackHash } from './computeFeedbackHash';

export type FeedbackStatus =
  | { status: 'unresponded' }
  | { status: 'responded'; takenPath: string }
  | { status: 'stale'; takenPath: string; reason: 'hash-mismatch' };

/**
 * .what = determine if feedback has been responded to and if response is current
 * .why = enables feedback.take.get to show status and hook.onStop to enforce
 */
export const getFeedbackStatus = (input: {
  givenPath: string;
}): FeedbackStatus => {
  // derive [taken] path from [given] path
  const takenPath = asFeedbackTakenPath({ givenPath: input.givenPath });

  // if [taken] file doesn't exist, feedback is unresponded
  if (!existsSync(takenPath)) {
    return { status: 'unresponded' };
  }

  // read [given] content and compute hash
  const givenContent = readFileSync(input.givenPath, 'utf-8');
  const givenHash = computeFeedbackHash({ content: givenContent });

  // read [taken] content and extract stored hash from frontmatter
  const takenContent = readFileSync(takenPath, 'utf-8');
  const storedHash = extractHashFromTaken({ content: takenContent });

  // if hash matches, feedback is responded
  if (storedHash === givenHash) {
    return { status: 'responded', takenPath };
  }

  // hash mismatch means [given] was updated after [taken] was created
  return { status: 'stale', takenPath, reason: 'hash-mismatch' };
};

/**
 * .what = extract givenHash from [taken] file frontmatter
 * .why = enables hash verification for stale detection
 *
 * .note = expects frontmatter format: givenHash: {hash}
 */
const extractHashFromTaken = (input: { content: string }): string | null => {
  const match = input.content.match(/^givenHash:\s*([a-f0-9]{64})/m);
  return match?.[1] ?? null;
};
