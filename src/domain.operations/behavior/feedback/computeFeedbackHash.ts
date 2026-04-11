import { createHash } from 'crypto';

/**
 * .what = compute sha256 hash of feedback file content
 * .why = enables hash-based verification that [taken] response matches [given] content
 */
export const computeFeedbackHash = (input: { content: string }): string => {
  return createHash('sha256').update(input.content).digest('hex');
};
