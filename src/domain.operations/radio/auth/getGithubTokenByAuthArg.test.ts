import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { getGithubTokenByAuthArg } from './getGithubTokenByAuthArg';

// mock the keyrack module
jest.mock('./genAuthFromKeyrack', () => ({
  genAuthFromKeyrack: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { genAuthFromKeyrack } = require('./genAuthFromKeyrack');

/**
 * .what = mock shx that returns specified output
 * .why = enables unit test without real shell execution
 */
const mockShx =
  (stdout: string, stderr = '') =>
  async () => ({ stdout, stderr });

/**
 * .what = mock shx that throws
 * .why = enables test of error scenarios
 */
const mockShxError = (error: Error) => async () => {
  throw error;
};

describe('getGithubTokenByAuthArg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  given('[case1] --auth as-robot:env(ENV_VAR)', () => {
    when('[t0] env var is set', () => {
      then('returns token from env var', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:env(MY_TOKEN)' },
          { env: { MY_TOKEN: 'secret-token-123' }, shx: mockShx('') },
        );
        expect(result.token).toBe('secret-token-123');
        expect(result.role).toBe('as-robot');
      });
    });

    when('[t1] env var is not set', () => {
      then('throws ConstraintError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:env(MY_TOKEN)' },
            { env: {}, shx: mockShx('') },
          ),
        ).rejects.toThrow(ConstraintError);
      });

      then('error message mentions the env var name', async () => {
        try {
          await getGithubTokenByAuthArg(
            { auth: 'as-robot:env(MY_TOKEN)' },
            { env: {}, shx: mockShx('') },
          );
          fail('expected error');
        } catch (error) {
          expect((error as Error).message).toContain('MY_TOKEN');
          expect((error as Error).message).toContain('not set');
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });
  });

  given('[case2] --auth as-robot:shx(command)', () => {
    when('[t0] shell command succeeds with output', () => {
      then('returns token from command output', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:shx(echo secret-from-shell)' },
          { env: {}, shx: mockShx('secret-from-shell\n') },
        );
        expect(result.token).toBe('secret-from-shell');
        expect(result.role).toBe('as-robot');
      });
    });

    when('[t1] shell command produces empty output', () => {
      then('throws ConstraintError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:shx(echo)' },
            { env: {}, shx: mockShx('', 'some stderr') },
          ),
        ).rejects.toThrow(ConstraintError);
      });

      then('error message includes stderr', async () => {
        try {
          await getGithubTokenByAuthArg(
            { auth: 'as-robot:shx(bad-command)' },
            { env: {}, shx: mockShx('', 'command not found') },
          );
          fail('expected error');
        } catch (error) {
          expect((error as Error).message).toContain('no output');
          expect((error as Error).message).toContain('command not found');
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });

    when('[t2] shell command throws', () => {
      then(
        'wraps the failure in a ConstraintError with command + cause',
        async () => {
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: 'as-robot:shx(bad-command)' },
              { env: {}, shx: mockShxError(new Error('exec failed')) },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          // the wrapped message names the failure, not a bare bubble
          expect(error.message).toContain('command failed');
          expect(error.message).toContain('exec failed');
          // the failed command + a hint are forwarded for the caller to act on
          expect(error.message).toContain('bad-command');
          expect(error.message).toContain('check the command runs');
          expect(error.message).toMatchSnapshot();
        },
      );
    });

    when('[t3] complex command with pipes', () => {
      then('parses the full command inside parentheses', async () => {
        const complexCommand = 'op item get token | jq -r .value';
        const result = await getGithubTokenByAuthArg(
          { auth: `as-robot:shx(${complexCommand})` },
          { env: {}, shx: mockShx('piped-token') },
        );
        expect(result.token).toBe('piped-token');
      });
    });
  });

  given('[case3] --auth as-robot:via-keyrack(owner)', () => {
    when('[t0] keyrack succeeds', () => {
      then('returns token from keyrack with specified owner', async () => {
        genAuthFromKeyrack.mockResolvedValue({ token: 'custom-owner-token' });

        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:via-keyrack(myorg)' },
          { env: {}, shx: mockShx('') },
        );
        expect(result.token).toBe('custom-owner-token');
        expect(result.role).toBe('as-robot');
        expect(genAuthFromKeyrack).toHaveBeenCalledWith(
          {
            owner: 'myorg',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          { shx: expect.any(Function) },
        );
      });
    });

    when('[t1] keyrack fails', () => {
      then('propagates the keyrack error', async () => {
        genAuthFromKeyrack.mockRejectedValue(
          new Error('keyrack: vault locked'),
        );

        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:via-keyrack(someowner)' },
            { env: {}, shx: mockShx('') },
          ),
        ).rejects.toThrow('keyrack: vault locked');
      });
    });
  });

  given('[case4] default via-keyrack(ehmpath) when no --auth', () => {
    when('[t0] keyrack succeeds', () => {
      then('returns token from keyrack', async () => {
        genAuthFromKeyrack.mockResolvedValue({ token: 'keyrack-token-123' });

        const result = await getGithubTokenByAuthArg(
          { auth: null },
          { env: {}, shx: mockShx('') },
        );
        expect(result.token).toBe('keyrack-token-123');
        expect(result.role).toBe('as-robot');
        expect(genAuthFromKeyrack).toHaveBeenCalledWith(
          {
            owner: 'ehmpath',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          { shx: expect.any(Function) },
        );
      });
    });

    when('[t1] keyrack fails', () => {
      then('propagates the keyrack error', async () => {
        genAuthFromKeyrack.mockRejectedValue(
          new Error('keyrack: credential not found'),
        );

        await expect(
          getGithubTokenByAuthArg(
            { auth: null },
            { env: {}, shx: mockShx('') },
          ),
        ).rejects.toThrow('keyrack: credential not found');
      });
    });

    when('[t2] explicit --auth overrides default', () => {
      then('uses explicit auth mode', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:env(CUSTOM_TOKEN)' },
          { env: { CUSTOM_TOKEN: 'custom-token' }, shx: mockShx('') },
        );
        expect(result.token).toBe('custom-token');
        expect(result.role).toBe('as-robot');
        expect(genAuthFromKeyrack).not.toHaveBeenCalled();
      });
    });
  });

  given('[case5] --auth as-human', () => {
    when('[t0] as-human in non-test env', () => {
      then('returns null token with as-human method', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-human' },
          { env: {}, shx: mockShx('') },
        );
        expect(result.token).toBeNull();
        expect(result.role).toBe('as-human');
      });
    });

    when('[t1] as-human with GITHUB_TOKEN also set in non-test env', () => {
      then('as-human takes precedence (explicit intent)', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-human' },
          { env: { GITHUB_TOKEN: 'env-token' }, shx: mockShx('') },
        );
        expect(result.token).toBeNull();
        expect(result.role).toBe('as-human');
      });
    });

    when('[t2] as-human in test env (NODE_ENV=test)', () => {
      then('throws ConstraintError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-human' },
            { env: { NODE_ENV: 'test' }, shx: mockShx('') },
          ),
        ).rejects.toThrow(ConstraintError);
      });

      then('error message suggests as-robot:env and as-robot:shx', async () => {
        try {
          await getGithubTokenByAuthArg(
            { auth: 'as-human' },
            { env: { NODE_ENV: 'test' }, shx: mockShx('') },
          );
          fail('expected error');
        } catch (error) {
          expect((error as Error).message).toContain('forbidden in test');
          expect((error as Error).message).toContain('as-robot:env');
          expect((error as Error).message).toContain('as-robot:shx');
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });

    when('[t3] as-human in test env (JEST_WORKER_ID set)', () => {
      then('throws ConstraintError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-human' },
            { env: { JEST_WORKER_ID: '1' }, shx: mockShx('') },
          ),
        ).rejects.toThrow(ConstraintError);
      });
    });
  });

  given('[case6] unrecognized auth mode', () => {
    when('[t0] --auth with invalid mode', () => {
      then('throws ConstraintError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'invalid-mode' },
            { env: {}, shx: mockShx('') },
          ),
        ).rejects.toThrow(ConstraintError);
      });

      then('error message lists supported modes', async () => {
        try {
          await getGithubTokenByAuthArg(
            { auth: 'some-unknown-mode' },
            { env: {}, shx: mockShx('') },
          );
          fail('expected error');
        } catch (error) {
          expect((error as Error).message).toContain(
            'unrecognized --auth mode',
          );
          expect((error as Error).message).toContain('as-human');
          expect((error as Error).message).toContain('as-robot:env');
          expect((error as Error).message).toContain('as-robot:shx');
          expect((error as Error).message).toContain('as-robot:via-keyrack');
          expect((error as Error).message).toMatchSnapshot();
        }
      });
    });
  });
});
