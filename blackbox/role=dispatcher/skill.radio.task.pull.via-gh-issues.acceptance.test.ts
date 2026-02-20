import { BadRequestError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN,
  GITHUB_DEMO_REPO,
  runRhachetSkill,
} from '../.test/infra';

/**
 * .what = acceptance tests for radio.task.pull via gh.issues channel
 * .why = validates the github issues integration end-to-end
 *
 * .note = these tests require github authentication
 *         set BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN before test execution
 *
 * .usage:
 *   source .agent/repo=.this/role=any/skills/use.apikeys.sh
 *   npm run test:acceptance -- skill.radio.task.pull.via-gh-issues
 */


/**
 * .what = runs radio.task.push via rhachet dispatch
 * .why = helper to create tasks for pull tests
 */
const runRadioTaskPush = (input: {
  repoDir: string;
  via: string;
  auth?: string;
  repo: string;
  title: string;
  description: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.auth
      ? `--auth "${input.auth.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}"`
      : '',
    `--repo "${input.repo}"`,
    `--title "${input.title}"`,
    `--description "${input.description}"`,
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.push',
    args,
    repoDir: input.repoDir,
    timeout: 60000,
  });
};

/**
 * .what = runs radio.task.pull via rhachet dispatch (consumer pattern)
 * .why = tests the skill as a consumer would invoke it
 */
const runRadioTaskPull = (input: {
  repoDir: string;
  via: string;
  auth?: string;
  repo?: string;
  list?: boolean;
  exid?: string;
  title?: string;
  status?: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.auth
      ? `--auth "${input.auth.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}"`
      : '',
    input.repo ? `--repo "${input.repo}"` : '',
    input.list ? '--list' : '',
    input.exid ? `--exid "${input.exid}"` : '',
    input.title ? `--title "${input.title}"` : '',
    input.status ? `--status ${input.status}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return runRhachetSkill({
    repo: 'bhuild',
    role: 'dispatcher',
    skill: 'radio.task.pull',
    args,
    repoDir: input.repoDir,
    timeout: 60000,
  });
};

// TODO: unskip once keyrack provides BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN
describe.skip('radio.task.pull via gh.issues', () => {

  // shared consumer repo for all test cases (pnpm install is expensive)
  const sharedRepo = useBeforeAll(async () =>
    genConsumerRepo({ prefix: 'radio-gh-pull-acpt-' }),
  );

  given('[case1] list tasks from gh.issues', () => {
    // create a task first to ensure there is content to list
    useBeforeAll(async () =>
      runRadioTaskPush({
        repoDir: sharedRepo.repoDir,
        via: 'gh.issues',
        auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
        repo: GITHUB_DEMO_REPO,
        title: `pull list test ${Date.now()}`,
        description: 'for list verification',
      }),
    );

    when('[t0] pull --list from gh.issues', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          list: true,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('output shows tasks', () => {
        // should show at least the task we created
        expect(result.output.length).toBeGreaterThan(0);
      });
    });
  });

  given('[case2] pull specific task from gh.issues', () => {
    let issueNumber: string;

    // create a task to pull
    useBeforeAll(async () => {
      const result = runRadioTaskPush({
        repoDir: sharedRepo.repoDir,
        via: 'gh.issues',
        auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
        repo: GITHUB_DEMO_REPO,
        title: `pull one test ${Date.now()}`,
        description: 'for specific pull',
      });
      const match = result.output.match(/exid: (\d+)/);
      if (match) issueNumber = match[1]!;
      return { result };
    });

    when('[t0] pull by exid', () => {
      then('returns the task', () => {
        const result = runRadioTaskPull({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          exid: issueNumber,
        });
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('pull one test');
      });
    });

    when('[t1] pull nonexistent issue', () => {
      then('fails with not found', () => {
        const result = runRadioTaskPull({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          exid: '999999999',
        });
        expect(result.exitCode).not.toBe(0);
        expect(result.output.toLowerCase()).toContain('not found');
      });
    });
  });

  given('[case3] auto-cache on remote pull', () => {
    let issueNumber: string;

    // create a task to pull
    useBeforeAll(async () => {
      const result = runRadioTaskPush({
        repoDir: sharedRepo.repoDir,
        via: 'gh.issues',
        auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
        repo: GITHUB_DEMO_REPO,
        title: `cache test ${Date.now()}`,
        description: 'for cache verification',
      });
      const match = result.output.match(/exid: (\d+)/);
      if (match) issueNumber = match[1]!;
      return { result };
    });

    when('[t0] pull from gh.issues', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          exid: issueNumber,
        }),
      );

      then('indicates task was cached locally', () => {
        expect(result.exitCode).toBe(0);
        // output should mention cache
        expect(result.output.toLowerCase()).toMatch(/cache|local/);
      });
    });
  });

  given('[case4] filter by status', () => {
    when('[t0] pull --list with status=QUEUED', () => {
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: sharedRepo.repoDir,
          via: 'gh.issues',
          auth: 'as-robot:env(BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)',
          repo: GITHUB_DEMO_REPO,
          list: true,
          status: 'QUEUED',
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('only shows QUEUED tasks', () => {
        // if there are results, they should all be QUEUED
        if (result.output.includes('CLAIMED')) {
          fail('should not show CLAIMED tasks when filter is QUEUED');
        }
      });
    });
  });
});
