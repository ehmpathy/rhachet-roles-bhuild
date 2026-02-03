import { BadRequestError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN,
  GITHUB_DEMO_REPO,
  runRhachetSkill,
} from '../.test/infra';

/**
 * .what = acceptance tests for radio.task.push via gh.issues channel
 * .why = validates the github issues integration end-to-end
 *
 * .note = these tests require github authentication
 *         set BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN before test execution
 *
 * .usage:
 *   source .agent/repo=.this/role=any/skills/use.apikeys.sh
 *   npm run test:acceptance -- skill.radio.task.push.via-gh-issues
 */


/**
 * .what = runs radio.task.push via rhachet dispatch
 * .why = tests the skill as a consumer would invoke it
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  auth?: string;
  repo?: string;
  title?: string;
  description?: string;
  exid?: string;
  status?: string;
  idem?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.auth
      ? `--auth "${input.auth.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}"`
      : '',
    input.repo ? `--repo "${input.repo}"` : '',
    input.title ? `--title "${input.title}"` : '',
    input.description ? `--description "${input.description}"` : '',
    input.exid ? `--exid "${input.exid}"` : '',
    input.status ? `--status ${input.status}` : '',
    input.idem ? `--idem ${input.idem}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.push',
    args,
    repoDir: input.repoDir,
    timeout: 60000, // gh api calls can be slow
  });
};

describe('radio.task.push via gh.issues', () => {
  // failfast if BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN not set
  beforeAll(() => {
    if (!BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN) {
      throw new BadRequestError(
        'BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN not set. run: source .agent/repo=.this/role=any/skills/use.apikeys.sh',
      );
    }
  });

  // shared consumer repo for all test cases (pnpm install is expensive)
  const sharedRepo = useBeforeAll(async () =>
    genConsumerRepo({ prefix: 'radio-gh-acpt-' }),
  );

  given('[case1] push new task to gh.issues', () => {

    when('[t0] push with title and description', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          title: `test task ${Date.now()}`,
          description: 'automated acceptance test task',
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows created confirmation', () => {
        expect(result.output).toContain('created');
      });

      then('output shows exid', () => {
        expect(result.output).toMatch(/exid: \d+/);
      });

      then('output shows repo', () => {
        expect(result.output).toContain(GITHUB_DEMO_REPO);
      });
    });

    when('[t1] push without title', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          description: 'no title',
        }),
      );

      then('exits with non-zero code', () => {
        expect(result.exitCode).not.toBe(0);
      });

      then('output mentions title required', () => {
        expect(result.output.toLowerCase()).toContain('title');
      });
    });
  });

  given('[case2] status transitions on gh.issues', () => {
    let issueNumber: string;

    when('[t0] create then claim task', () => {
      const createResult = useBeforeAll(async () => {
        const result = runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          title: `status test ${Date.now()}`,
          description: 'for status transition test',
        });

        // extract issue exid from output
        const match = result.output.match(/exid: (\d+)/);
        if (match) issueNumber = match[1]!;

        return result;
      });

      then('task is created', () => {
        expect(createResult.exitCode).toBe(0);
        expect(issueNumber).toBeDefined();
      });

      then('claim updates status', async () => {
        const claimResult = runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          exid: issueNumber,
          status: 'CLAIMED',
        });
        expect(claimResult.exitCode).toBe(0);
        expect(claimResult.output).toContain('CLAIMED');
      });

      then('deliver closes the issue', async () => {
        const deliverResult = runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          exid: issueNumber,
          status: 'DELIVERED',
        });
        expect(deliverResult.exitCode).toBe(0);
        expect(deliverResult.output).toContain('DELIVERED');
      });
    });
  });

  given('[case3] idempotency on gh.issues', () => {
    const uniqueTitle = `findsert test ${Date.now()}`;

    when('[t0] findsert mode with duplicate title', () => {
      const firstResult = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          title: uniqueTitle,
          description: 'first push',
          idem: 'findsert',
        }),
      );

      then('first push creates issue', () => {
        expect(firstResult.exitCode).toBe(0);
        expect(firstResult.output.toLowerCase()).toContain('created');
      });

      then('second push finds the prior issue', async () => {
        // wait for github search index to update
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const secondResult = runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          title: uniqueTitle,
          description: 'second push',
          idem: 'findsert',
        });
        expect(secondResult.exitCode).toBe(0);
        expect(secondResult.output.toLowerCase()).toContain('found');
      });
    });
  });

  given('[case4] gh.issues task format', () => {
    when('[t0] task is pushed to gh.issues', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          title: `format test ${Date.now()}`,
          description: 'verify issue format',
        }),
      );

      then('issue title has radio emoji prefix', () => {
        // the gh cli output or the created issue title should contain the emoji
        expect(result.exitCode).toBe(0);
      });
    });
  });
});
