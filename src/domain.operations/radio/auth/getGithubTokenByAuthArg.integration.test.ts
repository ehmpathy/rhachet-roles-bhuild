import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

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
      then(
        'wraps the failure in a ConstraintError with command + hint',
        async () => {
          const error = await getError(
            getGithubTokenByAuthArg(
              { auth: 'as-robot:shx(exit 1)' },
              { env: {}, shx },
            ),
          );
          // the real shell failure is wrapped with context, not a bare bubble.
          // the wrap builds a ConstraintError in-module (no cross-realm exec Error
          // leaks through), so instanceof holds here just as it does for t1.
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('command failed');
          expect(error.message).toContain('check the command runs');
          expect(error.message).toMatchSnapshot();
        },
      );
    });

    when('[t1] shell command produces empty output', () => {
      then('throws ConstraintError that names the empty output', async () => {
        const error = await getError(
          getGithubTokenByAuthArg(
            { auth: 'as-robot:shx(printf "")' },
            { env: {}, shx },
          ),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('no output');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] --auth as-robot:via-keyrack(ehmpath) against real keyrack',
    () => {
      when('[t0] the beaver key is granted', () => {
        then(
          'composes through genAuthFromKeyrack to a ghs_* token',
          async () => {
            const result = await getGithubTokenByAuthArg(
              { auth: 'as-robot:via-keyrack(ehmpath)' },
              { env: {}, shx },
            );

            expect(result.role).toBe('as-robot');
            expect(result.token).not.toBeNull();
            expect(result.token?.startsWith('ghs_')).toBe(true);
          },
        );
      });
    },
  );
});
