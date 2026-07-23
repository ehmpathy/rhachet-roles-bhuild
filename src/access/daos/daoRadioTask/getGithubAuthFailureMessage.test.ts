import { given, then, when } from 'test-fns';

import { getGithubAuthFailureMessage } from './getGithubAuthFailureMessage';

describe('getGithubAuthFailureMessage', () => {
  given('[case1] role = as-robot (robot token rejected)', () => {
    when('[t0] the message is built', () => {
      const message = getGithubAuthFailureMessage({ role: 'as-robot' });

      then('names the as-human unblock as the primary move', () => {
        expect(message).toContain('--auth as-human');
      });

      then(
        'does NOT name a keyrack-specific fix (token may be env or shx)',
        () => {
          expect(message).not.toContain('rhx keyrack set');
        },
      );

      then('does NOT loop to gh auth login (that is the as-human path)', () => {
        expect(message).not.toContain('gh auth login');
      });

      then('matches snapshot', () => {
        expect(message).toMatchSnapshot();
      });
    });
  });

  given('[case2] role = as-human (gh session unauthenticated)', () => {
    when('[t0] the message is built', () => {
      const message = getGithubAuthFailureMessage({ role: 'as-human' });

      then('advises gh auth login (the gh-native session fix)', () => {
        expect(message).toContain('gh auth login');
      });

      then('does NOT loop back to as-human', () => {
        expect(message).not.toContain('--auth as-human');
      });

      then('matches snapshot', () => {
        expect(message).toMatchSnapshot();
      });
    });
  });
});
