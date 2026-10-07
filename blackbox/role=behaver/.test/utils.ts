import * as fs from 'fs';
import * as path from 'path';

import { genTestGitRepo, setConsumerLinks } from '../../.test/infra';

export const SKILL_PATH: string = path.join(
  __dirname,
  '../../../src/domain.roles/behaver/skills/review.behavior.sh',
);
export const FIXTURES_PATH: string = path.join(
  __dirname,
  'assets/example.repo',
);

/**
 * .what = asserts a spawned skill exited 0, and echoes its OWN words when not
 * .why = a bare `expect(status).toBe(0)` reports "expected 0, received 1" and
 *        throws away the subprocess's stdout+stderr — which is precisely where
 *        the cause lives (an exhausted credit balance, an absent fixture, a
 *        broken flag). that is a failhide at the test layer: the suite knows
 *        the reason and refuses to say it (rule.forbid.failhide).
 *
 *        measured 2026-09-28: four review.deliverable cases failed for two
 *        DIFFERENT causes in a row, and neither cause was legible from the run
 *        log. the skill printed a precise message each time; a bare status
 *        assertion threw it away.
 *
 * .note = lifted to the shared utils on 2026-09-28, once a 4th suite needed it
 *         (review.deliverable + the three review.behavior case suites), per
 *         rule.prefer.wet-over-dry and rule.prefer.most-common-denominator.
 */
export const expectSkillPassed = (result: {
  status: number | null;
  stdout: Buffer | string | null;
  stderr: Buffer | string | null;
}): void => {
  if (result.status !== 0)
    throw new Error(
      [
        `skill exited ${result.status}, expected 0`,
        '--- stderr ---',
        String(result.stderr ?? '').slice(-3000),
        '--- stdout ---',
        String(result.stdout ?? '').slice(-3000),
      ].join('\n'),
    );

  // .note = the throw above is the real guard; this keeps an explicit
  //   assertion on record so the case never reads as assertion-free.
  expect({ status: result.status }).toEqual({ status: 0 });
};

/**
 * .what = finds the feedback file whose name holds the pattern + a timestamp
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

  // 🔴 the skill shells `claude` with cwd = this repo, so this repo boots
  //   rhachet's hooks. a repo with no `.agent/` refuses outright —
  //   "✋ ConstraintError: no .agent/ found in this repo" — and a fixture
  //   that cannot host the skill is not a fixture, it is a false negative.
  //   a real consumer linked the roles to obtain the skill at all, so the
  //   faithful fixture carries `.agent/` too. measured 2026-09-28
  setConsumerLinks({ repoDir });

  return repoDir;
};
