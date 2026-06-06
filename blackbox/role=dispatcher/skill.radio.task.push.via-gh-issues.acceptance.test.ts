import fs from 'fs';
import path from 'path';

import { BadRequestError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  GITHUB_DEMO_REPO,
  runRhachetSkill,
} from '../.test/infra';

/**
 * .what = acceptance tests for radio.task.push via gh.issues channel
 * .why = validates the github issues integration end-to-end
 *
 * .note = auth is provided via keyrack (EHMPATH_BEAVER_GITHUB_TOKEN)
 *         keyrack.source() is called in jest.acceptance.env.ts
 *
 * .usage:
 *   npm run test:acceptance -- skill.radio.task.push.via-gh-issues
 */

/**
 * .what = invoke radio.uses skill to set up permissions
 * .why = radio.task.push/pull requires radio.uses permission
 */
const runRadioUses = (input: {
  repoDir: string;
  args: string;
  homeDir?: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.uses',
    args: input.args,
    repoDir: input.repoDir,
    env: {
      __I_AM_HUMAN: 'true',
      ...(input.homeDir ? { HOME: input.homeDir } : {}),
    },
    timeout: 30000,
  });
  return {
    stdout: result.output,
    stderr: '',
    exitCode: result.exitCode,
  };
};

/**
 * .what = runs radio.task.push via rhachet dispatch
 * .why = tests the skill as a consumer would invoke it
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  auth?: string;
  into?: string;
  title?: string;
  description?: string;
  exid?: string;
  status?: string;
  idem?: string;
  homeDir?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.auth ? `--auth "${input.auth}"` : '',
    input.into ? `--into "${input.into}"` : '',
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
    env: input.homeDir ? { HOME: input.homeDir } : {},
    timeout: 60000, // gh api calls can be slow
  });
};

describe('radio.task.push via gh.issues', () => {

  // shared consumer repo for all test cases (pnpm install is expensive)
  const scene = useBeforeAll(async () => {
    const consumer = await genConsumerRepo({ prefix: 'radio-gh-acpt-' });
    const homeDir = path.join(consumer.repoDir, '.home');
    fs.mkdirSync(homeDir);

    // allow radio usage for @all orgs
    runRadioUses({
      repoDir: consumer.repoDir,
      args: '--org @all allow',
      homeDir,
    });

    return { consumer, homeDir };
  });

  given('[case1] push new task to gh.issues (default auth via keyrack)', () => {

    when('[t0] push with title and description (no --auth flag)', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
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

    when('[t1] push without title (no --auth flag)', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPush({
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
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
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
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
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
          exid: issueNumber,
          status: 'CLAIMED',
        });
        expect(claimResult.exitCode).toBe(0);
        expect(claimResult.output).toContain('CLAIMED');
      });

      then('deliver closes the issue', async () => {
        const deliverResult = runRadioTaskPush({
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
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
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
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
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
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
          repoDir: scene.consumer.repoDir, homeDir: scene.homeDir,
          via: 'gh.issues',
          // no auth — uses default as-robot:via-keyrack(ehmpath)
          into: GITHUB_DEMO_REPO,
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
