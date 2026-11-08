import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asRadioAuthBothFailedError } from './asRadioAuthBothFailedError';
import { asRadioAuthBotMiss } from './asRadioAuthBotMiss';
import { getKeyrackAuthFailureMessage } from './getKeyrackAuthFailureMessage';

const botAbsent = asRadioAuthBotMiss({
  fault: {
    message: getKeyrackAuthFailureMessage({
      owner: 'ehmpath',
      env: 'prep',
      key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
      status: 'absent',
    }),
  },
});

describe('asRadioAuthBothFailedError', () => {
  given('[case1] the bot token is absent, and so is the ambient', () => {
    when('[t0] the fault is built', () => {
      const error = asRadioAuthBothFailedError({
        bot: botAbsent,
        ambient: { state: 'absent' },
      });

      then('it is a caller-fix ConstraintError', () => {
        expect(error).toBeInstanceOf(ConstraintError);
      });

      then('it names both credentials, each with its fix', () => {
        expect(error.message).toContain('the ehmpath bot token');
        expect(error.message).toContain('rhx keyrack set --owner ehmpath');
        expect(error.message).toContain(
          'no GH_TOKEN env, no GITHUB_TOKEN env, no gh login',
        );
        expect(error.message).toContain('fix: gh auth login');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  given('[case2] the bot token was refused, then the ambient too', () => {
    when('[t0] the ambient was the GITHUB_TOKEN env', () => {
      const error = asRadioAuthBothFailedError({
        bot: asRadioAuthBotMiss({ refusal: 'upstream:401' }),
        ambient: { state: 'refused', kind: 'GITHUB_TOKEN env', code: '401' },
      });

      then('it names which ambient source github refused', () => {
        expect(error.message).toContain(
          'github refused the ehmpath bot token (401)',
        );
        expect(error.message).toContain(
          'github refused the GITHUB_TOKEN env (401)',
        );
        expect(error.message).toContain(
          'check the token in GITHUB_TOKEN: its scopes and expiry',
        );
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] the ambient was the gh login', () => {
      const error = asRadioAuthBothFailedError({
        bot: asRadioAuthBotMiss({ refusal: 'upstream:access' }),
        ambient: { state: 'refused', kind: 'gh login', code: '403' },
      });

      then('the ambient fix is a fresh gh login', () => {
        expect(error.message).toContain('github refused the gh login (403)');
        expect(error.message).toContain('fix: gh auth login');
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
