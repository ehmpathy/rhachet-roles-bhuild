import { ConstraintError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { shx } from '../../../infra/shell/shx';
import { genAuthFromKeyrack } from './genAuthFromKeyrack';

describe('genAuthFromKeyrack.integration', () => {
  given('[case1] keyrack with unlocked credentials', () => {
    when('[t0] get EHMPATH_BEAVER_GITHUB_TOKEN', () => {
      then('returns an ephemeral ghs_* token', async () => {
        const result = await genAuthFromKeyrack(
          {
            owner: 'ehmpath',
            env: 'test',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          },
          { shx },
        );

        expect(result.token).toBeDefined();
        expect(result.token.startsWith('ghs_')).toBe(true);
      });
    });
  });

  given('[case2] a key that was never set', () => {
    when('[t0] get a bogus key name (real keyrack returns absent)', () => {
      then('throws a ConstraintError that names the set-key fix', async () => {
        const error = await getError(
          genAuthFromKeyrack(
            {
              owner: 'ehmpath',
              env: 'test',
              key: 'EHMPATH_BOGUS_KEY_THAT_DOES_NOT_EXIST',
            },
            { shx },
          ),
        );

        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('rhx keyrack set');
        expect(error.message).toContain(
          'EHMPATH_BOGUS_KEY_THAT_DOES_NOT_EXIST',
        );
        // lock the exact user-faced message so drift is caught in review
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
