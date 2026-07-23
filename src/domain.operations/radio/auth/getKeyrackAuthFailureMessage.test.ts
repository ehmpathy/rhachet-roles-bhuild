import { given, then, when } from 'test-fns';

import { getKeyrackAuthFailureMessage } from './getKeyrackAuthFailureMessage';

describe('getKeyrackAuthFailureMessage', () => {
  given('[case1] a locked keyrack key', () => {
    when('[t0] the message is built', () => {
      const message = getKeyrackAuthFailureMessage({
        owner: 'ehmpath',
        env: 'prep',
        key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
        status: 'locked',
      });

      then('names the as-human unblock as the primary move', () => {
        expect(message).toContain('--auth as-human');
      });

      then(
        'names the keyrack-unlock fix (locked is sealed, not absent)',
        () => {
          expect(message).toContain(
            'rhx keyrack unlock --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
          );
        },
      );

      then('surfaces the status', () => {
        expect(message).toContain('status: locked');
      });

      then('matches snapshot', () => {
        expect(message).toMatchSnapshot();
      });
    });
  });

  given('[case2] an absent keyrack key', () => {
    when('[t0] the message is built', () => {
      const message = getKeyrackAuthFailureMessage({
        owner: 'ehmpath',
        env: 'prep',
        key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
        status: 'absent',
      });

      then('names the as-human unblock as the primary move', () => {
        expect(message).toContain('--auth as-human');
      });

      then('names the keyrack-set fix with owner/key/env', () => {
        expect(message).toContain(
          'rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
        );
      });

      then('surfaces the absent status', () => {
        expect(message).toContain('status: absent');
      });

      then('matches snapshot', () => {
        expect(message).toMatchSnapshot();
      });
    });
  });

  given('[case3] a blocked keyrack key', () => {
    when('[t0] the message is built', () => {
      const message = getKeyrackAuthFailureMessage({
        owner: 'ehmpath',
        env: 'prep',
        key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
        status: 'blocked',
      });

      then('names the as-human unblock as the primary move', () => {
        expect(message).toContain('--auth as-human');
      });

      then(
        'names the keyrack-status inspect (blocked is neither absent nor sealed)',
        () => {
          expect(message).toContain('rhx keyrack status --owner ehmpath');
        },
      );

      then('surfaces the blocked status', () => {
        expect(message).toContain('status: blocked');
      });

      then('matches snapshot', () => {
        expect(message).toMatchSnapshot();
      });
    });
  });
});
