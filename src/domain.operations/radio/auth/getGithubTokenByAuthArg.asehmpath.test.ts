import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { AMBIENT_READ_GH_LOGIN } from './AMBIENT_READ_GH_LOGIN';
import { getGithubTokenByAuthArg } from './getGithubTokenByAuthArg';

/**
 * .what = unit tests for the as-ehmpath values of getGithubTokenByAuthArg
 * .why  = as-ehmpath sends as the robot from keyrack, then from the box's own gh login,
 *         but only on a box whose git config user.email is an ehmpath one; a miss names
 *         each spot checked. these grade every branch of that contract
 *
 * .grain = UNIT. no shell ever runs: a fake shx answers `git config user.email` and
 *          `gh auth token` from a table, and a fake keyrackGet arrives through the context
 *          seam (rule.forbid.unit.remote-boundaries). no test here can reach a real gh
 */
describe('getGithubTokenByAuthArg.asehmpath', () => {
  const EMAIL_EHMPATH = 'seaturtle@ehmpath.com';
  const EMAIL_HUMAN = 'bert@example.com';
  const TOKEN_KEYRACK = 'ghp_fake_from_keyrack';
  const TOKEN_AMBIENT = 'gho_fake_from_gh_login';

  /**
   * .what = a fake shx that answers each command from a table, and records each call
   * .why  = a value of { exit: N } stands in for a command that ran and exited N
   * .note = each key matches the start of a command; the 'gh auth token' key stands for the
   *         exact read the code must run (env tokens stripped), so a read that skips the strip
   *         meets no answer
   */
  const genFakeShx = (input: {
    answers: Record<string, string | { exit: number }>;
  }) => {
    const calls: string[] = [];
    const shx = async (command: string) => {
      calls.push(command);
      const answer = Object.entries(input.answers).find(([key]) =>
        command.startsWith(
          key === 'gh auth token' ? AMBIENT_READ_GH_LOGIN : key,
        ),
      )?.[1];
      if (answer === undefined) return { stdout: '', stderr: '' };
      if (typeof answer === 'string') return { stdout: answer, stderr: '' };
      throw Object.assign(new Error(`Command failed: ${command}`), {
        code: answer.exit,
      });
    };
    return { shx, calls };
  };

  /**
   * .what = a fake keyrack.get that reports one status (granted carries the token)
   * .note = jest.fn() because keyrack.get's return type is conditional on its input;
   *         a plain fake cannot fit it without an `as` cast. delivered by injection
   */
  const genFakeKeyrackGet = (input: { status: string }) => {
    const fake = jest.fn();
    fake.mockResolvedValue({
      attempt:
        input.status === 'granted'
          ? { status: 'granted', grant: { key: { secret: TOKEN_KEYRACK } } }
          : {
              status: input.status,
              slug: 'ehmpath.prep.EHMPATH_BEAVER_GITHUB_TOKEN',
            },
      emit: { stdout: `${input.status}` },
    });
    return fake;
  };

  // stub-declared env: the ambient guard admits the fake shx
  const envStubbed = { RADIO_GH_STUB: '1' };

  // capture any console line; the derive returns its spot and prints naught, so a
  // stray line here is a presentation leak back into the domain
  const runWithLogs = async <T>(
    run: () => Promise<T>,
  ): Promise<{ result: T; logs: string[] }> => {
    const logs: string[] = [];
    const spy = jest
      .spyOn(console, 'log')
      .mockImplementation((...args: unknown[]) => {
        logs.push(args.map((a) => String(a)).join(' '));
      });
    try {
      return { result: await run(), logs };
    } finally {
      spy.mockRestore();
    }
  };

  given('[case1] as-ehmpath, keyrack granted', () => {
    when('[t0] the derive runs', () => {
      then(
        'keyrack pays, ambient is never read, the spot returned is keyrack',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': TOKEN_AMBIENT,
            },
          });
          const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
          const { result, logs } = await runWithLogs(() =>
            getGithubTokenByAuthArg(
              { auth: 'as-ehmpath' },
              { env: envStubbed, shx: fake.shx, keyrackGet },
            ),
          );
          // the slug is pinned to the ehmpathy org, never read from the cwd repo
          expect(keyrackGet).toHaveBeenCalledWith(
            expect.objectContaining({
              for: { key: 'EHMPATH_BEAVER_GITHUB_TOKEN' },
              org: 'ehmpathy',
            }),
          );
          expect(result).toEqual({
            token: TOKEN_KEYRACK,
            role: 'as-robot',
            authSource: { auth: 'as-ehmpath', spot: 'keyrack' },
          });
          expect(fake.calls).toEqual([]);
          expect(logs).toEqual([]);
        },
      );
    });
  });

  given(
    '[case2] as-ehmpath, keyrack locked, ambient email ehmpath, gh logged in',
    () => {
      when('[t0] the derive runs', () => {
        then(
          'the gh login pays, and the spot returned is ambient',
          async () => {
            const fake = genFakeShx({
              answers: {
                'git config user.email': `${EMAIL_EHMPATH}\n`,
                'gh auth token': `${TOKEN_AMBIENT}\n`,
              },
            });
            const { result, logs } = await runWithLogs(() =>
              getGithubTokenByAuthArg(
                { auth: 'as-ehmpath' },
                {
                  env: envStubbed,
                  shx: fake.shx,
                  keyrackGet: genFakeKeyrackGet({ status: 'locked' }),
                },
              ),
            );
            expect(result).toEqual({
              token: TOKEN_AMBIENT,
              role: 'as-robot',
              authSource: { auth: 'as-ehmpath', spot: 'ambient' },
            });
            // the extant keyrack nudge may print its unlock note; no auth line does
            expect(logs.filter((line) => line.includes('as-ehmpath'))).toEqual(
              [],
            );
          },
        );
      });
    },
  );

  given(
    '[case3] as-ehmpath, keyrack locked, ambient email is a human one',
    () => {
      when('[t0] the derive runs', () => {
        then(
          'refuses, names both spots and the fixes, never reads gh',
          async () => {
            const fake = genFakeShx({
              answers: {
                'git config user.email': EMAIL_HUMAN,
                'gh auth token': TOKEN_AMBIENT,
              },
            });
            const error = await getError(
              getGithubTokenByAuthArg(
                { auth: 'as-ehmpath' },
                {
                  env: envStubbed,
                  shx: fake.shx,
                  keyrackGet: genFakeKeyrackGet({ status: 'locked' }),
                },
              ),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain(
              'keyrack: not granted (status: locked)',
            );
            expect(error.message).toContain(
              `ambient: git config user.email = ${EMAIL_HUMAN}, not an ehmpath email`,
            );
            expect(error.message).toContain('rhx keyrack unlock');
            expect(error.message).toContain('--auth as-human');
            expect(fake.calls).not.toContain(AMBIENT_READ_GH_LOGIN);
            expect(error.message).toMatchSnapshot();
          },
        );
      });

      when('[t1] the keyrack auto-unlock command itself exits non-zero', () => {
        then(
          'the miss keeps the raw unlock cause, as the extant keyrack nudge does',
          async () => {
            const fake = genFakeShx({
              answers: {
                'rhx keyrack unlock': { exit: 127 },
                'git config user.email': EMAIL_HUMAN,
              },
            });
            const error = await getError(
              getGithubTokenByAuthArg(
                { auth: 'as-ehmpath' },
                {
                  env: envStubbed,
                  shx: fake.shx,
                  keyrackGet: genFakeKeyrackGet({ status: 'locked' }),
                },
              ),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain(
              'keyrack: not granted (status: locked)',
            );
            expect(error.message).toContain('"unlockFailure"');
            expect(error.message).toContain('rhx keyrack unlock');
            expect(error.message).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case4] as-ehmpath, keyrack absent, git config user.email unset',
    () => {
      when('[t0] the derive runs', () => {
        then(
          'refuses, and names the unset email and the keyrack-set fix',
          async () => {
            const fake = genFakeShx({
              answers: { 'git config user.email': { exit: 1 } },
            });
            const error = await getError(
              getGithubTokenByAuthArg(
                { auth: 'as-ehmpath' },
                {
                  env: envStubbed,
                  shx: fake.shx,
                  keyrackGet: genFakeKeyrackGet({ status: 'absent' }),
                },
              ),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain(
              'keyrack: not granted (status: absent)',
            );
            expect(error.message).toContain(
              'ambient: git config user.email unset',
            );
            expect(error.message).toContain('rhx keyrack set');
            expect(error.message).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[case5] as-ehmpath, keyrack locked, ambient email ehmpath, gh holds no login',
    () => {
      when('[t0] the derive runs', () => {
        then('refuses, and names gh auth login as a fix', async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': { exit: 1 },
            },
          });
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: 'as-ehmpath' },
              {
                env: envStubbed,
                shx: fake.shx,
                keyrackGet: genFakeKeyrackGet({ status: 'locked' }),
              },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            'ambient: ehmpath email, but gh holds no login',
          );
          expect(error.message).toContain('gh auth login');
          expect(error.message).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case6] as-ehmpath-via-keyrack, keyrack locked, ambient would pay',
    () => {
      when('[t0] the derive runs', () => {
        then(
          'refuses with the keyrack row alone; ambient is never read',
          async () => {
            const fake = genFakeShx({
              answers: {
                'git config user.email': EMAIL_EHMPATH,
                'gh auth token': TOKEN_AMBIENT,
              },
            });
            const error = await getError(
              getGithubTokenByAuthArg(
                { auth: 'as-ehmpath-via-keyrack' },
                {
                  env: envStubbed,
                  shx: fake.shx,
                  keyrackGet: genFakeKeyrackGet({ status: 'locked' }),
                },
              ),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain(
              'keyrack: not granted (status: locked)',
            );
            expect(error.message).not.toContain('ambient:');
            expect(fake.calls).not.toContain('git config user.email');
            expect(fake.calls).not.toContain(AMBIENT_READ_GH_LOGIN);
            expect(error.message).toMatchSnapshot();
          },
        );
      });
      when('[t1] keyrack is granted', () => {
        then('keyrack pays, and the keyrack spot is returned', async () => {
          const fake = genFakeShx({ answers: {} });
          const { result, logs } = await runWithLogs(() =>
            getGithubTokenByAuthArg(
              { auth: 'as-ehmpath-via-keyrack' },
              {
                env: envStubbed,
                shx: fake.shx,
                keyrackGet: genFakeKeyrackGet({ status: 'granted' }),
              },
            ),
          );
          expect(result).toEqual({
            token: TOKEN_KEYRACK,
            role: 'as-robot',
            authSource: { auth: 'as-ehmpath', spot: 'keyrack' },
          });
          expect(logs).toEqual([]);
        });
      });
    },
  );

  given('[case7] as-ehmpath-via-ambient', () => {
    when('[t0] the ambient email is ehmpath and gh is logged in', () => {
      then(
        'the gh login pays; keyrack is never read; the ambient spot is returned',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': TOKEN_AMBIENT,
            },
          });
          const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
          const { result, logs } = await runWithLogs(() =>
            getGithubTokenByAuthArg(
              { auth: 'as-ehmpath-via-ambient' },
              { env: envStubbed, shx: fake.shx, keyrackGet },
            ),
          );
          expect(result).toEqual({
            token: TOKEN_AMBIENT,
            role: 'as-robot',
            authSource: { auth: 'as-ehmpath', spot: 'ambient' },
          });
          expect(keyrackGet).not.toHaveBeenCalled();
          expect(logs).toEqual([]);
        },
      );
    });
    when('[t1] the ambient email is a human one', () => {
      then('refuses with the ambient row alone; gh is never read', async () => {
        const fake = genFakeShx({
          answers: {
            'git config user.email': EMAIL_HUMAN,
            'gh auth token': TOKEN_AMBIENT,
          },
        });
        const error = await getError(
          getGithubTokenByAuthArg(
            { auth: 'as-ehmpath-via-ambient' },
            {
              env: envStubbed,
              shx: fake.shx,
              keyrackGet: genFakeKeyrackGet({ status: 'granted' }),
            },
          ),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).not.toContain('keyrack:');
        expect(error.message).toContain('not an ehmpath email');
        expect(fake.calls).not.toContain(AMBIENT_READ_GH_LOGIN);
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case8] a test env that declared no stub gh', () => {
    when('[t0] the ambient path is reached', () => {
      then('refuses before any shell runs', async () => {
        const fake = genFakeShx({
          answers: { 'git config user.email': EMAIL_EHMPATH },
        });
        const error = await getError(
          getGithubTokenByAuthArg(
            { auth: 'as-ehmpath-via-ambient' },
            { env: { NODE_ENV: 'test' }, shx: fake.shx },
          ),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('RADIO_GH_STUB=1');
        expect(fake.calls).toEqual([]);
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case9] the git config read is killed, with no exit code', () => {
    when('[t0] the ambient path is reached', () => {
      then(
        'a constraint carries the kill and names the fix; it is never read as "unset"',
        async () => {
          const shx = async () => {
            throw Object.assign(new Error('killed'), {
              code: null,
              killed: true,
            });
          };
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: 'as-ehmpath-via-ambient' },
              { env: envStubbed, shx },
            ),
          );

          // a box fault is the ambient spot's miss, named with the kill and its fix; a ConstraintError the drain holds
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('git config user.email');
          expect(error.message).toContain('killed');
          expect(error.message).toContain('--auth as-ehmpath-via-keyrack');
          expect(error.message).not.toContain('not an ehmpath email');
          expect(error.message).not.toContain('user.email unset');
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case10] an ambient read exits with a code other than "none"', () => {
    const EXIT_CASES: {
      label: string;
      answers: Record<string, string | { exit: number }>;
    }[] = [
      {
        label: '[t0] git config exits 3, an invalid config file',
        answers: { 'git config user.email': { exit: 3 } },
      },
      {
        label: '[t1] gh exits 127, gh not installed',
        answers: {
          'git config user.email': EMAIL_EHMPATH,
          'gh auth token': { exit: 127 },
        },
      },
    ];
    EXIT_CASES.map((thisCase) =>
      when(thisCase.label, () => {
        then(
          'a constraint names the command and the fix; it is never read as "unset" or "no login"',
          async () => {
            const fake = genFakeShx({ answers: thisCase.answers });
            const error = await getError(
              getGithubTokenByAuthArg(
                { auth: 'as-ehmpath-via-ambient' },
                { env: envStubbed, shx: fake.shx },
              ),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain('the ambient read');
            expect(error.message).toContain('Command failed');
            expect(error.message).not.toContain('gh holds no login');
            expect(error.message).not.toContain('not an ehmpath email');
            expect(error.message).not.toContain('user.email unset');
            expect(error.message).toMatchSnapshot();
          },
        );
      }),
    );
  });

  given('[case11] the keyrack sdk itself faults, rather than refuse', () => {
    when('[t0] as-ehmpath reaches keyrack', () => {
      then(
        'the fault rethrows; it is never a miss, and ambient is never read',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': TOKEN_AMBIENT,
            },
          });
          const keyrackGet = jest.fn();
          keyrackGet.mockRejectedValue(new Error('vault socket closed'));
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: 'as-ehmpath' },
              { env: envStubbed, shx: fake.shx, keyrackGet },
            ),
          );
          expect(error.message).toEqual('vault socket closed');
          expect(error).not.toBeInstanceOf(ConstraintError);
          expect(fake.calls).toEqual([]);
        },
      );
    });
  });
});
