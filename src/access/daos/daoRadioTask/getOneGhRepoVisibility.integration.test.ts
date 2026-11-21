import { ConstraintError } from 'helpful-errors';
import { getError, given, then, useThen, when } from 'test-fns';

import type { ContextGithubAuth } from '../../../domain.objects/RadioContext';
import { RadioTaskRepo } from '../../../domain.objects/RadioTaskRepo';
import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';
import { getOneGhRepoVisibility } from './getOneGhRepoVisibility';
import { isGithubRepoUnreachable } from './isGithubRepoUnreachable';

/**
 * .what = the public demo repo this repo's gh tests target
 * .critical = NEVER this repo (rhachet-roles-bhuild)
 */
const GITHUB_DEMO_REPO = new RadioTaskRepo({
  owner: 'ehmpathy',
  name: 'rhachet-roles-bhuild-demo',
});

/**
 * .what = the auth context the read runs under
 * .why = the read must carry an explicit token, never the host's gh login
 */
const getContext = (input: {
  token: string | undefined;
}): ContextGithubAuth => {
  if (!input.token)
    throw new ConstraintError(
      'EHMPATH_BEAVER_GITHUB_TOKEN is required for this test; unlock it: rhx keyrack unlock --owner ehmpath --env test',
    );
  return { github: { auth: { token: input.token, role: 'as-robot' } } };
};

describe('getOneGhRepoVisibility', () => {
  given('[case1] the public demo repo, read under the test token', () => {
    when('[t0] its visibility is read', () => {
      const result = useThen('it reads', async () =>
        getOneGhRepoVisibility(
          { repo: GITHUB_DEMO_REPO },
          getContext({ token: process.env.EHMPATH_BEAVER_GITHUB_TOKEN }),
        ),
      );
      then('it reads public', () => {
        expect(result).toEqual({ visibility: 'public' });
      });
    });
  });

  given('[case2] a repo that does not exist', () => {
    when('[t0] its visibility is read', () => {
      then('the gh call fails loud, as an unreachable repo', async () => {
        const error = await getError(() =>
          getOneGhRepoVisibility(
            {
              repo: new RadioTaskRepo({
                owner: 'ehmpathy',
                name: 'rhachet-roles-bhuild-demo-absent-repo',
              }),
            },
            getContext({ token: process.env.EHMPATH_BEAVER_GITHUB_TOKEN }),
          ),
        );
        const stderr = (error as { stderr?: string }).stderr ?? ''; // duck-type: exec error
        const text = `${asExecErrorMessage({ error })}\n${stderr}`;
        expect(isGithubRepoUnreachable({ text })).toBe(true);
      });
    });
  });

  given('[case3] a token github rejects', () => {
    when('[t0] the visibility is read', () => {
      then('the gh call fails as an auth refusal', async () => {
        const error = await getError(() =>
          getOneGhRepoVisibility(
            { repo: GITHUB_DEMO_REPO },
            getContext({ token: 'ghp_rejectedTokenStub0000000000000000000' }),
          ),
        );
        expect(error).toBeInstanceOf(ConstraintError);
      });
    });
  });
});
