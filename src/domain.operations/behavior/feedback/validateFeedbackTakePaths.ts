import { BadRequestError } from 'helpful-errors';

import { asFeedbackTakenPath } from './asFeedbackTakenPath';

/**
 * .what = validate that --from and --into paths are valid for feedbackTakeSet
 * .why = failfast on invalid paths before file operations
 *
 * .note = pure validation, no i/o
 */
export const validateFeedbackTakePaths = (input: {
  fromPath: string;
  intoPath: string;
}): void => {
  // check that fromPath looks like a [given] file
  if (!input.fromPath.includes('[given]')) {
    throw new BadRequestError(
      `--from path must be a [given] feedback file, got: ${input.fromPath}`,
    );
  }

  // check that fromPath looks like by_human
  if (!input.fromPath.includes('by_human')) {
    throw new BadRequestError(
      `--from path must be a by_human feedback file, got: ${input.fromPath}`,
    );
  }

  // check that intoPath looks like a [taken] file
  if (!input.intoPath.includes('[taken]')) {
    throw new BadRequestError(
      `--into path must be a [taken] feedback file, got: ${input.intoPath}`,
    );
  }

  // check that intoPath looks like by_robot
  if (!input.intoPath.includes('by_robot')) {
    throw new BadRequestError(
      `--into path must be a by_robot feedback file, got: ${input.intoPath}`,
    );
  }

  // check that --into matches the derivation from --from
  const expectedIntoPath = asFeedbackTakenPath({ givenPath: input.fromPath });
  if (input.intoPath !== expectedIntoPath) {
    throw new BadRequestError(
      `--into path does not match --from derivation. expected: ${expectedIntoPath}, got: ${input.intoPath}`,
    );
  }
};
