import { given, then, when } from 'test-fns';

import { asRadioLiftCommand } from './asRadioLiftCommand';

const LIFT_CASES = [
  {
    description: 'a global block lifts globally',
    given: { level: 'global' as const, owner: 'ehmpathy' },
    expect: { output: 'rhx radio.uses --global allow' },
  },
  {
    description: 'an org block lifts via the target org',
    given: { level: 'org' as const, owner: 'sandpine' },
    expect: { output: 'rhx radio.uses --org sandpine allow' },
  },
  {
    description: 'a local block lifts locally',
    given: { level: 'local' as const, owner: 'ehmpathy' },
    expect: { output: 'rhx radio.uses allow' },
  },
  {
    description: 'the safe default lifts locally',
    given: { level: 'default' as const, owner: 'ehmpathy' },
    expect: { output: 'rhx radio.uses allow' },
  },
];

describe('asRadioLiftCommand', () => {
  LIFT_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the lift command is derived', () => {
        then('it yields the expected command', () => {
          expect(asRadioLiftCommand(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
