import { BadRequestError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import { given, then, useBeforeAll, when } from 'test-fns';

import type {
  ContextGithubAuth,
  ContextGitRepo,
} from '../../../domain.objects/RadioContext';
import { RadioTask } from '../../../domain.objects/RadioTask';
import { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '../../../domain.objects/RadioTaskStatus';
import { daoRadioTaskViaGhIssues } from './daoRadioTaskViaGhIssues';

/**
 * .what = demo repo for gh.issues integration tests
 * .why = dedicated test repo to isolate test issues from real repos
 *
 * .critical = NEVER use this repo (rhachet-roles-bhuild) for tests
 */
const GITHUB_DEMO_REPO = new RadioTaskRepo({
  owner: 'ehmpathy',
  name: 'rhachet-roles-bhuild-demo',
});

/**
 * .what = github token for bhuild demo repo
 * .why = auth for gh.issues integration tests
 *
 * .critical = tests MUST NOT use default gh cli auto login
 *             tests MUST explicitly use this token
 */
const BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN =
  process.env.BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN;

/**
 * .what = integration tests for daoRadioTaskViaGhIssues
 * .why = validates github issues dao operations end-to-end
 *
 * .note = these tests require BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN
 * .note = uses ehmpathy/rhachet-roles-bhuild-demo as test repo (NEVER this repo)
 *
 * .usage:
 *   source .agent/repo=.this/role=any/skills/use.apikeys.sh
 *   npm run test:integration -- daoRadioTaskViaGhIssues
 */
describe('daoRadioTaskViaGhIssues', () => {
  // failfast if BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN not set
  if (!BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN) {
    throw new BadRequestError(
      [
        'BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN not set',
        '',
        'integration tests MUST NOT use default gh cli auth',
        'run: source .agent/repo=.this/role=any/skills/use.apikeys.sh',
      ].join('\n'),
    );
  }

  // use the demo repo for tests (NEVER this repo)
  const testRepo = GITHUB_DEMO_REPO;

  // context for all dao calls
  const context: ContextGithubAuth & ContextGitRepo = {
    github: {
      auth: { token: BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN, role: 'as-robot' },
    },
    git: { repo: testRepo },
  };

  // unique title per test run to avoid collisions
  const testRunId = `test-${Date.now()}`;

  given('[case1] get operations', () => {
    when('[t0] get.one.byPrimary for nonexistent issue', () => {
      then('returns null', async () => {
        const result = await daoRadioTaskViaGhIssues.get.one.byPrimary(
          { exid: '999999' },
          context,
        );
        expect(result).toBeNull();
      });
    });

    when('[t1] get.one.byUnique for nonexistent issue', () => {
      then('returns null', async () => {
        const result = await daoRadioTaskViaGhIssues.get.one.byUnique(
          {
            repo: testRepo,
            title: 'nonexistent-task-title-xyz',
          },
          context,
        );
        expect(result).toBeNull();
      });
    });
  });

  given('[case2] findsert a new task', () => {
    const taskToCreate = new RadioTask({
      exid: '', // will be set by gh
      title: `gh.issues dao test task ${testRunId}`,
      description: 'integration test description',
      status: RadioTaskStatus.QUEUED,
      repo: testRepo,
      pushedBy: 'tester',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    when('[t0] findsert is called', () => {
      const taskCreated = useBeforeAll(async () => {
        return daoRadioTaskViaGhIssues.set.findsert(
          { task: taskToCreate },
          context,
        );
      });

      then('returns task with github issue number as exid', () => {
        expect(taskCreated.exid).toMatch(/^\d+$/);
      });

      then('task can be retrieved by exid', async () => {
        const found = await daoRadioTaskViaGhIssues.get.one.byPrimary(
          { exid: taskCreated.exid },
          context,
        );
        expect(found).not.toBeNull();
        expect(found?.title).toEqual(taskToCreate.title);
      });

      // cleanup: close the issue after test (guarded for when setup fails)
      afterAll(async () => {
        try {
          if (taskCreated.exid) {
            await daoRadioTaskViaGhIssues.del(
              { exid: taskCreated.exid },
              context,
            );
          }
        } catch {
          // ignore cleanup errors (e.g., when setup didn't complete)
        }
      });
    });

    when('[t1] findsert same task again', () => {
      then('returns found task (idempotent)', async () => {
        const result = await daoRadioTaskViaGhIssues.set.findsert(
          { task: taskToCreate },
          context,
        );
        expect(result.title).toEqual(taskToCreate.title);
      });
    });
  });

  given('[case3] upsert to update a task', () => {
    const taskToCreate = new RadioTask({
      exid: '',
      title: `gh.issues upsert test ${testRunId}`,
      description: 'original description',
      status: RadioTaskStatus.QUEUED,
      repo: testRepo,
      pushedBy: 'tester',
      pushedAt: '2026-01-30' as IsoDateStamp,
      claimedBy: null,
      claimedAt: null,
      deliveredAt: null,
      branch: null,
    });

    const taskCreated = useBeforeAll(async () => {
      return daoRadioTaskViaGhIssues.set.findsert(
        { task: taskToCreate },
        context,
      );
    });

    // cleanup after all tests in this given block (guarded for when setup fails)
    afterAll(async () => {
      try {
        if (taskCreated.exid) {
          await daoRadioTaskViaGhIssues.del(
            { exid: taskCreated.exid },
            context,
          );
        }
      } catch {
        // ignore cleanup errors (e.g., when setup didn't complete)
      }
    });

    when('[t0] upsert with updated description', () => {
      then('task is updated', async () => {
        const taskToUpdate = new RadioTask({
          ...taskCreated,
          description: 'updated description via upsert',
        });

        const updated = await daoRadioTaskViaGhIssues.set.upsert(
          { task: taskToUpdate },
          context,
        );
        expect(updated.exid).toEqual(taskCreated.exid);

        // verify by refetch
        const fetched = await daoRadioTaskViaGhIssues.get.one.byPrimary(
          { exid: updated.exid },
          context,
        );
        expect(fetched?.description).toEqual('updated description via upsert');
      });
    });
  });

  given('[case4] get.all lists radio tasks', () => {
    when('[t0] get.all is called', () => {
      then('returns array of RadioTask objects', async () => {
        const result = await daoRadioTaskViaGhIssues.get.all(
          { repo: testRepo, limit: 5 },
          context,
        );
        expect(Array.isArray(result)).toBe(true);
        // each result should be a RadioTask
        for (const task of result) {
          expect(task).toBeInstanceOf(RadioTask);
        }
      });
    });
  });
});
