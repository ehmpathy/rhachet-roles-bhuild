import { getGuardSlugsAbsent } from './getGuardSlugsAbsent';

const GUARD_PRIOR = [
  'reviews:',
  '  self:',
  '    - slug: has-questioned-requirements',
  '  peer:',
  '    - slug: dimensional-decomposition',
].join('\n');

const GUARD_TEMPLATE = [
  'reviews:',
  '  self:',
  '    - slug: has-questioned-requirements',
  '    - slug: has-questioned-fulcrum-research',
  '  peer:',
  '    - slug: dimensional-decomposition',
  '    - slug: yagni-and-simplicity',
].join('\n');

const TEST_CASES = [
  {
    description: 'a guard stamped from the same template lacks no slug',
    given: { template: GUARD_TEMPLATE, extant: GUARD_TEMPLATE },
    expect: { absent: [] },
  },
  {
    description:
      'a guard stamped from a prior template lacks the new slugs, in order',
    given: { template: GUARD_TEMPLATE, extant: GUARD_PRIOR },
    expect: {
      absent: ['has-questioned-fulcrum-research', 'yagni-and-simplicity'],
    },
  },
  {
    description: 'a slug the driver added to the guard is no absence',
    given: {
      template: GUARD_PRIOR,
      extant: `${GUARD_PRIOR}\n    - slug: a-lane-the-driver-added`,
    },
    expect: { absent: [] },
  },
];

describe('getGuardSlugsAbsent', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getGuardSlugsAbsent(thisCase.given)).toEqual(
        thisCase.expect.absent,
      );
    }),
  );
});
