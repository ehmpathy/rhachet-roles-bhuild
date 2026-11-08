import { given, then, when } from 'test-fns';

import { asRadioFaultMessageUnderFallback } from './asRadioFaultMessageUnderFallback';

describe('asRadioFaultMessageUnderFallback', () => {
  given('[case1] a fault sent under the ambient credential', () => {
    when('[t0] the message is read', () => {
      then('it leads with the kind and why the bot token missed', () => {
        expect(
          asRadioFaultMessageUnderFallback({
            message: 'the repo could not be seen\nmore',
            sentUnder: {
              kind: 'GITHUB_TOKEN env',
              bot: { reason: 'absent', headline: 'h', fix: 'f' },
            },
          }),
        ).toEqual(
          'sent via the GITHUB_TOKEN env (the ehmpath bot token was absent): the repo could not be seen\nmore',
        );
      });
    });
  });

  given('[case2] a fault under the bot token or a chosen auth', () => {
    when('[t0] the message is read', () => {
      then('it is the message as is', () => {
        expect(
          asRadioFaultMessageUnderFallback({ message: 'm', sentUnder: null }),
        ).toEqual('m');
      });
    });
  });
});
