import { exec } from 'child_process';
import { promisify } from 'util';

import type { ContextGithubAuth } from '../../domain.objects/RadioContext';
import { asCurrentActor } from './asCurrentActor';

const execAsync = promisify(exec);

/**
 * .what = the longest the gh login lookup may take before git answers instead
 * .why = callers and tests derive their own bound from this worst case
 */
export const MS_GH_LOGIN_TIMEOUT = 5000;

/**
 * .what = get current git/gh user
 * .why = record who pushed/claimed task
 */
export const getCurrentActor = async (
  input: {},
  context: ContextGithubAuth,
): Promise<string> => {
  // build env with explicit token if provided
  const env = (() => {
    if (!context.github.auth.token) return undefined;
    const {
      GH_TOKEN: _removed,
      GITHUB_TOKEN: _removed2,
      ...envWithoutToken
    } = process.env;
    return { ...envWithoutToken, GH_TOKEN: context.github.auth.token };
  })();

  // ask gh for the github login; a failure means gh did not answer
  const ghLogin = await execAsync('gh api user -q .login', {
    env,
    timeout: MS_GH_LOGIN_TIMEOUT,
  }).then(
    ({ stdout }) => stdout,
    () => null,
  );

  // ask git for the local name; a failure means no git config
  const gitName = ghLogin?.trim()
    ? null
    : await execAsync('git config user.name').then(
        ({ stdout }) => stdout,
        () => null,
      );

  // pick the actor by the declared fallback order
  return asCurrentActor({ ghLogin, gitName });
};
