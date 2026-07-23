import fs from 'fs';
import path from 'path';

import { BadRequestError } from 'helpful-errors';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  BHUILD_DEMO_REPO_ACCESS_GITHUB_TOKEN,
  GITHUB_DEMO_REPO,
  runRhachetSkill,
  sanitizeOutput,
} from '../.test/infra';

/**
 * .what = invoke radio.uses skill to set up permissions
 * .why = radio.task.push/pull requires radio.uses permission
 */
const runRadioUses = (input: {
  repoDir: string;
  args: string;
  homeDir?: string;
}): { exitCode: number } => {
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
  return { exitCode: result.exitCode };
};

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
  into: string;
  title: string;
  description: string;
}) => {
  const args = [
    `--via ${input.via}`,
    input.auth
      ? `--auth "${input.auth.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}"`
      : '',
    `--into "${input.into}"`,
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
  from?: string;
  list?: boolean;
  exid?: string;
  title?: string;
  status?: string;
  homeDir?: string;
  env?: Record<string, string>;
}) => {
  const args = [
    `--via ${input.via}`,
    // note: the auth is double-quoted, so parens need NO backslash escape —
    // escaping them makes them reach the parser literally and breaks the arg.
    // this matches the push helper exactly, so pull auths symmetric with push.
    input.auth ? `--auth "${input.auth}"` : '',
    input.from ? `--from "${input.from}"` : '',
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
    env: {
      ...(input.homeDir ? { HOME: input.homeDir } : {}),
      ...(input.env ?? {}),
    },
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
        into: GITHUB_DEMO_REPO,
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
          from: GITHUB_DEMO_REPO,
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
        into: GITHUB_DEMO_REPO,
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
          from: GITHUB_DEMO_REPO,
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
          from: GITHUB_DEMO_REPO,
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
        into: GITHUB_DEMO_REPO,
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
          from: GITHUB_DEMO_REPO,
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
          from: GITHUB_DEMO_REPO,
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

// ────────────────────────────────────────────────────────────────
// the wish's PRIMARY behavior, proven at the acceptance tier for the
// PULL surface too: a human runs `radio.task.pull`, an auth failure
// occurs, and they see a graceful ✋ (a caller-fixable ConstraintError),
// NOT a raw crash or 💥. pull composes the identical auth path as push
// (getOneRadioContextFromCliArgs → getGithubTokenByAuthArg), so the wish
// applies to pull exactly as to push. these cases need NO real credential
// (the case under test is a broken/rejected token), so unlike the
// happy-path suite above they run un-skipped.
// ────────────────────────────────────────────────────────────────
describe('radio.task.pull via gh.issues — github auth failure nudge', () => {
  // shared consumer repo for the auth-failure cases (pnpm install is expensive)
  const scene = useBeforeAll(async () => {
    const consumer = await genConsumerRepo({ prefix: 'radio-gh-pull-authfail-' });
    const homeDir = path.join(consumer.repoDir, '.home');
    fs.mkdirSync(homeDir);

    // allow radio usage for @all orgs so the auth path (not the permission
    // gate) is what the case exercises
    runRadioUses({
      repoDir: consumer.repoDir,
      args: '--org @all allow',
      homeDir,
    });

    return { consumer, homeDir };
  });

  given('[case5] auth misconfig surfaces a graceful ✋ (unset env token)', () => {
    when('[t0] pull with --auth as-robot:env(VAR) where VAR is not set', () => {
      // fully deterministic: the token is derived from an env var that is not
      // set, so the skill fails fast BEFORE any gh call — no network, no creds.
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          auth: 'as-robot:env(RADIO_ACCEPT_UNSET_TOKEN)',
          from: GITHUB_DEMO_REPO,
          list: true,
        }),
      );

      then('exits with code 2 (✋ caller-fixable ConstraintError, not 💥 exit 1)', () => {
        // the vision's central reclassification: a caller-fixable auth failure
        // is a ConstraintError (exit 2), never a MalfunctionError (exit 1).
        expect(result.exitCode).toBe(2);
      });

      then('names the unset env var in a graceful ✋ (not a raw crash)', () => {
        expect(result.output).toContain('RADIO_ACCEPT_UNSET_TOKEN');
        expect(result.output).toContain('not set');
      });

      then('does NOT leak a raw stack trace or unhandled crash', () => {
        expect(result.output).not.toContain('    at ');
        expect(result.output).not.toContain('UnhandledPromiseRejection');
      });

      then('the human-readable output matches snapshot', () => {
        expect(sanitizeOutput(result.output)).toMatchSnapshot();
      });
    });
  });

  given('[case6] rejected robot token surfaces the as-human nudge (gh 401)', () => {
    when('[t0] pull with an env token that github rejects (401)', () => {
      // a deliberately bogus token — github answers HTTP 401. no real
      // credential needed: the case under test IS a rejected token.
      const result = useBeforeAll(async () =>
        runRadioTaskPull({
          repoDir: scene.consumer.repoDir,
          homeDir: scene.homeDir,
          via: 'gh.issues',
          auth: 'as-robot:env(RADIO_ACCEPT_BOGUS_TOKEN)',
          env: {
            RADIO_ACCEPT_BOGUS_TOKEN: 'ghp_bogusInvalidToken0000000000000000000000',
          },
          from: GITHUB_DEMO_REPO,
          list: true,
        }),
      );

      then('exits with code 2 (✋ caller-fixable ConstraintError, not 💥 exit 1)', () => {
        // same central reclassification, proven for the PRIMARY (gh 401) case.
        expect(result.exitCode).toBe(2);
      });

      then('names the as-human unblock as the primary move', () => {
        expect(result.output).toContain('--auth as-human');
      });

      then('does NOT leak the raw `Command failed` bubble', () => {
        expect(result.output).not.toContain('Command failed');
      });

      // .note = deliberately NOT snapshotted (same rationale as push [case8]):
      //   the rendered ConstraintError metadata embeds the live gh command plus
      //   gh's own version-volatile 401 stderr in metadata.detail — all
      //   non-deterministic. the stable contract the human sees (exit 2, the
      //   --auth as-human nudge, no `Command failed` leak) is asserted
      //   explicitly above; the deterministic message SHAPE is snapshot-locked
      //   at the unit tier in getGithubAuthFailureMessage.test.
    });
  });
});

