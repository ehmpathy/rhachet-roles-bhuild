import { asRadioDrainLeaseMargin } from './asRadioDrainLeaseMargin';
import { asRadioDrainStepBound } from './asRadioDrainStepBound';

/**
 * .what = a fixed drain deadline: a set number of milliseconds left
 */
const genDeadlineLeft = (input: { milliseconds: number }) => ({
  getMillisecondsLeft: () => input.milliseconds,
});

const TEST_CASES = [
  {
    description: 'a step whose cap is under the time left keeps its cap',
    given: { cap: 60_000, left: 200_000 },
    expect: { milliseconds: 60_000 },
  },
  {
    description: 'a step near the deadline gets only what is left',
    given: { cap: 60_000, left: 1_200 },
    expect: { milliseconds: 1_200 },
  },
  {
    description: 'a step past the deadline gets zero, never a negative bound',
    given: { cap: 60_000, left: -50 },
    expect: { milliseconds: 0 },
  },
];

describe('asRadioDrainStepBound', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const bound = asRadioDrainStepBound({
        cap: { milliseconds: thisCase.given.cap },
        deadline: genDeadlineLeft({ milliseconds: thisCase.given.left }),
      });
      expect(bound).toEqual(thisCase.expect);
    }),
  );
});

describe('asRadioDrainLeaseMargin', () => {
  test('the default lease keeps a 60s margin', () => {
    expect(
      asRadioDrainLeaseMargin({ lease: { milliseconds: 5.5 * 60_000 } }),
    ).toEqual({ milliseconds: 60_000 });
  });
  test('a short lease keeps a quarter of itself', () => {
    expect(asRadioDrainLeaseMargin({ lease: { milliseconds: 2_000 } })).toEqual(
      { milliseconds: 500 },
    );
  });
});
