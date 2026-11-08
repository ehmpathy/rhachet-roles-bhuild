import { ConstraintError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asRadioAuthBotMiss } from './asRadioAuthBotMiss';
import { getKeyrackAuthFailureMessage } from './getKeyrackAuthFailureMessage';

describe('asRadioAuthBotMiss', () => {
  given('[case1] keyrack reports the bot token absent', () => {
    when('[t0] the miss is read from the derive fault', () => {
      // the fault as genAuthFromKeyrack throws it, with its class header
      const miss = asRadioAuthBotMiss({
        fault: new ConstraintError(
          getKeyrackAuthFailureMessage({
            owner: 'ehmpath',
            env: 'prep',
            key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
            status: 'absent',
          }),
        ),
      });

      then('the reason is absent', () => {
        expect(miss.reason).toEqual('absent');
      });

      then('the headline is the keyrack headline', () => {
        expect(miss.headline).toEqual(
          'github auth via keyrack failed: EHMPATH_BEAVER_GITHUB_TOKEN (status: absent)',
        );
      });

      then('the fix is the keyrack set, and never the as-human nudge', () => {
        expect(miss.fix).toEqual(
          'set the robot token: rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
        );
        expect(miss.fix).not.toContain('as-human');
      });
    });
  });

  given('[case3] keyrack holds the bot token but did not grant it', () => {
    const asFault = (input: { status: string }) =>
      new ConstraintError(
        getKeyrackAuthFailureMessage({
          owner: 'ehmpath',
          env: 'prep',
          key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
          status: input.status,
        }),
      );

    when('[t0] the token is locked', () => {
      const miss = asRadioAuthBotMiss({ fault: asFault({ status: 'locked' }) });

      then('the reason is locked, never absent', () => {
        expect(miss.reason).toEqual('locked');
      });

      then('the fix is the keyrack unlock', () => {
        expect(miss.fix).toContain('rhx keyrack unlock');
      });
    });

    when('[t1] the token is blocked', () => {
      const miss = asRadioAuthBotMiss({
        fault: asFault({ status: 'blocked' }),
      });

      then('the reason is blocked, never absent', () => {
        expect(miss.reason).toEqual('blocked');
      });

      then('the fix is the keyrack status', () => {
        expect(miss.fix).toContain('rhx keyrack status');
      });
    });

    when('[t2] keyrack names a status the radio does not know', () => {
      const miss = asRadioAuthBotMiss({
        fault: asFault({ status: 'expired' }),
      });

      then('the reason is not granted, never a guess', () => {
        expect(miss.reason).toEqual('not granted');
      });
    });
  });

  given('[case2] github refused the bot token', () => {
    when('[t0] the refusal was a 401', () => {
      const miss = asRadioAuthBotMiss({ refusal: 'upstream:401' });

      then('the reason and headline name the 401', () => {
        expect(miss.reason).toEqual('refused (401)');
        expect(miss.headline).toEqual(
          'github refused the ehmpath bot token (401)',
        );
        expect(miss.fix).toContain('rhx keyrack set');
      });
    });

    when('[t1] the refusal was a 403 write refusal', () => {
      const miss = asRadioAuthBotMiss({ refusal: 'upstream:access' });

      then('the reason and headline name the 403', () => {
        expect(miss.reason).toEqual('refused (403)');
        expect(miss.headline).toEqual(
          'github refused the ehmpath bot token (403)',
        );
      });
    });
  });
});
