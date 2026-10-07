import {
  BadRequestError,
  ConstraintError,
  UnexpectedCodePathError,
} from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asRadioLiftCommand } from './asRadioLiftCommand';
import { asRadioUpstreamReason } from './asRadioUpstreamReason';
import { isRadioReplayRefusal } from './isRadioReplayRefusal';

const REASON_CASES = [
  {
    description: 'a rejected github token reads as upstream:401',
    given: {
      message:
        'github auth failed: the robot token was rejected by github (401)',
    },
    expect: { output: 'upstream:401' },
  },
  {
    description: 'a gh cli http 401 reads as upstream:401',
    given: { message: 'gh: Bad credentials (HTTP 401)' },
    expect: { output: 'upstream:401' },
  },
  {
    description:
      'a 401 that is no status (a line number) reads as upstream:fault',
    given: { message: 'unexpected token at line 401 of response' },
    expect: { output: 'upstream:fault' },
  },
  {
    description: 'a rate limit reads as upstream:rate-limit',
    given: { message: 'gh: API rate limit exceeded for installation' },
    expect: { output: 'upstream:rate-limit' },
  },
  {
    description: 'any other fault reads as upstream:fault',
    given: { message: 'connect ETIMEDOUT 140.82.112.3:443' },
    expect: { output: 'upstream:fault' },
  },
];

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

const REFUSAL_CASES = [
  {
    description: 'a stale transition is a refusal',
    given: {
      error: new BadRequestError('task already claimed by different branch'),
    },
    expect: { output: true },
  },
  {
    description: 'a rejected token is a fault, not a refusal',
    given: { error: new ConstraintError('github auth failed') },
    expect: { output: false },
  },
  {
    description: 'a malfunction is a fault, not a refusal',
    given: {
      error: new UnexpectedCodePathError('failed to parse issue number'),
    },
    expect: { output: false },
  },
  {
    description: 'a plain error is a fault, not a refusal',
    given: { error: new Error('Command failed: gh issue create') },
    expect: { output: false },
  },
];

describe('asRadioUpstreamReason', () => {
  REASON_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the upstream error is classified', () => {
        then('it yields the expected reason', () => {
          expect(asRadioUpstreamReason(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});

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

describe('isRadioReplayRefusal', () => {
  REFUSAL_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the replay error is checked', () => {
        then('it yields the expected verdict', () => {
          expect(isRadioReplayRefusal(thisCase.given)).toEqual(
            thisCase.expect.output,
          );
        });
      });
    }),
  );
});
