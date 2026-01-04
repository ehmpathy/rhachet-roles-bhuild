import * as fs from 'fs';
import * as path from 'path';

import { genTestGitRepo } from '../../.test/infra';

export const SKILL_PATH: string = path.join(
  __dirname,
  '../../../src/domain.roles/behaver/skills/review.behavior.sh',
);
export const FIXTURES_PATH: string = path.join(
  __dirname,
  'assets/example.repo',
);

/**
 * .what = finds feedback file matching pattern with timestamp
 * .why = feedback files have dynamic timestamps in filename
 */
export const findFeedbackFile = (input: {
  dir: string;
  pattern: string;
}): string | undefined => {
  const files = fs.readdirSync(input.dir);
  return files.find(
    (f) =>
      f.includes(input.pattern) &&
      f.includes('[feedback]') &&
      f.endsWith('.md'),
  );
};

/**
 * .what = creates a temp copy of fixture with real git history
 * .why = avoids git-within-git issues by isolating in /tmp
 */
export const prepareFixtureWithGit = (input: {
  fixturePath: string;
}): string => {
  // fail fast if fixture doesn't exist
  if (!fs.existsSync(input.fixturePath)) {
    throw new Error(
      `prepareFixtureWithGit: fixture not found at ${input.fixturePath}`,
    );
  }

  const { repoDir } = genTestGitRepo({
    prefix: 'review-behavior-',
    copyFrom: input.fixturePath,
    commitGlob: '.behavior/',
  });
  return repoDir;
};
