import { given, then, when } from 'test-fns';

import { asRadioPromiseHoldDetail } from './asRadioPromiseHoldDetail';
import type { RadioPromiseHoldReason } from './RadioPromiseHoldReason';

const TEST_CASES: {
  reason: RadioPromiseHoldReason;
  cause: string | null;
  expect: string;
}[] = [
  {
    reason: 'public-repo:unpromised',
    cause: null,
    expect: 'public repo, no anonymized promise on this record',
  },
  {
    reason: 'public-repo:unreadable',
    cause: 'visibility json unparsable',
    expect:
      'visibility unreadable — treated as public\ncause: visibility json unparsable',
  },
  {
    reason: 'public-repo:unreadable-auth',
    cause: 'github auth failed',
    expect:
      'visibility unreadable on this auth — try as-human\ncause: github auth failed',
  },
  {
    reason: 'public-repo:unreadable-auth',
    cause:
      '✋ ConstraintError: github auth failed: the robot token was rejected by github (401)',
    expect:
      'visibility unreadable on this auth — try as-human\ncause: github auth failed: the robot token was rejected by github (401)',
  },
  {
    reason: 'public-repo:unreadable',
    cause: '💥 MalfunctionError: visibility json unparsable',
    expect:
      'visibility unreadable — treated as public\ncause: visibility json unparsable',
  },
  {
    reason: 'public-repo:unreadable',
    cause: null,
    expect: 'visibility unreadable — treated as public',
  },
];

describe('asRadioPromiseHoldDetail', () => {
  TEST_CASES.map((thisCase, index) =>
    given(
      `[case${index + 1}] ${thisCase.reason}, cause ${String(thisCase.cause)}`,
      () => {
        when('[t0] the detail is rendered', () => {
          then(
            'it reads the claim, with the cause on its own line when known',
            () => {
              const detail = asRadioPromiseHoldDetail(thisCase);
              expect(detail).toEqual(thisCase.expect);
              expect(detail).not.toContain('()');
            },
          );

          then('the claim line holds no parens, so no label nests them', () => {
            const claim = asRadioPromiseHoldDetail(thisCase).split('\n')[0]!;
            expect(claim).not.toMatch(/[()]/);
          });
        });
      },
    ),
  );
});
