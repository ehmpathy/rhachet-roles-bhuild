import { given, then, when } from 'test-fns';

import { asRadioAuthBotMissWhy } from './asRadioAuthBotMissWhy';
import type { RadioAuthBotMiss } from './RadioAuthFallback';

const FIX =
  'rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep';

const TEST_CASES: {
  description: string;
  given: { bot: RadioAuthBotMiss };
  expect: { output: string };
}[] = [
  {
    description: 'a 401 refusal reads as its own headline',
    given: {
      bot: {
        reason: 'refused (401)',
        headline: 'github refused the ehmpath bot token (401)',
        fix: FIX,
      },
    },
    expect: { output: 'github refused the ehmpath bot token (401)' },
  },
  {
    description: 'a 403 refusal reads as its own headline',
    given: {
      bot: {
        reason: 'refused (403)',
        headline: 'github refused the ehmpath bot token (403)',
        fix: FIX,
      },
    },
    expect: { output: 'github refused the ehmpath bot token (403)' },
  },
  {
    description:
      'an absent token names its keyrack status, never the keyrack text',
    given: {
      bot: {
        reason: 'absent',
        headline:
          'github auth via keyrack failed: EHMPATH_BEAVER_GITHUB_TOKEN (status: absent)',
        fix: FIX,
      },
    },
    expect: { output: 'the ehmpath bot token was absent' },
  },
  {
    description: 'a token not granted names that status',
    given: {
      bot: {
        reason: 'not granted',
        headline: 'keyrack: not granted',
        fix: FIX,
      },
    },
    expect: { output: 'the ehmpath bot token was not granted' },
  },
];

describe('asRadioAuthBotMissWhy', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the miss is read', () => {
        then('it yields the expected clause', () => {
          expect(asRadioAuthBotMissWhy(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
