import * as fs from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import type { IsoDateStamp } from 'iso-time';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  STUB_GH_TOKEN,
  withAmbientStub,
} from '@src/.test/utils/withAmbientStub';
import { daoRadioTaskViaOsFileops } from '@src/access/daos/daoRadioTask';
import type { ContextGitRepo } from '@src/domain.objects/RadioContext';
import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { cliRadioTaskPull } from './radioTaskPull';

/**
 * .what = contract-boundary tests for the radio.task.pull CLI
 * .why  = proves the caller-faced output a human sees — the positive --help
 *         contract and every --auth failure (the wish's "key is not set" +
 *         two-path guidance, etc) — renders correctly at the CLI boundary,
 *         snapshotted so reviewers vibecheck the exact text without execution
 * .note = these invoke the built CLI contract (cliRadioTaskPull) and cross the
 *         real shell boundary via shx, so they live in the integration tier.
 *         (the repo's acceptance tier targets a deployed/local server via
 *         `--against local|cloud`; this is a serverless roles package, so the
 *         integration runner is the right home for a real-i/o contract test.)
 *         pull and push both compose getOneRadioContextFromCliArgs →
 *         getGithubTokenByAuthArg, so these journeys cover the shared auth
 *         contract. auth fails fast before any gh i/o, so no network is touched.
 *         jest sets JEST_WORKER_ID, so isTestEnv is true — as-human is forbidden
 *         and via-keyrack would nudge one-path, exactly as in ci.
 *         a gh.issues *success* would be live gh data (non-deterministic) + a
 *         secret token, so the deterministic positive success contract is a real
 *         os.fileops pull (case7): a seeded local task read back off the real
 *         filesystem and rendered through the same output path a human sees.
 *         (--help, case6, is the deterministic positive *usage* contract.)
 *
 * .mock = the gh cli, via withAmbientStub (a stub gh first on the subprocess PATH), in
 *         case8-case16 alone. case14, case15 also set a fake keyrack token (ghs_ shape)
 *         through the keyrack env passthrough; case16 sets a fake env GH_TOKEN
 * .why  = the ambient path reads `gh auth token`; a real gh on a dev box answers with the
 *         human's own login, and no test may read a real gh login (a prior draft leaked a real
 *         token into a log). the stub is the only way to put an ehmpath login on the box
 * .real = getGhAuthTokenFromRealGh.integration.test.ts runs the real gh with no login, to
 *         prove the real exit the code reads as none; daoRadioTaskViaGhIssues.integration and
 *         skill.radio.task.push.via-gh-issues.acceptance [case1]-[case6] reach real github
 */
