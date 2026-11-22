import { mkdtempSync } from 'fs';
import * as fs from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useThen, when } from 'test-fns';

import {
  STUB_GH_TOKEN,
  withAmbientStub,
} from '@src/.test/utils/withAmbientStub';
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
 *         a shut gate (case3) and an --auth fault (cases 6-10) hold the push: it
 *         is recorded QUEUED into the cwd's .behavior/.radio/, reported, and
 *         exits 2 — never a throw that drops it. the held output names the
 *         reason and the fix (the grant command, or the auth fault's headline +
 *         hint). the permission gate runs BEFORE auth, so each auth case first
 *         grants a local radio.uses under an isolated HOME to reach the auth check.
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
    const exitCodeBefore = process.exitCode;
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
      process.exitCode = exitCodeBefore;
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
    const exitCodeBefore = process.exitCode;
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
      process.exitCode = exitCodeBefore;
      logSpy.mockRestore();
    }
  };

  // run a push that the recorder holds, under an isolated HOME + cwd; capture
  // the stdout it prints and the exit code it sets. a held push never throws:
  // it is recorded QUEUED, reported, and exits 2
  const runPushHeld = async (input: {
    argvTail: string[];
    home: string;
    grant: boolean;
  }): Promise<{ stdout: string; exitCode: number | undefined }> => {
    const argvBefore = process.argv;
    const envBefore = process.env;
    const cwdBefore = process.cwd();
    const exitCodeBefore = process.exitCode;
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    try {
      // grant local permission, when asked, so the push reaches the auth check
      if (input.grant) {
        await fs.mkdir(path.join(input.home, '.meter'), { recursive: true });
        await fs.writeFile(
          path.join(input.home, '.meter', 'radio.uses.jsonc'),
          JSON.stringify({ state: 'allowed' }),
          'utf-8',
        );
      }
      process.env = { ...envBefore, HOME: input.home };
      process.chdir(input.home);
      process.argv = ['node', ...input.argvTail];
      await cliRadioTaskPush();
      const exitCode =
        typeof process.exitCode === 'number' ? process.exitCode : undefined;
      return { stdout: lines.join('\n'), exitCode };
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
      process.exitCode = exitCodeBefore;
      process.chdir(cwdBefore);
      logSpy.mockRestore();
    }
  };

  // grant local permission under an isolated HOME, then run a gh.issues push
  // with a broken --auth. the shared auth flow fails before any gh i/o, so the
  // recorder holds the push as upstream:auth and names the fix; no network is
  // touched and the output stays deterministic
  const runPushAuthHeld = async (input: {
    auth: string;
  }): Promise<{ stdout: string; exitCode: number | undefined }> => {
    const home = mkdtempSync(path.join(os.tmpdir(), 'radio-push-cli-auth-'));
    try {
      return await runPushHeld({
        home,
        grant: true,
        argvTail: [
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
        ],
      });
    } finally {
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
        expect(stdout).toContain('as-ehmpath              keyrack, then');
        expect(stdout).toContain('as-ehmpath-via-keyrack  keyrack only');
        expect(stdout).toContain('as-ehmpath-via-ambient  the gh login only');
        expect(stdout).toContain('as-human                the gh login');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] no --via arg', () => {
    when('[t0] the push skill runs', () => {
      then('fails with a ConstraintError that names the channels', async () => {
        const error = await runPushError({
          argvTail: ['--into', 'test-owner/example'],
        });
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('--via is required');
        expect(error.message).toContain('--via gh.issues or --via os.fileops');
        expect(error.message).not.toContain('{');
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
          'holds the push QUEUED, exit 2, and names the grant command',
          async () => {
            const result = await runPushHeld({
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
              grant: false,
            });
            expect(result.exitCode).toEqual(2);
            expect(result.stdout).toContain('🦫 held for the radio');
            expect(result.stdout).toContain('radio.uses:blocked — default');
            expect(result.stdout).toContain(
              'lift it (human): rhx radio.uses allow',
            );
            expect(result.stdout).toMatchSnapshot();
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
        'holds the push as upstream:auth, and names the var + fix',
        async () => {
          const result = await runPushAuthHeld({
            auth: 'as-robot:env(MY_TOKEN)',
          });
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toContain('upstream:auth');
          expect(result.stdout).toContain('MY_TOKEN');
          expect(result.stdout).toContain('not set');
          expect(result.stdout).toMatchSnapshot();
        },
      );
    });
  });

  given('[case7] --auth as-human inside the test environment', () => {
    when('[t0] the push skill runs', () => {
      then(
        'holds the push as upstream:auth, and names the robot alternatives',
        async () => {
          const result = await runPushAuthHeld({ auth: 'as-human' });
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toContain('upstream:auth');
          expect(result.stdout).toContain('forbidden in test');
          expect(result.stdout).toContain('as-robot:env');
          expect(result.stdout).toContain('as-robot:shx');
          expect(result.stdout).toMatchSnapshot();
        },
      );
    });
  });

  given('[case8] --auth as-robot:shx(command) that exits non-zero', () => {
    when('[t0] the push skill runs the real shell command', () => {
      then(
        'holds the push as upstream:auth, and names the shell failure',
        async () => {
          const result = await runPushAuthHeld({
            auth: 'as-robot:shx(exit 1)',
          });
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toContain('upstream:auth');
          expect(result.stdout).toContain('command failed');
          expect(result.stdout).toContain('check the command runs');
          expect(result.stdout).toMatchSnapshot();
        },
      );
    });
  });

  given('[case9] --auth as-robot:shx(command) that prints no output', () => {
    when('[t0] the push skill runs the real shell command', () => {
      then(
        'holds the push as upstream:auth, and names the empty output',
        async () => {
          const result = await runPushAuthHeld({
            auth: 'as-robot:shx(printf "")',
          });
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toContain('upstream:auth');
          expect(result.stdout).toContain('no output');
          expect(result.stdout).toMatchSnapshot();
        },
      );
    });
  });

  given('[case10] --auth with an unrecognized mode', () => {
    when('[t0] the push skill runs', () => {
      then(
        'holds the push as upstream:auth, and lists every supported mode',
        async () => {
          const result = await runPushAuthHeld({ auth: 'some-unknown-mode' });
          expect(result.exitCode).toEqual(2);
          expect(result.stdout).toContain('upstream:auth');
          expect(result.stdout).toContain('unrecognized --auth mode');
          expect(result.stdout).toContain('as-robot:via-keyrack');
          expect(result.stdout).toContain('as-robot:shx');
          expect(result.stdout).toContain('as-robot:env');
          expect(result.stdout).toContain('as-human');
          expect(result.stdout).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[case10a] --auth as-ehmpath-via-ambient on a box whose git email is a human one',
    () => {
      when('[t0] the push skill runs against a stub gh with a login', () => {
        then(
          'holds the push as upstream:auth, names the ambient row, never sends as the human',
          async () => {
            const result = await withAmbientStub(
              {
                slug: 'push-case10a',
                gh: { login: 'token' },
                git: { email: 'bert@example.com' },
              },
              async () => runPushAuthHeld({ auth: 'as-ehmpath-via-ambient' }),
            );
            expect(result.exitCode).toEqual(2);
            expect(result.stdout).toContain('upstream:auth');
            expect(result.stdout).toContain('found no ehmpath token');
            expect(result.stdout).toContain(
              'ambient: git config user.email = bert@example.com, not an ehmpath email',
            );
            expect(result.stdout).not.toContain('keyrack:');
            expect(result.stdout).not.toContain(STUB_GH_TOKEN);
            expect(result.stdout).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case10b] --auth as-ehmpath-via-ambient on an ehmpath box whose gh holds no login',
    () => {
      when('[t0] the push skill runs against a stub gh with no login', () => {
        then(
          'holds the push as upstream:auth, and names gh auth login as the fix',
          async () => {
            const result = await withAmbientStub(
              {
                slug: 'push-case10b',
                gh: { login: 'none' },
                git: { email: 'seaturtle@ehmpath.com' },
              },
              async () => runPushAuthHeld({ auth: 'as-ehmpath-via-ambient' }),
            );
            expect(result.exitCode).toEqual(2);
            expect(result.stdout).toContain(
              'ambient: ehmpath email, but gh holds no login',
            );
            expect(result.stdout).toContain('gh auth login');
            expect(result.stdout).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case10c] --auth as-ehmpath on a fresh ehmpath box: keyrack holds no token, gh is logged in',
    () => {
      when('[t0] the push skill runs against a stub gh with a login', () => {
        const result = useThen('the push runs', async () =>
          withAmbientStub(
            {
              slug: 'push-case10c',
              gh: { login: 'token' },
              git: { email: 'seaturtle@ehmpath.com' },
            },
            async (scene) => {
              // keyrack must miss: a temp HOME holds no vault, and no env passthrough
              // may answer for it (.note = deliberate mutation, restored below)
              const tokenEnvBefore = process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
              delete process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
              const home = mkdtempSync(
                path.join(os.tmpdir(), 'radio-push-cli-ehmpath-'),
              );
              try {
                const pushed = await runPushHeld({
                  home,
                  grant: true,
                  argvTail: [
                    '--via',
                    'gh.issues',
                    '--into',
                    'test-owner/example',
                    '--title',
                    'tide chart refresh',
                    '--description',
                    'the ambient ehmpath login pays',
                    '--auth',
                    'as-ehmpath',
                  ],
                });
                return { ...pushed, ghTokensSeen: scene.getGhTokensSeen() };
              } finally {
                if (tokenEnvBefore !== undefined)
                  process.env.EHMPATH_BEAVER_GITHUB_TOKEN = tokenEnvBefore;
                await fs.rm(home, { recursive: true, force: true });
              }
            },
          ),
        );
        then('the push is delivered, not held', () => {
          expect(result.exitCode).toBeUndefined();
          expect(result.stdout).toContain('🦫 onto the pile!');
          expect(result.stdout).not.toContain('upstream:auth');
        });
        then('the stub gh login token is the one that reached gh', () => {
          expect(result.ghTokensSeen.length).toBeGreaterThan(0);
          expect(new Set(result.ghTokensSeen)).toEqual(
            new Set([STUB_GH_TOKEN]),
          );
        });
        then('the output names the spot that paid: ambient', () => {
          expect(result.stdout).toContain('auth: as-ehmpath (via ambient)');
          expect(result.stdout).not.toContain(STUB_GH_TOKEN);
        });
        then('the output matches the snapshot', () => {
          expect(asStdoutStable(result)).toMatchSnapshot();
        });
      });
    },
  );

  /**
   * .what = the push stdout with the values a live send fills in masked
   * .why  = pushedBy names whoever the box resolves, and pushedAt names the day the test runs;
   *         either one would make a snapshot fail on another box or another day
   */
  const asStdoutStable = (input: { stdout: string }): string =>
    input.stdout
      .replace(/pushedBy: .*/g, 'pushedBy: <masked>')
      .replace(/pushedAt: \d{4}-\d{2}-\d{2}/g, 'pushedAt: <date>');

  /**
   * .what = run a gh.issues push with NO --auth, under a stub ambient world
   * .why  = the default is ambient-first; these cases prove what each box sends with
   */
  const runPushDefaultAuthOnBox = async (input: {
    slug: string;
    email: string;
  }) =>
    withAmbientStub(
      {
        slug: input.slug,
        gh: { login: 'token' },
        git: { email: input.email },
      },
      async (scene) => {
        // keyrack must miss: a temp HOME holds no vault, and no env passthrough may answer
        // for it (.note = deliberate mutation, restored below)
        const tokenEnvBefore = process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
        delete process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
        const home = mkdtempSync(
          path.join(os.tmpdir(), `radio-push-cli-${input.slug}-`),
        );
        try {
          const pushed = await runPushHeld({
            home,
            grant: true,
            argvTail: [
              '--via',
              'gh.issues',
              '--into',
              'test-owner/example',
              '--title',
              'tide chart refresh',
              '--description',
              'the default auth reads the box',
            ],
          });
          return { ...pushed, ghTokensSeen: scene.getGhTokensSeen() };
        } finally {
          if (tokenEnvBefore !== undefined)
            process.env.EHMPATH_BEAVER_GITHUB_TOKEN = tokenEnvBefore;
          await fs.rm(home, { recursive: true, force: true });
        }
      },
    );

  given(
    '[case10d] no --auth on an ehmpath box with a gh login (ambient-first)',
    () => {
      when('[t0] the push skill runs against a stub gh', () => {
        const result = useThen('the push runs', async () =>
          runPushDefaultAuthOnBox({
            slug: 'push-case10d',
            email: 'seaturtle@ehmpath.com',
          }),
        );
        then('the push is delivered with no question asked', () => {
          expect(result.exitCode).toBeUndefined();
          expect(result.stdout).toContain('🦫 onto the pile!');
          expect(result.stdout).not.toContain('upstream:auth');
        });
        then(
          'the robot token from the gh login is the one that reached gh',
          () => {
            expect(result.ghTokensSeen.length).toBeGreaterThan(0);
            expect(new Set(result.ghTokensSeen)).toEqual(
              new Set([STUB_GH_TOKEN]),
            );
          },
        );
        then('the output names the spot that paid: ambient', () => {
          expect(result.stdout).toContain('auth: as-ehmpath (via ambient)');
          expect(result.stdout).not.toContain(STUB_GH_TOKEN);
        });
        then('the output matches the snapshot', () => {
          expect(asStdoutStable(result)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case10e] no --auth on a human box (ambient-first)', () => {
    when('[t0] the push skill runs against a stub gh', () => {
      const result = useThen('the push runs', async () =>
        runPushDefaultAuthOnBox({
          slug: 'push-case10e',
          email: 'bert@example.com',
        }),
      );
      then('the push is delivered as-human', () => {
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toContain('🦫 onto the pile!');
        expect(result.stdout).not.toContain('upstream:auth');
      });
      then('no robot token reached gh: gh used its own login', () => {
        expect(result.ghTokensSeen.length).toBeGreaterThan(0);
        expect(new Set(result.ghTokensSeen)).toEqual(new Set(['(none)']));
      });
      then('the output names no robot spot', () => {
        expect(result.stdout).not.toContain('as-ehmpath (via');
      });
      then('the output matches the snapshot', () => {
        expect(asStdoutStable(result)).toMatchSnapshot();
      });
    });
  });

  given('[case11] no --into arg', () => {
    when('[t0] the push skill runs', () => {
      then('fails before any record, and names how to set --into', async () => {
        const error = await runPushError({
          argvTail: ['--via', 'os.fileops', '--title', 'surf report'],
        });
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('--into is required');
        expect(error.message).toContain('--into @this');
        expect(error.message).not.toContain('{');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case12] a new task with no --title', () => {
    when('[t0] the push skill runs', () => {
      then('fails before any record, and names the flag', async () => {
        const error = await runPushError({
          argvTail: [
            '--via',
            'os.fileops',
            '--into',
            'test-owner/example',
            '--description',
            'wax the longboards',
          ],
        });
        expect(error.message).toContain('--title required');
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
