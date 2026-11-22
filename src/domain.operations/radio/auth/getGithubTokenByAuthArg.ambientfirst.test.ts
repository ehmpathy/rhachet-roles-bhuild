import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

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

  // a value of { exit: N } stands in for a command that ran and exited N
  const genFakeShx = (input: {
    answers: Record<string, string | { exit: number }>;
  }) => {
    const calls: string[] = [];
    const shx = async (command: string) => {
      calls.push(command);
      const answer = Object.entries(input.answers).find(([prefix]) =>
        command.startsWith(prefix),
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

  given('[case1] an ehmpath email with a gh login', () => {
    when('[t0] a send names no --auth', () => {
      then('the gh login pays, unasked; keyrack is never read', async () => {
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
          ehmpathSpot: 'ambient',
        });
        expect(keyrackGet).not.toHaveBeenCalled();
      });
    });
  });

  given('[case2] a human email', () => {
    when('[t0] a send names no --auth', () => {
      then('it sends as-human; the gh token is never read', async () => {
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
          ehmpathSpot: null,
        });
        expect(fake.calls).toEqual(['git config user.email']);
        expect(keyrackGet).not.toHaveBeenCalled();
      });
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
          ehmpathSpot: 'keyrack',
        });
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
            ehmpathSpot: null,
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
            ehmpathSpot: null,
          });
          expect(fake.calls).toEqual([]);
        },
      );
    });
  });
});
