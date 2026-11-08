import { ConstraintError } from 'helpful-errors';

import { asExecErrorMessage } from '@src/infra/shell/asExecErrorMessage';
import { isExecExitError } from '@src/infra/shell/isExecExitError';

import { isGithubAuthTestEnv } from './isGithubAuthTestEnv';
import type { GithubAuthAmbientKind } from './RadioAuthFallback';

/**
 * .what = the ambient github credential of this box, first present wins, or null
 * .why = the default auth falls back to it when the ehmpath bot token is absent or refused
 *
 * .note = the order is gh's own: GH_TOKEN env → GITHUB_TOKEN env → the gh login
 * .note = the gh login is read with the env tokens stripped, so it names the stored login
 *         alone; a non-zero exit or an empty stdout reads as no login
 * .note = the gh login is never read in a test env (as --auth as-human), so a test never
 *         sends under a developer's own login; the env sources come from context.env
 */
export const getOneGithubAuthAmbient = async (
  _input: Record<string, never>,
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<{ token: string; kind: GithubAuthAmbientKind } | null> => {
  // the env tokens, in gh's own order
  const tokenGh = context.env.GH_TOKEN?.trim();
  if (tokenGh) return { token: tokenGh, kind: 'GH_TOKEN env' };
  const tokenGithub = context.env.GITHUB_TOKEN?.trim();
  if (tokenGithub) return { token: tokenGithub, kind: 'GITHUB_TOKEN env' };

  // a test never reads the gh login
  if (isGithubAuthTestEnv({ env: context.env })) return null;

  // the stored gh login; a call that exits non-zero means no login. any other fault
  // (a kill at its bound, a spawn fault) is no answer, so it holds the record, named
  const login = await context
    .shx('env -u GH_TOKEN -u GITHUB_TOKEN gh auth token')
    .catch((error: unknown) => {
      if (isExecExitError({ error })) return null;
      throw new ConstraintError(
        `the gh login could not be read: ${asExecErrorMessage({ error }).trim()}`,
        { hint: 'check `gh auth token` returns promptly on this box' },
      );
    });
  const tokenLogin = login?.stdout.trim();
  if (!tokenLogin) return null;
  return { token: tokenLogin, kind: 'gh login' };
};
