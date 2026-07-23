import { BadRequestError, ConstraintError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

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
// TODO: unskip once keyrack provides BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN
describe.skip('daoRadioTaskViaGhIssues', () => {
  // use the demo repo for tests (NEVER this repo)
  const testRepo = GITHUB_DEMO_REPO;

  /**
   * .what = context for all dao calls
   * .why = getter ensures failfast if token absent and tests accidentally run
   */
  const getContext = (): ContextGithubAuth & ContextGitRepo => {
    if (!BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN)
      throw new BadRequestError('BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN not set');
    return {
      github: {
        auth: { token: BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN, role: 'as-robot' },
      },
      git: { repo: testRepo },
    };
  };

  // unique title per test run to avoid collisions
  const testRunId = `test-${Date.now()}`;

  given('[case1] get operations', () => {
    when('[t0] get.one.byPrimary for nonexistent issue', () => {
      then('returns null', async () => {
        const result = await daoRadioTaskViaGhIssues.get.one.byPrimary(
          { exid: '999999' },
          getContext(),
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
          getContext(),
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
          getContext(),
        );
      });

      then('returns task with github issue number as exid', () => {
        expect(taskCreated.exid).toMatch(/^\d+$/);
      });

      then('task can be retrieved by exid', async () => {
        const found = await daoRadioTaskViaGhIssues.get.one.byPrimary(
          { exid: taskCreated.exid },
          getContext(),
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
              getContext(),
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
          getContext(),
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
        getContext(),
      );
    });

    // cleanup after all tests in this given block (guarded for when setup fails)
    afterAll(async () => {
      try {
        if (taskCreated.exid) {
          await daoRadioTaskViaGhIssues.del(
            { exid: taskCreated.exid },
            getContext(),
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
          getContext(),
        );
        expect(updated.exid).toEqual(taskCreated.exid);

        // verify by refetch
        const fetched = await daoRadioTaskViaGhIssues.get.one.byPrimary(
          { exid: updated.exid },
          getContext(),
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
          getContext(),
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

/**
 * .what = integration test for the github auth failure nudge (the 401 path)
 * .why = the vision's PRIMARY case: a rejected robot token must land on a
 *        graceful ✋ ConstraintError that names the `--auth as-human` unblock,
 *        NOT a raw `Command failed` bubble.
 *
 * .note = this suite is NOT skipped — it needs an *invalid* token, which is
 *   exactly what triggers the 401. so it requires no real credential, only a
 *   real gh cli + network to verify the contract against the live github api.
 *
 * .usage:
 *   npm run test:integration -- daoRadioTaskViaGhIssues
 */
describe('daoRadioTaskViaGhIssues — github auth failure nudge', () => {
  /**
   * .what = context with a deliberately bogus as-robot token
   * .why = a bad token forces github to answer 401 (the case under test)
   */
  const getContextWithBogusToken = (): ContextGithubAuth & ContextGitRepo => ({
    github: {
      auth: {
        // an invalid token — github will reject this with HTTP 401
        token: 'ghp_bogusInvalidToken0000000000000000000000',
        role: 'as-robot',
      },
    },
    git: { repo: GITHUB_DEMO_REPO },
  });

  given('[case1] as-robot token is rejected by github (401)', () => {
    when('[t0] a gh-backed read is attempted with the bad token', () => {
      // run the gh call ONCE, capture the thrown error into a holder.
      // .note = a holder object is used (not the useThen/useBeforeAll proxy
      //   directly) so `instanceof`, `.message`, and `.metadata` reach the
      //   real error, not the deferred proxy.
      const scene = useBeforeAll(async () => {
        const error = await getError(
          daoRadioTaskViaGhIssues.get.one.byPrimary(
            { exid: '1' },
            getContextWithBogusToken(),
          ),
        );
        return { error };
      });

      then('it is a ConstraintError (caller-fixable ✋, not a 💥)', () => {
        expect(scene.error).toBeInstanceOf(ConstraintError);
      });

      then(
        'it carries exit code 2 (✋), not 1 (💥) — the reclassification',
        () => {
          // the vision's central claim: a rejected robot token is caller-fixable,
          // so it must exit 2 (ConstraintError), never 1 (MalfunctionError). this
          // locks the reclassification against a silent regression to 💥.
          const code = (scene.error as ConstraintError).code as {
            exit?: number;
          };
          expect(code.exit).toEqual(2);
        },
      );

      then('it names the as-human unblock as the primary move', () => {
        expect((scene.error as Error).message).toContain('--auth as-human');
      });

      then('it does NOT leak the raw `Command failed` bubble', () => {
        expect((scene.error as Error).message).not.toContain('Command failed');
      });

      then('it preserves the raw cause in metadata for debug', () => {
        const metadata = (scene.error as ConstraintError).metadata as {
          role?: string;
          detail?: string;
        };
        expect(metadata.role).toEqual('as-robot');
        // the raw gh cause survives for debug (demoted out of the headline)
        expect(typeof metadata.detail).toEqual('string');
        expect((metadata.detail ?? '').length).toBeGreaterThan(0);
      });
    });
  });
});
