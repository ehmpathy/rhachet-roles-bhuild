import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { getGithubTokenByAuthArg } from './getGithubTokenByAuthArg';

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
      then('throws BadRequestError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:env(MY_TOKEN)' },
            { env: {}, shx: mockShx('') },
          ),
        ).rejects.toThrow(BadRequestError);
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
      then('throws BadRequestError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:shx(echo)' },
            { env: {}, shx: mockShx('', 'some stderr') },
          ),
        ).rejects.toThrow(BadRequestError);
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
        }
      });
    });

    when('[t2] shell command throws', () => {
      then('propagates the error', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:shx(bad-command)' },
            { env: {}, shx: mockShxError(new Error('exec failed')) },
          ),
        ).rejects.toThrow('exec failed');
      });
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

  given('[case3] GITHUB_TOKEN in env', () => {
    when('[t0] GITHUB_TOKEN is set and no --auth', () => {
      then('returns token from GITHUB_TOKEN', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: undefined },
          { env: { GITHUB_TOKEN: 'env-token-456' }, shx: mockShx('') },
        );
        expect(result.token).toBe('env-token-456');
        expect(result.role).toBe('env');
      });
    });

    when('[t1] both GITHUB_TOKEN and --auth as-robot:env(VAR) set', () => {
      then('as-robot takes precedence', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:env(CUSTOM_TOKEN)' },
          {
            env: { GITHUB_TOKEN: 'env-token', CUSTOM_TOKEN: 'custom-token' },
            shx: mockShx(''),
          },
        );
        expect(result.token).toBe('custom-token');
        expect(result.role).toBe('as-robot');
      });
    });
  });

  given('[case4] --auth as-human', () => {
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
      then('throws BadRequestError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-human' },
            { env: { NODE_ENV: 'test' }, shx: mockShx('') },
          ),
        ).rejects.toThrow(BadRequestError);
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
        }
      });
    });

    when('[t3] as-human in test env (JEST_WORKER_ID set)', () => {
      then('throws BadRequestError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-human' },
            { env: { JEST_WORKER_ID: '1' }, shx: mockShx('') },
          ),
        ).rejects.toThrow(BadRequestError);
      });
    });
  });

  given('[case5] no auth detected', () => {
    when('[t0] no --auth and no GITHUB_TOKEN', () => {
      then('throws BadRequestError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: undefined },
            { env: {}, shx: mockShx('') },
          ),
        ).rejects.toThrow(BadRequestError);
      });

      then('error message includes tip', async () => {
        try {
          await getGithubTokenByAuthArg(
            { auth: undefined },
            { env: {}, shx: mockShx('') },
          );
          fail('expected error');
        } catch (error) {
          expect((error as Error).message).toContain('no auth detected');
          expect((error as Error).message).toContain('as-human');
          expect((error as Error).message).toContain('as-robot');
          expect((error as Error).message).toContain('shx');
        }
      });
    });
  });
});
