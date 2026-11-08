import { ConstraintError } from 'helpful-errors';
import { given, then, useThen, when } from 'test-fns';

import { asRadioAuthBotMiss } from './asRadioAuthBotMiss';
import { getOneGithubAuthFallback } from './getOneGithubAuthFallback';

/**
 * .what = a fake shx that answers `gh auth token` as a gh login would, or is killed
 * .why = the gh login is a remote boundary; a unit test injects it through the context seam
 */
const genFakeShx = (input: { login: string | null; killed?: boolean }) =>
  jest.fn(async (_command: string) => {
    if (input.killed)
      throw Object.assign(new Error('Command failed: gh auth token'), {
        code: null,
        killed: true,
        signal: 'SIGTERM',
      });
    return { stdout: input.login ?? '', stderr: '' };
  });

/**
 * .what = an env outside a test, so the gh login source is read
 */
const ENV_PROD = { PATH: '/usr/bin' };

const bot = asRadioAuthBotMiss({ refusal: 'upstream:401' });

describe('getOneGithubAuthFallback', () => {
  given('[case1] the box holds an ambient credential', () => {
    when('[t0] the fallback is read', () => {
      const result = useThen('it reads', async () =>
        getOneGithubAuthFallback(
          { bot },
          {
            env: { ...ENV_PROD, GITHUB_TOKEN: 'ghp_githubTokenEnv000' },
            shx: genFakeShx({ login: null }),
          },
        ),
      );

      then('it is the ambient credential, by kind', () => {
        expect(result).toEqual({
          token: 'ghp_githubTokenEnv000',
          kind: 'GITHUB_TOKEN env',
        });
      });
    });
  });

  given('[case2] the box holds no ambient credential', () => {
    when('[t0] the fallback is read', () => {
      const result = useThen('it reads', async () =>
        getOneGithubAuthFallback(
          { bot },
          { env: ENV_PROD, shx: genFakeShx({ login: null }) },
        ),
      );

      then('it is a fault that names both credentials', () => {
        const fault = 'fault' in result ? result.fault : null;
        expect(fault?.message).toContain('the ehmpath bot token');
        expect(fault?.message).toContain('the ambient credential');
        expect(fault?.message).toMatchSnapshot();
      });
    });
  });

  given('[case3] the gh login read is killed at its bound', () => {
    when('[t0] the fallback is read', () => {
      const result = useThen('it reads', async () =>
        getOneGithubAuthFallback(
          { bot },
          { env: ENV_PROD, shx: genFakeShx({ login: null, killed: true }) },
        ),
      );

      then('it is a held fault, never a throw', () => {
        // note: useThen hands back a proxy, so read the class by name
        const fault = 'fault' in result ? result.fault : null;
        expect(fault?.constructor.name).toEqual(ConstraintError.name);
        expect(fault?.message).toContain('the gh login could not be read');
      });
    });
  });
});
