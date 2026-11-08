import { ConstraintError } from 'helpful-errors';
import { getError, given, then, useThen, when } from 'test-fns';

import { getOneGithubAuthAmbient } from './getOneGithubAuthAmbient';

/**
 * .what = a fake shx that answers `gh auth token` as a gh login would
 * .why = the gh login is a remote boundary; a unit test injects it through the context seam
 */
const genFakeShx = (input: {
  login: string | null;
  fails?: 'exit' | 'killed';
}) =>
  jest.fn(async (_command: string) => {
    // an exec rejection: an exit carries a numeric code; a kill at its bound carries none
    if (input.fails === 'exit')
      throw Object.assign(new Error('gh: not logged in to any hosts'), {
        code: 1,
      });
    if (input.fails === 'killed')
      throw Object.assign(new Error('Command failed: gh auth token'), {
        code: null,
        killed: true,
        signal: 'SIGTERM',
      });
    return { stdout: input.login ?? '', stderr: '' };
  });

/**
 * .what = an env outside a test, so the gh login source is read
 * .why = the derive skips the gh login inside a test env, by design
 */
const ENV_PROD = { PATH: '/usr/bin' };

/**
 * .what = derive the ambient credential, wrapped so a null result survives useThen
 * .why = useThen hands back a proxy of its value, which cannot be null
 */
const derive = async (
  context: Parameters<typeof getOneGithubAuthAmbient>[1],
): Promise<{
  ambient: Awaited<ReturnType<typeof getOneGithubAuthAmbient>>;
}> => ({ ambient: await getOneGithubAuthAmbient({}, context) });

describe('getOneGithubAuthAmbient', () => {
  given('[case1] GH_TOKEN and GITHUB_TOKEN are both set', () => {
    when('[t0] the ambient credential is derived', () => {
      const shx = genFakeShx({ login: 'gho_loginToken000' });
      const result = useThen('it derives', async () =>
        derive({
          env: {
            ...ENV_PROD,
            GH_TOKEN: 'ghp_ghTokenEnv000',
            GITHUB_TOKEN: 'ghp_githubTokenEnv000',
          },
          shx,
        }),
      );

      then('GH_TOKEN wins, as gh itself reads it', () => {
        expect(result.ambient).toEqual({
          token: 'ghp_ghTokenEnv000',
          kind: 'GH_TOKEN env',
        });
      });

      then('the gh login is never read', () => {
        expect(shx).not.toHaveBeenCalled();
      });
    });
  });

  given('[case2] only GITHUB_TOKEN is set', () => {
    when('[t0] the ambient credential is derived', () => {
      const result = useThen('it derives', async () =>
        derive({
          env: { ...ENV_PROD, GITHUB_TOKEN: 'ghp_githubTokenEnv000' },
          shx: genFakeShx({ login: 'gho_loginToken000' }),
        }),
      );

      then('GITHUB_TOKEN is used', () => {
        expect(result.ambient).toEqual({
          token: 'ghp_githubTokenEnv000',
          kind: 'GITHUB_TOKEN env',
        });
      });
    });
  });

  given('[case3] no env token, and gh holds a login', () => {
    when('[t0] the ambient credential is derived outside a test env', () => {
      const shx = genFakeShx({ login: 'gho_loginToken000\n' });
      const result = useThen('it derives', async () =>
        derive({ env: ENV_PROD, shx }),
      );

      then('the gh login is used, trimmed', () => {
        expect(result.ambient).toEqual({
          token: 'gho_loginToken000',
          kind: 'gh login',
        });
      });

      then('the login is read with the env tokens stripped', () => {
        expect(shx).toHaveBeenCalledWith(
          'env -u GH_TOKEN -u GITHUB_TOKEN gh auth token',
        );
      });
    });

    when('[t1] the ambient credential is derived inside a test env', () => {
      const shx = genFakeShx({ login: 'gho_loginToken000' });
      const result = useThen('it derives', async () =>
        derive({ env: { NODE_ENV: 'test' }, shx }),
      );

      then('no credential is found: a test never sends under a login', () => {
        expect(result.ambient).toEqual(null);
        expect(shx).not.toHaveBeenCalled();
      });
    });
  });

  given('[case4] no env token, and gh holds no login', () => {
    when('[t0] `gh auth token` exits non-zero', () => {
      const result = useThen('it derives', async () =>
        derive({
          env: ENV_PROD,
          shx: genFakeShx({ login: null, fails: 'exit' }),
        }),
      );

      then('no credential is found', () => {
        expect(result.ambient).toEqual(null);
      });
    });

    when('[t1] `gh auth token` prints no output', () => {
      const result = useThen('it derives', async () =>
        derive({ env: ENV_PROD, shx: genFakeShx({ login: '  \n' }) }),
      );

      then('no credential is found', () => {
        expect(result.ambient).toEqual(null);
      });
    });

    when('[t2] `gh auth token` is killed at its bound', () => {
      // wrapped, since useThen hands back a proxy that breaks instanceof
      const result = useThen('it fails', async () => ({
        error: await getError(
          getOneGithubAuthAmbient(
            {},
            {
              env: ENV_PROD,
              shx: genFakeShx({ login: null, fails: 'killed' }),
            },
          ),
        ),
      }));

      then('it fails loud, never reads as no login', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error.message).toContain(
          'the gh login could not be read',
        );
        expect(result.error.message).toMatchSnapshot();
      });
    });
  });

  given('[case5] an env token that is blank', () => {
    when('[t0] the ambient credential is derived', () => {
      const result = useThen('it derives', async () =>
        derive({
          env: {
            ...ENV_PROD,
            GH_TOKEN: ' ',
            GITHUB_TOKEN: 'ghp_githubTokenEnv000',
          },
          shx: genFakeShx({ login: null }),
        }),
      );

      then('the blank one is skipped', () => {
        expect(result.ambient?.kind).toEqual('GITHUB_TOKEN env');
      });
    });
  });
});