// ────────────────────────────────────────────────────────────────
// the positive/usage contract at the acceptance (subprocess) tier. the
// live happy path (a real pull) has non-deterministic output (live issue
// exids, cache paths) so it is asserted in the credential-gated suite above,
// not snapshotted. --help is the one FULLY-deterministic caller-faced output,
// so it is snapshotted here for a subprocess-tier vibecheck.
// ────────────────────────────────────────────────────────────────
describe('radio.task.pull via gh.issues — usage contract', () => {
  const scene = useBeforeAll(async () =>
    genConsumerRepo({ prefix: 'radio-gh-pull-help-' }),
  );

  given('[case7] --help renders the usage contract (deterministic)', () => {
    when('[t0] pull is invoked with --help', () => {
      const result = useBeforeAll(async () =>
        runRhachetSkill({
          repo: 'bhuild',
          role: 'dispatcher',
          skill: 'radio.task.pull',
          args: '--help',
          repoDir: scene.repoDir,
          timeout: 30000,
        }),
      );

      then('exits with code 0', () => {
        expect(result.exitCode).toBe(0);
      });

      then('names the required --via and --from options', () => {
        expect(result.output).toContain('--via');
        expect(result.output).toContain('--from');
      });

      then('the human-readable usage output matches snapshot', () => {
        expect(sanitizeOutput(result.output)).toMatchSnapshot();
      });
    });
  });
});
