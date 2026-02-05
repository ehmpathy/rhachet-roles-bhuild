import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { shx } from '@src/infra/shell/shx';

import { getGithubTokenByAuthArg } from './getGithubTokenByAuthArg';

/**
 * .what = integration tests for getGithubTokenByAuthArg with real shell
 * .why = validates shx pattern works with actual shell commands
 */
describe('getGithubTokenByAuthArg.integration', () => {
  given('[case1] --auth as-robot:shx(echo token)', () => {
    when('[t0] shell command outputs token', () => {
      then('returns token from command output', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:shx(echo secret-from-echo)' },
          { env: {}, shx },
        );
        expect(result.token).toBe('secret-from-echo');
        expect(result.role).toBe('as-robot');
      });
    });

    when('[t1] shell command with pipe', () => {
      then('returns token from piped output', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:shx(echo piped-token | tr -d "\\n")' },
          { env: {}, shx },
        );
        expect(result.token).toBe('piped-token');
        expect(result.role).toBe('as-robot');
      });
    });

    when('[t2] shell command with env var expansion', () => {
      then('returns token from env-aware command', async () => {
        const result = await getGithubTokenByAuthArg(
          { auth: 'as-robot:shx(printf "%s" "env-token")' },
          { env: {}, shx },
        );
        expect(result.token).toBe('env-token');
        expect(result.role).toBe('as-robot');
      });
    });
  });

  given('[case2] --auth as-robot:shx(command) with failures', () => {
    when('[t0] shell command fails', () => {
      then('propagates the error', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:shx(exit 1)' },
            { env: {}, shx },
          ),
        ).rejects.toThrow();
      });
    });

    when('[t1] shell command produces empty output', () => {
      then('throws BadRequestError', async () => {
        await expect(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:shx(printf "")' },
            { env: {}, shx },
          ),
        ).rejects.toThrow(BadRequestError);
      });
    });
  });
});
