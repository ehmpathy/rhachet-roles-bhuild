import { existsSync, readFileSync, writeFileSync } from 'fs';
import { BadRequestError } from 'helpful-errors';

import { computeFeedbackHash } from './computeFeedbackHash';
import { validateFeedbackTakePaths } from './validateFeedbackTakePaths';

/**
 * .what = record a feedback response with hash verification
 * .why = enables clones to mark feedback as responded and verify hash
 */
export const feedbackTakeSet = (input: {
  fromPath: string;
  intoPath: string;
  response: string;
}): {
  takenPath: string;
  givenHash: string;
} => {
  // validate paths
  validateFeedbackTakePaths({
    fromPath: input.fromPath,
    intoPath: input.intoPath,
  });

  // verify [given] file exists
  if (!existsSync(input.fromPath)) {
    throw new BadRequestError(`[given] file not found: ${input.fromPath}`);
  }

  // read [given] content and compute hash
  const givenContent = readFileSync(input.fromPath, 'utf-8');
  const givenHash = computeFeedbackHash({ content: givenContent });

  // build [taken] content with frontmatter
  const takenContent = `---
givenHash: ${givenHash}
---

${input.response}`;

  // write [taken] file
  writeFileSync(input.intoPath, takenContent);

  return {
    takenPath: input.intoPath,
    givenHash,
  };
};
