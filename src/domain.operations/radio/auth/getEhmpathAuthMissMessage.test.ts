import { given, then, when } from 'test-fns';

import { getEhmpathAuthMissMessage } from './getEhmpathAuthMissMessage';

describe('getEhmpathAuthMissMessage', () => {
  given('[case1] both spots missed, each with a fix', () => {
    when('[t0] the message renders', () => {
      const message = getEhmpathAuthMissMessage({
        auth: 'as-ehmpath',
        misses: [
          {
            row: 'keyrack: not granted (status: locked)',
            fix: 'unlock the robot token: rhx keyrack unlock --owner ehmpath --key K --env prep',
          },
          {
            row: 'ambient: ehmpath email, but gh holds no login',
            fix: 'log gh in as the ehmpath account: gh auth login',
          },
        ],
      });
      then('it names each spot checked', () => {
        expect(message).toContain('keyrack: not granted (status: locked)');
        expect(message).toContain(
          'ambient: ehmpath email, but gh holds no login',
        );
      });
      then('as-human is the last fix, offered as an alternative', () => {
        expect(message.trimEnd().split('\n').at(-1)).toContain(
          'or send as yourself, on purpose: --auth as-human',
        );
      });
      then('it matches the snapshot', () => {
        expect(message).toMatchSnapshot();
      });
    });
  });

  given('[case2] the one spot checked has no fix of its own', () => {
    when('[t0] the message renders', () => {
      const message = getEhmpathAuthMissMessage({
        auth: 'as-ehmpath-via-ambient',
        misses: [
          {
            row: 'ambient: git config user.email = bert@example.com, not an ehmpath email',
            fix: null,
          },
        ],
      });
      then('as-human stands alone, with no lone "or"', () => {
        expect(message).toContain(
          '└─ send as yourself, on purpose: --auth as-human',
        );
        expect(message).not.toContain('─ or ');
      });
      then('it matches the snapshot', () => {
        expect(message).toMatchSnapshot();
      });
    });
  });
});