describe('radio.task.pull.integration — CLI contract', () => {
  // invoke the CLI contract with injected argv + env, capture any thrown error
  const runPull = async (input: {
    auth: string;
    env?: NodeJS.ProcessEnv;
  }): Promise<Error> => {
    const argvBefore = process.argv;
    const envBefore = process.env;
    process.argv = [
      'node',
      '--via',
      'gh.issues',
      '--from',
      'ehmpathy/example',
      '--list',
      '--auth',
      input.auth,
    ];
    process.env = { ...envBefore, ...(input.env ?? {}) };
    try {
      return await getError(cliRadioTaskPull());
    } finally {
      process.argv = argvBefore;
      process.env = envBefore;
    }
  };

  // invoke the CLI contract with --help, capture the stdout it prints
  // (--help calls process.exit(0), so stub exit to a sentinel and catch it)
  const runHelp = async (): Promise<string> => {
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
    process.argv = ['node', '--help'];
    try {
      await getError(cliRadioTaskPull());
      return lines.join('\n');
    } finally {
      process.argv = argvBefore;
      logSpy.mockRestore();
      exitSpy.mockRestore();
    }
  };

  // invoke the CLI contract in list mode against os.fileops, capture stdout
  // (list mode returns normally — no process.exit — so only console.log is spied)
  const runListViaOsFileops = async (input: {
    repo: RadioTaskRepo;
  }): Promise<string> => {
    const argvBefore = process.argv;
    const lines: string[] = [];
    const logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map((a) => String(a)).join(' '));
      });
    process.argv = [
      'node',
      '--via',
      'os.fileops',
      '--from',
      `${input.repo.owner}/${input.repo.name}`,
      '--list',
    ];
    try {
      await cliRadioTaskPull();
      return lines.join('\n');
    } finally {
      process.argv = argvBefore;
      logSpy.mockRestore();
    }
  };

  given('[case1] --auth as-robot:env(MY_TOKEN) with the var unset', () => {
    when('[t0] the pull skill runs', () => {
      then(
        'fails with a ConstraintError that names the var + fix',
        async () => {
          const error = await runPull({ auth: 'as-robot:env(MY_TOKEN)' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('MY_TOKEN');
          expect(error.message).toContain('not set');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2] --auth as-human inside the test environment', () => {
    when('[t0] the pull skill runs', () => {
      then(
        'fails with a ConstraintError that names the robot alternatives',
        async () => {
          const error = await runPull({ auth: 'as-human' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('forbidden in test');
          expect(error.message).toContain('as-robot:env');
          expect(error.message).toContain('as-robot:shx');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3] --auth as-robot:shx(command) that exits non-zero', () => {
    when('[t0] the pull skill runs the real shell command', () => {
      then(
        'fails with a ConstraintError that wraps the shell failure',
        async () => {
          const error = await runPull({ auth: 'as-robot:shx(exit 1)' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('command failed');
          expect(error.message).toContain('check the command runs');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case4] --auth as-robot:shx(command) that prints no output', () => {
    when('[t0] the pull skill runs the real shell command', () => {
      then(
        'fails with a ConstraintError that names the empty output',
        async () => {
          const error = await runPull({ auth: 'as-robot:shx(printf "")' });
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('no output');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case5] --auth with an unrecognized mode', () => {
    when('[t0] the pull skill runs', () => {
      then(
        'fails with a ConstraintError that lists every supported mode',
        async () => {
          const error = await runPull({ auth: 'some-unknown-mode' });
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

  given('[case6] --help (the positive contract output)', () => {
    when('[t0] the pull skill runs', () => {
      then('prints the usage + options help text', async () => {
        const stdout = await runHelp();
        expect(stdout).toContain('radio.task.pull --help');
        expect(stdout).toContain('--via');
        expect(stdout).toContain('--auth');
        expect(stdout).toContain('as-ehmpath              keyrack, then');
        expect(stdout).toContain('as-ehmpath-via-keyrack  keyrack only');
        expect(stdout).toContain('as-ehmpath-via-ambient  the gh login only');
        expect(stdout).toContain('as-human                the gh login');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given(
    '[case7] --via os.fileops --list with a seeded local task (the positive success contract)',
    () => {
      // a unique repo per run isolates the fixture; the repo name never appears
      // in the rendered list output, so the snapshot stays deterministic
      const repo = new RadioTaskRepo({
        owner: 'test-owner',
        name: `test-repo-cli-pull-${Date.now()}`,
      });
      const radioDir = path.join(
        os.homedir(),
        'git',
        '.radio',
        repo.owner,
        repo.name,
      );
      const ctx: ContextGitRepo = { git: { repo } };

      // seed exactly one task — os.fileops get.all reads dir order (unordered),
      // so a single task guarantees a deterministic one-line list snapshot
      useBeforeAll(async () => {
        const task = new RadioTask({
          exid: 'pull-cli-001',
          title: 'first cli pull task',
          description: 'test',
          status: RadioTaskStatus.QUEUED,
          repo,
          pushedBy: 'tester',
          pushedAt: '2026-01-30' as IsoDateStamp,
          claimedBy: null,
          claimedAt: null,
          deliveredAt: null,
          branch: null,
        });
        return daoRadioTaskViaOsFileops.set.findsert({ task }, ctx);
      });

      afterAll(async () => {
        await fs.rm(radioDir, { recursive: true, force: true });
      });

      when('[t0] the pull skill runs the real filesystem read', () => {
        then('prints the rendered task list a human sees', async () => {
          const stdout = await runListViaOsFileops({ repo });
          expect(stdout).toContain("what's on the water");
          expect(stdout).toContain('pull-cli-001');
          expect(stdout).toContain('first cli pull task');
          expect(stdout).toMatchSnapshot();
        });
      });
    },
  );

  /**
   * .what = run a gh.issues pull --list under a stub ambient world, capture stdout + the
   *         token each gh call received
   * .why  = the auth line a pull prints names the spot that paid; only a real pull through
   *         the stub gh proves it reaches the CLI output
   */
  const runListViaGhOnBox = async (input: {
    slug: string;
    email: string;
    authArgs: string[];
    ghLogin?: 'token' | 'none';
    keyrackEnv?: string;
  }) =>
    withAmbientStub(
      {
        slug: input.slug,
        gh: { login: input.ghLogin ?? 'token' },
        git: { email: input.email },
      },
      async (scene) => {
        // .note = deliberate mutation of the keyrack env passthrough, restored below
        const tokenEnvBefore = process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
        if (input.keyrackEnv !== undefined)
          process.env.EHMPATH_BEAVER_GITHUB_TOKEN = input.keyrackEnv;
        const argvBefore = process.argv;
        const lines: string[] = [];
        const logSpy = jest
          .spyOn(console, 'log')
          .mockImplementation((...args: unknown[]) => {
            lines.push(args.map((a) => String(a)).join(' '));
          });
        process.argv = [
          'node',
          '--via',
          'gh.issues',
          '--from',
          'test-owner/example',
          '--list',
          ...input.authArgs,
        ];
        try {
          await cliRadioTaskPull();
          return {
            stdout: lines.join('\n'),
            ghTokensSeen: scene.getGhTokensSeen(),
          };
        } finally {
          process.argv = argvBefore;
          logSpy.mockRestore();
          if (tokenEnvBefore === undefined)
            delete process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
          if (tokenEnvBefore !== undefined)
            process.env.EHMPATH_BEAVER_GITHUB_TOKEN = tokenEnvBefore;
        }
      },
    );

  given(
    '[case8] --auth as-ehmpath-via-ambient on an ehmpath box with a gh login',
    () => {
      when('[t0] the pull skill lists against a stub gh', () => {
        const result = useThen('the pull runs', async () =>
          runListViaGhOnBox({
            slug: 'pull-case8',
            email: 'seaturtle@ehmpath.com',
            authArgs: ['--auth', 'as-ehmpath-via-ambient'],
          }),
        );
        then('the stub gh login token is the one that reached gh', () => {
          expect(result.ghTokensSeen.length).toBeGreaterThan(0);
          expect(new Set(result.ghTokensSeen)).toEqual(
            new Set([STUB_GH_TOKEN]),
          );
        });
        then('the output names the spot that paid, never the token', () => {
          expect(result.stdout).toContain('as-ehmpath (via ambient)');
          expect(result.stdout).not.toContain(STUB_GH_TOKEN);
        });
        then('the output matches the snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });
    },
  );

  given('[case9] no --auth on a human box (ambient-first)', () => {
    when('[t0] the pull skill lists against a stub gh', () => {
      const result = useThen('the pull runs', async () =>
        runListViaGhOnBox({
          slug: 'pull-case9',
          email: 'bert@example.com',
          authArgs: [],
        }),
      );
      then('no robot token reached gh: gh used its own login', () => {
        expect(result.ghTokensSeen.length).toBeGreaterThan(0);
        expect(new Set(result.ghTokensSeen)).toEqual(new Set(['(none)']));
      });
      then('the output names the human source and its email', () => {
        expect(result.stdout).toContain(
          'as-human (via ambient email bert@example.com)',
        );
      });
      then('the output matches the snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = run a gh.issues pull --list that must miss, under a stub ambient world where keyrack
   *         holds no token; capture the thrown error + the token each gh call received
   * .why  = a pull on a miss throws its ConstraintError to the caller (a pull holds no record),
   *         so the message is the whole output a human reads
   *
   * .note = keyrack must miss: a temp HOME holds no vault, and the env passthrough is unset
   *         (.note = deliberate mutation, restored in the finally)
   */
  const runPullMissOnBox = async (input: {
    slug: string;
    email: string;
    auth: string | null;
    ghLogin?: 'token' | 'none';
    ghTokenEnv?: string;
  }) =>
    withAmbientStub(
      {
        slug: input.slug,
        gh: { login: input.ghLogin ?? 'token' },
        git: { email: input.email },
      },
      async (scene) => {
        const argvBefore = process.argv;
        const homeBefore = process.env.HOME;
        const tokenEnvBefore = process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
        const ghTokenEnvBefore = process.env.GH_TOKEN;
        const home = await fs.mkdtemp(
          path.join(os.tmpdir(), `radio-pull-cli-${input.slug}-`),
        );
        process.env.HOME = home;
        delete process.env.EHMPATH_BEAVER_GITHUB_TOKEN;
        if (input.ghTokenEnv !== undefined)
          process.env.GH_TOKEN = input.ghTokenEnv;
        process.argv = [
          'node',
          '--via',
          'gh.issues',
          '--from',
          'test-owner/example',
          '--list',
          ...(input.auth === null ? [] : ['--auth', input.auth]),
        ];
        try {
          const error = await getError(cliRadioTaskPull());
          return { error, ghTokensSeen: scene.getGhTokensSeen() };
        } finally {
          process.argv = argvBefore;
          process.env.HOME = homeBefore;
          if (ghTokenEnvBefore === undefined) delete process.env.GH_TOKEN;
          if (ghTokenEnvBefore !== undefined)
            process.env.GH_TOKEN = ghTokenEnvBefore;
          if (tokenEnvBefore !== undefined)
            process.env.EHMPATH_BEAVER_GITHUB_TOKEN = tokenEnvBefore;
          await fs.rm(home, { recursive: true, force: true });
        }
      },
    );

  given(
    "[case10] --auth as-ehmpath on bert's laptop: keyrack holds none, the email is human",
    () => {
      when('[t0] the pull skill lists against a stub gh with a login', () => {
        const result = useThen('the pull runs', async () =>
          runPullMissOnBox({
            slug: 'case10',
            email: 'bert@example.com',
            auth: 'as-ehmpath',
          }),
        );
        then('the pull fails loud; no issue call reached gh', () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.ghTokensSeen).toEqual([]);
          expect(result.error.message).not.toContain(STUB_GH_TOKEN);
        });
        then('the miss names both spots, in walk order, and the fix', () => {
          expect(result.error.message).toContain('found no ehmpath token');
          expect(result.error.message).toContain('keyrack: not granted');
          expect(result.error.message).toContain(
            'ambient: git config user.email = bert@example.com, not an ehmpath email',
          );
          expect(
            result.error.message.indexOf('keyrack: not granted'),
          ).toBeLessThan(result.error.message.indexOf('ambient: git config'));
          expect(result.error.message).toContain('--auth as-human');
        });
        then('the message matches the snapshot', () => {
          expect(result.error.message).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case11] --auth as-ehmpath-via-keyrack on an ehmpath box: keyrack holds none, gh is logged in',
    () => {
      when('[t0] the pull skill lists against a stub gh with a login', () => {
        const result = useThen('the pull runs', async () =>
          runPullMissOnBox({
            slug: 'case11',
            email: 'seaturtle@ehmpath.com',
            auth: 'as-ehmpath-via-keyrack',
          }),
        );
        then('the pull fails loud; the gh login never pays', () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.ghTokensSeen).toEqual([]);
          expect(result.error.message).not.toContain(STUB_GH_TOKEN);
        });
        then('the miss names keyrack alone, never the ambient spot', () => {
          expect(result.error.message).toContain('keyrack');
          expect(result.error.message).not.toContain('ambient: git config');
        });
        then('the message matches the snapshot', () => {
          expect(result.error.message).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case12] --auth as-ehmpath-via-ambient on a human box with a gh login',
    () => {
      when('[t0] the pull skill lists against a stub gh with a login', () => {
        const result = useThen('the pull runs', async () =>
          runPullMissOnBox({
            slug: 'case12',
            email: 'bert@example.com',
            auth: 'as-ehmpath-via-ambient',
          }),
        );
        then(
          'the pull fails loud; the human login never pays as the robot',
          () => {
            expect(result.error).toBeInstanceOf(ConstraintError);
            expect(result.ghTokensSeen).toEqual([]);
            expect(result.error.message).not.toContain(STUB_GH_TOKEN);
          },
        );
        then('the miss names the human email, and never keyrack', () => {
          expect(result.error.message).toContain(
            'ambient: git config user.email = bert@example.com, not an ehmpath email',
          );
          expect(result.error.message).not.toContain('keyrack:');
        });
        then('the message matches the snapshot', () => {
          expect(result.error.message).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case13] --auth as-ehmpath-via-ambient on an ehmpath box whose gh holds no login',
    () => {
      when('[t0] the pull skill lists against a stub gh with no login', () => {
        const result = useThen('the pull runs', async () =>
          runPullMissOnBox({
            slug: 'case13',
            email: 'seaturtle@ehmpath.com',
            auth: 'as-ehmpath-via-ambient',
            ghLogin: 'none',
          }),
        );
        then('the pull fails loud; no issue call reached gh', () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.ghTokensSeen).toEqual([]);
        });
        then(
          'the miss names the ambient row and gh auth login, never keyrack',
          () => {
            expect(result.error.message).toContain(
              'ambient: ehmpath email, but gh holds no login',
            );
            expect(result.error.message).toContain('gh auth login');
            expect(result.error.message).not.toContain('keyrack:');
          },
        );
        then('the message matches the snapshot', () => {
          expect(result.error.message).toMatchSnapshot();
        });
      });
    },
  );

  // a fake keyrack token: never a real one, and distinct from the stub gh login token.
  // shaped as an app install token (ghs_), the one github shape the keyrack env firewall
  // admits; a ghp_ value is refused there as a long-lived pat (status: blocked)
  const TOKEN_KEYRACK_FAKE = 'ghs_fake_pull_from_keyrack_passthrough';

  given(
    '[case14] --auth as-ehmpath on a robot box: keyrack grants, gh holds no login',
    () => {
      when('[t0] the pull skill lists against a stub gh', () => {
        const result = useThen('the pull runs', async () =>
          runListViaGhOnBox({
            slug: 'pull-case14',
            email: 'bert@example.com',
            authArgs: ['--auth', 'as-ehmpath'],
            ghLogin: 'none',
            keyrackEnv: TOKEN_KEYRACK_FAKE,
          }),
        );
        then('the keyrack token is the one that reached gh', () => {
          expect(result.ghTokensSeen.length).toBeGreaterThan(0);
          expect(new Set(result.ghTokensSeen)).toEqual(
            new Set([TOKEN_KEYRACK_FAKE]),
          );
        });
        then('the output names the spot that paid, never the token', () => {
          expect(result.stdout).toContain('as-ehmpath (via keyrack)');
          expect(result.stdout).not.toContain(TOKEN_KEYRACK_FAKE);
        });
        then('the output matches the snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case15] --auth as-ehmpath-via-keyrack: keyrack grants, gh holds a login it never uses',
    () => {
      when('[t0] the pull skill lists against a stub gh', () => {
        const result = useThen('the pull runs', async () =>
          runListViaGhOnBox({
            slug: 'pull-case15',
            email: 'seaturtle@ehmpath.com',
            authArgs: ['--auth', 'as-ehmpath-via-keyrack'],
            keyrackEnv: TOKEN_KEYRACK_FAKE,
          }),
        );
        then('the keyrack token reached gh; the gh login never paid', () => {
          expect(result.ghTokensSeen.length).toBeGreaterThan(0);
          expect(new Set(result.ghTokensSeen)).toEqual(
            new Set([TOKEN_KEYRACK_FAKE]),
          );
        });
        then('the output never prints the token', () => {
          expect(result.stdout).not.toContain(TOKEN_KEYRACK_FAKE);
        });
        then('the output matches the snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case16] no --auth on a human box whose gh auth is an env GH_TOKEN alone',
    () => {
      when('[t0] the pull skill lists against a stub gh with no login', () => {
        const result = useThen('the pull runs', async () =>
          runPullMissOnBox({
            slug: 'case16',
            email: 'bert@example.com',
            auth: null,
            ghLogin: 'none',
            ghTokenEnv: 'gho_fake_pull_env_token',
          }),
        );
        then('the pull fails loud; no issue call reached gh', () => {
          expect(result.error).toBeInstanceOf(ConstraintError);
          expect(result.ghTokensSeen).toEqual([]);
        });
        then(
          'the miss names the env token it cannot use, and the value that sends it',
          () => {
            expect(result.error.message).toContain(
              'an as-human send never uses the env GH_TOKEN',
            );
            expect(result.error.message).toContain('as-robot:env(GH_TOKEN)');
            expect(result.error.message).not.toContain(
              'gho_fake_pull_env_token',
            );
          },
        );
        then('the message matches the snapshot', () => {
          expect(result.error.message).toMatchSnapshot();
        });
      });
    },
  );

  // .note = the via-keyrack keyrack-failure guidance (the wish's primary
  //   behavior) is authoritatively snapshotted at the layer that produces it —
  //   the message shape lives in getKeyrackAuthFailureMessage.test (unit: locked,
  //   absent, blocked variants, each with a --auth as-human + rhx keyrack set
  //   assertion + snapshot); the throw contract lives in genAuthFromKeyrack.test
  //   case4 (absent) + case5 (blocked), which assert a ConstraintError with that
  //   message + metadata; and genAuthFromKeyrack.integration exercises the real
  //   absent path via a bogus key name. getGithubTokenByAuthArg's via-keyrack
  //   branch forwards that ConstraintError verbatim (no transform), so the CLI
  //   output is byte-identical to those locks. a CLI-level absent case is not
  //   deterministic: the CLI hardcodes a *present* key (EHMPATH_BEAVER_GITHUB_TOKEN,
  //   env prep), so via-keyrack(ehmpath) grants successfully, and a bogus owner
  //   yields a host-manifest MalfunctionError rather than the clean absent path.
});
