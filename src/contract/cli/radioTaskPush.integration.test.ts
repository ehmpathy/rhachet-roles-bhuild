import { mkdtempSync } from 'fs';
import * as fs from 'fs/promises';
import { BadRequestError, ConstraintError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { daoRadioTaskViaOsFileops } from '@src/access/daos/daoRadioTask';
import type { ContextGitRepo } from '@src/domain.objects/RadioContext';
import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { cliRadioTaskPush } from './radioTaskPush';

/**
 * .what = contract-boundary tests for the radio.task.push CLI
 * .why  = proves the caller-faced output a human sees — the positive --help
 *         usage contract, the absent --via guard, the permission-blocked gate
 *         (push-specific: pull has no gate), and the positive os.fileops success
 *         contract with the "onto the pile!" beaver header — renders correctly at
 *         the CLI boundary, snapshotted so reviewers vibecheck the exact text
 *         without execution.
 * .note = these invoke the built CLI contract (cliRadioTaskPush). the success and
 *         blocked journeys set $HOME + cwd to a temp dir so the permission gate
 *         (which the CLI resolves via $HOME) is deterministic and never reads the
 *         human's real radio config — the blocked-gate journey is isolated from
 *         any ambient global/org radio block this way. the os.fileops .radio
 *         store itself resolves via os.homedir() (like the other os-fileops
 *         integration tests), so the seed + update round-trip through the same
 *         store consistently; the assertion is on the rendered stdout, not store
 *         location.
 *
 *         the --auth failure contract (as-robot:env unset, as-human in test,
 *         shx fail/empty, unknown mode) is snapshotted here too (cases 6-10), so
 *         the push contract owns its full caller-faced auth-failure surface rather
 *         than lean on pull's copy. push and pull both compose
 *         getOneRadioContextFromCliArgs → getGithubTokenByAuthArg and forward that
 *         ConstraintError verbatim, so the text matches pull byte-for-byte. one
 *         push-specific twist: the permission gate runs BEFORE auth, so each auth
 *         case first grants a local radio.uses under an isolated HOME to reach the
 *         auth check at all (pull has no gate).
 */
describe('radio.task.push.integration — CLI contract', () => {
  // invoke the CLI contract with a help flag, capture the stdout it prints
  // (--help / -h call process.exit(0), so stub exit to a sentinel and catch it)
  const runHelp = async (input?: { flag?: string }): Promise<string> => {
    const flag = input?.flag ?? '--help';
    const argvBefore = process.argv;
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('__exit__');
    }) as unknown as typeof process.exit);
    process.argv = ['node', flag];
    try {
      await getError(cliRadioTaskPush());
      return lines.join('\n');
    } finally {
      process.argv = argvBefore;
      logSpy.mockRestore();
      exitSpy.mockRestore();
    }
  };

  // invoke the CLI contract with injected argv, capture any thrown error
  // (optionally isolate HOME + cwd so the permission gate is deterministic)
  const runPushError = async (input: {
    argvTail: string[];
    home?: string;
  }): Promise<Error> => {
    const argvBefore = process.argv;
    const envBefore = process.env;
    const cwdBefore = process.cwd();
    process.argv = ['node', ...input.argvTail];
    // isolate HOME + cwd → the temp home so the radio permission gate reads no
    // ambient config. the CLI honors $HOME (standard convention), so the global
    // meter under ~/.rhachet/storage resolves to the temp home, not the human's.
    if (input.home) {
      process.env = { ...envBefore, HOME: input.home };
      process.chdir(input.home);
    }
    try {
      return await getError(cliRadioTaskPush());
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
      process.chdir(cwdBefore);
    }
  };

  // seed a task then invoke the push update CLI under an isolated HOME + cwd
  // (local radio.uses = allowed grants the permission gate; temp HOME isolates
  //  both the permission state and the os.fileops .radio store)
  const runPushUpdate = async (input: {
    home: string;
    repo: RadioTaskRepo;
    seed: RadioTask;
    argvTail: string[];
  }): Promise<string> => {
    const argvBefore = process.argv;
    const envBefore = process.env;
    const cwdBefore = process.cwd();
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    process.env = { ...envBefore, HOME: input.home };
    process.chdir(input.home);
    try {
      // grant local permission so the push gate allows dispatch
      await fs.mkdir(path.join(input.home, '.meter'), { recursive: true });
      await fs.writeFile(
        path.join(input.home, '.meter', 'radio.uses.jsonc'),
        JSON.stringify({ state: 'allowed' }),
        'utf-8',
      );

      // seed one task so the push resolves an update by exid
      const ctx: ContextGitRepo = { git: { repo: input.repo } };
      await daoRadioTaskViaOsFileops.set.findsert({ task: input.seed }, ctx);

      // run the CLI push update
      process.argv = ['node', ...input.argvTail];
      await cliRadioTaskPush();
      return lines.join('\n');
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
      process.chdir(cwdBefore);
      logSpy.mockRestore();
    }
  };

  // grant local permission under an isolated HOME, then run a gh.issues push
  // with a broken --auth and capture the ConstraintError the shared auth flow
  // throws. push runs its permission gate BEFORE auth, so the grant is required
  // to reach the auth check at all (pull has no gate). auth fails fast before
  // any gh i/o, so no network is touched and the output stays deterministic.
  const runPushAuthError = async (input: { auth: string }): Promise<Error> => {
    const argvBefore = process.argv;
    const envBefore = process.env;
    const cwdBefore = process.cwd();
    const home = mkdtempSync(path.join(os.tmpdir(), 'radio-push-cli-auth-'));
    try {
      await fs.mkdir(path.join(home, '.meter'), { recursive: true });
      await fs.writeFile(
        path.join(home, '.meter', 'radio.uses.jsonc'),
        JSON.stringify({ state: 'allowed' }),
        'utf-8',
      );
      process.env = { ...envBefore, HOME: home };
      process.chdir(home);
      process.argv = [
        'node',
        '--via',
        'gh.issues',
        '--into',
        'test-owner/example',
        '--title',
        'auth failure contract',
        '--description',
        'auth fails before any gh i/o',
        '--auth',
        input.auth,
      ];
      return await getError(cliRadioTaskPush());
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
      process.chdir(cwdBefore);
      await fs.rm(home, { recursive: true, force: true });
    }
  };

  given('[case1] --help (the positive usage contract)', () => {
    when('[t0] the push skill runs', () => {
      then('prints the usage + options help text', async () => {
        const stdout = await runHelp();
        expect(stdout).toContain('radio.task.push --help');
        expect(stdout).toContain('--via');
        expect(stdout).toContain('--into');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] no --via arg', () => {
    when('[t0] the push skill runs', () => {
      then('fails with a BadRequestError that names the channels', async () => {
        const error = await runPushError({
          argvTail: ['--into', 'test-owner/example'],
        });
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('--via is required');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] permission unset (the safe-default blocked gate, push-specific)',
    () => {
      // isolate HOME + cwd to a fresh temp dir: no global/org config and no local
      // radio.uses → the decision resolves to the safe default (blocked)
      const home = mkdtempSync(
        path.join(os.tmpdir(), 'radio-push-cli-blocked-'),
      );

      afterAll(async () => {
        await fs.rm(home, { recursive: true, force: true });
      });

      when('[t0] the push skill runs against an ungranted repo', () => {
        then(
          'fails with a BadRequestError that names the grant command',
          async () => {
            const error = await runPushError({
              argvTail: [
                '--via',
                'os.fileops',
                '--into',
                'test-owner/test-repo-push-blocked',
                '--title',
                'blocked task',
                '--description',
                'should not dispatch',
              ],
              home,
            });
            expect(error).toBeInstanceOf(BadRequestError);
            expect(error.message).toContain('radio.task.push blocked');
            expect(error.message).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case4] --via os.fileops update with a seeded task (the positive success contract)',
    () => {
      // a fresh temp HOME isolates the permission state + the .radio store, so a
      // fixed repo name stays deterministic in the snapshot without cross-run
      // collision
      const repo = new RadioTaskRepo({
        owner: 'test-owner',
        name: 'test-repo-push-cli',
      });

      const home = mkdtempSync(
        path.join(os.tmpdir(), 'radio-push-cli-success-'),
      );

      afterAll(async () => {
        await fs.rm(home, { recursive: true, force: true });
      });

      when('[t0] the push skill runs the real filesystem update', () => {
        then('prints the rendered task detail a human sees', async () => {
          const seed = new RadioTask({
            exid: 'push-cli-001',
            title: 'first cli push task',
            description: 'seeded for update',
            status: RadioTaskStatus.QUEUED,
            repo,
            pushedBy: 'tester',
            pushedAt: '2026-01-30' as IsoDateStamp,
            claimedBy: null,
            claimedAt: null,
            deliveredAt: null,
            branch: null,
          });
          const stdout = await runPushUpdate({
            home,
            repo,
            seed,
            argvTail: [
              '--via',
              'os.fileops',
              '--into',
              `${repo.owner}/${repo.name}`,
              '--exid',
              'push-cli-001',
              '--title',
              'updated cli push task',
            ],
          });
          expect(stdout).toContain('onto the pile!');
          expect(stdout).toContain('push-cli-001');
          expect(stdout).toContain('updated cli push task');
          expect(stdout).toMatchSnapshot();
        });
      });
    },
  );

  given('[case5] -h (the short-flag alias)', () => {
    when('[t0] the push skill runs', () => {
      then('prints the same usage + options help text', async () => {
        const stdout = await runHelp({ flag: '-h' });
        expect(stdout).toContain('radio.task.push --help');
        expect(stdout).toContain('--via');
        expect(stdout).toContain('--into');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] --auth as-robot:env(MY_TOKEN) with the var unset', () => {
    when('[t0] the push skill runs', () => {
      then(
        'fails with a ConstraintError that names the var + fix',
        async () => {
          const error = await runPushAuthError({
            auth: 'as-robot:env(MY_TOKEN)',
          });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('MY_TOKEN');
          expect(error.message).toContain('not set');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case7] --auth as-human inside the test environment', () => {
    when('[t0] the push skill runs', () => {
      then(
        'fails with a ConstraintError that names the robot alternatives',
        async () => {
          const error = await runPushAuthError({ auth: 'as-human' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('forbidden in test');
          expect(error.message).toContain('as-robot:env');
          expect(error.message).toContain('as-robot:shx');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case8] --auth as-robot:shx(command) that exits non-zero', () => {
    when('[t0] the push skill runs the real shell command', () => {
      then(
        'fails with a ConstraintError that wraps the shell failure',
        async () => {
          const error = await runPushAuthError({
            auth: 'as-robot:shx(exit 1)',
          });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('command failed');
          expect(error.message).toContain('check the command runs');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case9] --auth as-robot:shx(command) that prints no output', () => {
    when('[t0] the push skill runs the real shell command', () => {
      then(
        'fails with a ConstraintError that names the empty output',
        async () => {
          const error = await runPushAuthError({
            auth: 'as-robot:shx(printf "")',
          });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('no output');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case10] --auth with an unrecognized mode', () => {
    when('[t0] the push skill runs', () => {
      then(
        'fails with a ConstraintError that lists every supported mode',
        async () => {
          const error = await runPushAuthError({ auth: 'some-unknown-mode' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('unrecognized --auth mode');
          expect(error.message).toContain('as-robot:via-keyrack');
          expect(error.message).toContain('as-robot:shx');
          expect(error.message).toContain('as-robot:env');
          expect(error.message).toContain('as-human');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });
});
