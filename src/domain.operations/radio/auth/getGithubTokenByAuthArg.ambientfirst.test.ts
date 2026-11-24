import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { AMBIENT_READ_GH_LOGIN } from './AMBIENT_READ_GH_LOGIN';
import { AmbientReadFaultError } from './AmbientReadFaultError';
import { getGithubTokenByAuthArg } from './getGithubTokenByAuthArg';

/**
 * .what = unit tests for the no---auth default of getGithubTokenByAuthArg: ambient-first
 * .why  = an ehmpath box must send with its gh login unasked; a human's box must send as-human;
 *         a box with no git email, and any test env with no stub gh, keep the keyrack default
 *
 * .grain = UNIT. a fake shx answers `git config user.email` and `gh auth token` from a table, and
 *          a fake keyrackGet arrives through the context seam. no shell runs; no real gh is reached
 */
describe('getGithubTokenByAuthArg.ambientfirst', () => {
  const EMAIL_EHMPATH = 'seaturtle@ehmpath.com';
  const EMAIL_HUMAN = 'bert@example.com';
  const TOKEN_KEYRACK = 'ghp_fake_from_keyrack';
  const TOKEN_AMBIENT = 'gho_fake_from_gh_login';

  // a value of { exit: N } stands in for a command that ran and exited N. each key matches the
  // start of a command; the 'gh auth token' key stands for the exact read the code must run
  // (env tokens stripped), so a read that skips the strip meets no answer
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

  // a fake keyrack.get that reports one status (granted carries the token)
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

  given(
    '[case1] an ehmpath email with a gh login, and keyrack granted too',
    () => {
      when('[t0] a send names no --auth', () => {
        then(
          'the gh login beats the granted keyrack token, unasked; keyrack is never read',
          async () => {
            const fake = genFakeShx({
              answers: {
                'git config user.email': EMAIL_EHMPATH,
                'gh auth token': `${TOKEN_AMBIENT}\n`,
              },
            });
            const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
            const result = await getGithubTokenByAuthArg(
              { auth: null },
              { env: envStubbed, shx: fake.shx, keyrackGet },
            );
            expect(result).toEqual({
              token: TOKEN_AMBIENT,
              role: 'as-robot',
              authSource: { auth: 'as-ehmpath', spot: 'ambient' },
            });
            expect(keyrackGet).not.toHaveBeenCalled();
          },
        );
      });
    },
  );

  given('[case2] a human email', () => {
    when('[t0] a send names no --auth, and gh holds a login', () => {
      then(
        'it sends as-human, and names the ambient email as its source; the token is checked, never kept',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_HUMAN,
              'gh auth token': TOKEN_AMBIENT,
            },
          });
          const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
          const result = await getGithubTokenByAuthArg(
            { auth: null },
            { env: envStubbed, shx: fake.shx, keyrackGet },
          );
          expect(result).toEqual({
            token: null,
            role: 'as-human',
            authSource: {
              auth: 'as-human',
              spot: 'ambient',
              email: EMAIL_HUMAN,
            },
          });
          expect(fake.calls).toEqual([
            'git config user.email',
            AMBIENT_READ_GH_LOGIN,
          ]);
          expect(keyrackGet).not.toHaveBeenCalled();
        },
      );
    });

    when('[t1] a send names no --auth, and gh holds no login', () => {
      then(
        'it misses loud with the fix, before any send; keyrack is never read',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_HUMAN,
              'gh auth token': { exit: 1 },
            },
          });
          const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: null },
              { env: envStubbed, shx: fake.shx, keyrackGet },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('gh holds no login');
          expect(error.message).toContain(EMAIL_HUMAN);
          expect(String((error as ConstraintError).metadata?.hint)).toContain(
            'gh auth login',
          );
          expect(keyrackGet).not.toHaveBeenCalled();
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2b] a human email whose gh auth is an env token alone', () => {
    when(
      '[t0] a send names no --auth; GH_TOKEN is set, no stored login',
      () => {
        then(
          'the miss names the env token it cannot use, and the value that sends it',
          async () => {
            const fake = genFakeShx({
              answers: {
                'git config user.email': EMAIL_HUMAN,
                'gh auth token': { exit: 1 },
              },
            });
            const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
            const error = await getError(
              getGithubTokenByAuthArg(
                { auth: null },
                {
                  env: { ...envStubbed, GH_TOKEN: 'gho_fake_env_token' },
                  shx: fake.shx,
                  keyrackGet,
                },
              ),
            );
            expect(error).toBeInstanceOf(ConstraintError);
            expect(error.message).toContain(
              'an as-human send never uses the env GH_TOKEN',
            );
            expect(String((error as ConstraintError).metadata?.hint)).toContain(
              "--auth 'as-robot:env(GH_TOKEN)'",
            );
            expect(error.message).not.toContain('gho_fake_env_token');
            expect(keyrackGet).not.toHaveBeenCalled();
            expect(error.message).toMatchSnapshot();
          },
        );
      },
    );
  });

  given('[case2c] a human email, and the gh read faults', () => {
    when('[t0] gh exits 127, and keyrack holds the robot token', () => {
      then(
        'the send holds loud with the read, its exit, and its fix; it never falls to the robot',
        async () => {
          // a human box sends as-human or not at all: the fault leaves no robot spot to walk,
          // so it holds as a ConstraintError (a drain holds it), and keyrack is never read
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_HUMAN,
              'gh auth token': { exit: 127 },
            },
          });
          const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: null },
              { env: envStubbed, shx: fake.shx, keyrackGet },
            ),
          );
          expect(error).toBeInstanceOf(AmbientReadFaultError);
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('gh auth token` failed (exit 127)');
          expect(keyrackGet).not.toHaveBeenCalled();
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3] an ehmpath email with no gh login', () => {
    when('[t0] keyrack holds the robot token', () => {
      then('keyrack pays, and the spot names keyrack', async () => {
        const fake = genFakeShx({
          answers: {
            'git config user.email': EMAIL_EHMPATH,
            'gh auth token': { exit: 1 },
          },
        });
        const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
        const result = await getGithubTokenByAuthArg(
          { auth: null },
          { env: envStubbed, shx: fake.shx, keyrackGet },
        );
        expect(result).toEqual({
          token: TOKEN_KEYRACK,
          role: 'as-robot',
          authSource: { auth: 'as-ehmpath', spot: 'keyrack' },
        });

        // the default's keyrack slug follows the cwd repo, as before ambient-first (F12, F17):
        // no org reaches keyrack; only an explicit as-ehmpath* pins the ehmpathy org
        expect(keyrackGet).toHaveBeenCalledWith(
          expect.objectContaining({
            for: { key: 'EHMPATH_BEAVER_GITHUB_TOKEN' },
            org: undefined,
          }),
        );
      });
    });

    when('[t1] keyrack holds none either', () => {
      then(
        'the miss names the default and both spots, and the fixes',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': { exit: 1 },
            },
          });
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: null },
              {
                env: envStubbed,
                shx: fake.shx,
                keyrackGet: genFakeKeyrackGet({ status: 'absent' }),
              },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            'the default auth (no --auth) found no ehmpath token',
          );
          expect(error.message).toContain(
            'ambient: ehmpath email, but gh holds no login',
          );
          expect(error.message).toContain(
            'keyrack: not granted (status: absent)',
          );
          expect(error.message).toContain('--auth as-human');
          expect(error.message).toMatchSnapshot();
        },
      );
    });

    when('[t2] keyrack is locked and its auto-unlock fails', () => {
      then(
        'the miss keeps the raw unlock cause, as as-ehmpath does',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': { exit: 1 },
              'rhx keyrack unlock': { exit: 1 },
            },
          });
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: null },
              {
                env: envStubbed,
                shx: fake.shx,
                keyrackGet: genFakeKeyrackGet({ status: 'locked' }),
              },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          const metadata = (error as ConstraintError).metadata;
          expect(metadata?.auth).toEqual(null);
          expect(String(metadata?.unlockFailure)).toContain(
            'rhx keyrack unlock',
          );
        },
      );
    });
  });

  given('[case4] a box with no git email', () => {
    when('[t0] a send names no --auth', () => {
      then(
        'it keeps the keyrack default; its output names no spot',
        async () => {
          const fake = genFakeShx({
            answers: { 'git config user.email': { exit: 1 } },
          });
          const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
          const result = await getGithubTokenByAuthArg(
            { auth: null },
            { env: envStubbed, shx: fake.shx, keyrackGet },
          );
          expect(result).toEqual({
            token: TOKEN_KEYRACK,
            role: 'as-robot',
            authSource: null,
          });
          expect(fake.calls).toEqual(['git config user.email']);
        },
      );
    });
  });

  given('[case5] a test env that declared no stub gh', () => {
    when('[t0] a send names no --auth', () => {
      then(
        'ambient is never read; the keyrack default pays, as before',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': TOKEN_AMBIENT,
            },
          });
          const result = await getGithubTokenByAuthArg(
            { auth: null },
            {
              env: { JEST_WORKER_ID: '1' },
              shx: fake.shx,
              keyrackGet: genFakeKeyrackGet({ status: 'granted' }),
            },
          );
          expect(result).toEqual({
            token: TOKEN_KEYRACK,
            role: 'as-robot',
            authSource: null,
          });
          expect(fake.calls).toEqual([]);
        },
      );
    });
  });

  given('[case6] an ehmpath email, and the gh read faults', () => {
    when('[t0] gh exits 127, and keyrack holds the robot token', () => {
      then(
        'the walk goes on to keyrack, which pays; the fault never aborts the send',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': { exit: 127 },
            },
          });
          const result = await getGithubTokenByAuthArg(
            { auth: null },
            {
              env: envStubbed,
              shx: fake.shx,
              keyrackGet: genFakeKeyrackGet({ status: 'granted' }),
            },
          );
          expect(result).toEqual({
            token: TOKEN_KEYRACK,
            role: 'as-robot',
            authSource: { auth: 'as-ehmpath', spot: 'keyrack' },
          });
        },
      );
    });

    when('[t1] gh exits 127, and keyrack holds none', () => {
      then(
        'the miss names the gh fault with its exit, beside the keyrack row',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': { exit: 127 },
            },
          });
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: null },
              {
                env: envStubbed,
                shx: fake.shx,
                keyrackGet: genFakeKeyrackGet({ status: 'absent' }),
              },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('gh auth token` failed (exit 127)');
          expect(error.message).toContain(
            'keyrack: not granted (status: absent)',
          );
          expect(error.message).toMatchSnapshot();
        },
      );
    });
  });

  given('[case6b] the identity read itself faults', () => {
    when('[t0] git config exits 3, and keyrack holds the robot token', () => {
      then(
        'the send holds loud with the read and its fix; the box never guesses an identity',
        async () => {
          // the email decides which identity sends; a fault there leaves no identity to walk
          // spots for, so it holds as a ConstraintError (a drain holds it), never a robot guess
          const fake = genFakeShx({
            answers: { 'git config user.email': { exit: 3 } },
          });
          const keyrackGet = genFakeKeyrackGet({ status: 'granted' });
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: null },
              { env: envStubbed, shx: fake.shx, keyrackGet },
            ),
          );
          expect(error).toBeInstanceOf(AmbientReadFaultError);
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            '`git config user.email` failed (exit 3)',
          );
          expect(keyrackGet).not.toHaveBeenCalled();
        },
      );
    });
  });

  given('[case7] the gh read, on any ambient path', () => {
    when('[t0] the box is ehmpath and gh holds a login', () => {
      then(
        'the read strips GH_TOKEN and GITHUB_TOKEN, so only the stored login can answer',
        async () => {
          const fake = genFakeShx({
            answers: {
              'git config user.email': EMAIL_EHMPATH,
              'gh auth token': TOKEN_AMBIENT,
            },
          });
          await getGithubTokenByAuthArg(
            { auth: null },
            {
              env: envStubbed,
              shx: fake.shx,
              keyrackGet: genFakeKeyrackGet({ status: 'granted' }),
            },
          );
          const ghCall = fake.calls.find((call) =>
            call.includes('gh auth token'),
          );
          expect(ghCall).toContain('env -u GH_TOKEN -u GITHUB_TOKEN');
        },
      );
    });
  });

  given(
    '[case8] an ehmpath email, but gh holds a human login (a mislabeled box)',
    () => {
      when('[t0] a send names no --auth', () => {
        then(
          'it sends with that login, labeled as-ehmpath (via ambient): the email is the identity bar, and no read can check whose the login is',
          async () => {
            // the box declares ehmpath; gh answers a token whose owner no ambient read can name.
            // the label trusts the box's declaration (fulcrum F21). this pins that contract, so
            // a future owner check lands as a deliberate change, never a silent one
            const fake = genFakeShx({
              answers: {
                'git config user.email': EMAIL_EHMPATH,
                'gh auth token': 'gho_fake_token_of_a_human_login',
              },
            });
            const result = await getGithubTokenByAuthArg(
              { auth: null },
              {
                env: envStubbed,
                shx: fake.shx,
                keyrackGet: genFakeKeyrackGet({ status: 'granted' }),
              },
            );
            expect(result).toEqual({
              token: 'gho_fake_token_of_a_human_login',
              role: 'as-robot',
              authSource: { auth: 'as-ehmpath', spot: 'ambient' },
            });
          },
        );
      });
    },
  );
});
